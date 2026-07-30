import type { ResidenceDocument } from './types';

/**
 * Paper/printable forms. Where a live digital equivalent exists in the app
 * (pass requests, grievances), the form notes it — the paper version stays
 * canonical for binders, move-in packets, and residents who prefer paper.
 */

export const intakeApplication: ResidenceDocument = {
  key: 'form_intake_application',
  name: 'Residency Application & Intake Form',
  category: 'form',
  version: '2026.07',
  summary: 'The application for residency — what we ask before move-in, and why we ask it.',
  requiresSignature: false,
  narrReferences: [
    '1.B.5 — applicants informed of rights and requirements before admission',
    '1.A.2 — fair, documented admission practices',
  ],
  iowaChecklist: ['Documented admission/screening process'],
  body: `# Residency Application & Intake Form

**Grace For Addictions — Grace House**

Thank you for considering Grace House as your next home. This form helps
us make one honest decision together: whether the support this house
offers fits the support you need right now. There are no automatic
disqualifiers on this page — criminal-legal history, medication, past
residencies, and past returns to use are all things we talk about, not
things we screen out.

## About you

| | |
| --- | --- |
| Name | ______________________ |
| Preferred name / pronouns (optional) | ______________________ |
| Date of birth | ______________________ |
| Phone / email | ______________________ |
| Current living situation | ______________________ |
| Earliest possible move-in date | ______________________ |

## Your recovery

*These questions have no wrong answers. They help us support you, not
grade you.*

- What does your recovery look like right now (pathway, supports,
  treatment, meetings, medication — whatever applies)?
  ________________________________________________________________
- Recovery date or current stability, as you'd describe it:
  ________________________________________________________________
- Are you currently prescribed any medications, including MAT/MOUD
  (methadone, buprenorphine, naltrexone)? *Medication never affects
  admission — we ask so we can support storage and fair screening.*
  ________________________________________________________________
- What kind of support helps you most when things get hard?
  ________________________________________________________________

## Practical picture

- Employment / income / benefits situation (fees are on the attached Fee
  Schedule — we plan together if income is a work in progress):
  ________________________________________________________________
- Legal obligations we should plan around (probation/parole check-ins,
  court dates, treatment orders)? ______________________________
- Health or accessibility needs the house should accommodate:
  ________________________________________________________________

## Safety questions

*Asked of every applicant, answered without judgment.*

- Any history we should plan supports around — violence, fire-setting, or
  sexual offenses requiring registry compliance? (Registry obligations
  affect siting rules, so we must ask.) ______________________________
- Anything else you want us to know before we talk?
  ________________________________________________________________

## What happens next

1. We confirm receipt within 2 business days and schedule a conversation
   (in person or video) — you're welcome to bring a support person.
2. You tour the house and meet residents when possible.
3. We decide together. If Grace House isn't the right fit, we tell you
   honestly why and help you find what is — referral is a service here,
   not a rejection letter.
4. Before anything is signed you receive the full move-in packet: Resident
   Agreement, Rights, House Guidelines, Fee Schedule, and every policy.

| | |
| --- | --- |
| Applicant signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
`,
};

export const emergencyContactForm: ResidenceDocument = {
  key: 'form_emergency_contact',
  name: 'Emergency Contact & Health Information Form',
  category: 'form',
  version: '2026.07',
  summary: 'Who to call and what responders need to know — used only in a genuine emergency.',
  requiresSignature: false,
  narrReferences: ['2.F.18 — emergency preparedness'],
  iowaChecklist: ['Emergency contact information on file'],
  body: `# Emergency Contact & Health Information Form

**Grace For Addictions — Grace House**

Completed at move-in, updated any time. This information is sealed in
your file and used **only** in a genuine emergency — it is not shared for
any other purpose without your consent (see Confidentiality & Privacy
Policy).

## Emergency contacts

| | Contact 1 | Contact 2 |
| --- | --- | --- |
| Name | ____________ | ____________ |
| Relationship | ____________ | ____________ |
| Phone | ____________ | ____________ |
| Okay to tell them you live here? | yes / no | yes / no |
| Okay to contact if we can't reach you (see Property Policy)? | yes / no | yes / no |

## For emergency responders

| | |
| --- | --- |
| Allergies (medications, foods, other) | ______________________ |
| Current medications (or "see sealed medication disclosure") | ______________________ |
| Medical conditions responders should know (seizures, diabetes, heart, etc.) | ______________________ |
| Primary care / clinic | ______________________ |
| Treatment provider (optional) | ______________________ |
| Health coverage (optional) | ______________________ |

## Advance wishes (optional)

If I am in a mental-health or overdose crisis, what helps me most / what
makes things worse (e.g., "call my sister first," "don't touch my
shoulders," "tell me what's happening step by step"):

________________________________________________________________

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
`,
};

