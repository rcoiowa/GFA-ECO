# DR-02 Runtime Verification Report — Read-Only Pass 1 (2026-10-29)

**Status: EVIDENCE REPORT — NO DISPOSITION.** DR-02 remains **open and
contested**. Abstract, Unify, and Hybrid remain candidates; none is approved.
This report authorizes nothing.
**Authorization:** Executive Director (Thomas), 2026-10-29. The scope was a read-only first
pass over Gates 1, 2, 5, and 6, using only unauthenticated, non-mutating requests.
**Prepared on branch:** `claude/dr-02-runtime-verification-pass-1`, from
`origin/main` at `3f710a3b32d79af527c1cf738e4b3ba08b480922`.
**Reviewing environment:** Claude Code cloud session (Linux container, outbound
HTTPS via agent proxy, `curl` 8.x, Playwright Chromium, Node 22.22.0,
pnpm 10.34.5). All observations were made 2026-10-29 between 04:06:13Z and
04:12:02Z.
**Related records:** [Distinction Register — Audit v1.0](gfa-recoveryos-distinction-register-2026-10-28.md)
(canonical DR-02 tracker) and the evidence-portability proposal on branch
`claude/dr-02-evidence-portability-proposal` (`787b1b6`, not ratified).

## Controls observed

- Only `GET`, `HEAD`, and `OPTIONS` requests were sent. In the headless browser, every
  other method was aborted before it left the client and logged (see §6).
- No sign-in was attempted. No accounts were created and no forms were submitted. No
  edge function or RPC was invoked except one CORS preflight (`OPTIONS`) per origin
  against `residence-intake`, whose source returns `204` with no side effect
  (`handler.ts`, line 132 at the release commit).
- No participant records were requested. Unauthenticated page loads made **zero**
  requests to the Supabase REST, RPC, or auth APIs.
- The publishable Supabase key and Turnstile site key are public by design. They were
  used only to read `/auth/v1/settings` and to reproduce the build locally. They are
  not reproduced in this report.
- No Cloudflare, DNS, Supabase, or repository configuration was changed.

## Classification key

Each finding carries one of four classifications, assigned **by this reviewer**.
The Evidence Ledger classes (A–F) follow in parentheses.

| Label | Meaning |
|---|---|
| **OBS** | Observed runtime behavior: an HTTP response or browser behavior seen directly (Class B for this reviewer) |
| **REPO** | Repository-supported configuration: source at a named commit (Class B for repository contents only; not deployment proof) |
| **INF** | An inference that needs more verification (Class E) |
| **UNT** | Untested: outside this pass's authority or not observable unauthenticated (Class F) |

---

## Summary — what Pass 1 established

1. **All three hosts serve one byte-identical artifact.** `recoverycommunity.center`,
   `recoverycommunity.app`, and `vrcc.app` (plus `www.vrcc.app`) return
   byte-identical HTML, JS, CSS, and manifest assets. They also show the same
   Worker-only behaviors. (OBS)
2. **The deployed build declares release `95b3e6c` and backend `cqcxvwoukyhxyokfwnjm`.**
   It does so in `/release.json` on every host. (OBS; this is a self-declared
   identifier, not a deployment record.)
3. **Building `95b3e6c` locally reproduces the served artifact byte for byte.**
   With the production workflow's build inputs, all 28 JS/CSS assets, `index.html`,
   and `manifest.webmanifest` match exactly. (OBS + REPO.) Any commit with identical
   build inputs would produce the same output, so this is strong evidence, not proof
   of the deployed SHA.
4. **The deployed release is not `main`.** `95b3e6c` is the tip of
   `origin/release/residence-ownership-20261024`. It has 29 commits not on `main`,
   and `main` has 10 not in it. The two differ in 36 files under
   `apps/platform/src`, `workers`, `wrangler.jsonc`, and `supabase/functions`. Any
   statement drawn from `main` source must be checked against `95b3e6c` before it is
   applied to production. (REPO)
