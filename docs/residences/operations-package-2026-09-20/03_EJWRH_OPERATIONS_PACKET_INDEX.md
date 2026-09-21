# 03 — EJWRH Intake, Admission & Transition Operations Packet — INDEX

- **Residence applicability:** EJWRH (residence_id 2) only · **Evidence date:** 2026-09-20
- **Sources:** CQCX live; PSA v4.1; `docs/residences/ejwrh/*`; residence-intake handler
- **State:** PREPARED index (points at existing docs; flags missing) · **Owner:** ED + Operator (EJWRH LLC) · **Approval required:** yes · **Effective:** not effective · **Supersession:** none

> EJWRH is operated by **EJWRH, L.L.C.** GFA is the contracted provider. Do not apply Grace House forms to EJWRH.
>
> **Admission authority (stated precisely):** Under PSA v4.1, final housing admission authority is assigned to the EJWRH Operator. Operational reliance on this allocation remains contingent upon verification of the executed PSA version and identification of the currently authorized Operator incumbent. Keep separate: (a) **governing role** (Operator, per PSA), (b) **executed agreement** (PSA execution status UNKNOWN — verify), (c) **named incumbent** (Curtis White cited; confirm current), (d) **delegated authority** (any House-Manager/staff delegation), and (e) **RecoveryOS system permission** (a separate `role_assignments` grant; never equals housing authority).

> **EJWRH content-location reconciliation (item 4 — do not mark content MISSING merely because there is no separate edition).** The EJWRH Resident Handbook (`ejwrh_resident_handbook` v1.0, published; 0 assignments; source header: "Absorbs … curfew & pass procedure, emergency response overview, exit/transition overview, good-neighbor commitments, day-to-day conduct — ONE acknowledgment instead of six"):
> - **Curfew & passes — A:** in the active handbook §1 (phase curfews) and §3 (curfew/passes/overnights); also the Participant & Residency Agreement phase table.
> - **Emergency response — A:** handbook §6 (911/988/Warm Line/Naloxone/evacuation). *(The emergency-**contact intake form** is a separate operational form — prepared draft only, §11 — not a published edition.)*
> - **Exit / transition — A + B:** handbook §9 ("Moving out"); Participant & Residency Agreement transition/exit-for-cause clause.
> - **Good-neighbor — A:** handbook §4 ("Neighbors").
> - **Day-to-day conduct — A:** handbook §4 (house life/guests/quiet hours/chores).
> - **Employment / job-search — A (content) + C (no standalone edition):** handbook §1 (Phase-2 work/school/training expectation) and §2; no separate resident-facing edition exists.
> None of the above is category D (genuinely missing). What is absent is only a *standalone edition* (by design), not the content. Confirm staff training on the single handbook acknowledgment.

