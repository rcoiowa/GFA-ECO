import type { ResidenceDocument } from '../types';

export const confidentialityPolicy: ResidenceDocument = {
  key: 'confidentiality_policy',
  name: 'Confidentiality & Privacy Policy',
  category: 'policy',
  version: '2026.07',
  summary:
    'Who can know what about you: your information is yours, sharing requires your written consent, and the exceptions are listed — all of them.',
  requiresSignature: false,
  narrReferences: [
    '1.A.2 — policies keeping resident records confidential',
    '1.B.6 — privacy as a resident right',
  ],
  iowaChecklist: ['Confidentiality policy and consent-based information sharing'],
  body: `# Confidentiality & Privacy Policy

**Grace For Addictions — Grace House**

Trust is load-bearing in this house. You cannot heal in a place where you
have to guard your own story, so this policy makes the walls around your
information explicit — including exactly where the doors are.

## The default: your story is yours

- Your presence here is confidential. Callers and visitors are told
  "I can't confirm whether anyone by that name lives here" — including
  family, employers, and officials without legal process.
- Your records (residency, screening results, medications, grievances,
  recovery plan) are kept in RecoveryOS with access limited to staff who
  need them for their role. Every access is logged and auditable.
- Substance use disorder records receive the heightened protection of
  42 CFR Part 2 where it applies: they may not be shared — even with
  other health providers — without your specific written consent, and
  redisclosure without consent is prohibited.
- Housemates' obligation: what you see and hear in this house about
  another resident's recovery stays here. Breaking a housemate's
  confidence is a serious community harm, handled as such.

## Sharing with your consent

Any sharing beyond house operations happens through a signed **Release of
Information** — specific about *who*, *what*, and *until when*. You can
revoke any release at any time, in writing, with effect going forward.
Declining a release never affects your residency or services. Common
examples: coordination with your treatment provider, updates to a family
member, verification for probation/parole, referrals.

## The exceptions — all of them

We share the minimum necessary information without consent only when:

1. **Someone is in immediate danger** — medical emergencies (responders
   are told what they need, e.g., medications), or a credible threat of
   serious harm to you or another person.
2. **The law requires it** — mandatory reports of child or dependent
   adult abuse (Iowa Code chs. 232 & 235B), a valid court order (for
   Part 2 records, only a compliant order), or public-health reporting.
3. **De-identified program data** — counts and outcomes with identity
   removed, used for program improvement and funder reporting. Your
   consent choices in the app control anything beyond that.

If an exception is ever used, you are told what was shared, with whom,
and why — as soon as safety allows.

## Your access

You may read your own file and receive a copy within five business days
of asking. If something in it is wrong, you may correct it or attach a
statement of disagreement. Records are retained per organizational
policy and destroyed securely.

## If privacy is breached

Report it through the Grievance Policy — or straight to the program
director. Breaches by staff are discipline matters; we tell you what
happened, what we did, and what changes.

*Version 2026.07 — Grace For Addictions.*
`,
};