5. **The documentation's picture of `vrcc.app` does not match what is live.** The
   domain map (2026-09-24) describes `vrcc.app` as a separate legacy entrance waiting
   for its own cutover. Live, it serves the same artifact and Worker behavior as the
   two `recoverycommunity.*` hosts. (OBS vs. REPO documentation.) Whether one Worker
   or several identical Workers serve the three hosts is **UNT**.
6. **Possible housing-application failure on two hosts.** The `residence-intake`
   receiver's CORS preflight **allows `https://vrcc.app` and denies
   `https://recoverycommunity.center` and `https://recoverycommunity.app`** (OBS),
   matching its source allowlist (REPO). The Grace House and EJWRH apply forms are
   served on all three hosts. On the two `recoverycommunity.*` hosts, the Worker's own
   `/residence/directory?apply=…` redirect sends visitors to a same-origin apply
   page. The likely result is that a person applying from either
   `recoverycommunity.*` host cannot submit. That is **INF, high confidence,
   untested**, because confirming it needs a submission.
7. **No same-origin session sharing between hosts (inference).** All three hosts use
   one Supabase auth project, with the client configured as
   `persistSession: true` (browser-origin storage). Sessions therefore cannot carry
   across hosts by default. (REPO + INF; continuity is **UNT**.)

---

## Gate 1 — Deployed routes and application boundaries

### 1.1 DNS and reachability

| Host | Observed (UTC) | Result | Retrieval | Classification |
|---|---|---|---|---|
| `recoverycommunity.center` | 04:06:13Z | `HTTP/2 200`, `server: cloudflare`, `cf-cache-status: HIT`, cf-ray `a51f4e73d9d31278` | `curl -D` | OBS |
| `recoverycommunity.app` | 04:06:15Z | `HTTP/2 200`, Cloudflare, cf-ray `a51f4e782a987c81` | `curl -D` | OBS |
| `vrcc.app` | 04:06:15Z | `HTTP/2 200`, Cloudflare, cf-ray `a51f4e7c897e0f45` | `curl -D` | OBS |
| `www.vrcc.app` | 04:06:15Z | `HTTP/2 200`, Cloudflare, same A records as apex | `curl -D`; DoH | OBS |
| `www.recoverycommunity.center` | 04:06:14Z | No DNS record (DoH `Status 3`, NXDOMAIN); proxy 502 | DoH via `cloudflare-dns.com` | OBS |
| `www.recoverycommunity.app` | 04:06:14Z | No DNS record (NXDOMAIN); proxy 502 | DoH | OBS |

The apex A records are Cloudflare anycast (`recoverycommunity.center` →
`172.67.184.106`, `104.21.32.79`; `recoverycommunity.app` → `172.67.130.115`,
`104.21.3.71`; `vrcc.app`/`www.vrcc.app` → `104.21.46.106`, `172.67.137.198`).

**Note:** source (`App.tsx` at `95b3e6c`) maps the `www.` variants of both
`recoverycommunity.*` hosts, but neither `www.` name currently resolves. (OBS vs.
REPO.) Anyone typing `www.` reaches nothing.

### 1.2 Served artifact identity

| Asset | Hosts | Identifier | Classification |
|---|---|---|---|
| `/` (HTML shell, 2,183 B) | all three + `www.vrcc.app` | md5 `e3befa84f5dd6581c66bf2f36ef026ba` | OBS |
| `/assets/index-DGeObB_M.js` (668,398 B) | all three | sha256 `0507457aeefd742c3242d4baedd9ccb692304e9046882e44ca2cd65db7f22c39`; ETag `"b99b3ab78944e80dda7c05135723eb8c"` | OBS |
| `/assets/index-HKWrEb7g.css` (47,408 B) | all three | sha256 `3c0d92cebfca2cca2995e1b61df86cc21b7f44fe16aa756ba3922879b0dca44b` | OBS |
| 27 lazy chunks referenced by the main bundle | `vrcc.app` | all `200` | OBS |
| `/release.json` | all three (04:08:20–21Z) | `{"release":"95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b","supabaseProject":"cqcxvwoukyhxyokfwnjm"}` | OBS (self-declared) |

