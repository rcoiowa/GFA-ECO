# P4B — Participant Connection Experience: Report (A–V)

**Date:** 2026-08-08 · **Backend:** RecoveryOS-Launch `cqcxvwoukyhxyokfwnjm` · **Slice:** the
participant connection loop — *ask → heard → responding → connected → next connection → needs
attention*. Boundaries held: no DNS/vrcc.app changes, no reminder-cron activation, no external
SMS/email, HTTP verification not claimed (§41).

## A. Product-state model

`deriveConnectionState()` in `@recoveryos/domain` (pure, unit-tested) resolves canonical truth
into UI states: `NO_REQUEST → REQUEST_OPEN → REQUEST_CLAIMED → RELATIONSHIP_ACTIVE →
SCHEDULING → APPOINTMENT_CONFIRMED`. Nothing is persisted for the frontend — states derive from
support_requests + support team + relationship + bookings + appointments each render. Multiple
open requests are legal server-side; the most recent current request drives the headline and
history stays reachable (§36 — no client-side uniqueness rule invented; policy question
documented in U).

## B. Query-state architecture

TanStack Query v5 adopted (§3): one `QueryClientProvider` at the root; `participantKeys` factory
(no ad-hoc string keys); mutations never auto-retry; query retry only for plausibly-transient
errors (authorization/constraint failures are final); 15s staleTime, focus refetch; connection
queries poll gently (20s) while realtime is deferred (O). Auth/session, form, and route state
stay outside Query per §3.

## C. Data-access changes

- **DTO promotion (§4):** the eight coaching contracts moved to `@recoveryos/domain`
  (`coaching.ts`) with `coachingReads.ts` re-exporting — one contract, no `*Dto`/`*View` dupes.
- **New reads:** `getMySupportTeam()` (RPC, below), `getMyBookingStates()` (booking requests +
  active proposal round — party-scoped RLS verified).
- **New writes:** `markNotificationRead`, `markAllNotificationsRead` (RLS `notif_own_update`
  verified present), `cancelMySupportRequest` (guarded to open/submitted; enforced by
  `sr_participant_cancel` own-rows policy — verified present, so cancellation shipped rather
  than faked, §11).
- **Contract verification first (§2):** every field name and policy was checked against the live
  launch project before any frontend contract was written; the support-request lifecycle
  timestamps (`created_at`/`claimed_at`/`cancelled_at`) verified real.

## D–G. Connect experience (Mode A / B / C)

