# Circle meeting logging — executive authorization and implementation

Thomas DeGarmeaux explicitly directed implementation on October 5, 2026: extend existing meetings for community occurrences and aggregate attendance; authorize assigned facilitators without broader participant/housing access; add **Log a Circle meeting**; verify saving, duplicates, access, and reporting using September 29. This authorizes this B1 slice beyond the September 5 analysis-only pass. It does not activate other Track B work.

## Behavior

- Existing `recoveryos.meetings` remains the occurrence store. `meeting_series` supplies organization, canonical service type, location and timezone. `meeting_facilitator_assignments` grants only Circle recording/read access.
- Authenticated invoker RPCs delegate to private, narrowly checked definer functions. Direct API access to Circle occurrences is restricted, including through the existing broad community-meeting read policy. New assignment/configuration tables are RLS enabled with no direct client grants.
- Recording derives organization, service type, location, recorder, timestamp and provenance. Held/cancelled is explicit. Participant counts exclude facilitators; total attendance is generated. Optional ICARE/domain/theme describes programming, never participant state or outcomes.
- A database unique index on series/start time prevents concurrent duplicates. Identical retries return the existing ID. Differing data returns `duplicate_conflict`, never overwrites evidence.
- `/coach/circles` requires a signed-in person and a server-side assignment, not a broad coach role. Existing Coach Workspace roles remain unchanged elsewhere.
- Reporting shows up to the latest 200 scoped records, labels that limit, excludes cancelled meetings from delivered counts, and reports participant and facilitator attendances separately. It does not claim unique reach, individual service delivery or completed peer connections. No synthetic participants or service_events are created.
- Facilitator names are historical attendance evidence; entering a name does not grant access.

## Verified example and activation

September 29, 2026, Hope+Elim, 6:30–7:30 PM America/Chicago: 15 participants, Thomas DeGarmeaux and Archaletta facilitating, 17 total present. Topic: Slogan 31: Speak well of others in recovery; Empower / Social / Community Building.

The migration was applied to canonical CQCX. The occurrence was saved as meeting ID 1 on the Executive Director's explicit report, through the recording RPC using his canonical operational identity. Thomas was assigned to the Hope+Elim Circle. No broad roles were granted. Archaletta's documented name/email did not resolve to an existing person/account, so no account or identity was fabricated. Her historical facilitator name is retained; personal login access remains pending identity resolution/provisioning.

## Verification

PGlite PostgreSQL tests: save, repeat, conflicting duplicate, other-series denial, revoked assignment denial, anonymous denial, direct table denial, assignment self-grant denial, invalid inputs, 15+2=17 and cancelled exclusion. Live checks: exact repeat returns existing ID, conflicting count rejected, unassigned existing account cannot record/read Circle data, one held meeting reports 15+2=17. TypeScript and 181 platform tests passed; production build passed. Deployment status is reported separately after publish.

## Operational limits

This release logs completed or cancelled occurrences. Series are reusable location/program definitions, not automatic calendar generators. Scheduled recurrence generation, individual attendance, edit/correction workflow, organization-wide reporting UI, and self-service assignment management are outside this slice. An admin can assign/revoke via `assign_circle_facilitator`; this never grants a broad role. Existing recurrence schedules were not inferred from one meeting's actual duration.

ICARE applicability: Identify/Connect/Assess/Respond/Empower are optional human-selected content classifications only; no participant workflow progression occurs in this form.
