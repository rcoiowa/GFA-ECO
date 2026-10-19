# Concrete access approval — proposed, not applied

Target: **RecoveryOS-Launch**, Supabase project `cqcxvwoukyhxyokfwnjm`, `recoveryos` schema. The code release/branch push is already authorized. This request concerns the newly persistent data-access surface only, not generic release permission.

## Housing and review workspace: routine scoped feature access

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

### Proposed retention default — requires policy approval

- Housing records/history/source references: retain while commitments are open; after closure, retain **365 days**, then purge the closed follow-through package. Canonical intake/application/contact records follow their existing policy and are not deleted by this feature. Reopening resets the closure-based clock.
- Administrator workspace: **90 days after last save**; revisions **90 days from each save**. No indefinite draft archive. New saves retain the current selected draft; users must remove obsolete included content rather than expect revision expiry to edit an active draft automatically.
- Before activation, implement and rehearse the approved scheduled purge with backups limited to the same retention plus a proposed **30-day backup expiry**. Current SQL proposals do not install a purge scheduler. Do not promise these deletion timings until the job and backup lifecycle are verified.
- Legal/operational retention requirements can override these proposed periods through an explicit policy decision, not an implicit permanent default.

Rollback: turn off housing controls; revoke EXECUTE on the three RPCs and SELECT on the two housing read tables; disable admin persistence UI. Preserve data during a **30-day rollback/reconciliation window**, then apply the approved retention policy. Do not blindly drop data or roll back unrelated 0147–0149. No changes to existing helper semantics or 0150/0151 activation are required.

### Parent-ready approval request

> May I apply the reviewed Housing and private Admin Collaboration database changes to RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`)? Existing authenticated users would gain only the two housing SELECT surfaces and three scoped RPCs listed above; existing staff/admin/residence restrictions still apply, with no anonymous access, new staff roles, cross-admin sharing or resident decisions. The new risk is persistent contact/workflow notes and administrator drafts. I propose keeping closed housing history for 365 days, inactive admin drafts/revisions for 90 days, and backups for 30 days, with a tested purge job before activation. This approval would not create the external dot bridge, its credentials or OAuth access.

## Bridge: materially new persistent delegation — separate approval

Bridge code is unmounted and tested locally. It introduces a new external integration principal and transmits only explicitly approved app snapshots to the subscribed dot. It must not inherit all database privileges of the administrator's default Supabase OAuth token.

Proposed private schema/function: `recoveryos_bridge_private.authorized(uuid,uuid,uuid,bigint)` returns only a boolean current authorization decision. Proposed new backend role `recoveryos_bridge_authorizer` receives schema USAGE and EXECUTE on **only this function**, no participant tables, no `authenticated`/`service_role` membership, no BYPASSRLS/DDL. The function checks active nonanonymous/unbanned user, matching current session, explicit production person, active existing platform-admin assignment, real active residence, and for OAuth a current client/consent/session scope. The SQL proposal creates no login role or credential and grants nobody execution. Provisioning this narrow credential is a separate mandatory approval. Inherited PUBLIC privileges must also be inspected/restricted before provisioning it.

The proposed separate Node service has five encrypted SQLite persistence tables on its private volume: `requests`, `replies`, `subscriptions`, `outbox`, `audit`. Only the service process accesses them; there are no new Supabase table grants for these tables. Request and reply scope is authenticated owner + selected residence + request ID, with one immutable reply and idempotency keys. The service cannot execute resident changes. Subscriptions bind the owner, selected residence and verified callback. Admin status grants no access to another administrator's stored exchange.

Proposed implemented bridge defaults: request/reply content **30 days**, metadata-only audit **90 days**, subscriptions at most **1 hour and no longer than the token expiry**, callback secret deletion on expiry/unsubscribe, five delivery attempts, then failed status. Encrypted local volume backups must expire within **30 days**; backup lifecycle is infrastructure work still to verify. The runtime refuses activation unless retention is explicitly approved. There is no access/refresh token persistence. Rollback disables endpoint/dispatcher, unsubscribes, revokes OAuth client consent and backend credential, then removes encryption key/data according to the approved reconciliation/retention policy.

Actual live findings: auth OAuth tables exist; active client count is **zero**. Public discovery verification was blocked by the execution environment's outbound proxy; enablement is unknown, not assumed disabled. Existing repository auth has no configured MCP issuer/client. Standard Supabase OAuth scopes do not restrict database operations; a default `aud=authenticated` token is rejected by the MCP verifier. A resource-specific token with explicit `collaboration:exchange` scope and matching consent is required. The precise supported issuance/consent configuration (or separate existing authorization service) must be verified before asking to enable it; no custom-scope support or token hook is assumed.

Concrete unresolved infrastructure decisions: approved Node host/private volume and verified HTTPS resource URL, supported restricted-token issuer configuration, one pre-registered ChatGPT OAuth client with exact verified redirect, external encryption-key custody and dedicated authorization DB credential. No broad dynamic client registration is proposed. Present the actual URL/client/issuer details at action time; do not ask the user to approve guessed placeholders.

Custom plugin setup is documented on **ChatGPT web**, https://chatgpt.com/plugins → plus → Add custom MCP server. Account/workspace eligibility cannot be verified from these connector tools. The user is on iOS; no claim is made that this setup exists in iOS. There is no install widget yet. Once an authenticated endpoint is reachable, the user must approve the specific connection and this dot's event subscription. A real harmless round trip is still mandatory before displaying Connected.
