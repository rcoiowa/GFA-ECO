# DR-02 Runtime Verification Report — Read-Only Pass 1 (2026-10-29)

**Status: EVIDENCE REPORT — NO DISPOSITION.** DR-02 remains **open and
contested**. Abstract, Unify, and Hybrid remain candidates; none is approved.
This report authorizes nothing.

**Authorization:** Executive Director (Thomas), 2026-10-29. Read-only first pass
over Gates 1, 2, 5, and 6, using only unauthenticated, non-mutating requests. Not
authorized: creating accounts, submitting forms, invoking write endpoints,
modifying Cloudflare configuration, or accessing participant records.

**Revision 2 (2026-10-29), same branch.** Per the Executive Director's review
decisions, this revision:
- completes the per-finding metadata;
- separates the evidence types;
- adds a portable evidence bundle;
- records one procedural scope deviation (§7);
- narrows three overstated conclusions.

No new requests were made to produce Revision 2. It was assembled entirely from
the original captures.

**Prepared on branch:** `claude/dr-02-runtime-verification-pass-1`, from
`origin/main` at `3f710a3b32d79af527c1cf738e4b3ba08b480922`.

**Reviewing environment:** Claude Code cloud session (Linux container, egress
proxy, curl, Playwright Chromium, Node v22.22.0, pnpm 10.34.5).

**Observation window:** 2026-10-29 04:06:13Z – 04:12:02Z.

**Evidence bundle:** [`evidence/2026-10-29-dr-02-pass-1/`](evidence/2026-10-29-dr-02-pass-1/README.md).
Each row below cites its bundle file.

**Related records:**
- [Distinction Register — Audit v1.0](gfa-recoveryos-distinction-register-2026-10-28.md), the canonical DR-02 tracker.
- The evidence-portability proposal on `claude/dr-02-evidence-portability-proposal` (`787b1b6`, not ratified).

## Evidence labels

Each finding carries one label below, assigned **by this reviewer**. The Ledger
class shown is this reviewer's own classification; other reviewers assign their
own.

| Label | Evidence type | Establishes | Ledger class |
|---|---|---|---|
| **LIVE** | Live HTTP observation | What a server returned to the specified request, at the specified time, from this vantage point | B, for that request only |
| **ARTIFACT** | Downloaded application artifact | What code or configuration was present in the served bundle (identified by SHA-256) | B, for bundle contents only |
| **BUILD** | Reproducible source build | Whether a named source revision reproduces the served artifact byte for byte | B, for reproducibility only |
| **REPO** | Repository-supported configuration | What source or documentation says at a named commit | B, for repository contents only |
| **INF** | Inference requiring verification | A reasoned conclusion not directly observed | E |
| **UNT** | Untested | Outside this pass's authority, or not observable unauthenticated | F |

None of LIVE, ARTIFACT, or BUILD, alone or combined, establishes that all three
domains use the same Worker configuration, or that cross-domain identity
continuity works.

**Abbreviations:**
- `http` = `evidence/…/http-observations.json`
- `browser` = `browser-observations.json`
- `artifacts` = `served-artifact-hashes.json`
- `supp` = `supplementary-observations.json`
- Times are 2026-10-29 UTC.
- "Rev" = the source revision a row was compared against.

## Controls observed

- Requests sent: `GET`/`HEAD` throughout, plus `OPTIONS` in the §7 deviation
  only. The browser harness (`harness/probe.js`) aborted every other method
  before it left the client, and logged it.
- No sign-in, account, form submission, or database write. No participant record
  was requested.
- No Cloudflare, DNS, Supabase, or repository configuration change.
- One read used the public publishable Supabase key without a user session
  (§3, F2.3). One set of requests exceeded the endpoint restriction (§7).

---

## 1. Summary — what Pass 1 established

