# Persistence, second review, transport and deployment

## Second review findings and fixes

1. **Residence context leakage:** draft selection formerly allowed changing residence while keeping prior in-memory content. Now each private workspace is keyed by server-derived administrator identity and one residence; switches clear prior context and are blocked while dirty. The server independently rejects cross-residence intake/items and residents outside the selected active roster.
2. **Approval versus execution:** review decisions remain data only. No provider call, messages, resident mutation, disciplinary action or eligibility/housing decision is executed. The server rejects `executed`/unknown decision states and incomplete approval. Saving a review creates a server revision, not an operational authorization.
3. **Audit trust:** client annotation actors/times are not authoritative. Immutable server revisions derive the actual actor/time/version and retain each full snapshot. A caller cannot supply another workspace owner, directly write a table or delete revisions. Each administrator's draft is private; new sharing permissions are not introduced.
4. **Duplicate external submissions:** source/reference uniqueness now spans all housing intakes, so the same source submission cannot silently attach to two intakes. Two distinct Contact Connect submissions can remain distinct references on one intake; they never create additional people/applications. Ambiguous dates remain text or explicitly unknown.
5. **Concurrent handoff acceptance:** two actual PostgreSQL sessions accepting the same proposed transfer/version yield exactly one success and one stale-version refusal, with one accepted-owner event. Draft saving similarly has exactly one winning revision. Locks and versions prevent last-writer-wins loss.
6. **Conversion:** completed contact and outstanding housing work remain keyed to intake and survive conversion. Closing housing does not close inquiry commitments; their source history and due dates remain visible. The isolated application-schema test now calls canonical conversion and verifies this preservation. Production-parity staging remains a prerequisite.
7. **Organization/residence boundaries:** RPCs reuse existing classification-aware authorization, never coaching claims or new role helpers. Housing requires existing residence/care-operations authority; collaboration additionally requires platform administrator authority and remains owner-private. Residence-specific IDs are validated server-side. Contract tests use synthetic stubs; the additional application-schema replay uses real canonical RLS/helpers and conversion with synthetic identities across organizations. Metadata-only live verification found 0149 applied, 0151 absent and the old is_production_person helper permissive for unclassified identities. New write/admin read RPCs now require an explicit production classification directly, without redefining existing helpers. Production-parity verification remains required.

## Concrete transport needed (design only; not implemented)

The durable adapter already uses the authenticated Supabase RPC transport and server-derived current person. No additional token or secret is embedded in the frontend.

The official MCP Events route supports dots. The separate [disconnected endpoint proposal](../../../workers/collaboration-proposal/README.md) prepares scoped request/reply/status tools and event methods. It requires approved OAuth, durable owner-private request/outbox persistence and DNS-safe callback egress adapters; those adapters and an actual ChatGPT round trip are not implemented. It is not mounted by the production worker. No generic model-provider session substitutes for this dot.

Only explicitly selected app exchanges would appear in RecoveryOS. MCP Events does not stream or expose this private transcript. Callback acceptance is not a completed response. Account/workspace availability and installation remain unverified. See the linked proposal for exact approvals and the harmless round-trip gate.

## Deployment checklist

### Ordinary code release (still not deployed from this branch)

- Review/cherry-pick this branch independently of PR40 and unrelated releases; run the build and tests.
- Keep `VITE_HOUSING_FOLLOW_THROUGH_ENABLED` off. Without the collaboration RPC schema, show persistence unavailable and disable drafting/saving; do not fall back to localStorage or silently unsaved mode.
- Exclude the separate synthetic Vite config/harness from production serving. It has no application credentials and is never imported by the normal build.
- Verify intake conversion remains visible, existing routes remain guarded, and normal release rollback works.

### Requires specific database/activation approval

- Verify actual target schema, organization/residence policies and strict actor classification; do not infer live state from prepared/dark labels.
- Review `schema.sql` and `collaboration-schema.sql`, generate approved ledger migrations through the normal repository process, and test on a full-schema isolated staging database.
- Verify RLS/RPC grants, revoked/fixture/unclassified users, cross-organization/residence access, concurrency, and canonical conversion. Confirm retention/backup and administrator privacy policy.
- Explicitly approve and apply migrations. Only then activate housing controls and verify durable save/reload on staging followed by approved production smoke checks. No real-case source linking is included in this build.
- Roll back by disabling controls and revoking new RPC access while retaining history for reconciliation; do not drop audit data as a routine rollback.

### Separate approvals, not covered by code or schema activation

- Model-provider connection, credentials, retention/disclosure terms, exact-context transmission consent and supported authenticated bridge.
- Cross-administrator sharing or any access expansion.
- Any operational execution adapter or real person/source/residence linking; each operation needs its existing safe path and explicit authorization. Group chatter must never automate discipline, eligibility, housing, disclosure or risk labels.

## Delivery status

Branch is pushed for review: https://github.com/rcoiowa/GFA-ECO/pull/41 (draft). No merge, deployment or production migration has occurred. Native Library attachments are the delivery path for mobile review. Local filesystem/localhost references in developer instructions are not user-accessible preview links.

## Application-schema integration evidence

`test-full-schema.py` replays repository launch migrations and the captured legacy intake table, including actually applied prepared 0147–0149; it does not apply 0150/0151. It uses only synthetic identities. The canonical conversion test passes with real role helpers, RLS, foreign keys and audit triggers; it verifies contact/work preservation, cross-organization residence isolation, unclassified cover/actor rejection, revoked staff rejection and private admin save/restore.

Explicit infrastructure/content exclusions: 0104 pg_cron scheduling (extension absent in isolated PostgreSQL), 0146 document edition activation (requires pre-existing content editions), synthetic auth.users/auth.uid and empty storage bucket catalog. These exclusions prevent a claim of complete live-schema/runtime parity. The production-connected staging workflow is NOT an isolated database. Do not run synthetic integration tests against it.

New persistent access still requires approval: authenticated SELECT on housing state/events under existing intake RLS, EXECUTE on act_housing_follow_through, read_admin_collaboration_workspace and save_admin_collaboration_workspace, and the associated owner-private storage/audit retention. No direct client table writes are granted. Bridge persistence/OAuth/egress access is a separate, not-yet-specified approval.
