# P2 — Canonical Foundation + Shadow Migration: Report (Deliverables A–O)

**Date:** 2026-08-07 · **Branch:** `claude/grace-coaching-audit-b0fyhq` · **Project:**
`ykykeioydvtxpyreshhs` · **Stage:** CANONICAL_SHADOW (additive; no cutover, no drops,
no external channels).

Migrations applied live + committed this session (canonical `recoveryos` chain):
`0025_coaching_domain_tables`, `0026_coaching_domain_rls`, `0027_coaching_domain_rpcs`,
`0028_coaching_backfill_fn`. Legacy `v2_*`/`mvp_*` untouched. Verified P0/P1 state preserved.

## A. Canonical domain model (new + extended `recoveryos` entities)

```
people ── role_assignments                         (existing identity + authz)
  │
  ├── v2_identity_map            (NEW — deterministic v2-uuid ↔ person_id crosswalk)
  ├── coaching_relationships     (EXTENDED — status, relationship_type, is_primary,
  │                               assigned_by_person_id, assignment_source, end_reason,
  │                               updated_at, legacy_ref; one-active-primary unique index)
  ├── support_requests           (NEW — the "need") ── support_request_events (NEW)
  ├── booking_requests (NEW) ── booking_proposals (NEW)    (scheduling negotiation)
  ├── appointments               (EXTENDED — modality, meeting_provider, meeting_url,
  │                               timezone, requested/confirmed_by, confirmed_at,
  │                               rescheduled_from, cancelled_at, follow_up_due,
  │                               service_event_id, booking/support/relationship links,
  │                               widened status lifecycle, legacy_ref)
  │                                   └── service_events (existing spine — delivered service)
  ├── conversations ── conversation_members ── messages   (NEW — membership-scoped)
  ├── notifications ── notification_deliveries            (NEW — event/record/channel split)
  └── follow_ups                 (NEW — continuity, first-class not a nullable timestamp)

migration_state (NEW — per-domain state machine)   backfill_log (NEW — reconciliation)
```

Conventions honored: bigint identity keys (ADR-0004); person_id (ADR-0003, no second
person model); RLS enabled on every new table in the same migration (0010 auto-grants
`authenticated`, so RLS is the only gate); SECURITY DEFINER helper functions instead of
cross-table policy joins (0020 recursion lesson); `notify pgrst, 'reload schema'` after
DDL; `service_events` remains the delivered-service spine (ADR-0005).

## B. Source → canonical semantic mapping (v2_session_requests decomposed)

`v2_session_requests` stops being responsible for everything. Its fields split:

| v2_session_requests field | Canonical home | Notes |
| --- | --- | --- |
| participant, session_type, topic, mode, status(pre-schedule) | `support_requests` (person_id, request_type, focus, preferred_modality, status) | the "need" |
| coach_id, claimed_at | `coaching_relationships` (via claim RPC) + `support_requests.claimed_by/coaching_relationship_id` | the relationship |
| preferred_times, suggested_times, proposal_round, counter_proposed | `booking_requests` + `booking_proposals` | negotiation, non-destructive (immutable proposal rows) |
| scheduled_at, meeting_url, confirmed_at, confirmed_by, status(confirmed) | `appointments` (extended) | the session |
| (completion) | `appointments.status='completed'` → `service_events` row | delivered service |

**Status map (documented, not name-copied):**
v2 `requested/times_suggested/counter_proposed` → support_request `open`;
v2 `confirmed` → support_request `scheduled` + an `appointments` row `confirmed`;
v2 `completed` → support_request `resolved` (+ future `service_events`);
v2 `cancelled` → `cancelled`. appointments lifecycle widened to
`requested/scheduled/confirmed/in_progress/completed/cancelled/no_show/rescheduled`.

## C. Identity crosswalk strategy

`recoveryos.v2_identity_map(v2_profile_id uuid, person_id, confidence, mapped_via)`.
Deterministic rule: `v2_profiles.id == auth.users.id == people.auth_user_id` → **exact**.
No mapping by name or mutable email. Classes: `exact` / `high` / `ambiguous` /
`unmapped`. **Only exact/high are migrated;** ambiguous/unmapped are recorded and
skipped, never guessed.

**Live result (VERIFIED):** 10 v2 profiles → **2 exact, 8 unmapped**. The 8 are auth
users who never went through `ensure_person_for_current_user`, so they have no canonical
`people` row. **Consequence:** the live v2 coaching activity (1 support request, 6
notifications) belongs to unmapped participants and is **quarantined**, not projected —
see K/L. This is a real precondition for a future real migration: those v2 auth users
must be provisioned into `people` first. It is a data-cohort gap, not a logic gap — the
projection machinery is proven correct against mapped identities (J).

## D. Migration state machine (`recoveryos.migration_state`)

Stages: `LEGACY_ONLY → CANONICAL_SHADOW → CANONICAL_PARITY → CANONICAL_READ →
CANONICAL_WRITE → LEGACY_READ_ONLY → LEGACY_RETIRED`. Tracked **independently** per
domain (identities, relationships, support_requests, bookings, appointments, messages,
notifications, follow_ups). All currently at **CANONICAL_SHADOW**. No domain advances
without passing its parity gate; no global switch. Retirement stages are gated on the
unidentified-drift-client (P8), not reachable in P2.

