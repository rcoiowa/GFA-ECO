# 06 — Grace House Inquiry-to-Move-In Checklist

- **Residence:** Grace House (residence_id 1) · **Evidence date:** 2026-09-20 · **State:** PREPARED (not effective) · **Owner:** GFA (operator) · **Approval required:** yes · **Supersession:** none
- **Authority reminder:** Grace House is GFA-operated; **GFA makes the admission decision** (ADR-0013: admit / waitlist(numbered) / refer). Software never admits.

**RecoveryOS taxonomy mapping:** same as 05 (inquiry→`leads.new`; application→`residence_application_intake`; … move-in→`residencies`; onboarding→`residency_phases`). Grace House uses the **phase 1/2/3** model (ADR-0013) driving curfew ceilings and screening cadence.

| Step | Responsible role | Required evidence | RecoveryOS status | Required document | Consent needed | Stop condition | Escalation | Decision authority | Sign-off |
|---|---|---|---|---|---|---|---|---|---|
| Inquiry received | GFA intake (UNKNOWN — AUTH REQ) | contact + interest | `leads.new` (residence_interest=grace_house) | — | — | none | — | Intake owner | Intake |
| Application received | GFA intake | intake submission | `residence_application_intake` (residence_id 1) | Application & Pre-Screening (org v2.0) | consent-to-contact | missing fields → request info | Intake owner | Intake |
| Duplicate checked | GFA intake | dedupe result | intake dedup | — | — | duplicate → merge/close | Intake owner | Intake |
| Assigned | Intake owner | assignment | `leads.assigned` | — | — | no reviewer | ED | Intake owner |
| Information complete | GFA intake | complete file | intake review | Intake Forms Package | — | incomplete → hold | Intake owner | Intake |
| Screened | GFA staff | screening record | screening review | Screening Policy & Consent v2.0 (sig) | screening consent | positive/concern → care-first (never auto-deny) | GFA lead | GFA |
| Eligible / ineligible | GFA | eligibility (2 pathways) | readiness | Eligibility standard (07) | — | ineligibility must be Fair-Housing lawful, documented | ED + counsel if needed | **GFA** |
| Approved / denied / waitlisted | **GFA** | documented decision | `residence_applications` decided | Person-first notice / numbered waitlist (10) | — | unlawful/undocumented reason | ED + counsel | **GFA** |
| Ready to admit | Intake owner | readiness confirmed | readiness | — | — | any doc/consent/bed gap | GFA | GFA |
| Bed confirmed | House Manager (GFA) | **GFA manager confirms a real physical bed** (manual/paper acceptable), then reconcile into RecoveryOS (bed inventory **0 rows** today — a data gap, not proof of physical state; capacity 12 configured) | bed assignment | Bed inventory (08) | — | **no confirmed physical bed (manager attestation or reconciled inventory)** → STOP | GFA | GFA |
| Admission authorized | **GFA** | authorization | admission | — | — | — | ED | **GFA** |
| Agreements executed | Resident + GFA | signatures | `document_assignments` (existing usage) | Participant Agreement v2.0 (sig) + Handbook/Rights/Conduct/Screening/Med/Return-to-Use/Fees/Curfew/Grievance/Emergency/Exit/Good-Neighbor | doc consent | unsigned required docs | GFA | GFA |
| Moved in | House Manager | admission_date | `residencies` | Move-in checklist | — | fees / **move-in fee UNKNOWN** unresolved | GFA | GFA |
| Oriented | House Manager | orientation record | `residency_phases` (phase 1) | Handbook (sig) | — | orientation not delivered | GFA | House Manager |
| Operationally onboarded | House Manager + coach | support plan, coach | coaching/navigation | — | ROI for external coordination | disclosure without ROI | ED/counsel | GFA |
| Closed / transitioned | House Manager | exit/transition record | residency ended | Exit & Transition Policy v2.0 | ROI if coordinating | — | GFA | GFA |

**Hard stops today:** no confirmed physical bed (RecoveryOS inventory is a 0-row data gap — confirm via GFA manager, then reconcile; the empty database is not proof there is no bed; capacity 12 is a configured value, not a physical count); move-in fee unconfirmed; intake owner unappointed; ROI missing for any **participant-specific external disclosure** (administrative coordination is not ROI-gated — see file 11).
