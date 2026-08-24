# Gate B — EJWRH Post-Acceptance Intake, Consent, Document & Admission Architecture

**Status: RATIFIED WITH EXECUTIVE CONDITIONS (Gate B Executive Ratification, 2026-08-24,
amending the `61556d3` review draft). Nothing implemented; no CQCX mutation; no Cloudflare
activation; no applicant traffic. Implementation awaits separate authorization.**

Executive decisions incorporated (each marked in place below):
1. **Lifecycle APPROVED** — reuse existing lifecycles; intake readiness DERIVED; no parallel
   persisted intake-status machine unless implementation evidence proves the model
   structurally insufficient, in which case STOP for executive review (§3).
2. **Field disposition APPROVED WITH MINIMIZATION** — Gate A data prefills and is never
   re-requested except for correction/confirmation; intake collects only
   current-operational-purpose data (§4).
3. **Document authority APPROVED SUBJECT TO RECONCILIATION** — every document classified
   (GFA org-wide / EJWRH-specific / Grace House-only / pending reconciliation) before any
   EJWRH signing workflow ships; no silent Grace House wording reuse; no
   unresolved-applicability document may be assigned for EJWRH signature (§5).
4. **Consent/ROI APPROVED** — canonical `consent_grants` only; the four constructs stay
   separate; external disclosure is governed by ACTIVE canonical consent, never merely a
   signed document (§7).
5. **Conditional data APPROVED** — structured minimum, bounded values over narratives,
   role-restricted visibility (§8, §11).
6. **Admission readiness APPROVED WITH NARROW AUDITED OVERRIDE** — six-class requirement
   taxonomy; override model and non-overridable categories in §9a; STOP if what is legally
   or operationally non-overridable is uncertain.
7. **Legal/privacy sequencing APPROVED** — per-phase prerequisite matrix in §16a; unresolved
   questions do not block unrelated functionality.
8. **Signature evidence APPROVED IN PRINCIPLE** — full chain per §6; never reconstruct
   signed terms from the current/latest document.
9. **Frontline principle** — natural actions generate evidence; no raw Supabase; no
   duplicate documentation for reporting (§10).
10. **Evidence semantics** — administrative/governance transitions are never service_events;
    P2 provenance preserved exactly (§12).

Baseline: Gate A at `8e4b07e` (accepted canonical EJWRH public-application baseline; CI #102
green; CQCX ledger through `0138_ejwrh_containment` — re-verified live). Every current-state
claim below was traced to actual writers/readers/policies in the repo and live CQCX
(read-only); nothing is assumed from a table name.

Standing note preserved per directive: the **Platform Launch Gate** (production frontends
predate the P2.5 participant-write change; a `de7bef0`-or-later build must deploy before
real participant use) remains its own gate, independent of EJWRH readiness.

---

## 1. Executive assessment

Gate B is overwhelmingly a **WIRE + EXTEND** job, not a build. The canonical machinery
already exists and is live:

- **Documents**: `document_templates` → `document_versions` (immutable body per version,
  `published_at`, `requires_signature`) → `document_assignments` (version-pinned, per-person,
  `acknowledged_at` + `signature_name`, participant self-ack under a narrow RLS policy).
  **20 templates live, all published, 8 signature-required**; `resident_rights` already
  demonstrates multi-version life (2 published versions). Resident UI exists
  (DocumentsPage/DocumentDetailPage).
- **Consent**: `consent_grants` already carries status, `scope` jsonb, method,
  `document_version`, effective/expires/revoked timestamps, and creator identity — scoped,
  revocable, expirable by design. What's missing is structure (recipient/purpose for ROI),
  a definer write path with audit, and enforcement reads.
- **Two-stage application**: pre-account `residence_application_intake`
  (received→contacted→account_offered→converted/waitlisted/declined/closed, audited review
  RPC, staff queue, notifications — Gate A routes EJWRH here) and canonical, account-based
  `residence_applications` (submitted→in_review→approved/waitlisted/declined/withdrawn) with
  `review_residence_application` and **`admit_applicant` already the single deliberate human
  admission action** creating the residency.
- **Accounts**: `staff_preauthorizations` (0117) provides the one-open-invite-per-email +
  signup-trigger pattern the `account_offered` step needs (participant-purpose behavior to
  be confirmed/extended — see §16).

The genuine gaps are five, all narrow: (1) documents can currently be assigned only to an
**active residency**, but signing belongs at intake, *before* admission; (2) signature
evidence lacks a **content hash, a distinct signed timestamp, an audit row, and an
immutability guard**; (3) acknowledgment/agreement/consent/coordination are partially
conflated (one `acknowledged_at` for both ack and signature; screening consent lives only
inside a signed document; ROI has no structured recipient/purpose); (4) **conversion** from
intake → person → canonical application has no RPC (the 0122 review RPC deliberately stops
short); (5) there is **no staff intake-checklist surface** (what's signed, consented,
missing). Everything else is reuse.

One structural decision drives the design: **"intake pending / in progress / complete" are
DERIVED states** (computed from assignments + grants + conditional items), not new persisted
status strings — no parallel state machine, no drift between a status column and reality.

