# RCO Iowa public site

Separate RCO Iowa branding and Cloudflare Worker, using the existing canonical RecoveryOS backend.

- Worker: `rco-iowa-public`, https://rco-iowa-public.thomas-499.workers.dev
- Backend: RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`), `recoveryos.leads`.
- Public endpoint: `/functions/v1/lead-intake/rco-iowa`.
- RecoveryOS access: https://recoverycommunity.app/
- Community center access: https://recoverycommunity.center/

## Build and deploy

Run `python3 sites/rco-iowa/build.py`, then deploy from this directory with `npx wrangler deploy` using an authorized Cloudflare session. `worker.mjs` is a generated static response bundle. It contains no backend credentials. Cloudflare serves assets; Supabase performs all business writes.

## Inquiries

The visitor supplies their name, email, topic, optional organization and message, and explicit permission to store/respond. Turnstile verifies hostname and `rco_inquiry` action. The origin must match the exact allowlist. The Edge adapter validates bounded input and delegates to the canonical lead handler. It sets `source=rco_iowa_inquiry_v1`, `organization_inquiry=true`, and `wix_submission_id=rco-iowa-<UUID>` for idempotency. The existing legacy-named idempotency column is reused without a migration. Organization name is prefixed to the message; permission version, wording, time, and origin are recorded in notes. No account, organization membership, marketing consent, participant record sharing, or completed peer-connection outcome is created.

Inquiries are reviewed through the existing authorized RecoveryOS lead queue (`/admin/leads`). Current live RLS permits intake coordinators or the assigned production actor; it grants no anonymous access. Existing internal lead-notification behavior remains. External email alerts are disabled for this route. No submission contents are logged by the new adapter.

This is coordination intake operated by GFA as founding steward, not a multi-organization record-sharing implementation. Independent organizational access requires separately designed tenant/organization authorization before rollout.

## Domain status

At implementation time, `rcoiowa.org` redirected to `https://www.graceforaddictions.org/inititiave`. No DNS or domain cutover is included. The endpoint and Turnstile allow the apex, its www subdomain, and this Worker hostname so the intended domain can be connected later. The original Wix/ChatGPT copies are not silently synchronized.

## Validation

Run `npx deno test --allow-env supabase/functions/tests/rco-intake.test.ts supabase/functions/tests/lead-intake.test.ts`. Tests cover consent, origin, payload restrictions, Turnstile host/action, provenance, deduplication, error privacy, and existing receiver behavior. A live transaction verified service-role insertion and readback and rolled back all synthetic data. A full live browser submission requires a real Turnstile challenge; no production bypass is provided.
