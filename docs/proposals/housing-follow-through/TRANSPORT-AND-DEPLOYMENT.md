# Persistence, second review, transport and deployment

## Second review findings and fixes

1. **Residence context leakage:** draft selection formerly allowed changing residence while keeping prior in-memory content. Now each private workspace is keyed by server-derived administrator identity and one residence; switches clear prior context and are blocked while dirty. The server independently rejects cross-residence intake/items and residents outside the selected active roster.
2. **Approval versus execution:** review decisions remain data only. No provider call, messages, resident mutation, disciplinary action or eligibility/housing decision is executed. The server rejects `executed`/unknown decision states and incomplete approval. Saving a review creates a server revision, not an operational authorization.
3. **Audit trust:** client annotation actors/times are not authoritative. Immutable server revisions derive the actual actor/time/version and retain each full snapshot. A caller cannot supply another workspace owner, directly write a table or delete revisions. Each administrator's draft is private; new sharing permissions are not introduced.
4. **Duplicate external submissions:** source/reference uniqueness now spans all housing intakes, so the same source submission cannot silently attach to two intakes. Two distinct Contact Connect submissions can remain distinct references on one intake; they never create additional people/applications. Ambiguous dates remain text or explicitly unknown.
5. **Concurrent handoff acceptance:** two actual PostgreSQL sessions accepting the same proposed transfer/version yield exactly one success and one stale-version refusal, with one accepted-owner event. Draft saving similarly has exactly one winning revision. Locks and versions prevent last-writer-wins loss.
6. **Conversion:** completed contact and outstanding housing work remain keyed to intake and survive conversion. Closing housing does not close inquiry commitments; their source history and due dates remain visible. Full-schema conversion integration remains a staging prerequisite.
7. **Organization/residence boundaries:** RPCs reuse existing classification-aware authorization, never coaching claims or new role helpers. Housing requires existing residence/care-operations authority; collaboration additionally requires platform administrator authority and remains owner-private. Residence-specific IDs are validated server-side. Tests use synthetic authorization stubs, including residences in different synthetic organizations. They do not certify live organization semantics; actual target definitions and revoked/unclassified/fixture identities must be verified in staging before activation.

## Concrete transport needed (design only; not implemented)

The durable adapter already uses the authenticated Supabase RPC transport and server-derived current person. No additional token or secret is embedded in the frontend.

For a future assistant integration, introduce a **RecoveryOS-owned**, authenticated HTTPS endpoint, for example `POST /api/admin/collaboration/{residenceId}/proposals`. That is a proposed application endpoint, not a private dot API. It must validate the user's Supabase access token server-side, re-check current administrator/residence scope, load an explicitly selected immutable workspace revision, require explicit approval of the exact anonymized context to transmit, and record a request ID and revision. The server may then call a documented model-provider API with a server-held credential. Responses must be stored as untrusted proposals under the same scope, with no resident execution tools. Enforce idempotency, request limits, retention and revocation; never place provider secrets in the browser.

Supabase documents authenticated server verification through [`auth.getUser(jwt)`](https://supabase.com/docs/reference/javascript/auth-getuser). Provider selection, contracts and authorization remain unresolved. Existing Grace provider/model governance stays locked; this work does not activate or repurpose it.

This would create a **new application assistant session**. It does not grant access to, continue, or synchronize this existing dot conversation. Exact dot handoff still requires a documented supported authenticated bridge that has not been verified. Until then, approved context can be manually copied by the administrator into their chosen authorized conversation.

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

Branch is local only; no push, PR or verified hosted review URL is claimed. Native Library attachments are the delivery path for mobile review. Local filesystem/localhost references in developer instructions are not user-accessible preview links.
