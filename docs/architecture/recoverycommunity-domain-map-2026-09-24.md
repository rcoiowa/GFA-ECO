# Recovery Community Center domain map — prepared, September 24, 2026

## One product, several entrances

RecoveryOS is the shared application in `apps/platform`, backed by canonical CQCX
(`cqcxvwoukyhxyokfwnjm`). A domain is an address and an opening experience, not a
separate database or a copy of the application. The same Worker can serve multiple
hostnames and let `HostHome` choose the initial view. Internal routes and RLS retain
their own access rules.

| Address                                     | Intended public meaning                                       | Root behavior in this change                                         | Binding status                                                                   |
| ------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `recoverycommunity.center`                  | Public Recovery Community Center and wayfinding               | Illustrated front door, then support, community, housing, or sign-in | Source prepared; Cloudflare binding unverified                                   |
| `recoverycommunity.app`                     | Participant application                                       | Redirect to guarded `/vrcc/today`                                    | Source prepared; Cloudflare binding unverified                                   |
| `recoveryresidence.org`                     | Public recovery housing directory                             | Existing redirect to `/recovery-residences`                          | Existing source mapping; binding unverified                                      |
| `recoveryresidence.app`                     | Housing operator entrance                                     | Existing redirect to `/recovery-residences/list-your-residence`      | Existing source mapping; binding unverified                                      |
| `vrcc.app`                                  | Legacy virtual entrance; proposed future immersive experience | Existing default landing remains until a separate cutover decision   | Live site is separate from verified canonical staging; do not repoint implicitly |
| `recoveryos-staging.thomas-499.workers.dev` | Test address for the canonical Worker                         | Existing default landing; center preview at `/community-center`      | Runtime version and configuration require live Cloudflare verification           |

The building's _physical_ front door is a different thing from the illustrated
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

## Launch preparation follow-up

The center is also available at `/community-center` on staging and every shared
host. `/release.json` identifies the build's `VITE_RELEASE` and backend project;
local builds are marked `local-unreleased` and are not deployment evidence.

The browser now requests `/api/weather/des-moines` from the platform Worker. The
Worker uses a fixed upstream/location, bounded response size, a five-second
upstream timeout, a 15-minute edge cache and a short outage cache. Caller query
strings, cookies, and credentials are not forwarded. UNIX observation timestamps
avoid visitor-timezone and daylight-saving ambiguity. The platform keeps its
honest time-based fallback on failures. Plain Vite dev/preview has no weather
endpoint; use the Worker runtime to test weather.

On September 24, the user confirmed nonprofit use without subscriptions or ads.
Weather is therefore enabled in the prepared staging/candidate configs under the
[Open-Meteo free noncommercial terms](https://open-meteo.com/en/terms). This does
not purchase a plan or accept a new contract. The `WEATHER_ENABLED` switch can be
set to `false` to show time-based artwork without upstream calls.

The [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)
is per data center, so this cache reduces calls but does not enforce a global
10,000/day provider limit. Before a large campaign, measure provider usage and
use a globally coordinated fetch schedule or a licensed plan if necessary.

See `docs/deployment/community-center-launch-2026-09-24.md` for verified evidence,
remaining live checks, exact auth redirects, and domain cutover/rollback steps.
