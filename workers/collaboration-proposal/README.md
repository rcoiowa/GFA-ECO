# RecoveryOS MCP Events bridge — disconnected proposal

`endpoint.mjs` is a tested transport core, **not a deployed or fully integrated bridge**. It is not imported by the platform worker. Empty configuration returns 503. No OAuth grant, credential, subscription, external callback or persistent access has been created. The adapter tests are synthetic, not a ChatGPT round trip.

Official protocol checked 2026-10-19:
- https://developers.openai.com/plugins/build/mcp-events — MCP 2.0 (`2026-07-28`), event discovery, subscription verification and signed webhook delivery; dots supported.
- https://developers.openai.com/plugins/build/auth — OAuth 2.1 resource server, issuer discovery, PKCE and account-specific authorization.
- https://developers.openai.com/plugins/deploy/connect-chatgpt — authenticated public HTTPS or supported Secure MCP Tunnel connection, plugin setup subject to workspace policy.

## Narrow exchange

An administrator explicitly selects and approves an anonymized snapshot of ONE residence workspace revision. A server-side enqueue operation must verify their current admin/production/residence authority, bind owner and residence, cap context at 24 KiB and atomically persist the immutable request and outbox event. Reusing the enqueue idempotency key with different content must conflict. No automatic upload of briefs, GroupMe paste buffers, application histories or this dot transcript is allowed.

The only event is `collaboration.requested`, filtered to a residence and authenticated owner, carrying only opaque residence/request IDs. This dot subscribes through ChatGPT, reads the selected request via `read_request`, and writes an untrusted proposal via `reply_to_request`. `request_status` distinguishes queued, event accepted, reply received, rejected and delivery failed. An accepted event is not a completed reply. Only app-originated requests emit events: replies never recursively emit new requests.

The app renders these exchanges as plain text in the same private workspace. It must not claim the entire existing conversation is visible or synchronized. There is no generic model API substitute and no Grace provider change. Replies cannot execute housing, discipline, eligibility, disclosure, messaging or participant edits.

## Required adapters (not implemented)

The core deliberately has no permissive fallbacks:

1. `verifyAccessToken` must validate OAuth token signature with trusted issuer keys, exact audience/resource, issuer, expiration/not-before and `collaboration:exchange` scope. OAuth subject must map to the existing RecoveryOS account. Decoding a JWT, using Sign in with ChatGPT, or treating a Supabase login token as an MCP resource token is insufficient. Do not build a custom OAuth issuer casually: choose and approve a supported authorization service first.
2. `authorize` must re-evaluate current canonical administrator and residence authority plus explicit production classification on every call and before each event delivery. Its null-residence discovery call still requires administrator status. No coaching claim shortcut. Use the actor's existing authorization; do not add a broad service-role token.
3. `exchange` must enforce owner AND residence AND request matching in storage, only return explicitly shared immutable snapshots, cap data before retrieval, and atomically deduplicate replies by owner/request/operation ID plus payload hash. A repeated identical reply returns its original result; changed payload conflicts. Record server actor/time and review-only status. This requires a reviewed persistence schema/adapter, not in-memory maps.
4. `subscriptions` must derive an idempotent ID from principal/callback/event/canonical arguments, enforce finite TTL (default one hour, no more than requested), support refresh/unsubscribe, and encrypt signing secrets at rest. Validate `whsec_` decoded length 24–64 bytes. Callback verification requires a fresh single-use expiring challenge and signed POST, 2xx plus constant-time challenge comparison. Callback egress must resolve and reject private/local/nonpublic destinations **at connection time**, pin the validated address with original TLS hostname, and never follow redirects. A normal Worker `fetch` plus URL validation is insufficient; an approved hardened egress service or equivalent verified facility is required. Return MCP error -32015 with categorized reason on verification failure.
5. Durable outbox delivery must use Standard Webhooks HMAC over stable event ID, fresh Unix signing timestamp and exact serialized bytes; include `X-MCP-Subscription-Id`, `webhook-id`, `webhook-timestamp`, `webhook-signature`. Persist retry state across restarts, bounded exponential retries, and stop on 410/413, expiry, unsubscribe or access revocation. No context in events or logs. Event IDs stay stable across retry. Return `cursor:null`; no replay support is claimed.

The present six tests cover fail-closed mounting, authentication gate, current residence/revocation gate, bounded payloads, owner/idempotency adapter contract, and rejection of unverified callbacks. They **do not certify an OAuth implementation, durable outbox, DNS-safe egress or actual ChatGPT protocol interoperability**. Complete those adapters and their security/concurrency tests before enabling.

## Exact setup approvals and smallest next step

First verify that this user's ChatGPT Plugins interface offers **Add custom MCP server** and permits events for this dot. This capability check creates no grant and does not connect anything. RecoveryOS is not yet a connected event source.

Before creating anything persistent, present the chosen HTTPS endpoint/resource and OAuth issuer, exact account mapping and `collaboration:exchange` scope, callback-secret storage/retention, owner-private request/reply/outbox tables and grants, and hardened egress deployment for approval. The current public weather/assets worker has no such auth/egress service. Configuration remains blank until those concrete infrastructure choices are approved; no guessed hostnames or secrets are deployable defaults.

Then implement/test adapters in isolation, approve the specific database grants/deployment, expose the endpoint, inspect discovery/tools/events, and explicitly approve plugin installation/OAuth connection. Subscribe THIS dot to one approved residence. Require a harmless synthetic round trip: queue request, verify callback, receive event, read request, save reply, observe the same reply/status in RecoveryOS, replay the event without a duplicate reply, and unsubscribe. Only that verified result may change UI from **Not connected**. Do not create a subscription merely because the endpoint is reachable.
