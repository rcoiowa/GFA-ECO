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
//   { first_name, last_name, email, phone, message, interest, readiness, source,
//     submission_id, submitted_at, organization_inquiry, residence_interest }
// Legacy Wix field names (pathway_interest) are accepted and mapped.
//
// 0147 additions (REPO-PREPARED — redeploy this function only AFTER migration 0147 is
// applied, since it writes the new columns):
//   submission_id      stable Wix submission id -> idempotency (duplicate POSTs return
//                      the existing lead instead of creating a second record)
//   submitted_at       source timestamp from Wix
//   organization_inquiry  true = partnership/outside-organization request (priority)
//   residence_interest    EXPLICIT self-selected pathway only: 'grace_house' | 'ejwrh'.
//                      Anything else stored as 'unspecified' (coordinator confirm-route).
//                      Never inferred from names or message text.

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

  // Residence interest is honored ONLY as an explicit self-selected value.
  const rawInterestPath = clip(p.residence_interest, 40);
  const residence_interest =
    rawInterestPath === "grace_house" || rawInterestPath === "ejwrh"
      ? rawInterestPath
      : "unspecified";
  const organization_inquiry = p.organization_inquiry === true || p.organization_inquiry === "true";
  const submittedAtRaw = clip(p.submitted_at, 40);
  const submitted_at =
    submittedAtRaw && !Number.isNaN(Date.parse(submittedAtRaw))
      ? new Date(submittedAtRaw).toISOString()
      : null;

  const lead = {
    first_name: clip(p.first_name, 120),
    last_name: clip(p.last_name, 120),
    email: clip(p.email, 320),
    phone: clip(p.phone, 40),
    message: clip(p.message, 4000),
    interest: clip(p.interest ?? p.pathway_interest, 200),
    readiness: clip(p.readiness, 200),
    source: clip(p.source, 60) ?? "website",
    wix_submission_id: clip(p.submission_id, 120),
    submitted_at,
    organization_inquiry,
    residence_interest,
    // response_due_at is deliberately NOT written (ratified 2026-09-05, decision 3):
    // business-time targets govern operationally, but automated deadline computation is
    // deferred until GFA's operating calendar is ratified. The queue surfaces age since
    // receipt; nothing fabricates an overdue determination from assumed hours.
  };
  if (!lead.email && !lead.phone && !lead.message) {
    return json({ ok: false, code: "empty_lead" }, 400);
  }

  const admin = createClient(SB_URL, SERVICE_KEY, { db: { schema: "recoveryos" } });

  // Idempotency: a repeated Wix submission returns the existing record — one inquiry,
  // one thread, never a disconnected duplicate.
  if (lead.wix_submission_id) {
    const { data: existing } = await admin
      .from("leads")
      .select("id")
      .eq("wix_submission_id", lead.wix_submission_id)
      .maybeSingle();
    if (existing) return json({ ok: true, code: "duplicate_submission", id: existing.id }, 200);
  }

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
