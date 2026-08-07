# P3C-B — Booking/Appointment Write Domain, Canary & HTTP Cutover Gate: Report (A–Q)

**Date:** 2026-08-07 · **Project:** `ykykeioydvtxpyreshhs` · **Sub-phase:** **P3C-B1/B1b/B2/B3**
(scheduling write machinery + canonical notifications + canary). Migrations `0033`–`0036` applied
live + committed; `coachingWrites.ts` extended; canary consumer + HTTP harness added under
`supabase/functions/grace-coaching-canary/`.

Verification labels (never collapsed — §32): **DB-VERIFIED** · **CODE-VERIFIED** · **DEPLOY-VERIFIED**
· **HTTP-VERIFIED**.

---

## Honest framing + the stopping rule (§38)

**No production domain was flipped to `CANONICAL_WRITE`.** All six domains remain
`write_authority='v2'` (DB-VERIFIED). The blocking condition is exactly the one §32/§38 name:
**authenticated HTTP verification is impossible from this environment** — org egress policy returns
`403 CONNECT` for every `*.supabase.co` host (confirmed via the agent proxy status endpoint; the
proxy README is explicit: report the blocked host, do not route around it). Since P3C-B changes
write ownership, the HTTP gate is blocking, so per §38 this phase **builds up to the gate, proves
everything provable at the DB layer with fixtures, and hands the live flip to an HTTP-capable
session** via the canary + harness + readiness matrix below. This honors the standing instruction
to reduce ad-hoc production mutation: every test here was transaction-wrapped, fixture-only, and
`RAISE`-rolled-back, with zero production residue.

## A. Booking/appointment canonical write implementation (DB-VERIFIED; §2–§8)

Booking + appointments are treated as **one transaction domain**. Migration `0033` adds the
SECURITY-DEFINER RPCs (authority derived from JWT → `people` → `role_assignments` → active
relationship, never client input):

- `create_booking_request` — participant- or coach-initiated; validates an **active coaching
  relationship** exists (unless admin); seeds round-1 proposals.
- `propose_booking_times` / `counter_propose_booking_times` — new active round supersedes the prior
  set; **history preserved** via `round` + `is_active`.
- `accept_booking_proposal` — re-created verbatim from the proven P2 logic (locks proposal+booking
  `FOR UPDATE`, **exactly one appointment**, double-tap returns the existing appointment, rejects
  confirm-for-other-time / stale / no-provider), extended only to carry reschedule lineage.
- `cancel_booking` — cancels request + confirmed appointment; deactivates proposals.
- `reschedule_booking` — marks the current appointment `rescheduled` and opens a new booking whose
  eventual appointment links back via `rescheduled_from_appointment_id`.

`coachingWrites.ts` exposes typed wrappers for all of the above. **Not** exposed:
`insertAppointment` / `updateAppointment(anyFields)` — appointment state changes only through
legitimate booking operations (§3).

## B. Scheduling compatibility projection specification (DB-VERIFIED; §10–§12)

`recoveryos.compat_scheduling_to_v2(appointment_id)` composes the legacy `v2_session_requests`
shape from `support_request + booking_request + booking_proposals + appointment` — the canonical
model is **not** collapsed to simplify the projection. Direction is strictly canonical → v2, keyed
idempotently by `v2_session_requests.client_ref = 'canon:appt:<id>'`. It sets `app.coaching_rpc='1'`
(to legally drive the v2 confirm transition, which the v2 guard otherwise reserves for
`accept_session_proposal`) and `app.compat_projection='1'` (which short-circuits the inbound
v2→canonical session projection — a defensive anti-circular guard that holds regardless of
per-domain flip ordering). Field mapping (§11) verified against live columns/enums, including the
modality caveat that `chat/self_directed/group` have no `v2_session_mode` and degrade to `video`.

## C. Scheduling invariant test report (DB-VERIFIED, fixtures, rolled back; §7)

Full chain as fixtures (participant person 10 creates, coach person 15 accepts), all `RAISE`-rolled-back:

```
ACCEPT=confirmed appt | DOUBLE_TAP=already_confirmed same_appt=t   (exactly one appointment)
ONE_APPT: canon_appt_delta=1 | canon_sr_delta=0 (no circular)
COMPAT v2: status=confirmed, scheduled_at match=t
RESCHEDULE: reschedule_opened, new appt lineage_from = original appt (t)
CANCEL: cancelled -> v2 status=cancelled | appts_created=2 (orig + reschedule)
OUTBOX: done=4 failed=0
```

Post-run: `write_authority` all `v2`, native appointments (4) untouched, zero stray bookings/outbox.

## D. Reschedule / cancellation report (DB-VERIFIED; §13–§14)

- **Reschedule** preserves history: the prior appointment moves to `rescheduled`; a new negotiation
  produces a new confirmed appointment carrying `rescheduled_from_appointment_id = <prior>` (verified
  lineage). The v2 compat row for the superseded appointment maps to `cancelled`; the new one
  confirms — so the legacy UI shows the current effective time while canonical retains the chain.
- **Cancellation** writes canonical first; compat maps the v2 session to `cancelled` (verified). A
  cancelled appointment cannot be joined (no meeting action), and because the v2 session flips to
  `cancelled`, the v2 reminder engine suppresses pending reminders (the same transition it already
  honors in production).

## E. Reminder-bridge verification (DB-VERIFIED; §15) — a real defect found and fixed

Canonical scheduling must keep the **v2** pg_cron reminder engine (`vrcc-session-reminders`, every
5 min) firing during compatibility. The bridge: `compat_scheduling_to_v2` drives
`v2_session_requests` to `confirmed`, whose BEFORE-UPDATE trigger `v2_on_session_confirmed` reseeds
`v2_session_reminders`. Verified end-to-end (fixtures, rolled back): **3 reminders seeded —
`day_before, hour_before, starting_now`** — with no stacking; reschedule reseeds; cancellation
suppresses; double-accept does not duplicate.

Two defects were **caught by the transaction-wrapped verification and fixed before commit** (exactly
the value of testing before flipping):
1. `v2_on_session_confirmed` fires only on the *transition* into `confirmed`; the first compat
   inserted an already-`confirmed` row, so no reminders seeded. Fixed (`0034`) to insert a
   non-confirmed placeholder then UPDATE into `confirmed`.
2. `v2_session_requests.id` is **uuid**, not bigint; the fix in `0034` assigned the returned uuid
   into a bigint handle (`22P02`). Fixed (`0035`, `v_existing uuid`). Re-verified green.

## F. Canonical meeting-provisioning verification (§16) — CODE-VERIFIED / deferred activation

Meeting provisioning stays behind the hardened `create-meeting` Edge Function (P1 security intact:
JWT identity, authorized role, active relationship, valid appointment, idempotent, server-authoritative
URL, no public fallback). The change to validate against the **canonical** relationship + appointment
lands when `appointments` reaches `CANONICAL_WRITE` (runbook, §M). Not activated here (no flip). The
canary omits a meeting action for the same reason; documented in its README.

## G. Canonical notification generation report (DB-VERIFIED, dormant; §17)

Migration `0036` adds `emit_notification` (deduped) + `notify_appointment_event` /
`notify_relationship_assigned`, generating canonical in-app notifications for coach-assigned /
confirmed / cancelled / rescheduled events. **Gated on `notifications='canonical'` → dormant now**
(the v2 emitters remain the single source, so no duplicates). External email/SMS remain **OFF**.
Fixtures may receive in-app notifications for controlled tests; external delivery (when it exists)
must separately exclude `is_production_person=false` — recorded in the contract, not built.

## H. Notification deduplication report (DB-VERIFIED; §18–§21)

Single-source proven (fixtures, rolled back): dormant at `v2` (`code=dormant`, 0 canonical
notifications); at `canonical`, `notify_appointment_event('confirmed')` emits exactly **2**
canonical notifications (participant + provider) and the dormant `compat_notification_to_v2`
projects exactly **2** v2 copies — no independent second event. Re-emit is a **no-op** (dedup_key
unique index): still 2 canonical / 2 v2, and no projection loop (the inbound
`project_v2_notification` short-circuits on `app.compat_projection`).

