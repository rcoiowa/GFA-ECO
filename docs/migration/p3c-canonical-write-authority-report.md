# P3C — Canonical Write Authority: Report (Deliverables A–Q)

**Date:** 2026-08-07 · **Project:** `ykykeioydvtxpyreshhs` · **Sub-phase:** **P3C-A**
(write-authority machinery + canonical write service; relationships + support requests
targeted first). Migration `0032_write_authority_cutover` applied live + committed;
`coachingWrites.ts` added to `packages/data-access`.

Verification labels (never collapsed — directive §32): **DB-VERIFIED** (proven by SQL against
the live DB) · **CODE-VERIFIED** (compiles/reviewed, not exercised over HTTP) ·
**DEPLOY-VERIFIED** · **HTTP-VERIFIED**.

---

## Honest framing (what P3C-A did and did NOT do)

The P3C exit criteria (directive §40) require domains to be **actually written through canonical
services** with HTTP verification (§32) before a domain is declared cut over. **No live domain was
flipped to `CANONICAL_WRITE` in this sub-phase.** All six domains remain `authority='v2'`. That is
deliberate and follows the directive's own gates:

1. **No activated production write consumer.** The only live coaching write surface is the deployed
   v2 Edge Function, which still writes `v2_*`. Directive §4 Option A (repoint that Edge Function to
   the canonical RPCs) is the chosen strategy — but activating it means **deploying** a new function
   and **HTTP-verifying** it end-to-end. This environment's network policy 403s `*.supabase.co`, so
   the deploy+HTTP gate (§32) **cannot be satisfied here**. Flipping write authority without that
   gate would put an unverified canonical write path in front of real participants.
2. **The user's explicit constraint.** "Now that write authority is changing … reduce ad hoc
   production mutation tests sharply. Prioritize: transaction-wrapped DB tests → fixture identities →
   staging/controlled consumer → black-box authenticated HTTP → narrowly scoped production
   verification. Do not use ordinary real participant records as migration test fixtures."

So P3C-A delivers the **mechanism** and the **prepared canonical writer**, both **DB-VERIFIED with
test fixtures only, fully rolled back**, and hands the actual live flip to a staging/HTTP-capable
session via the runbook in §M. This is the transaction-safe, non-destructive posture the directive
demands — not a claim of completed cutover.

---

## A. Canonical write-consumer implementation (CODE-VERIFIED; PREPARED, not activated)

`packages/data-access/src/repositories/coachingWrites.ts` — the write counterpart to
`coachingReads.ts`. Every critical transition goes through a server-authoritative `recoveryos`
SECURITY DEFINER RPC; the client never mutates canonical tables directly, never supplies identity,
never supplies a role. Authority is derived inside each RPC from JWT → `people` →
`role_assignments` → active relationship (directive §31). Exposed now (the P3C-A domains):

- `assignParticipantCoach({participantPersonId, coachPersonId, reason?})` → `assign_participant_coach`
- `claimSupportRequest(supportRequestId)` → `claim_support_request`
- `createSupportRequest({personId, requestType, focus?, preferredModality?})` → RLS-guarded insert
- `acceptBookingProposal(proposalId)` → `accept_booking_proposal`

`createBookingRequest / proposeBookingTimes / cancelBooking / rescheduleBooking /
createOrProvisionAppointment / createNotification / createFollowUp` are **intentionally not exposed
yet** (booking+appointment is the P3C-B transaction domain; notifications/follow-ups follow it). A
half-wired scheduling surface would violate §12's "one transaction domain" rule.

