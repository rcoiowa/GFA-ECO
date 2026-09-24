# Recovery Community Center domain map — prepared, September 24, 2026

## One product, several entrances

RecoveryOS is the shared application in `apps/platform`, backed by canonical CQCX
(`cqcxvwoukyhxyokfwnjm`). A domain is an address and an opening experience, not a
separate database or a copy of the application. The same Worker can serve multiple
hostnames and let `HostHome` choose the initial view. Internal routes and RLS retain
their own access rules.

| Address | Intended public meaning | Root behavior in this change | Binding status |
| --- | --- | --- | --- |
| `recoverycommunity.center` | Public Recovery Community Center and wayfinding | Illustrated front door, then support, community, housing, or sign-in | Source prepared; Cloudflare binding unverified |
| `recoverycommunity.app` | Participant application | Redirect to guarded `/vrcc/today` | Source prepared; Cloudflare binding unverified |
| `recoveryresidence.org` | Public recovery housing directory | Existing redirect to `/recovery-residences` | Existing source mapping; binding unverified |
| `recoveryresidence.app` | Housing operator entrance | Existing redirect to `/recovery-residences/list-your-residence` | Existing source mapping; binding unverified |
| `vrcc.app` | Legacy virtual entrance; proposed future immersive experience | Existing default landing remains until a separate cutover decision | Live site is separate from verified canonical staging; do not repoint implicitly |
| `recoveryos-staging.thomas-499.workers.dev` | Test address for the canonical Worker | Existing default landing and all shared routes | Runtime version and configuration require live Cloudflare verification |

The building's *physical* front door is a different thing from the illustrated
front door on the site. A QR code or sign at the building can link to
`recoverycommunity.center` for public wayfinding or, after its domain is bound
and verified, to `recoverycommunity.app` for participant sign-in. Neither address
asserts that a physical site is open to visitors.

## Cutover sequence

1. Verify the staging Worker serves the exact reviewed commit, CQCX is its backend,
   and account creation/sign-in, anonymous support, housing links, and role gates
   work with synthetic identities. Check function origin allowlists and Supabase
   Auth redirect URLs for each new hostname.
2. Bind `recoverycommunity.center` to the same reviewed platform Worker and test
   the public entrance and every door. Do not publish links to unfinished surfaces.
3. Bind `recoverycommunity.app` when participant authentication and deep links
   work from that origin. Migrate existing `/vrcc/*` bookmarks with explicit
   redirects only in a separately reviewed change.
4. Bind the residence domains after housing content, applications, consent, and
   operator authorization pass their own checks. Decide `vrcc.app`'s legacy
   bridge or immersive future separately.

This change adds only the center page and two hostname mappings. It does not
alter DNS, Cloudflare bindings, Supabase, the current `vrcc.app` site, or
production admission/application gates. The screenshot is a visual reference,
not source code; the illustration is a new original asset. The currently served
`vrcc.app/app` page contains older copy and appears to permit a retired YKY
Supabase origin in its response CSP, so its runtime bundle must not be copied
wholesale into the canonical CQCX platform.

## Live sky increment

The public entrance uses Des Moines coordinates and `America/Chicago` for its
clock. It reads Open-Meteo's 15-minute current model conditions on load, on
return to the browser tab, and every 15 minutes while open. The page selects a
day or night illustration using the returned `is_day`, then shows a rain,
snow, cloud, or storm layer from current weather and precipitation. If a
response fails or is more than 30 minutes old, the page removes weather claims
and effects and uses an approximate local-time scene. The user-facing footer
attributes Open-Meteo and describes the conditions as model estimates, not
ground observations.

**Before public traffic:** confirm GFA's proposed use qualifies under the
Open-Meteo free API's non-commercial terms, or select a licensed plan/provider.
The free endpoint is limited to 10,000 calls per day, so a direct per-browser
15-minute poll is suitable for staging but must be replaced by a shared
Cloudflare cache/proxy or other approved weather feed before a public campaign.
Keep any paid API key on the Worker side, never in frontend JavaScript. Verify
the production CSP permits the chosen weather endpoint. If the goal is precise
street-level rain detection, a weather model may not match conditions at the
physical building; assess an observation/radar source separately.
