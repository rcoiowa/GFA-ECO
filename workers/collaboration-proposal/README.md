# RecoveryOS collaboration bridge — implemented, disconnected

The intended deployment path is now
[`supabase/functions/collaboration-bridge/index.ts`](../../supabase/functions/collaboration-bridge/index.ts)
→ `edge/runtime.mjs` → Web Crypto, the pinned Deno TLS transport, and the durable
Postgres dispatcher in `exchange-schema.sql`. It does **not** import the Node/SQLite
prototype. All production proposals remain unapplied. Both activation gates default off;
unconfigured requests return 503 and `connected:false`.

## Implemented behavior

- First-party administrator JWTs can enqueue only explicitly approved, selected context
  (16 KiB UTF-8 maximum), and read owner/residence-bound request status. No automatic
  upload of workspace notes, application history, GroupMe text or this conversation.
- OAuth uses standard `openid`, an exact resource audience, the restricted bridge role,
  a separately signed exchange permission, and revocable subject/client/residence approval.
  Every operation and each send rechecks canonical production/admin/session/client authority.
- Requests, immutable replies and callback secrets are AES-GCM encrypted with an externally
  supplied versioned keyring. Associated data binds ciphertext to its owner/context.
  No access tokens are persisted. Audit rows contain IDs, action kinds and server timestamps.
- Postgres advisory locks enforce owner quotas and enqueue idempotency. Unique outbox rows,
  `FOR UPDATE SKIP LOCKED`, expiring leases and lease-token checks protect concurrent workers.
  Retries survive restarts, retain the event ID, use fresh signatures and stop after five attempts.
  410 disables the subscription; expiry/revocation/unsubscribe cancel pending events. No deletion.
- A fresh signed challenge must succeed before subscription persistence. Secret rotation supports
  a brief dual-signature overlap; refresh invalidates old delivery leases. Callback requests validate
  all DNS answers, pin the selected public address, verify TLS against the original hostname,
  enforce a total deadline and bounded HTTP framing, and never follow redirects.
- Only app-created requests emit events. Replies are untrusted proposals and cannot change
  housing, discipline, eligibility, resident records, disclosures or other operational decisions.
  A 2xx event receipt is reported separately from a reply.
- App APIs enforce the configured Origin and narrowly scoped CORS preflight; no cookies or
  broad CORS reflection. MCP discovery/tools/events remain authenticated except public OAuth metadata.

With a resource ending `/mcp`, endpoints share its prefix: `/mcp`,
`/.well-known/oauth-protected-resource`, `/app/requests`, `/app/deliver`.
The authenticated `/app/deliver` POST accepts `{}` and drains at most five due deliveries.
Successful API activity also schedules a bounded drain with `EdgeRuntime.waitUntil`.
There is no background scheduler installation: retries remain durable until another drain.
An unattended wake-up integration requires separate authorization/configuration; do not imply
that dormant requests will deliver on a timer. No browser polling or fake assistant reply is used.

## Validation and exact activation boundary

See [FEASIBILITY.md](FEASIBILITY.md) for actual runtime evidence and external blockers.
Local validation includes real Postgres concurrency/revocation/HTTP/JWT contracts,
real PostgREST denial of ordinary participant/admin APIs, Web Crypto/TLS parser tests,
Deno compilation, and isolated Supabase Edge user-worker boot/driver/HTTPS fixture checks.

Run unit tests with `node --test workers/collaboration-proposal/*.test.mjs`.
Run full isolated storage tests with:
```
python workers/collaboration-proposal/test-edge-postgres.py recoveryos-housing-review housing_fresh_bridge
```
The harness creates a fresh local database and applies proposals only there. CI runs it
in a disposable PostgreSQL container, alongside the Deno compile check and full app checks.

Apply order, **only after separate approval**:
1. Housing/admin proposals independently, with their own feature flags and rollback review.
2. `authorization-schema.sql`, `token-role-schema.sql`, then `exchange-schema.sql`.
3. Register the exact OAuth client and exchange approvals; compose the conditional token hook
   with the existing hook, never silently replace it. Review the exact audience and redirect URIs.
4. Provision a dedicated database LOGIN inheriting only `recoveryos_bridge_worker`, TLS required.
   That role has only private-schema usage and dispatcher execution. No application table/RPC
   grants, `authenticated` membership, service role, owner connection or broad signing key.
   The Edge entrypoint checks this role restriction at startup.
5. Provision externally managed encryption keyring and the approved configuration. Retain old
   key versions for existing ciphertext. No key/credential is generated or committed by this code.
6. Configure the function gateway for application-level JWT verification (Supabase legacy gateway
   JWT verification must not reject OAuth resource tokens before the handler). This is an explicit
   deployment configuration review, not an authentication bypass: the handler verifies every token.
7. Verify public DNS/pinned HTTPS in the actual managed environment, then approve activation and
   set both gates. Complete a synthetic authenticated callback/event/request/reply/status/replay/
   unsubscribe round trip with the intended ChatGPT dot before claiming **Connected**.

Configuration names (values are intentionally absent):
`COLLABORATION_BRIDGE_ENABLED`, `COLLABORATION_MANAGED_EGRESS_VERIFIED`,
`COLLABORATION_WORKER_DATABASE_URL`, `COLLABORATION_ENCRYPTION_KEYRING`,
`COLLABORATION_ACTIVE_KEY_ID`, `COLLABORATION_RESOURCE`, `COLLABORATION_APP_ORIGIN`,
`COLLABORATION_OAUTH_ISSUER`, `COLLABORATION_JWKS_URL`, `COLLABORATION_CLIENT_IDS` (JSON array).

Automatic deletion is excluded from the pending storage approval. This deployment path never
calls the old prototype's prune method and installs no purge function or schedule.
GroupMe's three screenshots were reviewed and anonymous categories incorporated; remaining
limits are verified source evidence, explicit matching and approved changes, not missing screenshots.

Official contracts: [MCP events](https://developers.openai.com/plugins/build/mcp-events),
[OAuth](https://developers.openai.com/plugins/build/auth),
[Supabase OAuth scopes](https://supabase.com/docs/guides/auth/oauth-server/oauth-flows),
[conditional token hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook).
The files at this directory's root named `store.mjs`, `runtime.mjs`, `oauth.mjs`, `adapters.mjs`
and `egress.mjs` remain reference prototypes/tests only; they are not deployable dependencies.
