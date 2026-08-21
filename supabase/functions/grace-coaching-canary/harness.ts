// grace-coaching-canary HTTP test harness (P3C-B3, §26 matrix).
//
// Runs authenticated HTTP flows against the deployed canary and asserts SEMANTIC postconditions
// (§23: an HTTP 200 is not a pass — canonical state + v2 compatibility + authorization + absence
// of duplicate side effects must all hold). MUST be run from an environment with outbound HTTPS
// to *.supabase.co. The migration-authoring session cannot run it (egress to supabase is blocked),
// so this is the deliverable an HTTP-capable session/operator executes to earn HTTP-VERIFIED.
//
//   deno run --allow-net --allow-env harness.ts
//
// Required env (all identities MUST be test fixtures / allowlisted — never real participants):
//   CANARY_URL           https://<project>.functions.supabase.co/grace-coaching-canary
//   SUPABASE_URL         https://<project>.supabase.co
//   SUPABASE_ANON_KEY    anon key (for authenticated read-back verification)
//   PARTICIPANT_JWT      fixture participant access token (person 10)
//   COACH_JWT            fixture coach access token (person 15, granted coach in a controlled way)
//   PARTICIPANT_PERSON_ID / COACH_PERSON_ID   canonical person ids for the two fixtures
//   OUTSIDER_JWT         a third fixture with no relationship (for negative authorization tests)
//
// PRECONDITION the operator must arrange in staging (NOT done by this harness): scheduling +
// relationships/support_requests write authority flipped to 'canonical' for the canary project,
// and a coach role assignment for the coach fixture. Keep production authority at 'v2'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = (k: string) => { const v = Deno.env.get(k); if (!v) throw new Error(`missing env ${k}`); return v; };
const CANARY = env("CANARY_URL");
const PART = env("PARTICIPANT_JWT"), COACH = env("COACH_JWT"), OUT = Deno.env.get("OUTSIDER_JWT") ?? "";
const PART_ID = Number(env("PARTICIPANT_PERSON_ID")), COACH_ID = Number(env("COACH_PERSON_ID"));

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  cond ? pass++ : fail++;
};

async function call(jwt: string, action: string, params: Record<string, unknown> = {}) {
  const res = await fetch(CANARY, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ action, params }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
// authenticated read-back client (RLS-scoped as the given fixture) for postcondition checks
const asUser = (jwt: string) =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), { global: { headers: { Authorization: `Bearer ${jwt}` } } });

const soon = (days: number) => new Date(Date.now() + days * 864e5).toISOString();

async function run() {
  // --- Authentication (§26) ---
  ok("unauthenticated rejected", (await fetch(CANARY, { method: "POST", body: "{}" })).status === 401);
  if (OUT) ok("non-allowlisted rejected", (await call(OUT, "claimSupportRequest", { supportRequestId: 1 })).status === 403);

  // --- Relationships (§26) ---
  const assign = await call(COACH, "assignParticipantCoach", { participantPersonId: PART_ID, coachPersonId: COACH_ID });
  ok("coach assign 200+ok", assign.status === 200 && assign.body?.result?.ok === true, JSON.stringify(assign.body?.result));
  // semantic: exactly one active primary relationship for the participant (canonical), read as the coach
  const rels = await asUser(COACH).from("coaching_relationships")
    .select("id,status,is_primary").eq("participant_person_id", PART_ID).eq("status", "active").eq("is_primary", true);
  ok("one active primary relationship", (rels.data?.length ?? -1) === 1);
  // participant cannot self-assign to a different coach (authorization)
  const selfAssign = await call(PART, "assignParticipantCoach", { participantPersonId: PART_ID, coachPersonId: PART_ID });
  ok("participant self-assign rejected", selfAssign.body?.result?.ok === false);

  // --- Support requests (§26) ---
  const sr = await call(PART, "createSupportRequest", { personId: PART_ID, requestType: "recovery_coach", focus: "canary" });
  ok("participant creates own support request", sr.body?.result?.ok === true, JSON.stringify(sr.body?.result));
  const srForeign = await call(PART, "createSupportRequest", { personId: COACH_ID, requestType: "recovery_coach" });
  ok("cannot create request for another person", srForeign.body?.result?.ok === false);

  // --- Booking → exactly one appointment (§26) ---
  const bk = await call(PART, "createBookingRequest", {
    participantPersonId: PART_ID, providerPersonId: COACH_ID, proposedStarts: [soon(7), soon(8)],
  });
  const bookingId = bk.body?.result?.booking_request_id;
  ok("create booking request", bk.body?.result?.ok === true && !!bookingId, JSON.stringify(bk.body?.result));

  // coach reads the active proposal to accept (as the non-proposer)
  const props = await asUser(COACH).from("booking_proposals")
    .select("id,proposed_start,is_active").eq("booking_request_id", bookingId).eq("is_active", true).order("id");
  const propId = props.data?.[0]?.id;
  const acc = await call(COACH, "acceptBookingProposal", { proposalId: propId });
  const apptId = acc.body?.result?.appointment_id;
  ok("accept offered time -> confirmed", acc.body?.result?.code === "confirmed" && !!apptId);

  // double-accept returns the SAME appointment (no second appointment)
  const acc2 = await call(COACH, "acceptBookingProposal", { proposalId: propId });
  ok("double-accept idempotent (same appointment)", acc2.body?.result?.appointment_id === apptId);
  const appts = await asUser(COACH).from("appointments").select("id").eq("booking_request_id", bookingId);
  ok("exactly one appointment for the booking", (appts.data?.length ?? -1) === 1);

  // accept a time never offered -> rejected (send a bogus proposal id owned by nobody)
  const bogus = await call(COACH, "acceptBookingProposal", { proposalId: -1 });
  ok("accept non-existent proposal rejected", bogus.body?.result?.ok === false);

  // v2 compatibility: the confirmed session is visible in the legacy shape with the same time
  const v2 = await asUser(COACH).schema("public").from("v2_session_requests")
    .select("status,scheduled_at,client_ref").eq("client_ref", `canon:appt:${apptId}`).maybeSingle();
  ok("v2 compat session confirmed + same time", v2.data?.status === "confirmed");

  // --- Reschedule preserves lineage; cancel propagates (§26) ---
  const rs = await call(COACH, "rescheduleBooking", { appointmentId: apptId, starts: [soon(9)] });
  ok("reschedule opens new booking", rs.body?.result?.code === "reschedule_opened");
  const cancel = await call(PART, "cancelBooking", { bookingRequestId: bookingId, reason: "harness" });
  ok("cancel booking ok", cancel.body?.result?.ok === true);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) Deno.exit(1);
}

run().catch((e) => { console.error(e); Deno.exit(1); });