`ConnectPage` replaced (placeholder → the product's center):
- **Mode A "How can we support you today?"** — five calm selectable cards mapped 1:1 to
  canonical `request_type` values (recovery_coach, peer_support, navigation, life_coach,
  needs_assessment) in humane language; then modality chips (canonical values) + one optional
  free-text; no assessments, no grant fields (§8, overlay §3). No optimistic success — the
  waiting state renders only after the server confirms.
- **Mode B "We've got your request."** — reassurance + type/modality/requested-when in plain
  language; calm elapsed time (no countdown anxiety); claimed state upgrades to "Someone is on
  it"; withdrawal is "I no longer need this request" with gentle confirmation, only while still
  open (claimed requests are not client-cancellable). No lifecycle vocabulary anywhere
  (tested: OPEN/unassigned/ticket never render).
- **Mode C "Your Support."** — support people via the progressive-disclosure RPC (first name +
  last initial + role label), relationship tenure, next session or "choosing a time" state.
  **No dead buttons:** Message/Schedule actions intentionally absent until P4C/P4D make them real
  (§12, §28); designed as a support *team* list, not a single hard-coded coach (§13).

## H–J. Today: My Support · Next Connection · Needs Attention

`TodayConnection` strip added above the existing (untouched) Recovery Pulse experience:
`MySupportCard` (connect / working-on-it / connected states), `NextConnectionCard` (who, day,
local time with timezone label, modality, Join action only for video links; renders nothing loud
when nothing is scheduled; distinguishes "choosing a time"), `NeedsAttentionCard` (max 3
participant-actionable items: scheduling waiting, connection made, unread notifications). A
failure in the connection queries renders nothing rather than blanking Today (§24, §37 — all
queries parallel via `useQueries`, no waterfall).

## K. Notifications

`/vrcc/notifications`: recent 30, unread emphasis + SR-only "(unread)" annotation, mark-read on
open, mark-all-read, calm empty state, and a plain-language footer reaffirming in-app-only
delivery. Navigation goes through `safeLinkPath()` — internal absolute paths only; external/
protocol/protocol-relative values fall back to Today; stored legacy paths map to canonical
routes (tested, §18).

## L. Support Now integration

Verified rather than rebuilt (§20): the safety ladder's stepped escalation is preserved
untouched (grounding → GFA warmline → office → message support team → Iowa Warm Line → 988 →
911); its "message support team" step routes to `basePath + '/connect'`, which after P4A's
route migration is exactly the real `/vrcc/connect` experience. Distress ≠ coaching request:
only the deliberate mid-ladder step lands on Connect.

## M. Booking-read contract

`getMyBookingStates()` answers exactly the P4B questions (is scheduling underway / is a proposal
round active / did an appointment result) via `BookingStateRow` + `BookingProposalRow` in
domain — the clean contract P4D's interactive negotiation builds on (§27). No negotiation UI
was built.

## N. Messaging boundary

Not shipped, honestly (§28): send/read-state/realtime is P4D. No Message button renders; no
read-only thread was added (no live conversations exist to summarize — value would be zero).
Canonical reads remain available in data-access for P4D.

## O. Realtime status

Deferred deliberately per §26's escape hatch: the waiting→connected transition is served by
gentle 20s polling + focus refetch through the query cache (single source of server state, no
duplicate copies). Canonical realtime (support_requests/relationships/notifications →
invalidation-driven refetch) is documented as the first upgrade of the next slice; correctness
before novelty.

## P. Accessibility / mobile review

Selection cards and modality chips are real buttons/radios (keyboard + SR accessible; radios
use native inputs with `sr-only`), status changes use `role="status"`, errors are
`role="alert"` (Alert primitive), unread state is not color-only (border + SR text), touch
targets ≥44px, single-column layouts comfortable at 320px, focus-visible outlines inherited
from tokens. The comprehensive WCAG 2.2 AA audit remains P4H.

## Q. Analytics instrumentation

`track()` funnel events wired: `connect_page_viewed`, `support_request_started`,
`support_request_submitted`, `support_request_cancelled`, `connection_established_viewed`,
`notification_opened`. Payloads carry no free text, no message bodies, no recovery narrative
(§30, overlay §12). The sink is pluggable and currently buffered/no-op — an approved analytics
destination is a future ops decision, the instrumentation points are stable now.

## R. Time-to-Meaningful-Human-Connection — definition status (overlay §2, §31)

Conceptual timeline and current evidence, kept as **independent stages** (not collapsed):

| Stage | Definition | Canonical evidence today |
| --- | --- | --- |
| T0 support requested | `support_requests.created_at` | **Authoritative** |
| T1 first human response | first staff action visible to participant | **Not yet evidenced** — no event distinct from claim exists; candidate: first notification/message from staff (P4C/P4D) |
| T2 request claimed | `support_requests.claimed_at` | **Authoritative** |
| T3 relationship established | `coaching_relationships.created_at/started_at` | **Authoritative** (started_at is date-grained; created_at is the precise instant) |
| T4 first substantive two-way interaction | first exchanged messages or completed session (service event) | **Requires future evidence** — messages (P4D) or session service events (P4C+) |

**No "Time to Meaningful Human Connection" number is claimed.** T0/T2/T3 are computable today;
T1 needs a first-response event; T4 needs message/service-event evidence. Decision on which
stage constitutes "meaningful" is deferred until T4 evidence exists — recorded here as the ADR
note.

**RecoveryOS Measurement Readiness** (overlay §13): authoritative timestamps T0/T2/T3 (above);
derivable: scheduling initiated (`booking_requests.created_at`), appointment confirmed
(`appointments.confirmed_at`); requiring future evidence: T1, T4, service-delivery counts
(appointments ≠ service events — overlay §5; Connect actions do not create service events in
P4B, the future attach points are claim→relationship (P4C) and session completion (P4C/P4D)).
Need taxonomy (overlay §4): `request_type` covers coaching/peer/navigation/life-coaching/unsure;
broader needs (housing, transportation, treatment, employment, reentry, residence, social) are
currently only expressible via `navigation` + free-text `focus` — a taxonomy refinement
candidate for P4E's navigator slice, documented, not built. Referral-loop compatibility
(overlay §6): `recoveryos.referrals` exists and is untouched; connection states do not conflate
referral-made with connected. Output/outcome/contribution semantics (overlay §7) adopted in
docs; no causal claims encoded. Progressive capture (overlay §8): nothing added to onboarding
or Connect; BARC-10 untouched (overlay §9); no funder-named fields anywhere (overlay §10).

## S. Testing results

**71 tests, all passing** — the app-level suite now exists (§38): domain 38 (connection-state
derivation incl. multiplicity/past-appointment/priority cases, safeLinkPath safety, humane
labels, timezone + elapsed formatting), recovery-content 17 (pre-existing), **apps/platform 16
new** (ConnectPage Mode A selection/submission/failure-preserves-draft, Mode B
no-database-vocabulary + gentle cancel + claimed state, Mode C no-dead-buttons +
no-staff-field-leakage; Today cards states; attention derivation caps/order). Mocked contracts
only — no production participant data.

## T. Build/typecheck results

`pnpm typecheck` 10/10 green · `pnpm build` green (526 modules; index chunk ~590KB — tracked,
P4H owns optimization; +TanStack Query is the only new runtime dependency) · `pnpm test` 71/71.

## U. Backend gaps discovered

1. **Coach identity read (RESOLVED via smallest safe change, §40 process followed):**
   participants could not read their support person's name (`people` is self+residence-staff
   only). Added launch migration `0107_support_team_read` — SECURITY DEFINER
   `get_my_support_team()` returning only first name + last initial + role label for the
   caller's own active relationships. No table policy widened; applied + committed.
