import type { ResidenceDocument } from '../types';

/**
 * GENERATED from the canonical operational document
 * source-documents/grace-house/GraceHouse_Fee_Schedule_and_Financial_Agreement.docx — regenerate with
 * scripts/import-grace-house-docs (do not hand-edit the body).
 */
export const feeScheduleFinancialAgreement: ResidenceDocument = {
  key: 'fee_schedule_financial_agreement',
  name: 'Fee Schedule & Financial Agreement',
  category: 'agreement',
  version: '2.0',
  summary:
    'Every cost in writing before you apply: shared $175/wk or $650/mo, single $200/wk or $700/mo — with hardship plans always available.',
  requiresSignature: true,
  narrReferences: [
    '1.A.3.a — fees disclosed before any funds accepted',
    '1.A.3.b — accounting for resident financial transactions',
    '1.A.3.c — refund terms disclosed',
    '1.A.2.h — no staff involvement in resident finances',
  ],
  iowaChecklist: ['Fee transparency before admission'],
  body: `# Fee Schedule & Financial Agreement

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Current Fee Schedule (Policy GH-FEES-001)

| Room type | Weekly rate | Monthly prepay (due at start of month) |
| --- | --- | --- |
| Shared (double) room | $175 / week | $650 / month |
| Single (private) room | $200 / week | $700 / month |

Program fees cover housing, utilities, household supplies, and program participation. Grace House is a program participation fee model — not a landlord-tenant lease.

## My Agreement

My room type: [ ] Shared — $175/wk or $650/mo prepay [ ] Single — $200/wk or $700/mo prepay

Payment cadence: [ ] Weekly, due each ______________ (day) [ ] Monthly prepay, due the 1st

Payment methods: [ ] Cash [ ] Money order [ ] Electronic transfer (details from House Manager)

I understand and agree:

- Fees are due on the agreed day. If I anticipate difficulty, I will speak with the House Manager before the due date — hardship payment plans are always available and never punitive.

- Non-payment for more than 7 days without an approved plan may begin an administrative review.

- Fees are non-refundable for the current period except in emergency or administrative error.

- Grace House never manages, holds, or controls my personal finances.

- My fee continues during an approved furlough (my bed is held).

## Payment Record

| Date | Amount | Method | Period covered | Receipt # | Staff initials |
| --- | --- | --- | --- | --- | --- |
| ______ | $______ | ________ | ____________ | ________ | ______ |
| ______ | $______ | ________ | ____________ | ________ | ______ |
| ______ | $______ | ________ | ____________ | ________ | ______ |

Participant signature: ______________________________ Date: ____/____/______

House Manager signature: ______________________________ Date: ____/____/______
`,
};
