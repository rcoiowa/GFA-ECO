# P2 — Canonical Migration Plan (PREPARED, NOT EXECUTED)

**Date:** 2026-08-07 · **Status:** proposal only. **No P2 data mutation has been
performed.** This plan maps the hardened `v2_*` prototype layer onto the canonical
`recoveryos` schema, to be executed after P1's preconditions hold (they now do: active
clients attributed, legacy contained, create-meeting + notify-fanout secured, frontend
ownership decided, source captured; the one open item is the drift-error emitter, which
is out of coaching scope).

Per-entity verdict: **DIRECT MIGRATION** · **TRANSFORMATION REQUIRED** · **NO CANONICAL
EQUIVALENT (build new in `recoveryos`)** · **CANONICAL MODEL NEEDS EXTENSION**.

Identity note that shapes everything: canonical keys are **`bigint person_id`**
(`recoveryos.people`, `auth_user_id uuid` link); the v2 layer keys on **`uuid =
auth.users.id`**. Every mapping below carries an implicit `v2 uuid → people.person_id`
resolution via `people.auth_user_id`, with a `*_legacy_ref uuid` provenance column on
each new/extended canonical row (ADR-0003 + the Phase-8 ETL rule: dedup by verified
contact + human review, never by name).

## Mapping table

| v2 (source) | Canonical (target) | Verdict | Notes |
| --- | --- | --- | --- |
| `v2_profiles` (identity + role) | `recoveryos.people` / `person_profiles` / `role_assignments` | **TRANSFORMATION REQUIRED** | Split: identity → people (match on `auth_user_id`); `role` → `role_assignments` (scoped, soft-revoke — not a column); `display_name`/`county`/`phone` → people/person_profiles/contact_methods. Do **not** create a second person row. |
| `v2_coach_assignments` | `recoveryos.coaching_relationships` | **CANONICAL MODEL NEEDS EXTENSION** | Target exists but is thin: `participant_person_id, coach_person_id, organization_id, started_at, ended_at`. **Needs**: `status` (pending/active/paused/transferred/completed/ended), `assignment_source` (self_claim/admin_assign/request_pickup — proven in v2), `assigned_by_person_id`, `assignment_type/role` (primary/secondary/temporary), `end_reason`, `updated_at`; a **partial unique `(participant_person_id) where status='active' and assignment_type='primary'`** (the v2 one-active-index ports directly). The atomic claim/assign/transfer RPCs port almost verbatim (swap uuid→person_id, table name). |
| `v2_session_requests` (pre-claim / need) | **`recoveryos.support_requests` (+ `support_request_events`)** | **NO CANONICAL EQUIVALENT** | Build new. `service_types.category='support_request'` is seeded but has no table. Lifecycle: submitted→open→claimed/assigned→scheduled→resolved/closed/cancelled; aging thresholds. This is the "Support Need" half of the fused v2 row. |
| `v2_session_requests` (negotiation cols: preferred/suggested times, proposal_round, counter_proposed) | **`recoveryos.booking_requests` + `booking_proposals`** | **NO CANONICAL EQUIVALENT** | Build new. Proposals as immutable rows; one-click accept closes competitors atomically (the P0 `accept_session_proposal` invariants become the canonical accept RPC). Fixes v2's destructive `preferred_times` overwrite. |
| `v2_session_requests` (confirmed session) | `recoveryos.appointments` (**EXTEND**) + `recoveryos.service_events` | **CANONICAL MODEL NEEDS EXTENSION** | `appointments` today: person_id, provider_person_id, service_type_id, title, starts_at, ends_at, location_note, status, created_at. **Needs**: `organization_id, modality, platform, meeting_url, duration_minutes, timezone, requested_by, confirmed_by, confirmed_at, cancellation_reason, rescheduled_from_appointment_id, follow_up_due, service_event_id, icare_phase, exhibit_e_activity_code, grant_billable, updated_at`; widen `status` check to the full lifecycle. Completion emits a `service_events` row (ADR-0005) — the spine already has delivery_context/modality/outcome_status. **Do not create a parallel sessions table.** |
| `v2_direct_messages` | **`recoveryos.conversations` / `conversation_members` / `messages`** | **NO CANONICAL EQUIVALENT** | Build new (there is no canonical messaging). Membership derived from `coaching_relationships`; **preserve history across transfer** (fixes the v2 active-pair RLS that hides ended-relationship threads). Per-conversation Realtime channels. |
| `v2_notifications` | **`recoveryos.notifications` + `notification_deliveries`** | **NO CANONICAL EQUIVALENT** | Build new. Split domain event → notification record → per-channel delivery (the P1 `v2_notification_deliveries` audit/idempotency shape is the template). Consent gate via existing `consent_types.communications`. |
| `v2_session_reminders` + pg_cron sweep | reminder rows over `notification_deliveries` + canonical cron | **TRANSFORMATION REQUIRED** | Same `SKIP LOCKED` idempotent sweep; unique `(appointment, kind, channel)`; reschedule-safe reseed (already implemented in v2 P0). |
| `coach_meeting_rooms` + `provision_session_meeting` | meeting-provider abstraction on `appointments.meeting_url` | **TRANSFORMATION REQUIRED** | Providers `manual`/`ooma_room`/`zoom`/`phone`/`in_person`; per-appointment URL stays on the appointment; the hardened `provision_session_meeting` authorization/idempotency logic ports directly. |
| `v2_session_feedback` + Gate-19B continuity fields | **`recoveryos.follow_ups`** + a session-feedback table keyed to `appointments`/`service_events` | **NO CANONICAL EQUIVALENT** | Build new. Migrate the mvp continuity loop (`current_next_step`, `next_follow_up_due`, `last_contact_at`) into follow-ups + connection-health signals — product-critical, do not lose. |
| `gfa_ui.availability_slots` (30 dormant rows) | `recoveryos.availability_rules` / `availability_exceptions` | **NO CANONICAL EQUIVALENT** | Build new; evaluate reuse of the dormant shape first. |

