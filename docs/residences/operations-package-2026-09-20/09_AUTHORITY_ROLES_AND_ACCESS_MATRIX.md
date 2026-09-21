# 09 — Authority, Roles & Access Matrix

- **Residence applicability:** both (mapped separately) · **Evidence date:** 2026-09-20 · **State:** PREPARED (not effective) · **Owner:** ED (+ Operator for EJWRH) · **Approval required:** yes · **Supersession:** none
- Every authority not supported by the PSA, ratified policy, or a formal appointment is marked **UNKNOWN — AUTHORIZATION REQUIRED.** No roles are granted by this document.

## Five distinct layers (do not conflate)
1. **Organizational position** (e.g., GFA Founder & Executive Director; EJWRH Operator/Sole Member; House Manager)
2. **Employment/volunteer/contractor status** (employed by GFA vs by the Operator vs volunteer/contractor)
3. **Residence authority** (what the person may decide for a residence — from PSA/policy/appointment)
4. **System role** (`role_assignments.role_key`: administrator, residence_manager, residence_staff, coach, navigator, intake_coordinator, intake_worker, …)
5. **Individual capability** (what RLS + role actually permit in RecoveryOS)
6. **Named incumbent** (the specific person) — kept separate from the role.

## Known anchors (evidenced)
- **GFA Founder & Executive Director = Thomas DeGarmeaux** (title ratified 2026-09-21) — GFA's authorized representative (PSA Art. 14); GFA-side authority.
- **EJWRH Operator (governing role) = the EJWRH Operator under PSA v4.1** — assigned EJWRH admission/discharge/fee authority (PSA Art. 1.2, 4, 6). **Cited incumbent: Curtis White (Sole Member).** Operational reliance is **contingent upon verifying the executed PSA version and confirming the currently authorized Operator incumbent.** Keep separate: governing role · executed agreement · named incumbent · delegated authority · RecoveryOS system permission.
- **Grace House operator = GFA** — GFA holds Grace House admission authority (ADR-0013).
- **EJWRH House Manager** — Operator-employed; GFA ED works directly with the House Manager (PSA "Role continuity"). Named incumbent **UNKNOWN — evidence required**.

## Function → authority map

Legend: **EJWRH auth** / **GH auth**. "Op" = EJWRH Operator (EJWRH LLC); "GFA" = Grace For Addictions.

| Function | EJWRH authority | Grace House authority | Notes |
|---|---|---|---|
| Inquiry receipt | Intake staff | GFA intake | incumbent UNKNOWN — AUTH REQ |
| Application assistance | Intake staff / GFA (2.2.D) | GFA intake | — |
| Intake review | GFA (screening support) | GFA | PSA 2.2.D support role for EJWRH |
| Screening | GFA screening support | GFA | per Screening Policy |
| Testing | Operator staff / per policy | GFA | EJWRH testing by house per policy |
| Eligibility recommendation | GFA recommends | GFA | — |
| **Final approval / denial** | **Operator (EJWRH LLC)** — reliance contingent on PSA execution + incumbent | **GFA** | PSA Art. 6.1 / ADR-0013 |
| Admission override | Operator | GFA | never software |
| Agreement execution | Resident + Operator | Resident + GFA | — |
| Fee arrangement | **Operator only** (PSA 4) | GFA | GFA has no EJWRH fee authority |
| Bed assignment | House Manager (Operator) | House Manager (GFA) | needs bed inventory |
| Orientation | House Manager | House Manager | — |
| Referral communication | Operator (housing-bearing); GFA network + own-service (2.2.D) | GFA | authority depends on communication type — admin receipt/ack/scheduling/logistics vs. participant-specific disclosure; consent/ROI/counsel per **file 11** matrix |
| Record access | role- + residence-scoped (RLS) | same | minimum necessary |
| Medication documentation | house staff per Med/MOUD policy | GFA staff | — |
| Incident handling | house staff → Operator | GFA staff | org Incident Report System |
| Grievance review | per Rights & Grievance; Operator | per Rights & Grievance; GFA | external advocacy contacts (GH) |
| Exit approval | Operator | GFA | never auto |
| Data administration | Data Administrator (GFA) | Data Administrator (GFA) | incumbent UNKNOWN — AUTH REQ |
| Technical administration | GFA technical admin | GFA technical admin | system_administrator role |

## Latisha Williams & Yvette — proposed functions
**Their specific proposed functions and any delegated authority come from Latisha's email + a formal appointment, neither of which is in evidence here.** Therefore:
- **Latisha Williams — role: UNKNOWN — AUTHORIZATION REQUIRED.** Any intake-coordinator / residence-manager / approval / referral / email-account authority must be established by (a) EJWRH Operator appointment (if EJWRH-side, per PSA — GFA cannot grant EJWRH housing authority) or GFA appointment (if GFA-side), and (b) a corresponding `role_assignments` grant. Not granted here.
- **Yvette — role: UNKNOWN — AUTHORIZATION REQUIRED.** Same treatment.
- **Constraint:** GFA (including the ED) **cannot** confer EJWRH *housing/admission/fee* authority on anyone — that is the Operator's (PSA Art. 1.1, 6). GFA can appoint GFA-side program/intake/support roles. Which residence, which layer, and which system role each person holds must be specified before any grant.
- Provide, for each: organizational position, employment status (GFA vs Operator vs volunteer/contractor), residence authority basis (appointment/PSA/policy), system role to grant, named incumbent. Until then: **no grant.**

**Blockers:** Latisha's email (proposed functions); formal appointments (Operator and/or GFA); confirm House Manager, Data Administrator, technical admin incumbents; then map to exact `role_key` grants (a separate authorized action, not this phase).