## 2. Current-state trace (verified)

| Capability | Live reality (writers → readers) |
|---|---|
| Public application | Gate A page → `residence-intake` fn (service role) → `residence_application_intake` (RLS: staff-of-residence/care-ops SELECT only; no client DML) → notify trigger (staff of residence + care-ops roles) → IntakeQueuePage → `review_residence_application_intake` (audited; statuses contacted/account_offered/converted/waitlisted/declined/closed; **never creates people/applications**) |
| Canonical application | `residence_applications(person_id, residence_id, status, answers, decided_by…)`; statuses submitted/in_review/approved/waitlisted/declined/withdrawn; `review_residence_application` (staff), `withdraw_my_application` (participant), MyApplicationPage |
| Admission | `admit_applicant(application, residence, date)` — manager-gated RPC creating the residency (0115); `assign_bed`/`release_bed`; residency lifecycle RPCs; **approval does NOT auto-create residency** (already correct) |
| Documents | seeded from `packages/residence-content` via generated `documents_seed.sql` (source authority: `docs/source-documents/grace-house/`); org-scoped templates; `ensure_my_document_assignments()` assigns latest published sig-required versions — **only when an active residency exists**; resident signs via direct UPDATE under `document_assignments_ack_self` (only own, only unacknowledged rows) writing `acknowledged_at` + `signature_name`; 0 assignments live |
| Consent | `consent_types` (8 platform keys; none residence-specific) + `consent_grants` (scope jsonb, method, document_version, effective/expires/revoked, created_by); writers are **client-side self inserts** (onboarding gate, Grace ai_features); revocation = insert-new-revoked-row convention; no staff/definer write path, no disclosure audit |
| Identity | `ensure_person_for_current_user` (signup → person); `staff_preauthorizations` one-open-invite-per-email consumed by the signup trigger (purpose-tiered) |
| Notifications/follow-ups | intake notify trigger live (3 recipients in Gate A synthetic run); `follow_ups` machinery wired (0 rows); `create_follow_up` RPC |
| Evidence | P2 provenance live: administrative activity is NOT a service event; intake review writes `audit_log` |

## 3. Lifecycle / state model (reuse-first — zero new persisted states proposed)

The directive's lifecycle maps onto the two existing machines plus derived intake progress:

| Directive state | Canonical representation | New? |
|---|---|---|
| submitted | intake `received` | no |
| under review / contacted | intake `contacted` (+ `reviewed_by/at`) | no |
| **conditional acceptance** | intake `account_offered` — the staff decision "we're proceeding; here's your account" (participant invite issued) | no (semantic mapping ratified here) |
| intake pending | intake `converted` + canonical application `submitted/in_review` + checklist incomplete | **derived** |
| intake in progress | any checklist item complete, others open | **derived** |
| intake complete | checklist complete (all required docs signed/acked, required consents current, conditional items resolved) | **derived** (surfaced by a readiness RPC) |
| admitted / residency created | `admit_applicant` → residency `active` | no |
| declined / waitlisted / withdrawn / closed | existing values on whichever stage the person is in (`declined`/`waitlisted`/`closed` on intake; `declined`/`waitlisted`/`withdrawn` on application) | no |

Rules: `approved` on the canonical application means "cleared to complete intake," never
auto-residency. Admission is exactly one human action: **`admit_applicant`, gated on
intake-complete** (the RPC gains a readiness check — see §9a/§14). A person may stall or
step away at any stage without data loss; `closed` is always available without admission.

**RATIFIED constraint:** no parallel persisted intake-status state machine may be created.
If implementation evidence ever proves the derived model structurally insufficient, the
implementer STOPS and returns for executive review rather than persisting new states.

## 4. Application-to-intake field disposition

Gate A's application contract is final for the application stage. Disposition of everything
else (dedup rule: anything already in intake `answers` **pre-fills** and is confirmed, never
re-typed):

| Datum | Disposition | Purpose → Consumer → Necessity |
|---|---|---|
| Name, contact, preferred contact, voicemail-safe, county, timing, why, referral source | KEEP AT APPLICATION | already collected; **DERIVE at intake** (pre-fill from intake row via conversion — no duplicate entry) |
| 18+ | KEEP AT APPLICATION (attestation) | DOB only if a verified policy/funder requirement emerges — until then DO NOT COLLECT |
| Emergency contact (1–2 people: name, phone, relationship) | COLLECT AT INTAKE (universal) | house safety; consumer: residence staff; notification authorization captured with it (§7) |
| Medication list / storage needs | COLLECT AT INTAKE — **structured minimum only** per the signed Medication & MAT/MOUD Policy (name, storage requirement, prescriber-on-file yes/no); no narratives | consumer: residence staff med-count/storage operations |
| MOUD status | COLLECT ONLY IF CONDITIONALLY RELEVANT (person is on MOUD) — care-coordination flag; **never an eligibility signal** (policy is MAT/MOUD-affirming) | consumer: residence staff + medication policy operations |
| Accommodation needs (detail) | COLLECT AT INTAKE, conditional on the application flag; structured request + what's needed, no diagnosis narrative | consumer: residence staff; ADA/FHA process |
| Supervision coordination + officer contact + relevant legal obligations (reporting dates, curfew terms) | COLLECT ONLY IF CONDITIONALLY RELEVANT (application flag = yes AND a coordination authorization exists §7); officer contact stored only alongside the active authorization | consumer: staff coordinating with DOC/probation |
| Health/safety information | COLLECT ONLY IF CONDITIONALLY RELEVANT and only operationally actionable items (e.g. seizure protocol); no medical narratives | consumer: residence staff emergency response |
| SUD history, treatment history, substances used | **DO NOT COLLECT** as data. Recovery context emerges in the relationship (navigation/coaching), not on intake forms | no operational consumer identified |
| Trauma narratives | **DO NOT COLLECT** (standing doctrine) | — |
| References | DO NOT COLLECT unless GFA actually requires them (ED decision §17) | no traced consumer |
| Income/fee arrangement | COLLECT AT INTAKE via the signed Fee Schedule & Financial Agreement — the document IS the instrument; no extra fields | consumer: fee ledger |