export const releaseOfInformationForm: ResidenceDocument = {
  key: 'form_release_of_information',
  name: 'Release of Information (ROI) Form',
  category: 'form',
  version: '2026.07',
  summary:
    'Your written, specific, revocable consent before your information goes anywhere — 42 CFR Part 2 compliant.',
  requiresSignature: false,
  narrReferences: ['1.A.2 — confidentiality of resident records'],
  iowaChecklist: ['Consent-based information sharing'],
  body: `# Release of Information

**Grace For Addictions — Grace House**

One form per recipient. Nothing is shared until this is signed; declining
never affects your residency or services; you may revoke at any time.

| | |
| --- | --- |
| Resident name | ______________________ |
| I authorize Grace For Addictions to share with (person/organization) | ______________________ |
| Contact details of recipient | ______________________ |

**What may be shared** (check only what you intend):

- [ ] Confirmation that I live at / am in the program
- [ ] Attendance and participation summary
- [ ] Screening results
- [ ] Recovery plan / progress updates
- [ ] Medication information
- [ ] Fees and account status
- [ ] Other (specific): ______________________

**Purpose:** ______________________ (e.g., treatment coordination,
probation reporting, family updates)

**Direction:** [ ] release to them  [ ] receive from them  [ ] both

**Expires:** ______________ (date or event; maximum one year unless
renewed). I may revoke earlier, in writing, with effect going forward.

**Your rights under 42 CFR Part 2 (where applicable):** records protected
by federal confidentiality rules cannot be redisclosed by the recipient
without your further written consent; a general medical release does not
substitute for this form.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff witness | ______________________ Date ________ |
| Revoked (if applicable): date + resident initials | ______________________ |

*Version 2026.07 — Grace For Addictions.*
`,
};

export const overnightPassForm: ResidenceDocument = {
  key: 'form_overnight_pass',
  name: 'Overnight Pass Request Form',
  category: 'form',
  version: '2026.07',
  summary:
    'The paper version of the pass request — also available digitally in the app under Schedule.',
  requiresSignature: false,
  narrReferences: ['3.I.28 — community safety practices'],
  iowaChecklist: ['Overnight/pass procedures in writing'],
  body: `# Overnight Pass Request

**Grace For Addictions — Grace House**

*Passes exist so the house knows you're safe — not to control your life.
Requests are honored whenever safety allows. This form also lives in the
app (Schedule → Request a pass), which is faster.*

| | |
| --- | --- |
| Resident name | ______________________ |
| Leaving (date/time) | ______________________ |
| Returning (date/time) | ______________________ |
| Where I'll be (city / general location is enough) | ______________________ |
| Reachable at | ______________________ |
| Support plan while away (meetings, sober contact, medication plan — whatever applies) | ______________________ |

Submit at least 48 hours ahead when possible — same-day requests for
work, family, or emergencies are always considered.

| Staff use | |
| --- | --- |
| Decision | approved / not approved (reason given in person + below) |
| Reason if not approved | ______________________ |
| Decided by / date | ______________________ |

An unapproved absence is treated first as a *safety concern* (are you
okay?) and second as an agreement conversation per the House Guidelines.

*Version 2026.07 — Grace For Addictions.*
`,
};

export const grievanceForm: ResidenceDocument = {
  key: 'form_grievance',
  name: 'Grievance Form',
  category: 'form',
  version: '2026.07',
  summary:
    'The paper version of the grievance filing — also available digitally in the app under Documents.',
  requiresSignature: false,
  narrReferences: ['1.B.6 — grievance procedure'],
  iowaChecklist: ['Grievance form available to residents'],
  body: `# Grievance Form

**Grace For Addictions — Grace House**

*Use this for any concern: rights, safety, staff conduct, billing,
conflict, anything. Filing can never be held against you — see the
Grievance Policy for the full process, timelines, and outside contacts.
Also available in the app (Documents → File a grievance).*

| | |
| --- | --- |
| Your name | ______________________ |
| Date | ______________________ |
| I'd like my grievance handled by (optional — e.g., "someone other than the house manager") | ______________________ |

**What happened?** (What, when, who was involved — attach pages as
needed)

________________________________________________________________
________________________________________________________________
________________________________________________________________

**What would make this right, from your perspective?**

________________________________________________________________
________________________________________________________________

**Have you talked with anyone here about it yet?** (Optional — a prior
conversation is never required.)

________________________________________________________________

| Office use | |
| --- | --- |
| Received by / date | ______________________ |
| Acknowledged to resident (within 2 business days) | ______________________ |
| Written decision provided (within 7 business days) | ______________________ |
| Appeal filed / decided | ______________________ |

*Version 2026.07 — Grace For Addictions.*
`,
};