## Sequencing (behind parity, prototype untouched until cut)

1. **P2.1 Foundation:** extend `coaching_relationships` + `appointments`; build
   `support_requests` (+events); port claim/assign/transfer/accept RPCs to person_id;
   RLS with definer helpers; add `Appointment`/`CoachingRelationship` domain types
   (currently missing from `packages/domain`).
2. **P2.2 Connection:** canonical pool + claim + My Participants in the Coach Workspace
   (`apps/platform`), replacing the static ConnectPage; progressive-disclosure read
   models (the P1 `list_open_requests` / `get_my_participants` shapes become the
   canonical views).
3. **P2.3 Messaging / Notifications / Scheduling / Sessions / Reminders:** build the new
   canonical tables; wire `apps/platform` services.
4. **P2.4 Data migration:** backfill v2 → canonical with `*_legacy_ref` provenance;
   volumes are tiny (single-digit rows live) so the gate is behavioral parity, not scale.
5. **P2.5 Cutover + deprecate:** per `canonical-frontend-decision.md` — retire the
   coaching Edge Function, then the mvp path, then repoint `vrcc.app`.

## Do-not rules carried into P2

- Do not force a mapping where semantics differ (support-need vs negotiation vs session
  are three tables, not one — the whole point of splitting `v2_session_requests`).
- Do not delete any `v2_*` table until its canonical replacement is parity-tested and
  the reads are cut over (strangler; ADR-0011).
- Every new canonical table ships RLS in the same migration (0010 auto-exposes new
  tables to `authenticated`); definer helpers not cross-table policy joins (0020);
  `service_events` row on session completion (ADR-0005); append-only consent (ADR-0009).

**No P2 migration will be applied without an explicit go-ahead.**