### 1.3 Source revision — reproducible-build check

- **Method:** `git worktree` at `95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b`;
  `pnpm install --frozen-lockfile`; `pnpm build` with `NODE_ENV=production`;
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` taken from that commit's
  `.github/workflows/deploy-production-candidate.yml`; `VITE_TURNSTILE_SITE_KEY`
  from the served `/gfa/contact-config.json`; `VITE_RELEASE` set to the declared SHA.
- **Result:** all 28 served JS/CSS assets, `index.html`, and `manifest.webmanifest`
  are byte-identical (`cmp`) to the local build. Local `release.json` matches the
  served file.
- **Note on method:** the first build ran with the container's
  `NODE_ENV=development`, which bundled React's development build and did not match.
  Only the production-mode rebuild is used as evidence.
- **Classification:** OBS (byte equality) + REPO (source at `95b3e6c`).
- **Limitation:** this establishes that the served assets are *consistent with*
  `95b3e6c` and with any other commit that has identical build inputs. It does not
  identify the deployment event, the actor, or the Worker script version. The
  workflow's deployment record and the Cloudflare deployment history are **UNT**.

### 1.4 Worker behavior

The Worker source (`workers/platform/index.mjs`) is identical at `95b3e6c` and
`main`. Every probe below returned the same result on each of the three hosts
(04:07:51–04:08:00Z, `curl`):

| Path | Observed | Repository expectation | Classification |
|---|---|---|---|
| `/api/weather/des-moines` | `200`, `application/json`, `cache-control: public, max-age=300, s-maxage=900` | Worker weather handler (`WEATHER_ENABLED=true` in `wrangler.jsonc`) | OBS + REPO |
| `/residence/directory?apply=ejwrh` | `302` → `<same-origin>/recovery-residences/ejwrh/apply`, `no-store` | Worker directory redirect | OBS + REPO |
| `/residence/directory?apply=grace` | `302` → `<same-origin>/recovery-residences/grace-house/apply` | same | OBS + REPO |
| `/vrcc/today`, `/app/today`, `/sign-in`, `/recovery-residences`, unknown path | `200`, identical SPA shell | `not_found_handling: single-page-application` | OBS + REPO |

- **INF:** all three hostnames route to a Worker running this script's logic.
- **UNT:** whether that is a single Worker (`gfa-eco-recovery-residence-os`) or
  more than one. This needs Cloudflare custom-domain bindings (read access) or the
  deployment record.

### 1.5 Client-side routing (headless browser, fresh context per URL)

| URL | Final URL | Classification |
|---|---|---|
| `https://recoverycommunity.center/` | stays; renders the Community Center lobby | OBS |
| `https://recoverycommunity.app/` | `/sign-in` (via `/vrcc/today` guard) | OBS |
| `https://vrcc.app/` | stays; VRCC public home | OBS |
| `https://vrcc.app/vrcc/today`, `/app/today`, `/staff`, `/admin` | `/sign-in` (no `next` parameter) | OBS |
| `https://vrcc.app/my-housing` | `/sign-in?next=%2Fmy-housing` | OBS |
| `https://vrcc.app/recovery-residences/my-application` | `/sign-in?next=%2Frecovery-residences%2Fmy-application` | OBS |
| `https://vrcc.app/register`, `/support`, `/community-center`, `/recovery-residences*` | public pages render | OBS |

- **Limitation:** these redirects are **client-side guards** (`RequireAuth` in
  `App.tsx`). The server returns the same `200` shell for every path. Client-side
  guards are not an authorization control; enforcement depends on RLS and RPC
  checks, which this pass did not test (Gate 4, **UNT**).
- **Note:** `/staff`, `/admin`, and `/vrcc/today` drop the return path, while
  `/my-housing` keeps it. This is a usability difference, not a security finding.