## 5. Document / version / assignment model

Live inventory (all 20 org-scoped, all published; source authority =
`packages/residence-content` ← `docs/source-documents/grace-house/`; version + effective
date = `document_versions.version` + `published_at`):

| Template (key) | Sig required (live) | Gate B role at intake |
|---|---|---|
| participant_agreement | ✓ | **Agreement** — universal, sign |
| resident_handbook | ✓ | **Agreement** — universal, sign |
| code_of_conduct | ✓ | **Agreement** — universal, sign |
| fee_schedule_financial_agreement | ✓ | **Agreement** — universal, sign (NARR 1.A.3: fees disclosed before funds accepted) |
| good_neighbor_policy | ✓ | Agreement — universal, sign |
| medication_mat_moud_policy | ✓ | Agreement — universal, sign; pairs with conditional medication items (§8) |
| return_to_use_response_policy | ✓ | Agreement — universal, sign |
| screening_policy_consent | ✓ | Agreement **+ paired canonical consent grant** (§7) — universal |
| resident_rights (2 versions) | — | **Acknowledgment** — universal, ack-only |
| grievance_policy_form | — | Acknowledgment — universal |
| emergency_response_protocols | — | Acknowledgment — universal |
| curfew_pass_policy | — | Acknowledgment — universal |
| exit_transition_policy | — | Acknowledgment — universal |
| intake_forms_package | — | superseded as a monolith by this architecture (its content becomes the structured intake items); keep informational |
| code_of_ethics, complete_operational_system, incident_report_system, narr_ii_self_assessment, change_course_leaders_policy, form_application_prescreening | — | staff/operational — NOT assigned to residents |

### 5a. Document-authority reconciliation (RATIFIED requirement — blocks EJWRH signing UX)

Before any EJWRH resident-signing workflow ships, **every** document above must be
classified as exactly one of:

- **GFA organization-wide canonical** (EJWRH residents sign/ack the shared edition);
- **EJWRH-specific canonical** (an EJWRH edition exists or is authored);
- **Grace House-specific / not applicable to EJWRH** (never assigned at EJWRH);
- **PENDING executive/policy reconciliation.**

Binding rules: Grace House wording is never silently reused for EJWRH; **no document with
unresolved residence applicability may be assigned for EJWRH signature**; the version
machinery supports either outcome (new versions per template or EJWRH-keyed templates).

Preliminary assessment (all resident-facing items start **PENDING** — nothing below is a
policy determination, only a reconciliation aid): plausibly org-wide — code_of_conduct,
grievance_policy_form, resident_rights, medication_mat_moud_policy,
return_to_use_response_policy, screening_policy_consent; plausibly house-edition-specific
(house name, rules, fees, neighborhood) — resident_handbook, participant_agreement,
fee_schedule_financial_agreement, good_neighbor_policy, curfew_pass_policy,
emergency_response_protocols, exit_transition_policy; staff/operational set — not assigned
to residents at any house.

Assignment model: universal items above assign at intake start; conditional assignment
stays possible per template (future flag) but nothing currently requires it.

## 6. Signature / evidence model

Existing chain vs. required chain:

| Evidence element | Exists today | Gate B action |
|---|---|---|
| Document/version identity | ✓ (`document_versions.version`, unique per template) | KEEP |
| Immutable content representation | ✓ by convention (versioned `body_markdown`; clients cannot UPDATE) | **EXTEND**: guard trigger — a published version's body/version/published_at can never change; corrections are new versions |
| Content hash | ✗ | **EXTEND**: `document_versions.content_hash` (sha256 of body, computed at publish/seed; backfilled deterministically from existing bodies; seed generator emits it; CI guard pins package ↔ seed hash) |
| Assignment (version-pinned, person, residency) | ✓ (`residency_id` already nullable) | KEEP; **EXTEND** with nullable `application_id` so intake-stage assignment is anchored to the approved application |
| Acknowledgment | ✓ `acknowledged_at` | KEEP for ack-only docs |
| Signature distinct from acknowledgment | ✗ (conflated) | **EXTEND**: `signed_at` (sig-required docs set both; ack-only docs set only `acknowledged_at`) |
| Signed timestamp / signer identity | partial (`acknowledged_at`, `signature_name`, `person_id`) | EXTEND: signer identity = RPC actor (`current_person_id()`), recorded in audit |
| Immutable signed-artifact record | partial (self-ack policy blocks re-update; no owner-side guard) | **EXTEND**: trigger — an acknowledged/signed assignment row is immutable (like P2's provenance guard); the signed artifact = assignment (person, version FK, hash via version, signature_name, signed_at) — **reproducible without reference to the current/latest document version** |
| Audit trail | ✗ for signing | **EXTEND**: signing/ack moves to a definer RPC (`acknowledge_document(p_assignment_id, p_signature_name?)`) writing `audit_log`; the direct-UPDATE `ack_self` policy is retired after cutover (staged, P2-style — RPC live → UI switched → policy narrowed → dropped) |

## 7. Consent / ROI model (canonical, no parallel system)

Four concepts kept architecturally distinct:

1. **Acknowledgment** = `document_assignments.acknowledged_at` (received/read).
2. **Agreement** = `document_assignments.signed_at + signature_name` on agreement-class
   templates (residency terms).
3. **Consent** = `consent_grants` rows (authorized information use), scoped + revocable +
   expirable, written through a new definer path with audit.
4. **Coordination authorization** = a consent grant with a **structured scope** naming an
   external recipient and purpose (below) — plus, where the person *requests* coordination,
   the request itself is workflow state (a follow-up/intake item), not a consent.

Proposed canonical consent types (new `consent_types` rows — reusing the table, never a
parallel store): `residence_screening` (paired 1:1 with the signed screening policy —
enforcement reads the GRANT, not the document), `information_disclosure` (the ROI shape),
`supervision_coordination` (specialization of disclosure for DOC/probation).

ROI structured scope (validated by the write RPC, stored in the existing `scope` jsonb —
no schema change): `{recipient_name, recipient_organization, recipient_relationship,
information_scope: [enumerated categories — e.g. residency_status, screening_results,
attendance, medication_presence], purpose, notes?}` + existing columns for effective/
expires/revoked. Write path: `record_consent_grant(...)`/`revoke_consent_grant(...)` definer
RPCs — participant-present action recorded by the participant's own session where possible,
or staff-recorded with method='verbal_witnessed'/'paper' and creator identity; every grant
and revocation writes `audit_log`. **Enforcement**: any staff surface exposing
screening/medication/supervision data to an external party must check the current grant
(status granted, not revoked, not expired, scope covers the category + recipient);
disclosure events append an audit row (`consent_disclosure_recorded`). Revocation is honored
prospectively and visible to staff immediately.

**Legal posture (honest):** GFA policy treats resident information as confidential and
consent-gated. Whether 42 CFR Part 2 applies to any specific GFA data flow is **not
established by verified legal analysis in this repo** (the handbook references Part 2
*alignment* as policy). All Gate B language stays "GFA policy"; Part 2 claims await counsel
(§16).

## 8. Conditional sensitive-data model

One narrow new table per genuinely-new entity; no narratives; visibility per §11:

- `emergency_contacts` (person_id, name, phone, relationship, notify_authorized boolean,
  created/updated, RLS: self + residence staff of active residency/intake residence) —
  universal at intake. The **notification authorization** lives here (per-contact), separate
  from any emergency-response *notice* (operational authority is never checkbox-dependent —
  Gate A doctrine).
- `residency_medication_items` (person_id, application_id/residency_id, name, storage
  requirement enum, is_moud boolean, prescriber_on_file boolean, active/ended) — structured
  minimum for the signed medication policy's storage/count operations. `is_moud` is care
  coordination only; **never eligibility**; never surfaced beyond residence staff.
- Supervision coordination: officer name/phone + obligations summary stored **only** with an
  active `supervision_coordination` grant (revocation ends visibility); anchored to the
  application/residency; conditional on the application flag.
- Accommodation: structured request on the intake checklist (need + what helps), staff
  response recorded; no diagnosis field.
- Health/safety: optional, operationally actionable items only (protocol name + what staff
  should do), assigned conditionally.

## 9. Admission / residency conversion model

The missing link is one RPC. Full chain:

1. **Conditional acceptance**: staff set intake `account_offered` (existing RPC) → issue a
   **participant-purpose preauthorization/invite** for the applicant's email (confirm/extend
   0117's purpose tiers — trace item; today's tiers are staff-oriented).
2. Applicant signs up → signup trigger + `ensure_person_for_current_user` create the person.
   **Identity dedup**: the new `convert_application_intake(p_intake_id, p_person_id)` RPC
   (staff, audited) requires an explicit person choice, warns on email/phone match with an
   existing person, sets `converted_person_id`, creates the canonical
   `residence_applications` row (status `submitted`, `answers` **pre-filled from the intake
   answers** — no duplicate entry), sets `converted_application_id`, and marks the intake
   `converted`. Never automatic; never creates auth users itself.
3. Staff `review_residence_application` → `approved` (existing).
4. Intake checklist (new staff surface + `application_intake_readiness(p_application_id)`
   RPC): assigns universal documents (via extended assignment path anchored to
   `application_id`), tracks signatures/acks, consent grants, conditional items; the
   participant completes documents in the existing resident Documents UI (unlocked for
   persons with an approved application, not only active residents).
