// lead-intake — canonical website-lead receiver (launch architecture).
//
// Successor to the legacy pipeline (Wix → anon PostgREST insert into public.wix_contact_submissions
// → trigger → notify-new-lead). The legacy table granted `anon` full DML; this function is the ONLY
// write path for canonical leads:
//
//   Wix automation (POST, shared secret) → validate → recoveryos.leads (service role)
//     → DB trigger emits in-app staff notifications (canonical, deduped)
//     → optional staff email via Resend IFF secrets are configured (participant-facing
//       external delivery remains OFF; this is an internal staff alert only).
//
// Required secrets:
//   LEAD_INTAKE_SECRET   shared secret the Wix automation must send as `x-lead-secret` header
// Optional secrets (staff email alert; omit to disable email entirely):
//   RESEND_API_KEY, RESEND_FROM, LEAD_ALERT_TO (comma-separated staff addresses)
//
// Payload (JSON, all fields optional strings unless noted):
//   { first_name, last_name, email, phone, message, interest, readiness, source }
// Legacy Wix field names (pathway_interest) are accepted and mapped.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTAKE_SECRET = Deno.env.get("LEAD_INTAKE_SECRET") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "";
const LEAD_ALERT_TO = (Deno.env.get("LEAD_ALERT_TO") ?? "").split(",").map(s => s.trim()).filter(Boolean);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : null);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405);
  if (!INTAKE_SECRET) return json({ ok: false, code: "intake_disabled" }, 503);
  if (req.headers.get("x-lead-secret") !== INTAKE_SECRET) {
    return json({ ok: false, code: "forbidden" }, 403);
  }

  let p: Record<string, unknown>;
  try { p = await req.json(); } catch { return json({ ok: false, code: "bad_json" }, 400); }

  const lead = {
    first_name: clip(p.first_name, 120),
    last_name: clip(p.last_name, 120),
    email: clip(p.email, 320),
    phone: clip(p.phone, 40),
    message: clip(p.message, 4000),
    interest: clip(p.interest ?? p.pathway_interest, 200),
    readiness: clip(p.readiness, 200),
    source: clip(p.source, 60) ?? "website",
  };
  if (!lead.email && !lead.phone && !lead.message) {
    return json({ ok: false, code: "empty_lead" }, 400);
  }

  const admin = createClient(SB_URL, SERVICE_KEY, { db: { schema: "recoveryos" } });
  const { data, error } = await admin.from("leads").insert(lead).select("id").single();
  if (error) return json({ ok: false, code: "insert_error", message: error.message }, 500);

  // Optional internal staff email alert (never participant-facing).
  if (RESEND_API_KEY && RESEND_FROM && LEAD_ALERT_TO.length > 0) {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || lead.email || "Someone";
    const rows: [string, unknown][] = [
      ["Name", name], ["Email", lead.email], ["Phone", lead.phone],
      ["Interested in", lead.interest], ["Where they are", lead.readiness], ["Message", lead.message],
    ];
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 4px">New website lead</h2>
      <table style="border-collapse:collapse">${rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:4px 10px;color:#666;white-space:nowrap">${esc(k)}</td><td style="padding:4px 10px">${esc(v)}</td></tr>`)
        .join("")}</table>
      <p style="color:#666;font-size:12px">Follow up in the RecoveryOS admin lead queue.</p></div>`;
    // Fire-and-forget; email failure must not fail the intake.
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM, to: LEAD_ALERT_TO, subject: `New website lead: ${name}`, html }),
    }).catch(() => {});
  }

  return json({ ok: true, code: "received", lead_id: data.id });
});
