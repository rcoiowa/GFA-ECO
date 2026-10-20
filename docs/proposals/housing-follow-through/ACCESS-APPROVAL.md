# Access scope and activation status

Housing Follow-through and owner-private Admin Collaboration database activation was approved
and applied to RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`) as migration
`20261020010443_housing_follow_through_private_admin_collaboration`.
See [the exact SQL and verified activation record](ACTIVATION.md).

## Applied scope

| Object | Existing PostgreSQL role / operation | Enforced scope |
|---|---|---|
| `housing_follow_through` | `authenticated`: SELECT only | A canonical intake must be visible through its existing RLS; no new organization/residence visibility |
| `housing_follow_through_events` | `authenticated`: SELECT only | Same intake RLS; server-stamped actor/time; client cannot update/delete history |
| `housing_source_references` | No `public`, `anon` or `authenticated` direct operations | Used only inside the authorized mutation; global source-reference deduplication; no separate person registry |
| `act_housing_follow_through(bigint,integer,text,jsonb)` | `authenticated`: EXECUTE | Authenticated canonical person with explicit production classification; existing residence-staff OR care-operations authority; current owner for ordinary actions; proposed recipient alone accepts handoff; version check and row lock |
| `admin_collaboration_workspaces` | No direct client operations | Owner is server-derived canonical person; one selected residence |
| `admin_collaboration_revisions` | No direct client operations | Same owner/residence; immutable server-stamped snapshots |
| `read_admin_collaboration_workspace(bigint)` | `authenticated`: EXECUTE | Existing platform admin plus existing residence/care-operations authority AND explicit production classification; owner-private |
| `save_admin_collaboration_workspace(bigint,integer,jsonb)` | `authenticated`: EXECUTE | Same gate; intake must match residence, resident IDs must be in the selected active roster; optimistic version; review-only decisions |

`public` and `anon` gain no access. No new staff role, role assignment, cross-administrator sharing, coaching shortcut or delegation is introduced. Existing platform admins/care-operations staff retain their existing global residence authority; this proposal does not falsely describe them as restricted to a single organization. Ownership is workflow responsibility and never grants visibility. The concrete risk is storing sensitive contact/follow-through notes and private administrator drafts behind new RPCs; a bug in these routines could expose or corrupt those new records. Existing participant/admission/inventory/coaching records are not mutated by these routines.

## Excluded from this approval

Automatic permanent deletion and every retention/purge job remain unapproved and unapplied.
`retention-schema.sql` is still a proposal, not part of activation. No cleanup was installed
or scheduled. Any retention policy, purge execution or destructive rollback needs separate approval.

The dot bridge is also excluded: no bridge schema/roles/credentials, OAuth client/grant,
token hook, encryption key or subscription was created. Its completed Edge/Postgres code
and exact deployment prerequisites are documented in the
[bridge README](../../../workers/collaboration-proposal/README.md) and
[verification record](../../../workers/collaboration-proposal/FEASIBILITY.md).
These supersede earlier Node host, SQLite and custom OAuth scope proposals.

Database activation does not deploy the app, enable feature flags or establish a conversation
connection. The native Mac custom MCP setup dialog is available; no endpoint has been entered.
The next setup step is read-only inspection of existing Supabase OAuth Server and Custom Access
Token hook configuration, without secret values. Bridge provisioning/activation remains a
separate, concrete approval after that configuration and the resource URL are verified.

Non-destructive containment if needed: disable feature controls and revoke the new SELECT/RPC
grants, preserving records for review. Do not drop data, alter existing helper semantics or
roll back unrelated migrations under this activation approval.
