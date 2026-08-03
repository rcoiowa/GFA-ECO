# Grace House canonical content intake

Owner-supplied Grace House documents, extracted to markdown for build reference.
**These are the authoritative policy source** — they supersede the placeholder
resident-rights draft flagged in ADR-0007. Received 2026-08-02 (15 documents).

Extraction is text-only (structure preserved, form layout flattened). The
original `.docx` files remain the legal originals; nothing here replaces them.

## What arrived

| Document | Words | Drives |
| --- | --- | --- |
| Complete Operational System v2 | 12.3k | **Master**: resident handbook, staff ops manual, full form packet, NARR Level II crosswalk, participant agreement |
| Intake Forms Package | 3.1k | Admissions pipeline forms (inquiry → screening → intake) |
| Grievance Policy & Form | 2.6k | Grievance flow, rights, timelines, appeal |
| Emergency Response Protocols | 2.4k | Overdose/naloxone, crisis, fire, medical — Support Now + staff alerts |
| Incident Report System | 2.2k | Incident categories, reporting timeline, severity |
| Code of Conduct | 2.1k | House expectations, values, non-negotiable safety standards |
| Application & Pre-Screening Form | 404 | Public application (Parts A–F) |
| Change Course Leaders Policy | 318 | Partner-program boundary (independent org) |
| Code of Ethics | 294 | Staff/house lead/peer mentor/volunteer conduct (NARR core) |
| Drug & Alcohol Screening Policy & Consent | 293 | Screening cadence by phase + consent |
| Fee Schedule & Financial Agreement | 273 | Program fee model, rates, payment record |
| Curfew & Pass Policy + Request Form | 273 | Phase-based curfew, pass/furlough requests |
| Medication & MAT/MOUD Policy | 266 | MAT affirmation, disclosure log, controlled-med counts |
| Exit & Transition Policy | 224 | Exit types, transition planning, exit record |
| Good Neighbor Policy | 196 | Community standards, neighbor concern log |

## Operating rules the build must honor (extracted, verbatim in source)

**Phase model** drives nearly everything — Phase 1 (days 1–30), Phase 2 (31–90),
Phase 3 (91+):

- **Curfew** — P1: 9:00 PM weekday / 10:00 PM weekend · P2: 10:00 / 11:00 ·
  P3: 11:00 / midnight. Hard ceiling: never past midnight. Only exception is
  verified employment on file with the House Manager.
- **Screening** — P1: at intake, then random up to 2×/week · P2: 1×/week random
  day · P3: random, minimum monthly. **A refused screen is treated as positive.**
- **Recovery activities per week** vary by phase (see Operational System).

**Fees** — program participation fee model, explicitly *not* landlord-tenant:
shared $175/wk or $650/mo prepay; single $200/wk or $700/mo prepay.

**MAT/MOUD** — fully supported, never a barrier to admission; staff may never
disparage it. Screening policy protects prescribed medications.

**Eligibility pathways** — recovery pathway *and* family pathway (parent,
partner, or child affected by SUD/mental-health trauma).

**Fair housing** — admission decisions comply with the Fair Housing Act;
outcomes are admit / waitlist (numbered) / refer.

**Contact block** (appears in every form): Grace House · 1311 9th Street, Des
Moines, Iowa 50314 · Office 515-220-8771 · Warmline 515-310-DIAL (3425) ·
gracehouse@graceforaddictions.org

## Build implications (queued, not yet built)

1. **Support Now** — replace placeholder numbers with the verified GFA office and
   warmline above (closes the ADR-0007 gap).
2. **Documents engine** — these become real `document_templates` +
   `document_versions`, assigned at admission with signature capture.
3. **Phase model** — add resident phase to `residencies`; curfew and screening
   cadence derive from phase rather than a single fixed schedule.
4. **Admissions pipeline** — public application (Parts A–F) → staff review →
   admit/waitlist/refer, in the staff workspace.
5. **Incidents, grievances, screenings, fees, exits** — staff workspace forms
   built to these categories, timelines, and logs.
6. **Emergency protocols** — staff-facing quick reference; overdose response
   feeds the safety layer.

## Still expected

The owner is uploading in batches of five. Additional documents will be appended
here as they arrive; the build starts when the owner confirms the set is complete.
