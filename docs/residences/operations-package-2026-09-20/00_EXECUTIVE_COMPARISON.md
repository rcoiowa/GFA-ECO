# 00 — Two-Residence Executive Comparison

- **Residence applicability:** EJWRH (residence_id 2) and Grace House (residence_id 1)
- **Evidence date:** 2026-09-20
- **Evidence sources:** CQCX `cqcxvwoukyhxyokfwnjm` live reads (residences, document_templates/versions, organizations, bed tables); EJWRH PSA v4.1 (`docs/agreements/ejwrh-psa-v4.1.md`); ADR-0013 (`docs/decisions/adr-0013-grace-house-policy-authority.md`); repo residence-document inventory
- **Document state:** PREPARED (for review) · **Owner:** Thomas DeGarmeaux, Founder & Executive Director (GFA) · **Approval required:** yes · **Effective:** not effective · **Supersession:** none (new)
- **Privacy:** synthetic/aggregate only; no applicant/resident narratives; no October-transition identity.

> Governance guardrail: an *active/published* database row is **not** proof that staff are trained or that the policy is operationally followed. Verdicts below weigh operational readiness, not row existence.

> **Live-evidence caveat:** every claim marked **VERIFIED LIVE (2026-09-20)** reflects a CQCX read on 2026-09-20 and **must be freshly re-verified before any dependent operational or production action** (admission, bed assignment, publication, deployment). As-of-date evidence, not a standing guarantee.

> **Intake evidence (reconciled 2026-09-20, aggregate only):** all **3** `residence_application_intake` rows across both residences are **test_fixture** (EJWRH: 1, source `ejwrh-portal`, closed; Grace House: 2, source `gracehouse4`, closed + converted). The canonical writer's **technical operation is PROVEN**; a **real production applicant submission is NOT proven** for either residence. **0 active residencies.**

