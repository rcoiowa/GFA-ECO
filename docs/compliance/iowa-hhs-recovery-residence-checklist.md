# Iowa HHS Recovery Housing Protocol & Checklist — Mapping

Iowa HHS publishes the **Recovery Housing Protocol & Checklist (form
470-0025, rev. 06/2025)**, built on the NARR standards and levels. It
governs eligibility for Iowa HHS recovery-housing reimbursement and the
state's recognition of certified residences (certification via the
NARR-affiliate pathway).

> **Sourcing note:** hhs.iowa.gov could not be fetched from this build
> environment, so this mapping is organized around the checklist's known
> NARR basis plus Iowa-specific requirements. Before submission, walk the
> actual 470-0025 form line-by-line against this document — and reconcile
> with the organization's uploaded rules document when provided.

## NARR-based core (see full mapping)

The bulk of 470-0025 tracks NARR 3.0. Every item in
`docs/compliance/narr-3.0-level-2-mapping.md` applies; that file maps each
domain/standard to its evidencing document or platform feature.

## Iowa-specific and emphasized items

| Checklist area                                            | Where it's met                                                                                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| NARR level declared                                       | Level II (monitored) — Resident Agreement §6                                                                                                     |
| Fire safety: detectors, CO, extinguishers, egress, drills | Emergency Procedures §Fire (monthly tests, 2×/year drills, logs) **[operational: inspection records]**                                           |
| Naloxone on site + trained personnel                      | Overdose Prevention & Naloxone Policy (locations, monthly checks, staff training required, resident training offered; Iowa standing order noted) |
| Iowa Good Samaritan / 911 protection                      | Overdose policy §The promise (house protection stated as broader than statute)                                                                   |
| Emergency numbers + procedures posted                     | Emergency Procedures (posted locations listed; Your Life Iowa + 988 included)                                                                    |
| Severe weather plan (tornado/winter)                      | Emergency Procedures §Severe weather (Iowa-specific)                                                                                             |
| Written resident agreement                                | Resident Agreement (signed, copy to resident)                                                                                                    |
| Fee transparency + refund policy                          | Fee Schedule & Refund Policy (before-signing attestation)                                                                                        |
| No benefit signover                                       | Fee policy + Resident Rights §8                                                                                                                  |
| Drug/alcohol screening policy + consent                   | Screening Policy & Consent (signed)                                                                                                              |
| Return-to-use response, safe exits                        | Return-to-Use Support Policy (no street discharges; documented safe landing)                                                                     |
| MOUD/MAT nondiscrimination                                | Medication Policy (explicit welcome section); Resident Rights §4                                                                                 |
| Medication storage                                        | Medication Policy §Storage (personal lockboxes, logged emergency access)                                                                         |
| Grievance procedure incl. state contact                   | Grievance Policy (Iowa HHS and affiliate listed as external contacts)                                                                            |
| Confidentiality, 42 CFR Part 2 awareness                  | Confidentiality & Privacy Policy; ROI form (Part 2 notice)                                                                                       |
| Mandatory reporting (Iowa Code chs. 232/235B)             | Confidentiality Policy §Exceptions                                                                                                               |
| Good neighbor practices                                   | Good Neighbor Policy                                                                                                                             |
| Occupancy within capacity                                 | `residences.capacity` = 12; bed-level tracking in schema **[operational: local occupancy/zoning compliance]**                                    |
| Incident documentation                                    | Incident Report Form + `incidents` table + quarterly review                                                                                      |
| House rules in writing                                    | House Guidelines                                                                                                                                 |
| Background checks for staff                               | Code of Ethics §Accountability **[operational]**                                                                                                 |
| Data/outcomes reporting capability                        | `service_events` spine + analytics views (people-served dedup)                                                                                   |

## Registry/reimbursement workflow

1. Complete NARR-affiliate Level II certification (binder checklist at the
   end of the NARR mapping doc).
2. Submit 470-0025 with certification evidence to Iowa HHS.
3. Keep logs current (detector/naloxone checks, drills, meetings,
   screenings, incidents) — the platform's tables are the system of
   record; exports serve audits.
