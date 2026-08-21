# Grace Coaching — Phase 0 Audit & Migration Map

**Date:** 2026-08-07 · **Scope:** the existing Grace Coaching prototype vs. the Recovery
Support & Coaching Engine target architecture · **Live project:** `ykykeioydvtxpyreshhs`

This is the required audit-before-architecture pass. Nothing working was removed. One
live change was made in this session: a P0 security hardening migration
(`coaching_engine_p0_hardening`, § 4.1) plus repo-side recovery of four live-applied
migrations that had never been committed anywhere (§ 8).

---

## 1. Executive summary

Grace Coaching is **not one prototype — it is four generations sharing one production
database**, plus a canonical RecoveryOS layer that already holds the right long-term
homes for most of the domain:

| Generation | Frontend | Tables | Status |
| --- | --- | --- | --- |
| **Gen 1 "MVP / Gate 19B"** | `vrcc.app` repo `origin/main` → `src/mvp/*` | `mvp_session_requests`, `mvp_sessions`, `mvp_messages`, `participants`, `session_feedback`, `coach_meeting_rooms`, `notifications` — **email-keyed** | Live data: 4 requests, 2 messages |
| **Gen 2 "v3 Quantum Bridge"** | `vrcc.app` branch `claude/live-app-source`, deployed to Cloudflare Worker `virtualrecovery` (vrcc.app) | same `mvp_*` tables, extra columns | The **deployed** vrcc.app experience |
| **Gen 3 "v2 PWA"** | `vrcc.app` branch `claude/v2-build-verification-4skk46` → `v2/` | `v2_profiles`, `v2_session_requests`, `v2_session_feedback`, `v2_notifications` (+ daily/housing) — uuid-keyed, RLS-first | Backend live since 2026-07-22; frontend not deployed |
| **Gen 4 "Coaching Engine v1"** | **`coaching` Supabase Edge Function** (single-file HTML/JS app, deployed 2026-08-07 09:13 UTC, `verify_jwt=false` page serve + publishable-key client) | Gen 3 tables **+** `v2_coach_assignments`, `v2_direct_messages`, `v2_session_reminders`, `coach_meeting_rooms` bridge, `counter_proposed`/`confirmed` statuses, pg_cron reminder sweep | **This is the "functioning Grace Coaching prototype"** — backend applied live 2026-08-07 09:05–09:07, uncommitted to any repo until this audit |
| **Canonical RecoveryOS** | `apps/platform` (this repo) | `recoveryos.*`: `people`, `role_assignments`, `coaching_relationships`, `navigation_relationships`, `support_team_memberships`, `appointments`, `service_events`, `consent_grants`, `audit_log` | Live since 2026-07-29; coaching tables empty, RLS select-only, **no coach workspace, no messaging/notifications/availability at all** |

The directive's behavior list (request → pool → claim → admin assign → DM → propose →
counter → confirm → upcoming sessions → join link → complete → feedback →
notifications → roster) is fully implemented by **Gen 4** (claims + negotiation +
DMs + reminders + roster) with feedback coming from Gen 3 and the Ooma room registry
coming from Gen 1. The deployed vrcc.app worker still runs **Gen 2** against the
`mvp_*` tables — the two live frontends do not see each other's requests.

**Bottom line:** the domain decomposition the spec asks for
(support need / relationship / negotiation / canonical session / continuity) is
*almost exactly* the seam between what Gen 4 got right (relationship table with
one-active constraint, assignment-gated DMs, trigger-driven notifications, idempotent
reminder sweep) and what it still fuses into `v2_session_requests` (support need +
negotiation + confirmed session + meeting link in one row). The canonical layer
already provides `people`/`coaching_relationships`/`appointments`/`service_events`/
`consent_grants` as the destination. Migrate incrementally; do not rebuild.

---

## 2. What exists — inventory with evidence

### 2.1 Gen 4: the live Grace Coaching prototype (audit target)

**Frontend** — Edge Function `coaching` (v1, `verify_jwt=false`; serves a
self-contained HTML app; supabase-js + publishable key; RLS is the boundary).
Participant tabs: Sessions / Request / Messages. Staff tabs: Requests (pool) /
Sessions / Participants (roster) / Messages. Includes the **paired connection
visualization**: two nodes joined by a filament, dashed while negotiating, solid on
confirm, green with a traveling pulse in the join window, `prefers-reduced-motion`
honored. This is the product motif to preserve.

