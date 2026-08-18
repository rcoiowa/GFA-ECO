// grace-coaching-canary — P3C-B3 canary / staging canonical write consumer.
//
// PURPOSE: prove the canonical coaching write path end-to-end over authenticated HTTP —
// the workflows DB tests cannot exercise (real JWT -> RLS -> current_person_id -> RPC) —
// WITHOUT touching the production Grace Coaching surface and WITHOUT flipping production
// write authority. It calls the same canonical SECURITY DEFINER RPCs the future Coach
// Workspace will use, under the caller's JWT, and returns raw JSON envelopes for assertion.
//
// SECURITY (P3C-B §24/§25) — this must NOT become an alternate production entrance:
//   * CANARY_ENABLED must be exactly "true" (env), else 503 — off by default.
//   * The caller's JWT `sub` must be in CANARY_ALLOWED_SUBS (comma-separated) — test/fixture
//     identities only. Any other authenticated user is rejected 403. Obscurity is not relied on.
//   * No service-role key is used: every action runs under the caller's JWT, so RLS and
//     canonical authority apply exactly as in production. The canary cannot exceed the caller.
//   * It never sends external email/SMS. In-app canonical state only.
//
// Deploy: supabase functions deploy grace-coaching-canary  (set the two env vars first).
// Drive it with ./harness.ts from an HTTP-capable environment (see README.md).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const ENABLED = Deno.env.get("CANARY_ENABLED") === "true";
const ALLOWED = new Set((Deno.env.get("CANARY_ALLOWED_SUBS") ?? "").split(",").map((s) => s.trim()).filter(Boolean));

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Dispatch table: action -> canonical write. Each runs under the caller's JWT client.
type Client = ReturnType<typeof createClient>;
const ACTIONS: Record<string, (sb: Client, p: Record<string, unknown>) => Promise<unknown>> = {
  async assignParticipantCoach(sb, p) {
    return rpc(sb, "assign_participant_coach", {
      p_participant_person_id: p.participantPersonId, p_coach_person_id: p.coachPersonId, p_reason: p.reason ?? null,
    });
  },
  async claimSupportRequest(sb, p) {
    return rpc(sb, "claim_support_request", { p_support_request_id: p.supportRequestId });
  },
  async createSupportRequest(sb, p) {
    // RLS-guarded direct insert: person_id must be the caller, status pinned open.
    const { data, error } = await sb.from("support_requests").insert({
      person_id: p.personId, request_type: p.requestType, focus: p.focus ?? null,
      preferred_modality: p.preferredModality ?? "video", status: "open", organization_id: 1, program_id: 1,
    }).select("id").single();
    return error ? { ok: false, code: "insert_error", message: error.message } : { ok: true, code: "created", ...data };
  },
  async createBookingRequest(sb, p) {
    return rpc(sb, "create_booking_request", {
      p_participant_person_id: p.participantPersonId, p_provider_person_id: p.providerPersonId,
      p_support_request_id: p.supportRequestId ?? null, p_service_type_id: p.serviceTypeId ?? 1,
      p_modality: p.modality ?? "video", p_duration_minutes: p.durationMinutes ?? 50,
      p_note: p.note ?? null, p_starts: p.proposedStarts,
    });
  },
  async proposeBookingTimes(sb, p) {
    return rpc(sb, "propose_booking_times", { p_booking_request_id: p.bookingRequestId, p_starts: p.starts });
  },
  async counterProposeBookingTimes(sb, p) {
    return rpc(sb, "counter_propose_booking_times", { p_booking_request_id: p.bookingRequestId, p_starts: p.starts });
  },
  async acceptBookingProposal(sb, p) {
    return rpc(sb, "accept_booking_proposal", { p_proposal_id: p.proposalId });
  },
  async cancelBooking(sb, p) {
    return rpc(sb, "cancel_booking", { p_booking_request_id: p.bookingRequestId, p_reason: p.reason ?? null });
  },
  async rescheduleBooking(sb, p) {
    return rpc(sb, "reschedule_booking", { p_appointment_id: p.appointmentId, p_starts: p.starts });
  },
};

async function rpc(sb: Client, fn: string, args: Record<string, unknown>) {
  const { data, error } = await sb.rpc(fn, args);
  if (error) return { ok: false, code: "rpc_error", message: error.message };
  return data ?? { ok: false, code: "empty" };
}

Deno.serve(async (req: Request) => {
  if (!ENABLED) return json({ ok: false, code: "canary_disabled" }, 503);
  if (req.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405);

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  if (!token) return json({ ok: false, code: "unauthenticated" }, 401);

  // Decode the JWT sub (no signature trust here — Supabase verifies it on every RPC/RLS call;
  // this gate only narrows WHO may reach the canary at all).
  let sub = "";
  try { sub = JSON.parse(atob(token.split(".")[1])).sub ?? ""; } catch { /* ignore */ }
  if (!ALLOWED.has(sub)) return json({ ok: false, code: "not_allowlisted" }, 403);

  let body: { action?: string; params?: Record<string, unknown> };
  try { body = await req.json(); } catch { return json({ ok: false, code: "bad_json" }, 400); }
  const handler = body.action ? ACTIONS[body.action] : undefined;
  if (!handler) return json({ ok: false, code: "unknown_action" }, 400);

  const sb = createClient(SB_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  try {
    const result = await handler(sb, body.params ?? {});
    return json({ ok: true, action: body.action, result });
  } catch (e) {
    return json({ ok: false, code: "handler_error", message: String(e) }, 500);
  }
});
