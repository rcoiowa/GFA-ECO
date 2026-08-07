# Recovery Support Engine — Phase 0 Audit & Migration Map

Owner directive (2026-08-07): audit the existing Grace Coaching prototype
before changing architecture, then mature it into the canonical RecoveryOS
Recovery Support Engine per the attached specification. This document is the
Phase 0 deliverable: existing-implementation evidence, workflow traces,
defect/risk findings, and the KEEP → EXTEND → MIGRATE → DEPRECATE → REMOVE
map. No schema or code was changed in this phase.

Verification level of each claim is marked: **REPO-VERIFIED** (read from
source), **LIVE-VERIFIED** (probed against the live database), or UNVERIFIED.

## 1. Where the prototype actually lives

The behaviors the directive lists do not live in one app. They are split
across **two prototypes**, both pointed at the **same live Supabase project
as the canonical platform** (`ykykeioydvtxpyreshhs`) — three parallel data
models in one database:

| Build | Location | Status | Tables |
| --- | --- | --- | --- |
| **v2 prototype** ("VRCC v2") | `Grace-For-Addictions/vrcc.app`, branch `claude/v2-build-verification-4skk46`, directory `v2/` | Backend LIVE (its README + migration headers say applied; **LIVE-VERIFIED**: all `v2_*` tables exist — REST probes return `42501 permission denied` for anon, exactly matching its RLS) | `v2_profiles`, `v2_session_requests`, `v2_session_feedback`, `v2_daily_checkins`, `v2_housing_programs/beds/applications`, `v2_resources`, `v2_notifications` + views `v2_checkin_trends`, `v2_bed_availability` |
| **MVP surface** | `Grace-For-Addictions/vrcc.app`, `main`, `src/mvp/` — this is what production **vrcc.app** serves today (worker `virtualrecovery`) | LIVE in production (**LIVE-VERIFIED**: `mvp_*`, `participants`, `peer_coaches`, `app_users` all exist) | `participants` (with `assigned_coach_email`), `mvp_messages`, `mvp_session_requests`, `mvp_sessions`, `peer_coaches`, `app_users`, `participant_intakes`, `barc10_assessments` |
| **Canonical platform** (this repo) | `rcoiowa/GFA-ECO`, `recoveryos` schema, migrations 0000–0024 applied live | LIVE on staging worker | `people`, `role_assignments`, `coaching_relationships`, `navigation_relationships`, `support_team_memberships`, `appointments`, `service_events`/`service_types`, `consent_grants`/`consent_types`, `audit_log`, `referrals`, residences/beds/applications, check-ins/pulse |

Directive behaviors → where they exist today (**REPO-VERIFIED**):

| Behavior | v2 | MVP | Canonical |
| --- | --- | --- | --- |
| Participant session/support request | `v2_session_requests` insert (topic, mode, up to 3 preferred times, offline-safe `client_ref`) | `mvp_session_requests` | `appointments` status `requested` via `requestCoachingSession()` (0021 policy) |
| Open request pool | `coach_id is null` + partial index | `participants where assigned_coach_email is null` | — |
| Coach self-assignment (claim) | update sets `coach_id` + `accepted` | update sets `assigned_coach_email` | — |
| Administrator assignment | — (README: "assign roles/caseloads via SQL or dashboard") | — | — |
| Assigned-coach routing | `v2_profiles.coach_id` | `participants.assigned_coach_email` | `coaching_relationships` (proper entity, RLS `coaching_select_involved`) |
| Direct messaging | **absent** | `mvp_messages` — 4-second **polling**, not Realtime; sender identity client-supplied | — |
| Scheduling proposals / counterproposals | `preferred_times` / `suggested_times` jsonb + statuses `times_suggested` → `accepted` | coach creates `mvp_sessions` from request | — |
| Confirmed sessions, both calendars | `scheduled_at` + participant/coach queries of same row; Google Calendar link builder | `mvp_sessions` | `appointments` |
| Meeting URLs | `create-meeting` edge fn: Zoom account-credentials flow, fallback `meet.jit.si/vrcc-<id>` | manual | — |
| Session completion | coach sets `completed` | `mvp_sessions.status` + `last_contact_at` touch | `service_events` (attribution spine: context, funding, Exhibit E reporting exists) |
| Participant feedback | `v2_session_feedback` (rating, what helped, follow-up ask) | — | — |
| Notifications | `v2_notifications` + SECURITY DEFINER trigger fan-in, Realtime bell, consent-gated email/SMS fan-out (`notify-fanout` edge fn, Resend/Twilio) | — | — |
| Participant roster | — | CoachApp: unassigned + mine + pre-intake lists | staff area (residence-scoped) |
| Mobile-first relational UI | yes — 48px touch targets, offline queue, reduced-motion hook | shadcn-style MVP | platform design system |

