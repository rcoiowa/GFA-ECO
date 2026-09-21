# 15 — Decision & Activation Register

- **Residence applicability:** both · **Evidence date:** 2026-09-20 · **State:** PREPARED (decision-ready) · **Owner:** Thomas DeGarmeaux, Founder & Executive Director (GFA) · **Approval required:** these ARE the decisions · **Supersession:** none
- Decisions are listed **separately** (not bundled). Each names its authority.

## Activation-state ladder (keep distinct per residence; do not upgrade one because another is true)
| State | EJWRH | Grace House |
|---|---|---|
| 1. Canonical residence exists | YES (id 2) | YES (id 1) |
| 2. Application technically available | YES (path works) | YES |
| 3. Controlled application pilot authorized | NO (proposed) | NO |
| 4. Publicly accepting applications | NO (directory closed) | NO |
| 5. Operationally processing applications | NO (no real applicant; owner unappointed) | NO |
| 6. Ready to admit | NO (no beds; capacity null; PSA execution unverified) | NO (no beds; move-in fee unknown) |
| 7. Fully operational | NO | NO |
| 8. Publicly listed in directory | NO (`is_public_directory=false`) | NO (`is_public_directory=false`) |

## RATIFIED executive decisions (2026-09-21, Thomas DeGarmeaux, Founder & Executive Director)
| Ref | Decision | Status | Applied in package | Downstream (authorized, not done here) |
|---|---|---|---|---|
| **PHONE-001** | **515-220-8771** = canonical GFA office / administrative / **housing-intake** / referral-partner number; **515-310-3425 (515-310-DIAL)** = GFA **Warmline / peer-support** only, never presented as admin/intake; label each number's function wherever it appears | **RATIFIED** | §10 PHONE-001 + labeled restorations in §10/§12/§17/§18 | correct the dev "Contact phone" (Warmline-as-contact) on next authorized site/config update |
| **NAME-001** | GFA **Founder & Executive Director = Thomas DeGarmeaux**; erroneous "Thomas Miller" (ED slot) corrected — not a different person (only "Miller" in repo; ≠ GFA President Dave Stout) | **RATIFIED** | §00/§01/§09/§10/§15 title updated; source `emergencyResponseProtocols.ts` corrected (uncommitted) | regenerate seed + build + **redeploy CQCX Emergency Response edition** (gated) to propagate; generated `.md`/seed/`dist` still carry old name until then |
| **EMAIL-001** | Latisha Williams & Yvette hold individual `@graceforaddictions.org` accounts | **CONFIRMED** (accounts created) | §10/§17 updated | do not guess exact addresses; use only if documented or ED-provided; **account ≠ authority** — role still per §09 + `role_assignments` |

## Decisions required from Thomas (separately)
| # | Decision | Authority | Depends on |
|---|---|---|---|
| D1 | EJWRH application status (keep direct-link pilot vs publish) | ED + Operator | pilot plan |
| D2 | Grace House application status | ED (GFA) | — |
| D3 | EJWRH admission status (when ready to admit) | **Operator** | beds, PSA execution |
| D4 | Grace House admission status | GFA | beds, fee |
| D5 | Operator/provider representation model correction (org_relationships) | ED + Operator | §16 options |
| D6 | Confirm PSA v4.1 **execution status** (signed?) | ED + Operator | verify signatures |
| D7 | Latisha's role (which residence, which layer, which system role) | ED (+ Operator if EJWRH) | her email + appointment |
| D8 | Yvette's role | ED (+ Operator if EJWRH) | same |
| D9 | Final admission authority incumbents per residence | Operator / GFA | — |
| D10 | Required documentation set per residence (confirm) | ED / Operator | §02 |
| D11 | Eligibility gaps (§07 unresolved items) | ED / Operator + counsel | — |
| D12 | Bed inventory creation (units/rooms/beds) per residence | Operator / GFA | roles first |
| D13 | EJWRH capacity in DB (reconcile to PSA's 10) | Operator | — |
| D14 | Bed-hold policy adoption per residence | Operator / GFA | §08 |
| D15 | Emergency-contact form adoption per residence | ED | §11 |
| D16 | ROI authoring + **counsel** review | ED + counsel | §11 |
| D17 | Referral communication authority (who, with consent) | ED / Operator | §09, ROI |
| D18 | Email: current `@graceforaddictions.org` accounts **CONFIRMED** (EMAIL-001, 2026-09-21); remaining governance (titles/roles/MFA/retention/offboarding) still open (§10); no new accounts; `rcoiowa.org` future | ED | — |
| D28 | **Propagate NAME-001** ("Thomas Miller"→"Thomas DeGarmeaux") beyond the source file: regenerate `documents_seed.sql`, rebuild the platform bundle, and redeploy the **CQCX Emergency Response Protocols edition** | ED + technical | **gated** (no deploy/Supabase change this phase) |
| D19 | Public routes + clean `/apply/*` (staging) | ED | Gate B auth |
| D20 | Intake owners + backups per residence | ED / Operator | roles |
| D21 | Response standards (ack/answer time targets) | ED | — |
| D22 | Training owner + record-of-training mechanism | ED | §14 |
| D23 | Effective dates per activated item | ED | — |
| D24 | Document activation/assignment for EJWRH (currently 0 assignments) | ED / Operator | training |
| D25 | Staging authorization (Gate B) | ED | — (currently unauthorized) |
| D26 | Synthetic testing authorization (staging) | ED | Gate B |
| D27 | Production publication (directory / Gate C) | ED (+ Operator EJWRH) | all above |

## Carry-forward technical direction (PREPARED/PROVISIONAL)
`recoveryresidence.org` = public directory/application; `recoveryresidence.app` = authenticated operations; one Worker w/ strict hostname separation (staging); exact Supabase redirect URLs (no wildcards); `residence-intake` sole writer; EJWRH residence_id 2; current working SPA apply path; proposed clean `/apply/ejwrh`; redirect review for the nonworking `ejwrh` Edge Function portal; **public-directory publication closed; Gate B unauthorized; Gate C closed.**
