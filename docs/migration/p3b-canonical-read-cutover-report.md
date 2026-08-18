# P3B — Canonical Read Cutover: Report (Deliverables A–J)

**Date:** 2026-08-07 · **Project:** `ykykeioydvtxpyreshhs` · **Stage transition:**
CANONICAL_PARITY → **CANONICAL_READ** (proven read domains). **No write cutover, no
legacy retirement, no external channels, no UI rewrite.** Migrations `0030`, `0031`
applied live + committed; typed read services added to `packages/data-access`.

Verification labels: **DB-VERIFIED** (proven by SQL against the live DB) · **CODE-VERIFIED**
(compiles/reviewed, not yet exercised over HTTP) · **DEPLOY-VERIFIED** · **HTTP-VERIFIED**.

## Honest framing

There is **no production consumer of canonical coaching reads yet** (`apps/platform` has
no Coach Workspace; `ConnectPage` is static). So "read cutover" here means establishing
the **canonical read authority**: a typed read service layer over `recoveryos`, kept
live-synced to v2 writes by one-way projection, with fixtures excluded — the layer the
future frontend consumes. It does **not** flip a live user-facing read that does not
exist. The remaining **HTTP-VERIFIED** step lands when a consumer ships (P4).

## A. Canonical read cutover report

- **Typed read service layer** (`packages/data-access/src/repositories/coachingReads.ts`,
  CODE-VERIFIED): `getMyCoach`, `getMyParticipants`, `getMySupportRequests`,
  `getOpenSupportRequestPool` (fixture-aware RPC), `getMyUpcomingAppointments`,
  `getCoachUpcomingAppointments`, `getMyNotifications`, `getMyConversations`,
  `getConversationMessages`. Read-only; RLS-scoped by JWT→person_id; reads `recoveryos`
  only (never legacy tables). This is the service boundary the directive requires —
  migration mechanics live below the presentation layer, no `if canonical else v2`
  scatter.
- **Live projection** (migration `0031`, DB-VERIFIED): one-way v2→canonical AFTER triggers
  keep canonical reads current with ongoing v2 writes. Verified: a v2 insert projects a
  canonical `support_request` (status `open`); a v2 status update propagates (→
  `cancelled`); unmapped identities skip-and-log. **Exception-safe** — a projection error
  is logged to `backfill_log` and swallowed; it can never abort the v2 write.
- **Fixture-aware production reads** (migration `0030`): `list_open_support_requests()`
  and `list_active_coaches()` exclude test fixtures.

## B. Domain migration-state matrix (DB-VERIFIED)

| Domain | Stage | Notes |
| --- | --- | --- |
| Identity | **CANONICAL_READ** | people/role_assignments are read authority; v2_profiles.role is not authority |
| Relationships | **CANONICAL_READ** | coaching_relationships; 0 live source, machinery + projection proven |
| Support Requests | **CANONICAL_READ** | 1/1 exact-semantic; fixture-aware pool |
| Bookings | **CANONICAL_READ** | 0 live source; RPC/projection proven |
| Appointments | **CANONICAL_READ** | 4 native rows intact; projection on confirm ready |
| Notifications | **CANONICAL_READ** | 6/6 exact-semantic; in-app only, external delivery OFF |
| Messaging | CANONICAL_PARITY | 0 live source — **not** claimed as production parity on 0/0; needs real messages first |
| Follow-ups | CANONICAL_SHADOW (native) | canonical-native; no legacy source |
| Reminders | **LEGACY_ONLY** | v2 pg_cron reminder engine untouched and authoritative |

## C. Fixture classification / exclusion report

First-class `recoveryos.person_classification` (production | test_fixture). Cohort:
**10 production** (person 4–9, 11–14) · **4 test_fixture** (person 10/15/16/17 — the
`@vrcc-v2.test` demo accounts). Fixture status is a canonical record, **not** inferred
from email domain in application code. Exclusions in force:
- **Pool:** `list_open_support_requests()` excludes fixture participants — DB-VERIFIED: a
  real coach sees **0** open requests (the only one belongs to a fixture); reclassifying
  that participant to production makes it visible (**1**), proving the exclusion works.
- **Coach lists:** `list_active_coaches()` excludes fixtures.
- **Authority:** demo accounts hold **0** privileged canonical roles (DB-VERIFIED); their
  historical v2 `coach`/`navigator`/`housing_manager` values were never granted.
- **External delivery:** must check `is_production_person` before any future send —
  recorded in the notify contract; external channels remain OFF regardless.
Not deleted (locked decision): fixtures remain as migration/security-test evidence.

## D. Real-account verification report (DB-VERIFIED, rolled back)