2. **`sr_participant_cancel` breadth (documented, not changed):** the RLS UPDATE policy allows a
   participant any update on their own request rows; the client uses a guarded
   status-transition, but a status-scoped policy (or cancel RPC) would be tighter — P4C
   hardening candidate.
3. **T1 first-response evidence** absent (see R) — candidate P4C event.
4. **Open-request multiplicity policy:** backend allows several open requests; UI handles it;
   whether product policy should restrict it is an owner decision — React cannot enforce it
   securely either way (§36).
5. **Content corpora decision (§29) — recorded:** production authority for the seeded DB content
   is `recoveryos.slogans` (the 59 GFA community corpus, seeded/verified); the
   `recovery-content` package corpus ("Recovering the Mind", 59 numbered slogans with
   ICARE/VIA/practice apparatus) remains the **daily-practice engine** already live on Today —
   they are different works, not duplicates. No merge, no rewrite; future path: surface DB
   slogans via an admin-curated content feature; revisit at the P4 content slice. Did not block
   the connection flow.

## V. Exact P4C recommendation

Build the **Coach Workspace** next: (1) coach-side hooks over the existing fixture-aware
`list_open_support_requests` pool + `claim_support_request` (RPC owns concurrency; graceful
loser UX); (2) My Participants roster (relationships + next appointment + follow-up placeholder);
(3) coach Today (needs-attention → today's sessions → open pool ordering); (4) claim →
relationship → notification loop closes the participant's Mode B→C transition end-to-end;
(5) emit the T1 first-response event at claim-time notification; (6) follow-ups repository +
queue (table exists, zero client references); (7) then P4D completes messaging + interactive
scheduling to finish the full loop. Progressive-disclosure check on pool `focus` exposure
before widening anything (§34).

---

# P4B COMPLETE — READY FOR COACH WORKSPACE

A participant can ask for support in humane language, see that Grace received it, watch it move
from "we're finding someone" to "someone is on it" to a named support person, see their next
session in their own timezone, and see what needs their attention — with zero internal system
vocabulary, on a phone, accessibly, backed entirely by canonical RecoveryOS truth.
