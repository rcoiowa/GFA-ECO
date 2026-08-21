# P4C — Coach Workspace Report

**Date:** 2026-08-08
**Backend authority:** RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`), schema `recoveryos` only
**Frontend authority:** `apps/platform` (`/coach/*`), React 19 + react-router 7 + TanStack Query v5
**Gate status:** typecheck ✅ · build ✅ · tests ✅ (82/82)

The point of this slice, restated from the directive: P4B promised the participant
*"We've got your request."* P4C puts a real human workflow behind that sentence —
someone asked for help, and another human being shows up.

---

## A. Coach information architecture

`/coach/*` is a lazy-loaded area (`CoachArea`, own build chunk, 18.7 kB) guarded by
`RequireRole ['coach', 'administrator', 'system_administrator']` (UX guard only — RLS
remains the security boundary). Professional-tone `AppShell` with five destinations:

| Route | Page | Purpose |
| --- | --- | --- |
| `/coach` | Home | Needs attention → today's sessions → people waiting (top 3) → follow-up and roster counts |
| `/coach/requests` | People waiting for connection | Open pool + Connect action |
| `/coach/participants` | My Participants | Relationship-scoped roster |
| `/coach/participants/:personId` | Participant view | Overview, sessions, follow-ups |
| `/coach/sessions` | Today's Sessions | Provider-side canonical appointments |
| `/coach/follow-ups` | Follow-ups | Past due / coming up / recently completed |

No placeholder remains: the P4A `CoachWorkspaceShell` stub was unwired from `App.tsx`
in favor of the real area. The frontend imports only canonical repositories — no
`v2_*`/`mvp_*`/`gfa_*` concept appears anywhere in `apps/platform`.

## B. Open-request pool

Source: `list_open_support_requests()` SECURITY DEFINER RPC (support-staff-gated),
read through `getOpenSupportRequestPool()` and polled every 20 s so waiting people
appear without a manual refresh. Cards show exactly the decision-necessary fields:
participant first name, kind of support (humane label via `requestTypeLabel`),
preferred way to connect, and how long they've been waiting (`formatElapsed`).
Empty state is calm ("No one is waiting right now"). **Open-request multiplicity
stays LOCKED as designed** — no uniqueness constraint was added; a participant may
have several open requests and each is claimed independently.

## C. Progressive disclosure

`focus` contains unrestricted participant free text, so per the directive
(*privacy beats convenience*) it is **omitted pre-claim**: `RequestsPage` never
renders it, and a test pins that (`focus` in the fixture is a sentinel string
asserted absent). It becomes visible only in the participant view **after** a
relationship exists, labeled "In their words", sourced from the relationship-scoped
roster RPC (`origin_focus`). Honest caveat, recorded as a V-item: the server
projection still returns `focus` to eligible support staff (the RPC is already
role-gated to support staff, so this is not public exposure), and a server-side
minimized pre-claim projection is the recommended defense-in-depth follow-up.

## D. Role/request eligibility matrix

`recoveryos.is_support_staff()` = `coach | navigator | program_manager |
administrator | system_administrator`. Matrix as verified in the launch DB:

| Capability | Participant | Coach | Navigator | Program mgr | Admin/SysAdmin |
| --- | --- | --- | --- | --- | --- |
| Create support request (own) | ✅ | ✅ (as participant) | ✅ | ✅ | ✅ |
| See open pool | ❌ | ✅ | ✅ | ✅ | ✅ |
| Claim (`claim_support_request`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Cancel own request (`cancel_support_request`) | ✅ owner-only | owner-only | owner-only | owner-only | owner-only |
| Roster (`get_my_participants`) | ❌ (empty) | own relationships | own relationships | own relationships | own relationships |
| Follow-up create/complete | ❌ | own relationship / assignee | same | same | any (admin override) |

Decision recorded: the claim surface is deliberately broader than the `/coach`
route (navigators and program managers can claim server-side). This is a product
decision, not an accident — no server tightening was needed for P4C; the UI simply
doesn't yet offer those roles a claiming surface.

## E. Claim workflow

Button copy is **"Connect with this person"** — never "Claim". Flow:
`useClaimRequest()` → `claim_support_request(p_support_request_id)` (SECURITY
DEFINER, `FOR UPDATE` row lock). The RPC atomically: validates the request is open
and unclaimed, verifies the participant has no active coaching relationship,
creates the `coach_relationships` row, marks the request claimed, and logs a
`support_request_events` row of type `claimed`. Return codes map to outcomes:
`claimed`/`already_yours` → connected; `already_claimed`/`not_open`/`not_found` →
race lost; `participant_has_coach` → has coach; anything else → humane failure.
`onSettled` invalidates `coachKeys.openRequests`, `coachKeys.roster`, and
`participantKeys.all` — server truth wins for everyone.

## F. Race/concurrency UX

Concurrency is decided by the database row lock, never the client. The loser sees
exactly the directed copy: **"Someone else just connected with this person. That's
okay — there may be others still waiting."** — an info tone, not an error; no
status codes, no "409", no technical vocabulary (tests pin all three). DB-verified
on the launch project (rolled back): two claims on one request produced
`win=claimed race=already_claimed`.

## G. Claim→relationship→participant transition

Winner is navigated straight to `/coach/participants/{participant_person_id}` —
the claim ends inside the new relationship, not on a list. The participant's P4B
Connect experience flips from *waiting* → *someone is on it* → *connected* through
its own canonical reads: the claim invalidates `participantKeys.all` in the same
client, and cross-device the P4B queries poll (20 s), so the transition needs no
legacy bridge. Relationship rows are the single source: roster, participant view,
and P4B `get_my_support_team()` all read from `coach_relationships`.

## H. My Participants

`get_my_participants()` (0108) returns only the caller's **active** relationships:
`relationship_id, participant_person_id, display_name (preferred → first+last),
pronouns, relationship_type, is_primary, started_at, origin_request_type,
origin_focus`. This mirrors the P4B `get_my_support_team()` design in the other
direction — identity disclosure is relationship-scoped in both directions, and no
broad `people` SELECT policy was added. Cards show name, pronouns, what they asked
for, together-since, today's session time, and a follow-up-due flag.

## I. Coach participant view

`/coach/participants/:personId` renders only what the relationship authorizes:
Overview (connected-since, "They asked for", "In their words" — the origin focus,
now legitimately visible), today's sessions for that person, and the follow-up
list with complete/create. There are **no dead tabs**: messaging and interactive
scheduling are stated in plain text as arriving with the next release rather than
rendered as disabled buttons.

## J. Today's Sessions

Read-only canonical `appointments` where the coach is `provider_person_id`,
narrowed by the pure `todaysAppointments()` view model (current local day,
`confirmed`/`scheduled` only, sorted). `SessionRow` shows who, when — formatted in
the **appointment's own timezone** with a zone label when the viewer differs
(`formatAppointmentTime`) — modality, and a Join link for video sessions with a
`meeting_url`. No appointment mutation surface exists in P4C; **an appointment is
still not treated as evidence a service was delivered** (see Q).

## K. Needs Attention

`deriveCoachAttention()` is a pure, tested domain function. Priority order:
imminent session (≤ 2 h, named via roster map) → overdue follow-ups → people
waiting in the pool → follow-ups due today; capped at four items so the panel
stays a nudge, not a queue. Rendered at the top of Coach Home.

## L. Follow-up model

Canonical `recoveryos.follow_ups` (subject `person_id`, `assigned_person_id`,
optional `appointment_id`, `follow_up_type`, `due_at`, `status`, `note`,
`completed_at`). Lifecycle goes through RPCs only (0108):
`create_follow_up` — caller must hold an active relationship with the subject (or
be admin), assignment pinned to the caller; `complete_follow_up` —
assignee-or-admin, idempotent (`already_done`). Components never write the table
directly.

## M. Follow-up queue

`/coach/follow-ups` groups the coach's assigned follow-ups into **Past due**
(attention border + `sr-only` "(past due)" for screen readers), **Coming up**, and
**Recently completed**, each row completable with one humane "Done" action.
Creation lives on the participant view (date + optional why), because a follow-up
is a commitment about a person, not a task in the abstract.

## N. Realtime status

Deferred again, deliberately. The pool polls at 20 s, other reads use the standard
15 s staleness — at launch cohort size the freshness difference between polling
and websockets is imperceptible, while realtime adds a connection-lifecycle
failure mode to the most emotionally sensitive surface we have. The claim path
does not depend on freshness for correctness (the RPC decides races). First
realtime upgrade remains: `postgres_changes` on `support_requests` to replace pool
polling, evaluated in P4D alongside messaging (which is the first feature that
genuinely wants a live channel).

## O. Cancellation hardening

Migration 0108 replaced the P4B guarded-UPDATE cancellation with a dedicated
SECURITY DEFINER RPC and **dropped the broad UPDATE policy**
(`sr_participant_cancel`), so the bypass class is structurally eliminated — there
is no longer any UPDATE path on `support_requests` for participants at all.
`cancel_support_request`: owner-only, only `open`/`submitted` **and unclaimed**,
idempotent (`already_cancelled`), logs a `support_request_events` row of type
`cancelled`. `packages/data-access` `cancelMySupportRequest` now calls the RPC.
DB-verified (rolled back) on the launch project:
`own=cancelled · idem=already_cancelled · foreign=not_authorized ·
claimed=not_cancellable`, and a direct table UPDATE as the participant affects 0
rows.

## P. Privacy/RLS verification

DB-verified with fixture identities on the launch project, all inside a rolled-back
transaction:

- **Roster scoping:** coach with one active relationship sees exactly 1 row from
  `get_my_participants()`; a second coach sees 0 (`own=1 foreign=0`).
- **Follow-up scoping:** creating a follow-up for a participant with no
  relationship → `not_authorized`; completing another coach's follow-up →
  `not_authorized`.
- **Cancellation:** foreign cancel → `not_authorized`; direct UPDATE bypass → 0 rows.
- **Claim events:** exactly one `claimed` and one `cancelled` event row written
  (`EVENTS claim=1 cancel=1`).
- No broad `people` SELECT policy exists; coach-visible participant identity flows
  only through the two relationship-scoped RPCs (0107 participant→coach, 0108
  coach→participant).

## Q. Service-event measurement readiness

Unchanged and honest: **an appointment is not a service event.** Nothing in P4C
records service delivery from a calendar row. The structural hooks are ready for
the future service-event slice — appointments are canonical, follow-ups can
reference an `appointment_id`, and `support_request_events` gives lifecycle
evidence — but no table or metric claims a service occurred, and none will until
a human attests it.

## R. Time-metric status

- **T0** = `support_requests.created_at` (ask) — recorded.
- **T2** = claim (`support_request_events` type `claimed` / `claimed_at`) —
  recorded. Valid metric: **"Time to Claim" (T0→T2)** — a claim is a
  `request_claimed` / human-acknowledgement event, **not** a first human response.
- **T3** = `coach_relationships.started_at` (relationship established) — recorded;
  T0→T3 is valid.
- **T1** (first human response) and **T4** (substantive two-way exchange) remain
  UNRESOLVED until messaging exists (P4D).
- **TTMHC ("Time to Meaningful Human Connection") is still not claimed anywhere** —
  no dashboard, doc, or event name uses it. Claim is never mislabeled as response.

## S. Analytics events

Six coach events added to the process-only `AnalyticsEvent` union (ids and
timestamps only — no free text, no recovery narrative, no `focus` content ever):
`coach_workspace_viewed`, `open_request_viewed`, `support_request_claim_attempted`,
`support_request_claimed`, `support_relationship_established`,
`follow_up_completed`. Sink remains pluggable/buffered (dev console in DEV) until
an approved destination exists.

## T. Accessibility/mobile review

Buttons are real `<button>`s with visible text (no icon-only actions); alerts use
tone components, and race/failure messaging is text, not color alone; past-due
follow-ups carry an `sr-only` "(past due)" alongside the visual border; breadcrumb
nav is a labeled `<nav aria-label="Breadcrumb">`; card lists are semantic `<ul>`;
layouts are single-column flex/wrap and hold at 360 px; tap targets are `size="md"`
or larger. Time is rendered in the appointment's own timezone with an explicit
zone label when the viewer's differs.

## U. Tests/build/typecheck

- `pnpm -r typecheck` — green across all 10 packages.
- `pnpm -r build` — green; `/coach` is its own lazy chunk (CoachArea 18.72 kB).
- `pnpm -r test` — **82/82 passing** (domain 43, platform 22, recovery-content 17).
  App coverage **grew** with the slice, per the directive: domain +5
  (`coach.test.ts`: attention priority/imminence/cap, today filtering/sorting) and
  platform +6 (`RequestsPage.test.tsx`: progressive disclosure — sentinel focus
  text never renders pre-claim; no database vocabulary; calm empty state; winner
  navigation to the participant; race-loser humane copy with no technical detail;
  failure copy). Cancellation hardening, claim races, roster scoping, and
  follow-up authorization are covered by the rolled-back DB verification in P/O —
  the concurrency and RLS truths live in the database, so they are verified there.

## V. Backend changes/gaps

**Changed (one migration, applied to launch + committed as
`supabase/launch/migrations/0108_coach_workspace.sql`):**
`cancel_support_request` RPC + drop of `sr_participant_cancel` policy;
`get_my_participants` roster RPC; `create_follow_up` / `complete_follow_up` RPCs.
Followed the 7-step backend-change rule: contract check → migration in the curated
launch set → applied via migration tooling → DB-verified rolled back → repository
layer → UI → tests.

**Known gaps / follow-ups (none block P4C):**
1. Server-side minimized pre-claim pool projection (drop `focus` from
   `list_open_support_requests`) — defense-in-depth; render layer already omits it.
2. Realtime upgrade for pool + messaging (P4D evaluation).
3. Roster session-today flag derives client-side from today's appointments; fine
   at this scale.
4. Standing gates unchanged and untouched: no HTTP-VERIFIED claim (egress to
   `*.supabase.co` still blocked in this environment — semantic HTTP standard
   holds), 0104 reminder cron not activated, no DNS/vrcc.app changes, archive
   project untouched, no external SMS/email, no public exposure.

## W. Exact P4D recommendation

**P4D — Messaging & Scheduling Loop**, in this order:
1. **Messaging first** (it resolves T1/T4): canonical conversation per
   relationship, participant↔coach only, RPC-mediated sends, RLS-scoped reads;
   define T1 = first coach message after T2, T4 = first substantive two-way
   exchange — only then may any "meaningful connection" language be evaluated,
   still without the TTMHC label until you approve it.
2. **Scheduling negotiation second**: propose/accept/decline flow writing
   canonical `appointments` through transactional RPCs, reusing the P4B booking
   read models; coach proposes, participant confirms; timezone-honest throughout.
3. **Realtime decision inside P4D**: adopt for messages (genuine need), and if
   adopted, retire pool polling in the same slice.
4. Keep external SMS/email fanout OFF; in-app notifications only, extending the
   0107 notification pathway.

---

**P4C COMPLETE — READY FOR MESSAGING & SCHEDULING LOOP**
