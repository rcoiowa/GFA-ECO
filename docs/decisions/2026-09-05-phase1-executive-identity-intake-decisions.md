# Decision: Phase 1 executive identity, intake & relational-documentation decisions

Recorded per §14 (Decision Logging) of the GFA Project Knowledge Authority & Conflict
Resolution Protocol. This records the executive decision document returned in answer to
the Phase 1 decision gate (the gate analysis of 2026-09-05, which itself performed no
mutation).

- **Decision:** The Executive Director ratified the Phase 1 identity and intake-authority
  decisions (Track A, sections 1–9 of the directive reproduced in Appendix A) and issued
  Track B relational-operations product requirements (sections 10–23) for architecture
  analysis. Specifically ratified:
  1. **Canonical operational identities:** Thomas DeGarmeaux `thomas@graceforaddictions.org`
     (designated operational RecoveryOS identity for the intake workflow); Jill DeGarmeaux
     `jill@graceforaddictions.org`; Tara `tara@graceforaddictions.org`; Archaletta
     `archaletta@graceforaddictions.org`; Ashlee `ashlee@graceforaddictions.org`. The
     Archuleta/Archaletta name variance is resolved as **Archaletta**
     (`archaletta@graceforaddictions.org`). Thomas's two existing person records
     (person 202 `thomas@`, person 234 `degarmeaux@icloud.com`) are **not** merged or
     deleted by this decision; the duplicate-record question is preserved for a separate
     identity-hygiene gate, as is a least-privilege review of person 234's role set.
  2. **Intake authority:** intake_coordinator — Thomas, Jill (full queue, assign/reassign);
     intake_worker — Tara, Archaletta; Ashlee — preserve existing authorized roles, add
     intake access only to the extent her actual intake responsibilities require.
     Tara's and Archaletta's access supports intakes, house meetings, check-ins, and
     coaching without automatically granting executive, housing-admission, discharge,
     financial, or organization-wide administrative authority.
  3. **No "women's-pathway recipient" authority is encoded.** Routing follows the selected
     residence/service and authorized function; no gender-based pathway authority or
     inference is created. (Reconciliation-queue consequence: the superseded branch's
     routing-rules concept remains deferred; no founder or gendered routing survives as
     schema.)
  4. **Founder-as-authority ends.** All "founder" references reduce to two ordinary,
     transferable functions — partnership-inquiry responder and men's-housing routing
     recipient — held by a designated person with intake_coordinator under a ratified
     routing decision (today: Thomas), named by function, never by "founder".
  5. **Track separation (directive §17):** Sections 1–9 are Track A (Phase 1 intake
     activation, canonical 0147). Sections 10–16 are Track B (relational operations
     architecture) — analyzed now, **not** a condition precedent to 0147 unless a specific
     dependency is demonstrated with evidence.
- **Date:** 2026-09-05 (directive received; recorded same day).
- **Decision-maker:** Executive Director, Grace For Addictions (Thomas DeGarmeaux),
  through an authenticated, executive-directed working session.