5. **Admission = `admit_applicant`** (existing manager-gated human action), **EXTENDED** with
   a readiness gate: refuses (`intake_incomplete`, listing missing items) unless the
   checklist passes or the manager passes an explicit, audited override reason. Creates the
   residency; bed via `assign_bed`; `ensure_my_document_assignments` back-links assignment
   rows to the new residency.
6. Post-admission: notify + optional `create_follow_up` (settle-in check); coaching/
   navigation connection remains a human offer through existing assignment RPCs — never
   automatic.

## 9a. Readiness taxonomy & admission override (RATIFIED)

Every checklist requirement carries exactly one classification:

| Class | Meaning | Initial assignment (subject to §5a reconciliation) |
|---|---|---|
| **REQUIRED FOR INTAKE COMPLETION** | must exist before intake counts complete | emergency contact (≥1); acknowledgment of resident rights + grievance procedure; medication items recorded per the medication policy where the person has medications |
| **REQUIRED BEFORE ADMISSION** | blocking at `admit_applicant` | signed participant agreement; signed handbook/code of conduct; signed fee schedule & financial agreement; signed medication policy; signed return-to-use policy; screening policy signature **+ current `residence_screening` consent grant** |
| **CONDITIONALLY REQUIRED** | required only when the condition holds | supervision-coordination authorization + officer contact (when coordination applies); accommodation plan (when a need is raised); MOUD care-coordination flag (when on MOUD); actionable health/safety items (when disclosed) |
| **RECOMMENDED / NON-BLOCKING** | encouraged, never gating | second emergency contact; why-EJWRH context confirmation |
| **DEFERRED WITH FOLLOW-UP** | may complete after admission, tracked via `follow_ups` | items the manager defers under the override model below |
| **NOT APPLICABLE** | condition absent | conditional items whose condition does not hold |

**Override model (narrow, audited):** a residence manager or platform admin may admit with
specific unmet items **only** when every unmet item is non-safety-critical and
non-legally-required. Each override records: authorized actor, timestamp, the exact unmet
requirement(s), reason, a concrete follow-up obligation (a `follow_ups` row is created —
the deferral is not complete without it), and an `audit_log` event.

**Non-overridable, categorically:** immediate safety requirements (emergency contact,
actionable health/safety items where disclosed); mandatory consent/rights requirements
(resident-rights acknowledgment; screening consent where screening will occur); legally
required documentation; and any item policy explicitly marks non-overridable.

**STOP condition:** if implementation reveals uncertainty about what is legally or
operationally non-overridable for a specific item, implementation STOPS for executive
review rather than deciding.

## 10. Frontline staff workflow (no raw Supabase, ever)

IntakeQueuePage (exists) gains the action rail; one new Intake Checklist view:

| Staff need | Surface | Mechanism |
|---|---|---|
| See applications needing action | IntakeQueuePage (exists) + notify trigger (exists) | KEEP |
| Contact applicant / record disposition | IntakeQueuePage → `review_residence_application_intake` (exists) | WIRE (buttons exist) |
| Conditionally accept + offer account | same RPC (`account_offered`) + invite action | EXTEND (invite issuance) |
| Convert to canonical application | `convert_application_intake` (new) with dedup warning | NEW RPC |
| Launch intake / see missing items | **Intake Checklist view** per applicant: documents (signed/acked/missing), consents (current/expired/revoked), conditional items; powered by `application_intake_readiness` | NEW view + RPC |
| Review consents | checklist consent panel (reads grants; revocations visible) | NEW panel |
| Review acknowledgments/signatures | checklist document panel (version + hash + signed_at) | NEW panel |
| Resolve incomplete items | direct links (re-assign doc, record consent, add item) | WIRE |
| Admit / create residency | existing admit flow, readiness-gated | EXTEND |
| Initiate follow-up | existing `create_follow_up` one-tap (Gate A/P2.7 pattern) | WIRE |

Evidence generates from the natural actions themselves (RPC audit rows); no extra
documentation steps are added.

## 11. RLS / access matrix (intended; least privilege)

| Data | Applicant (pre-account) | Resident/participant (self) | Residence staff (that residence) | Coach | Navigator | Admin | External partner | Anonymous |
|---|---|---|---|---|---|---|---|---|
| Intake row (application) | — (write via boundary only; no read-back) | own, read-only after conversion | ✓ read + review RPC | ✗ | care-ops read (existing) | via RPCs | ✗ | ✗ |
| Canonical application | — | own (existing) | ✓ (existing) | ✗ | ✗ | RPCs | ✗ | ✗ |
| Document assignments/signatures | — | own (sign/ack own) | ✓ status + artifact for their residence's applicants/residents | ✗ | ✗ | RPCs | ✗ | ✗ |
| Consent grants | — | own (view/grant/revoke) | ✓ relevant grants for their residence's people (status + scope, to enforce) | only grants naming coaching scope | only grants naming navigation scope | RPCs | **never direct access** — staff disclose per grant, disclosure audited | ✗ |
| Emergency contacts | — | own | ✓ | ✗ | ✗ | RPCs | ✗ | ✗ |
| Medication/MOUD items | — | own | ✓ (their residence only) | ✗ | ✗ | RPCs | ✗ | ✗ |
| Supervision/officer info | — | own | ✓ while an active coordination grant exists | ✗ | ✗ | RPCs | disclosed by staff per grant only | ✗ |
| Health/safety items | — | own | ✓ | ✗ | ✗ | RPCs | ✗ | ✗ |