**Backend** — four live migrations (recovered in `docs/migration/recovered/`):

- `v2_coach_assignments` — id-keyed relationship entity, `method`
  (`self_claim`/`admin_assign`/`request_pickup`), `assigned_by`, `is_active`,
  `ended_at`, **partial unique index `(participant_id) where is_active`** — the
  concurrency-safe one-active-coach constraint the spec asks for (§ 75).
- `v2_direct_messages` — thread keyed `(participant_id, coach_id)`; RLS requires an
  **active** assignment pair on both SELECT and INSERT; Realtime enabled.
- `v2_session_reminders` — seeded by the confirm trigger (24 h / 1 h / 5 min),
  swept every 5 min by pg_cron job `vrcc-session-reminders` via
  `v2_sweep_session_reminders()` (`FOR UPDATE SKIP LOCKED`, `sent_at` idempotency).
- `v2_session_requests` extensions — `session_type` (5 types), `claimed_at`,
  `confirmed_at`, `confirmed_by`, `proposal_round`, `last_actor`; statuses
  `counter_proposed`, `confirmed` added.
- Triggers: `v2_on_session_confirmed` (attach coach's Ooma room from
  `coach_meeting_rooms`, seed reminders, notify both parties),
  `v2_on_coach_assigned` (notify both, sync `v2_profiles.coach_id`, mirror
  `participants.assigned_coach_name/email` for the legacy roster),
  `v2_on_dm_insert` (notification with 120-char preview).

**Claim flows are the strongest part of the prototype:**

- Pool pickup: `update … set coach_id = me where id = X and coach_id is null` with
  affected-row check → loser gets "Another coach just picked this up". Correct
  optimistic-concurrency claim.
- Roster claim / admin assign: INSERT into `v2_coach_assignments` racing on the
  partial unique index; `23505` surfaced as "They were just assigned". Correct.

**Weak seams (each traced in § 4):** the assignment INSERT after a pool pickup is a
separate non-transactional statement; admin re-assign is deactivate-then-insert with
a gap; `counter_proposed` overwrites `preferred_times` (history loss);
`proposal_round` is never incremented; accept-confirm has no state precondition
(double-accept, accept-after-cancel); DM history becomes unreadable to everyone when
an assignment ends (active-pair RLS); no Support Now layer in this UI; hardcoded
`America/Chicago` in notification copy; join-link time-gating is client-side only.

### 2.2 Gen 1/2: the deployed vrcc.app (mvp layer)

Email-keyed identity throughout (`participant_email` / `coach_email` /
`assigned_coach_email` — free text, no FK). Matched-coach model only (no pool in the
deployed UI; Gen 2 even lets an unmatched participant file a request with
`coach_email: null` that **no coach can see** under `msr_coach_select`). Messaging
(`mvp_messages`) polls every 4 s; the thread is "whoever is currently assigned to
this email", so reassignment retroactively exposes prior conversations. The
Gate 19B continuity loop (`current_next_step`, `next_follow_up_due`,
`last_contact_at`, coach attention queue) lives here and **only** here.
Cross-generation status vocabularies collide on the same tables: Gen 1 writes
`pending`, Gen 2 filters for `requested`/`suggested`/`time_confirmed` — requests
created in one UI are invisible in the other. Gen 2's participant
accept/withdraw actions are **silent no-ops** (no participant UPDATE policy on
`mvp_session_requests` was ever created). The `session_feedback` flow is broken by a
three-way prop/schema mismatch (`requestId` vs `session` prop, `sessionId` vs
`requestId` in the store, `author_email` vs `author_id` in the only versioned DDL).

### 2.3 Gen 3: v2 PWA (not deployed, backend live)