## I. Canary / staging consumer architecture (CODE-VERIFIED; §21–§25)

`supabase/functions/grace-coaching-canary/` — a server-side JSON consumer that calls the canonical
RPCs **under the caller's JWT** (anon key + `Authorization` header → RLS + `current_person_id`
apply exactly as in production; no service-role key, so it can never exceed the caller). Security
(§24): off unless `CANARY_ENABLED=true`; caller `sub` must be in `CANARY_ALLOWED_SUBS`
(fixtures/allowlist only, else `403`); no external delivery. It is **not an alternate production
entrance** and is **not deployed by this session**. README documents the deploy + precondition
(flip authority in the canary/staging env only) + run steps.

## J. Authenticated HTTP test report (§22/§23) — HARNESS BUILT, NOT RUN

`harness.ts` implements the §26 matrix and asserts **semantic postconditions** (§23), not HTTP 200:
unauthenticated `401` / non-allowlisted `403`; one active primary relationship; participant
self-assign rejected; participant-owned support request + cross-person rejected; booking → exactly
one confirmed appointment; double-accept returns the same appointment; accept-unoffered rejected;
v2 compat session confirmed at the same time; reschedule lineage; cancel. **It has not been run** —
egress to `*.supabase.co` is blocked here (§L). A green run is what earns HTTP-VERIFIED.

## K. DB-vs-HTTP verification matrix (honest, not collapsed; §K/§32)

| Capability | DB-VERIFIED | HTTP-VERIFIED |
| --- | --- | --- |
| One accepted proposal → one appointment (+ double-tap idempotent) | ✅ (fixtures, rolled back) | ⛔ blocked (harness ready) |
| Reschedule lineage / cancellation propagation | ✅ | ⛔ |
| Reminder bridge (3 reminders, no stacking) | ✅ | ⛔ |
| Canonical→v2 scheduling compat (composed, idempotent) | ✅ | ⛔ |
| Outbox durable degraded state on compat failure | ✅ | ⛔ |
| Canonical notification single-source + dedup | ✅ | ⛔ |
| Authorization (self-assign/cross-person/allowlist) | ✅ (P3A/P3B + here) | ⛔ (negative HTTP cases in harness) |
| Legacy-UI visibility of the above | n/a (not DB-observable) | ⛔ (the specific gap the canary closes) |

⛔ = blocked in this environment only; the harness is the ready instrument.

## L. Realtime authority map (design; §33)

Unchanged from P3B (no consumer activated). Per-domain single realtime authority at flip:
`support_requests` (staff pool by role; own by person), `appointments` (participant by `person_id`,
coach by `provider_person_id`), `notifications` (by `recipient_person_id`). The canary/harness use
**read-back queries**, not dual subscriptions. Legacy v2 keeps v2 realtime while it is a
compatibility consumer; the future canonical consumer uses canonical realtime only.

## M. Projection-failure classification (IMPLEMENTED + DB-VERIFIED; §27/§31) — the top guardrail

Per the explicit concern that a confirmed canonical session must never silently diverge from the
legacy UI, scheduling compatibility is classified **`CRITICAL_USER_VISIBLE`**, not swallowed.
Mechanism (`recoveryos.legacy_projection_outbox` + `trg_scheduling_compat`): every canonical
appointment write enqueues an outbox row, then attempts compat; on failure the canonical write
**still commits** (AFTER-trigger, exception caught) and the outbox row is durably marked `failed`
with `last_error` + backoff `next_attempt_at`. `process_legacy_projection_outbox()` (SKIP LOCKED,
admin/cron only) retries. **DB-VERIFIED (fixtures, rolled back):** an appointment for an
unmapped participant → `appt_committed=t`, outbox `status=failed attempts=1
err="no v2 identity for participant person …"`, retry respects backoff. Failure classes for the
consumer (§27): `CANONICAL_WRITE_SUCCEEDED_COMPAT_FAILED` is the outbox `failed` state;
`COMPAT_RECOVERED` on a successful retry; the user is told success only after the canonical
transaction commits.

## N. Outbox decision (§28/§32)

