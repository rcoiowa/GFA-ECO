# NARR 3.0 — Level II Certification Mapping

How Grace House and RecoveryOS evidence the NARR Standard 3.0 for
**Level II (monitored)** certification. NARR 3.0 organizes the Social
Model across **4 domains, 10 principles (A–J), and 31 standards** with
rule-level codes (e.g., `1.A.3.c`).

> **Sourcing note:** this mapping was built against the published NARR 3.0
> structure and widely reproduced rule references. Before submitting a
> certification application, verify each clause code against the
> certifying affiliate's current workbook (the Iowa affiliate /
> narronline.org "NARR Standard 3.0" and its Compendium) — and reconcile
> with the organization's own uploaded rules document when provided.
> Items marked **[operational]** are practices the operator must perform
> and log; the platform provides the record-keeping.

## Domain 1 — Administrative & Operational

### Principle A: Operate with integrity (Standards 1–4)

| Requirement                                                | Where it's met                                                                                                    |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Mission/vision guide operations                            | Org docs; `docs/architecture/product-architecture.md`; every policy carries the grace-based mission in its text   |
| Legal business entity, best business practices             | **[operational]** Grace For Addictions entity records; insurance certificates in the certification binder         |
| Code of ethics attested by staff & volunteers              | _Staff & Leadership Code of Ethics_ (`code_of_ethics`), signed annually; aligned with the NARR Code of Ethics     |
| Background check policy                                    | Code of Ethics §Accountability; **[operational]** checks completed before service                                 |
| Confidential resident records                              | _Confidentiality & Privacy Policy_; RLS-enforced records in RecoveryOS with audit logging (`audit_log`)           |
| 1.A.3.a — fees disclosed prior to admission                | _Fee Schedule & Refund Policy_, signed before the Resident Agreement; agreement §7 attests ordering               |
| 1.A.3.b — accounting system                                | **[operational]** org accounting; fee receipts + resident account statements promised in policy                   |
| 1.A.3.c — refund policy before binding agreement           | _Fee Schedule & Refund Policy_ §Refunds (per-day refunds, 14-day settlement)                                      |
| No signing over paychecks/benefits                         | Fee policy + Resident Rights §8, stated verbatim                                                                  |
| 1.A.4 — data collection for continuous quality improvement | `service_events` spine, incident/grievance quarterly reviews (stated in both policies), `analytics_people_served` |

### Principle B: Uphold residents' rights (Standards 5–6)

| Requirement                                                 | Where it's met                                                                                                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1.B.5 — rights & requirements communicated before admission | Move-in packet ordering in Resident Agreement §5/§7; _Residency Application_ "What happens next"                                          |
| 1.B.6 — dignity, privacy, nondiscrimination incl. MAT       | _Resident Rights & Responsibilities_ (12 rights); _Medication Policy_ MAT section; _Screening Policy_ dignity commitments                 |
| Grievance procedure                                         | _Grievance Policy_ (2-day acknowledgment, 7-day decision, appeal, external contacts, no-retaliation) + digital filing in-app + paper form |

### Principle C: Culture of empowerment (Standards 7–8)

| Requirement                           | Where it's met                                                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Resident involvement in governance    | House Guidelines: weekly house meeting runs the house; residents propose guideline changes; guidelines re-signed on change |
| Peer leadership / developmental roles | Level II senior-resident leadership model (Resident Agreement §6; Code of Ethics covers senior residents in leadership)    |

### Principle D: Staff able to apply the Social Model (Standards 9–13)

| Requirement                                                  | Where it's met                                                                                                  |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Level II staffing: house manager / senior resident oversight | Resident Agreement §6; **[operational]** staffing records                                                       |
| Staff training (naloxone, ethics, trauma-informed practice)  | Overdose policy training requirement; Code of Ethics §8; **[operational]** training log in certification binder |
| Supervision & accountability                                 | Code of Ethics §Accountability; grievance path to program director/ED                                           |
| Written job descriptions, P&P manual                         | The document library **is** the residence P&P set; **[operational]** job descriptions                           |

## Domain 2 — Physical Environment

### Principle E: Home-like environment (Standards 14–15)

| Requirement                                   | Where it's met                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Home-like spaces, kitchen access, furnishings | House Guidelines §Daily life (kitchen is yours); Property Policy (furnished rooms documented at move-in); **[operational]** premises |
| Community-supporting capacity                 | Grace House capacity 12 (`residences.capacity`); bed/room model in schema (`residence_beds`)                                         |

### Principle F: Safe & healthy environment (Standards 16–19)

| Requirement                                          | Where it's met                                                                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.F.16 — safe, healthy, maintained                   | Emergency Procedures; Property Policy; Good Neighbor upkeep commitments; **[operational]** inspections                                                     |
| 2.F.17 — smoke/CO detectors, extinguishers, egress   | Emergency Procedures §Fire (placement, monthly tests logged, two egress routes, drills 2×/year)                                                            |
| 2.F.18 — emergency plan, posted procedures, naloxone | Emergency Procedures (posted, quarterly review, move-in walkthrough); _Overdose Prevention & Naloxone Policy_ (on-site naloxone, monthly checks, training) |
| Substance-free environment practices                 | House Guidelines; _Screening Policy & Consent_; screenings recorded (`screenings` table)                                                                   |

## Domain 3 — Recovery Support

### Principle G: Active recovery & community engagement (Standards 20–25)

| Requirement                                              | Where it's met                                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access to mutual aid & recovery supports                 | House Guidelines §Weekly rhythm; VRCC engines (coaching, peer support, navigation) available to every resident                                        |
| 3.G.21.a — person-centered recovery plan incl. exit plan | Resident Agreement §2 (plan within 30 days, transition picture from the start); recovery plans + goals engines; Transition Policy §Planned transition |
| Meaningful daily activities                              | Recovery plan goals engine; Level II expectation in House Guidelines                                                                                  |
| Recovery capital development                             | BARC-10 engine (`/app/tools/recovery-capital`), assessments attributed via `service_events`                                                           |
| Community linkage                                        | Navigation engine; Transition Policy 60-day intensification                                                                                           |

### Principle H: Model prosocial behaviors (Standard 26)

Code of Ethics §4/§7; House Guidelines "When something slips" (modeled
conflict resolution); grievance no-retaliation culture.

### Principle I: Belonging & responsibility (Standards 27–29)

| Requirement                         | Where it's met                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| House meetings                      | Weekly (House Guidelines); `meetings` + `meeting_attendance` tables; Schedule page                                             |
| Community norms protecting recovery | House Guidelines; Screening Policy; _Return-to-Use Support Policy_ (non-punitive, safety-first response; no street discharges) |
| Shared responsibilities             | Chore system (`residence_chores`, `chore_assignments`); My Residence page                                                      |

## Domain 4 — Good Neighbor

### Principle J: Be a good neighbor (Standards 30–31)

| Requirement                                        | Where it's met                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Neighbor contact & responsive complaint handling   | _Good Neighbor Policy_ (contact given to neighbors, 2-day response, logged, closed loop) |
| Courtesy rules: parking, noise, smoking, loitering | Good Neighbor Policy §Everyday courtesy; Guest Policy §Neighbors                         |

## Certification binder checklist (operational evidence)

The platform documents above + these operator artifacts complete a
Level II application: entity/insurance docs, staff rosters + background
checks + training logs, inspection records (fire marshal / local code as
required), detector/extinguisher/naloxone check logs, drill logs, house
meeting minutes, and the signed document set per resident (exported from
`document_assignments`).