Offline-first design done right in places the later generations dropped: IndexedDB
sync queue with `client_ref` idempotency keys backed by unique constraints, service
worker app shell, voice input, 48 px touch targets, `prefers-reduced-motion`. Its
edge functions are live: `create-meeting` (Zoom S2S else meet.jit.si fallback else
Ooma room lookup) and `notify-fanout` (Resend/Twilio, consent-gated on
auth metadata — but with **no webhook auth**; see § 4.2). The July UI has known holes
(suggest→accept path never creates a meeting link; join links shown with no time
gate; no cancel affordance) that Gen 4 partially superseded.

### 2.4 Canonical RecoveryOS (this repo + live `recoveryos` schema)

What already exists and must be reused rather than duplicated:

- **Identity:** `people` (person ≠ auth user, ADR-0003), `person_profiles`
  (timezone, communication preferences), `contact_methods` (email/phone/sms with
  `is_verified`), `role_assignments` (scoped, soft-revoke; `coach` and `navigator`
  roles already in the enum), `ensure_person_for_current_user()` provisioning RPC.
- **Relationships:** `coaching_relationships`, `navigation_relationships`,
  `support_team_memberships` — the canonical assignment entities. Currently
  select-only RLS ("Phases 5–6 policies land later" per 0009 header), no `status`,
  no `assigned_by_person_id` — they need EXTEND, not replacement.
- **Sessions:** `appointments` (`requested/scheduled/completed/cancelled/no_show`)
  plus the `service_events` spine (ADR-0005: every delivered service records an
  attributable event with `delivery_context`, `modality`, org/program/residence
  attribution, Exhibit E mapping). `sessions.ts` repository exists but is wired to
  nothing and stuffs preferred times into `location_note` as free text.
- **Consent:** `consent_types` / `consent_grants` append-only (ADR-0009), with
  `coaching` and `communications` consent types **already seeded** — the exact gates
  the messaging/reminder engine needs, currently unenforced.
- **Missing entirely from canonical:** support requests (a `support_request` service
  type is seeded but has no table), messaging, notifications, reminders,
  availability, booking negotiation, follow-ups, coach workspace, and any
  INSERT/UPDATE policies on `coaching_relationships`/`appointments` beyond
  participant self-request (0021).
- **Architecture rules that bind the engine build** (from ADRs + 0009/0010/0011/0020/0023):
  person_id keys; service_events row per delivered session; RLS in the same
  migration as every new table (0010 default-privileges auto-expose new tables to
  `authenticated` — the policy *is* the gate); security-definer helper functions
  instead of cross-table policy joins (recursion lesson, 0020); `security_invoker`
  views for column-level privacy (0023); append-only consent; residence/coaching
  boundary kept in software (ADR-0014).

### 2.5 Duplicated concepts (the debt map)

| Concept | Live implementations today |
| --- | --- |
| Coach↔participant relationship | `v2_coach_assignments` (entity) · `v2_profiles.coach_id` (denormalized) · `participants.assigned_coach_email/name` (email mirror) · `recoveryos.coaching_relationships` (canonical, empty) · `gfa_core.coaches`, `gfa_ui.coach_profiles` (dormant) |
| Session / request | `mvp_session_requests`+`mvp_sessions` · `v2_session_requests` · `recoveryos.appointments` · `gfa_ui.coaching_sessions`, `grace_sessions`, `public.coaching_sessions` (dormant) |
| Messaging | `mvp_messages` · `v2_direct_messages` · `gfa_ui.messages` (dormant) · `room_messages` (dormant) |
| Notifications | `public.notifications` (v6 shape) · `v2_notifications` · `gfa_ui.notifications`/`staff_notifications` (dormant) — canonical has **none** |
| Availability | `gfa_ui.availability_slots` (30 rows, dormant) — nothing anywhere else |
| Feedback | `session_feedback` (mvp shape) · `v2_session_feedback` |
| Support request | `v2_session_requests` (fused) · `gfa_ui.support_requests` (dormant) · canonical `service_types.support_request` (seeded, no table) |
| Roles | `app_users.role` (mvp) · `v2_profiles.role` · `recoveryos.role_assignments` · `role_preassignments` |

One more content-drift finding: the Gen 3 seeds wrote **Virginia** content into the
live Iowa project (`v2_housing_programs` "Grace House, Wise County VA", Virginia
crisis lines in `v2_resources`). Flagged for cleanup at DEPRECATE time.

---

