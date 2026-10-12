# RCO Iowa back office

Eight custom agent profiles and a human-reviewed operating system for growing RCO Iowa. This is a repository-based starter team, not a deployed back-office web application or unattended AI service. No agent run, outreach, scheduled automation, database access or new account is activated by these files.

## Start
1. Read [OPERATING-AGREEMENT.md](OPERATING-AGREEMENT.md).
2. Select the appropriate profile from [.github/agents](../../.github/agents) in a supported Copilot client with repository access, using this branch. Availability depends on your Copilot account. No access was provisioned in this change.
3. Supply a completed [task brief](TASK-BRIEF.md), or start with the profile's first assignment. If your assistant does not load GitHub profiles, supply the operating agreement and selected profile as instructions.
4. Review the output before authorizing any external action.

| Agent | First deliverable |
| --- | --- |
| [Chief of Staff](../../.github/agents/rco-iowa-chief-of-staff.agent.md) | Weekly top three priorities with owner, dependency and definition of done |
| [Statewide Partnerships](../../.github/agents/rco-iowa-partnerships.agent.md) | Partner map with geography, existing service, access gap, source and verification date |
| [Digital Access and Onboarding](../../.github/agents/rco-iowa-digital-access.agent.md) | Accessible onboarding checklist |
| [Community Programs](../../.github/agents/rco-iowa-community-programs.agent.md) | Draft event run-of-show and accessibility checklist |
| [Funding and Sustainability](../../.github/agents/rco-iowa-funding.agent.md) | Opportunity assessment with eligibility, deadline, source and verification date |
| [Brand and Communications](../../.github/agents/rco-iowa-communications.agent.md) | Website and newsletter drafts |
| [Impact and Learning](../../.github/agents/rco-iowa-impact.agent.md) | Metric dictionary with numerator, denominator, source, period and exclusions |
| [Platform Operations](../../.github/agents/rco-iowa-platform-operations.agent.md) | Incident diagnosis and reversible change proposal |

## Workspaces and systems
- Public site: https://rco-iowa-public.thomas-499.workers.dev/
- RecoveryOS access: https://recoverycommunity.app/
- Community center: https://recoverycommunity.center/
- Website/backend integration: PR #33, still a separate change.
- Supabase RecoveryOS-Launch remains canonical. Public inquiries are source-labelled and stored through the existing intake boundary; that does not create an RCO Iowa staff workspace or grant access to other organizations.
- GitHub holds public/non-sensitive plans, code and reviewed drafts. Participant information stays in authorized RecoveryOS workflows.

## First 30 days
See [LAUNCH-BACKLOG.md](LAUNCH-BACKLOG.md). These are proposed tasks, not scheduled jobs.

## Future authenticated back office
Implement inside RecoveryOS after verifying RCO Iowa's organization identity and staff membership model. Use Supabase Auth and organization-scoped RLS for tasks, approvals, artifacts and audit events; authenticated Edge Functions own writes. Separate operational information from participant records. Approval must bind to exact artifact version, approver, action and expiry; execution must be idempotent and audited. A service-role key must never appear in frontend code. Before activation, prove cross-organization denial, revoked-user denial, artifact-change invalidation and no external action without approval. Do not treat a source label on a lead as a tenant authorization boundary.

No new production tables, grants, agent runtime or dashboard are created by this starter kit. The local development environment was offline during preparation; profiles and manifest were structurally validated in memory, not exercised in a Copilot account.

Configuration reference: https://docs.github.com/en/copilot/reference/custom-agents-configuration
