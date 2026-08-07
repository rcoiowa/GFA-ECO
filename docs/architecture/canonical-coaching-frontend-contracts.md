# Canonical Coaching — Frontend Contracts (P2 deliverable M)

**Date:** 2026-08-07 · **Schema:** `recoveryos` (PostgREST profile `recoveryos`) ·
**Status:** contracts for the future React 19 + TS canonical frontend (P4). The frontend
consumes these; it needs no knowledge of the v2→canonical migration. All access is
person_id-scoped and RLS-enforced — the client never sends identity, it comes from the JWT.

Types will be generated with `supabase gen types typescript --project-id
ykykeioydvtxpyreshhs --schema recoveryos` at P4; the shapes below are the stable contract.

## Authorization model

- Identity: JWT → `auth.users.id` → `people.auth_user_id` → `current_person_id()`. Never
  a client-supplied person id.
- Roles: `role_assignments` via `has_role()`; capability, not route. `is_support_staff()`
  = coach/navigator/program_manager/administrator/system_administrator; `is_admin_staff()`
  = navigator/program_manager/administrator/system_administrator.
- Every privileged state transition is a `recoveryos` RPC (below). Direct table writes for
  claim/assign/confirm are intentionally not permitted by RLS.

## Read contracts (PostgREST, RLS-scoped)

| Purpose | Query | Visible to |
| --- | --- | --- |
| My support requests | `GET support_requests?person_id=eq.<me>` (RLS auto-scopes) | participant (own) |
| Open request pool | `GET support_requests?status=in.(submitted,open)` | support staff (pool fields only) |
| My participants | `GET coaching_relationships?coach_person_id=eq.<me>&status=eq.active` | coach (involved) |
| Upcoming appointments | `GET appointments?status=in.(confirmed,scheduled)&order=starts_at` | participant (own) / coach (provider) |
| A conversation's messages | `GET messages?conversation_id=eq.<id>&order=created_at` | conversation members only |
| My notifications | `GET notifications?order=created_at.desc` | recipient only |
| My follow-ups (staff) | `GET follow_ups?assigned_person_id=eq.<me>&status=eq.open` | assigned staff / admin |

Progressive disclosure: the open pool exposes only decision fields (request_type,
preferred_modality, focus, county via a future view); it does not expose participant
contact or history before a relationship exists — mirror the P1 pattern
(`list_open_requests` / `get_my_participants`) with canonical equivalents at P3.

## RPC contracts (`recoveryos` schema, POST /rpc/<name>)

All return `jsonb { ok: boolean, code: string, message?: string, ...ids }`. Never raw SQL
errors. Idempotent where noted.

| RPC | Args | Success codes | Failure codes |
| --- | --- | --- | --- |
| `claim_support_request` | `p_support_request_id bigint` | `claimed` (+relationship_id), `already_yours` (idempotent) | `not_authorized`, `not_found`, `already_claimed`, `not_open`, `participant_has_coach` |
| `assign_participant_coach` | `p_participant_person_id bigint, p_coach_person_id bigint, p_reason text?` | `assigned` (+relationship_id), `already_assigned` | `not_authorized`, `not_a_coach`, `participant_has_coach`, `conflict` |
| `accept_booking_proposal` | `p_proposal_id bigint` | `confirmed` (+appointment_id), `already_confirmed` (idempotent) | `not_authorized`, `not_found`, `own_proposal`, `confirmed_other_time`, `not_open`, `stale_proposal`, `no_provider` |

Meeting provisioning at P3 will follow the P1 `provision_session_meeting` contract
(server-authoritative, coach-ownership, idempotent, no public fallback) adapted to
`appointments`.

## DTOs (stable field sets the client can rely on)

- **SupportRequest**: id, person_id, request_type, focus, preferred_modality, status,
  urgency, claimed_by_person_id, coaching_relationship_id, created_at.
- **CoachingRelationship**: id, participant_person_id, coach_person_id, status,
  relationship_type, is_primary, assignment_source, started_at, ended_at.
- **BookingRequest**: id, participant_person_id, provider_person_id, status, modality,
  duration_minutes, appointment_id. **BookingProposal**: id, booking_request_id,
  proposed_by_person_id, proposed_start, is_active, accepted.
- **Appointment**: id, person_id, provider_person_id, status, starts_at, ends_at,
  modality, meeting_provider, meeting_url, timezone, confirmed_at.
- **Message**: id, conversation_id, sender_person_id, body, read_at, created_at.
- **Notification**: id, kind, title, body, link_path, read_at, created_at.

These snake_case shapes must be mirrored into `packages/domain/src/entities.ts` at P4
(single source of truth; do not fork per experience). `Appointment` and
`CoachingRelationship` interfaces are currently missing there and should be added.

## Realtime channels (scope by authorized relationship, not whole tables)

- Messages: subscribe to `messages` filtered `conversation_id=eq.<id>` for conversations
  the user is a member of.
- Notifications: `notifications` filtered `recipient_person_id=eq.<me>`.
- Pool (coach): `support_requests` filtered `status=eq.open` (staff only).
Do not subscribe to entire tables (the v2 anti-pattern).

## Error-state expectations

Clients render `message` when present; map `code` to UX (e.g. `already_claimed` →
"Another coach just picked this up"). Never surface SQL/PostgREST internals. Auth failures
(`not_authorized`, `unauthenticated`) route to sign-in / a gentle "not available" state.
