# Supabase bridge feasibility — 2026-10-19

Status: **not deployable; no external delivery or live conversation connection**.
Housing and the private admin review workspace are independent of this bridge.

## Corrected authorization

Supabase OAuth Server supports standard OIDC scopes, not arbitrary custom scopes:
https://supabase.com/docs/guides/auth/oauth-server/oauth-flows

Discovery now requests `openid`. This means identity consent only. Exchange permission
is a separate `recoveryos_permission=collaboration:exchange` signed claim, registered
client approval, and revocable subject/client/residence approval. The verifier also
requires the exact resource audience and `role=recoveryos_bridge_client`. An ordinary
`authenticated` token is rejected, even with the correct audience.

`token-role-schema.sql` proposes a conditional Custom Access Token Hook. Only a
registered bridge client is changed. First-party and unrelated clients are unchanged;
a disabled registered client fails issuance instead of falling back to a broad role.
The proposal must be composed with any existing hook after inspecting its configuration.
https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook

The proposed role has no membership in `authenticated`, application schema usage,
table rights, or ordinary callable application RPC permissions. Local PostgREST 16.4
(production version not verified) authenticated a hook-produced synthetic role claim
through a test-only harmless RPC. Participant/public application reads, admin workspace
read/save and housing mutation requests were denied (403); changing audience to
`authenticated` did not bypass denial. No audience check was configured in PostgREST:
isolation comes from database privileges. The test-only probe is removed afterward.
Existing trigger functions inherit PUBLIC execute but are not callable RPCs; application
schema usage is also denied. No bridge exchange RPC grant exists yet.

Reproduce on a fresh isolated replay database:
```
python docs/proposals/housing-follow-through/test-full-schema.py recoveryos-housing-review housing_bridge_review
# token role is cluster-wide: use a fresh isolated cluster if it already exists.
docker exec -i recoveryos-housing-review psql -U postgres -d housing_bridge_review -v ON_ERROR_STOP=1 < workers/collaboration-proposal/token-role-schema.sql
docker exec -i recoveryos-housing-review psql -U postgres -d housing_bridge_review -v ON_ERROR_STOP=1 < workers/collaboration-proposal/test-token-role.sql
python workers/collaboration-proposal/test-postgrest-isolation.py recoveryos-housing-review housing_bridge_review
```
The HTTP test creates local authenticator membership and a synthetic, ephemeral JWT
signing secret. Neither is a production grant/credential. It accepts only explicitly
named local Docker containers and databases, never a production URL.

## Runtime experiment and remaining boundary

Official Supabase Docker compose currently references `supabase/edge-runtime:v1.77.4`:
https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml
Tested image digest: `sha256:ad45164b7548bf5820ed7be714789c17ac2865edce79a09cfb4c3756c3d365a8`.
This is an isolated user-worker test, not a deployed managed Edge Function.

- `Deno.resolveDns`, `connect`, `startTls`, `createHttpClient` exist in the user worker.
- A TCP connection to a pinned local synthetic fixture, upgraded with `startTls`
  using its original synthetic hostname and explicit test CA, completed TLS verification.
- A wrong hostname failed with `NotValidForName`; a CA certificate used as the server
  certificate was also correctly rejected.
- Public `resolveDns('example.com','A')` timed out after five seconds in this environment.
  Direct external connection testing likewise did not establish a usable callback path.
- These partial results do **not** prove public DNS pinning, normal public CA validation,
  bounded HTTP parsing, redirects, DNS rebinding protection, or managed-host compatibility.
  No callback URL or secret from ChatGPT was used.

Missing capability: a verified bounded resolver and pinned HTTPS callback path in the
actual approved managed runtime. Do not replace this with ordinary `fetch`, a URL-only
filter, or a permissive DNS fallback. The original Node/SQLite runtime is now explicitly
local-prototype-only. Supabase `/tmp` is ephemeral; SQLite/WAL there is not deployable
persistence. A complete Postgres request/reply/subscription/outbox adapter and hardened
Edge HTTP transport remain unimplemented; no durable-volume or paid Node host is proposed.

## Read-only configuration boundary

Connected Supabase tools expose SQL, project metadata and function listings, but no Auth
configuration read endpoint. Read-only inspection found OAuth tables, zero active OAuth
clients, and no function whose name matched access-token/OAuth-hook patterns. That does
not prove OAuth Server or a hook is disabled (a hook may be HTTP or differently named).
Discovery requests were blocked by this environment's proxy.

Required dashboard-only state, without secret values:
1. RecoveryOS-Launch → Authentication → OAuth Server: enabled state, authorization path,
   dynamic registration setting, and client registration availability.
2. Authentication → Hooks → Custom Access Token: enabled state, hook type and function
   identifier/HTTP destination. Review existing behavior before composing any hook.

Configuration remains **unknown/pending**, not a denied config change. No OAuth client,
hook, role, grant, secret, schema, deployment, subscription or cleanup scheduler was changed
in production. Cloudflare Containers listing previously returned provider 401/Workers Paid
required; it was not retried, and no paid service was provisioned. Automatic retention
is excluded from the pending storage approval; never install/schedule cleanup under it.

Activation requires: resolve configuration, implement/test Postgres persistence and managed
safe egress, separately approve exact roles/RPC grants/hook/client/secret custody, then deploy
an explicitly chosen HTTPS resource and verify a synthetic authenticated event/request/reply
round trip with this dot. ChatGPT setup availability must be checked on the user's web account.
Until then the request/reply API remains disabled and the app must say **Not connected**.
