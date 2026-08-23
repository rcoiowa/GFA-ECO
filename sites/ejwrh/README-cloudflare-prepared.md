# EJWRH Public Route — PREPARED, NOT ACTIVATED

**Status: PUBLIC CLOUDFLARE DEPLOYMENT REMAINS CLOSED** (Gate A directive, 2026-08-23).
Nothing in this directory is deployed. Activation requires a separate executive gate after
Gate B (intake/documents/consent/signature architecture) or an explicit decision to open the
application-only page.

## Intended production architecture

- **Public URL:** `https://recoveryresidence.org/ejwrh` (never the Supabase functions URL).
- **Edge:** Cloudflare Worker on route `recoveryresidence.org/ejwrh*` proxying the origin
  function, adding/enforcing security headers, caching, WAF/rate limiting, and (when the
  form opens to real traffic) Turnstile.
- **Origin:** the version-controlled `ejwrh` Edge Function (self-contained page; CQCX stays
  the data backend). Changing the origin later never changes the public URL.
- **Write path:** the page submits only to the canonical `residence-intake` Edge Function.
  `https://recoveryresidence.org` is already in that function's origin allowlist, so the
  form works the moment this route activates — by design it does NOT work from the
  unpublicized Supabase URL (origin-rejected; the page degrades to phone/email contact).
  Real-traffic activation should also set `TURNSTILE_SECRET` on `residence-intake` and add
  the Turnstile widget + token to the page.

## Prepared Worker (upload at activation, not before)

`worker.prepared.js` in this directory. Route: `recoveryresidence.org/ejwrh*`.
No secrets required. Deploy steps at activation:

1. `wrangler deploy sites/ejwrh/worker.prepared.js --name ejwrh-portal` (or dashboard paste).
2. Add route `recoveryresidence.org/ejwrh*` → `ejwrh-portal`.
3. Verify: 200 with CSP/HSTS headers; form submit succeeds end-to-end with a synthetic
   application; staff queue receives it; then remove any test row.
4. Only after executive activation authorization.

## Checklist gate before activation

- [ ] Gate B intake architecture ratified/built (or executive decision to run
      application-only in production).
- [ ] Turnstile enabled on `residence-intake` and wired on the page.
- [ ] Content re-verified against authoritative house policy (no unreconciled policy
      language is published).
- [ ] Crisis/support numbers re-verified against the governance canon.
- [ ] Synthetic end-to-end on the production URL, then cleanup.
- [ ] Executive activation authorization recorded.
