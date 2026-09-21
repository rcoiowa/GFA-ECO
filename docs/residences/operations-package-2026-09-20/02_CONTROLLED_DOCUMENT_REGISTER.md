# 02 — Controlled Document Register

- **Residence applicability:** both · **Evidence date:** 2026-09-20
- **Sources:** CQCX live `document_templates` + `document_versions` + `document_assignments`; repo `docs/residences/ejwrh/`, `docs/source-documents/grace-house/`, `docs/residence-documents/`, `docs/agreements/`
- **State:** PREPARED (register of existing docs; **not** a re-authoring) · **Owner:** ED · **Approval required:** yes (for any activation/training decision) · **Effective:** not effective · **Supersession:** none

Legend for DB state: **published** = latest version has `published_at`; **assignments** = count of resident/document assignments (operational-use signal). *Published ≠ trained ≠ operationally followed.*

### Canonical document-state vocabulary (item 8 — used consistently across all 19 files)
Distinct, non-implying states; **active/published never automatically means assigned, distributed, trained, or operationally used**:
`existing source document` · `ratified` · `active in CQCX` · `published in CQCX` · `assigned` · `distributed` · `trained` · `operationally used` · `prepared draft` · `not effective` · `missing` · `superseded` · `counsel-held`.
- EJWRH editions here are **ratified + published in CQCX + not-yet-assigned** (0 assignments) → therefore **not distributed / not trained / not operationally used** on that evidence.
- Grace House editions are **ratified + published + assigned** (assignment = distribution/use signal) → **training still UNKNOWN** (assignment ≠ trained).

## EJWRH (residence_id 2) — 6 editions, all published v1.0, **0 assignments each**
| Title | key | Ver | Sig/Ack | DB state | Repo source | Ratification |
|---|---|---|---|---|---|---|
| EJWRH Participant & Residency Agreement | ejwrh_participant_agreement | 1.0 | Signature | published, 0 assign | docs/residences/ejwrh/participant-residency-agreement.md | ratified 2026-08-31 (0146) |
| EJWRH Resident Handbook | ejwrh_resident_handbook | 1.0 | Ack | published, 0 assign | .../resident-handbook.md | ratified |
| EJWRH Resident Rights & Grievance | ejwrh_resident_rights_grievance | 1.0 | Ack | published, 0 assign | .../resident-rights-grievance.md | ratified |
| EJWRH Screening Policy | ejwrh_screening_policy | 1.0 | Ack | published, 0 assign | .../screening-policy.md | ratified |
| EJWRH Medication & MOUD Policy | ejwrh_medication_moud_policy | 1.0 | Ack | published, 0 assign | .../medication-moud-policy.md | ratified |
| EJWRH Return-to-Use Response Policy | ejwrh_return_to_use_response_policy | 1.0 | Ack | published, 0 assign | .../return-to-use-response-policy.md | ratified |