- Participant (Demo Participant, person 10) reads: 1 support request, 2 notifications, 0
  foreign rows — correctly scoped.
- Coach (real person granted coach in a rolled-back tx): pool fixture-excluded; claim/
  accept RPC behavior atomic + idempotent (from P3A, same identities).
- Identity authorization: participant self-role-grant **BLOCKED**; demo accounts non-
  privileged; `v2_profiles.role` is not authority.
Coach/admin verification used a real person temporarily granted a role in a rolled-back
transaction (no demo fixture was used as a production coach, and no permanent privileged
grant was made).

## E. Canonical-vs-legacy fallback report

No production consumer reads canonical yet, so **no fallback path is active**. The
prescribed pattern for when a consumer ships: canonical read → on unexpected miss/
mismatch, record a parity-failure event (domain, record key, reason) + increment a
counter, then temporary observable legacy fallback — never silent, never permanent. The
`backfill_log` table already provides the structured sink (projection skips/errors are
logged there today). No permanent hidden fallback exists.

## F. Realtime authority map

No canonical realtime subscriptions were added in P3B (no consumer). When the frontend
ships, each domain gets **one** realtime read authority: messages filtered by
`conversation_id` (member), notifications by `recipient_person_id`, pool by staff. The v2
Edge Function retains its own v2 realtime until its cutover; the temporary split (canonical
reads, v2 realtime) must not persist past P3C. Documented, not yet built.

## G. Parity telemetry report

Telemetry sink in place: `recoveryos.backfill_log` records `projection_*` skips
(unmapped) and errors (sqlerrm), per domain, with `legacy_ref` keys — no sensitive
participant content. Counters available: source/mapped/skipped/exception per domain.
Recommended additional counters at consumer time: `canonical_read_success`,
`canonical_missing_expected_record`, `legacy_fallback_used`, `duplicate_projection_detected`,
`fixture_excluded`. Live `backfill_log` currently shows **0 projection errors**.

## H. Rollback verification

- **Read authority:** `update migration_state set stage='CANONICAL_PARITY'` per domain —
  no runtime effect while no consumer reads canonical; low-risk.
- **Projection triggers:** `drop trigger trg_project_v2_* on public.v2_*` — removes sync;
  v2 writes and reads are entirely unaffected (verified: projection is exception-isolated).
- **Fixture classification:** additive table; drop or reclassify freely.
- **Service layer:** additive TS; unused until a consumer imports it.
Because **write authority never left v2**, every P3B step is reversible with no data loss.

## I. Remaining canonical-write blockers (for P3C)

1. **No canonical write consumer** — the v2 Edge Function still writes v2_*; P3C needs the
   canonical write path wired into a consumer (or the Edge Function repointed).
2. **Projection direction reverses at write cutover** — when canonical becomes write-
   authoritative, the one-way triggers (v2→canonical) must be replaced by canonical→v2
   compatibility projection (single direction; never circular).
3. **Reminders** stay on v2 until a canonical reminder engine proves equivalent reliability
   (3 semantics, no reschedule stacking, cancellation suppression, idempotent dispatch, no
   duplicate external delivery).
4. **Messaging** needs real-user message parity before even read cutover.
5. **HTTP-VERIFIED** gap — black-box tests from an unrestricted environment (this env's
   network policy 403s `*.supabase.co`).
6. **Demo-data hygiene** — owner decision on whether to exclude/clean fixtures before real
   production cutover (they are excluded from production semantics now, not deleted).

## J. Recommended P3C sequence (PREPARE, not execute)

Per-domain write cutover, read-before-write already satisfied for the CANONICAL_READ
domains: 1. Relationships → 2. Support Requests → 3. Bookings → 4. Appointments →
5. Notifications (in-app) → 6. Messaging (after real-message parity) → 7. Reminders
(after a proven canonical scheduler). Each domain: switch the write path to the canonical
RPC, reverse the projection to canonical→v2 compatibility, observe, then retire the v2
write for that domain. Exactly one authoritative write direction per domain at all times.
**P3C requires explicit authorization and was not begun.**

## Exit-criteria check (P3B)
Selected domains have a canonical read authority (service layer) ✓; canonical authorization
is authoritative for those reads (people/role_assignments, v2 role rejected) ✓; legacy write
paths untouched ✓; projections keep canonical synced ✓; no duplicate UI state (single
consumer contract, crosswalk-keyed) ✓; fallback zero/understood ✓; fixtures excluded from
production semantics ✓ (DB-VERIFIED); real-account reads verified ✓ (DB-VERIFIED); rollback
documented per domain ✓; no domain advanced to canonical write ✓.
