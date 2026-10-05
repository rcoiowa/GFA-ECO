# GFA Circle county, recording access, and meeting schedules

Authority: Thomas DeGarmeaux's October 5, 2026 follow-up directs county on occurrence records; recording by Coaches, Navigators, Program Coordinators, Residence Staff and Residence Managers; weekly Hope+Elim details; and closed CBH circles recordable by coach/navigator or a graceforaddictions.org account.

## Implementation

- County means meeting-location county. Series defaults are copied to each new occurrence so later series edits do not rewrite historical geography. Existing Hope+Elim records receive Polk County; participant/facilitator counts, topic and original attestation remain unchanged.
- GFA recovery-circle series allow active, applicable coach, navigator, program_coordinator, residence_staff and residence_manager roles. Organization/program/residence assignments must match the series organization; unscoped global assignments remain applicable. Explicit assignments continue for ordinary circles.
- Program Coordinator is a distinct narrow role. It opens Circle logging, not the Program Manager workspace or broader housing/participant permissions. Existing admin role assignment controls remain authoritative.
- CBH's specific rule supersedes the general role/assignment rule: applicable coach or navigator, OR an exact, verified graceforaddictions.org email in the current Auth user record. User-editable metadata and token email claims are not authorization. Anonymous, deleted and banned accounts are denied. Changing/revoking credentials takes effect on the next call.
- The same predicate governs recording and aggregate-only workspace readback. New records use staff_attested; existing facilitator_attested evidence is preserved. No participant identities or clinical records are collected. Direct table access remains restricted.
- Hope+Elim: public; 2500 University Ave, Des Moines, IA 50311; 3rd Floor, Room #306; Polk County; every Tuesday 6:30–7:30 PM America/Chicago. Defaults remain editable for the actual occurrence.
- CBH: separate inpatient/outpatient choices, explicitly **Closed — CBH clients only. Not open to the general public.** Selected Tuesdays each month, with no invented dates or times. Catalog/form/record labels retain the closed designation. This change does not publish an external calendar or expose occurrence data publicly.
- CBH address: 1450 NW 114th Street, Clive, IA 50325. Address source: https://yourlifeiowa.org/locations/clive-behavioral-health ; county corroboration: Polk County AQD source list https://www.polkcountyiowa.gov/media/dpehszeq/source-list-by-name-08-28-2023.pdf . Meeting frequency and eligibility are Thomas's report, not claims from these sources.
- Role navigation adds Circle logging to Navigator and Residence Operations, Program Coordinator routing, and the workspace switcher. Email-based navigation is only a hint; the server validates the account.
- Schedule configuration creates no held meetings and no service events. Existing duplicate protection and 15 participants + 2 facilitators = 17 reporting remain intact.

## Verification

Database fixture tests cover all five general roles, the narrower CBH subset, exact verified domain, unverified/lookalike/subdomain rejection, spoofed token email, revoked roles, banned accounts, foreign organization/residence denial, direct-row and participant/housing access denial, county snapshots, closed labels, duplicate prevention and cancelled exclusion. UI tests cover county/time defaults, separate counts, and switching to CBH without carrying over attendance/time defaults. Typecheck, platform tests and exact-commit CI gate deployment.

This supersedes only the assignment-only authorization portion of the earlier October 5 Circle implementation. Other Track B and intake gates remain unchanged. ICARE metadata remains optional human-selected programming context, never participant assessment or progression.
