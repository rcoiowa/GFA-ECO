# Relational Operations Architecture Analysis (Track B)

**Status:** Architecture analysis + implementation proposal. **No mutation, migration, RLS
change, or deploy is performed or authorized by this document.** Downstream product
requirements only.
**Scope:** Executive-direction sections 10–16, 18–23.
**Governing principle (executive):** prefer configuring/composing shared canonical
primitives over program-specific database silos. Every authorized GFA person should be able
to document the work they are authorized to perform; access follows **function and
relationship, not employment label**.

## 0. Headline finding

The canonical model **already contains most Track B primitives.** RecoveryOS can satisfy
GFARC, house meetings, general activity documentation, coaching sessions, external video,
relational session documentation, and the Needs Board largely by **composing and modestly
extending existing tables** — not by building parallel subsystems. Confirmed canonical
primitives (all present on `08b979f`):

- **`service_events` + `service_types`** — the delivered-service attribution spine.
  `service_types.category` already enumerates `coaching, peer_support, mentoring,
  accountability, recovery_circle, navigation, assessment, education, practice, check_in,
  support_request, event, other`.
- **`service_modality`** enum includes **`group`** (with `in_person, video, phone, chat,
  self_directed`); **`delivery_context`** includes `vrcc, recovery_residence,
  community_outreach, justice_reentry, partner_site, virtual, other`.
- **`meetings` + `meeting_attendance`** + RPCs `record_meeting` / `record_meeting_attendance`
  (0128) — group/house-meeting documentation with per-person attendance status.
- **`appointments`** — 1:1 scheduling with `service_type_id`, `status`
  (requested/scheduled/confirmed/in_progress/completed/cancelled/no_show/rescheduled),
  plus **`meeting_url` + `meeting_provider`** and a **`provider_meeting_rooms`** registry
  with a vendor-neutral provisioning RPC (0105).
- **`support_requests` + `support_request_events`** — participant-raised request with full
  lifecycle (`submitted→open→claimed→assigned→contacted→scheduled→active→resolved→closed/
  cancelled`), claim/assign fields, and an append-only event log.
- **`follow_ups`** — task primitive (assignee, due, status, links to appointment/service_event).
- **`notifications`** — recipient/kind/title/body/link_path/read_at.
- **Writer pattern** — SECURITY DEFINER RPCs (`record_service_event_internal` + typed
  wrappers) so documentation never requires table-wide participant read.

The genuine gaps are narrow: facilitator/type/topic/aggregate-attendance/lifecycle/recurrence
on the meeting model; a general authorized-facilitator write wrapper; a few new
`support_requests.request_type` values + transportation logistics + progressive-disclosure
RLS; and a lightweight helper-availability signal (nothing exists).

## 1. §16 architecture review

`Requirement | Existing mechanism | Reusable? | Gap | Minimum change | Privacy/RLS consequence | Human authority required`