| # | Section | Source / status |
|---|---|---|
| 1 | Start Here (this index) | PREPARED |
| 2 | Application | SPA `/residence/directory/?apply=ejwrh` → residence-intake (residence_id 2). Writer path **exercised by 1 test_fixture row** (source `ejwrh-portal`, closed) — writer proven; **no real applicant proven**. Proposed clean route `/apply/ejwrh`. |
| 3 | Eligibility | See 07_ELIGIBILITY (EJWRH page). Men; recovery-focused; MAT/MOUD affirmed; reentry-aware program design (PSA 2.1.A/2.2.B). **DOC referral/placement status — current verification required** (no authoritative source establishes an approving authority, effective date, or active status). Some criteria **UNKNOWN — evidence required**. |
| 4 | Required documentation | EJWRH Participant & Residency Agreement (sig); + acks: Handbook, Rights & Grievance, Screening, Medication/MOUD, Return-to-Use — **all published v1.0; 0 assignments** |
| 5 | Inquiry-to-move-in checklist | See 05_EJWRH_INTAKE_TO_MOVE_IN_CHECKLIST |
| 6 | Intake ownership | **UNKNOWN — AUTHORIZATION REQUIRED** (PSA 2.2.D: GFA provides intake-screening support; Operator decides). Propose named owner + backup. |
| 7 | Approval authority | Under PSA v4.1, final housing admission authority is assigned to the **EJWRH Operator**; GFA supports (screening/readiness) only. Operational reliance remains **contingent upon verification of the executed PSA version and identification of the currently authorized Operator incumbent.** |
| 8 | Handbook | `ejwrh_resident_handbook` v1.0 (ack) — published |
| 9 | Agreement | `ejwrh_participant_agreement` v1.0 (sig) — published. The current agreement characterizes the arrangement as program participation. The legal characterization of occupancy and any application of Iowa Code chapter 562A remain subject to counsel review. |
| 10 | Rights & grievance | `ejwrh_resident_rights_grievance` v1.0 (ack) — published |
| 11 | Fees & payment | PSA Art. 4: shared $175/wk·$650/mo; private $200/wk·$750/mo; **move-in $250**; live-out $25/wk; late $5/day (max $50), none first 30 days. **No published EJWRH fee edition** — fees live in PSA + DB. Operator owns fees. |
| 12 | Medication / MOUD | `ejwrh_medication_moud_policy` v1.0 (ack) — published; MAT/MOUD affirmed; storage per policy |
| 13 | Employment / job-search | **A (content) + C (no standalone edition):** expectation exists in the active handbook §1 (Phase-2 work/school/training) and §2; no separate resident-facing edition. Not missing. Confirm training. |
| 14 | Curfew | **A:** content exists in the active handbook §1 (phase curfews) and §3 (curfew/passes/overnights), plus the Participant & Residency Agreement phase table. Not missing; no standalone edition by design (do not borrow Grace House's). |
| 15 | Meetings & programming | Program model `docs/architecture/ejwrh-program-model-v1.0.md`; confirm resident-facing schedule |
| 16 | Screening / testing | `ejwrh_screening_policy` v1.0 (ack) — published |
| 17 | Emergency contact | **Emergency-response content — A:** active handbook §6. **Emergency-contact intake form — prepared draft (§11), not a published edition** (this operational form is genuinely not yet published; distinct from the handbook's emergency-response content). |
| 18 | Bed confirmation & hold | See 08_BED_INVENTORY — **RecoveryOS bed inventory = 0 rows (a data gap, not proof of physical bed count)**; confirm a real physical bed via authorized operator/manager, then reconcile. Hold policy drafted (not effective). |
| 19 | Accommodations | Fair-Housing/ADA process — **UNKNOWN — evidence required**; interim process in 07 |
| 20 | Referral communication | Housing-bearing referral agreements executed by **Operator** (PSA 2.2.D); GFA develops network. Communication authority depends on the communication type: administrative receipt, acknowledgment, scheduling and logistics must be distinguished from participant-specific disclosure. Consent, ROI and counsel requirements remain governed by the communication matrix in file 11. |
| 21 | ROI status | **MISSING** — no ROI form; **counsel gate** (PSA Art. 11: 42 CFR Part 2/HIPAA where applicable) |
| 22 | Admission-day checklist | In 05; not effective |
| 23 | Orientation | Draft in 05/13; confirm owner |
| 24 | Transition / exit | **A + B:** content exists in the active handbook §9 ("Moving out") and in the Participant & Residency Agreement transition/exit-for-cause clause. Not missing; no standalone edition. Use 13_TRANSITION_READINESS as the move-in operational template. |
| 25 | Incident escalation | Org `incident_report_system` v1.0 (published); confirm EJWRH routing to Operator |
| 26 | Staff training | See 14_TRAINING — **UNKNOWN/UNVERIFIED** |
| 27 | Revision history | This index rev 0 (2026-09-20, prepared) |

**EJWRH packet blockers:** RecoveryOS bed inventory (a data gap — see §18, not proof of physical state); PSA execution verification + Operator incumbent; capacity in DB; intake-owner + backup appointment; ROI/counsel; emergency-contact intake form (prepared draft). **Not blockers (reconciled):** curfew, emergency-response, exit/transition, good-neighbor, conduct and employment content — these exist in the active handbook (item 4 above); only standalone editions are absent, by design. Also open: DOC referral/placement verification; directory publication; Latisha/Yvette authority.
