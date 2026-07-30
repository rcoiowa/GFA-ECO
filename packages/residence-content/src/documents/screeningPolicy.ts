import type { ResidenceDocument } from '../types';

export const screeningPolicy: ResidenceDocument = {
  key: 'screening_policy',
  name: 'Screening Policy & Consent',
  category: 'agreement',
  version: '2026.07',
  summary:
    'How drug and alcohol screening works here: everyone, on a schedule and randomly, with dignity — and what happens after a positive result.',
  requiresSignature: true,
  narrReferences: [
    '3.I.28 — practices that protect a substance-free environment',
    '1.B.6 — dignity and privacy in all procedures',
  ],
  iowaChecklist: ['Written drug/alcohol screening policy and consent'],
  body: `# Screening Policy & Consent

**Grace For Addictions — Grace House**

Screening is how a substance-free house stays substance-free — it protects
your recovery from other people's hard days and their recovery from yours.
It is a safety practice that applies to everyone equally. It is never a
punishment, never a suspicion ritual, and never done to shame anyone.

## How screening works

- **Who:** every resident, without exception. House leadership in
  residence screen on the same basis as everyone else.
- **When:** on a random schedule (typically ___ times per month), at
  move-in, on return from an extended absence, and when there is a
  specific, articulable safety concern — which is explained to you at the
  time.
- **What:** urine screening and/or breath testing for alcohol. The current
  panel is listed on the posted screening schedule. Costs are covered by
  the residence.
- **How:** administered privately by trained staff of the same gender
  wherever possible, in a bathroom with the door closed except where
  observation is specifically required, and never in front of other
  residents. Results are recorded in your file, shared only per the
  Confidentiality & Privacy Policy.

We say "positive" and "negative" — not "dirty" or "clean." Language
matters here, including on paperwork.

## Prescribed medications

Tell us about prescriptions (including MAT/MOUD) at move-in and as they
change, so an expected result is never treated as an unexpected one.
A screening result consistent with your prescription is a **negative**
screen, full stop. See the Medication Policy.

## If a screen comes back positive

A positive screen starts the *Return-to-Use Support Policy* — a safety and
support process, not a court proceeding. In short:

1. You will be told the result privately, the same day it's known.
2. You may say the result is wrong. A confirmation retest (lab
   confirmation where available) is your right, at the residence's cost,
   and no residency decision is finalized while confirmation is pending —
   only interim safety steps.
3. If the result stands, we follow the Return-to-Use Support Policy:
   immediate safety for you and the house, a support conversation, and a
   plan — which may include re-engagement with treatment, a higher level
   of care, or, when the house's safety requires it, a supported
   transition under the Transition & Move-Out Policy.

Refusing a screen without a documented medical or trauma-related reason is
treated as a safety concern and handled through the same conversation-first
process. If a form of screening is hard for you for trauma-related
reasons, tell us — we will find an accommodation (different observer,
different method) that keeps both your dignity and the house's safety.

## Consent

I consent to the screening program described above as a condition of
living in this substance-free residence. I understand how results are
used, my right to confirmation testing, and how my information is
protected.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Prescriptions disclosed (or "none") | ______________________ |

*Version 2026.07 — Grace For Addictions.*
`,
};
