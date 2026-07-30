# NARR 3.0 — Level II Certification Mapping

How Grace House and RecoveryOS evidence the NARR Standard 3.0 for
**Level II (monitored / peer-supported)** certification, pursued via
**MCRSP** (Missouri's NARR affiliate, providing temporary certification
through the Iowa HHS process — recoveryhousing@hhs.iowa.gov).

Clause codes below follow the organization's canonical compliance table
(VRCC Recovery Residence Hub Integration Plan,
`docs/source-documents/VRCC_RecoveryResidence_Hub_IntegrationPlan.docx`),
which enumerates every Level II requirement across the 4 domains and 31
standards. The evidencing documents are the canonical Grace House
operational set (`docs/source-documents/grace-house/`, served in-app from
`packages/residence-content`). Items marked **[operational]** are
practices the operator performs and logs; the platform provides the
record-keeping.

## Domain 1 — Administrative Operations (Standards 1–13)

| Standard | Requirement (Level II)                                                           | Evidence                                                                                                |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1.A.1    | Written mission and vision, NARR-consistent                                      | Handbook §Program Philosophy; org documents                                                             |
| 1.A.2.a  | Legal business entity documentation                                              | **[operational]** 501(c)(3) records in document vault                                                   |
| 1.A.2.b  | Current liability insurance                                                      | **[operational]** certificate + expiry tracking                                                         |
| 1.A.2.c  | Written permission from property owner                                           | **[operational]** W&W Properties lease on file                                                          |
| 1.A.2.d  | Non-discrimination statement                                                     | Participant Agreement; Application Part F (Fair Housing Act)                                            |
| 1.A.2.e  | Honest marketing attestation                                                     | Public profile review (directory site content)                                                          |
| 1.A.2.h  | No staff involvement in resident finances                                        | Fee Schedule & Financial Agreement; Participant Agreement Part 1                                        |
| 1.A.2.i  | Code of ethics signed by all staff/volunteers                                    | Code of Ethics (staff, house leads, peer mentors, volunteers)                                           |
| 1.A.3.a  | Fees disclosed in writing before any funds accepted                              | Fee Schedule (Policy GH-FEES-001) provided at Stage 1, before application                               |
| 1.A.3.b  | Accounting for resident financial transactions                                   | Fee payment record + receipts; `service_events`/fee ledger (Hub roadmap)                                |
| 1.A.3.c  | Refund policy disclosed before binding agreement                                 | Participant Agreement Part 1; Fee Schedule & Financial Agreement                                        |
| 1.A.4.a  | Data collection policies, privacy protected                                      | Intake Forms Package; RecoveryOS RLS + audit logging                                                    |
| 1.B.5.a  | Written agreement before committing to terms                                     | Participant Agreement signed at intake, all documents published in advance                              |
| 1.B.6.a  | Records secure, authorized access only                                           | RecoveryOS role-based access (RLS); locked/encrypted resident files                                     |
| 1.B.6.b  | Confidentiality law compliance (42 CFR Part 2)                                   | Handbook §Confidentiality (HIPAA & Part 2 alignment)                                                    |
| 1.B.6.c  | Social media privacy policy                                                      | Code of Conduct §Photography & Social Media; Handbook                                                   |
| 1.C.7.a  | Some rules made by residents                                                     | Handbook §House Meetings (resident governance, rotating facilitation)                                   |
| 1.C.7.b  | Grievance policy with right to escalate                                          | Grievance Procedure & Form (5-step, external agencies listed)                                           |
| 1.C.7.c  | Resident rights posted in common areas                                           | Handbook §Resident Rights; Code of Conduct §Your Rights **[operational: posting]**                      |
| 1.C.7.d  | Resident-driven length of stay                                                   | Phase structure (1/2/3), no fixed exit date                                                             |
| 1.C.7.e  | Residents heard in governance                                                    | House meeting log (`meetings`/`meeting_attendance`)                                                     |
| 1.C.8.a  | Peer support interactions facilitated                                            | Coach selection at intake; daily VRCC check-ins; peer-led model                                         |
| 1.C.8.c  | Recovery progress recognized, strengths celebrated                               | Phase advancement; IRP milestone reviews at 30/60/90 days                                               |
| 1.D.9–13 | Staff modeling, training, cultural responsiveness, job descriptions, development | Complete Operational System (staff manual); Code of Ethics **[operational: training/supervision logs]** |

## Domain 2 — Physical Environment (Standards 14–19)