## 3. Workflow traces (Gen 4, as live today)

**Participant:** sign in (password; open self-signup) → profile auto-provisioned as
participant → *Request* tab: pick session type (peer_support / recovery_coach /
life_coach / navigation / needs_assessment), mode (video/phone/in-person), topic,
up to 3 preferred times → request inserts with `coach_id` = active assigned coach,
else NULL to the open pool → *Sessions* tab shows Upcoming / In motion / Recent with
the pair visualization → when coach proposes (`times_suggested`), participant
one-taps a time → `confirmed` (trigger: room link attach + reminders + both-party
notifications) → time-gated (client-side) "Join session now" inside a
−60 min/+90 min window → after `scheduled_at`, either party marks completed →
participant "Share how it went" (1–5 stars + free text → `v2_session_feedback`) →
counter-flow: "None of these work" → up to 3 alternates → `counter_proposed` →
coach accepts one or re-proposes. Messaging unlocks only when an assignment is
active; realtime via `postgres_changes` filtered by `participant_id`.

**Coach:** *Requests* tab = open pool (unclaimed cards, "Pick up this participant" —
atomic claim, graceful loser message) + "Needs your reply" · *Sessions* =
confirmed/completed with join links · *Participants* = full roster of every
participant profile with assigned-status chips, self-claim, message, "Set up
session" (coach-initiated `times_suggested` invitation), and (navigator/admin) an
assign-to-coach picker · *Messages* = threads per active assignment.

**Admin/navigator:** same workspace as coach plus roster reassignment
(deactivate current assignment → insert new one, `method='admin_assign'`).

**Notification loop:** every transition inserts `v2_notifications` rows via
SECURITY DEFINER triggers; bell shows unread count; pg_cron sweeps reminders due →
`session_reminder`/`session_starting` notifications. In-app only — no email/SMS
wired for the v2 layer (the `notify-fanout` function exists but no DB webhook is
configured).

---

## 4. Race conditions & security findings

### 4.1 Fixed this session (P0, applied live as `coaching_engine_p0_hardening`)

| # | Finding | Fix |
| --- | --- | --- |
| H1 | **Privilege escalation:** `authenticated` held UPDATE on every `v2_profiles` column with a self-row RLS policy and no guard — any signed-in user could set `role='admin'` (then read all requests, manage assignments) or set their own `coach_id`. Confirmed via `role_column_grants`. | BEFORE INSERT/UPDATE guard triggers: role changes admin-only, `coach_id` changes staff-only, self-signup coerced to `participant`. Grants untouched so all existing UI flows keep working. |
| H2 | **Meeting URL exposure:** `cmr_read_authenticated` let any signed-in user read every coach's *permanent personal* Ooma room URL (the room reused for their 1:1s, groups, workshops). | Policy dropped; coach-own/admin/service-role/trigger paths retained. |
| H3 | **Join-link injection:** participants could UPDATE `meeting_url` on their own `v2_session_requests` row (FOR ALL self policy) and hand the coach a malicious link. | Guard trigger (fires before the confirm trigger) restricting `meeting_url` changes to staff/system. |
| H4 | **Caseload/thread takeover:** legacy `participants_coach_update` policy had no role gate — any authenticated *participant* could claim every unassigned `participants` row (`assigned_coach_email IS NULL` branch) and thereby satisfy the `mvp_messages` coach policies to read/post in other participants' private coach threads. | Recreated with the `is_coach()` gate (same as `participants_coach_claim`), case-insensitive email match. Continuity-loop updates by real coaches unaffected. |

### 4.2 Open — must be fixed before or during Phase 1 (P1)

1. **`notify-fanout` is a service-role notification relay with no webhook auth.**
   It trusts `payload.record` wholesale and sends GFA-branded email/SMS to
   attacker-chosen recipients with attacker-chosen content. Currently defanged only
   because Resend/Twilio secrets are unset and no DB webhook exists. **Do not
   configure those secrets until the function checks a shared webhook secret.**
   (Also true of its currently-dead mvp-shape counterpart.)
2. **`create-meeting` authorizes by role, not ownership** — any coach can overwrite
   `meeting_url` on any session (service-role write, no `coach_id` check), and the
   jit.si fallback room name is derivable by every pool-eligible coach. Add
   ownership check + `mode='video'` check; drop public-Jitsi fallback.
