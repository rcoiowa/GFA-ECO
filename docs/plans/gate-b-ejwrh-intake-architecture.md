# Gate B — EJWRH Post-Acceptance Intake, Consent, Document & Admission Architecture

**Status: ARCHITECTURE REVIEW — analysis only. Nothing implemented; no CQCX mutation; no
Cloudflare activation; no applicant traffic.** Baseline: Gate A at `8e4b07e` (accepted
canonical EJWRH public-application baseline; CI #102 green; CQCX ledger through
`0138_ejwrh_containment` — re-verified live this session). Every current-state claim below
was traced to actual writers/readers/policies in the repo at `8e4b07e` and live CQCX
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
intake-complete** (the RPC gains a readiness check — see §14). A person may stall or step
away at any stage without data loss; `closed` is always available without admission.

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

Open authority item (§16/§17): the live set is the **Grace House** edition. Whether EJWRH
signs the shared org documents as-is or requires EJWRH-specific versions (house name,
men's-residence specifics, house rules) is a policy decision; the version machinery supports
either (new versions per template, or EJWRH-keyed templates). **No policy wording is
invented here.**

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

## 14. Proposed implementation plan (plan only — numbers reserved, nothing applied)

- **B1 (0139) — document evidence hardening**: `content_hash` on versions (deterministic
  backfill from bodies; abort on hash failure); `signed_at` + `application_id` on
  assignments; immutability triggers (published versions; acknowledged/signed assignments);
  `acknowledge_document` RPC (audited; sets ack and, for sig-required, signed_at +
  signature_name); seed generator emits hashes; CI guard `verify-document-evidence.mjs`
  (package ↔ seed hash ↔ sig-required list; negative-tested). Rollback per column/trigger.
- **B2 (0140) — consent extension**: 3 consent types seeded; `record_consent_grant` /
  `revoke_consent_grant` RPCs with ROI scope validation + audit; disclosure audit helper;
  staff read policy scoped per §11. No change to existing grants.
- **B3 (0141) — conversion + readiness**: `convert_application_intake` (dedup-warning,
  pre-fill, audited); `application_intake_readiness`; participant-purpose invitation path
  (after the 0117 trace item resolves); `admit_applicant` readiness gate + override audit.
- **B4 (0142) — conditional intake tables**: `emergency_contacts`,
  `residency_medication_items`, supervision-coordination storage rule, RLS per §11, RPC-only
  writes where staff-recorded.
- **B5 — frontline UI**: IntakeQueuePage action rail; Intake Checklist view; Documents UI
  unlock for approved applicants; consent panel; admit gate UX. Tests per page.
- **B6 — staged signing cutover**: UI → RPC; narrow then drop `ack_self` (telemetry-gated,
  P2 pattern).
- Every migration: additive, rollback in header, preflight after apply (step additions where
  new RPCs land), full guards/tests/CI; synthetic-only E2E (application → conversion →
  documents → consents → readiness → admission) with fixture people; live apply only under a
  Gate B implementation authorization.

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
   versions? (House-specific wording is currently Grace House-authored.)
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

## 17. Executive Director decisions requiring ratification

1. **Lifecycle mapping** (§3): `account_offered` = conditional acceptance; intake progress
   derived, not persisted; admission = readiness-gated `admit_applicant` with audited
   override. 
2. **Field dispositions** (§4) — especially: no DOB, no SUD/treatment history collection,
   references not collected, medication structured-minimum set.
3. **Document intake set** (§5 table) and the EJWRH-edition question (§16.1).
4. **Consent types + ROI scope categories** (§7), and that screening enforcement reads the
   grant, not the signed document alone.
5. **Conditional data model** (§8), including that `is_moud` is care coordination only.
6. **Admission override** existence (manager may admit with an audited reason despite an
   incomplete checklist) — or strict no-override.
7. Sequence approval (§14) and which of §16's questions must resolve before B1 starts
   (recommendation: §16.1 and §16.5 before B5's signing UX ships; §16.2/16.3 before any
   external disclosure workflow activates).

## 18. Implementation sequence & rollback gates

B1 → B2 → B3 → B4 → B5 → B6, each separately committed, guarded, preflighted, and
STOP-capable; live applies only under Gate B implementation authorization with the standard
pre-mutation checklist; every migration carries its rollback; the signing-policy retirement
(B6) is telemetry-gated like P2's 0137. Cloudflare activation remains a separate gate after
Gate B **plus** browser-level HTTP verification of the public path; the Platform Launch Gate
(P2.5 frontend) remains independent.

---

*Architecture gate complete. No implementation, no CQCX mutation, no Cloudflare activation,
no applicant traffic. Awaiting Gate B ratification.*
