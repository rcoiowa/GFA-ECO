# Relational operations architecture review — Track B against the canonical model (2026-09-05)

**Status: analysis and implementation proposal only.** Required by §16 of the 2026-09-05
executive decision
(`docs/decisions/2026-09-05-phase1-executive-identity-intake-decisions.md`). No schema
object, RLS change, migration, or deploy is created by this document. All evidence below
is repository evidence from the canonical line (file references inline), read in full
this session.

## Headline finding

The canonical model already contains most of Track B. The reusable spine:

- **Person / Relationship:** `people`, `coaching_relationships`,
  `navigation_relationships`, `support_team_memberships` (0002/0025/0112/0107).
- **Request:** `support_requests` + append-trail `support_request_events` (0025) with a
  participant self-insert policy, an open-pool staff view, and a claim RPC
  (`claim_support_request`, 0027) — this **is** the Needs Board primitive §15 asks for.
- **Session:** `booking_requests`/`booking_proposals` → `appointments` (0025/0006) with
  vendor-neutral `meeting_provider text` + `meeting_url`, a provider room registry
  (`provider_meeting_rooms`, 0105), server-authoritative link provisioning
  (`provision_appointment_meeting`, 0105), and a reminder engine (0101/0104,
  `appointment_reminders`).
- **Activity/evidence:** `service_events` + `service_types` under the **ratified
  provenance canon** (0133: closed `source` vocabulary, dedupe keys; 0134: the only
  writers — `complete_session`, navigation, residence, `record_my_activity`; 0137
  retires self-insert). `scheduled ≠ attended ≠ completed ≠ outcome` is already
  enforced structurally (appointment status vs service event vs evidence-gated state
  records; `outcome_status` deprecated precisely to prevent activity/outcome conflation).
- **Attendance:** `meetings` + `meeting_attendance` (0006), residence-scoped RLS
  (0009/0014).
- **Follow-up:** `follow_ups` (0025) with `create_follow_up`/`complete_follow_up`
  (0108/0114), linkable to appointments and service events.
- **Notification / consent:** `notifications` + `notification_deliveries` (0025, RLS'd,
  minimal-content pattern already practiced), `consent_grants`/`consent_types` +
  0140/0145 extensions.

So Track B is overwhelmingly **configuration and extension of existing primitives**,
not new subsystems. Three genuine gaps: (1) group/community occurrences (type, topic,
facilitators, aggregate attendance, scheduled→held/cancelled, recurrence, community
scope); (2) a transportation/logistics request category with progressive disclosure and
a non-coaching acceptance path; (3) an ad-hoc staff-attested interaction writer for
authorized non-appointment work. Everything else is UI composition or vocabulary.

## §16 mapping table

