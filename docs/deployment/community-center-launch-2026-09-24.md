# Recovery Community Center launch preparation — September 24, 2026

Status: **prepared for review; live staging NOT verified; no public cutover performed.**

## Evidence and limits

- PR #17 was open and draft at `48c007fe214c3d74b3a8dac07cfcb08e61c5c45a`.
  [CI run 36043394806](https://github.com/rcoiowa/GFA-ECO/actions/runs/36043394806)
  succeeded for that original head. Follow-up changes require their own green CI.
- The connected Cloudflare APIs expose DGX Account (`80d8629262ea4cf1a7782e9772d8a6f4`),
  two unrelated Workers, zero zones, and zero custom Worker domains. The RecoveryOS
  staging/candidate Workers were not listed. Local Wrangler is signed out.
  This is an access gap, not evidence that RecoveryOS or its domains are gone.
- A direct Supabase project lookup confirms canonical CQCX (`cqcxvwoukyhxyokfwnjm`),
  named RecoveryOS-Launch, is ACTIVE_HEALTHY. It was omitted from list-projects.
  This does not establish that the staging bundle uses it.
- CQCX's live `residence-intake` v3 source permits existing residence domains,
  vrcc.app and the staging/candidate origins, but neither recoverycommunity domain.
  Live v3 is not identical to the repository handler; do not redeploy the repository
  version wholesale merely to add domains.
- Supabase Auth redirect configuration is not exposed by the connected tools and
  remains unverified. No sign-in, sign-up, reset email or intake submission was sent.
- Browser staging access was blocked because the browser could not verify an
  admin-enforced policy. No alternate browser/HTTP workaround was used.
- No Cloudflare, DNS, Supabase, Wix or vrcc.app configuration was changed.

## Prepared behavior

- `/community-center` makes the illustrated page reviewable on staging without DNS.
- Four choices route to `/support`, `/register`, `/recovery-residences`, `/sign-in`.
- Registration explicitly asks Supabase to return confirmation links to the same
  origin's `/sign-in`, instead of implicitly relying on the project's Site URL.
- `release.json` contains the pipeline's immutable release SHA and backend reference,
  with `Cache-Control: no-store`. Local builds say `local-unreleased`.
- A platform Worker handles only the fixed public weather endpoint and delegates
  other requests to static assets. The dormant `workers/api` remains quarantined.
- Weather uses a shared per-data-center cache, finite timeouts, bounded responses,
  stale-data rejection and an honest fallback. No visitor credentials or query
  values are forwarded to the provider. The user's nonprofit/no-ads/no-subscription
  confirmation is recorded in the domain-map document. No paid plan was purchased.

## Complete staging verification

1. Restore Cloudflare access to the account owning the `thomas-499.workers.dev`
   subdomain. Read current staging and candidate version IDs and custom-domain
   bindings; save them with timestamps before any deployment.
2. Obtain green CI for the final reviewed SHA. Use the existing manual **Deploy
   staging** workflow with that exact `release_ref` and `DEPLOY_STAGING`. It already
   supplies canonical CQCX settings. Do not bypass its CI or environment gates.
3. Read `/release.json` from staging and compare the exact SHA and CQCX project.
   Also inspect the served JS/network requests; a manifest alone is not a backend
   integration test. Confirm the retired backend is absent from assets and CSP.
4. In a policy-approved browser, visit `/community-center`; click the illustrated
   door and the visible button. Test keyboard focus, small screens, reduced motion,
   each of the four choices, and return navigation. Source/unit tests are not proof
   of a live journey.
5. Confirm live weather via `/api/weather/des-moines`; verify a cache hit does not
   make another provider call. Simulate an unavailable or stale response locally
   and confirm time-based artwork, no precipitation layer, and no current-weather
   claim. Use the Worker runtime; plain Vite has no weather endpoint.
6. With designated synthetic accounts, check participant sign-in and guarded
   `/vrcc/today`, confirmation and password-reset return URLs, anonymous support,
   and expected role rejection. No real participant records are needed.

## Public-domain preparation

Confirm ownership, existing DNS records, TLS, and current hosting before binding
anything. The intended Worker is `gfa-eco-recovery-residence-os`; the staging Worker
remains a separate test target. Do not bind production domains to staging.

| Domain                   | Root experience           | Cutover scope                          |
| ------------------------ | ------------------------- | -------------------------------------- |
| recoverycommunity.center | Illustrated public center | First public entrance                  |
| recoverycommunity.app    | Guarded /vrcc/today       | Participant entrance after auth checks |
| recoveryresidence.org    | Housing directory         | Existing intent; separate validation   |
| recoveryresidence.app    | Operator entrance         | Existing intent; separate validation   |
| vrcc.app                 | Existing virtual site     | No cutover in this change              |

If www variants will be served, verify those separately too. Either bind and test
all supported variants or redirect www to apex before authentication starts.

### CQCX Auth redirect entries to inspect/add when domains are ready

Preserve existing entries. Do not replace the global Site URL blindly; existing
clients may still depend on it. Use exact URLs, not a broad wildcard:

- https://recoverycommunity.center/sign-in
- https://recoverycommunity.center/reset-password
- https://recoverycommunity.app/sign-in
- https://recoverycommunity.app/reset-password
- https://www.recoverycommunity.center/sign-in (only if served)
- https://www.recoverycommunity.center/reset-password (only if served)
- https://www.recoverycommunity.app/sign-in (only if served)
- https://www.recoverycommunity.app/reset-password (only if served)
- https://recoveryos-staging.thomas-499.workers.dev/sign-in
- https://recoveryos-staging.thomas-499.workers.dev/reset-password

Inspect confirmation/reset email templates for hardcoded Site URL use. Cross-domain
local-storage sessions are separate: sharing CQCX does not automatically sign a
person into another domain. Test the actual email-link journeys.

[Supabase redirect documentation](https://supabase.com/docs/guides/auth/redirect-urls)
explains the allowlist and redirect options.

### Public intake origins

Before submissions from new domains, reconcile the deployed `residence-intake` v3
against the current repository, preserve its behavior and existing allowed origins,
and prepare a narrow allowlist addition for:

- https://recoverycommunity.center
- https://recoverycommunity.app
- https://www.recoverycommunity.center (if served)
- https://www.recoverycommunity.app (if served)

Validate OPTIONS and rejected-origin behavior without creating an intake record.
Where Turnstile is enabled, verify its hostname configuration too. No intake
function deployment or permission widening was performed in this preparation.
Wix's server-to-server lead-intake secret belongs on the server; never expose it
in this frontend or replace the existing Wix flow as part of domain binding.

### Effective browser policy

Read response headers from each deployed origin. Permit the canonical CQCX HTTPS
and WSS endpoints, same-origin weather and required existing integrations; preserve
existing protections. Do not add a wildcard Supabase origin or the retired project.
No CSP was invented without first seeing the effective production policy.

## Cutover and rollback

After live checks pass, deploy the same immutable SHA to the candidate via the
manual candidate workflow. Recheck its release manifest, then bind only the two
community domains using Cloudflare custom domains. Verify TLS and all journeys
from an unauthenticated browser. Preserve unrelated DNS records, especially mail.

Record previous Worker version IDs and each domain's previous hosting/DNS state.
If verification fails, restore the prior Worker version and domain mapping. If a
new domain previously had no mapping, remove only the newly created binding.
Keep the old services intact until that rollback window closes. Disabling weather
with `WEATHER_ENABLED=false` provides a time-based fallback independent of the
provider. No merge, deployment or DNS cutover is implied by this document.
