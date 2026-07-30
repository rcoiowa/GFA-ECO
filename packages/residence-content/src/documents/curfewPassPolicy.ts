import type { ResidenceDocument } from '../types';

/**
 * GENERATED from the canonical operational document
 * source-documents/grace-house/GraceHouse_Curfew_and_Pass_Policy_with_Request_Form.docx — regenerate with
 * scripts/import-grace-house-docs (do not hand-edit the body).
 */
export const curfewPassPolicy: ResidenceDocument = {
  key: 'curfew_pass_policy',
  name: 'Curfew & Pass Policy + Request Form',
  category: 'policy',
  version: '2.0',
  summary:
    'Phase-based curfew (GH-CURFEW-001 v3.0), employment as the only exception, and the overnight pass / furlough request process.',
  requiresSignature: false,
  narrReferences: [
    '2.F.16.e — residents encouraged to take responsibility for safety',
    '3.I.27 — functionally equivalent family rhythms',
  ],
  iowaChecklist: ['Overnight/pass procedures in writing'],
  body: `# Curfew & Pass Policy + Overnight Pass / Furlough Request Form

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Curfew Policy (GH-CURFEW-001 v3.0 — supersedes all prior versions)

| Phase | Weeknight (Sun–Thu) | Weekend (Fri–Sat) |
| --- | --- | --- |
| Phase 1 (Days 1–30) | 9:00 PM | 10:00 PM |
| Phase 2 (Days 31–90) | 10:00 PM | 11:00 PM |
| Phase 3 (Days 91+) | 11:00 PM | Midnight |

- Hard ceiling: no curfew extends past midnight in any phase.

- The only exception is current employment. A verified work schedule on file with the House Manager adjusts curfew for scheduled shifts plus reasonable travel time. No other exceptions.

- More than three curfew violations in 30 days results in a community accountability conversation and possible phase-curfew reset.

## Overnight Pass / Furlough

- Available after 60 days of residency, in good standing.

- Written request 48 hours in advance; bed is held; weekly fee continues.

- Check-in expectations during leave are set at approval.

## Request Form

Resident: ______________________________ Phase: ____ Days in residence: ______

Type: [ ] Employment curfew adjustment (attach schedule) [ ] Overnight pass [ ] Furlough (multi-night)

Dates: from ____/____/______ to ____/____/______

Destination & host: ______________________________________________

Contact number during leave: ______________________

Reason: [ ] Family visit [ ] Family emergency [ ] Medical [ ] Court [ ] Employment [ ] Other: __________

Support plan while away (meetings, coach contact, medication plan):

Resident signature: ______________________ Date: ______

Decision: [ ] Approved [ ] Approved with conditions: ______________ [ ] Not approved — reason: ______________

House Manager: ______________________ Date: ______ Return confirmed: ______ (date/initials)
`,
};