3. **Participant full-column write on own `v2_session_requests` row** (`FOR ALL`
   self policy): can still self-set `status='confirmed'`, `coach_id`, and
   `scheduled_at` outside the negotiation protocol (H3 closed only `meeting_url`).
   The domain-service migration (§ 6) replaces raw table writes with RPCs +
   status-transition guards.
4. **Non-transactional claim pairs:** pool pickup = request UPDATE then assignment
   INSERT (two statements — a crash or 23505 between them leaves a claimed request
   with no assignment, which then blocks DMs); admin reassign = deactivate then
   insert (gap with no active coach; failed insert strands the participant).
   Wrap in `security definer` RPCs (`claim_support_request`, `assign_coach`).
5. **Double-accept / stale accept:** confirm is `update … set status='confirmed'`
   with no `.in(status, …)` precondition or `proposal_round` check; two parties
   racing, or accept-after-cancel, silently wins last-write. Add status
   preconditions + affected-row checks (Gen 4 already does this for claims —
   extend the same pattern).
6. **Roster over-disclosure:** every coach sees every participant profile
   (`v2_profiles` select `using (true)`) including phone/county, and
   `v2_ca_staff_select` exposes all assignments to all coaches. Spec § 8/§ 13
   requires progressive disclosure: pool cards should carry only what a coach needs
   to decide. Move roster reads behind scoped views.
7. **DM history loss on transfer:** active-pair RLS makes ended-assignment threads
   unreadable to both parties (and admin). Spec § 49 requires preserved history.
8. **Reminder/notification duplication risk** is handled for the sweep
   (`SKIP LOCKED` + `sent_at`) but the confirm trigger re-fires if a session is
   re-confirmed after cancel (reminders `ON CONFLICT DO NOTHING` has no unique
   constraint to conflict on — add `(session_request_id, kind)` unique).
9. **Timezone handling:** naive `datetime-local` strings and hardcoded
   `America/Chicago` copy. Store UTC + participant timezone from
   `person_profiles.timezone`.
10. **Support Now is absent from the Gen 4 UI** — the spec (§ 46) requires the
    safety layer on every participant surface. Gen 1's `SupportNow` modal (988 /
    Crisis Text Line / SAMHSA deep links, no logging) is the pattern to carry over.

Deployed-but-dormant secondary issues (mvp layer): case-sensitive email joins vs
case-insensitive RLS, cross-generation status vocabulary collisions, silent 0-row
updates as UX, feedback flow broken end-to-end, unfiltered table-wide realtime
subscriptions. These are documented for the record; they get retired with the layer
rather than patched individually (§ 5).

---

## 5. Migration map — KEEP → EXTEND → MIGRATE → DEPRECATE → REMOVE

**KEEP** (working behavior that carries forward as-is during transition)

- Gen 4 `coaching` prototype end-to-end (request → pool → claim → negotiate →
  confirm → remind → join → complete → feedback) as the reference implementation
  and stopgap production surface, now hardened (§ 4.1).
- `v2_coach_assignments` one-active partial-unique claim pattern; atomic
  guarded-update pool pickup; `SKIP LOCKED` idempotent reminder sweep;
  trigger-driven notification writes — these *patterns* port verbatim into the
  canonical engine.
- The connection-pair visualization, humanized status vocabulary, grace-first copy
  system ("No fees. No stigma. Just grace.", "Pass with a note", soil-type
  strengths framing, "You belong here already"), SupportNow modal, 48 px targets,
  reduced-motion handling, `client_ref` offline idempotency design (Gen 3).
- Canonical substrate: `people`, `role_assignments`, `consent_types`/`consent_grants`
  (coaching + communications types), `service_events` spine, `appointments` shell,
  RLS helper trio, `audit_log`.

**EXTEND** (canonical entities that need columns/policies, not replacements)