- **Gap:** EJWRH set is published but **never assigned** → not yet operationally exercised; staff training UNKNOWN.
- **Governing instrument:** PSA v4.1 (`docs/agreements/ejwrh-psa-v4.1.md`) — state **PREPARED / FINAL-FOR-EXECUTION; execution UNKNOWN — evidence required** (source .docx `EJWRH_ProfessionalServices_Agreement_v4.1_FINAL_FOR_EXECUTION.docx`; prior `v4.0 …UNEXECUTED.docx` superseded).
- **EJWRH content-location reconciliation (item 4 — content present in the handbook; do not mark MISSING for lack of a separate edition):** the EJWRH Resident Handbook (`ejwrh_resident_handbook` v1.0, ratified + published; 0 assignments) **absorbs, as one acknowledgment,** curfew/pass (§1/§3), emergency response (§6), exit/transition (§9), good-neighbor & day-to-day conduct (§4), and the employment expectation (§1–§2). These topics are **A — present in the active handbook**, not missing; only *standalone editions* are absent, by design (do not borrow Grace House's).
- **Genuinely absent as EJWRH editions (not merely "no separate doc"):** a dedicated **Fee Schedule** resident-facing edition (fees live in PSA Art. 4 + DB, no published EJWRH fee edition), an **emergency-contact intake form** (prepared draft only, §11), and an **EJWRH printable/approved intake edition** (prepared-not-available). A standalone **Code of Conduct** edition is absent, but conduct **content** is in the handbook §4.

## Grace House (residence_id 1) — 14 residence-scoped templates (all published; most assigned)
| Title | key | Ver | Sig/Ack | DB state |
|---|---|---|---|---|
| Participant Agreement | participant_agreement | 2.0 | Sig | published, 3 assign |
| Resident Handbook | resident_handbook | 2.0 | Sig | published, 1 assign |
| Resident Rights & Responsibilities | resident_rights | 2.0 (1.0 also present) | Ack | published, 1 assign |
| Code of Conduct | code_of_conduct | 1.0 | Sig | published, 1 assign |
| Drug & Alcohol Screening Policy & Consent | screening_policy_consent | 2.0 | Sig | published, 1 assign |
| Medication & MAT/MOUD Policy | medication_mat_moud_policy | 2.0 | Sig | published, 1 assign |
| Return-to-Use Response Policy | return_to_use_response_policy | 2.0 | Sig | published, 1 assign |
| Fee Schedule & Financial Agreement | fee_schedule_financial_agreement | 2.0 | Sig | published, 1 assign |
| Curfew & Pass Policy + Request Form | curfew_pass_policy | 2.0 | Ack | published, 1 assign |
| Grievance Procedure & Form | grievance_policy_form | 1.0 | Ack | published, 1 assign |
| Emergency Response Protocols | emergency_response_protocols | 1.0 | Ack | published, 1 assign |
| Exit & Transition Policy | exit_transition_policy | 2.0 | Ack | published, 1 assign |
| Good Neighbor Policy | good_neighbor_policy | 2.0 | Sig | published, 1 assign |
| Intake Forms Package | intake_forms_package | 1.0 | — | published, 0 assign |

- **Repo source library:** `docs/source-documents/grace-house/` holds **20 .docx** (the "operational library"), indexed at `docs/content-intake/grace-house/INDEX.md`; authority = **ADR-0013** ("these documents are the policy authority"). A signed packet exists: `docs/residences/grace-house/grace-house-signing-packet-2026-08-30.pdf`.
- **Reconciliation note:** 14 residence_id=1 templates + 6 org-level templates ≈ the 20-doc library. `resident_rights` carries both v1.0 and v2.0 (v2.0 is current per ADR-0013; **v1.0 SUPERSEDED**). Confirm each source .docx maps to exactly one DB template (no orphan source, no orphan template).

## Shared / org-level (residence_id null) — see 01_SHARED_RECOVERY_RESIDENCE_STANDARDS
code_of_ethics 2.0 · complete_operational_system 2.0 · form_application_prescreening 2.0 · incident_report_system 1.0 · narr_ii_self_assessment 2.0 · change_course_leaders_policy 2.2 — all published.

## Conflicts / gaps flagged
- **EJWRH capacity CONFLICT:** PSA Art. 3 = 10 beds; DB `capacity` = null. Reconcile.
- **EJWRH move-in fee:** PSA = $250 nonrefundable; no published EJWRH fee edition in DB. Grace House DB has fee edition but **move-in fee UNKNOWN**.
- **ROI / Release-of-Information (reconciled):** a **Grace House ROI draft exists** — `docs/residence-documents/form_release_of_information.md`, **Version 2026.07**, generated (`packages/residence-content`), resident-facing, GFA–Grace House branded; authorizes checkbox-scoped disclosure (residency confirmation, attendance, screening, recovery plan, medication, fees, other), purpose, direction, ≤1-year expiry, revocation, with a 42 CFR Part 2 re-disclosure note. **Not ratified, NOT a CQCX `document_templates` edition, and self-flags "verify clause codes … Iowa HHS form 470-0025" → counsel review.** State: **DRAFT / PREPARED, not active.** **EJWRH:** no ROI — **MISSING / HELD.** (Screening consent + medication disclosure exist but are not general authorizations-to-disclose.) Counsel gate stands.
- **Training:** assignments prove *distribution/use* for some Grace House docs; they do **not** prove staff training. Training status UNKNOWN for both.
- **Distribution audience / training-required columns:** to be set per document in the operational packets (03/04); not asserted here without ownership confirmation.
