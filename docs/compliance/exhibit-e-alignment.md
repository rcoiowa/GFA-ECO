# Exhibit E (Opioid Settlement) — Platform Alignment

Source: _GFA Exhibit E Alignment Analysis_ (Iowa HHS FY26 Round 2 Opioid
Settlement Funding), stored at
`docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf`. GFA aligns with
9 of 12 major Exhibit E use categories; the platform's job is making those
alignments **auditable** — Cluster 5 of the analysis ("JUST GRACE Data
Platform & Outcomes Infrastructure") is this codebase.

## What the platform evidences today

| Exhibit E use                                                 | Platform evidence                                                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Sch-A/I, B-J.1, L.1 — evidence-based data collection          | `service_events` attribution spine; BARC-10 assessments; check-in engagement; all queryable in real time                          |
| B-J.2 — outcomes dashboard                                    | Staff Reports → Iowa HHS / Exhibit E Outcomes Report (aggregate metrics with verbatim citations + CSV export for grant reporting) |
| Sch-A/B.4, B-B.4, B-H — medication-inclusive recovery housing | Grace House + EJWRH operations: occupancy (bed board), admissions, MAT-affirming policy set                                       |
| B-B.1, B-B.2, B-B.3 — wrap-around and continuum services      | Service events by category (peer support, coaching, navigation); supervision reports                                              |
| Sch-A/E.2, C.11 — warm hand-off                               | Referral intake queue (public directory → staff triage, timestamped)                                                              |
| B-D (justice-involved)                                        | EJWRH (Iowa DOC approved) residency + supervision compliance reports                                                              |
| Sch-A/A (naloxone)                                            | Emergency Response Protocols; naloxone training within 7 days of intake (orientation checklist); NARR 2.F.19.d tracking           |
| B-B.12 — stigma reduction                                     | Person-first language standard enforced across every document and UI string (`docs/language-guide.md`)                            |
| K.1 — training capacity                                       | Canonical trauma-informed/neuro-informed document set, exportable                                                                 |

## Reporting workflow

1. Staff → Reports → "Compile 90-day outcomes" produces the aggregate
   table (people served, residents housed, admissions, service events,
   screenings, meetings), each row citing its Schedule A/B use.
2. "Download CSV" produces the grant-upload file
   (`exhibit-e-outcomes-<date>.csv`).
3. Counts are aggregates only — 42 CFR Part 2 / HIPAA minimum-necessary:
   no participant identifiers appear in the export (per the analysis's
   Data Use and Privacy note).

## Roadmap hooks from the analysis

- Cluster 5 asks: automated BARC-10 administration cadence + public-facing
  accountability portal — the assessment engine and directory site are the
  natural mounting points.
- FY25 headline outcomes (44.7:1 ROI, 68% retention, 90% navigation
  success, 83% BARC-10 remission trajectory) become continuously
  computable once historical data is migrated into `service_events`.
- District 5 (Polk County) Advisory Council alignment and multi-cluster
  application strategy are organizational actions; the platform supplies
  the audit-ready numbers.