| # | Finding | Label |
|---|---|---|
| S1 | `recoverycommunity.center`, `recoverycommunity.app`, `vrcc.app` and `www.vrcc.app` returned byte-identical HTML. The first three returned byte-identical main JS/CSS, and identical results for every probed Worker route. | LIVE |
| S2 | Each host's `/release.json` declares release `95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b` and backend `cqcxvwoukyhxyokfwnjm`. This is self-declared by the build, not a deployment record. | LIVE |
| S3 | **The observed production assets match a reproducible build of commit `95b3e6c`.** All 28 served JavaScript assets, `index.html` and `manifest.webmanifest` were byte-identical to a local production-mode build. **The deployment's exact source revision has not been independently confirmed through Cloudflare deployment records.** | BUILD |
| S4 | `95b3e6c` is the tip of `origin/release/residence-ownership-20261024`, not `main`. At the time of review, it had 29 commits not on `main`, and `main` had 10 not in it. The two revisions differ in 36 files under `apps/platform/src`, `workers`, `wrangler.jsonc`, and `supabase/functions`. Whether `main` would build to different assets was **not tested** (deferred). | REPO; UNT |
| S5 | **The current observed serving behavior of `vrcc.app` differs from the historical domain-map description**, which presents it as a separate legacy entrance pending cutover. **The underlying Cloudflare bindings have not been verified.** | LIVE vs. REPO |
| S6 | **The observed CORS preflight responses and inspected receiver code indicate a probable cross-origin submission incompatibility for housing applications started on `recoverycommunity.center` or `recoverycommunity.app`. A completed application transaction has not been tested.** The preflight observations came from a procedural scope deviation (§7). **High priority, not a confirmed end-to-end failure.** | LIVE (deviation) + REPO → INF |
| S7 | All hosts use one Supabase auth project, and the client is configured for per-origin session storage. Sessions therefore probably do not carry across hosts by default. Continuity is untested. | ARTIFACT → INF; UNT |

---

## 2. Gate 1 — Deployed routes and application boundaries

### F1.1 Reachability and DNS

| URL | Time | Method | Result | Identifier | Label | Limitation |
|---|---|---|---|---|---|---|
| `https://recoverycommunity.center/` | 04:06:14.387 | GET (curl) | `HTTP/2 200`, `server: cloudflare`, `cf-cache-status: HIT` | cf-ray `a51f4e73d9d31278-EWR`; body sha256 `f50ba5b0…` (`http`) | LIVE | Edge cache HIT; one vantage point |
| `https://recoverycommunity.app/` | 04:06:15.111 | GET | `HTTP/2 200`, Cloudflare, HIT | cf-ray `a51f4e782a987c81-EWR`; same body hash | LIVE | same |
| `https://vrcc.app/` | 04:06:15.791 | GET | `HTTP/2 200`, Cloudflare, HIT | cf-ray `a51f4e7c897e0f45-EWR`; same body hash | LIVE | same |
| `https://www.vrcc.app/` | 04:06:16.235 | GET | `HTTP/2 200`, Cloudflare, HIT | cf-ray `a51f4e7f7a192ef5-EWR`; same body hash | LIVE | same |
| `https://www.recoverycommunity.center/` | 04:06:14.695 | GET | `502` from the egress proxy (no origin reached) | DoH status 3, NXDOMAIN (`supp.dns_lookups`) | LIVE | The 502 is the proxy's response, not an origin's |
| `https://www.recoverycommunity.app/` | 04:06:15.407 | GET | `502` from the egress proxy | DoH NXDOMAIN | LIVE | same |
| DoH A/CNAME lookups, all six names | 04:06:15–04:06:33 (window) | GET `cloudflare-dns.com/dns-query` | Apex and `www.vrcc.app` resolve to Cloudflare anycast; both `www.recoverycommunity.*` are NXDOMAIN | `supp.dns_lookups` | LIVE | Not individually timestamped; one resolver |

**F1.1a (LIVE vs. REPO):** `App.tsx` at `95b3e6c` maps the `www.` variants of
both `recoverycommunity.*` hosts, but neither name resolved. Anyone typing
`www.` reaches nothing.

### F1.2 Served artifact identity