**Decision: outbox for scheduling (built), synchronous exception-safe projection for the simpler
domains (relationships, support requests, notifications).** Scheduling is the coupled,
user-visible-critical domain where a silent divergence is unacceptable, so it gets the durable
retry/observability of `legacy_projection_outbox`. The simpler domains' compat projections are
idempotent and exception-safe and log to `backfill_log`; they do **not** need the outbox now
(§28: don't build unnecessary infrastructure). Trigger to promote a domain to the outbox: any
compat target developing a constraint that makes synchronous projection unreliable.

## O. Production-wave readiness matrix (§27/§28) — PREPARE only, no execution

All waves are **DB-ready** and **HTTP-pending**. None may execute without a green canary run **and**
explicit authorization (§38).

| Wave | Domains | DB machinery | HTTP gate | Authorized? |
| --- | --- | --- | --- | --- |
| 1 | relationships, support_requests | ✅ (P3C-A + here) | ⛔ pending canary | **No** |
| 2 | bookings + appointments (together) | ✅ (this phase) | ⛔ pending canary | **No** |
| 3 | notifications (in-app) | ✅ (this phase) | ⛔ pending canary | **No** |
| — | messaging | HELD (§34) | — | HELD |
| — | reminders | HELD, v2 authoritative (§35) | — | HELD |

## P. Rollback / reconciliation runbook (§29) — per wave, HTTP-capable session

**Forward (per wave):** deploy the repointed consumer for that wave → `set_write_authority(domain,
'canonical')` (scheduling uses `set_scheduling_write_authority('canonical')` — flips bookings +
appointments **atomically**, preventing split authority) → run the canary harness → keep only if all
semantic assertions pass. **Rollback:** stop canonical-consumer writes → **reconcile** canonical
rows created during the window into v2 (verify the outbox is drained: `select * from
legacy_projection_outbox where status<>'done'` must be empty; run `process_legacy_projection_outbox`
until clear) → `set_write_authority(domain,'v2')` (compat off, inbound projection on,
`migration_state` → `CANONICAL_READ`) → verify v2 re-syncs. Never a bare trigger flip — reconcile
first. Machinery rollback (withdraw the mechanism): `drop trigger trg_scheduling_compat …`,
`trg_compat_notification_to_v2 …`; guards revert the inbound projections to always-on once the
authority rows read `v2` (they already do). Additive; no data loss.

## Q. Final write-authority state (DB-VERIFIED)

```
write_authority : appointments=v2 | bookings=v2 | messages=v2 | notifications=v2 | relationships=v2 | support_requests=v2
migration_state : relationships/support_requests/bookings/appointments/notifications = CANONICAL_READ ;
                  messages = CANONICAL_PARITY ; reminders = LEGACY_ONLY ; follow_ups = CANONICAL_SHADOW ; identities = CANONICAL_READ
```

Unchanged from P3B in production — **no domain advanced to `CANONICAL_WRITE`.** The scheduling +
notification write machinery, the CRITICAL outbox, the reminder bridge, and the canary/harness are
built and DB-proven; the live flips are the §P runbook for an HTTP-capable session, gated on a green
canary run and explicit authorization.

---

## Exit-criteria check (P3C-B, honest; §40)

Booking/appointments completed as one transaction domain, DB-VERIFIED (one appointment invariant,
double-tap idempotent) ✅; scheduling compat composed + idempotent + anti-circular ✅; reminder
bridge proven (3 reminders, defects caught+fixed) ✅; canonical notifications single-source + deduped
✅; **critical compat failure is durable + retryable, never swallowed** ✅; canary + semantic HTTP
harness built ✅ (CODE-VERIFIED); rollback/reconciliation per wave documented ✅; one writer + one
projection direction per domain preserved, no circular sync ✅; fixtures excluded, no real
participant used as a fixture ✅; source control matches production ✅ (0033–0036 applied + committed).
**Not met (by design, gated):** DEPLOY/HTTP verification and any production write flip — blocked on
egress to `*.supabase.co`; the canary run is the instrument. **STOP before production activation
(§38).** Messaging and reminders remain HELD. P4 (React frontend) not started (§36).
