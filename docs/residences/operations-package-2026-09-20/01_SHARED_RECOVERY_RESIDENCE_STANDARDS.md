# 01 — Shared Recovery Residence Standards

- **Residence applicability:** both (shared infrastructure/standards; each residence keeps its own application, documents, fees, authority) · **Evidence date:** 2026-09-20
- **Sources:** CQCX live; PSA v4.1; ADR-0013; CLAUDE.md ICARE/BARC governance; residence-intake handler
- **State:** PREPARED · **Owner:** Thomas DeGarmeaux, Founder & Executive Director (GFA) · **Approval required:** yes · **Effective:** not effective · **Supersession:** none

Shared standards are allowed; **each residence retains a separate application, profile, document package, staff scope, decision authority, fee schedule, operational status, and public application route.** Nothing here merges the two programs.

> **Live-evidence caveat:** any claim marked **VERIFIED LIVE (2026-09-20)** reflects a CQCX read on 2026-09-20 and **must be freshly re-verified before any dependent operational or production action.**

## Shared infrastructure (verified)
- **One canonical backend:** CQCX `cqcxvwoukyhxyokfwnjm`, `recoveryos` schema. Retired YKY `ykykeioydvtxpyreshhs` is frozen — never queried/accessed.
- **One canonical public intake writer:** `residence-intake` Edge Function. `residence_id` is resolved and active-checked **server-side**; the client never asserts a trusted id. Do not create another writer or another residence record.
- **Front-door guards (all residences):** origin allowlist (includes `recoveryresidence.org/.app`), Turnstile hostname+action, missing-Origin rejection, duplicate protection, consent allowlisting, no anonymous reads, fixture/production isolation, generic error envelopes.
- **Authorization estate:** 84/84 tables RLS-enabled; classification boundary (0147) live; intake roles (0149) live; fixtures de-privileged.

## Shared organization-level documents (VERIFIED LIVE (2026-09-20) — org_id 1, residence_id null, all published)
| Key | Name | Version | State |
|---|---|---|---|
| code_of_ethics | Code of Ethics — Staff/House Leads/Peer Mentors/Volunteers | 2.0 | active/published |
| complete_operational_system | Complete Operational System (Staff Manual) | 2.0 | active/published |
| form_application_prescreening | Application & Pre-Screening Form | 2.0 | active/published |
| incident_report_system | Incident Report System | 1.0 | active/published |
| narr_ii_self_assessment | NARR Level II Self-Assessment & Iowa HHS Alignment | 2.0 | active/published |
| change_course_leaders_policy | Change Course Leaders Policy (Partner Program) | 2.2 | active/published |

*Note:* these are org-level (not residence-scoped). Confirm which apply to **each** residence vs. GFA-internal only (e.g., NARR self-assessment is per-residence; Code of Ethics is org-wide). Do not assume a shared doc governs a residence without confirmation.

## Shared recovery/clinical standards (governing, do not weaken)
- **MAT/MOUD fully supported**, never a barrier to admission or a compliance exception (ADR-0013; PSA Art. 6.4; DB `accepts_mat=true` both residences).
- **Return to use = a medical/recovery event**, never automatic discharge; care-first sequence → documented human decision (PSA Art. 6.4; ADR-0013).
- **Software never admits or discharges** anyone; approval and admission are separate deliberate human acts (PSA Art. 6.3, 7).
- **Program-participation-fee model** in the current agreements and program design (ADR-0013; PSA). **The legal characterization of occupancy and any application of Iowa Code chapter 562A remain subject to counsel review** (PSA Art. 11). Document terminology ("program participation") is not presented here as a settled legal conclusion; the system avoids landlord-tenant *framing* as a design choice, pending counsel's characterization.
- **Minimum sufficient documentation**; consent/disclosure governed by their own recorded authorizations, separate from documents; role/permission-scoped access; sensitive info minimized (PSA Art. 7, 11).
- **ICARE/BARC governance** (CLAUDE.md): ICARE is a human workflow, participant-centered; Grace never infers risk/stage; no passive surveillance; BARC-10 canonical 10–60, no automated thresholds. Applies to any Brain/Grace context these residences surface.

## Shared taxonomy (RecoveryOS)
- Lead/inquiry lifecycle (0149): `new → assigned → contacted → waiting → scheduled → closed | converted`; triage classification on close.
- Residency lifecycle: `residencies.residency_status` + `phase` (Grace House uses 1/2/3 phase model per ADR-0013 driving curfew/screening cadence; confirm EJWRH's phase model — PSA references a three-phase structure).
- Application intake: `residence_application_intake` (public) → review → `residence_applications` / conversion.

## What is shared vs. what must stay separate
| Shared | Separate per residence |
|---|---|
| Backend, intake writer, front-door guards, RLS, taxonomy, org-level ethics/incident/NARR templates, recovery/clinical standards | Application route, public profile, document package, fee schedule, operator + admission authority, staff scope, bed inventory, public/operational status, ROI |