---

## Gate 2 — Authentication configuration (public, no sign-in)

| Finding | Evidence | Classification |
|---|---|---|
| A single auth backend for all hosts: `https://cqcxvwoukyhxyokfwnjm.supabase.co`, schema `recoveryos` | Only Supabase URL in the bundle; `db:{schema:"recoveryos"}`; `release.json` | OBS (artifact) |
| Auth methods in the client: email/password `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `signOut` | Bundle strings; `RegisterPage.tsx`, `packages/auth/src/actions.ts` at `95b3e6c` | OBS (artifact) + REPO |
| Server settings: email provider only; `disable_signup: false`; `mailer_autoconfirm: false` (email confirmation required); SAML off; passkeys off | `GET /auth/v1/settings` with the publishable key, 04:11:40Z, `200` | OBS |
| Session persistence: `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, default browser storage | Bundle | OBS (artifact) |
| No cookies or `localStorage` keys are set before sign-in on any probed page | Playwright, fresh contexts | OBS |
| Sign-up confirmation links return to `window.location.origin`, i.e. the host the person registered on | `RegisterPage.tsx:42` at `95b3e6c` | REPO |
| Turnstile is loaded on the housing apply pages; it was **not** loaded on `/sign-in` or `/register` | Playwright request log | OBS |

**Inferences (INF):** browser-origin storage means a session created on one host
does not exist on the others. A person who signs up on `recoverycommunity.app`
would get a confirmation link back to that host. That link works only if the host
is in the Supabase allowed redirect URL list.

**Untested (UNT):** the allowed redirect URL list and site URL; whether CAPTCHA is
enforced server-side on sign-up or sign-in (not exposed by `/auth/v1/settings`);
whether one person keeps one `auth.uid()` and one `people` row across hosts
(Gate 3). All of these need dashboard read access or synthetic accounts.

---

## Gate 5 — Consent and notices (no submissions)

| Surface | Observed text and fields | Classification |
|---|---|---|
| `/recovery-residences/grace-house/apply` and `/ejwrh/apply` (`vrcc.app`, 04:10:57Z and 04:11:01Z) | Fields: name, phone, email, contact preference, voicemail safety, age-18 attestation, county, timing, housing situation, free text, accommodation needs, referral source, a honeypot `companyWebsite`, hidden `cf-turnstile-response`, and a required checkbox: *"I agree that Grace For Addictions may process this application and contact me about [Grace House / EJWRH] using the method I selected. If I am helping someone apply, I have their permission to share this information."* A notice below reads: *"Your information is limited to people authorized to support the intake process. Account setup is optional after submitting."* | OBS |
| `/register` (04:10:46Z) | First name, last name, email, password. Copy: *"Free, private, and yours."* **No privacy notice, terms, or consent language was observed on the page before submission.** | OBS |
| `/sign-in` | Email and password only | OBS |
| `/support` | Crisis lines (911, 988, Iowa Warm Line); described as *"no account, no cost, no judgment"* | OBS |
| Housing consent after sign-in | The bundle includes a `HousingConsentPage`, an electronic-consent step (*"You may withdraw electronic consent; existing signed records remain available"*), and `consent_grants`/`consent_types` reads and inserts | OBS (artifact only) |

**Needs review, not a defect finding (INF):** the EJWRH apply consent names
*Grace For Addictions* as the party that processes the application. Under GFA's
organizational boundaries, EJWRH is not a GFA house, and GFA's wraparound support
does not establish operation or control. The wording may be accurate if GFA runs
intake under an agreement. This should be checked against current approved
EJWRH–GFA records, not inferred.

**Untested (UNT):** whether a privacy notice appears after sign-up or during
onboarding; whether `consent_grants` rows are created, scoped, and honored as the UI
describes; whether consent withdrawal is enforced server-side. These need
synthetic accounts.

---

## Gate 6 — Data destinations (publicly observable)

