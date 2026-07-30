import type { ResidenceDocument } from '../types';

export const residentAgreement: ResidenceDocument = {
  key: 'resident_agreement',
  name: 'Resident Agreement',
  category: 'agreement',
  version: '2026.07',
  summary:
    'The agreement between you and the residence: what you can count on from us, and what we ask of you.',
  requiresSignature: true,
  narrReferences: [
    '1.A.3.a — fees disclosed before any agreement is signed',
    '1.A.3.c — refund policy disclosed before admission',
    '1.B.5 — rights and requirements communicated before admission',
    '3.G.21.a — person-centered recovery plan with an exit plan',
  ],
  iowaChecklist: [
    'Written resident agreement in place before move-in',
    'Fee and refund disclosure',
    'House expectations provided in writing',
  ],
  body: `# Resident Agreement

**Grace For Addictions — Grace House**

Welcome home. This agreement explains what living at Grace House involves —
what you can count on from us, and what we ask of you. We go through it
together, out loud, before you sign. Nothing in it is meant to surprise you
later; if anything is unclear, ask, and keep asking until it is clear.

You are a person in recovery, not a case number. This is your home while you
live here, and this agreement exists to keep it safe, stable, and worth
coming home to — for you and for every housemate.

## 1. What you can count on from us

- A safe, substance-free home that meets NARR 3.0 standards and Iowa HHS
  recovery housing requirements.
- Your rights, in writing, honored every day (see the *Resident Rights &
  Responsibilities* statement, which is part of this agreement).
- Clear expectations with the reasons behind them — never rules for rules'
  sake.
- Staff and house leadership who are trained, supervised, accountable to a
  code of ethics, and required to treat you with dignity.
- Support for your recovery pathway, whatever it looks like — including
  prescribed medications for addiction treatment. You will never be turned
  away, judged, or treated differently here because your recovery includes
  medication.
- Due process: no one is asked to leave this residence without the steps
  described in the *Transition & Move-Out Policy*, except where immediate
  safety requires action first — and even then, we help you land somewhere
  safe.

## 2. What we ask of you

- **Live substance-free.** Grace House is an alcohol-free and
  illicit-drug-free home. This protects the recovery of every person who
  lives here, including you on your hardest day.
- **Participate in the screening program** described in the *Screening
  Policy* you sign with this agreement. Screening is a safety practice, not
  a suspicion practice — everyone participates, including on random
  schedules.
- **Be honest about a return to use.** Telling us is an act of courage, not
  a confession. Our response is described in the *Return-to-Use Support
  Policy*: safety first, support next, shame never.
- **Keep your commitments to the house**: your responsibilities (chores),
  curfew, house meetings, and the *House Guidelines*.
- **Pay your program fee** as described in the *Fee Schedule & Refund
  Policy*. If money gets hard, tell us early — we would always rather make
  a plan with you than a problem for you.
- **Work your recovery.** Within 30 days of move-in you and your recovery
  support person will build a person-centered recovery plan — your goals,
  your pathway, your pace — including, from the start, a picture of where
  you're headed after Grace House (your transition plan). The plan belongs
  to you.
- **Treat every person in this home with respect.** No violence, no threats,
  no intimidation, no harassment — ever.

## 3. Why the structure exists

Early recovery is a time when the brain is healing. Predictable routines,
real sleep, shared meals, and a home where you know what to expect are not
just "rules" — they are the conditions healing brains need. Cravings,
irritability, and hard days are expected parts of that healing, not
character flaws. The structure in this agreement exists to carry you through
those days, not to catch you failing.

## 4. When an agreement isn't kept

People are human. When a commitment in this agreement isn't kept, our
response follows the grace-based process in the *House Guidelines*: we start
with a conversation, we look for what's underneath, we agree on a
restorative step, and we write down what we agreed so it's fair. Immediate
safety issues (violence, threats, substances in the home) are handled under
the *Return-to-Use Support Policy* and *Transition & Move-Out Policy*, which
you receive with this agreement.

## 5. The documents that travel with this agreement

This agreement incorporates, and you receive copies of:

1. Resident Rights & Responsibilities
2. House Guidelines
3. Fee Schedule & Refund Policy
4. Screening Policy & Consent
5. Return-to-Use Support Policy
6. Medication Policy
7. Overdose Prevention & Naloxone Policy
8. Emergency Procedures
9. Guest & Visitor Policy
10. Good Neighbor Policy
11. Confidentiality & Privacy Policy
12. Personal Property & Move-In Inventory Policy
13. Transition & Move-Out Policy
14. Grievance Policy

## 6. Residence details

| | |
| --- | --- |
| Residence | Grace House, Des Moines, Iowa |
| Support level | NARR Level II (monitored) |
| House leadership | House manager and senior residents, supported by Grace For Addictions staff |
| Move-in date | ______________________ |
| Weekly program fee | $ ____________ (per the Fee Schedule you received before signing) |

## 7. Signatures

I received, reviewed, and had the chance to ask questions about this
agreement and every document listed in Section 5 — including the fee
schedule and refund policy — **before** signing.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Printed name | ______________________ |
| House manager / staff signature | ______________________ Date ________ |

*A signed copy is yours to keep. Version ${'2026.07'} — Grace For Addictions.*
`,
};