- `recoveryos.coaching_relationships` ← add `status`
  (`pending/active/paused/transferred/completed/ended`), `assignment_type`/`role`
  (primary/secondary/temporary), `assigned_by_person_id`, `assignment_source`
  (`self_claim/admin_assign/request_pickup` — proven in Gen 4), `end_reason`,
  confirmation timestamps, `updated_at`; partial unique
  `(participant_person_id) where status='active' and assignment_type='primary'`;
  INSERT/UPDATE policies via definer RPCs (claim/assign/transfer/end). Same for
  `navigation_relationships` (shared machinery, different role permissions).
- `recoveryos.appointments` ← add `organization_id`, `modality`, `platform`,
  `meeting_url`, `duration_minutes`, `timezone`, `requested_by/confirmed_by`,
  `confirmed_at`, `cancellation_reason`, `rescheduled_from_appointment_id`,
  `follow_up_due`, `service_event_id`, `icare_phase`, `exhibit_e_activity_code`,
  `grant_billable`, `updated_at`; widen the status check to the spec lifecycle;
  provider/coach select+update policies (definer-gated). This is the canonical
  `sessions` table — do **not** create a parallel one.
- `service_types` ← map Gen 4's five session types onto existing seeded keys
  (`peer_support`, `coaching_session`, `navigation`, …) instead of a new enum.
- `person_profiles.communication_preferences` + `contact_methods` ← become the
  notification-preference substrate (no new prefs table until channels exist).

**MIGRATE** (prototype responsibilities that move to new canonical tables — build
new, backfill from prototype, prove parity, then cut over)

| Prototype source | Canonical destination (new, in `recoveryos`) |
| --- | --- |
| `v2_session_requests` (rows with `coach_id is null` / pre-claim lifecycle) | `support_requests` + `support_request_events` (lifecycle: submitted → open → claimed/assigned → scheduled → resolved/closed/cancelled; aging thresholds § 73) |
| `v2_session_requests` negotiation columns (`preferred_times`, `suggested_times`, `proposal_round`, `counter_proposed`) | `booking_requests` + `booking_proposals` (proposals immutable rows, one-click accept closes competitors atomically — fixes history-loss + double-accept) |
| `v2_coach_assignments` (+ mirrors) | extended `coaching_relationships` (above); backfill 0 rows today — trivial |
| `v2_direct_messages`, `mvp_messages` | `conversations` / `conversation_members` / `messages` (membership from relationship, history survives transfer with read-scope rules; Realtime per-conversation channels) |
| `v2_notifications` (+ mvp `notifications`) | `notifications` + `notification_deliveries` (event → record → channel delivery separation, § 52) |
| `v2_session_reminders` + pg_cron sweep | `reminder sweep over notification_deliveries` (same SKIP LOCKED pattern; unique `(session, kind, channel)`) |
| `coach_meeting_rooms` | `meeting provider abstraction` (§ 63): `manual`/`ooma_room`/`zoom`/`phone`/`in_person`; per-session URLs remain on `appointments.meeting_url`; personal-room reuse becomes an explicit provider choice with rotation guidance |
| `v2_session_feedback`, `session_feedback` | `follow_ups` + lightweight session-feedback table keyed to `appointments` + `service_events` outcome fields |
| Gate 19B continuity fields (`current_next_step`, `next_follow_up_due`, `last_contact_at`) | `follow_ups` queue + connection-health signals (§ 55) — this loop is product-critical; migrate it, don't lose it |
| `gfa_ui.availability_slots` (30 dormant rows) | `availability_rules` / `availability_exceptions` (evaluate reuse first; the dormant shape predates the spec) |

Data volumes are tiny (4 + 1 requests, 2 messages, 0 assignments/DMs live), so the
backfill cost is negligible — the parity gate is behavioral, not data-scale.

**DEPRECATE** (keep running until parity is proven, then retire)

- Gen 2 mvp session/messaging surfaces on the deployed worker (replace with the
  shared engine surfaced in the platform experiences; keep read-only during
  transition per the strangler rule).
- `mvp_session_requests`, `mvp_sessions`, `mvp_messages`, mvp-shape
  `session_feedback`/`notifications`; `v2_profiles.role` (→ `role_assignments`),
  `v2_profiles.coach_id` and `participants.assigned_coach_*` mirrors (→
  relationship reads); the `coaching` Edge Function URL as a standalone app once
  the engine is surfaced in VRCC platform + Coach Workspace + residence
  projections.