| Requirement | Existing mechanism | Reusable? | Gap | Minimum change | Privacy/RLS consequence | Human authority required |
|---|---|---|---|---|---|---|
| GFARC / group meeting (§4,10) | `meetings`+`meeting_attendance`; `service_types.recovery_circle`+`event`; modality `group`; `service_events` | Yes (compose) | type, facilitator(s), topic (category+free text), aggregate-only attendance, virtual/hybrid location, Held/Cancelled lifecycle, series/recurrence, non-residence facilitators | Add nullable `service_type_id`, `facilitators`, `topic_key`+`topic_note`, `total_attendance`, `location_kind`, `status(scheduled/held/cancelled)`, optional `meeting_series` to the meeting model; widen `record_meeting` authorization to facilitation, not residence-staff-only | Only Held meetings count as delivered service; aggregate attendance avoids unnecessary participant rows; facilitator RLS scoped to their own meetings | ED sign-off on activity taxonomy + who may facilitate/record GFARC |
| House meeting (§5) | `record_meeting` (0128), residence-scoped, residence-staff gated | Yes as-is | facilitators + lifecycle; non-residence-staff facilitators assigned to the house | Same meeting-model extension; keep residence gate but allow assigned facilitators | Record ≠ read full resident record (already true) | Residence manager / ED on who facilitates |
| Generic activity (§6) | `service_events`+`service_types`; canonical writer wrappers | Yes (compose) | general facilitator write wrapper (self/navigation/residence-support only today); `other`+free-text description | One additive RPC `record_facilitated_service(person, service_type, modality, context, …)` authorized by relationship/assignment; reuse `service_types.other` | Writer needs no participant SELECT; dedupe key = one action→one event | ED on which functions may record which categories |
| Coaching session scheduling + external video (§12) | `appointments` + `meeting_url`/`meeting_provider` + `provider_meeting_rooms` + provisioning RPC | **Yes — already built** | provider-neutral already; add "update link without recreating", reminders wiring | Minor RPC/UI: reschedule-link, reminder via `notifications`/`follow_ups` | Provider room is per-coach, admin-manageable; unchanged | Coach; no schema authority needed |
| In-app session workspace (§13) | Coach Workspace (0108) + appointment + goals/follow-ups + consent | Yes (UI composition) | pre-session view; embed-vs-open-in-tab per provider; consent indicators surfaced | UI only; per-provider embed policy table (config, not core) | Coach sees **minimum** relationship-scoped fields; no audio/video capture or transcript by default | Coach; legal note on embedding/recording |
| Relational session documentation (§14) | `service_events` (who/when/modality/duration/type) + `follow_ups` + goals | Yes (compose) | topic/focus, needs-identified, next-step, referrals as structured-optional | Optional structured columns or `detail` on the service_event write; keep narrative optional | No clinical note required; scheduled≠attended≠completed preserved via appointment status + Held event | ED/coach lead on documentation minimums |
| Peer-to-peer transportation (§11) | `support_requests`+`support_request_events` lifecycle | Yes (extend) | `request_type` lacks `transportation`; logistics fields; progressive disclosure; five-step fulfillment evidence | Add `transportation` (and others below) to `request_type`; carry logistics in a light satellite or `detail`; RLS: coarse to eligible helpers, pickup logistics only to claimer | **Location/PII must not broadcast**; progressive disclosure required; request≠accept≠completed | ED + policy: insurance, driver authorization, background/driving-record, personal-auto, liability (below) |
| Universal support request / Needs Board (§15) | `support_requests` (already the primitive) | **Yes — this is the primitive** | widen `request_type` (transportation, housing_navigation, employment, reentry, technology, peer_connection, recovery_meeting, other); eligible-helper visibility | Add enum values; a Needs Board view filtered by helper eligibility + availability | Minimum-necessary disclosure per category; consent preserved | ED on categories + who may see/accept each |
| Helper availability (§21) | — none — | **No** | no availability signal exists | Add a lightweight voluntary `helper_availability` (person, can_accept, categories, until) | Availability ≠ authorization; requests never shown outside the eligible minimum group | ED on availability model |
| Notifications (§22) | `notifications` (+ deliveries) | Yes | per-trigger discipline table; no sensitive info in previews | Config/policy, not core schema | No recovery/housing/health/location detail in previews | ED on notification policy |
| Series/recurrence (§10 add) | — none — | Partial | recurring meeting definition → lightweight occurrences | `meeting_series` definition + occurrence generation; occurrence Scheduled→Held/Cancelled | Only Held contributes to counts | ED |

## 2. §17 — 0147 dependency analysis

`0147 dependency | why required now | evidence | consequence if deferred`

| Track B item | 0147 dependency | Why required now | Evidence | Consequence if deferred |
|---|---|---|---|---|
| GFARC / meeting documentation | **None** | — | Meeting + service_event primitives predate and are independent of `leads` | None; ships on its own track |
| House meetings | **None** | — | `record_meeting` (0128) already live-capable, unrelated to leads | None |
| Generic activity documentation | **None** | — | `service_events` spine independent of intake | None |
| Coaching sessions / video | **None** | — | `appointments`/provider rooms (0006/0105) independent of leads | None |
| Session workspace | **None** | — | UI over coach workspace + appointment | None |
| Relational session documentation | **None** | — | `service_events`/`follow_ups` independent | None |
| Transportation / Needs Board | **None** | — | `support_requests` (0025) independent of `leads`/0147 | None |
| Helper availability | **None** | — | New primitive, no 0147 coupling | None |

**Conclusion:** No Track B item is a condition precedent to, or a dependency of, canonical
0147. The only conceptual link is that a converted inquiry becomes a person who may later
appear in `service_events`/`support_requests` — which is *downstream of conversion* and
already handled by `leads.linked_intake_id`. **All Track B requirements are placed in the
downstream architecture queue.** 0147 is not held hostage to this roadmap (§17 satisfied).

## 3. §18 — canonical relational primitives

Track B maps cleanly onto a small reusable set; **no program-specific evidence architecture
is needed.** (Conceptual mapping, not authorization to create tables.)

| Primitive | Canonical carrier | Preserved distinction |
|---|---|---|
| Person | `people` | — |
| Relationship | `coaching_relationships`, `navigation_relationships`, `support_team_memberships` | — |
| Activity / Service | `service_events` + `service_types` | activity ≠ outcome |
| Session (scheduled) | `appointments` | scheduled ≠ attended ≠ completed |
| Meeting / group | `meetings` + `meeting_attendance` | attendance ≠ engagement; aggregate ≠ identified |
| Request | `support_requests` + `support_request_events` | request ≠ assignment ≠ connection ≠ fulfillment |
| Assignment | `assigned_person_id` / `claimed_by_person_id` fields | referral ≠ successful connection |
| Attendance | `meeting_attendance` (+ aggregate count, to add) | — |
| Connection | Held meeting / completed appointment / resolved request | — |
| Follow-up | `follow_ups` | — |
| Outcome | outcome_status on `service_events` + downstream evidence | activity ≠ outcome |

A program (GFARC, ANCHOR, Live-Out, coaching, housing) **configures/composes** these — e.g.
GFARC = `service_type` `recovery_circle` + modality `group` + a `meetings` occurrence +
aggregate attendance; ANCHOR/reentry = `delivery_context` `justice_reentry`.