Nothing becomes visible merely because someone is a resident; coach/navigator get **no**
medication, SUD, justice, or medical visibility from Gate B. Aggregates only for reporting.

## 12. Evidence / provenance classification

| Event | Class |
|---|---|
| Application submitted / reviewed / converted | application activity (state + `audit_log`) — **never a service event** |
| Document assigned / acknowledged / signed | acknowledgment/agreement evidence (assignment rows + audit) |
| Consent granted / revoked / disclosed | consent actions (grants + audit) |
| Conditional acceptance, approval, admission | admission state transitions (status + audit) |
| Residency created | residency state (existing) |
| Intake conversations, navigation help during intake | ONLY a service event when a staff member deliberately attests one through the existing P2 writers (`staff_attested`) — administrative processing is never auto-converted |
| Outcomes | unchanged — evidence-gated state records (P2 doctrine intact) |

## 13. KEEP / EXTEND / WIRE / MIGRATE / DEPRECATE / REMOVE map

| Capability | Verdict |
|---|---|
| `residence_application_intake` + review RPC + queue + notify | **KEEP/WIRE** (action rail) |
| `residence_applications` lifecycle + review/withdraw RPCs | **KEEP** |
| `admit_applicant` / `assign_bed` / residency RPCs | **EXTEND** (readiness gate + audited override) |
| `document_templates/versions/assignments` + resident Documents UI | **EXTEND** (content_hash, signed_at, application_id anchor, immutability guards, signing RPC + audit; unlock for approved applicants) |
| `ensure_my_document_assignments` | **EXTEND** (assign against approved application as well as active residency) |
| `document_assignments_ack_self` direct-UPDATE policy | **MIGRATE → DEPRECATE** (staged cutover to the signing RPC, P2 pattern) |
| `consent_types/consent_grants` | **EXTEND** (3 new types; structured ROI scope; definer grant/revoke RPCs + disclosure audit) |
| Client-side consent self-inserts (onboarding/Grace) | **KEEP** for platform consents; residence/ROI consents use the RPC path from day one |
| `staff_preauthorizations` signup path | **EXTEND/VERIFY** (participant-purpose invitation) |
| `follow_ups` | **WIRE** (post-admission check-in) |
| `intake_forms_package` monolith document | **DEPRECATE as an instrument** (content superseded by structured intake; keep informational) |
| `public.housing_applications` | unchanged — DEPRECATED (Gate A); REMOVE at a future cleanup gate |
| Parallel consent/document/residency/applicant stores | **REMOVE from consideration — none created** |

## 14. Ratified implementation plan (REVISED per the Gate B Executive Ratification — plan
only; migrations 0139+ NOT created in this turn; live applies only under a Gate B
implementation authorization)

Shared discipline for every step: additive-first; rollback in the migration header;
pre-mutation checklist + full preflight after each live apply; guards/typecheck/tests/build
+ remote CI green before any push is called done; synthetic/fixture data only in
verification; STOP rather than improvise on any authority conflict.

**B1 (migration 0139) — document evidence hardening**
- *Purpose:* make the signed artifact provable and immutable (§6 chain).
- *Dependencies:* none (first step). *Legal/policy prerequisite:* **none** — evidence
  hardening is edition-agnostic; §5a reconciliation is NOT required for B1.
- *Data touched:* `document_versions` (+`content_hash`, deterministic sha256 backfill from
  existing bodies — migration ABORTS if any published version fails to hash),
  `document_assignments` (+`signed_at`, +`application_id` FK); immutability triggers
  (published version body/version/published_at frozen; acknowledged/signed assignment rows
  frozen); new `acknowledge_document(p_assignment_id, p_signature_name default null)`
  definer RPC (ack always; signed_at+name only for sig-required templates) writing
  `audit_log`; seed generator emits hashes; CI guard `verify-document-evidence.mjs`
  (package ↔ seed ↔ hash ↔ sig-required list; negative-tested).
- *Authorization boundary:* RPC = the assignee only (`person_id = current_person_id()`);
  existing `ack_self` policy untouched in B1 (retired in B6).
- *Rollback:* drop RPC, triggers, three columns; guard step revert.
- *Verification:* hash backfill counts; immutability negative tests (UPDATE of published
  body / signed row raises); RPC positive + cross-person negative; preflight (step-8 gains
  `acknowledge_document`).
- *STOP:* any published version fails deterministic hashing, or live bodies diverge from
  the content package.

**B2 (migration 0140) — consent extension**
- *Purpose:* canonical scoped/revocable/auditable consent for residence + ROI (§7).
- *Dependencies:* none on B1. *Legal/policy prerequisite:* creating types/RPCs — none;
  **activating any external disclosure workflow** — blocked until Part 2 analysis +
  retention rules (§16a).
