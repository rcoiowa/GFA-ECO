# P4E — Navigator Workspace & Closed-Loop Navigation Report

**Date:** 2026-08-08
**Backend authority:** RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`), schema `recoveryos` only
**Frontend authority:** `apps/platform` (`/navigator/*` + participant integration)
**Gate status:** typecheck ✅ · build ✅ · tests ✅ (117/117) · launch-contract preflight ✅

The standard this slice was built to: a directory gives someone a phone number;
navigation helps a person get from where they are to where they need to be —
and RecoveryOS can now prove not just *we referred them* but *we stayed with
the connection long enough to know what happened*.

---

## A. Navigator contract audit

Performed before any UI (§2). Confirmed the directive's suspected mismatch,
live: `claim_support_request` accepted `is_support_staff()` (any support role)
and **always** created a `coaching_relationships` row — a navigator claiming a
navigation request would have been recorded as that person's coach.
`assign_participant_coach` likewise only creates coaching relationships.
`navigation_relationships` existed (0005) but was minimal — no status, no
primacy, no assignment provenance, no policies beyond involved-party SELECT.
No navigation-domain RPCs, needs model, or referral model existed. The public
`recoveryos.referrals` table was confirmed to be the recovery-residence intake
domain (residence/contact/applicant fields) — untouched (§N).

## B. Support-request capability matrix

Server-enforced in the 0112 dispatcher (React filtering is display only):

| Request type | Eligible claimant (server) | Relationship created | relationship_type |
| --- | --- | --- | --- |
| `recovery_coach` | `is_coach_staff()` = coach \| admin \| sysadmin | `coaching_relationships` | `coach` |
| `life_coach` | `is_coach_staff()` | `coaching_relationships` | `coach` |
| `peer_support` | `is_coach_staff()` | `coaching_relationships` | **`peer`** (labeled "Peer Support", never "Recovery Coach") |
| `navigation` | `is_navigator_staff()` = navigator \| admin \| sysadmin | `navigation_relationships` | — |
| `needs_assessment` | `is_navigator_staff()` (navigator-led triage, `assignment_source='triage'`) | `navigation_relationships` | — |

Ineligible claims return `not_eligible` with role-appropriate copy. DB-verified:
`nav_claims_coaching=not_eligible coach_claims_nav=not_eligible`. Policy
decisions recorded: program managers no longer claim from the pool (they can be
routed via assignment RPCs); `needs_assessment` is navigator-led triage — the
canonical relationship is navigation, never silently coaching.

## C. Coaching-vs-navigation relationship correction

Option B (one dispatching `claim_support_request`) was chosen: the frontend
contract survives unchanged, the proven P4C coaching path is preserved verbatim
(same row lock, one-winner, idempotency, humane race copy, event history), and
domain routing lives in exactly one transaction. DB-verified:
`coach_claim=claimed/coaching nav_claim=claimed/navigation fake_coach=0
race=already_claimed` — **a navigator never becomes a fake coach**, navigation
claims have identical concurrency behavior, and `support_request_events` records
the domain in the claim event. `assign_participant_coach` remains coach-only;
navigators are assigned via the new `assign_participant_navigator` — never the
coach RPC (§2 honored).

## D. Navigation relationship lifecycle

0112 extends `navigation_relationships` to coaching parity: `status`
(pending/active/paused/transferred/completed/ended), `is_primary`,
`assigned_by_person_id`, `assignment_source`
(request_pickup/navigator_assignment/admin_assignment/triage), `end_reason`,
`updated_at` + touch trigger. **Launch rule implemented as recommended: one
active primary navigator per participant** (partial unique index — the same
race-guard shape as coaching), independent of coaching. Coexistence is
intentional and DB-verified: `coach_rels=1 nav_rels=1` simultaneously for the
same participant. The two domains stay in their own tables — no forced
abstraction.

## E. Navigator assignment/claim RPCs

- `claim_support_request` (dispatcher, §C) — JWT-derived actor, domain
  eligibility, `FOR UPDATE` + unique-index race guard, idempotent
  (`already_yours`), humane loser results, event-logged.
- `assign_participant_navigator(participant, navigator)` — navigator-staff
  caller, validates the target actually holds the navigator role
  (`not_a_navigator` otherwise), reuse/uniqueness (`already_assigned` /
  `participant_has_navigator`), participant notification, provenance recorded.
- `end_navigation_relationship(id, reason)` — navigator-own or platform admin,
  idempotent (`already_ended`), history preserved (status + end_reason, never
  deletion).

No generic INSERT/UPDATE authority exists on `navigation_relationships` for the
frontend — writes are RPC-only.

## F. Progressive disclosure

**The P4C defense-in-depth gap is closed at the server (§10):**
`list_open_support_requests` was dropped and recreated in 0112 **without the
`focus` column** — the pre-claim pool projection now carries name, request
type, modality, and wait time, nothing else. Verified structurally
(`focus_in_projection=0` from `pg_get_function_result`) and at the type level
(`OpenPoolRow` no longer has the field — client code cannot render what it
cannot receive). Post-relationship disclosure (roster `origin_focus` for
coaches) is unchanged and remains legitimate.

## G. Navigator information architecture

`/navigator/*` is a real lazy-loaded workspace (25.6 kB own chunk) replacing
the P4A arrival shell, guarded by
`RequireRole ['navigator','administrator','system_administrator']` (UX only;
RLS/RPCs are the boundary): `/navigator` Home · `/navigator/requests` Waiting ·
`/navigator/people` (+ `/people/:personId`) · `/navigator/connections` ·
`/navigator/follow-ups` · `/navigator/messages` (+ `/messages/:personId`).
Six destinations, no more — relational, not a CRM pipeline.

## H. Navigator home/attention

Home answers the five directive questions in order: Needs Attention (pure
derived, §43 priority: participant reply → overdue follow-up → people waiting →
warm handoff awaiting confirmation → unresolved need → follow-up due today, max
4, quiet language, no red-alert styling, no hidden scoring — unit-tested
priority order), People Waiting for Navigation (top 3 + link), then
Connections-in-progress / Follow-Ups / My People counts. A closing line makes
unmet needs visible without shame: "Unmet needs stay visible — they're real
evidence, not failures."

## I. My People

Active navigation relationships via `get_my_navigation_participants()` — the
same relationship-scoped identity boundary as the coach roster (0108): display
name, pronouns, together-since, origin request, and the active need categories
being worked. No broad people SELECT; foreign navigators see nothing
(DB-verified `foreign_sees_rels=0`).

## J. Participant navigation view

`/navigator/people/:personId`: Overview (relationship, origin request, Message
action, service attestation); Needs (identify via taxonomy select, humane
status controls); Connections (create information/referral/warm-handoff,
outcome actions, consent-aware); Follow-Ups (create/complete). **No coaching
transcript, no residence compliance data** — the page reads only
navigation-domain sources, and RLS enforces the same boundary underneath
(coach's view of the same person shows zero navigation rows: `coach_sees_needs=0`).

## K. Need/barrier taxonomy

Sixteen funder-neutral categories with stable keys (housing,
recovery_residence, transportation, treatment_healthcare, mental_health,
employment, education_training, food_basic_needs, benefits_financial,
legal_reentry, identification_documents, family_childcare, digital_access,
social_connection, recovery_support, other) — enforced by CHECK constraint
server-side and mirrored in `NEED_CATEGORIES` domain constants. Multiple needs
per person supported. A unit test asserts no grant vocabulary
(GPRA/SUPRT/RCORP/Exhibit) appears in any key or label. **Connect was NOT
turned into an intake (§12):** the participant still asks for help in one
step; needs are identified later, inside the relationship, with "What would be
most helpful to work on first?"

## L. Need lifecycle

`navigation_needs` (person, relationship, originating request, category,
status, identified_at/resolved_at, optional note kept separate from taxonomy).
Statuses: identified · in_progress · resolved · partially_resolved ·
unresolved · deferred — **no "failed" anywhere**, and the participant-facing
labels are humane ("Working on it", "Set aside for now"). Lifecycle via RPCs
only: `identify_navigation_need` (active-relationship-scoped),
`update_navigation_need_status` (relationship navigator or platform admin,
idempotent, resolved_at maintained). Creating a referral against an
`identified` need moves it to `in_progress` automatically — natural evidence,
no separate paperwork.

## M. Navigation referral/connection entity

New canonical `navigation_referrals` — the closed-loop record. It answers every
§15 question: who (person_id + relationship), what need (navigation_need_id),
where (resource_id / organization_id / free-text destination_name — at least
one required by CHECK), what kind (referral_type), when attempted
(attempted_at), whether they actually connected (status + connected_at), how we
know (connection_evidence: participant_report / navigator_confirmation /
partner_confirmation / platform_evidence), and final state (closed_at). No
grant-specific fields.

## N. Existing residence-referral boundary

`recoveryos.referrals` (public recovery-residence intake, residence_id +
referrer/contact/applicant fields) was **not touched, mutated, or repurposed** —
different business event, separate domain. The navigation entity is distinctly
named `navigation_referrals`. The anon INSERT grant on `referrals` remains the
one public write surface, verified by the preflight.

## O. Referral vs warm handoff semantics

Three types, distinguished in schema, RPC validation, UI copy, and analytics:
**information** ("Resource shared — they have the info"), **referral**
("Referral made — I directed them there"), **warm_handoff** ("Warm handoff — I
helped make the connection myself": called together, introduced, coordinated,
accompanied, secured acceptance). The navigator chooses explicitly at creation —
a resource link is never silently promoted to a warm handoff, and the domain
test pins the labels apart.

## P. Loop-closure workflow

A referral is **not** closed because GFA sent it. Status lifecycle: initiated →
contact_attempted → connected / not_connected / participant_declined /
partner_unavailable → closed — activity distinguished from outcome, declining
distinguished from unavailability (system-barrier evidence). `connected`
**requires** explicit evidence (`evidence_required` otherwise); evidence
provenance is stored. DB-verified end-to-end, both directions (§49): the happy
loop (need → warm handoff → follow-up → participant confirms → connected with
`participant_report` evidence → need resolved) and the honest unmet loop
(need → referral → `partner_unavailable` → need `unresolved`,
`unresolved_kept=1` — it does not disappear).

## Q. Participant confirmation

`confirm_my_connection` — the participant's own loop-closure voice, optional
and supportive: **Yes, I connected** (→ connected, participant_report) · **Not
yet** (→ contact_attempted) · **I don't need this anymore** (→
participant_declined; never framed as failure) · **I need more help** (changes
nothing on the record; notifies the navigator to step in). Every response
notifies the navigator with generic, category-free copy ("Pia responded about a
connection"). Rendered in the participant's Getting Connected card with the
directive's exact question, "Were you able to connect?" — component-tested,
including that internal enums never render.

## R. Resource/partner integration

`navigation_referrals` carries FKs to canonical `resources` (0102 unified
directory) and `organizations`, plus `destination_name` for destinations not
yet in the directory — a deliberate free-text field that **does not pollute
reference data** (nothing is auto-inserted into `resources`). The launch UI
captures the destination by name; a directory picker over canonical
`resources` is the natural next increment and the FK columns are already
waiting for it. No duplicate partner copies were created.

## S. Follow-ups

Canonical `follow_ups` reused. 0114 extends `create_follow_up` authorization to
active **navigation** relationships (it was coaching-only) — and fixes its
admin fallback to platform-admin (the same over-reach class as §AD). Navigator
follow-ups ("navigation_check") appear in the workspace queue (past due /
coming up, sr-only past-due markers) and on the person page. Follow-up remains
an operational commitment, never an outcome; completion feeds the attention
model and the `navigation_follow_up_completed` process event only.

## T. Navigator messaging

P4D's engine reused wholesale — **with a real `context='navigation'`** (§22):
0112 extends `ensure_relationship_conversation(other, context)` to resolve
navigation conversations against an actual active `navigation_relationships`
row (linked via the new `conversations.navigation_relationship_id`).
`send_message` / `mark_conversation_read` are context-aware (ended-relationship
checks and staff link paths per domain). DB-verified: participant's navigator
thread and coach thread are **distinct conversations** (`distinct=yes`),
idempotent from both sides (`nav_idem=same_id`), the coach cannot send into or
read the navigator thread (`coach_into_nav=not_authorized coach_reads_nav=0`),
and ended relationships go read-only. No duplicate message engine — the same
hooks and `MessageThread` render both workspaces.

## U. Navigator scheduling status

**Audited before reuse (§24) and deliberately deferred.** The scheduling RPCs
are coaching-shaped end to end: `create_booking_request` requires an active
*coaching* relationship, `booking_requests`/`appointments` carry
`coaching_relationship_id`, and `accept_booking_proposal` writes it into the
appointment. Generalizing to either-relationship linkage would touch the
proven P3C-B transaction spine mid-slice for a capability with no immediate
operational demand. Honestly documented decision: **no navigator scheduling in
P4E** — no coaching_relationship_id is ever populated with a navigation
relationship, no fake coaching relationships exist (structurally impossible
now), and messaging + referral/follow-up covers the navigator's coordination
needs. The clean extension (nullable dual-FK with a one-context CHECK) is
specified for a future slice if operations require it.

## V. Participant My Support integration

`get_my_support_team()` now returns coach AND navigator relationships with a
`context` discriminator, appropriate role labels ("Recovery Coach", "Peer
Support", "Navigator"), and the same minimal public identity (first name + last
initial). DB-verified `support_team=2` for a participant with both. Connect's
"Your Support" lists both people automatically; a participant can hold Recovery
Coach + Navigator (+ residence support later) simultaneously — by design. No
internal staff metadata is exposed.

## W. Participant navigation visibility

The **Getting Connected** card (on Connect, deliberately not Today — §36
"do not overload Today"): active needs in participant language ("Housing —
We're working on this with you."), each connection step with humane copy
("Referral made", "Reaching out", "Your navigator helped connect you
directly.", "Provider unavailable right now"), and the §37 confirmation
prompt. Never rendered: internal enums, partner scoring, staff notes, grant
codes (component-tested). `/vrcc/messages` became multi-thread with clear
labels — "Jordan B. — Recovery Coach" / "Alex M. — Navigator" — same engine,
separate private relationships (§23).

## X. Service-event attestation

The first production attestation path (§29):
`record_navigation_service_event` — navigator identity derived from JWT,
active-relationship required (foreign navigator: `not_authorized`),
organization derived from the relationship, canonical `resource_navigation`
service type (seeded idempotently), modality/context/duration accepted,
optional referral linkage validated against the person. **Idempotent**
(`dup=already_recorded`, same event id). Service events are **never**
auto-created: the full verification chain (claims, messages, referrals,
confirmations) produced zero service events until a human attested
(`events_for_p1=1` after exactly one attestation). One interaction with three
referrals is still one service event — the referral is linkage, not a
multiplier.

## Y. Coach complete_session decision/status

**Implemented (§31)** — it shares the same evidence model and was low-risk:
`complete_session(appointment_id, duration?)` — provider-only (or platform
admin; the first verification caught a navigator passing the old
`is_admin_staff` check and 0113 closed it — re-verified
`foreign_complete=not_authorized`), appointment must be confirmed and started
(`not_started_yet` before the window; **no automatic completion from time
passing**), legitimate transition to `status='completed'`, exactly one service
event per appointment enforced by a partial **unique index** on
`service_events.appointment_id` (race-safe via unique-violation catch),
duration derived from the appointment unless corrected, canonical service type
from the appointment. Verified: `complete=completed idem=already_completed
one_event=1`. Coach UI exposure of the button is a small follow-up; the
canonical capability is live and verified.

## Z. T4b measurement status

**T4b is now measurable**: first substantive delivered service event =
`min(service_events.started_at)` per person/relationship, with provider,
type, and linkage canonical — stronger evidence than claim, relationship,
message, or appointment. **TTMHC remains NOT APPROVED**: nothing calculates,
labels, or publishes it; T4a is not converted into it. The full spine is now
T0 (request) · T1 (first coach message) · T2 (claim) · T3 (relationship) ·
T4a (two-way exchange) · **T4b (attested service)** — all from canonical
timestamps, all with denominators.

## AA. Outputs/outcomes/contribution model

Strictly separated in schema and language. **Outputs** (what GFA did):
navigator contact (service_events), resource shared / referral made / warm
handoff (navigation_referrals.referral_type), follow-up attempted
(follow_ups). **Outcomes** (what happened for the person):
navigation_referrals.status='connected' with evidence,
navigation_needs.status resolved/partially_resolved. **Contribution:** no
status name, column, or dashboard string implies causation — "connected" and
"resolved" state what happened, never that GFA solely caused it.

## AB. Unmet-needs denominator

Built in, verified, and protected: every identified need is a row regardless
of outcome; `unresolved` and `partner_unavailable` are first-class recorded
states (`unresolved_kept=1` in verification); `participant_declined` is
distinct from `partner_unavailable` so system barriers are attributable. The
platform can now answer "how many housing needs did we see, and how many were
resolved?" — needs by category ÷ needs resolved, with nothing hidden. The §33
measurement spine (needs by category, requests, assignments, time-to-assignment
via claim events, service events, referrals/handoffs, connections confirmed,
loop-closure rate, follow-up completion, resolution splits, resource demand,
gaps) is all derivable from canonical rows.

## AC. Funding-attribution readiness

`service_events.funding_source_id` exists and stays **optional** — neither
attestation RPC requires or even accepts it; frontline staff are never grant
accountants. Rule-driven attribution (program + service type + date +
eligibility → funding source, with fiscal review) remains the target
architecture for the crosswalk layer (§35); nothing in P4E encodes a funder.

## AD. Privacy/consent review

Full §44 matrix DB-verified (rolled back both rounds):

- Navigator ↔ their people: needs/referrals/thread/service — all work.
- **Foreign navigator: denied everywhere** — RPCs (`foreign_need/ref/outcome/
  service=not_authorized`) and RLS (`foreign_sees_needs/refs/rels=0`).
- Coach: zero navigation visibility (`coach_sees_needs=0`), cannot send into or
  read the navigator thread.
- Participant: sees own needs/referrals; both support threads; nothing else's.
- Admin: platform admins (administrator/system_administrator) retain
  operational metadata; P4D's transcript rule stands — message bodies remain
  member-only.
- **Defect found and fixed by this review:** 0112's fallbacks initially used
  0026's `is_admin_staff()` — which includes navigators and program managers —
  letting a foreign navigator through. 0113 introduced `is_platform_admin()`
  and rebound every navigation-domain fallback plus `complete_session`; 0114
  applied the same fix to `create_follow_up`. This is the second time the
  verification-first rule caught a real authorization defect before any UI
  shipped.
- **Consent (§19):** partner confirmation is consent-gated server-side —
  `record_referral_outcome(..., 'partner_confirmation')` returns
  `consent_required` ("check with the participant directly instead") unless an
  active granted, unrevoked, unexpired `data_sharing`-category consent exists
  (canonical consent infrastructure; verified both denied and granted paths).
  Being a navigator is never blanket permission to disclose SUD involvement.
- **Sensitive categories (§45):** need categories appear in no URLs, no
  analytics payloads, and no notification titles — participant notifications
  say "A new connection step from your navigator"; navigator notifications say
  "{name} responded about a connection."

## AE. PostgREST grant regression guard

Permanent preflight committed at
`supabase/launch/preflight/launch_contract_check.sql` and **run green against
the live launch project**: schema USAGE for both PostgREST roles; SELECT/
INSERT/UPDATE for `authenticated` on every recoveryos table; anon privileges
limited to the referral-intake surface; RLS enabled on every table; and an
RLS-bite check using simulated JWT claims + `set role authenticated` (an
unknown identity must read zero people rows) — proving definer functions are
not masking missing grants. Output: `LAUNCH CONTRACT PASS`. It is a regression
guard, explicitly not a substitute for the HTTP gate.

## AF. Realtime/HTTP status

Unchanged from P4D, honestly: messaging realtime is implemented but not
live-HTTP-proven, so **no fallback polling was retired** — navigator surfaces
use the same 15–20 s heartbeats. The HTTP gate remains non-negotiable and now
includes navigation: before soft launch, authenticated HTTP must exercise sign
in, person read, support request, coach claim, message, mark read, scheduling,
notification, **navigation claim, and referral/connection** against
RecoveryOS-Launch. Statuses used in this report: DB-, CODE-, BUILD-,
TYPECHECK-, TEST-VERIFIED — never HTTP-VERIFIED.

## AG. Analytics

Twelve process-only events added to the typed union:
`navigator_workspace_viewed`, `navigation_request_viewed`,
`navigation_request_claimed`, `navigation_relationship_established`,
`need_identified`, `referral_created`, `warm_handoff_recorded`,
`connection_confirmed`, `connection_not_confirmed`,
`navigation_follow_up_completed`, `navigation_service_event_recorded`
(+ `session_completed_recorded` reserved for the coach button). No narrative,
no referral notes, no need-category payloads. The database remains measurement
authority.

## AH. Accessibility/mobile

Built for community/hospital/court/outreach contexts: single-column responsive
cards (no desktop-only tables), one-tap status controls with visible text (no
icon-only actions), native selects for taxonomy/type (OS pickers on mobile),
minimal typing (destination name is the only required free text in the referral
flow), semantic labels on every control, sr-only past-due markers, visible
focus via shared primitives, ≥44 px touch targets, quiet attention items
(text, not alarm color).

## AI. Tests/build/typecheck

- `pnpm -r typecheck`: green, all packages.
- `pnpm -r build`: green. **NavigatorArea 25.63 kB (6.89 kB gzip)** own lazy
  chunk; CoachArea 24.91 kB; ParticipantArea 246.66 kB (+3 kB for
  multi-thread messages + Getting Connected); shared scheduling chunk now
  3.15 kB (better splitting); no meaningful regression.
- `pnpm -r test`: **117/117** (domain 67, platform 33, recovery-content 17) —
  up from 103. New: 10 navigation-domain tests (taxonomy neutrality, humane
  labels, referral semantics, confirmation options, attention priority/naming/
  domain-filtering), 3 NavigationStatusCard tests (participant language, enum
  leak check, confirmation flow, warm-handoff voice), coach pool
  domain-filtering test; pool fixtures updated to the focus-free projection.
- DB verification (rolled back): the full §48 routing matrix, §49 closed loop
  both directions, §50 service events, §44 privacy matrix (re-run clean after
  0113), consent gate both paths, and the launch-contract preflight.

## AJ. Backend migrations/gaps

**Three migrations, 10-step rule followed:**
1. **`0112_navigation_domain.sql`** — dispatcher claim, navigation lifecycle,
   navigator RPCs, focus-free pool projection, two-domain support team,
   navigation roster, `context='navigation'` messaging, `navigation_needs`,
   `navigation_referrals`, consent-gated outcomes, participant confirmation,
   service-event attestation + `complete_session`, service-event linkage
   columns + one-event-per-appointment unique index.
2. **`0113_navigation_privacy_correction.sql`** — `is_platform_admin()` and the
   rebinding of every navigation authorization fallback (defect caught by the
   §44 verification).
3. **`0114_navigator_follow_ups.sql`** — follow-up creation for navigation
   relationships + the same fallback fix.

**Known gaps (documented, none blocking):** navigator scheduling deferred with
the extension specified (§U); resource-directory picker (FKs ready, §R);
coach-side Complete Session button (RPC live, §Y); multi-member read receipts
(carried from P4D); realtime retirement pending live HTTP proof; participant
"Help navigating something" copy on Connect already routes via the existing
`navigation` option in `SUPPORT_REQUEST_OPTIONS`.

## AK. Exact P4F recommendation

**P4F — Recovery Residence Consolidation**, in this order:
1. **Contract audit first** (the pattern keeps paying): the residence domain
   (0004/0006/0013–0024) predates the P4C–P4E authorization discipline — sweep
   its policies for the `is_admin_staff` over-reach class and for direct-write
   surfaces that belong behind RPCs, before touching UI.
2. **Consolidate the resident/staff experiences** onto the P4B–P4E foundations:
   shared messaging (a `residence` context is the natural third), the
   attention-model pattern, and the service-event attestation spine for
   residence support services (the delivery_context/residence attribution CHECK
   already exists).
3. **Wire the residence ↔ recovery-support seam**: residence support in My
   Support (the support-team RPC's third context), referrals into
   `recovery_residence`-category needs, and applicant-flow → residency →
   support-team transitions.
4. **Do not** rebuild the working residence operations surfaces for elegance —
   audit, harden, integrate.

---

**P4E COMPLETE — READY FOR RECOVERY RESIDENCE CONSOLIDATION**
