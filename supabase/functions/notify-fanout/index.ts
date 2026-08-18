// notify-fanout — HARDENED (P1-E). Invoked by a database webhook on INSERT into
// v2_notifications; fans a notification out to email (Resend) and/or SMS (Twilio).
//
// Security model (fail-closed):
//   1. Shared-secret gate. The caller MUST present `x-webhook-secret` equal to the
//      NOTIFY_WEBHOOK_SECRET function secret. If that secret is not configured, or
//      the header is missing/wrong, NO external send happens (in-app already
//      exists). An unsigned/forged call can never trigger email or SMS.
//   2. Payload schema validation. The record must carry id + recipient_id + title
//      + body; malformed payloads are rejected.
//   3. Per-channel idempotency + audit. Every attempt is recorded in
//      v2_notification_deliveries with a UNIQUE(notification_id, channel); a
//      duplicate webhook delivery is a no-op.
//   4. Consent gate (unchanged): external channels require the recipient's
//      notify_email / notify_sms metadata flag to be explicitly true.
//   5. Safe failure — never throws; records 'failed' and returns 200 so the
//      webhook is not retried into a storm.
//
// External channels stay OFF until BOTH NOTIFY_WEBHOOK_SECRET and the relevant
// provider secrets are configured AND a webhook is wired with the secret header
// (see supabase/functions/README.md).
import { createClient } from "jsr:@supabase/supabase-js@2";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

Deno.serve(async (req) => {
  // 1. Shared-secret gate — fail closed.
  const expected = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  const presented = req.headers.get("x-webhook-secret");
  const verified = !!expected && !!presented && timingSafeEqual(expected, presented);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  // 2. Payload schema validation.
  const row = (payload.record ?? payload) as Record<string, unknown>;
  const id = row?.id as string | undefined;
  const recipientId = row?.recipient_id as string | undefined;
  const title = row?.title as string | undefined;
  const bodyText = row?.body as string | undefined;
  if (!id || !recipientId || typeof title !== "string" || typeof bodyText !== "string") {
    return new Response(JSON.stringify({ error: "malformed notification" }), { status: 400 });
  }

  // If the call is not verified, in-app already happened — do nothing external.
  if (!verified) {
    return new Response(JSON.stringify({ ok: true, external: "skipped_unverified" }), { status: 200 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Idempotency: claim each channel row before sending; UNIQUE constraint makes a
  // duplicate webhook a no-op.
  async function claimChannel(channel: "email" | "sms"): Promise<boolean> {
    const { error } = await admin.from("v2_notification_deliveries")
      .insert({ notification_id: id, channel, status: "sent" });
    // 23505 = already delivered for this (notification, channel).
    return !error;
  }
  async function markFailed(channel: "email" | "sms", detail: string) {
    await admin.from("v2_notification_deliveries")
      .update({ status: "failed", detail }).eq("notification_id", id).eq("channel", channel);
  }

  try {
    const { data: userRes } = await admin.auth.admin.getUserById(recipientId);
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ ok: true, external: "no_user" }), { status: 200 });

    const meta = user.user_metadata ?? {};
    const { data: profile } = await admin
      .from("v2_profiles").select("phone").eq("id", recipientId).single();

    const link = (row.link_path as string) ?? "";
    const jobs: Promise<unknown>[] = [];

    // Email via Resend — consent-gated, idempotent, audited.
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && meta.notify_email === true && user.email) {
      if (await claimChannel("email")) {
        jobs.push(
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: Deno.env.get("NOTIFY_FROM_EMAIL") ?? "VRCC <notify@vrcc.app>",
              to: user.email,
              subject: title,
              text: `${bodyText}\n\nOpen VRCC: ${Deno.env.get("APP_URL") ?? "https://vrcc.app"}${link}`,
            }),
          }).then((r) => { if (!r.ok) return markFailed("email", `resend ${r.status}`); })
            .catch((e) => markFailed("email", String(e))),
        );
      }
    }

    // SMS via Twilio — consent-gated, idempotent, audited.
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");
    if (twilioSid && twilioToken && twilioFrom && meta.notify_sms === true && profile?.phone) {
      if (await claimChannel("sms")) {
        jobs.push(
          fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ From: twilioFrom, To: profile.phone, Body: `VRCC: ${title} — ${bodyText}` }),
          }).then((r) => { if (!r.ok) return markFailed("sms", `twilio ${r.status}`); })
            .catch((e) => markFailed("sms", String(e))),
        );
      }
    }

    await Promise.allSettled(jobs);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("notify-fanout error:", err);
    return new Response(JSON.stringify({ ok: true, external: "error" }), { status: 200 });
  }
});