| Standard   | Requirement (Level II)                                                                                       | Evidence                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 2.E.14.a–i | Good repair, home-like furnishings/entrances, 50+ sq ft/bed, 1 bath per 6, storage, laundry, safe appliances | **[operational]** property records + site verification; Property specs on file |
| 2.E.15.a–d | Meeting space, group areas, kitchen/dining, recreation                                                       | **[operational]** site verification                                            |
| 2.F.16.a   | Alcohol/illicit drug prohibition policy                                                                      | Code of Conduct; Participant Agreement Part 3                                  |
| 2.F.16.b   | Prohibited items and search procedures                                                                       | Complete Operational System                                                    |
| 2.F.16.c   | Drug screening and toxicology protocols                                                                      | Screening Policy & Consent (phase-based schedule, screening log)               |
| 2.F.16.d   | Medication usage and storage policy                                                                          | Medication & MAT/MOUD Policy (lockboxes, house safe, count log)                |
| 2.F.16.e   | Residents take responsibility for safety                                                                     | Code of Conduct; House sign-in/out; Handbook                                   |
| 2.F.17.a–c | Structural attestation, code compliance, smoke/CO detectors + extinguishers inspected                        | Emergency Response Protocols **[operational: inspection + safety logs]**       |
| 2.F.18.a   | Smoke-free interior, designated smoking area                                                                 | Handbook §Smoking; Good Neighbor Policy                                        |
| 2.F.19.a   | Emergency numbers and evacuation maps posted                                                                 | Emergency Response Protocols; Handbook §Physical Safety                        |
| 2.F.19.b   | Emergency contact information collected                                                                      | Intake Forms Package (Emergency Contact & Medical Consent)                     |
| 2.F.19.c   | Residents oriented to emergency procedures                                                                   | Orientation checklist; naloxone training within 7 days of intake               |
| 2.F.19.d   | Naloxone accessible, individuals trained                                                                     | Handbook §Naloxone Policy; Emergency Response Protocol 1                       |

## Domain 3 — Recovery Support (Standards 20–29)

| Standard   | Requirement (Level II)                                                   | Evidence                                                                                            |
| ---------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 3.G.20.a   | Meaningful activities encouraged                                         | Participant Agreement Part 2 (30 hrs/week engagement by Day 30, GH-ACTIVITY-001)                    |
| 3.G.21.a   | Individualized recovery planning incl. exit plan                         | IRP within 72 hours of intake; reviews at 30/60/90 days                                             |
| 3.G.21.b   | Recovery capital built                                                   | IRP tracker; BARC-10 engine in VRCC                                                                 |
| 3.G.21.c   | Peer leadership/mentoring criteria written                               | Phase advancement structure; peer mentor roles                                                      |
| 3.G.22.a–b | Resource directories and education                                       | VRCC resource library; coach/navigation services                                                    |
| 3.G.23.a   | Weekly schedule of recovery support services                             | Phase-based activity requirement (4/3/2 per week, GH-RECOVERY-001 v2.0)                             |
| 3.G.23.b   | Peer-to-peer support facilitated                                         | Weekly house meeting (mandatory); peer-led model                                                    |
| 3.H.26.a–c | Empathy modeled; trauma-informed priority; residents inform operations   | Handbook §Trauma-Informed Care (5 principles); house meetings                                       |
| 3.I.27     | Functionally equivalent family (50%+ indicators)                         | House meetings, chores, shared meals, shared expenses                                               |
| 3.I.28.a–d | Informal activities, gatherings, transition rituals                      | GFARC Tuesday gathering; phase advancement celebrations; alumni welcome                             |
| 3.I.29.a–f | Mutual aid linkage, sponsors/mentors, community resources, relationships | Recovery activity list (12-step, SMART, Celebrate Recovery, faith communities); IRP support network |

## Domain 4 — Good Neighbor (Standards 30–31)

| Standard | Requirement                                     | Evidence                                                             |
| -------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| 4.J.30.a | Neighbor contact info available                 | Good Neighbor Policy — GFA office 515-220-8771 on file for neighbors |
| 4.J.30.b | Responsive concern handling                     | 24-hour acknowledgment + neighbor concern log                        |
| 4.J.30.c | Orientations include neighbor interaction       | Orientation checklist; Good Neighbor acknowledgment at move-in       |
| 4.J.31.a | Smoking/loitering/language/cleanliness policies | Good Neighbor Policy §Standards                                      |
| 4.J.31.b | Parking courtesy documented                     | Good Neighbor Policy §Standards (parking)                            |

## Certification workflow

1. Complete the pre-certification punch list (NARR II Self-Assessment
   document): 3-month operations evidence, insurance, executed
   lease/authority documents, fire/safety inspection within 12 months,
   naloxone + first aid stocked and logged, staff ethics signatures.
2. Submit the MCRSP application via recoveryhousing@hhs.iowa.gov.
3. The Hub roadmap (Integration Plan §4) automates ongoing compliance:
   each logged drug test, house meeting, IRP, and naloxone training
   auto-evidences its standard.