So: the directive's mental model ("one prototype that does all of this")
is really *v2 for the coaching/scheduling/notification engine* + *the MVP for
messaging, roster, and what production users touch today*. Both must be in
the migration map; only `v2_*` was named, but `mvp_*` is what's live at
vrcc.app.

## 2. v2 schema details (REPO-VERIFIED against its three migrations)

- **Enums**: `v2_role` (participant/coach/housing_manager/navigator/admin),
  `v2_session_status` (requested/accepted/times_suggested/completed/cancelled),
  `v2_session_mode` (video/phone/in_person), notification kinds.
- **`v2_session_requests`** carries five responsibilities in one row — the
  exact overload the directive names: support need (topic), relationship
  (coach_id), negotiation (two jsonb time arrays), canonical session
  (scheduled_at, meeting_url), and lifecycle (status). `client_ref unique`
  gives real idempotency for the offline queue. Partial index on the pool.
- **Triggers**: `v2_session_request_notify` + `v2_application_notify`
  (BEFORE triggers that also stamp `updated_at`), `v2_touch_bed`. Notify
  helpers are SECURITY DEFINER with EXECUTE revoked from clients — good.
- **RLS** (foundation + advisor-hardening migration): anon fully revoked;
  participants FOR ALL on own rows; coaches SELECT/UPDATE on own + pool;
  daily check-ins private-by-default with per-day share toggle scoped to the
  caseload coach; storage bucket owner-only. Hardening pass fixed WITH CHECK
  mirroring and function EXECUTE scope.
- **Go-live wiring**: auth signup trigger auto-creates `v2_profiles`;
  Realtime publication for notifications/sessions/beds/applications;
  private `voice-notes` bucket.

## 3. Workflow traces (REPO-VERIFIED)

**Participant (v2)**: RequestSession → insert with `client_ref` (offline →
queued banner) → trigger notifies chosen coach or every coach → SessionList
shows status narrative → if `times_suggested`, one-tap accept of a suggested
time (row update to `accepted` + `scheduled_at`) → Join via `meeting_url`,
Add to Google Calendar → after `completed`, feedback form (rating / what
helped / follow-up ask).

**Coach (v2)**: CoachQueue subscribes to Realtime on the whole table →
Open pool + "Yours" lists → Accept (sets coach_id + accepted + scheduled_at
from first preferred time; fire-and-forget `create-meeting` for video) →
or Suggest times (2 counter-offers) → or Pass back to pool → Mark completed.

**Coach (MVP, production)**: roster of unassigned/mine/pre-intake →
Claim (plain update of `assigned_coach_email`) → session requests list →
schedule creates `mvp_sessions` row + marks request `scheduled` → complete
touches `last_contact_at`. Messaging thread per participant email.

## 4. Findings — race conditions, security gaps, debt

Race / concurrency (directive §38):

1. **v2 claim is check-then-act.** `accept()` updates without a
   `coach_id is null` guard. RLS's USING clause happens to make the loser's
   update match 0 rows — but the code never checks the row count, so the
   losing coach sees a success UI and a phantom claim. No graceful
   "already connected" path (spec §9). Same for `suggest()` and `passBack()`.
2. **v2 double-acceptance of suggested times**: participant accept has no
   "proposal still active" validation (spec §62); stale tabs overwrite
   `scheduled_at`.
3. **MVP claim has no guard at all**: last-write-wins on
   `assigned_coach_email`; two coaches can silently steal a participant
   from each other.
4. `create-meeting` is fire-and-forget; a failed invoke leaves an accepted
   video session with no URL and no retry.

Security / privacy (directive §39–41):

