# P4F — Recovery Residence Consolidation, Security Hardening & Support Integration Report

**Date:** 2026-08-08
**Backend authority:** RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`), schema `recoveryos` only
**Frontend authority:** `apps/platform`
**Gate status:** typecheck ✅ · build ✅ · tests ✅ (122/122) · extended launch-contract preflight ✅

The mandate: audit, harden, preserve, connect. Nothing was rebuilt for
aesthetics; the working residence product survives with its authority model
brought up to the P4C–P4E standard, and Residency becomes the third intentional
support context around the same person — one person, one RecoveryOS, no
duplicate identity, no unnecessary exposure.

---

## A. Residence contract inventory

Audited every residence object across 0004/0006/0013–0024 plus the live policy
set and the frontend repositories (`staffOperations`, `residenceOperations`,
`applications`, `residencies`). Write classification (§2):

| Class | Tables |
| --- | --- |
| SAFE DIRECT SELF-SERVICE WRITE | residence_applications INSERT (status pinned 'submitted', decision fields null), passes INSERT (status pinned 'requested'), grievances INSERT (filer pinned), document_assignments self-acknowledge, house_posts resident INSERT (category-limited) |
| SAFE RESIDENCE-SCOPED STAFF WRITE | curfew_schedules, residence_chores, chore_assignments, meetings/attendance, house_posts staff, units/rooms/beds structure, narr_compliance, iowa_checklist_status, fee_ledger, referrals staff UPDATE (kept, noted §F) |
| MUST BECOME RPC (done in 0115/0116) | residence_applications decisions, residencies INSERT/UPDATE, bed_assignments, passes decisions/returns, grievance resolution, incident review |
| SHOULD BE APPEND-ONLY (done) | screenings, incidents |
| READ-ONLY / REFERENCE | narr_standards, iowa_checklist_items, residences public directory reads |

## B. Residence RLS/policy audit

The good news from the audit: `staff_residence_ids()` was already
residence-scoped AND revocation-aware (`revoked_at is null`), so cross-residence
denial and staff-termination read-loss were structurally sound. The defect class
was the WRITE side: most staff policies were `FOR ALL` — arbitrary UPDATE and
DELETE within scope — on exactly the tables where §6 forbids it (applications
including `decided_by_person_id`, residencies including any status, beds,
passes including `decided_by`, screenings, incidents). All corrected (§F).

## C. Historic admin/helper audit

Swept every residence function/policy for `is_admin_staff` / `is_support_staff`
/ broad-role fallbacks (§3). Findings: the residence policy layer itself used
neither helper (it predates them; scoping is via `staff_residence_ids`), so the
P4E over-reach class did not recur in residence policies. All NEW residence
authority in 0115/0116 uses `is_platform_admin()` for platform fallbacks and
`is_residence_manager_of(residence_id)` for manager authority — navigator,
coach, and program_manager are never equivalent to residence staff. One historic
instance remains by design: `staff_preauthorizations` admin policy uses
`is_admin_staff()` (operational staff manage invites) — documented, low risk,
flagged for P4G review.

## D. Operator self-provisioning security correction

**The launch-blocking finding.** `create_residence_for_current_user` (0019) let
any authenticated person create an organization + residence and grant
themselves `residence_manager`. 0115 gates it: **platform admin, or a
deliberate operator invitation** (an unconsumed `staff_preauthorizations` row
carrying `residence_manager` for the caller's email, consumed on use) — the
directive's preferred path, reusing existing provisioning infrastructure. The
grant is audited (`residence.operator_provisioned` with `authorized_by`).
The old exploit path was tested explicitly, rolled back: participant → blocked,
coach → blocked, platform admin → created, invited operator → created,
`audit=2`. The white-label capability survives architecturally (§AG).

## E. Residence role/capability matrix

| Capability | Resident | Residence Staff (scoped) | Residence Manager (scoped) | Platform Admin |
| --- | --- | --- | --- | --- |
| Apply / withdraw own application | ✅ | — | — | — |
| Mark application in-review | ❌ | ✅ | ✅ | ✅ |
| Approve / waitlist / decline | ❌ | ❌ (verified `not_authorized`) | ✅ | ✅ |
| Admit / discharge | ❌ | ❌ | ✅ | ✅ |
| Assign/release beds | ❌ | ✅ | ✅ | ✅ |
| Request pass | ✅ (own) | — | — | — |
| Decide pass / record return | ❌ | ✅ | ✅ | ✅ |
| Record screening/incident (self-attributed) | ❌ | ✅ | ✅ | ✅ |
| Review incident | ❌ | ❌ | ✅ | ✅ |
| Read grievances | own filings | ❌ (verified 0 rows) | ✅ | ✅ |
| Resolve grievance | ❌ | ❌ | ✅ (never own filing) | ✅ (never own filing) |
| Designate residence support | ❌ | ❌ | ✅ | ✅ |
| Attest residence support service | ❌ | ✅ | ✅ | ✅ |
| Provision operator/residence | ❌ | ❌ | ❌ | ✅ (or invitation) |

Every row is enforced by RLS/RPC; frontend routes are UX only.

## F. High-impact write classification

Generic write policies dropped: `residence_applications_staff_write`,
`residencies_staff_write`, `residencies_staff_update`, `bed_assignments_staff`
(ALL), `passes_staff` (ALL), `screenings_staff` (ALL), `incidents_staff` (ALL),
`grievances_involved` (broad read). Replaced by scoped SELECT/INSERT policies
plus ten narrow RPCs (0115/0116): `review_residence_application`,
`withdraw_my_application`, `admit_applicant`, `assign_bed`, `release_bed`,
`discharge_residency`, `decide_pass`, `record_pass_return`, `review_incident`,
`resolve_grievance` — every actor server-derived, transitions legal-only,
audit-logged where organizationally significant. The browser can no longer set
`status=approved`, `status=discharged`, or any `decided_by/verified_by`
identity (verified: direct self-approve UPDATE = 0 rows; decider pinned to the
actual manager). **Residual, documented:** `referrals_staff_update` (external
intake triage) keeps a scoped whole-row UPDATE — low sensitivity, `handled_by`
forgery is within-residence only; queued for the P4G sweep.

## G. Application lifecycle

Preserved and hardened: submitted → in_review → approved / waitlisted /
declined, plus participant withdrawal (`withdraw_my_application`, own +
pre-decision statuses only). Participant self-insert stays (status pinned by
policy). Terminal decisions are manager-only; `in_review` is any scoped staff;
terminal states immutable (`already_decided`); waitlist can still move.
Applicants see status, never internal review notes (self-select returns their
row; the staff `notes` field is not surfaced in participant UI). Verified:
self-approve blocked both paths, foreign staff blocked, staff-approve blocked,
manager approve lands with pinned decider.

## H. External residence-referral boundary

`recoveryos.referrals` remains exactly what it was: the public/external
residence referral intake (anon INSERT preserved, verified by preflight). It is
not navigation referral, not warm handoff — `navigation_referrals` (P4E)
remains the separate domain. No records are merged automatically; linkage is
deliberate (§AD).

## I. Applicant→residency transition

`admit_applicant` is the canonical transaction: approved application →
residency `active` (admission_date) → optional bed assignment → resident role
granted server-side — one call, safely ordered, audited. Guards verified: only
`approved` admits (`declined_admit=not_approved`); the one-live-residency
partial unique index is the arbiter (duplicate → `already_resident`; a live
residency elsewhere → refused); bed races degrade gracefully (admission stands,
bed does not); no resident role without residency, no duplicate person, ever.
The staff UI's historical "Approve" action keeps its product meaning by
chaining review + admit (both manager-authorized server-side) — documented
product decision, not an accident.

## J. Residency lifecycle

Canonical enum preserved (applicant/waitlisted/approved/active/on_pass/
transitioning/exited/discharged). Staff can no longer set arbitrary statuses:
lifecycle moves through admit (→active) and `discharge_residency`
(→transitioning/exited/discharged; manager-only; idempotent `already_ended`;
discharge_date captured; reason captured in the audit trail — never a
"successful/unsuccessful" auto-classification). Admission date, anticipated
exit, and discharge date columns all preserved.

## K. Bed assignment/concurrency

The existing invariants were sound and remain the authority: one active person
per bed (partial unique index, verified `bed_race=bed_taken` with one winner),
released beds immediately available, transfer preserves history (old assignment
released, new row inserted — never overwritten), discharge releases the active
assignment (verified `bed_released=yes`). All bed writes are now RPC-only with
UI availability treated as advisory.

## L. Resident experience preservation/refinement

**Preserved untouched** (per §12): the ResidentArea (Today, house info, chores,
passes, curfew, meetings, documents, support, house board) keeps its pages,
links, and identity — zero resident-page rewrites; its chunk is byte-identical.
Its data paths were already self-service-safe (§A). What it gained invisibly:
its pass requests now get decided through an unforgeable path, and its
documents/grievances are better protected.

## M. Staff experience preservation/refinement

**Preserved, hardened underneath**: the StaffArea keeps its nine operational
surfaces recognizably intact. The repository layer was rewired so the same
pages now call the canonical RPCs (`decideApplication` →
review[+admit], `assignBed`/`releaseBed` → RPCs, `decidePass` → RPC with the
client-supplied decider ignored). Screening/incident recording already inserted
with self-attribution, which the new identity-pinned INSERT policies enforce.
One addition, not a rebuild: **Messages** (designated-resident conversations,
§P).

## N. Route consolidation

No route churn: `/residence/*` (resident), `/staff/*` (operations),
`/residences` (role-aware dispatcher), `/recovery-residences/*` (public) all
remain, public application links and deep links unbroken. `/residences` stays
the canonical role-aware entry; `/staff/messages(/:personId)` is the only new
route. Aesthetic consolidation was deliberately skipped (§14).

## O. My Support / Residence Support model

The third context is an **intentional designation, not the employee roster**:
`designate_residence_support(person, staff)` — residence manager of the
person's active residence designates one staff member (validated to hold a
residence role there); prior designation ends; `support_team_memberships`
(`member_role='residence_support'`) is the canonical record — the existing
table, finally doing the job it was modeled for. `get_my_support_team()` now
returns coaching + navigation + residence contexts ("Residence Support" label,
minimal public identity). Verified: `team=3` while resident,
`team_after=2` post-discharge.

## P. Residence messaging decision/status

**Implemented — with genuine semantics.** Because the designation is strictly
one-to-one, the P4D two-member read model stays valid, so
`context='residence'` was added to the shared engine (constraint + member-role
extended; ensure/send/mark context-aware). Authorization: active designation
required; sends stop when it ends (verified `res_thread=relationship_ended`
post-discharge, history conservative/read-only); sender pinned; foreign staff
have no membership; Residence A staff cannot reach Residence B threads (no
designation = no thread). Surfaces: participant `/vrcc/messages` shows the
thread labeled "— Residence Support"; staff got `/staff/messages` +
`/staff/messages/:personId` (designated residents only — never a house-wide
inbox).

## Q. Multi-member messaging decision

Per §16: **no group thread was faked**. The resident ↔ every-staff-member
channel was explicitly rejected; the one-to-one designated contact was chosen
because it matches the read-receipt architecture and the operational need. A
true residence-team channel requires per-member read receipts — documented as
the same prerequisite P4D flagged, unchanged.

## R. Coaching/navigation privacy firewall

Both directions verified, rolled back: residence staff (designated or not)
have **no** access to coaching or navigation threads, notes, or referral detail
(member-only message RLS; relationship-scoped navigation RLS — staff roles
appear in none of them). Coach sending into or reading the residence thread:
`coach_into_res=not_authorized coach_reads=0`. Coach/Navigator get no
screenings, incidents, pass, or grievance access (no policy grants them any —
verified structurally). Being housed by GFA shares house operations with house
staff, nothing more; no workspace is a dossier.

## S. Screening privacy/write model

Screenings became **append-only with pinned recorder identity**: staff-scoped
SELECT; INSERT requires `recorded_by = current person` (spoof verified denied);
no UPDATE policy (rewrite = 0 rows); no DELETE privilege at all (42501 —
stronger than a policy). Corrections are new rows — a historical test is never
silently overwritten; confirmatory results are recorded as additional
screenings. Coach/Navigator: no access by default. Participant visibility of
their own screening results is **flagged as a product/policy decision** — not
silently granted. Screening results are operations data and are never a
recovery-capital outcome (§28 boundary held: zero service events from
screenings, verified).

## T. Incident write/audit model

Same append discipline: reporter pinned at INSERT, no UPDATE/DELETE for staff;
the pre-existing review columns get a proper channel — `review_incident`
(manager-only, reviewer pinned, follow-up notes as an auditable amendment,
never a rewrite of the original summary). Incident counts feed no risk score
anywhere.

## U. Grievance privacy/workflow

Least privilege now real: the filer sees their own; the **residence manager**
(not every staff member — verified `ordinary_staff_reads=0`) and platform admin
see the residence's. Resolution via `resolve_grievance` (manager,
open→in_review→resolved/closed, `resolved_by` recorded on the new column) with
a structural conflict-of-interest rule: **the filer can never dispose of their
own grievance** even holding the manager role (verified
`own_grievance=conflict_of_interest`). Nothing is deleted; status/history
preserved.

## V. Pass/curfew workflow

Resident requests (INSERT pinned to `requested` — self-approving insert
verified denied); scoped staff decides via `decide_pass` (requested→approved/
denied only, decider pinned — verified); returns via `record_pass_return`
(staff confirms actual return from approved/active/overdue — the confirmation
model decision: staff records returns at launch; resident self-report can be
layered later). Residents cannot set approved/returned/overdue by any path.
Curfew-exception tables keep their scoped staff policies (operational
schedule data, lower sensitivity — classified SAFE, §A).

## W. Chore workflow

Preserved as community-living responsibility: chore/chore-assignment policies
stay staff-scoped with resident visibility, untouched — the audit classified
them SAFE. The completed-by-resident vs verified-by-staff distinction is
documented as a refinement for when the chore pages are next touched; chore
completion feeds no recovery outcome and no service event (verified: zero
service events from all operations rows).

## X. Meetings/attendance

Canonical meetings/attendance preserved untouched. The distinction holds
structurally: attendance is a record, never a service event (nothing links
attendance → service_events; verified in the ops-not-services count). An
intentional group-service attestation model (GFARC/recovery circles) is
documented as future work — house meetings are not grant-billable by
existence.

## Y. Documents/version/signature integrity

Audited 0013/0020: assignments pin a specific `document_version_id`; versions
are immutable rows (publishing adds versions, never mutates); acknowledgment is
the resident's own narrow UPDATE (only while unacknowledged — the one
legitimate self-service UPDATE policy); assigned-version read access flows
through `my_assigned_document_*` helpers; staff access residence-scoped;
revoked staff lose access via `staff_residence_ids`. **The proven document
system satisfies §26 and was not rebuilt.**

## Z. Application-answer privacy

The 0018 `answers` jsonb is readable only via self-select and residence-staff
scoped select; it appears in no analytics event, no notification, no URL
(verified against the analytics union — process events only). Recommendation
recorded: the staff applications LIST should render summary fields and open
full answers only in the review detail — the current page loads full rows
within an authorized scope, acceptable at launch, minimization queued as
UI-touch refinement.

## AA. Residence service-event attestation

`record_residence_support_service_event` extends the P4E attestation standard:
staff at the person's **active** residency's residence (or platform admin),
provider derived from JWT, full residence attribution — the canonical
`delivery_context='recovery_residence'` CHECK satisfied with residence_id AND
residency_id (verified `attribution=1`), organization from the residence,
canonical service type `residence_recovery_support`, idempotent
(`dup=already_recorded`), foreign staff denied. And the §28 negative space
held: bed assignment, pass approval, screening, grievance, admission — the
whole verification chain — produced **zero** service events until a human
attested (`ops_not_services=1` = exactly the one attestation).

## AB. Housing/residence outcome readiness

Factual evidence now derivable with denominators: applications by decision,
admissions, occupancy (active assignments/beds), length of stay
(admission→discharge dates), transition status, and attested residence support
services. Exit destination is recorded only in the audited discharge reason
when actually known. No dashboard or status claims causation — OUTPUT (house
operations, services attested) / OUTCOME (housing obtained, needs resolved) /
CONTRIBUTION stay separate; "Grace House caused stable housing" is not derivable
from the schema, by design.

## AC. Recovery-residence need/navigation seam

The honest loop connects without shortcuts: a `recovery_residence` navigation
need → navigation referral (destination or canonical residence) → the person
applies (`residence_application_submitted`) → approved/admitted or waitlisted/
declined — and **only the appropriate outcome closes the navigation loop**:
nothing auto-resolves a need on application submission (no trigger links them;
the navigator or participant closes it with evidence, exactly the P4E
machinery). Milestones (information shared → application started/submitted →
approved → admitted → housing obtained) map onto existing canonical rows;
waitlist/decline feed the unmet-need denominator.

## AD. Residence-referral→application linkage

Decision: **no automatic linkage.** An external referral's text is
referrer-supplied, not participant-confirmed identity — auto-creating or
auto-matching people from it risks duplicate identity, which is the platform's
first commandment violated. The staff triage flow (referrals status UPDATE,
residence-scoped) remains the human step where identity is resolved
deliberately; a `person_id`/`application_id` linkage column can be added when
that workflow is formalized. Documented, not built.

## AE. Resident-role provisioning/revocation

Server-authoritative both directions (§34): `admit_applicant` grants the
residence-scoped `resident` role; `discharge_residency` revokes it
(`resident_role_left=0` verified) — while the person's participant identity,
coach, and navigator relationships continue untouched
(`coach_nav_survive=2`). One person remains one person.

## AF. Staff-role revocation behavior

`staff_residence_ids()` already honors `revoked_at`, so revocation is
immediate across every scoped policy. Verified end-to-end: after revoking the
staff fixture's role, they read **zero** screenings, incidents, and residencies
(`REVOKED sees=0`); their residence-support designations end at discharge or by
manager action; their historical authorship (recorded_by/reported_by/
decided_by) remains intact — access removed, work preserved.

## AG. Universal operator future capability

CAPABILITY EXISTS ≠ PUBLICLY ENABLED, implemented literally: the RPC survives
with its full white-label flow, but activation requires a deliberate operator
invitation (a `staff_preauthorizations` row with `residence_manager`) or
platform-admin action. Future activation path documented: invite → operator
signs up/signs in → calls the same provisioning flow → consumed invitation +
audit row. Contractual onboarding layers onto the invitation without code
changes. Nothing insecure needs resurrecting.

## AH. NARR/reporting readiness

No parallel NARR database was built. The canonical operations now prove, with
integrity: resident rights (grievance filing + non-conflicted resolution +
history), house policies (immutable document versions + signatures), staffing/
access (scoped, revocation-aware roles + audit_log), recovery-support
environment (attested residence support services), safety (append-only
incidents with review trail), documentation/versioning (0013), and quality
improvement (unreviewed-incident and unresolved-grievance queries).
Certification crosswalks remain a later reporting layer.

## AI. Support Now integration

Unchanged and verified present in both residence shells (`SupportNowButton` in
StaffShell utilities and the resident experience) — the shared escalation
architecture, not a parallel crisis system. No confidential resident
information appears in any emergency surface.

## AJ. Attention models

Pure, tested derivations added to the domain
(`deriveResidenceStaffAttention`: incident review → applicant waiting → pass
decision → bed task → follow-up, max 4; `deriveResidentAttention`: document →
pass response → chore → meeting, max 3). Tests pin the priorities, the
quiet-house-derives-nothing behavior, and that labels contain no
risk/violation/alert vocabulary. Wiring into the preserved StaffToday/resident
Today pages is deliberately deferred to the P4G command-center slice — the
directive's "preserve, don't rebuild" outranked cosmetic integration; the
canonical derivations are ready and tested.

## AK. Realtime/HTTP status

Unchanged, honestly: messaging realtime still not live-HTTP-proven; no polling
retired; no new realtime subscriptions were added for residence surfaces
(application decisions and pass responses arrive via the existing notification
pathway + polling). The HTTP soft-launch gate now includes the §44 residence
items (application submission, staff review, admission, bed assignment,
resident read, scoped staff operation, cross-residence denial, residence
messaging). Statuses used here: DB-, CODE-, BUILD-, TYPECHECK-, TEST-VERIFIED.
**Never HTTP-VERIFIED.**

## AL. Launch-contract preflight

Extended (§43) and **PASS against the live launch project**. New permanent
guards: no UPDATE/DELETE/ALL policies may exist on screenings/incidents
(append-only regression), no generic lifecycle write policies on
residence_applications/residencies/bed_assignments/passes, the broad
`grievances_involved` policy must stay gone and `grievances_scoped_select`
present — plus all P4E-era checks (grants, anon scope, RLS bite). Still not a
substitute for live HTTP.

## AM. Privacy/security test matrix

Single rolled-back verification transaction, every §45–50 assertion:

```
OP  participant=blocked coach=blocked admin=created invited=created audit=2
APP self_approve_rows=0 self_rpc=not_authorized foreign=not_authorized
    staff_approve=not_authorized staff_review=in_review manager=approved
    decider_pinned=1 declined_admit=not_approved
ADMIT=admitted bed=true resident_role=1 dup=already_resident
    bed_race=bed_taken bed2=assigned
PASS requested=1 self_approved=denied self_decide=not_authorized
    staff_decide=approved decider=1
SCR recorded=1 spoof=denied rewrite_rows=0 delete=no_privilege foreign_reads=0
GRIEV ordinary_staff_reads=0 manager_reads=1 resolve=resolved
    own_grievance=conflict_of_interest
SEAM designate=designated team=3 thread=ready/residence staff_send=sent
    coach_into_res=not_authorized coach_reads=0
SVC recorded=recorded dup=already_recorded foreign=not_authorized
    ops_not_services=1 attribution=1
EXIT=exited bed_released=yes resident_role_left=0 res_thread=relationship_ended
    team_after=2 coach_nav_survive=2
REVOKED sees=0
```

## AN. Service-event/T4b status

T4b evidence now flows from three attestation paths — `complete_session`
(coaching), `record_navigation_service_event` (navigation),
`record_residence_support_service_event` (residence) — all provider-derived,
idempotent, correctly attributed, never automatic. TTMHC: still not calculated,
named, or published (§52 honored).

## AO. Complete Session UI status

**Shipped** (§51, small and isolated as required): once a today's session's
start time has passed, the coach's Sessions page offers "This session happened —
mark complete" → the existing proven `complete_session` RPC → exactly one
service event, legitimate appointment completion, humane confirmation, and the
`session_completed_recorded` process event. No new backend.

## AP. Analytics

Eight process-only events added to the typed union
(`residence_application_submitted`, `application_reviewed`,
`residency_admitted`, `bed_assigned`, `pass_requested`, `pass_decided`,
`residence_support_service_recorded`, plus `session_completed_recorded` now
emitted by the coach button). Never in any payload: screening results, incident
narratives, grievance narratives, application answers, message bodies. The
canonical database remains evidence authority.

## AQ. Accessibility/mobile

Preserved resident/staff surfaces keep their existing mobile behavior; the new
surfaces follow the platform standard: real buttons with visible text,
confirmation before consequential actions (the destructive transitions
additionally live behind manager-only RPCs), low typing burden (decisions are
single taps), semantic labels, responsive card lists, no desktop-only tables
added. House staff moving through the residence on a phone was the design
target for the new Messages surface.

## AR. Build/typecheck/test results

- `pnpm -r typecheck`: green, all packages.
- `pnpm -r build`: green. StaffArea 48.74 kB (was 45.44 — messaging pages);
  CoachArea 25.68 kB (complete-session action); NavigatorArea 25.63 kB
  (unchanged); ResidentArea byte-identical (preservation, verified by the
  unchanged 464.83 kB chunk).
- `pnpm -r test`: **122/122** (domain 72, platform 33, recovery-content 17) —
  up from 117. New: 5 residence-attention domain tests (priorities, quiet
  house, humane vocabulary).
- DB verification: the §AM transaction, rolled back. Preflight: PASS.

## AS. Backend migrations/gaps

**Migrations (10-step rule):** `0115_residence_hardening.sql` (operator gate,
application/admission/bed/discharge/pass RPCs, append-only screenings/
incidents + review RPC, grievance least-privilege + resolution, residence
support seam + `context='residence'` messaging, residence service attestation,
policy drops) and `0116_release_bed.sql`. Repository layer rewired in place —
same signatures, RPC-backed, client-supplied decider identities now ignored.

**Documented gaps (none blocking):** referrals staff UPDATE kept scoped (§F);
participant visibility of own screenings = flagged policy decision (§S);
chore completed-vs-verified distinction (§W); group-service attestation for
circles/meetings (§X); application-list answer minimization (§Z);
referral→application identity linkage workflow (§AD); attention-model wiring
into preserved pages (§AJ); `staff_preauthorizations` admin policy uses
`is_admin_staff` (§C) — all queued for P4G or the relevant UI-touch moment.

## AT. Exact P4G recommendation

**P4G — Admin / Operations Command Center**, in this order:
1. **Admin contract audit first** (the discipline that caught defects in P4E
   and P4F): what may a platform administrator actually see and do — including
   finishing the §C/§F residuals (`staff_preauthorizations` policy, referrals
   triage RPC) and the P4D admin-metadata boundary applied platform-wide.
2. **Operator administration**: staff preauthorization management UI (the
   operator-invitation path built in P4F), role grant/revoke with audit,
   residence configuration (§37 values — curfew, capacity, fees, documents —
   per-residence, never hardcoded Grace House).
3. **Operational evidence views**: the measurement spine (T0–T4b, navigation
   loop closure, unmet-need denominators, occupancy/length-of-stay) as
   admin-facing factual views — contribution-safe language, no TTMHC, no
   funder crosswalks yet.
4. **Wire the P4F attention models** into StaffToday/resident Today as those
   pages are touched.
5. Keep the HTTP soft-launch gate as the next hard milestone after P4G — the
   full §44 list is now the checklist.

---

**P4F COMPLETE — READY FOR ADMIN / OPERATIONS COMMAND CENTER**