| URL | Time | Method | Result | Identifier | Label | Limitation |
|---|---|---|---|---|---|---|
| `/` on the 4 resolving hosts | 04:06:14–04:06:16 | GET | 2,183 B HTML, identical | sha256 `f50ba5b0bec8a0613d310a0cd938abe96b390287cd11d31b1745dda04730b43d` (md5 `e3befa84…`) | LIVE | Byte identity does not prove a single Worker |
| `/assets/index-DGeObB_M.js` on the 3 hosts | 04:06:33.627 / 04:06:34.407 / 04:06:35.011 | GET | 668,398 B, identical | sha256 `0507457aeefd742c3242d4baedd9ccb692304e9046882e44ca2cd65db7f22c39`; ETag `"b99b3ab78944e80dda7c05135723eb8c"` | LIVE | same |
| `/assets/index-HKWrEb7g.css` on the 3 hosts | 04:06:34.063 / 04:06:34.707 / 04:06:35.351 | GET | 47,408 B, identical | sha256 `3c0d92cebfca2cca2995e1b61df86cc21b7f44fe16aa756ba3922879b0dca44b`; ETag `"fa18bbf08bd49fba20dac619483a2522"` | LIVE | same |
| 27 lazy chunks, `vrcc.app` | 04:06:35–04:07:11 | GET | all `200` | per-file sha256 (`artifacts`) | LIVE / ARTIFACT | Fetched from `vrcc.app` only |
| `/release.json` on the 3 hosts | 04:08:20.791 / 04:08:21.207 / 04:08:21.411 | GET | `200`, identical body (S2) | cf-ray `a51f5189effc0cba`, `a51f518c9c2c436c`, `a51f518e0aeb0f63`; body in `supp.release_json_bodies` | LIVE | Self-declared identifier |

### F1.3 Reproducible-build comparison (BUILD)

| Item | Value |
|---|---|
| Rev | `95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b` |
| Method | `git worktree` at Rev, then `pnpm install --frozen-lockfile`, then `pnpm build` with `NODE_ENV=production`. The other build variables came from the Rev's `deploy-production-candidate.yml` and the served `/gfa/contact-config.json`. Their values are not recorded. |
| Completed | 04:09:45Z (build log time) |
| Result | 28/28 served JavaScript assets byte-identical (`cmp`); `index.html` and `manifest.webmanifest` identical; `release.json` matches. The CSS asset matched by SHA-256 only in a first, discarded build; it was not re-compared in production mode. |
| Method error disclosed | The first build ran with the container's `NODE_ENV=development`, which bundled React development builds and did not match. It was discarded. |
| Limitation | Any revision with identical build inputs reproduces the same bytes. This does not identify the deployment event, the Worker script version, or the Cloudflare bindings. |
| Evidence | `supp.reproducible_build_comparison`; `artifacts` |

### F1.4 Worker behavior

The Worker source (`workers/platform/index.mjs`) is identical at Rev `95b3e6c`
and `main` (REPO). Each request was GET via curl. Full rows, with per-request
cf-ray IDs, are in `http` (`kind: route`).

| Path | Times (center / app / vrcc) | Observed on all 3 hosts | Repository expectation | Label |
|---|---|---|---|---|
| `/api/weather/des-moines` | 04:07:52.4 / 04:07:55.8 / 04:07:58.4 | `200`, `application/json`, `cache-control: public, max-age=300, s-maxage=900` | Worker weather handler; `WEATHER_ENABLED=true` | LIVE + REPO |
| `/residence/directory?apply=ejwrh` | 04:07:53.2 / 04:07:56.0 / 04:07:58.6 | `302` → `<same origin>/recovery-residences/ejwrh/apply`, `no-store` | Worker directory redirect | LIVE + REPO |
| `/residence/directory?apply=grace` | 04:07:53.5 / 04:07:56.3 / 04:07:58.8 | `302` → `<same origin>/recovery-residences/grace-house/apply` | same | LIVE + REPO |
| `/vrcc/today`, `/app/today`, `/sign-in`, `/recovery-residences`, `/definitely-not-a-route-xyz` | 04:07:53.7–04:08:00.1 | `200`, the SPA shell (body hash = F1.2 HTML) | `not_found_handling: single-page-application` | LIVE + REPO |
| `/manifest.webmanifest` | 04:07:55.1 / 04:07:57.9 / 04:08:00.3 | `200`, identical body | Static asset | LIVE |

- **INF:** all three hostnames route to a Worker running this script's logic.
- **UNT:** whether that is one Worker (`gfa-eco-recovery-residence-os`) or
  several. This needs Cloudflare custom-domain bindings or the deployment record.

### F1.5 Client-side routing

Method: headless Chromium, `harness/probe.js`. Each URL loaded in a fresh
context, with no session, and non-GET requests aborted. The time shown is when
navigation started. Source: `browser`.