5. **MVP messaging identity is client-supplied** (`sender_role`,
   `sender_email`, `sender_name` in the insert payload) — spoofable by any
   authenticated user; thread keyed by email, not by a membership entity.
6. **`v2_profiles` SELECT policy is `using (true)`** for all authenticated —
   any participant can enumerate every user's display name, phone, county,
   role, and coach assignment. Violates minimum-necessary disclosure.
7. **v2 participant FOR ALL policy** lets a participant update any column of
   their own request — including `status`, `scheduled_at`, `meeting_url`
   (self-confirm without a coach).
8. **v2 coach UPDATE policy** lets any coach modify any pooled request's
   content (topic, times), and WITH CHECK doesn't force `coach_id = auth.uid()`
   on claim — a coach can assign a request to another coach.
9. **`create-meeting` authorizes by role only** — despite its comment, any
   coach can overwrite `meeting_url` on any session (IDOR by session_id).
10. Jitsi fallback rooms are public-server, session-UUID-named; acceptable
    interim, but meeting URLs aren't treated as private resources end-to-end
    (spec §67).
11. Coach Realtime channel subscribes to the entire `v2_session_requests`
    table (spec §51 wants relationship-scoped channels); RLS does filter
    delivery, but pool events fan out to all coaches by design.

Architectural debt (directive §1.7):

12. Three identity models in one database (`v2_profiles` uuid-keyed /
    `participants`+`app_users` email-keyed / `recoveryos.people` — the only
    one with consent, audit, and residence integration).
13. Relationship-as-column twice (`coach_id`, `assigned_coach_email`)
    versus the canonical `coaching_relationships` entity that already
    matches spec §11's shape (needs status/lineage columns).
