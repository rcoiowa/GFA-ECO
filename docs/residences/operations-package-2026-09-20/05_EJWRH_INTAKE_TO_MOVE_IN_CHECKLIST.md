# 05 — EJWRH Inquiry-to-Move-In Checklist

- **Residence:** EJWRH (residence_id 2) · **Evidence date:** 2026-09-20 · **State:** PREPARED (not effective) · **Owner:** ED + Operator (EJWRH LLC) · **Approval required:** yes · **Supersession:** none
- **Authority reminder:** GFA supports; **Operator (EJWRH, L.L.C.) makes the admission decision** (PSA Art. 6). Software never admits (PSA 6.3).

**RecoveryOS taxonomy mapping** (assignment wording → system status): inquiry received→`leads.new`; application received→`residence_application_intake` row; assigned→`leads.assigned`; contacted→`leads.contacted`/`lead_contact_events`; screened→intake review; approved→`residence_applications` decided; moved in→`residencies` (admission_date); oriented/onboarded→`residency_phases`.

| Step | Responsible role | Required evidence | RecoveryOS status | Required document | Consent needed | Stop condition | Escalation | Decision authority | Sign-off |
|---|---|---|---|---|---|---|---|---|---|
| Inquiry received | Intake staff (UNKNOWN — AUTH REQ) | contact + interest | `leads.new` (residence_interest=ejwrh) | — | — | none | — | Intake owner | Intake |
| Application received | Intake staff | intake submission | `residence_application_intake` (residence_id 2) | Application & Pre-Screening (org v2.0) | app consent-to-contact | missing required fields → request info | Intake owner | Intake |
| Duplicate checked | Intake staff | dedupe result | intake dedup | — | — | duplicate → merge/close (no new record) | Intake owner | Intake |
| Assigned | Intake owner | assignment | `leads.assigned` | — | — | no production reviewer available | ED | Intake owner |
| Information complete | Intake staff | complete file | intake review | Application package | — | incomplete → hold, request | Intake owner | Intake |
| Screened | GFA screening support | screening record | screening review | EJWRH Screening Policy (ack) | screening consent | positive/concern → care-first sequence (never auto-deny) | Operator | Operator (with GFA input) |
| Eligible / ineligible | GFA recommends → Operator | eligibility determination | readiness | Eligibility standard (07) | — | ineligibility must be Fair-Housing lawful, documented | Operator + counsel if needed | **Operator** |
| Approved / denied | **Operator (EJWRH LLC)** | documented human decision | `residence_applications` decided | Denial uses person-first notice (10) | — | denial reason unlawful/undocumented | ED + counsel | **Operator** |
| Ready to admit | Intake owner | readiness confirmed | readiness | — | — | any doc/consent/bed gap | Operator | Operator |
| Bed confirmed | House Manager (Operator) | **authorized operator/manager confirms a real physical bed** (manual/paper acceptable), then reconcile into RecoveryOS (bed inventory **0 rows** today — a data gap, not proof of physical state) | bed assignment | Bed inventory (08) | — | **no confirmed physical bed (operator attestation or reconciled inventory)** → STOP | Operator | Operator |
| Admission authorized | **Operator** | signed authorization | admission | — | — | authority not verified (PSA execution) | ED | **Operator** |
| Agreements executed | Resident + Operator | signatures | `document_assignments` (currently 0) | EJWRH Participant & Residency Agreement (sig) + acks | doc consent | unsigned required docs | Operator | Operator |
| Moved in | House Manager | admission_date | `residencies` | Move-in checklist | — | fees/move-in ($250) unresolved | Operator | Operator |
| Oriented | House Manager | orientation record | `residency_phases` | Handbook (ack) | — | orientation not delivered | Operator | House Manager |
| Operationally onboarded | House Manager + GFA | support plan, coach assigned | coaching/navigation | — | ROI for external coordination | external disclosure without ROI | ED/counsel | Operator/GFA |
| Closed / transitioned | House Manager | exit/transition record | residency ended | Transition template (13) | ROI if coordinating | — | Operator | Operator |

**Hard stops today:** no confirmed physical bed (RecoveryOS inventory is a 0-row data gap — confirm via authorized operator/manager, then reconcile; the empty database is not proof there is no bed); PSA execution + Operator incumbent unverified (admission authority basis); intake owner unappointed; ROI missing for any **participant-specific external disclosure** (administrative coordination is not ROI-gated — see file 11).
