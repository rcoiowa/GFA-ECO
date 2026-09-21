# DECISIONS_REQUIRED — open decisions and their authority

Canonical detail is in **15_DECISION_AND_ACTIVATION_REGISTER.md** (D1–D28). This index summarizes what must be decided, by whom, and what it depends on. **A recommendation is not authorization; a proposal is not approval.** Nothing in this package is implemented.

> **RATIFIED (2026-09-21, ED):** **PHONE-001** (515-220-8771 = office/admin/housing-intake/referral; 515-310-3425 = Warmline/peer-support only), **NAME-001** (GFA Founder & Executive Director = Thomas DeGarmeaux; "Thomas Miller" corrected at source), **EMAIL-001** (Latisha/Yvette `@graceforaddictions.org` accounts confirmed; account ≠ authority). New gated follow-up **D28**: propagate the name fix to the generated seed/build and the CQCX Emergency Response edition (no deploy this phase). See §15.

## Highest-priority (block admitting / activation)
| Decision | Authority | Depends on |
|---|---|---|
| Confirm **PSA v4.1 execution status** (signed?) + current **Operator incumbent** | ED + Operator | signatures (D6) |
| Confirm **physical beds & capacity** per residence (operator/manager attestation; manual/paper acceptable), then reconcile into RecoveryOS | Operator (EJWRH) / GFA (Grace House) | roles first (D12/D13) |
| Reconcile **EJWRH capacity** (PSA 10) into RecoveryOS | Operator | — |
| **ROI**: author an EJWRH ROI; ratify the Grace House draft (`form_release_of_information.md` v2026.07) — **counsel-gated** | ED + counsel | counsel (D16) |
| **Grace House move-in fee** — confirm | GFA | — |
| **Intake owners + backups** per residence | ED / Operator | roles (D20) |
| **Latisha & Yvette** roles (which residence, which authority layer, which system role) — currently UNKNOWN | ED (+ Operator if EJWRH-side) | their email + formal appointment (D7/D8) |

## Governance / correctness
| Decision | Authority | Notes |
|---|---|---|
| **Operator/provider data-model** correction (`organization_relationships`) | ED + Operator | do not infer GFA ownership from org_id=1 (D5; §16 options) |
| Eligibility gaps (§07 UNKNOWN items; lawful exclusions) | ED / Operator + counsel | D11 |
| **DOC referral/placement status** verification (before any "DOC-approved" representation) | ED / Operator | Class F — see SOURCE_REGISTER #24 |
| **Occupancy / Iowa Code ch. 562A** characterization | counsel | PSA Art. 11; not a settled conclusion |
| Required documentation set per residence (confirm) | ED / Operator | D10 |
| Bed-hold policy + emergency-contact form adoption | Operator / GFA / ED | D14/D15 |
| Referral-communication authority (who, per the file-11 taxonomy) | ED / Operator | D17; counsel for disclosure |
| Email governance (confirm current `@graceforaddictions.org`; no new accounts; `rcoiowa.org` future) | ED | D18 |
| Training owner + a record-of-training mechanism (distinct from document assignment) | ED | D22 |
| EJWRH document activation/assignment (currently 0 assignments) | ED / Operator | D24; after training |

## Technical / publication (later gates)
| Decision | Authority | Notes |
|---|---|---|
| **Cloudflare read access** to capture current DNS/route/cert bindings + rollback | ED / technical admin | **REQUIRES ACCESS** — MCP lacks zones/DNS/routes |
| `TURNSTILE_SECRET` present for `.org`; `LEAD_INTAKE_SECRET` for the contact/lead path | ED / technical admin | forms fail closed without it |
| Public routes + clean `/apply/*` on staging | ED | **Gate B — currently unauthorized** |
| Synthetic testing on staging | ED | after Gate B |
| Directory publication (`is_public_directory`) / production | ED (+ Operator for EJWRH) | **Gate C — closed** |
| Default branch correction to `main` | repo admin | manual (no GitHub tool performed it) |

## Standing constraints (do not treat as done)
- **Gate B remains unauthorized. Gate C remains closed.**
- No commit / push / merge / deploy / publish / account creation / data mutation in this phase.
- Grace never infers ICARE stage or risk; no passive surveillance; BARC-10 canonical 10–60 with no automated thresholds (CLAUDE.md governance).