- Virginia-flavored Gen 3 seed content in `v2_housing_programs`/`v2_resources`.

**REMOVE** (dead already — after archival export)

- Dormant Base44-era tables not referenced by any live frontend:
  `gfa_ui.messages`, `gfa_ui.support_requests`, `gfa_ui.coaching_sessions`,
  `gfa_ui.staff_notifications`, `public.coaching_sessions`, `mvp_sessions`-shape
  duplicates in `gfa_core` (per the existing Phase 8 ETL plan, § docs/migration).
- Broken Gen 2 feedback wiring (superseded rather than repaired).
- `meet.jit.si` fallback in `create-meeting`.

---

## 6. Target integration (how the spec lands here)

**One engine, many surfaces.** The engine is a set of `recoveryos` tables + definer
RPCs + typed services in `packages/data-access` (following `sessions.ts` /
`staffOperations.ts` conventions), surfaced as React components in
`packages/ui`, mounted by: VRCC participant area (`/vrcc/*` — extend the existing
static `ConnectPage`), a new Coach Workspace shell (`/coach` — `EXPERIENCE_ROLES.coach`
already declared), Navigator (`/navigator`), the Recovery Residence resident +
staff experiences (projection reads of the same rows, residence-scope policies per
ADR-0014's software boundary), and Admin operations. No residence copies of coach,
messages, or sessions — residence surfaces read the same `coaching_relationships` /
`appointments` rows under consent + role scoping.

**Sequencing (each phase behind parity verification, prototype untouched until cut):**

1. **P1 Domain foundation** — extend `coaching_relationships` + `appointments`;
   `support_requests` (+ events); claim/assign/transfer RPCs porting Gen 4's
   concurrency patterns; RLS with definer helpers; `Appointment`/
   `CoachingRelationship` domain types (currently missing from `entities.ts`);
   fix § 4.2 items 1–5.
2. **P2 Connection engine** — open-request pool + claim + admin assign + My
   Participants in Coach Workspace; participant "Request a coach" replacing the
   static ConnectPage cards; progressive disclosure on pool cards.
3. **P3 Messaging** — conversations/messages + scoped Realtime + notifications
   tables; consent gate on `communications`.
4. **P4 Scheduling** — availability, booking requests/proposals, atomic accept
   (§ 62 transaction), reschedule-with-history.
5. **P5 Sessions** — appointments lifecycle UI both sides, meeting provider
   abstraction, time-aware join, completion writing `service_events` (+ Exhibit E
   fields).
6. **P6 Reminders/notifications** — deliveries model, pg_cron sweep, channel
   fan-out behind authenticated webhook.
7. **P7 Residence projection** — Support Team card + upcoming sessions in
   RecoveryResidenceOS, read-only, consent-scoped (that repo currently surfaces no
   coach data at all).
8. **P8 Follow-ups/outcomes + cutover** — migrate the Gate 19B continuity loop,
   connection-health signals, backfill, retire prototype surfaces per the
   DEPRECATE list, re-point the `coaching` URL.

---

## 7. Product language to preserve (non-negotiables carried into the engine)

The paired-nodes connection visualization (two people becoming connected, not a
ticket moving); "No fees. No stigma. Just grace." + "Connection Prevents Crisis"
riding on every artifact that leaves the app (calendar bodies, email footers);
humanized statuses ("Waiting for a coach", "New times offered", never raw enums);
grace extended to coaches ("Pass with a note", "Passing is always okay — grace
covers coaches too"); "there is always a next step" (home card never empty);
strengths-based soil-type framing; consent-off-by-default; "Struggle is never
punished here — silence is what we try to avoid" as the design principle behind the
continuity loop; SupportNow visible on every participant surface, outside auth.

---

## 8. Session record (2026-08-07)

- Recovered into `docs/migration/recovered/`: the four live-applied
  `vrcc_coaching_engine_v1*` migrations (09:05–09:07 UTC, previously uncommitted)
  — see the new drift entry in `docs/migration/live-drift-reconciliation.md`.
- Authored + applied + committed `coaching_engine_p0_hardening` (§ 4.1).
- No prototype behavior removed; no canonical schema changed.
