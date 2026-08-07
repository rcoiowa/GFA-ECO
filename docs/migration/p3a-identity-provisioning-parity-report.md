# P3A — Identity Provisioning + Live-Cohort Parity: Report (Deliverables A–K)

**Date:** 2026-08-07 · **Project:** `ykykeioydvtxpyreshhs` · **Stage transition:**
CANONICAL_SHADOW → **CANONICAL_PARITY** (for proven domains). **No read/write cutover
performed.** Migration `0029_person_provisioning` applied live + committed. Legacy
`v2_*`/`mvp_*` untouched; v2 reminder cron untouched; external channels off.

## A. Identity provisioning report

The 8 v2 profiles lacking a canonical `people` row were inventoried against verified
source (auth.users email + metadata, existing people by auth_user_id, contact_methods
email matches, coaching activity). **No existing-person conflict, no email collision, no
duplicate auth_user_id** for any of the 8. Classification:

| v2 profile (email) | Kind | Identity class | Provisioned person_id | Coaching activity |
| --- | --- | --- | --- | --- |
| demo-participant@vrcc-v2.test | demo/test | SAFE_AUTOPROVISION | 10 | 1 request, 2 notifs |
| oryouwannagohome@gmail.com (Jaquay Collins) | real | SAFE_AUTOPROVISION | 11 | none |
| pinklollipop1636@gmail.com (Stevie Hart) | real | SAFE_AUTOPROVISION | 12 | none |
| shawnabyers1979@gmail.com (shawna vine) | real | SAFE_AUTOPROVISION | 13 | none |
| sjfor0123@yahoo.com (Samantha Formaro) | real | SAFE_AUTOPROVISION | 14 | none |
| demo-coach@vrcc-v2.test | demo/test | SAFE_AUTOPROVISION | 15 | 2 notifs |
| demo-manager@vrcc-v2.test | demo/test | SAFE_AUTOPROVISION | 16 | 1 notif |
| demo-navigator@vrcc-v2.test | demo/test | SAFE_AUTOPROVISION | 17 | 1 notif |

Provisioning used `recoveryos.provision_person_from_auth(auth_user_id, first, last,
v2_profile_id)` — idempotent (verified: rerun returns `created:false`), auditable
(logged to `backfill_log` domain `identity_provisioning`), definer, admin/service-only.
Names derived from verified auth metadata (`full_name` → display_name → email local).
Each got a `person_profiles` row (defaults) mirroring `ensure_person_for_current_user`.

**Data-hygiene note (owner decision, not taken here):** 4 of the 8 are `@vrcc-v2.test`
demo fixtures and carry the only "active" coaching data. Parity below is genuinely proven
on the active cohort, but whether those demo accounts should be excluded/cleaned before a
real production cutover is an owner call — not something this phase decided or silently did.

## B. Role mapping report (SECURITY-CRITICAL)

**Creating identity is deterministic; granting a role is a security operation.** The
provisioning function grants **only the baseline `participant` role** and **never reads
v2_profiles.role to grant a privileged role.** Verified: `privileged_granted_to_new = 0`.

| v2 role | Canonical | Classification | Action |
| --- | --- | --- | --- |
| participant | participant | DIRECT_MAP | granted (baseline) to all 8 |
| coach | coach | **AMBIGUOUS_ROLE** | **HELD** — demo-coach (person 15) got participant only |
| navigator | navigator | **AMBIGUOUS_ROLE** | **HELD** — demo-navigator (person 17) got participant only |
| housing_manager | residence_manager | **TRANSFORM + AMBIGUOUS_ROLE** | **HELD** — demo-manager (person 16) got participant only |

Rationale: `v2_profiles.role` is profile text; these three are demo/test accounts. Granting
canonical coach/navigator/residence_manager authority is deferred to an explicit,
evidence-based admin action. Verified in test: a participant **cannot** self-insert a
role (`role_assignments` has no self-insert policy) — `self_role_grant = BLOCKED`.

## C. Updated identity crosswalk

`recoveryos.v2_identity_map`: **10/10 exact, 0 unmapped, 0 ambiguous.** Every source
identity resolves `v2_profile_id → auth_user_id → person_id` at `exact` confidence via
`auth_user_id` (deterministic). No mapping by name or mutable email.

## D. Live-cohort shadow reconciliation (VERIFIED)

Backfill rerun after provisioning:

| Domain | Source | Projected | Exact-semantic | Duplicates | Unmapped |
| --- | --- | --- | --- | --- | --- |
| identities | 10 | 10 | 10 | 0 | 0 |
| relationships | 0 | 0 | — | 0 | 0 |
| support_requests | 1 | 1 | 1 (participant + request_type==session_type + status map) | 0 | 0 |
| bookings | 0 | 0 | — | 0 | 0 |
| appointments (v2→canonical) | 0 | 0 | — | 0 | 0 |
| messages | 0 | 0 | — | 0 | 0 |
| notifications | 6 | 6 | 6 (recipient + title + body) | 0 (delivery dups 0) | 0 |