- *Data touched:* seed 3 `consent_types` (`residence_screening`,
  `information_disclosure`, `supervision_coordination`); `record_consent_grant` /
  `revoke_consent_grant` definer RPCs (ROI scope validation: recipient, organization,
  enumerated information categories, purpose; method incl. verbal_witnessed/paper with
  creator identity); disclosure-audit helper (`consent_disclosure_recorded` audit rows);
  staff read policy per §11. Existing grants untouched.
- *Authorization boundary:* grant = self, or staff-of-residence recording a witnessed
  grant (creator stamped); revoke = self or recording staff; reads per §11 matrix.
- *Rollback:* drop RPCs + policy; deactivate the 3 types (rows kept).
- *Verification:* grant/revoke lifecycle with fixture person; scope-validation negatives;
  expiry behavior; cross-role read negatives; preflight step-8 additions.
- *STOP:* any need to widen existing consent RLS beyond the §11 matrix.

**B3 (migration 0141) — conversion + readiness + admission gate**
- *Purpose:* close the intake→person→application chain; derived readiness; gated admission
  (§3, §9, §9a).
- *Dependencies:* B1 (readiness reads signed_at), B2 (readiness reads grants). *Legal/policy
  prerequisite:* none for the RPCs; the readiness item LIST for signature items follows §5a
  reconciliation before EJWRH signing activates.
- *Data touched:* `convert_application_intake(p_intake_id, p_person_id)` (staff, audited,
  email/phone dedup warning, answers pre-fill, sets converted_* and `converted` status —
  never creates auth users); `application_intake_readiness(p_application_id)` (derived
  checklist per §9a taxonomy; aggregate-only return); participant-purpose invitation path
  (first: trace 0117's signup trigger purposes — if participant purpose is absent, extend;
  STOP if the trigger's behavior contradicts the trace); `admit_applicant` re-created with
  the readiness gate + narrow audited override per §9a (override writes actor/timestamp/
  unmet items/reason + creates the follow-up obligation + audit row).
- *Authorization boundary:* convert/readiness = staff-of-residence or care-ops; admit =
  existing manager gate; override = manager/platform-admin only.
- *Rollback:* re-create prior `admit_applicant` body (embedded in header); drop new RPCs.
- *Verification:* full synthetic chain (intake → convert → application → readiness states →
  blocked admit → completed checklist → admit; override path with follow-up + audit;
  non-overridable item refusal); identity-dedup warning test; preflight.
- *STOP:* §9a uncertainty about non-overridable classification; signup-trigger contradiction;
  any evidence the derived readiness model is structurally insufficient (per ratified §3 —
  return for executive review, do not persist new states).

**B4 (migration 0142) — conditional intake tables**
- *Purpose:* structured-minimum conditional data (§8).
- *Dependencies:* B2 (supervision storage is grant-anchored). *Legal/policy prerequisite:*
  none to create; retention rules (§16.3) before records outlive residency.
- *Data touched:* `emergency_contacts`, `residency_medication_items` (+ supervision
  storage rule), RLS per §11 (self + residence staff; nobody else), RPC-only writes where
  staff-recorded; MOUD flag never referenced by any eligibility/queue logic (guard-tested).
- *Authorization boundary:* self + residence staff of the person's residence; coach/
  navigator/external: none.
- *Rollback:* drop tables/policies (0 rows at rollback point).
- *Verification:* role-matrix positives/negatives incl. cross-residence; MOUD-not-eligibility
  guard test; preflight.
- *STOP:* any pressure to add narrative fields — return to §4 dispositions.

**B5 — frontline UI (no migration)**
- *Purpose:* staff operate entirely in RecoveryOS (§10).
- *Dependencies:* B1–B4 live. *Legal/policy prerequisite:* **EJWRH signing UX ships only
  after §5a reconciliation + Iowa e-signature review (§16a)**; the queue/checklist/consent
  panels do not wait on those.
- *Changes:* IntakeQueuePage action rail; Intake Checklist view (readiness RPC); Documents
  UI unlocked for approved applicants (application-anchored assignments); consent panel;
  admit-gate UX with override flow; post-admission follow-up prompt. Tests per surface,
  including override-audit rendering and non-overridable refusal.
- *Rollback:* revert commits (server state unaffected).
- *STOP:* any surface requiring raw-table staff writes.

**B6 — staged signing cutover (final)**
- *Purpose:* retire the direct-UPDATE `ack_self` path so all signing evidence flows through
  the audited RPC (P2 cutover pattern).
- *Dependencies:* B5 deployed; RPC path verified in use. *Legal/policy prerequisite:* same
  as B5 signing UX.
- *Sequence:* RPC live (B1) → UI switched (B5) → telemetry window (zero direct
  acknowledgment UPDATEs) → narrow then drop `ack_self` (migration; rollback = recreate the
  0013 policy).
- *STOP:* any direct-update traffic during the telemetry window.

## 15. Privacy / compliance risks

1. Officer/supervision data outliving its authorization → mitigated by grant-anchored
   visibility + revocation honored prospectively; residual: retention/deletion policy
   needed (§16).
2. Medication/MOUD data broadening beyond residence staff → matrix + RLS keeps it
   residence-scoped; MOUD never in eligibility logic (tested).
3. Signature disputes → hash + version-pinned immutable artifact resolves "what was signed";
   residual: signer *authentication* strength is account-level (password) — adequate for
   policy signatures, flagged for counsel on the residency agreement.
4. Shared-org documents naming Grace House signed by EJWRH residents → authority question
   (§16/§17); do not assign until resolved.
5. Part 2/HIPAA overclaim risk → all language stays "GFA policy" pending counsel.
6. Data minimization drift (intake forms re-growing) → the §4 disposition table is the
   contract; CI guard on the application boundary already pins the application side.

## 16. Unresolved policy / legal questions (no policy invented)

1. EJWRH document editions: sign shared GFA/Grace House documents as-is, or EJWRH-specific
   versions? (House-specific wording is currently Grace House-authored.) **UPDATE
   2026-08-24:** the canonical EJWRH program model now exists
   (`docs/architecture/ejwrh-program-model-v1.0.md` — three phases, curfews, participation,
   pathway-neutral recovery support, return-to-use human-decision sequence, GFA/Operator
   split, IRP-as-generated-view, burden test). EJWRH editions are authored FROM that model;
   the retired four-level document is not a drafting source. Two confirmation items remain
   before edition authoring completes (weekly activity count; executed PSA version).
2. 42 CFR Part 2 applicability to GFA data flows — needs counsel; policy language currently
   says "alignment."
3. Retention/deletion schedule for declined/withdrawn/closed intakes and for
   supervision/medication data after residency ends.
4. Whether references are actually required (traced consumer: none).
5. E-signature sufficiency of typed-name + account authentication for the Participant
   Agreement under Iowa law — counsel confirmation recommended (mechanism is sound;
   sufficiency is a legal call).
6. Participant-purpose invitation behavior in the 0117 signup trigger (technical trace to
   complete at B3; extension designed if absent).

### 16a. Phase-blocking matrix (RATIFIED sequencing — unresolved items block only what
depends on them)