### 6.1 Destinations in the deployed artifact

| Destination | Purpose (per artifact or source) | Classification |
|---|---|---|
| `cqcxvwoukyhxyokfwnjm.supabase.co` REST, RPC, auth, realtime | All authenticated data access; 48 distinct names referenced via `.from()` and 36 distinct RPCs (static string match across all 28 chunks) | OBS (artifact) |
| `…/functions/v1/residence-intake` | Public housing applications (account-less); service-role insert into `recoveryos.residence_application_intake` | OBS (artifact) + REPO |
| `…/functions/v1/grace` | Grace assistant (`messages` body) | OBS (artifact); governed by `grace-model-lock.json` (not re-verified here) |
| Same-origin `/api/weather/des-moines` → Worker → `api.open-meteo.com` | Fixed-location weather; no user data in the request | OBS + REPO |
| `challenges.cloudflare.com` (Turnstile) | Bot challenge on apply pages; loads on page view, before any submission | OBS |
| `static.cloudflareinsights.com` + `POST /cdn-cgi/rum` | **Cloudflare Web Analytics beacon**, present on every page | OBS |
| `gracehouse4.pages.dev` | External "Apply online" link for Grace House | OBS (artifact) |

### 6.2 Network behavior during unauthenticated page loads

Seventeen URLs were loaded (Playwright Chromium, a fresh context per URL, non-GET requests aborted):