Canonical appointments hold 4 **pre-existing native** rows (from `apps/platform`),
untouched. Backfill remains idempotent (legacy_ref-guarded).

## E. Exception report
**Zero unmapped, zero skipped, zero duplicates, zero silent skips** for the active cohort.
The only deliberately-withheld items are the **3 privileged role grants** (B), classified
`AMBIGUOUS_ROLE` and recorded, pending explicit authorization — an intentional security
hold, not a migration failure. No `IDENTITY_UNMAPPED` / `AMBIGUOUS_PARTICIPANT` /
`CANONICAL_CONFLICT` / `DUPLICATE_SOURCE` cases arose.

## F. Canonical RPC parity report (real cohort, rolled back)
Against real provisioned people (Demo Participant 10, Demo Coach 15 [coach role granted
only inside the rolled-back tx], Jaquay 11), using the **real projected** support request:
- Claim: `claimed` → `already_yours` (idempotent) → `not_authorized` (participant); exactly
  **1** active primary relationship.
- Booking accept: `confirmed` → `already_confirmed` (idempotent); exactly **1** appointment.

## G. Canonical RLS verification
- Participant self-role-grant: **BLOCKED**.
- Participant sees own support request (1); unrelated participant sees **0**.
- Read-contract scoping: Demo Participant sees exactly their 1 request + 2 notifications;
  `foreign_support_requests_visible = 0`.

## H. Read-contract verification
Verified resolvable + RLS-scoped for the real cohort: my_support_requests, my_notifications,
my_appointments, my_conversations, my_bookings (participant); pool + roster + assign RPCs
(staff). Full contract surface: `docs/architecture/canonical-coaching-frontend-contracts.md`.

## I. Domain-by-domain cutover-readiness matrix

| Domain | Stage | Readiness |
| --- | --- | --- |
| Identity | CANONICAL_PARITY | **READY** |
| Relationships | CANONICAL_PARITY | **READY** (0 live source; machinery proven) |
| Support Requests | CANONICAL_PARITY | **READY** |
| Booking | CANONICAL_PARITY | **READY** (0 live source; machinery proven) |
| Appointments | CANONICAL_PARITY | **READY** (v2→canonical 0 source; native rows intact) |
| Notifications | CANONICAL_PARITY | **READY** (canonical records; external delivery stays OFF) |
| Messaging | CANONICAL_PARITY | **READY (no live data)** — membership-scoped RLS proven; revisit if v2 DMs appear |
| Follow-ups | CANONICAL_SHADOW | net-new; no legacy source |
| Reminders | LEGACY_ONLY | **REMAIN_V2_TEMPORARILY** — working v2 cron untouched (directive 19) |

## J. Proposed P3B cutover sequence (NOT executed)
One domain at a time, read-before-write, each gated on its own soak:
1. Identity → 2. Relationships → 3. Support Requests → 4. Scheduling (bookings) →
5. Appointments → 6. Notifications (in-app only) → 7. Messaging → 8. Follow-ups.
Reminders stay on v2 until a canonical reminder engine proves equivalent reliability
(3 reminder semantics, no reschedule stacking, cancellation suppression, idempotent
dispatch, no duplicate external delivery). Each step: prove parity → switch selected
internal reads → observe (instrument parity failures, no silent empty states; controlled,
observable legacy fallback only) → only then consider canonical writes with exactly one
authoritative write direction (never circular dual-write).

## K. Rollback procedure per domain
- **Identity provisioning:** the 8 `people` rows (10–17) + their participant role +
  crosswalk entries can be removed; because they were `participant`-only and hold no
  privileged authority, removal is low-risk. (They are also legitimate canonical
  identities — retaining them is equally valid; provisioning did not alter any legacy row.)
- **Domain state:** `update recoveryos.migration_state set stage='CANONICAL_SHADOW'` for
  any domain to revert readiness. No production reads/writes point at canonical, so
  reverting a stage has no runtime effect in P3A.
- **Shadow data:** `truncate` the canonical coaching tables and re-run
  `backfill_coaching_shadow()` to rebuild deterministically (idempotent).
- Full schema rollback: `p2-rollback-cutover-plan.md` (drop new tables + extension columns).

## Gate status
P3A gate **met** for identity/relationships/support_requests/bookings/appointments/
notifications/messaging: active cohort mapped 10/10; provisioning safe; roles verified
(privileged held); projection rerun; reconciliation exact; RPC + RLS pass; zero
unresolved identity ambiguity. **P3B (read cutover) requires explicit authorization** and
was not begun. Reminders remain v2-authoritative; external channels remain off; the
public VRCC frontend is unchanged.
