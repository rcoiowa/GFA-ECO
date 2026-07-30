import type { ResidenceDocument } from '../types';

export const feeAgreement: ResidenceDocument = {
  key: 'fee_schedule_refund_policy',
  name: 'Fee Schedule & Refund Policy',
  category: 'agreement',
  version: '2026.07',
  summary:
    'Every cost of living here, in writing, before you sign anything — plus exactly how refunds work.',
  requiresSignature: true,
  narrReferences: [
    '1.A.3.a — full fee disclosure prior to admission',
    '1.A.3.b — transparent accounting of resident funds',
    '1.A.3.c — refund policy disclosed before a binding agreement',
    '1.A.3 — no requirement to sign over paychecks or public benefits',
  ],
  iowaChecklist: ['Fee transparency before admission', 'Written refund policy'],
  body: `# Fee Schedule & Refund Policy

**Grace For Addictions — Grace House**

Money stress is recovery stress, so we keep this simple and honest: every
cost is on this page, you see it **before** you sign anything, and there
are no fees that aren't written here.

## Fee schedule

| Item | Amount | When |
| --- | --- | --- |
| Program fee (covers your bed, utilities, and house supplies) | $ ________ / week | Due each ________ |
| Move-in deposit (refundable — see below) | $ ________ | At move-in |
| Late payment fee | None. We make payment plans, not penalties. | — |
| Application fee | None | — |
| Screening costs | Covered by the residence | — |

- Fees are payable by ____________________ (methods).
- Receipts are provided for every payment, every time, and your payment
  history is available to you on request and in the app.
- **We will never require you to sign over a paycheck, public benefit
  (SNAP, SSI, SSDI, FIP), or tax refund, or to surrender control of your
  money as a condition of living here.**

## If money gets hard

Tell the house manager **before** the due date if you can. Job loss, cut
hours, or a family emergency will be met with a payment plan conversation,
not a move-out notice. Nonpayment alone never results in a same-day exit,
and any residency decision related to fees follows the full due-process
steps in the Transition & Move-Out Policy.

## Refund policy

- **Move-in deposit:** refunded within 14 days of move-out, minus only
  documented costs for damage beyond normal wear (itemized in writing) or
  unpaid fees you've agreed are owed.
- **Program fees:** charged only for time in residence. If you move out
  mid-week — for any reason, including an involuntary transition — the
  unused portion of any fee paid in advance is refunded on a per-day
  basis within 14 days.
- If you disagree with any charge or withholding, the Grievance Policy
  applies, and disputed amounts are documented in writing.

## Our accounting commitments to you

- Your payments are recorded in the organization's accounting system the
  day they're received.
- Resident funds are never commingled with anyone's personal money.
- A full statement of your account is available to you at any time within
  two business days of asking.

## Acknowledgment

I received this fee schedule and refund policy, reviewed it, and had my
questions answered **before** signing my Resident Agreement.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
`,
};