- **Zero requests to Supabase** on any public page. (OBS)
- **Blocked non-GET attempts** (aborted by the harness, never sent):
  `POST /cdn-cgi/rum` on every page (Cloudflare Web Analytics), and
  `POST challenges.cloudflare.com/cdn-cgi/challenge-platform/…` on the two apply
  pages (Turnstile's challenge handshake, sitekey `0x4AAAAA…`). (OBS)
- **Cloudflare Web Analytics is not in the repository artifact.** The beacon
  script is not in the served HTML fetched with `curl` or in the locally rebuilt
  `index.html`. A search of `docs/` on `main` for `cloudflareinsights`,
  `cdn-cgi/rum`, and `web analytics` found nothing. **INF:** the beacon is injected
  at the Cloudflare edge (Web Analytics automatic setup) and is undocumented in the
  repository. Its configuration and data handling are **UNT**.

### 6.3 Intake receiver origin boundary

| Origin (preflight `OPTIONS`, 04:12:01–02Z) | `access-control-allow-origin` | `sb-request-id` |
|---|---|---|
| `https://vrcc.app` | `https://vrcc.app` (allowed) | `01a185db-9214-734a-b97e-bd46a6503117` |
| `https://recoverycommunity.center` | **absent (denied)** | `01a185db-9443-7fa2-aa75-185523a73284` |
| `https://recoverycommunity.app` | **absent (denied)** | `01a185db-95b3-7bb7-abd4-b97311cfe6e3` |

- **REPO:** `ALLOWED_ORIGINS` in `supabase/functions/residence-intake/handler.ts`
  (unchanged between `95b3e6c` and `main`) lists the `recoveryresidence.*`
  origins, `gracehouse4.pages.dev`, `vrcc.app`, `www.vrcc.app`, two `workers.dev`
  origins, and `localhost`. It does **not** list either `recoverycommunity.*`
  origin. A non-allowlisted POST returns `403 forbidden_origin`.
- **INF (high confidence, untested):** applications started on
  `recoverycommunity.center/…/apply` or `recoverycommunity.app/…/apply` would fail
  in the browser. Turnstile's hostname attestation, which must match the submitting
  origin, is a second likely failure point. Confirming this needs a synthetic
  submission or a staging replica, which require separate authorization.
- **Participant impact if confirmed:** a person seeking recovery housing could be
  unable to apply from either Community Center address, with nothing telling them
  why. This is the most time-sensitive item in this report.

---

## Discrepancies between documentation and runtime

| Documented (repository) | Observed | Classification |
|---|---|---|
| `vrcc.app` is a separate legacy entrance pending cutover (`docs/architecture/recoverycommunity-domain-map-2026-09-24.md`) | Serves the identical artifact and Worker behavior as `recoverycommunity.*` | OBS vs. REPO |
| `www.recoverycommunity.*` handled in `App.tsx` | Neither `www.` name resolves in DNS | OBS vs. REPO |
| Production builds come from reviewed refs (`deploy-production-candidate.yml`) | Live release `95b3e6c` is on a release branch that has diverged from `main` | OBS + REPO; whether this is intended is **UNT** |
| No analytics destination documented | A Cloudflare Web Analytics beacon is present | OBS; documentation gap |

## Gates 3 and 4 — not in scope for Pass 1

- **Gate 3, identity continuity and duplicate prevention: UNT.** This needs synthetic
  accounts on each host and a read-only check that one person maps to one `people`
  row (`ensure_person_for_current_user`).
- **Gate 4, authorization and RLS enforcement: UNT.** Unauthenticated loads issued no
  data requests, so there was nothing to deny. This needs a synthetic role matrix
  (participant, resident, coach, navigator, staff, admin) running negative tests
  against the deployed build. The `pg_policies` observation in the register remains
  Class D for this reviewer.

## Evidence required to complete Gates 2–6

Each item below needs **separate authorization**.

1. **Intake origin defect (priority):** a synthetic application from each
   `recoverycommunity.*` apply page to a staging replica, or a single labeled
   synthetic submission against production with an agreed cleanup path. Then a
   decision on whether to add those origins to `ALLOWED_ORIGINS` and the Turnstile
   hostname list, or to route the apply pages to `vrcc.app`.
2. **Deployment record:** read access to the Cloudflare Worker deployments and
   custom-domain bindings (or the `deploy-production-candidate` run log). This would
   confirm the Worker version, that `95b3e6c` was the deployed ref, and whether one
   Worker serves all three hosts.
3. **Auth configuration:** read access to the Supabase Auth settings (site URL,
   redirect allowlist, CAPTCHA enforcement).
4. **Synthetic identity tests** (Gates 2–4): accounts created on each host;
   sign-in continuity across hosts; one `people` row per person; RLS denial matrix by
   role; anonymous direct REST denial.
5. **Consent persistence** (Gate 5): a synthetic housing-consent flow verifying
   `consent_grants` creation, scope, withdrawal, and enforcement.
6. **Analytics review** (Gate 6): Cloudflare Web Analytics settings and a privacy
   assessment for pages used by people seeking recovery support.
7. **Boundary language:** confirm the EJWRH apply consent wording against current
   approved EJWRH–GFA records.

## Limitations

- These are point-in-time observations (2026-10-29, 04:06–04:12Z) from one network
  vantage point through an egress proxy. Cloudflare cache status was `HIT`, and edge
  behavior can vary by location.
- Byte-identical reproduction ties the assets to `95b3e6c`'s build inputs, not to a
  deployment event. The Worker script itself cannot be observed from outside; only
  its behavior was compared with source.
- Browser probes ran in headless Chromium with non-GET requests aborted. Pages that
  depend on those requests (analytics, the Turnstile handshake) may render
  differently for real visitors.
- Bundle analysis is static string inspection. Call sites inside unvisited
  authenticated areas were enumerated but not exercised.
- No test touched authentication, authorization, consent persistence, or data
  writes. Absence of an observed failure is not evidence of correct enforcement.

## Disposition

**DR-02: Open — contested.** Pass 1 narrows the question but does not answer it.
The deployed reality is **one artifact, one Worker logic, one Supabase project,
served on three hosts with host-dependent entry routing**. That is compatible with
a shared-platform architecture, but it does not by itself favor Abstract, Unify,
or Hybrid. It also exposes at least one boundary inconsistency (the intake origin
allowlist) that an architectural decision will need to resolve explicitly. No
architecture is approved; no production change is authorized.