export const incidentReportForm: ResidenceDocument = {
  key: 'form_incident_report',
  name: 'Incident Report Form',
  category: 'form',
  version: '2026.07',
  summary:
    'Staff documentation of safety events — factual, person-first, and reviewed for what the house can learn.',
  requiresSignature: false,
  narrReferences: ['1.A.4 — data collection for continuous quality improvement'],
  iowaChecklist: ['Incident documentation and review process'],
  body: `# Incident Report

**Grace For Addictions — Grace House** *(completed by staff within 24
hours of any safety event: medical emergency, overdose, fire, injury,
violence/threat, property damage, missing resident, privacy breach)*

| | |
| --- | --- |
| Date/time of incident | ______________________ |
| Location | ______________________ |
| Category | medical / overdose / fire / injury / violence or threat / property / missing person / privacy / other: ________ |
| Reported by | ______________________ |

**What happened — facts only.** *Write what you observed, in person-first
language. "Resident J. was unresponsive in the kitchen at 21:40" — not
interpretations, diagnoses, or character commentary. Residents involved
are identified by initials in this narrative; full names live only in the
secure record.*

________________________________________________________________
________________________________________________________________
________________________________________________________________

**Immediate response taken** (911? naloxone — how many doses? first aid?
who was notified?):

________________________________________________________________

**People involved / witnesses:** ______________________

**Follow-up needed** (support offered to those involved and those who
witnessed, repairs, policy questions raised):

________________________________________________________________

| Review | |
| --- | --- |
| House manager review / date | ______________________ |
| Program leadership review / date | ______________________ |
| Discussed in quality review (quarterly) | ______________________ |

*Version 2026.07 — Grace For Addictions. Incident data is reviewed
quarterly for patterns — the question is always "what does the house need
to change," before "what did a person do wrong."*
`,
};

export const moveInInventoryForm: ResidenceDocument = {
  key: 'form_move_in_inventory',
  name: 'Move-In Inventory Form',
  category: 'form',
  version: '2026.07',
  summary: 'The shared record of your belongings and room condition, signed by both of us.',
  requiresSignature: false,
  narrReferences: ['1.B.6 — respect for resident property'],
  iowaChecklist: ['Move-in inventory practice'],
  body: `# Move-In Inventory

**Grace For Addictions — Grace House** *(completed together at move-in;
both keep a copy; walked again at move-out — see the Personal Property &
Move-In Inventory Policy)*

| | |
| --- | --- |
| Resident | ______________________ |
| Room | ______________________ |
| Move-in date | ______________________ |

## Room & furnishings condition

| Item | Condition at move-in | Notes |
| --- | --- | --- |
| Bed frame & mattress | good / fair / worn | ________ |
| Dresser / storage | good / fair / worn | ________ |
| Walls / floor / window | good / fair / worn | ________ |
| Lock & keys issued | yes / no | ________ |
| Medication lockbox issued | yes / no | ________ |

## Resident belongings

*List significant items; photos of valuables welcome and attached: ___*

1. ______________________
2. ______________________
3. ______________________
4. ______________________
5. ______________________
(continue on back)

## Documents & valuables noted for safekeeping (optional)

________________________________________________________________

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff signature | ______________________ Date ________ |
| Move-out walk completed (both initial) | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
`,
};

export const medicationDisclosureForm: ResidenceDocument = {
  key: 'form_medication_disclosure',
  name: 'Medication Disclosure Form',
  category: 'form',
  version: '2026.07',
  summary:
    'Your current prescriptions on file — so screening is fair, storage is right, and responders can help you.',
  requiresSignature: false,
  narrReferences: ['1.B.6 — MAT nondiscrimination', '2.F.16 — medication safety'],
  iowaChecklist: ['Medication documentation and storage'],
  body: `# Medication Disclosure

**Grace For Addictions — Grace House** *(completed at move-in; update any
time a prescription starts, stops, or changes — updates take two
minutes and keep screening fair)*

Kept confidential per the Confidentiality & Privacy Policy. Disclosing
MAT/MOUD affects nothing about your standing here — see the Medication
Policy's plain-language guarantee.

| | |
| --- | --- |
| Resident | ______________________ |
| Date | ______________________ |

| Medication | Prescriber | Dose / schedule | Requires refrigeration? | Controlled substance? |
| --- | --- | --- | --- | --- |
| ____________ | ____________ | ____________ | yes / no | yes / no |
| ____________ | ____________ | ____________ | yes / no | yes / no |
| ____________ | ____________ | ____________ | yes / no | yes / no |
| ____________ | ____________ | ____________ | yes / no | yes / no |

- [ ] I currently take no prescription medications.
- [ ] I received my locking medication storage box.
- [ ] Emergency responders may be told my medications in a medical
      emergency (recommended — see Emergency Contact & Health Form).

Pharmacy used (optional, helps with refill support): ______________________

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
`,
};