| Unresolved item | Blocks | Does NOT block |
|---|---|---|
| §16.1 EJWRH document editions/applicability (§5a reconciliation) | EJWRH resident-**signing** UX (B5 signing surfaces, B6) and any EJWRH signature assignment | B1–B4 entirely; queue/checklist/consent panels in B5 |
| §16.5 Iowa e-signature sufficiency review | same as above (signing UX activation) | B1's evidence plumbing itself |
| §16.2 42 CFR Part 2 applicability analysis | activation of any **external ROI/disclosure workflow** | creating consent types/RPCs (B2); internal consent recording |
| §16.3 retention/deletion rules | records outliving residency; external disclosure activation | table creation (B4) with 0 rows; intake-period use |
| §16.4 references requirement | nothing (not collected unless required) | everything |
| §16.6 participant-invitation trace | B3's invite step (traced first inside B3; STOP on contradiction) | B1, B2, B4 |

Voluntary GFA privacy practices are never presented as legal requirements unless verified.

## 17. Executive Director decisions — RESOLVED (Gate B Executive Ratification, 2026-08-24)

1. **Lifecycle mapping** — APPROVED (derived readiness; no parallel persisted machine;
   STOP-for-review escape hatch; approval never creates residency; `admit_applicant` stays
   the human action).
2. **Field dispositions** — APPROVED WITH MINIMIZATION (prefill mandatory; only
   current-operational-purpose intake data; no universal SUD/treatment/trauma/broad-medical
   narratives or unrelated justice history; MOUD never a negative eligibility signal).
3. **Document intake set** — APPROVED SUBJECT TO §5a RECONCILIATION (four-way authority
   classification before any EJWRH signing; no silent Grace House reuse; unresolved
   applicability = never assigned for EJWRH signature).
4. **Consent/ROI model** — APPROVED (canonical `consent_grants` only; four constructs
   separate; external disclosure governed by ACTIVE consent, never a signed document alone).
5. **Conditional data model** — APPROVED (structured minimum; bounded values over
   narratives; role-restricted per §11).
6. **Admission override** — APPROVED, NARROW AND AUDITED, per §9a (non-overridable
   categories fixed; STOP on classification uncertainty).
7. **Sequencing** — APPROVED per §16a (per-phase prerequisites; unresolved questions block
   only dependent functionality).

## 18. Implementation sequence & rollback gates

B1 → B2 → B3 → B4 → B5 → B6, each separately committed, guarded, preflighted, and
STOP-capable; live applies only under Gate B implementation authorization with the standard
pre-mutation checklist; every migration carries its rollback; the signing-policy retirement
(B6) is telemetry-gated like P2's 0137. Cloudflare activation remains a separate gate after
Gate B **plus** browser-level HTTP verification of the public path; the Platform Launch Gate
(P2.5 frontend) remains independent.

---

*Architecture RATIFIED with executive conditions (2026-08-24). No implementation, no CQCX
mutation, no Cloudflare activation, no applicant traffic. Migrations 0139+ are reserved,
not created. Awaiting Gate B implementation authorization.*