## E. Compatibility strategy

**Option D — Controlled backfill + read cutover** is chosen for P2. During shadow:
the single authoritative write direction is **legacy (v2_\*)**; canonical is populated
by the **idempotent backfill projection only** (one direction: v2 → canonical). No dual
-write, **no bidirectional sync triggers** (explicitly avoided to prevent hidden loops).
When P3 begins, the flip is: canonical becomes authoritative for writes and a thin
legacy projection (if still needed) runs one-way canonical → v2 until legacy retires.
Exactly one authoritative direction at every stage, documented in `migration_state`.

## F. Additive SQL migrations
`0025` tables + extends + indexes (RLS-enabled deny-all on create). `0026` helpers +
RLS policies. `0027` transactional RPCs. `0028` idempotent backfill function. All
additive; rollback notes in each file; `IF NOT EXISTS` / `legacy_ref` guards make them
safe to re-run.

## G. RLS
Every new table: participant sees own; support staff see the open pool + rows they own
(progressive disclosure — pool summary carries only decision fields); admin/navigator
see all; messaging is **membership-scoped** via `conversation_members` (ending a
relationship neither grants nor revokes history — access is explicit membership, not
relationship inference); notifications recipient-only; migration ops admin-only. Writes
for claim/assign/confirm are **RPC-only** (no broad INSERT/UPDATE policy), so canonical
confirmation is server-authoritative by construction.

## H. Canonical transactional RPCs (adapted from verified P0)
`claim_support_request(bigint)`, `assign_participant_coach(bigint,bigint,text)`,
`accept_booking_proposal(bigint)` — person_id-keyed, SECURITY DEFINER, `FOR UPDATE`
locking, one-winner via the one-active-primary unique index, graceful jsonb loser
responses, idempotent retries, assignment history preserved (transfer sets
`status='transferred'`, keeps the row).

## I. Backfill
`recoveryos.backfill_coaching_shadow()` — rerunnable, deterministic, logged, non-
destructive; per-domain source/mapped/skipped counts to `backfill_log`; exceptions
recorded, never discarded. Preserves original ids in `legacy_ref`.

## J. Parity test suite (VERIFIED, rolled back)
With identities mapped (synthetic remap of the real source rows onto real people):
- **Backfill parity:** 1 support request + 6 notifications project; `request_type ==
  v2 session_type`; status maps per the table above.
- **Claim:** `claimed` → `already_yours` (idempotent) → `not_authorized` (non-staff);
  exactly **1** active primary relationship.
- **Accept booking:** `confirmed` → `already_confirmed` (idempotent); competing
  proposals closed (0 active); exactly **1** appointment created.
- **RLS:** participant sees own support request + messages; unrelated participant sees
  **0** of each; coach sees the open pool. Messaging membership-scoped.

## K. Reconciliation report (live, VERIFIED — real backfill run)
| Domain | Source | Mapped | Skipped/Unmapped |
| --- | --- | --- | --- |
| identities | 10 | 2 (exact) | 8 (unmapped — no person row) |
| relationships | 0 | 0 | 0 |
| support_requests | 1 | 0 | 1 (participant unmapped) |
| messages | 0 | 0 | 0 |
| notifications | 6 | 0 | 6 (recipient unmapped) |
Canonical appointments: 4 pre-existing, **untouched**. No exceptions were silently
dropped — every skip is counted and reasoned in `backfill_log`.

## L. Exception report
- **8 v2 profiles UNMAPPED** — auth users without a canonical `people` row. Provision
  via `ensure_person_for_current_user` (on their next canonical sign-in) or an admin
  person-backfill before their coaching data can migrate. Do not guess identities.
- **1 support_request + 6 notifications QUARANTINED** — belong to unmapped participants;
  will project automatically once their identities become `exact`.
- No ambiguous (name/email-collision) mappings arose in this dataset.

## M. Canonical frontend contracts
See `docs/architecture/canonical-coaching-frontend-contracts.md` — query contracts, RPC
signatures + DTOs, authorization expectations, realtime channels, error codes. The
future React app consumes these; it needs no knowledge of migration internals.

## N. Recovery Residence projection contract
See the residence-projection note in `RecoveryResidenceOS` (updated) +
`canonical-frontend-decision.md`: residence surfaces read the **same**
`coaching_relationships` / `appointments` / `conversations` rows under consent- and
role-scoped policies; **no** `residence_coach_assignments` / `residence_sessions` /
`residence_messages`. Residence is a projection, not a copy.

## O. Rollback / cutover plan
See `docs/migration/p2-rollback-cutover-plan.md`. Summary: P2 is fully reversible
(drop the new tables + extension columns; each migration carries rollback SQL). Cutover
to canonical reads/writes is **P3**, gated on: (1) parity report per domain, (2) identity
provisioning for the unmapped cohort, (3) explicit authorization. No cutover in P2.

## Governing-rule check
Canonical domain built alongside the live v2 engine; every working production experience
(mvp coaches, canonical mobile users, Grace Coaching prototype, cron) preserved; nothing
legacy dropped, renamed, or repurposed; the unidentified drift client blocks retirement
(P8), not this additive construction. Migration is deliberate and reversible.
