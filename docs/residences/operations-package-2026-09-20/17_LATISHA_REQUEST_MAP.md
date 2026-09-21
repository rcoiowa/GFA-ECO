# 17 — Latisha Williams Request Map (item-by-item, per residence)

- **Residence applicability:** both (mapped separately) · **Evidence date:** 2026-09-20 · **State:** PREPARED · **Owner:** ED · **Approval required:** yes · **Supersession:** none
- **Nature:** a **stakeholder request to be mapped** — not governing authority, and **not proof Latisha or Yvette hold any described authority.** De-identified; no case-specific names/details.
- Classifications (only these): **AVAILABLE AND CURRENT · AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED · INCOMPLETE · MISSING · BLOCKED — THOMAS DECISION · BLOCKED — OPERATOR APPROVAL · BLOCKED — COUNSEL · BLOCKED — TECHNICAL IMPLEMENTATION · NOT APPLICABLE.**
- Target dates are **dependency-based** (no fabricated calendar dates): *pre-pilot*, *pre-accept*, *pre-admit*, *7-day (Thomas)*.

Per item: **EJWRH** / **Grace House** each with status · controlling source · live evidence · flags (Thomas/Operator/Counsel/Tech) · responsible · target · safe-to-distribute.

**1. Current intake/application form** *(identified separately by residence — the Application & Pre-Screening Form is an **org-level (residence_id null)** shared form, not a Grace House form; do not imply Grace House's package is usable for EJWRH)*
- **Grace House application materials:** **AVAILABLE AND CURRENT.** Digital route `/recovery-residences/grace-house/apply` → `residence-intake` (residence_id 1, server-resolved). Forms: org **Application & Pre-Screening Form v2.0** (`form_application_prescreening`, published) **+ Grace House Intake Forms Package v1.0** (`intake_forms_package`, residence_id 1, published; 0 assignments). Printable/manual: the GH Intake Forms Package edition exists. Approval: writer proven (fixture); no real applicant proven. Distribute: **yes**.
- **EJWRH digital application route:** **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED.** SPA `/residence/directory/?apply=ejwrh` → `residence-intake` (residence_id 2, server-resolved), using the **org** Application & Pre-Screening Form v2.0 (shared; residence_id resolved server-side). Approval: writer proven (fixture); no real applicant proven.
- **EJWRH printable/paper application:** **MISSING** — no EJWRH-specific printable/approved intake edition exists (an EJWRH Intake Forms Package is prepared-not-available). Manual fallback is by telephone: **515-220-8771 (GFA office / housing-intake; RATIFIED PHONE-001)** — not the Warmline (§10).

**2. Complete intake & approval process**
- EJWRH: **INCOMPLETE** — process drafted (05); depends on intake-owner appointment + **Operator** admission authority. Source: PSA Art. 6. Flags: Thomas + Operator. Resp: ED/Operator. Target: pre-accept. Distribute: draft only.
- Grace House: **INCOMPLETE** — drafted (06); intake-owner unresolved. Source: ADR-0013. Flags: Thomas. Distribute: draft only.

**3. Eligibility requirements**
- EJWRH: **INCOMPLETE** — men / MOUD-affirmed / reentry-aware known (07); **DOC referral/placement status — current verification required** (not established as an approval); several criteria UNKNOWN. Flags: Thomas + Operator (+ Counsel for exclusions). Target: pre-accept.
- Grace House: **INCOMPLETE** — two pathways known (ADR-0013); some criteria UNKNOWN. Flags: Thomas (+ Counsel).

**4. Required identification & documentation**
- EJWRH: **INCOMPLETE** — document set known (02); ID requirements not enumerated. Resp: Operator/ED. Target: pre-accept.
- Grace House: **INCOMPLETE** — same.

**5. Current Resident/House Handbook**
- EJWRH: **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED** — `ejwrh_resident_handbook` v1.0 (published, 0 assignments). Distribute: yes, controlled (staff/resident).
- Grace House: **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED** — `resident_handbook` v2.0 (published, assigned).

**6. House rules & expectations**
- EJWRH: **AVAILABLE (in handbook) — A** — house rules, curfew/passes and good-neighbor commitments exist in the active handbook §1/§3/§4 (single acknowledgment by design). No standalone editions (do not borrow Grace House's). Distribute: yes, controlled (handbook). Confirm training.
- Grace House: **AVAILABLE AND CURRENT** — Code of Conduct, Good Neighbor, Curfew/Pass (published).

**7. Program fees, rent, deposits, payment**
- EJWRH: **AVAILABLE AND CURRENT** — PSA Art. 4 + DB (shared $175/wk·$650/mo; private $200/wk·$750/mo; move-in $250; live-out $25/wk; late $5/day max $50). "Rent/deposit" language avoided — **program-participation-fee** model. Distribute: yes.
- Grace House: **INCOMPLETE** — fee_schedule v2.0 published + DB fees, but **move-in fee UNKNOWN**. Flags: Thomas (confirm move-in fee). Distribute: yes (with move-in TBD).

**8. Medication policies**
- EJWRH: **AVAILABLE AND CURRENT** — `ejwrh_medication_moud_policy` v1.0 (published). Distribute: yes.
- Grace House: **AVAILABLE AND CURRENT** — `medication_mat_moud_policy` v2.0. Distribute: yes.

**9. Employment / job-search expectations**
- EJWRH: **AVAILABLE (in handbook) — A + C** — the Phase-2 work/school/training expectation is in the active handbook §1–§2; no standalone edition (C). Not missing. Flags: Operator/ED (confirm any added expectation). Target: pre-accept.
- Grace House: **INCOMPLETE** — employment curfew-exception exists; standalone expectation doc not confirmed. Flags: Thomas.

**10. Curfew, meeting, recovery & programming requirements**
- EJWRH: **AVAILABLE (in handbook) — A** — curfew is in the active handbook §1 (phase curfews) and §3, plus the Participant Agreement phase table; recovery/meeting requirements in handbook §2; programming detail in `ejwrh-program-model-v1.0`. Curfew is **not** missing. Flags: Operator (confirm resident-facing schedule). Target: pre-accept.
- Grace House: **AVAILABLE AND CURRENT** — Curfew/Pass v2.0 + phase model + Operational System. Distribute: yes.

**11. Drug/alcohol testing procedures & expectations**
- EJWRH: **AVAILABLE AND CURRENT** — `ejwrh_screening_policy` v1.0 (published). Distribute: yes.
- Grace House: **AVAILABLE AND CURRENT** — `screening_policy_consent` v2.0. Distribute: yes.

**12. Process for confirming or holding an available bed**
- EJWRH: **INCOMPLETE** + **BLOCKED — OPERATOR APPROVAL** — bed-hold policy drafted (08); RecoveryOS has no inventory records (digital gap, not proof of physical state); **authorized operator/manager confirms a real bed**, then reconcile. Resp: Operator/House Manager. Target: pre-admit.
- Grace House: **INCOMPLETE** — hold policy drafted; capacity 12 set; no inventory records; GFA manager confirms physical bed. Resp: GFA House Manager. Target: pre-admit.

**13. Emergency-contact & release-of-information forms**
- EJWRH: emergency-contact **INCOMPLETE** (draft); ROI **MISSING/HELD** + **BLOCKED — COUNSEL**. Resp: ED + counsel. Target: pre-admit (ROI before any disclosure).
- Grace House: emergency-contact **INCOMPLETE** (draft); ROI **INCOMPLETE** (draft v2026.07, unratified, not in CQCX) + **BLOCKED — COUNSEL**.

**14. Communicating with treatment/case managers/probation/parole/referral sources**
- EJWRH: **INCOMPLETE** + **BLOCKED — COUNSEL** — taxonomy prepared (11): admin coordination permitted [P]/[C]; participant-specific disclosure [R]/[L]. Housing-bearing referral agreements = **Operator** (PSA 2.2.D). Resp: ED/Operator + counsel.
- Grace House: **INCOMPLETE** + **BLOCKED — COUNSEL** — same taxonomy; GFA is operator.

**15. Who makes the final approve/deny decision**
- EJWRH: **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED** — the intake/admission **authority framework exists** (Operator = EJWRH, L.L.C.; PSA Art. 6.1; GFA supports only), **but the executed PSA status and the named authority incumbent remain unverified.** Do not distribute as a settled authority statement until PSA execution and incumbent are confirmed. Flags: Operator. Distribute: controlled (as framework, with the unverified caveat).
- Grace House: **AVAILABLE AND CURRENT** — **Grace For Addictions** (ADR-0013: admit/waitlist/refer). Distribute: yes.

**16. Official organizational email accounts (Latisha & Yvette)**
- Both: **AVAILABLE AND CURRENT** — individual `@graceforaddictions.org` accounts exist (account-creation **ED-confirmed 2026-09-21**; **exact addresses not documented here — do not guess; use only if documented or ED-provided**). **Outstanding (do not infer from the account):** title, position, EJWRH-operator authority, admission/testing/agreement-signing/financial authority, system access, disclosure authority, signature, MFA, retention, offboarding → **INCOMPLETE (governance).** `rcoiowa.org` = **PROPOSED — FUTURE — NOT AUTHORIZED (NOT APPLICABLE now).** Resp: ED + Workspace admin. Target: 7-day (Thomas) for governance.

**17. Introduction from Thomas to referral contacts (authorized roles)**
- EJWRH: **BLOCKED — THOMAS DECISION** (+ **BLOCKED — OPERATOR APPROVAL** for EJWRH representation) — template prepared (10 #3), but the intro asserts roles that must first be established (§09); GFA cannot confer EJWRH housing representation. Resp: Thomas/Operator. Target: after roles set.
- Grace House: **BLOCKED — THOMAS DECISION** — template prepared; issue after GFA role appointment.

**18. Consistent inquiry-to-move-in checklist**
- EJWRH: **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED** — 05 (draft, not effective). Distribute: yes (as draft for review/orientation).
- Grace House: **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED** — 06 (draft). Distribute: yes (draft).

## Roll-up (request-item numbers 1–18)
- **Available now to hand over:** handbook (5), medication (8), testing (11), the inquiry-to-move-in checklists as drafts (18); EJWRH fees (7) and final-authority statements (15, contingent on PSA execution); Grace House house-rules/curfew/programming (6/10); **and — reconciled — EJWRH house-rules, curfew, good-neighbor, employment-expectation, exit/transition content, all present in the active EJWRH handbook** (§1–§4, §6, §9), single acknowledgment by design.
- **Application (1) — hand over per residence, do not conflate:** Grace House = org Pre-Screening Form v2.0 **+ GH Intake Forms Package v1.0** (digital route + printable edition). EJWRH = digital route only (org Pre-Screening Form via `residence-intake`, residence_id 2 server-resolved); **no EJWRH printable/approved intake edition — prepared-not-available; phone fallback 515-220-8771 (GFA office / housing-intake; RATIFIED PHONE-001).**
- **Biggest gaps:** bed confirmation (12; RecoveryOS data gap, not physical proof), ROI + participant-specific external disclosure (13/14, counsel — administrative coordination is not ROI-gated), role authority + intro (16 governance/17), process completion (2–4), EJWRH emergency-contact **intake form** (13; draft), EJWRH printable intake edition (1), DOC referral/placement verification (3). **Not gaps (reconciled):** EJWRH curfew/employment/exit/good-neighbor content (in handbook).