**Consumer strategy (directive §4):** Option A (repoint the existing Edge Function). Documented here,
**not activated** — activation is the runbook (§M) because it requires deploy + HTTP verification
this environment cannot perform. Option C (synthetic harness) was used **only** for the rolled-back
DB verification below and is explicitly **not** treated as production write authority (§4: "Do not
declare a domain production-write-authoritative based solely on a synthetic harness").

## B. Domain-by-domain authority map (DB-VERIFIED — live state)

| Domain | `write_authority` (live) | `migration_state` | Authoritative writer today |
| --- | --- | --- | --- |
| Relationships | **v2** | CANONICAL_READ | v2 Edge Function → `v2_coach_assignments` |
| Support Requests | **v2** | CANONICAL_READ | v2 Edge Function → `v2_session_requests` |
| Bookings | **v2** | CANONICAL_READ | v2 (P3C-B) |
| Appointments | **v2** | CANONICAL_READ | v2 (P3C-B) |
| Notifications | **v2** | CANONICAL_READ | v2 |
| Messaging | **v2** | CANONICAL_PARITY | v2 (HELD, §23) |
| Reminders | (v2, no control row) | LEGACY_ONLY | v2 pg_cron (HELD, §24) |

`write_authority` is the single per-domain control row (`recoveryos.write_authority`). Every domain
reads `v2` today. The cutover for a domain is a **single-row UPDATE** via
`recoveryos.set_write_authority(domain, 'canonical')`, which also advances `migration_state`.

## C. Projection-direction map (DB-VERIFIED — the anti-circular invariant)

The core structural guarantee (directive §1: never v2→canonical **and** canonical→v2 for one
domain). **Both** directions self-gate on the same `write_authority` row, so they can never both be
live for a domain — no circular sync is possible **by construction**, not by procedure:

| Domain | v2 → canonical (0031, guarded in 0032) | canonical → v2 compat (0032) | Active direction now |
| --- | --- | --- | --- |
| Relationships | fires iff `authority='v2'` | `compat_relationship_to_v2` fires iff `authority='canonical'` | **v2 → canonical** |
| Support Requests | fires iff `authority='v2'` | `compat_support_request_to_v2` fires iff `authority='canonical'` | **v2 → canonical** |
| Appointments | fires iff `authority='v2'` (appt portion) | (P3C-B) | **v2 → canonical** |
| Notifications | fires iff `authority='v2'` | (P3C-B/G) | **v2 → canonical** |
| Messaging | fires iff `authority='v2'` | (held) | **v2 → canonical** |

At flip time the direction reverses atomically for that domain only: the guard `if
write_authority_of('<domain>') <> 'v2' then return NEW` disables the inbound projection the instant
the same row makes the outbound compat projection eligible.

**DB-VERIFIED (rolled back, fixtures only).** In a single transaction: flip
relationships + support_requests to `canonical`; perform two canonical writes as fixtures (person 10
participant, person 15 coach); assert; `RAISE` to roll the entire transaction back. Result — every
invariant PASS:

```
REL : canon_new=1 (want 1 ✓) | active_primary=1 (want 1 ✓) | v2_compat_new=1 (want 1 ✓)
      | compat_maps_coach=✓ | back_proj(legacy_ref)_delta=0 (want 0 ✓)
SR  : canon_new=1 (want 1 ✓) | v2_compat_new=1 (want 1 ✓) | compat_maps_sr=✓
      | back_proj(legacy_ref)_delta=0 (want 0 ✓)
APPT: canon_delta=0 (want 0 ✓)
```

Interpretation: the canonical write created exactly one canonical row; the dormant compat projection
woke and produced exactly one correctly-mapped v2 row; the inbound v2→canonical projection stayed
gated off (zero back-projected rows — the `legacy_ref`-signature delta was 0, proving no circular
sync); no stray appointment. Post-test verification: `write_authority` all back at `v2`, fixture row
counts unchanged, **zero** stray rows, **zero** compat exceptions. No ordinary participant record was
used as a fixture (directive final constraint).

> Test-instrumentation note (transparency): the first run's circular check produced a false positive
> by matching the **pre-existing** legitimately-projected support-request pair. It was corrected to
> measure the *delta of canonical rows carrying a non-null `legacy_ref`* (the true back-projection
> signature), which is 0. The mechanism was correct throughout; the metric was sharpened.

## D. Relationships write-cutover report (machinery DB-VERIFIED; live flip PENDING gate)

- **Canonical authority target:** `recoveryos.coaching_relationships`; **RPC:** `assign_participant_coach`.
- **Preserved (verified in P3A/P3B + this phase):** atomic assign/transfer; **exactly one active
  primary** (`coaching_rel_one_active_primary` partial unique index — DB-confirmed present); history
  retained (soft-end, not delete); coach self-claim / admin assignment authority from
  `role_assignments`; idempotency; `v2_profiles.role` **not** trusted.
- **Compat projection (§6):** `compat_relationship_to_v2` — one-way, idempotent, deactivates any
  prior active v2 assignment before inserting (never multiple active), exception-safe (failure logged
  to `backfill_log`, never aborts the canonical write). Verified: one canonical assign → exactly one
  active v2 assignment mapped to the correct coach.
- **Write gate (§7) status:** DB-side gates PASS (canonical assign, one active primary, v2 compat
  appears, fixture-cannot-become-coach from P3B, participant-cannot-self-assign from P3A, idempotent
  retry, rollback). **Not yet met:** "active coach sees participant in **legacy interface**" /
  "participant sees assigned coach in **legacy interface**" — these are HTTP-observable and belong to
  the runbook. **Relationships stays `CANONICAL_READ` until the runbook clears the HTTP gate.**

## E. Support-request write-cutover report (machinery DB-VERIFIED; live flip PENDING gate)

- **Canonical authority target:** `recoveryos.support_requests`; participant create is RLS-guarded
  (person_id must be caller, status pinned `open`, unclaimed); claim via `claim_support_request`
  (owns the transaction — §10).
- **Preserved:** participant ownership; request type/intent; open→claimed→assigned lifecycle;
  timestamps; staff-pool visibility (fixture-excluded — P3B); progressive disclosure.
- **Compat projection (§9):** `compat_support_request_to_v2` maps canonical status →
  `v2_session_status` (`open/submitted/claimed/assigned`→`requested`, `scheduled`→`confirmed`,
  `resolved`→`completed`, `cancelled`→`cancelled`); one-way; exception-safe. Deliberately projects
  **only the support-request fields** — scheduling/session fields are **not** forced back into this
  domain (§9). Verified: one canonical support_request → exactly one correctly-shaped v2 row.
- **Write gate (§11) status:** DB-side gates PASS. **Not yet met:** legacy-UI visibility of claim/
  pool state (HTTP). **Support Requests stays `CANONICAL_READ` until the runbook clears the HTTP gate.**

## F. Booking / appointment write-cutover report (HELD → P3C-B)

Not started, by directive (§12: booking + appointments move as **one** transaction domain; §2: do
not proceed merely because the prior domain deployed). The canonical RPC `accept_booking_proposal`
and models exist and are proven (P2), and `acceptBookingProposal()` is wired in `coachingWrites.ts`,
but `write_authority` for `bookings`/`appointments` remains `v2` and **no compat projection was
activated for them**. The controlling invariant to prove in P3C-B: **one accepted negotiation → exactly
one confirmed appointment**, with double-tap returning the existing appointment (§14). Reminder
compatibility (§18/§24) must be proven before flip.

## G. Notification write-cutover report (PREPARED; follows P3C-B)

`write_authority('notifications')='v2'`; the inbound projection is guarded. No canonical notification
generation was made authoritative (it should follow the domains whose events it announces — §20).
When activated: single event source (§21) — v2-origin notification triggers for migrated events must
be disabled or made non-duplicating; in-app only, **external email/SMS stays OFF** (§20).

## H. Legacy compatibility verification (DB-VERIFIED for the two active-prepared domains)

For relationships and support_requests, the canonical→v2 compat projections were exercised (rolled
back) and produced correctly-mapped, single, idempotent legacy rows without aborting canonical
writes and without back-projection. Compat projections are **exception-safe** (failure → `backfill_log`,
canonical write still commits) — see §K/§27 for the failure-classification policy that governs when a
compat failure must instead surface to the user.

## I. RLS / RPC verification

- **RPC authority (unchanged, still valid):** `assign_participant_coach`, `claim_support_request`,
  `accept_booking_proposal` are SECURITY DEFINER with pinned `search_path`, deriving identity/role
  from the JWT crosswalk — never client input (§31). Verified across P3A/P3B.
- **New functions locked down:** `set_write_authority(text,text)`, `write_authority_of`,
  `v2_for_person`, `compat_relationship_to_v2`, `compat_support_request_to_v2` all
  `REVOKE EXECUTE … FROM public, anon, authenticated`. `write_authority` table has RLS with
  admin-only select. So no participant/coach can read or flip write authority.
- **Direct-insert paths** (`createSupportRequest`) remain RLS-guarded; canonical write authority does
  not widen any RLS boundary (ADR-0006).

## J. Realtime authority report (design; directive §26)

No canonical realtime subscriptions were activated (no consumer). Per-domain single realtime
authority at flip time: `support_requests` (staff pool by staff role; own by person),
`appointments` (participant by `person_id`, coach by `provider_person_id`), `notifications` (by
`recipient_person_id`). The legacy v2 UI keeps v2 realtime **while it is a compatibility consumer**;
clients must never subscribe to both canonical and v2 copies of the same domain. The split (canonical
reads, v2 realtime) must not outlive P3C for a flipped domain.

## K. Telemetry / failure report (directive §27–§29)

- **Sink today:** `recoveryos.backfill_log` records projection/compat `skipped_count` (unmapped
  identity) and `exception_count` (`sqlerrm`), per domain, keyed by `legacy_ref`/canonical id — **no
  sensitive participant content**. Live compat exceptions: **0**.
- **Failure classes to instrument at consumer activation (§27):** `CANONICAL_WRITE_FAILED`,
  `CANONICAL_WRITE_SUCCEEDED_COMPAT_FAILED`, `COMPAT_RECOVERED`, `COMPAT_RETRY_REQUIRED`. Rule:
  the user is told success **only** after the canonical transaction commits; a compat failure is
  never silent.
- **Counters (§29):** `canonical_write_success/failure`, `legacy_projection_success/failure/retry`,
  `duplicate_write_prevented`, `authorization_rejected`, `fixture_write_blocked`, `idempotent_retry`.
- **Outbox (§28) decision:** the synchronous compat projections are already exception-safe and
  idempotent, so a `legacy_projection_outbox` is **not built** now (§28: "Do not build unnecessary
  enterprise infrastructure if a safe transactional projection suffices"). Trigger for revisiting:
  if a compat target develops a constraint that makes synchronous projection unreliable, switch that
  domain to the outbox pattern before its flip.

## L. HTTP verification status (directive §32 — reported honestly, not collapsed)

**HTTP-VERIFIED: NOT ACHIEVED in this environment.** Network policy 403s `*.supabase.co`, so no
black-box authenticated write test could run. Because P3C changes write ownership, this gate is
**blocking** for every live flip. Current truthful labels: relationships & support-request
machinery = **DB-VERIFIED** + **CODE-VERIFIED**; **DEPLOY-VERIFIED / HTTP-VERIFIED = pending** (runbook
§M). No domain is declared cut over on DB verification alone.

## M. Rollback / reconciliation report + STAGING/HTTP RUNBOOK (directive §33–§34)

**Rollback is more than flipping a trigger (§33)** — canonical writes created during a canonical-write
window must be reconciled. Per-domain procedure:

**Forward (per domain, in a staging/HTTP-capable session):**
1. Deploy the Edge Function repointed to the canonical RPC for that domain **only** (Option A).
2. `select recoveryos.set_write_authority('<domain>','canonical');` — atomically flips the control
   row (inbound projection off, outbound compat on) and advances `migration_state` → `CANONICAL_WRITE`.
3. Exercise the domain over **authenticated HTTP** with a controlled (non-fixture, consented) account:
   assign/claim/create; assert canonical row authoritative, v2 compat row correct, legacy UI still
   shows expected state, no duplicate/second active row, idempotent double-tap.
4. Only if all HTTP assertions pass, keep the flip; else roll back (below).

**Rollback (per domain):**
1. Stop the canonical consumer writes (redeploy Edge Function to the v2 path for that domain).
2. **Reconcile:** for each canonical row created during the window, ensure its v2 compat row exists
   and is correct (the compat projection already wrote it; verify no gaps in `backfill_log`).
3. `select recoveryos.set_write_authority('<domain>','v2');` — flips back (compat off, inbound
   projection on, `migration_state` → `CANONICAL_READ`).
4. Verify inbound projection re-syncs any v2-side changes made during the window.

**Cutover checkpoint (§34) — STOP and verify after each domain:** source of truth · write path ·
read path · projection direction · RLS · idempotency · legacy compatibility · realtime authority ·
telemetry · rollback. **Do not batch domains.**

Machinery rollback (if the mechanism itself must be withdrawn): `drop trigger
trg_compat_relationship_to_v2 …`, `trg_compat_support_request_to_v2 …`; the 0031 inbound projections
revert to their original always-on behavior once the `write_authority` guard rows read `v2` (they
already do). Additive; no data loss.

## N. Messaging readiness assessment (HELD — directive §23)

Messaging stays `CANONICAL_PARITY`. **0/0 live source messages is not production parity.** Gates
before any messaging move: send real controlled messages between authorized users; prove canonical
membership, sender identity, ordering, unread state, realtime, privacy, history semantics, and **no
unauthorized historical access**. v2 messaging remains authoritative. Not started.

## O. Canonical reminder-engine design / parity checklist (DESIGN ONLY — directive §24–§25)

Reminders stay `LEGACY_ONLY`; the v2 pg_cron scheduler is untouched and authoritative. **Booking/
appointment cutover (P3C-B) must keep enough legacy compatibility state that the v2 reminder engine
keeps firing** — verify end-to-end: canonical appointment confirmed → legacy compat session updated →
v2 confirmation/reminder → **3 expected reminders**, with no duplicate rows, reschedule reseeds,
cancellation suppresses, fixtures excluded, starting-now works. Future canonical scheduler design
requirements (do **not** build/cut over yet): configurable reminder kinds; due timestamps;
appointment-lifecycle checks; reschedule-safe replacement; cancellation suppression; idempotency;
`SKIP LOCKED` concurrency; delivery audit; fixture exclusion; canonical notifications; future channel
fanout. Cut over only when proven equivalent-or-stronger than v2.

## P. Final migration-state matrix (DB-VERIFIED — actual, not aspirational; directive §35)

| Domain | State (live now) | Write authority | Notes |
| --- | --- | --- | --- |
| Identity | CANONICAL_READ (authority) | canonical (read/authorization) | `people`/`role_assignments` authoritative |
| Relationships | **CANONICAL_READ** | **v2** | machinery + compat DB-VERIFIED; flip awaits HTTP gate |
| Support Requests | **CANONICAL_READ** | **v2** | machinery + compat DB-VERIFIED; flip awaits HTTP gate |
| Bookings | CANONICAL_READ | v2 | HELD → P3C-B (one transaction domain) |
| Appointments | CANONICAL_READ | v2 | HELD → P3C-B; 4 native rows intact |
| Notifications | CANONICAL_READ | v2 | follows P3C-B; in-app only, external OFF |
| Follow-Ups | CANONICAL_SHADOW (native) | canonical-native | activate after appointments |
| Messaging | CANONICAL_PARITY | v2 | HELD (§23) |
| Reminders | LEGACY_ONLY | v2 pg_cron | HELD (§24) |

Per §35, this reflects **actual verification results** — no domain was forced to the aspirational
`CANONICAL_WRITE` end-state. The matrix will advance domain-by-domain as each HTTP gate is cleared.

## Q. Recommended P4 frontend-integration plan (directive §41)

P3C-A leaves a **stable canonical service platform**: typed `coachingReads.ts` + `coachingWrites.ts`
over `recoveryos`, RLS-scoped, fixture-safe, with a proven per-domain write-authority switch. P4
recommendation:

1. **Build `apps/platform` against the service layer only** — `/vrcc`, `/coach`, `/navigator`,
   `/residences`, `/admin`. The frontend must never reference `mvp_*`, `v2_*`, `migration_state`, or
   projections (§41) — those are migration internals behind the repositories.
2. **Coach Workspace + Participant Support first** — they consume exactly the P3C-A/B domains
   (relationships, support requests, bookings/appointments, notifications), so shipping them **is**
   the real production write consumer that closes the HTTP-verification gap the Edge Function repoint
   only partially covers.
3. **Keep messaging and reminders as separate gated migrations** — do not hold up P4 for them; wire
   them through the same read/write service layer when their gates (§23/§24) are met.
4. **Per-domain cutover stays live during P4** — as each surface ships and is HTTP-verified, run the
   §M runbook to flip that domain to `CANONICAL_WRITE`; the old Grace Coaching UI keeps working
   through the compat projections until its consumers are migrated (§36 — v2 tables are **not**
   retired). MVP `vrcc.app` remains a separate later track (§37).

---

## Exit-criteria check (P3C-A, honest)

Machinery for one-writer-per-domain built and **DB-VERIFIED** (fixtures, rolled back) ✓; no circular
projection possible by construction ✓ (proven: 0 back-projection); canonical RLS protects new
functions ✓; fixtures excluded ✓; write service layer prepared + typed ✓ (CODE-VERIFIED); rollback +
reconciliation documented per domain ✓; source control matches production (0032 applied + committed)
→ on push. **Not yet met (by design, gated):** actual canonical write ownership live, DEPLOY/HTTP
verification, legacy-UI compatibility observed over HTTP. **No domain advanced to `CANONICAL_WRITE`.**
P3C-A = mechanism proven + writer prepared; live flips are the §M runbook for a staging/HTTP-capable
session. P3C-B (booking+appointments) and notifications remain the next gated steps; messaging and
reminders remain HELD.