| # | Requirement | Existing mechanism | Reusable? | Gap | Minimum change | Privacy/RLS consequence | Human authority required |
|---|---|---|---|---|---|---|---|
| 1 | GFARC / group & community meeting documentation (§4, §10) | `meetings`, `meeting_attendance`, `service_types` (`recovery_circle` seeded), `follow_ups` | Yes — extend, don't replace | No activity type/topic/facilitators; no aggregate count; no location/modality designation; no scheduled→held/cancelled; residence-only write path | One migration: extend `meetings` (`activity_type` → `service_types`, `topic_category`, `topic_title`, `total_attendance`, `location_kind` incl. virtual/community, `status scheduled/held/cancelled`, `recorded_by_person_id`, `recorded_at`, `series_id`); small `meeting_facilitators` join; one `record_meeting_occurrence` RPC authorized by facilitator assignment or staff function. One program/activity family for GFARC aliases (GFARC Meeting = GFA Recovery Circle = GFARC) via a single `service_types` row + display aliases in content, never three types | Facilitator write ≠ participant-record read: policy grants write on the occurrence + its attendance rows only; aggregate-only attendance is representable (`total_attendance` with zero identified rows), so no participant records are created merely to prove a meeting happened | Executive approval of the migration; program owner defines the type vocabulary |
| 2 | Recurring series (addendum) | none (meetings are single rows) | n/a | No recurrence | `meeting_series` table (program, location, weekday/time, default facilitators); occurrences generated as `scheduled`, only `held` counts as delivered service | Series carries no participant data | Same migration approval |
| 3 | House meetings (§5) | Same `meetings` machinery; residence-scoped RLS exists (0009/0014) | Yes | Coaches/volunteers who actually run house meetings can't write today (write = `staff_residence_ids()` only) | Facilitator-assignment authorization from #1 covers it: a person assigned to facilitate at a residence writes that occurrence + attendance, nothing else. Avoids blanket `residence_staff` grants | Exactly §5's boundary: record-a-meeting permission without residence-wide or participant-record visibility; attendance entry limited to the meeting's roster context | Residence manager or platform admin assigns facilitators |
| 4 | Generic activity documentation incl. "other" (§6) | `service_events` + `service_types` (`other` category exists); provenance canon 0133/0134 | Yes | No writer for ad-hoc authorized interactions (peer-support conversation, reentry/ANCHOR, Live-Out, intake interaction outside the lead RPCs) | One `record_support_interaction` RPC: staff_attested, dedupe-keyed, authorized by an active relationship (coaching/navigation/support-team) or facilitator/meeting context; service type from the existing vocabulary + optional short factual note | Writer scoped to existing relationship — no browse access created; respects the closed provenance vocabulary rather than loosening it | Executive approval; provenance canon governs (no new `source` values) |
| 5 | Peer-to-peer transportation (§11) | `support_requests`/`support_request_events`, participant self-insert + cancel policies, open-pool visibility, claim RPC, `notifications` | Yes — as a new request category, not a subsystem | `request_type` check lacks `transportation`; `claim_support_request` creates a coaching relationship (wrong for rides); no logistics fields; pool view would expose pickup details; no completion evidence distinct from acceptance | Migration: add `transportation` to `request_type`; nullable `logistics jsonb` (destination/purpose, date, pickup/arrival time, riders, accessibility need, return need, note) + `fulfilled_at`; `accept_transport_request` RPC (no coaching relationship; requires transport authorization); pool SELECT exposes category/date/area only — logistics visible to requester + accepter + admin (progressive disclosure via column-limited view or RPC) | Location data is the sensitive core: pool sees "a ride is needed on date X (area)", never exact pickup; notifications carry no location/purpose (§22). Request→acceptance→fulfillment recorded as separate events — a requested ride is never counted as a provided ride | **Blocked on organizational policy before activation:** insurance, driver authorization, background check, driving record, personal-auto policy, liability, participant safety. Transport authorization is an explicit designation (see #9), never inferred from coach/volunteer status. Peer-to-peer boundary language in all UI copy |
| 6 | Universal Support Request / Needs Board (§15) | Same `support_requests` primitive | Yes — it already is one | Vocabulary only: `request_type` today is coaching-shaped (`peer_support`,`recovery_coach`,`life_coach`,`navigation`,`needs_assessment`) | Extend `request_type` toward the funnel need classification (transportation, recovery community, reentry, employment, technology/digital access, other + short description). Per-category acceptance rules (coaching categories keep relationship creation; logistics categories don't) | Category determines the authorized pool (§21: "do not expose requests outside the minimum group") | Executive approval of the category vocabulary (this is also the funnel-requirement need classification — one vocabulary, ratified once) |
| 7 | Coach scheduling + external video (§12) | `booking_requests`/`proposals`, `appointments` (modality, timezone, `meeting_provider` text = vendor-neutral, `meeting_url`), `provider_meeting_rooms`, `provision_appointment_meeting` (idempotent, no public fallback, explicit-URL path for server integrations), reminder engine 0101/0104, coach workspace UI | Yes — substantially built | "Update link without recreating" (provisioning is deliberately idempotent; no replace path); provider identification beyond free text is fine as-is | Small `replace_appointment_meeting_url` RPC (provider-or-admin, audited) or an explicit-replace flag on the existing RPC | Unchanged — link visible to the appointment's parties | None beyond migration approval |
| 8 | Session Workspace + pre-session view (§13) | `useCoachWorkspace`, `get_my_participants`, goals/`action_steps`, `follow_ups`, consent indicators, appointments | Yes | UI composition only — no schema gap. Embedding: never assume iframe-ability; provider-by-provider matrix (Ooma/RingCentral/Zoom/Meet/Teams SDK & embedding policies) is product research | Coach-workspace page: pre-session (join link, purpose, prior follow-up, open participant requests, consent boundaries) → during (documentation controls beside/behind the call) → after (`complete_session` + follow-up). Open-in-tab is the universal fallback; no weakened browser security; no recording/transcripts by default (nothing records today — preserve) | Displays only relationship-scoped data already authorized; consent indicators surfaced from `consent_grants` | None (UI); provider embedding decisions documented per provider |
| 9 | Availability vs authorization (§21) | none | n/a | No availability signal | Lightweight voluntary flag (e.g. `helper_availability`: person, category, available boolean, updated_at) read by the Needs Board; never auto-assigns | Availability is the helper's own, self-set, visible to coordinators/pool only | None beyond migration approval |
| 10 | Session documentation, relational not note-heavy (§14) | `complete_session` (who/when/modality/duration/type/provenance all derived), `follow_ups` (next step), `navigation_referrals`/`resources` (referrals offered), goals | Yes | Participant-defined topic/focus and needs-identified have no structured slot | Smallest change: optional `purpose` (participant-chosen, from booking) on `appointments`; needs identified → existing `navigation_needs`/follow-ups rather than a new field. No clinical-note requirement anywhere | Purpose is participant-chosen wording — visible only to the session's parties | None beyond migration approval |
| 11 | Notification discipline (§22) | `notifications`/`notification_deliveries`; existing practice (intake plan §7) already minimal-content | Yes | Per-trigger review needed as each Track B feature lands | For every new notification, record trigger/recipient/channel/consent/exposure/escalation in the feature's plan before wiring; previews never carry location, health, justice, or recovery detail | — | Feature-by-feature review |

## §17 dependency determination — Track B vs canonical 0147

Format: 0147 dependency | why required now | evidence | consequence if deferred.

Every section 10–16 requirement: **no 0147 dependency**. Specifically:

| Track B item | 0147 dependency | Evidence | Consequence if deferred |
|---|---|---|---|
| Group/GFARC documentation (§4–6, §10, recurrence) | None | Touches `meetings`/`service_events`, not `leads` | GFARC occurrences keep being undocumented or reconstructed; zero effect on intake |
| Transportation / Needs Board (§11, §15, §21) | None | Extends `support_requests`, not `leads`. The shared *vocabulary* with the funnel need-classification is a ratification alignment, not a schema coupling — reconciliation-queue item Q3b (`inquiry_kind`) stays deferred exactly as classified | Participants keep requesting rides off-system; zero effect on intake |
| Coach scheduling/video/session workspace (§12–14) | None | Appointments machinery predates and is untouched by 0147 | Coaches keep juggling windows; zero effect on intake |

Therefore all of Track B goes to the **downstream architecture queue**; 0147 activation
is gated only on the six-decision ratification and its own authorizations.

## §18 primitive coherence check

Person → `people`; Relationship → `coaching_relationships`/`navigation_relationships`/
`support_team_memberships`; Activity → `service_events`; Session → `appointments`;
Request → `support_requests`; Assignment → `role_assignments` + facilitator/claim
assignments; Attendance → `meeting_attendance` (+ aggregate count on the occurrence);
Connection → evidence-gated state records (funnel requirement; claim ≠ connection);
Follow-up → `follow_ups`; Outcome → evidence-gated records, never `service_events`
(0133 deprecated `outcome_status` for exactly this reason). All §18 distinctions are
representable without new parallel architectures; GFARC/ANCHOR/Live-Out become
`service_types`/program configuration over these primitives.

## §19 documentation-burden review (proposed forms)

- **GFARC/meeting occurrence (from a series):** required — total attended, held/cancelled
  confirmation. Optional — topic title, note, identified attendance, follow-up. Derived —
  date/time/location/program/type/facilitators (from series), recorder + timestamp +
  provenance (from session). Target interaction: "18 attended · Topic: Boundaries ·
  6:31–7:52 · Held." Each required field justified: attendance count and held-status are
  the minimum delivered-service evidence; everything else is optional by design.
- **Transportation request (participant):** required — destination/purpose, date, needed
  time. Optional — riders, accessibility need, return need, note, pickup point (may be
  agreed later with the accepter; tolerate incomplete information per §20). Derived —
  requester, timestamps, status trail.
- **Session documentation (coach):** required — none beyond confirming completion
  (`complete_session` derives who/when/type/duration/provenance). Optional — duration
  override, follow-up, note.
- **Ad-hoc interaction:** required — service type, person (from relationship picker).
  Optional — note, follow-up. Derived — recorder, time, provenance, dedupe key.

## Proposed downstream sequence (after Phase 1 activation; each its own gate)

1. **B1 — Group/community occurrences + series + facilitators** (mapping rows 1–3):
   one migration + one RPC + staff/coach UI. Unblocks GFARC, house meetings, §4–6.
2. **B2 — Support-request vocabulary + transportation category** (rows 5–6, 9):
   one migration + accept RPC + Needs Board view. **Activation blocked on the
   transportation policy package** (insurance/authorization/safety) — schema may land
   dormant; the category activates only with the policy decision.
3. **B3 — Ad-hoc interaction writer** (row 4): one RPC under the provenance canon.
4. **B4 — Session Workspace UI + link-replace RPC + provider embedding matrix**
   (rows 7–8, 10).

Nothing in B1–B4 is authorized by this document; each arrives as its own
VERIFY → GATE → IMPLEMENT proposal with exact SQL and RLS text for approval.