| Dimension | **EJWRH** | **Grace House** |
|---|---|---|
| Canonical identity | Ernest & Johnnie White Recovery House — **residence_id 2** (VERIFIED LIVE (2026-09-20)) | Grace House — **residence_id 1** (VERIFIED LIVE (2026-09-20)) |
| Operator | **EJWRH, L.L.C.** (Sole Member Curtis White) (PSA v4.1) | **Grace For Addictions** (GFA operates it) (ADR-0013; org_id 1) |
| GFA relationship | Contracted **recovery program & technical services provider** — *not* operator, *not* residence (PSA Art. 1, 3, 5) | GFA is the **operator** (and provider) |
| Population served | Men (VERIFIED SOURCE) | Women (VERIFIED SOURCE) |
| Capacity | PSA Art. 3 = **10 beds** ("all ten resident beds"); **RecoveryOS `capacity` = null** (CONFLICT — DB unset, ≠ physical capacity zero) | **RecoveryOS `capacity` = 12** (a configured value; physical capacity to confirm) |
| Bed inventory (units/rooms/beds) — **RecoveryOS records only** | **0 rows in RecoveryOS** (VERIFIED LIVE (2026-09-20)) — a digital/data gap; **not** proof of physical bed count. Physical beds require operator/manager confirmation, then reconciliation. | **0 rows in RecoveryOS** (VERIFIED LIVE (2026-09-20)) — same; digital gap, not physical count. |
| Public profile page | None (no `/residences/ejwrh`) — directory listing entry only | `/recovery-residences/grace-house` exists (VERIFIED SOURCE) |
| Public-directory published | **No** — `is_public_directory = false` (VERIFIED LIVE (2026-09-20)) | **No** — `is_public_directory = false` (VERIFIED LIVE (2026-09-20)) |
| Accepting-applications state | Writer path exercised by **1 test_fixture row** (source `ejwrh-portal`, closed, 2026-08-23) — writer proven, **no real applicant proven**; directory unpublished → direct-link only | Apply flow exists; intake rows are **test_fixture** (2, source `gracehouse4`); no real applicant proven; directory unpublished |
| Admission-readiness state | NOT READY (no beds; PSA execution to verify; docs published but 0 assignments) | READY WITH CONDITIONS (docs active + assigned; no beds; authority resolved) |
| Application route (current) | SPA `/residence/directory/?apply=ejwrh` → residence-intake (residence_id 2) | `/recovery-residences/grace-house/apply` → residence-intake (residence_id 1) |
| Application route (proposed) | `recoveryresidence.org/apply/ejwrh` (internal redirect; same writer) | `recoveryresidence.org/apply/grace-house` |
| Canonical intake writer | `residence-intake` Edge Function (sole writer) | `residence-intake` (same) |
| Intake owner | **UNKNOWN — AUTHORIZATION REQUIRED** (proposed EJWRH intake staff; PSA 2.2.D gives GFA intake-screening support, Operator holds decisions) | **UNKNOWN — AUTHORIZATION REQUIRED** (GFA intake coordinator) |
| Backup owner | UNKNOWN — AUTHORIZATION REQUIRED | UNKNOWN — AUTHORIZATION REQUIRED |
| Final admission authority | Under PSA v4.1, assigned to the **EJWRH Operator**; GFA supports only. **Operational reliance is contingent on verifying the executed PSA version and the currently authorized Operator incumbent.** Keep separate: governing role · executed agreement · named incumbent · delegated authority · RecoveryOS permission. | **Grace For Addictions** (own operator authority; ADR-0013 admit/waitlist/refer) |
| Current document package | **6** EJWRH editions, all **published v1.0**, **0 assignments** (published, never used) | **14** residence-scoped templates (v1.0/2.0, all published, most assigned) + **6** org-level shared |
| Fees (VERIFIED) | Shared $175/wk · $650/mo; Private $200/wk · **$750/mo**; move-in **$250** nonrefundable; live-out $25/wk; late $5/day (max $50), none first 30 days (PSA Art. 4; DB matches) | Shared $175/wk · $650/mo; Private $200/wk · **$700/mo** (DB); move-in **UNKNOWN — evidence required** |
| Consent | Screening consent published; participant agreement (sig) published | Screening & consent (sig) published + assigned; participant agreement assigned (3) |
| ROI (release of information) | **MISSING / HELD** — no EJWRH ROI; **counsel gate** (PSA Art. 11: 42 CFR Part 2/HIPAA where applicable) | **DRAFT exists** — `form_release_of_information.md` v2026.07 (GFA–Grace House, resident-facing) but **unratified, not in CQCX, self-flags counsel review** → prepared, not active |
| Referral communication authority | Housing-bearing referral agreements = **Operator** executes; GFA develops network + executes only its own service agreements (PSA 2.2.D). Communication authority depends on type — administrative receipt/acknowledgment/scheduling/logistics vs. participant-specific disclosure; consent/ROI/counsel per the file-11 matrix. | GFA (as operator). Communication authority depends on type; consent/ROI/counsel per the file-11 matrix. |
| Staff email | Current channel = individual **`@graceforaddictions.org`** accounts (Latisha/Yvette, leadership-confirmed). No new/`recoveryresidence.org` accounts this phase; `rcoiowa.org` = PROPOSED/FUTURE only. Account ≠ authority (§09/§10). | Same — individual `@graceforaddictions.org` accounts; no new accounts. |
| Unresolved blockers | Bed inventory; PSA execution status; capacity in DB; intake/admission role appointments; ROI/counsel; directory publication; Latisha/Yvette authority | Bed inventory; move-in fee; intake role appointment; ROI/counsel; directory publication; Latisha/Yvette authority |

## Verdicts

**EJWRH — NOT YET VERIFIED READY. Specific items require human + documentary confirmation:**
1. **RecoveryOS bed/occupancy/residency records are incomplete** (0 units/rooms/beds; capacity null) and **cannot establish real-world availability.** This does **not** mean EJWRH is physically empty or has no available bed — physical capacity, occupancy, and availability require confirmation by the authorized residence operator/manager, then controlled reconciliation into RecoveryOS. The digital gap is an operational risk to correct, not proof of physical state.
2. **PSA execution status UNKNOWN** — the operator authority that governs EJWRH admission/fees rests on the PSA; the canonical copy is "final for execution … NOT executed authority until signed." Verify execution before relying on it.
3. **Intake owner / final-admission-authority incumbents not appointed** in a verifiable way (Operator holds admission; who receives/reviews intake is UNKNOWN — AUTHORIZATION REQUIRED).
4. **ROI missing + counsel gate** for any external disclosure (treatment/DOC/probation).
5. Documents published but **0 assignments** — never operationally exercised; staff training unverified.
6. Directory unpublished (acceptable for a controlled direct-link pilot, but not "open").

**Grace House — READY WITH CONDITIONS:**
- Strengths: authority is clear (GFA-operated, ADR-0013); document library is active **and assigned** (operational use evidence); fees mostly verified; capacity set (12).
- Conditions before admitting/opening: **bed inventory** entry; **move-in fee** confirmation; **intake owner** appointment; **ROI/counsel** decision; directory publication decision; Latisha/Yvette authority confirmation; verify staff training (assignments show usage, not training).

_Common to both: bed inventory, ROI/counsel, role appointments (Latisha/Yvette), directory publication, and the operator/provider master-data model (only GFA org exists; `organization_relationships` empty) remain open._
