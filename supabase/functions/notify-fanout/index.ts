// notify-fanout — invoked by a database webhook on INSERT into v2_notifications.
// Fans a notification out to email (Resend) and/or SMS (Twilio), gated on the
// recipient's consent flags in auth.users metadata (notify_email / notify_sms).
// In-app notification rows always exist regardless; this function only handles
// the external channels, so missing secrets degrade gracefully to in-app only.
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const row = payload.record ?? payload; // db webhook wraps the row in `record`
    if (!row?.recipient_id) return new Response("ok");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userRes } = await admin.auth.admin.getUserById(row.recipient_id);
    const user = userRes?.user;
    if (!user) return new Response("ok");

    const meta = user.user_metadata ?? {};
    const { data: profile } = await admin
      .from("v2_profiles").select("phone, display_name").eq("id", row.recipient_id).single();

    const jobs: Promise<unknown>[] = [];

    // Email via Resend — only with explicit consent.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && meta.notify_email === true && user.email) {
      jobs.push(fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: Deno.env.get("NOTIFY_FROM_EMAIL") ?? "VRCC <notify@vrcc.app>",
          to: user.email,
          subject: row.title,
          text: `${row.body}\n\nOpen VRCC: ${Deno.env.get("APP_URL") ?? "https://vrcc.app"}${row.link_path ?? ""}`,
        }),
      }));
    }

    // SMS via Twilio — only with explicit consent and a phone on file.
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");
    if (twilioSid && twilioToken && twilioFrom && meta.notify_sms === true && profile?.phone) {
      jobs.push(fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: profile.phone,
            Body: `VRCC: ${row.title} — ${row.body}`,
          }),
        },
      ));
    }

    await Promise.allSettled(jobs);
    return new Response("ok");
  } catch (err) {
    // Never fail the webhook hard — in-app delivery already happened.
    console.error("notify-fanout error:", err);
    return new Response("ok");
  }
});