14. Two housing stacks: `v2_housing_*` duplicates the canonical residence
    stack (residences, beds, applications) that is live on staging with
    staff workflows — v2's housing is the weaker twin and its "Grace House,
    Wise County, Virginia, women's residence" seed contradicts the real
    Grace House (men's, Iowa). Its rules jsonb also encodes punitive
    screening language the platform's language guide forbids.
15. Two check-in engines (`v2_daily_checkins` vs canonical `check_ins` +
    Recovery Pulse); v2's GROW/voice-notes/share-toggle ideas are good
    backlog input, not a second table.
16. Platform's `requestCoachingSession()` stuffs preferred times into
    `appointments.location_note` with a placeholder `starts_at` — honest
    scaffolding, but it's the same "state in prose" smell the spec bans.

## 5. Migration map

Legend: behavior/product language is preserved unless marked otherwise.
"Engine" = the canonical Recovery Support Engine in the `recoveryos` schema.

### KEEP (working behavior adopted as product requirements)

- Open pool → self-claim → suggest-times → one-tap accept → join →
  complete → feedback loop (v2) — the product motif to preserve.
- `v2_notifications` design: typed kinds, deep-link `link_path`, trigger
  fan-in, Realtime bell, consent-gated external fan-out. Best notification
  architecture in the ecosystem; becomes the Engine's blueprint.
- Offline idempotency via unique `client_ref` (v2 sync queue).
- Meeting-provider abstraction with graceful fallback (`create-meeting`),
  re-homed behind proper per-session authorization.
- Consent-gated email/SMS fan-out shape (`notify-fanout`) — re-pointed at
  canonical consent (`consent_grants`), not auth metadata flags.
- Daily-share consent toggle *concept* (per-item, participant-controlled
  disclosure) — feeds the canonical consent architecture.
- Relational, mobile-first UX language ("You're now connected with…",
  pool card progressive disclosure, 48px targets, reduced-motion).

### EXTEND (canonical tables that grow to absorb prototype duties)

- **`coaching_relationships`** → spec §11: add `status`
  (pending/active/paused/transferred/completed/ended), `assignment_type`/
  `role`, `assigned_by_person_id`, `assignment_source`
  (self_claim/admin/transfer/residence), `end_reason`, confirmation
  timestamps, `primary_relationship`. One active primary per participant
  enforced by partial unique index — this is what makes claims atomic
  (`insert … on conflict do nothing` → claim either lands or reports
  "already connected", spec §9). `navigation_relationships` gets the same
  treatment later (spec §50) — shared service, different relationship row.
- **`appointments`** → the canonical session record (spec §21): add
  `modality`, `platform`, `meeting_url`, `timezone`, `duration`,
  `requested_by`, `confirmed_by/at`, `cancellation_reason`,
  `rescheduled_from_appointment_id`, `follow_up_due`, lifecycle statuses
  beyond the current five. Existing rows and fields preserved; residence
  projections read the same rows (spec §22/33).
- **`service_events`** stays the completion/attribution spine (Exhibit E,
  grant, funding, delivery context already live) — session completion
  writes one, exactly as the platform already does elsewhere.
- **`support_team_memberships`** — already the "Support Team" projection
  for the residence experience (spec §33); surfaces, not schema, needed.

### MIGRATE (concepts that get canonical homes, then data)

- **Support need** → new `recoveryos.support_requests` (+ status per spec
  §7, category, preferred contact, aging timestamps, `client_ref`).
  Sources: `v2_session_requests` request-half, MVP request rows, and the
  platform's appointments-as-requests hack (which then retires).
- **Negotiation** → `booking_requests` + `booking_proposals` rows (from the
  two jsonb arrays); acceptance transactionally confirms the appointment
  and closes competing proposals (spec §62). `availability_rules` is new
  build (nothing existing anywhere).
- **Notifications** → `recoveryos.notifications` (+ `notification_deliveries`
  when external channels arrive), modeled on `v2_notifications`.
- **Messaging** → new `conversations`/`conversation_members`/`messages`
  with membership-based RLS and scoped Realtime; replaces `mvp_messages`
  (fixes findings 5) — server-derived sender identity.
- **Feedback/continuity** → `follow_ups` + participant post-session
  check-in, absorbing `v2_session_feedback`'s rating/what-helped/follow-up
  fields.
- **Data migration**: additive backfills only, keyed by `client_ref`/ids;
  prototype rows are copied, never mutated, and prototypes keep working
  until parity (directive's incremental rule).

### DEPRECATE (freeze after parity is proven, then read-only)

- `v2_session_requests`, `v2_session_feedback`, `v2_notifications` — after
  Engine phases 1–6 reach parity and data is backfilled.
- `mvp_messages`, `mvp_session_requests`, `mvp_sessions`,
  `participants.assigned_coach_email` — after messaging + sessions cut over
  in the production experience (this is live production; last to freeze).
- `v2_housing_*` — canonical residence stack already supersedes it; freeze
  first (no production surface depends on it; its seed data is wrong for
  the real Grace House).
- `v2_daily_checkins` / `v2_checkin_trends` — canonical check-ins + Recovery
  Pulse already live; GROW/voice/share ideas go to backlog.
- `v2_profiles` — last of the v2 set, once nothing references it.

### REMOVE (only after deprecation windows, owner-approved)

- Nothing in Phase 0–8. Destructive drops are a separate, owner-gated
  cleanup after every deprecated surface has a verified replacement and a
  retention decision (some rows — feedback, notifications — may merit
  archive-then-drop instead).

## 6. Constraints on execution from this session

- Migrations 0000–0024 are applied live; the Engine's Phase 1 migration is
  authored as `0025_support_engine_foundation.sql` **draft** but the
  Supabase MCP connector in this session is unauthenticated — applying it
  requires the owner to authorize the connector (claude.ai settings) or an
  authorized session. Per the standing rule, no app code that depends on
  0025 ships until 0025 is verified applied.
- This session has write access only to `rcoiowa/GFA-ECO`. The prototypes'
  repo (`Grace-For-Addictions/vrcc.app`) is readable but not writable from
  here; deprecation notices in that repo need a session on that repo.
- Live-DB introspection here is limited to REST probes with the publishable
  key; column-level verification of `mvp_*` tables (whose migrations are
  not in any repo branch found) remains UNVERIFIED — treat their live
  shapes as discovered-at-migration-time work.

## 7. Phase 0 exit → Phase 1 gate

Phase 1 (Domain Foundation) proposal, per spec §95 and this map:
`support_requests`, `coaching_relationships` extension (atomic claim),
`appointments` session-normalization, `notifications` — schema + RLS +
typed services + tests, no UI removal anywhere. Gate check before build:
owner confirms (a) this map, (b) Supabase access for applying 0025,
(c) that MVP production cutover ordering (messaging last) matches intent.