| URL | Time | Navigation | Final URL | Label |
|---|---|---|---|---|
| `https://recoverycommunity.center/` | 04:10:16.645 | 200 | unchanged (Community Center lobby) | LIVE |
| `https://recoverycommunity.app/` | 04:10:21.015 | 200 | `/sign-in` (via the `/vrcc/today` guard) | LIVE |
| `https://vrcc.app/` | 04:10:24.617 | 200 | unchanged (VRCC public home) | LIVE |
| `https://vrcc.app/vrcc/today` | 04:10:27.518 | 200 | `/sign-in` | LIVE |
| `https://vrcc.app/app/today` | 04:10:30.786 | 200 | `/sign-in` | LIVE |
| `https://vrcc.app/staff` | 04:10:34.066 | 200 | `/sign-in` | LIVE |
| `https://vrcc.app/admin` | 04:10:37.399 | 200 | `/sign-in` | LIVE |
| `https://vrcc.app/my-housing` | 04:10:40.551 | 200 | `/sign-in?next=%2Fmy-housing` | LIVE |
| `https://vrcc.app/recovery-residences/my-application` | 04:11:07.294 | 200 | `/sign-in?next=%2Frecovery-residences%2Fmy-application` | LIVE |
| `https://vrcc.app/sign-in`, `/register`, `/support`, `/community-center`, `/recovery-residences`, `/recovery-residences/list-your-residence`, `…/grace-house/apply`, `…/ejwrh/apply` | 04:10:43–04:11:04 | 200 | unchanged | LIVE |

**Limitations:**
- These are **client-side guards** (`RequireAuth` in `App.tsx` at Rev `95b3e6c`,
  REPO). The server returns the same `200` shell for every path, and client
  guards are not an authorization control.
- Server-side enforcement is Gate 4 (**UNT**).
- `/staff`, `/admin`, and `/vrcc/today` drop the return path. This is a
  usability note, not a security finding.

---

## 3. Gate 2 — Authentication configuration (public, no sign-in)

| ID | Finding | Source / URL | Time | Method | Identifier | Rev | Label | Limitation |
|---|---|---|---|---|---|---|---|---|
| F2.1 | The only Supabase backend referenced is `https://cqcxvwoukyhxyokfwnjm.supabase.co`, schema `recoveryos` | `/assets/index-DGeObB_M.js` (all hosts) | retrieved 04:06:33–04:06:35 | GET + static string search | sha256 `0507457a…` | BUILD-linked to `95b3e6c` | ARTIFACT | Shows configuration present, not requests made |
| F2.2 | Client auth methods: `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `signOut`; `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, default (per-origin) browser storage | same bundle + 27 chunks | 04:06:33–04:07:11 | static string search | `artifacts` | `95b3e6c` (`RegisterPage.tsx`, `packages/auth/src/actions.ts`) | ARTIFACT + REPO | Code paths were not exercised |
| F2.3 | Server settings: email provider only; `disable_signup: false`; `mailer_autoconfirm: false`; SAML off; passkeys off | `https://cqcxvwoukyhxyokfwnjm.supabase.co/auth/v1/settings` | 04:11:40Z | GET with the **public publishable key** as `apikey`, **no user session** | HTTP 200; `supp.auth_settings` | n/a | LIVE | Within authorization. Describes settings only. Does not establish CAPTCHA enforcement, redirect allowlists, session security, or identity continuity. |
| F2.4 | No cookies or `localStorage` keys set before sign-in, on all 17 page loads | `browser` | 04:10:16–04:11:07 | Playwright | `cookies_count: 0`, `local_storage_keys: []` | n/a | LIVE | Headless, unauthenticated only |
| F2.5 | Sign-up confirmation links return to `window.location.origin`, the host where the person registered | `apps/platform/src/public/RegisterPage.tsx:42` | n/a | source read | n/a | `95b3e6c` | REPO | Server redirect allowlist not visible |
| F2.6 | Turnstile loaded on both apply pages; not loaded on `/sign-in` or `/register` | `browser` rows for those URLs | 04:10:43–04:11:01 | Playwright request log | sitekey prefix `0x4AAAAA…` | n/a | LIVE | Server-side CAPTCHA on auth is not observable |

**INF:**
- Because sessions live in per-origin storage, a session created on one host does
  not exist on the others.
- A person who signs up on `recoverycommunity.app` gets a confirmation link back
  to that host. The link works only if that host is in the Supabase redirect
  allowlist.

**UNT:**
- The redirect allowlist and site URL.
- Server-side CAPTCHA enforcement on auth.
- Whether one person keeps one `auth.uid()` and one `people` row across hosts
  (Gate 3).