- **Rationale:** Resolves the identity and functional-access questions the Phase 1 gate
  returned (three missing identities, the Archuleta/Archaletta variance, the founder
  ambiguity, the operational-identity ambiguity between Thomas's two records) so the
  gated 0147 activation sequence can be staged, while directing that access derive from
  authorized function rather than staff/coach/volunteer labels.
- **Conditions:**
  - **The six deadline/routing decisions remain OPEN.** This directive does not resolve
    them and answers must not be inferred from it (directive §17): (1) standard
    first-response deadline; (2) partnership acknowledgment/substantive deadlines and
    designated responder; (3) calendar vs business time and, if business time, the
    authoritative GFA operating calendar; (4) overdue reminder cadence and escalation
    recipient; (5) manual assignment vs round-robin; (6) definition of a verified
    submission and the human quality/spam-review point.
  - **STOP boundary (preserved verbatim):** "STOP at architecture/implementation
    proposal. Do not mutate CQCX or deploy." and "Do not create accounts, grant roles,
    apply 0147, change RLS, deploy, or mutate CQCX in this pass. STOP with the
    implementation plan." No account, grant, migration apply, RLS change, or deploy is
    authorized by this record.
  - A RecoveryOS permission established under this decision is a system permission only;
    it does not establish employment/contractor/volunteer legal status, insurance
    coverage, credentials, mandatory-reporter status, EJWRH or Grace House housing
    authority, or corporate signing authority (directive §8).
  - Before mutation, the §9 verification return (accounts to create, reusable accounts,
    exact grants, existing documentation mechanisms, minimum changes, access-boundary
    answer, conflicts, exact mutations) must be produced — delivered as
    `docs/plans/phase1-intake-mutation-proposal-2026-09-05.md`.
- **Revisit trigger:** ratification of the six open decisions (expected as a short
  six-line ratification); the separate identity-hygiene gate for Thomas's two person
  records; completion of the 0147 reconciliation queue.
- **Superseded decision:** the activation plan's provisional identity list
  (`docs/plans/intake-activation-plan-2026-09-01.md` §5 and Phase 3 decision item 1) is
  superseded on identities and role holders by this record. The plan's other content
  stands. The Phase 1 gate's classification of the superseded branch's reconciliation
  queue (Q1 replace, Q2 defer, Q3a replace, Q3b defer, Q3c defer to decision 6,
  Q3d retire, Q4 replace with carry-forwards, Q5 replace, Q6 preserved) is accepted as
  the working classification; queue items close only with stated evidence.

## Companion records produced with this decision log

- `docs/plans/phase1-intake-mutation-proposal-2026-09-05.md` — Track A §9 return: the
  exact, ordered, still-ungated-and-unexecuted mutation list.
- `docs/architecture/relational-operations-architecture-review-2026-09-05.md` — Track B
  §16 mapping of sections 10–16/18–23 against the canonical architecture, with the §17
  dependency determinations.

## Appendix A — Directive as received (2026-09-05)

The controlling text as received from the Executive Director, preserved for authority.
(Transmission formatting artifacts — e.g. a stray `****` after the Archaletta address in
§3 — are preserved as received and carry no meaning.)

> PHASE 1 EXECUTIVE IDENTITY, INTAKE & RELATIONAL-DOCUMENTATION DECISIONS
>
> These are executive decisions resolving the identity and functional-access questions
> returned by the Phase 1 decision gate. Record these decisions on the canonical line
> before implementation. Do not infer broader organizational or legal authority from a
> RecoveryOS permission.
>
> **1. Canonical operational identities.** Use the following organizational identities:
> Thomas DeGarmeaux: thomas@graceforaddictions.org; Jill DeGarmeaux:
> jill@graceforaddictions.org; Tara: tara@graceforaddictions.org; Archaletta:
> archaletta@graceforaddictions.org; Ashlee: ashlee@graceforaddictions.org.
> thomas@graceforaddictions.org is Thomas DeGarmeaux's designated operational RecoveryOS
> identity for this workflow. Do not merge or delete Thomas's other existing
> person/account record as part of this authorization. Record the duplicate/distinct-
> person-record issue for a separate identity-hygiene gate.
>
> **2. Intake authority.** Grant: Thomas — intake_coordinator; Jill — intake_coordinator;
> Tara — intake_worker; Archaletta — intake_worker; Ashlee — preserve her existing
> authorized roles; add intake access only to the extent required by her actual intake
> responsibilities. Jill and Thomas may view the full intake queue and assign/reassign
> inquiries. Tara and Archaletta help with intakes, house meetings, check-ins, and
> coaching. Their access should support those functions without automatically granting
> executive, housing-admission, discharge, financial, or organization-wide administrative
> authority.
>
> **3. Do not encode "women's-pathway recipient".** The Archuleta/Archaletta ambiguity is
> now resolved as: Archaletta — archaletta@graceforaddictions.org****. However, do not
> create a permanent gender-based women's-pathway recipient authority merely from this
> decision. RecoveryOS should route based on the selected residence/service and
> authorized function, not infer a pathway from gender.
>
> **4. GFARC meeting documentation.** Thomas and the following coaches/support personnel
> must be able to document GFARC meetings: Thomas, Tara, Archaletta, Ashlee. Determine
> whether the canonical system already has a GFARC/group-meeting recording mechanism
> before creating a new one. Required capability is to document the service/event, not to
> create unnecessary participant records. At minimum the meeting record should be capable
> of representing: meeting/event type; date/time; location/site or virtual setting;
> facilitator(s); attendance/participation where appropriately authorized; general
> service/activity classification; follow-up generated by the meeting where appropriate;
> provenance: who recorded it and when. Do not require sensitive narrative notes merely
> to prove a GFARC meeting occurred.
>
> **5. House meetings and other meetings.** GFA staff, coaches, and authorized volunteers
> who actually perform these functions must have access to the appropriate house-meeting
> documentation form/workflow. This includes Thomas, Tara, Archaletta, Ashlee, and other
> GFA personnel subsequently assigned an appropriate functional role. Do not implement
> this as "all volunteers can see all residence information." Apply least privilege:
> permission to record a meeting ≠ permission to read the entire participant record ≠
> intake authority ≠ housing authority.
>
> **6. General meeting/activity documentation.** RecoveryOS must provide an authorized
> way to document other legitimate GFA meetings or recovery-support activities that do
> not fit a predefined meeting type. Before adding a new schema object, inspect the
> canonical service/activity/event architecture and determine whether the requirement can
> be satisfied through the existing relational model. Prefer: canonical activity/event +
> activity type + participants + facilitators + provenance over a separate form/table for
> every program. The system should accommodate, as applicable: GFARC Recovery Circle;
> house meeting; individual recovery coaching; check-in; peer-support interaction; intake
> interaction; navigation/resource-support meeting; reentry/ANCHOR interaction; Live-Out
> interaction; other authorized recovery/community support activity. An "other"
> classification may be available for legitimate unanticipated activity, with a short
> human-readable description.
>
> **7. Staff / coach / volunteer architecture.** Do not make separate database permission
> systems based simply on whether someone is called staff, coach, or volunteer. Determine
> access from authorized functions. A volunteer coach performing coaching should have the
> permissions necessary to perform and document coaching. A volunteer helping facilitate
> GFARC should be able to document the GFARC function assigned to them. Neither status
> alone creates access to intake, housing decisions, executive information, or unrelated
> participant records. This must remain consistent with the current legal-review
> principle that GFA may perform its work through employees, peer workers, coaches,
> volunteers, contractors, and other authorized personnel while GFA remains responsible
> for their authorization and supervision.
>
> **8. Important evidence distinction.** This executive decision establishes GFA's
> desired RecoveryOS operational assignments. It does not by itself establish: employment
> classification; contractor classification; volunteer legal status; insurance coverage;
> professional credential; mandatory-reporter status; EJWRH housing authority; Grace
> House housing authority; corporate signing authority. Preserve those as separate
> authority/evidence questions.
>
> **9. Before mutation.** Return: accounts/person records that must actually be created;
> existing accounts that can be reused; exact role grants proposed; current GFARC
> documentation mechanism; current house-meeting documentation mechanism; current generic
> service/activity documentation mechanism; minimum schema/RLS changes required, if any;
> whether coaches/volunteers can currently record an activity without gaining excessive
> participant access; any conflict with the canonical relational/service model; exact
> mutations proposed.
>
> **10. Meeting / group activity documentation.** RecoveryOS must provide a low-burden
> meeting documentation workflow capable of documenting GFA group and community
> activities without requiring unnecessary participant narratives. GFARC naming: treat
> the following as recognized display names/aliases for the same GFA program/activity
> family: GFARC Meeting; GFA Recovery Circle; GFARC. Do not create three different
> program types merely because these names are used interchangeably. For a meeting or
> group activity, the minimum documentation model must answer: WHEN (date; start time;
> end time or duration, where known). WHERE (site/location; virtual; hybrid;
> community/off-site; other appropriate location designation). HOW MANY (total
> attendance; where appropriate and authorized, identifiable participant attendance;
> permit aggregate-only attendance when individual identification is unnecessary or
> inappropriate). WHAT (meeting/activity type; topic/theme; facilitator(s); optional
> short factual note; follow-up generated, if any). The system should make when / where /
> how many / topic immediately reportable without requiring staff to reconstruct them
> from narrative notes. Topic should support both a structured category and optional
> human-readable topic/title so GFA can later analyze programming without forcing every
> conversation into a rigid taxonomy. Do not require sensitive group-discussion content
> or participant disclosures to document that a meeting occurred.
>
> **11. Peer-to-Peer Transportation Request.** Add transportation as a simple
> participant-initiated support-request workflow. A participant should be able to request
> transportation from within RecoveryOS/VRCC for an appropriate recovery-support meeting
> or appointment. Minimum participant request: destination/purpose; date; needed arrival
> time or pickup time; pickup location or agreed pickup point; approximate return need,
> if applicable; number of riders, where relevant; accessibility/accommodation need
> necessary to fulfill the ride; optional short logistical note. Keep the form
> deliberately short. Strict boundary: Peer-to-Peer Transportation. RecoveryOS is
> coordinating voluntary peer/community transportation. Do not characterize GFA as a
> transportation company, medical transportation provider, taxi service, rideshare
> service, emergency transportation provider, or NEMT provider. The workflow should
> support: Requested → Available to authorized helpers → Accepted → Coordinating →
> Completed, plus Cancelled / Unable to Fill. Authorized GFA peers, coaches, staff, or
> volunteers who are permitted to participate in transportation should have an
> appropriate Needs Board / Support Requests view showing open transportation needs they
> are eligible to see. A qualified helper should be able to Accept Ride, after which the
> participant and helper receive the information necessary to coordinate it. Avoid
> exposing a participant's exact pickup location or unnecessary personal information
> broadly to everyone who can see that an open transportation need exists. Apply
> progressive disclosure: show enough information to determine whether someone can help,
> then reveal necessary logistics to the authorized person who accepts the request.
> Notification design should evaluate: in-app notification; dashboard Needs Board; email;
> SMS/push when supported and consented; escalation/reminder when a request remains
> unfilled. Record: request → acceptance → fulfillment separately. A requested ride is
> not a provided ride. Before implementation, identify insurance, driver authorization,
> background-check, driving-record, personal-auto-policy, liability, and
> participant-safety requirements that must be resolved as organizational policy. Do not
> infer that a person is authorized to transport participants merely because they are a
> coach or volunteer.
>
> **12. Coach session scheduling and external video meetings.** RecoveryOS should support
> scheduled one-to-one coaching/peer sessions with a participant. A coach scheduling a
> session must be able to: select participant; select session type; schedule
> date/time/duration; select virtual/in-person/phone/hybrid; add a meeting link; identify
> the video/communications provider; send/share the meeting link with the participant;
> update the link without recreating the session; send reminders where authorized; open
> the scheduled session from the coach workspace; document the service during or
> immediately after the interaction. The provider model must remain vendor-neutral.
> Examples include Ooma, RingCentral, Zoom, Google Meet, Microsoft Teams, or another
> approved platform. Do not hard-code RecoveryOS around one video vendor.
>
> **13. In-app coaching visit workspace.** Design a Session Workspace so a coach can
> remain in RecoveryOS while conducting a virtual visit whenever the selected
> communications provider technically and contractually permits embedding. Desired
> layout: video / call experience alongside session documentation and participant support
> context. The coach should be able to see only the minimum information appropriate to
> the coaching relationship, such as: participant name/preferred name; session purpose;
> current participant-defined goals; relevant follow-ups/tasks; recovery plan information
> the participant has authorized the coach to access; prior coaching follow-up where
> appropriate; quick documentation controls; resource/navigation tools;
> consent/permission indicators relevant to the interaction. The coach should not need to
> leave the video interaction merely to record the service. Technical constraint: do not
> assume arbitrary third-party meeting URLs can be embedded in an iframe. Determine
> provider-by-provider whether embedded video is permitted through an SDK/API or
> embedding policy. Where true embedded video is unavailable, preserve the Session
> Workspace and provide Open Video Call in a separate window/tab while keeping the
> RecoveryOS documentation workspace open. Do not weaken browser security controls to
> force third-party pages into RecoveryOS. Do not record audio/video or create
> transcripts by default.
>
> **14. Session documentation should be relational, not note-heavy.** A completed
> coaching interaction should be capable of recording: who; when; where/modality;
> duration; service/activity type; participant-defined topic/focus; needs identified;
> actions/support provided; participant-chosen next step; referrals/resources offered;
> follow-up date/task; facilitator/coach; provenance. Do not require a clinical-style
> progress note for ordinary peer recovery support. Preserve the distinction: scheduled
> session ≠ attended session ≠ completed service ≠ outcome.
>
> **15. Universal Support Request / Needs Board.** Evaluate whether transportation should
> be the first implementation of a broader reusable participant-requested support
> primitive rather than a transportation-specific architecture. Potential
> participant-requested needs include: transportation; peer connection; coaching;
> recovery meeting/community connection; recovery housing navigation;
> employment/resource navigation; reentry support; technology/digital access; other
> participant-defined support. A participant should be able to raise their hand and say,
> in effect, "I could use help with this." The system should then support: Request →
> Appropriate visibility → Human acceptance/assignment → Connection → Completion/closure
> without converting every request into a case-management ticket. Preserve participant
> choice, minimum necessary disclosure, consent, and human responsibility.
>
> **16. Required architecture review before implementation.** Before creating new tables
> or forms, map these requirements against the existing canonical: activity/event model;
> service-delivery/provenance model; participant relationships; assignments; roles/RLS;
> notifications; consent; follow-ups/tasks; RecoveryOS/VRCC participant surface; Coach
> Workspace. Return: Requirement | Existing mechanism | Reusable? | Gap | Minimum change
> | Privacy/RLS consequence | Human authority required. Prefer extending canonical
> primitives over creating isolated GFARC, transportation, coaching-session, and meeting
> subsystems. Every authorized GFA person should be able to document the work they are
> authorized to perform, regardless of whether they are an employee, coach, peer worker,
> or volunteer. Their access should follow function and relationship — not employment
> label. RecoveryOS should make helping someone easier than documenting that you helped
> them — while still producing better evidence than systems built around documentation
> first.
>
> **17. Scope separation and unresolved Phase 1 decisions.** This executive direction
> contains two related but distinct workstreams. Track A — Phase 1 Intake Activation:
> sections 1–9 govern the immediate identity, intake-role, and access analysis associated
> with canonical 0147. The six deadline/routing decisions returned by the prior Phase 1
> gate are not resolved merely by this document unless separately ratified. Preserve them
> as explicit executive decision items: standard first-response deadline;
> partnership/priority acknowledgment and substantive-response deadlines and designated
> responder; calendar-time versus business-time computation and, if business time is
> selected, the authoritative GFA operating calendar; overdue reminder cadence and
> escalation recipient; manual assignment versus round-robin participation; definition of
> a verified submission and the human quality/spam-review point. Do not infer answers to
> those six decisions from surrounding product requirements. Track B — Relational
> Operations Architecture: sections 10–16 establish downstream RecoveryOS product
> requirements for: meeting and group documentation; GFARC; house meetings; general
> recovery-support activities; peer-to-peer transportation; coaching session scheduling;
> video-session workspace; relational session documentation; universal participant
> support requests / Needs Board. Analyze Track B now against the canonical architecture,
> but do not make Track B implementation a condition precedent to canonical 0147 unless a
> specific dependency is demonstrated. For every claimed dependency, state: 0147
> dependency | why required now | evidence | consequence if deferred. If no actual
> dependency exists, place the requirement in the downstream architecture queue.
>
> **18. Universal relational evidence primitives.** In evaluating Sections 10–16, prefer
> a small reusable set of canonical concepts rather than program-specific database silos.
> At minimum evaluate whether RecoveryOS can coherently model: Person / Relationship /
> Activity / Session / Request / Assignment / Attendance / Connection / Follow-up /
> Outcome. These are conceptual primitives, not authorization to create tables with those
> names. A program such as GFARC, ANCHOR, Live-Out, coaching, or recovery housing should
> primarily configure or compose shared relational primitives rather than require a
> parallel evidence architecture. Preserve distinctions including: request ≠ assignment ≠
> connection ≠ fulfillment; scheduled ≠ attended ≠ completed; attendance ≠ engagement;
> activity ≠ outcome; referral ≠ successful connection; aggregate attendance ≠ identified
> participant attendance.
>
> **19. Low-burden documentation standard.** Every proposed workflow must pass a
> documentation-burden review. For each staff/coach/volunteer-facing form, return:
> required fields | optional fields | fields derived automatically | reason each required
> field is necessary. Prefer deriving: recorder; timestamp; authorized role; known
> program/site; scheduled participant; scheduled session; duration where determinable;
> provenance from existing system state rather than asking the human to enter the same
> information again. The default interaction should record the minimum sufficient
> evidence of what happened. Narrative should be optional unless a specific operational,
> safety, contractual, or legal reason requires it.
>
> **20. Participant-facing accessibility and dignity requirement.** Participant-request
> workflows, including transportation and universal support requests, must be:
> mobile-first; low cognitive load; usable with plain language; accessible by keyboard
> and assistive technology; tolerant of incomplete information where human clarification
> can safely occur; explicit about what information will be shared and with whom;
> non-coercive; capable of being cancelled or changed by the participant. A participant
> should not need to understand RecoveryOS organizational structure in order to ask for
> help.
>
> **21. Human availability and acceptance.** For Needs Board / peer-to-peer support
> workflows, distinguish authorized to help from currently available to help. RecoveryOS
> must not assume that a coach, staff member, peer, or volunteer is available merely
> because they hold a functional permission. Evaluate a lightweight voluntary
> availability mechanism that allows an authorized person to indicate whether they can
> currently accept appropriate requests. Do not expose requests outside the minimum group
> of people authorized to meet that category of need.
>
> **22. Notification discipline.** Notifications must be useful without becoming
> surveillance or alert fatigue. For every proposed notification identify: trigger |
> recipient | channel | participant consent needed? | sensitive information exposed? |
> retry/escalation behavior. Do not place sensitive recovery, housing, health, trauma,
> justice, or location information in notification previews when a less revealing
> notification can accomplish the purpose.
>
> **23. Product principle.** Treat the following as a design requirement: RecoveryOS
> should make helping someone easier than documenting that you helped them — while
> producing stronger, more auditable relational evidence than documentation-first
> systems. Optimize the human-facing experience for: Ask for help → See the need →
> Accept → Connect → Record the minimum → Follow through, rather than: Open case → fill
> forms → create note → close ticket.
>
> **Additional preserved directions:** (a) GFARC and other community meetings need
> series/recurrence — a recurring meeting definition (location, normal time, program,
> typical facilitators) whose occurrences are lightweight event records; an occurrence
> created from a schedule does not automatically claim it happened — it transitions
> Scheduled → Held / Cancelled and only Held contributes to delivered-service counts.
> (b) Transportation fulfillment should be evidenceable beyond "someone clicked Accept"
> (requested → accepted → completed recorded separately), without requiring all
> confirmations for every trip at launch. (c) The Session Workspace should have a
> pre-session view (join link, participant-selected purpose, previous follow-up,
> outstanding participant-requested needs, consent boundaries) that becomes the
> documentation workspace during the visit and the "what happened / what did the
> participant choose next" record afterward. (d) The six deadline/routing decisions
> should be resolved as a small six-line ratification rather than buried inside the
> architecture review.
>
> STOP at architecture/implementation proposal. Do not mutate CQCX or deploy.
> Do not create accounts, grant roles, apply 0147, change RLS, deploy, or mutate CQCX in
> this pass. STOP with the implementation plan.