## 4. §19 — documentation-burden review (proposed new/extended forms)

`required | optional | auto-derived | reason each required field is necessary`

**GFARC / group meeting occurrence**
- Required: date/start (or derived from series), activity type, facilitator(s), total
  attendance. *Reason:* these are the reportable when/what/who/how-many the ED needs; without
  them the record cannot evidence a delivered group service.
- Optional: end/duration, topic category, topic title, short factual note, follow-up,
  identified-participant attendance, location detail.
- Auto-derived: recorder, timestamp, authorized role, program/site (from series or context),
  provenance, `service_type` default from series, Held status on submit.

**House meeting** — same shape; residence auto-derived from the facilitator's assignment.

**General activity (`record_facilitated_service`)**
- Required: participant (or aggregate for group), service type, modality. *Reason:* minimum
  to attribute a delivered service to the spine.
- Optional: focus/topic, needs identified, next step, referrals, follow-up, duration, note.
- Auto-derived: recorder=provider, timestamp, org/context, dedupe key, provenance.

**Transportation request (participant-facing, §11/§20)**
- Required: destination/purpose, date, needed time. *Reason:* the minimum to know whether a
  ride can be offered.
- Optional: pickup point, return need, riders, accessibility need, short note.
- Auto-derived: requester, timestamp, status=Requested.

**Coaching session documentation** — Required: none beyond the appointment link + a Held/
Completed transition; everything relational is optional. *Reason:* peer recovery support must
not require a clinical-style progress note (§14). Auto-derived: who/when/modality/duration/
provider/provenance from the appointment and session state.

**Standard:** narrative is optional unless a specific operational, safety, contractual, or
legal reason requires it (§19). Prefer deriving recorder, timestamp, role, program/site,
scheduled participant/session, duration, and provenance from system state.

## 5. §21 availability, §22 notification discipline

**§21 Availability (genuine gap).** No availability primitive exists. Propose a lightweight,
voluntary `helper_availability` signal (person, can_accept boolean, eligible categories,
optional "until"). **Authorized-to-help ≠ currently-available-to-help.** A request is never
shown outside the minimum group authorized for that category, and availability further
narrows to those who opted in.

**§22 Notification discipline.** `trigger | recipient | channel | consent needed? | sensitive
info exposed? | retry/escalation`

| Trigger | Recipient | Channel | Consent | Sensitive in preview? | Retry/escalation |
|---|---|---|---|---|---|
| New intake inquiry | intake coordinators | in-app | no (staff) | No — id + pathway + due only | overdue → coordinator group at deadline+1 |
| New transportation/support need | eligible+available helpers | in-app Needs Board (email/SMS only if consented) | helper: no; participant location: **never in preview** | **No location/PII** — category + coarse area only | unfilled → reminder, then coordinator |
| Request accepted | requester + claimer | in-app (+ consented email/SMS) | participant consent for channel | reveal logistics only to the two parties | — |
| Session reminder | participant + coach | in-app (+ consented) | participant consent for email/SMS | No health/recovery detail | — |
| Overdue follow-up | assignee | in-app | no (staff) | No | escalate per policy |

No recovery, housing, health, trauma, justice, or location information in any notification
preview when a less revealing notification accomplishes the purpose (§22).

## 6. Transportation — organizational prerequisites (§11, before any implementation)

Peer-to-peer coordination only. RecoveryOS **must not** present GFA as a transportation
company, medical/NEMT provider, taxi, rideshare, or emergency transport. Before build,
resolve as **organizational policy** (not inferable from a coach/volunteer role): insurance
coverage, driver authorization, background check, driving-record standard, personal-auto
policy adequacy, liability allocation, and participant-safety requirements. A person is
**not** authorized to transport participants merely because they are a coach or volunteer
(§8 evidence distinction applies).

## 7. Recommendation

- **Extend canonical primitives; do not build GFARC/transportation/coaching/meeting silos.**
  Estimated core deltas: (a) meeting-model extension + `record_meeting` authorization widening
  + optional `meeting_series`; (b) one `record_facilitated_service` RPC; (c) widen
  `support_requests.request_type` + logistics + progressive-disclosure RLS; (d) a
  `helper_availability` signal; (e) UI: Needs Board, session workspace pre/post view, GFARC
  occurrence form.
- **Sequence:** none of this precedes canonical 0147. Recommended order after Phase 1 closes:
  (1) six deadline/routing decisions → close Phase 1; (2) meeting/GFARC + general facilitator
  write (highest daily value, lowest risk); (3) Needs Board universal support request, with
  transportation as its first type **after** the policy prerequisites; (4) session workspace
  polish.
- **Product principle preserved (§23):** helping should be easier than documenting it, while
  producing stronger relational evidence than documentation-first systems — the derive-don't-
  ask burden rules above are how that is enforced.

**STOP at architecture/implementation proposal. No CQCX mutation, account, role grant, 0147
apply, RLS change, or deploy is performed.**