---

## 4. Gate 5 — Consent and notices (no submissions)

The method for every row was Playwright navigation with rendered-text capture.
Full page text is not committed; its SHA-256 is in `browser`. Quotes are verbatim
excerpts.

| ID | URL | Time | Observed | Identifier | Label | Limitation |
|---|---|---|---|---|---|---|
| F5.1 | `https://vrcc.app/recovery-residences/grace-house/apply` | 04:10:57.215 | Field names: applicant name, phone, email, contact preference, voicemail safety, `age18`, county, timing, housing situation, free text, accommodation needs, referral source, honeypot `companyWebsite`, hidden `cf-turnstile-response`, required `consentToContact`. Consent: *"I agree that Grace For Addictions may process this application and contact me about Grace House using the method I selected. If I am helping someone apply, I have their permission to share this information."* Notice: *"Your information is limited to people authorized to support the intake process. Account setup is optional after submitting."* | text sha256 `374cf5b6…` | LIVE | Nothing was submitted; post-submit handling was not observed |
| F5.2 | `https://vrcc.app/recovery-residences/ejwrh/apply` | 04:11:01.047 | Same fields. Consent: *"I agree that Grace For Addictions may process this application and contact me about EJWRH using the method I selected. …"* | text sha256 `b3a31fa1…` | LIVE | same |
| F5.3 | `https://vrcc.app/register` | 04:10:46.293 | Fields: first name, last name, email, password. Copy: *"Free, private, and yours."* **No privacy notice, terms, or consent language observed before submission.** | text sha256 `da1bc7a5…` | LIVE | Post-sign-up onboarding was not observed |
| F5.4 | `https://vrcc.app/sign-in` | 04:10:43.702 | Email and password only | `browser` | LIVE | — |
| F5.5 | `https://vrcc.app/support` | 04:10:48.916 | Crisis lines (911, 988, Iowa Warm Line); described as *"no account, no cost, no judgment"* | `browser` | LIVE | — |
| F5.6 | Authenticated housing consent (`HousingConsentPage` chunk, `DocumentDetailPage` chunk) | 04:06:35–04:07:11 (retrieval) | Electronic-consent step (*"You may withdraw electronic consent; existing signed records remain available"*); `consent_grants` and `consent_types` reads and inserts | chunk sha256s in `artifacts` | ARTIFACT | Never rendered or run |

**Needs review; not a defect finding (INF):** F5.2 names *Grace For Addictions*
as the party that processes EJWRH applications. Under GFA's organizational
boundaries, EJWRH is not a GFA house, and wraparound support does not establish
operation or control. The wording may be accurate if GFA runs intake under an
agreement. Check it against current approved EJWRH–GFA records. This is a records
review, not a runtime test.

**UNT:**
- Any privacy notice shown after sign-up.
- Creation, scope, and enforcement of `consent_grants`, and enforcement of
  withdrawal.

---

## 5. Gate 6 — Data destinations

### F6.1 Destinations found

| ID | Destination | Purpose | Where observed | Time | Method | Identifier | Label | Limitation |
|---|---|---|---|---|---|---|---|---|
| F6.1a | `cqcxvwoukyhxyokfwnjm.supabase.co` REST, RPC, auth, realtime | All signed-in data access. 48 distinct `.from()` names and 36 distinct RPCs (static string match across the 28 assets) | bundle + chunks | 04:06:33–04:07:11 | static string search | `artifacts` | ARTIFACT | Call sites enumerated, not exercised |
| F6.1b | `…/functions/v1/residence-intake` | Account-less housing applications; service-role insert into `recoveryos.residence_application_intake` | bundle; `supabase/functions/residence-intake/index.ts` | same | string search; source read | `artifacts`; Rev `95b3e6c` | ARTIFACT + REPO | See §7 for the origin boundary |
| F6.1c | `…/functions/v1/grace` | Grace assistant (`messages` body) | chunk | same | string search | `artifacts` | ARTIFACT | Governed by `grace-model-lock.json`, which was not re-verified here |
| F6.1d | Same-origin `/api/weather/des-moines` → Worker → `api.open-meteo.com` | Fixed-location weather; no user data | `http` route rows; `workers/platform/index.mjs` | 04:07:52–04:07:58 | GET; source read | cf-ray per row | LIVE + REPO | Upstream call inferred from source |
| F6.1e | `challenges.cloudflare.com` (Turnstile) | Bot challenge on both apply pages; loads on page view, before any submission | `browser` (F5.1, F5.2) | 04:10:57; 04:11:01 | Playwright request log | sanitized URLs | LIVE | Challenge POSTs were aborted, so the real-visitor flow may differ |
| F6.1f | `static.cloudflareinsights.com` + `POST /cdn-cgi/rum` | **Cloudflare Web Analytics beacon**, on all 17 page loads | `browser` | 04:10:16–04:11:07 | Playwright request log | `aborted_non_get` entries | LIVE | Beacon POSTs were aborted; what it collects for real visitors was not observed |
| F6.1g | `gracehouse4.pages.dev` | External "Apply online" link for Grace House | bundle | 04:06:33–04:06:35 | string search | `artifacts` | ARTIFACT | Link only; not followed |

