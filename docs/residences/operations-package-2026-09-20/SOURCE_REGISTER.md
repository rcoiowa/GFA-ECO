# SOURCE_REGISTER — controlling source / live-evidence class per material claim

**Evidence classes (GFA Institutional Evidence Ledger):** A Primary/Legal Authority · B Verified Operational Evidence (live CQCX read) · C Leadership-Confirmed · D Reported/Historical · E Inferred · F Unknown.

**Live-read note:** Class-B items were read from CQCX `cqcxvwoukyhxyokfwnjm` (`recoveryos` schema) during authorized session turns on 2026-09-20. Re-verification requires an authenticated Supabase connection (the MCP Supabase server is **not authenticated in this session**, so no new live read was performed for this pass). No personal information, credentials, or completed resident forms are reproduced here.

| # | Material claim | Controlling source / path | Evidence class |
|---|---|---|---|
| 1 | Canonical backend = CQCX `cqcxvwoukyhxyokfwnjm`, `recoveryos` schema; retired YKY frozen | `CLAUDE.md`; project config | A (governance) + B |
| 2 | Grace House = residence_id 1 (women); EJWRH = residence_id 2 (men) | CQCX `residences` (live) | B |
| 3 | EJWRH operated by EJWRH, L.L.C.; GFA = contracted provider; **admission authority assigned to Operator** | `docs/agreements/ejwrh-psa-v4.1.md` Art. 1, 3, 5, 6 | A |
| 4 | **PSA v4.1 execution status** (signed?) and current Operator incumbent | `docs/agreements/ejwrh-psa-v4.1.md` header ("NOT executed … until signed"); no signature evidence in repo | **F** (verify) |
| 5 | Grace House GFA-operated; admission authority = GFA (admit/waitlist/refer) | `docs/decisions/adr-0013-grace-house-policy-authority.md` | A |
| 6 | EJWRH capacity = 10 beds | `docs/agreements/ejwrh-psa-v4.1.md` Art. 3 | A |
| 7 | RecoveryOS `capacity`: EJWRH null; Grace House 12 (configured values, not physical counts) | CQCX `residences.capacity` (live) | B |
| 8 | Bed inventory = 0 rows for both (data gap, not physical proof) | CQCX `residence_units/rooms/beds/bed_assignments` (live) | B |
| 9 | EJWRH 6 editions, published v1.0, 0 assignments | CQCX `document_templates/versions/assignments` (live); sources `docs/residences/ejwrh/*.md` | B + A(source) |
| 10 | **EJWRH handbook absorbs curfew/emergency/exit/good-neighbor/conduct/employment content** (one acknowledgment) | `docs/residences/ejwrh/resident-handbook.md` header + §1, §2, §3, §4, §6, §9 | A (source doc) |
| 11 | EJWRH Participant & Residency Agreement (phase table; transition/exit-for-cause) | `docs/residences/ejwrh/participant-residency-agreement.md` | A |
| 12 | Grace House 14 residence editions + 6 org-level, mostly assigned | CQCX (live); `docs/source-documents/grace-house/`; `docs/content-intake/grace-house/INDEX.md`; ADR-0013 | B + A |
| 13 | EJWRH fees (private $750/mo; move-in $250; etc.) | `docs/agreements/ejwrh-psa-v4.1.md` Art. 4 + CQCX fee data (live) | A + B |
| 14 | Grace House fees (private $700/mo); **move-in fee** | CQCX fee data (live); move-in fee not present | B / **F** (move-in) |
| 15 | `residence-intake` is the sole public writer; `residence_id` resolved + active-checked server-side; origin allowlist incl. `.org`/`.app`; Turnstile hostname/action | `supabase/functions/residence-intake/handler.ts` | B (code, verified) |
| 16 | Org Application & Pre-Screening Form v2.0 (`form_application_prescreening`, residence_id null) | CQCX `document_templates` (live) | B |
| 17 | Grace House Intake Forms Package v1.0 (`intake_forms_package`, residence_id 1, published, 0 assignments) | CQCX (live) | B |
| 18 | **No EJWRH-specific printable/approved intake edition exists** | CQCX (live — no such EJWRH edition) | B (absence) |
| 19 | All `residence_application_intake` rows are `test_fixture` (EJWRH 1 `ejwrh-portal`; Grace House 2 `gracehouse4`); writer proven, no real applicant proven | CQCX `residence_application_intake` (live, reconciled 2026-09-20) | B |
| 20 | Grace House ROI = draft `form_release_of_information.md` v2026.07 (unratified, not in CQCX, self-flags counsel); EJWRH ROI missing/held | `docs/residence-documents/form_release_of_information.md`; CQCX (live — not an edition) | D (draft) / **F** (EJWRH) |
| 21 | Latisha & Yvette have individual `@graceforaddictions.org` accounts; no new/`recoveryresidence.org` accounts; `rcoiowa.org` = proposed/future | Leadership decision (September 2026) | C |
| 22 | Latisha/Yvette organizational title, residence authority, admission/testing/disclosure/financial authority, system access | not established by any source in evidence; requires appointment (Operator and/or GFA) + `role_assignments` | **F** |
| 23 | EJWRH = reentry-aware program design; GFA develops court/probation/reentry referral relationships | `docs/agreements/ejwrh-psa-v4.1.md` Art. 2.1.A/2.2.B | A |
| 24 | **DOC referral/placement approval** (approving authority, residence, effective status, date, active?) | not established by any authoritative source in evidence | **F** (verify) |
| 25 | MAT/MOUD affirmed, never a barrier; return-to-use = medical/recovery event; software never admits/discharges | PSA Art. 6.4; ADR-0013; CQCX `accepts_mat=true` (live); CLAUDE.md | A + B |
| 26 | Directory unpublished (`is_public_directory=false`) both residences | CQCX `residences` (live) | B |
| 27 | Cloudflare DNS/route/cert bindings for `recoveryresidence.org/.app` | MCP lacks zones/DNS/routes — **REQUIRES ACCESS** | **F** (no access) |
| 28 | ICARE/Grace/BARC-10 governance (human-governed; no passive surveillance; BARC canonical 10–60) | `CLAUDE.md`; `docs/product/recoveryos-icare-integration-authority-v1.0.md` | A (governance) |
| 29 | Occupancy legal characterization / Iowa Code ch. 562A | `docs/agreements/ejwrh-psa-v4.1.md` Art. 11 leaves it to counsel | **F / counsel** |
| 30 | Operator/provider data model: only GFA org (id 1) exists; `organization_relationships` empty; EJWRH residence under org 1 | CQCX `organizations`/`organization_relationships` (live) | B (do not infer ownership from org_id) |
| 31 | Staff training completion (any role) | no record distinct from document assignment | **F** |