### F6.2 Network behavior during unauthenticated page loads (LIVE, `browser`)

- **Zero requests to Supabase** across all 17 page loads.
- **Aborted non-GET requests:**
  - `POST /cdn-cgi/rum` on every page;
  - three `POST challenges.cloudflare.com/cdn-cgi/challenge-platform/…` on each
    apply page (paths redacted in the bundle).

### F6.3 Web Analytics beacon provenance

| Evidence | Label |
|---|---|
| Beacon script absent from the `curl`-fetched HTML (sha256 `f50ba5b0…`) and from the locally built `index.html` | LIVE + BUILD |
| No mention of `cloudflareinsights`, `cdn-cgi/rum`, or "web analytics" in `docs/` on `main` | REPO |
| The beacon is injected at the Cloudflare edge (Web Analytics automatic setup) and is undocumented in the repository | INF |
| Its configuration and data handling | UNT |

---

## 6. Discrepancies between documentation and runtime

| Documented (REPO) | Observed (LIVE / BUILD) | Status |
|---|---|---|
| `vrcc.app` is a separate legacy entrance pending cutover (`docs/architecture/recoverycommunity-domain-map-2026-09-24.md`) | Current serving behavior is identical to the `recoverycommunity.*` hosts | Differs from the historical description; Cloudflare bindings **UNT** |
| `www.recoverycommunity.*` handled in `App.tsx` | Neither name resolves | Differs |
| Production builds come from reviewed refs (`deploy-production-candidate.yml`) | Served assets reproduce from `95b3e6c`, a release branch diverged from `main` | Consistent with a release-branch deploy; whether that is intended is **UNT** |
| No analytics destination documented | Cloudflare Web Analytics beacon present | Documentation gap |

---

## 7. Procedural scope deviation — `residence-intake` CORS preflight

| Item | Record |
|---|---|
| Authorization boundary | The 2026-10-29 Pass 1 authorization excluded invoking write endpoints |
| What occurred | Three `OPTIONS /functions/v1/residence-intake` requests, one per `Origin` value. Headers sent: `Access-Control-Request-Method: POST`, `Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info`. No `apikey` or `Authorization` header was sent. |
| Why it exceeded the boundary | `residence-intake` is a write endpoint; the requests reached its handler |
| Mutation | None expected. At Rev `95b3e6c`, `handler.ts` returns `204` for `OPTIONS` before any validation or write. |
| Ruling | Executive Director, 2026-10-29: **retain with qualification, labeled as a non-mutating OPTIONS probe that exceeded the original endpoint restriction. Do not repeat under the existing authorization.** |
| Evidence | `supp.cors_preflight_residence_intake` |

| Origin | Time | Status | `access-control-allow-origin` | `sb-request-id` | Label |
|---|---|---|---|---|---|
| `https://vrcc.app` | 04:12:01Z | 204 | `https://vrcc.app` | `01a185db-9214-734a-b97e-bd46a6503117` | LIVE (deviation) |
| `https://recoverycommunity.center` | 04:12:01Z | 204 | **absent** | `01a185db-9443-7fa2-aa75-185523a73284` | LIVE (deviation) |
| `https://recoverycommunity.app` | 04:12:02Z | 204 | **absent** | `01a185db-95b3-7bb7-abd4-b97311cfe6e3` | LIVE (deviation) |

**Repository context (REPO, Rev `95b3e6c`; unchanged on `main`).**
`ALLOWED_ORIGINS` in `supabase/functions/residence-intake/handler.ts` lists:
- `recoveryresidence.org` and `.app` (with `www.`);
- `gracehouse4.pages.dev`;
- `vrcc.app` and `www.vrcc.app`;
- two `workers.dev` origins;
- `localhost:5173`.

It does **not** list either `recoverycommunity.*` origin. A POST from an
unlisted origin returns `403 forbidden_origin`.

**What these observations do not establish.** A preflight response is not a
submission. They do not show that any application succeeded or failed. They also
don't show how a browser, Turnstile hostname attestation, or the receiver would
treat an actual POST.

**Conclusion (INF, high priority).** The observed CORS preflight responses and
inspected receiver code indicate a probable cross-origin submission
incompatibility for applications started on either `recoverycommunity.*` host.
A completed application transaction has not been tested. If confirmed, a person
seeking recovery housing from either Community Center address could be unable
to apply, with nothing telling them why.

**Verification required before treating this as a confirmed participant-facing
defect:** a separately authorized synthetic submission from each
`recoverycommunity.*` apply page (preferably against staging), or the
equivalent receiver logs.

---

## 8. Gates 3 and 4 — outside Pass 1

- **Gate 3, identity continuity and duplicate prevention: UNT.** Needs synthetic
  accounts on each host, plus a read-only check that one person maps to one
  `people` row.
- **Gate 4, authorization and RLS enforcement: UNT.** Unauthenticated loads
  issued no data requests, so there was nothing to deny. Needs a synthetic
  role-matrix negative test against the deployed build. The register's
  `pg_policies` observation remains Class D for this reviewer.

## 9. Evidence still required to complete Gates 2–6

**Needs separate runtime or access authorization:**
1. **Intake origin (priority):** a synthetic submission from each
   `recoverycommunity.*` apply page (staging preferred), or receiver logs. Then a
   decision on whether to allowlist those origins plus their Turnstile
   hostnames, or to route the apply pages to `vrcc.app`.
2. **Deployment record:** read access to Cloudflare Worker deployments and
   custom-domain bindings, or the `deploy-production-candidate` run log.
3. **Auth configuration:** read access to Supabase Auth settings (site URL,
   redirect allowlist, CAPTCHA enforcement).
4. **Synthetic identity tests (Gates 2–4):** cross-host sign-in continuity, one
   `people` row per person, an RLS denial matrix by role, and anonymous direct
   REST denial.
5. **Consent persistence (Gate 5):** a synthetic housing-consent flow covering
   `consent_grants` creation, scope, withdrawal, and enforcement.

**Records or configuration review only (no runtime authorization needed):**

6. **Analytics review (Gate 6):** Cloudflare Web Analytics settings, plus a
   privacy assessment for pages used by people seeking recovery support.
7. **Boundary language:** the EJWRH apply consent wording against current
   approved EJWRH–GFA records.

**Deferred by decision:** a local build of `main`, to test whether production
assets differ from `main`.

## 10. Limitations

- These are point-in-time observations from one network vantage point, through
  an egress proxy, with Cloudflare cache HITs. Edge behavior can vary by location.
- Byte-identical reproduction ties the assets to `95b3e6c`'s build inputs, not to
  a deployment event. The Worker script itself cannot be observed; only its
  behavior was compared with source.
- Browser probes ran headless with non-GET requests aborted. Pages that depend on
  those requests (analytics, the Turnstile handshake) may render differently for
  real visitors.
- Artifact analysis is static string inspection. Call sites inside signed-in
  areas were enumerated, not exercised.
- The DNS lookups, `/release.json` bodies, auth settings, preflight results, and
  build result were transcribed from session output, as marked in `supp`. Other
  timestamps are capture-file write times.
- No test touched authentication, authorization, consent persistence, or data
  writes. Absence of an observed failure is not evidence of correct enforcement.

## 11. Disposition

**DR-02: Open — contested.** Pass 1 narrows the question but does not answer it.

The observed deployment is one served artifact, reproducible from `95b3e6c`. It
has one Worker behavior profile and one Supabase project, and it is served on
three hosts with host-dependent entry routing. That is compatible with a
shared-platform architecture. It does not favor Abstract, Unify, or Hybrid.

Pass 1 also surfaced a probable boundary inconsistency, the intake origin
allowlist, that any architectural decision will need to resolve explicitly.

No architecture is approved. No production change is authorized.
