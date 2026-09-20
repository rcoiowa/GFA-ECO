# Recovery Residence Domain Architecture — Gate A baseline + prepared Gate B/C plan

**Date:** 2026-09-20 · **Status:** GATE A COMPLETE (read-only). Gate B is a *prepared* plan; Gate C is an activation checklist awaiting Thomas's explicit authorization. **No DNS, deploy, publish, organization, residence, role, or test-application change was made.**

Evidence legend: **VERIFIED LIVE** (a tool call this session) · **VERIFIED SOURCE** (repo config on `main`) · **INFERRED** · **REQUIRES ACCESS** (not reachable with the tools available this session).

## Tooling limits (stated honestly, so nothing below is guessed as fact)
- The Cloudflare connector here exposes **Workers list + Worker code**, KV/D1/R2/Hyperdrive, and docs search. It does **not** expose **zones, DNS records, Worker routes, custom-domain bindings, Pages projects, per-Worker bindings/vars, or certificates**. So every hostname→Worker binding and cert/DNS fact is **REQUIRES ACCESS** (Cloudflare dashboard or a zone-scoped API token).
- This environment's egress proxy **blocks `recoveryresidence.org` and `recoveryresidence.app`** (`connect_rejected` — policy denial; confirmed against the proxy status endpoint). General egress works (cloudflare.com, example.com, supabase all responded), and `*.thomas-499.workers.dev` is reachable — so the custom-domain serving state of the two target domains **could not be observed** here and is REQUIRES ACCESS. A `502` seen from this box is the proxy, **not** evidence about the sites.

---

## 1. Current-state domain and deployment map

**Account Workers (VERIFIED LIVE — `workers_list`, 10 total):**
| Worker | Modified | Role (VERIFIED SOURCE / INFERRED) | Disposition |
|---|---|---|---|
| `gfa-eco-recovery-residence-os` | 2026-09-01 | **Canonical platform SPA** — root `wrangler.jsonc`, assets `./apps/platform/dist`, SPA fallback. **VERIFIED LIVE:** `https://gfa-eco-recovery-residence-os.thomas-499.workers.dev` → 200 text/html | KEEP — canonical target for both surfaces |
| `recoveryos-staging` | 2026-09-02 | **Staging** — `wrangler.staging.jsonc`, same build pattern. **VERIFIED LIVE:** workers.dev → 200 text/html | KEEP — staging |
| `virtualrecovery` | 2026-08-16 | vrcc.app production-adjacent MVP worker | Do not touch without a gate |
| `vrcc-app` | 2026-08-16 | vrcc.app-family build, purpose unverified | Cleanup candidate (REQUIRES ACCESS) |
| `vite-react-template`…`template5` (5) | 2026-08-01/02 | starter templates | Safe to retire |
| `recovery-residence-os` | 2026-07-29 | stale RecoveryResidenceOS SPA | Deprecate |

Account subdomain: **`thomas-499.workers.dev`** (VERIFIED LIVE).

**Domains (serving state):**
| Domain | Serving today | Evidence |
|---|---|---|
| `recoveryresidence.org` | **UNVERIFIED here** — intended public directory | REQUIRES ACCESS (proxy-blocked; no route/custom-domain tool) |
| `recoveryresidence.app` | **UNVERIFIED here** — intended authenticated workspace | REQUIRES ACCESS |
| `vrcc.app` | Current production front door (per residence-intake allowlist comment, "production front door from the 2026-08-31 cutover") | VERIFIED SOURCE (comment) / binding REQUIRES ACCESS |
| `gracehouse4.pages.dev` | Grace House static site + a Grace House application front end (allowlisted origin) | VERIFIED SOURCE (allowlist + applyUrl) |

**The app is currently ONE unified SPA that already host-routes both target domains** (VERIFIED SOURCE, `apps/platform/src/App.tsx`):
- `recoveryresidence.org` / `www` → home `/recovery-residences` (public directory)
- `recoveryresidence.app` / `www` → home `/recovery-residences/list-your-residence`
- `gracehouse.graceforaddictions.org` → `/recovery-residences/grace-house`

So the code is *aware* of both hosts but serves them from a **single deployment and a single route namespace** — it is not yet the two-surface split this architecture proposes.

**Current public routes (VERIFIED SOURCE):** `/recovery-residences`, `/recovery-residences/list-your-residence`, `/recovery-residences/grace-house`, `/recovery-residences/grace-house/apply`, `/recovery-residences/my-application`, `/support`, `/sign-in`, `/register`, `/forgot-password`, `/reset-password`. Authenticated areas live in the **same** app under `/residence/*`, `/staff/*`, `/coach/*`, `/navigator/*`, `/admin/*`, `/residences`, `/residences/applications/intake`, `/onboarding`, `/home`.

**Canonical intake writer (VERIFIED SOURCE — do not duplicate):** `supabase/functions/residence-intake` is the single service-role writer. It already:
- Allowlists origins **including `recoveryresidence.org`, `www.recoveryresidence.org`, `recoveryresidence.app`, `www.recoveryresidence.app`** (plus `gracehouse4.pages.dev`, `vrcc.app`, the two workers.dev origins, localhost). **No allowlist change is needed to accept the new domains.**
- Rejects missing/unapproved Origin, fails closed without `TURNSTILE_SECRET` (unless `INTAKE_TURNSTILE_OPTIONAL=true`), verifies Turnstile **hostname == submitting Origin** and **action**, resolves `residence_id` **server-side** and requires the residence row to be **active**, returns only an id (no read-back). Point 11 guards are intact in source.

**EJWRH (canonical residence_id 2) — the important reconciliation:**
- **Canonical working front door (KEEP):** SPA `applyUrl: '/residence/directory/?apply=ejwrh'` → `submitResidenceApplication` → `residence-intake` with `residence_id` (2), `kind: grace_house_application`/`residence_application`. VERIFIED SOURCE (`residenceListings.ts`, `publicIntake.ts`). The code comment states the Supabase `ejwrh` functions URL "is not a valid browser front door (text/plain, origin-rejected)."
- **The `ejwrh` Edge Function portal (the "broken competing front door", point 12):** `supabase/functions/ejwrh` — a self-contained portal page; **SUPA-FN-001: provenance UNKNOWN → NO REDEPLOY.** A prepared edge worker `sites/ejwrh/worker.prepared.js` (route `recoveryresidence.org/ejwrh*` → the ejwrh function) is **PREPARED, NOT DEPLOYED.**
- **Conclusion:** point 6's "existing working `?apply=ejwrh`" and point 12's "broken portal" are **different surfaces**. Keep the SPA→residence-intake writer; redirect or retire the `ejwrh` portal (do not deploy `sites/ejwrh`).

**Deploy-safety baseline (VERIFIED SOURCE — rollback discipline already exists):** `deploy-staging.yml` and `deploy-production-candidate.yml` are manual-only, require a `release_ref`, pin `wrangler@4.14.0`, and require a successful CI run for the exact commit; `workers/api` is deployment-quarantined (`DEPLOY BLOCKED`); `scripts/verify-cloudflare-boundaries.mjs` enforces all of this in CI.

---

## 2. Target architecture

Two surfaces, one canonical database and one canonical intake writer:

- **`recoveryresidence.org` — public Recovery Residence Network** (directory, residence profiles, eligibility/fees, participant rights, referral-partner info, residence-specific application routes). Anonymous-readable public content only; no authenticated workspace.
- **`recoveryresidence.app` — authenticated Recovery Residence Workspace** (orgs/operator relationships, residence admin, application review, screening/admission, room/bed inventory, document execution, staff assignments, incidents/grievances/transitions/fees/reporting). Login-gated; all reads/writes through existing RLS + role scoping.
- **Shared invariants:** GFA is an organization + service/technology provider, **not a residence**; EJWRH stays **residence_id 2** (no new record); public **slugs** (`grace-house`, `ejwrh`) resolve **server-side** to canonical residence rows — **database IDs are never the public routing authority**; the `residence-intake` boundary remains the single writer.

Multi-tenant scope (target, enforced by the existing authorization estate): organization-, residence-, assignment-, and capability-scoped access, supporting Grace House, EJWRH, additional GFA residences, and independently operated partner residences across multiple organizations/operators.

---

## 3. Exact proposed DNS and Worker-route changes (PREPARED — not applied)

> All of these are Gate C actions requiring authorization. DNS/route specifics are **proposals**; the exact current bindings are REQUIRES ACCESS and must be read from the Cloudflare dashboard before applying.

**Option 1 (recommended) — one build, two custom domains, host-routed (matches current design):**
- Keep the single canonical Worker `gfa-eco-recovery-residence-os` (assets SPA).
- Bind **custom domain** `recoveryresidence.org` (+ `www` → apex redirect) to the canonical Worker.
- Bind **custom domain** `recoveryresidence.app` (+ `www` → apex redirect) to the **same** canonical Worker; the app's host-based routing renders the public surface for `.org` and the authenticated surface for `.app`.
- DNS: `recoveryresidence.org`, `www` and `recoveryresidence.app`, `www` as **proxied (orange-cloud) CNAME/AAAA** to the Worker custom-domain target; TLS via Cloudflare universal/advanced cert covering both apex+www.
- No Worker **route** patterns needed if custom domains are used (custom domain binding supersedes route patterns).

**Option 2 — two Workers (harder separation):** deploy the public build to one Worker on `.org` and the authenticated build to a second Worker on `.app`. More isolation, more surface; only choose if `.app` must not ship any public code. Not recommended for Phase 1 given the unified codebase.

**Do NOT:** deploy `sites/ejwrh` (the portal worker) as a route on `.org/ejwrh*`; that reintroduces the SUPA-FN-001 portal as a competing front door.

**Turnstile:** configure a Turnstile site key whose allowed hostname includes `recoveryresidence.org` (Turnstile attests hostname == submitting Origin), and set `TURNSTILE_SECRET` in the residence-intake Edge secrets (see §4).

---

## 4. Authentication and authorization impact

- **Intake origin allowlist:** already covers `recoveryresidence.org/.app` — no change required to accept submissions once the domains serve the app. (A later cleanup decision may prune stale origins such as `gracehouse4.pages.dev`/`vrcc.app`; not required for cutover.)
- **Turnstile:** the hardened `residence-intake` fails closed without `TURNSTILE_SECRET`. Before `.org` applications go live, confirm `TURNSTILE_SECRET` is set **and** the `.org` forms mint tokens for the expected hostname/action — otherwise applications are correctly rejected. (Same class of front-door check flagged for `residence-intake` earlier.)
- **`lead-intake`:** deployed but **inert** — `LEAD_INTAKE_SECRET` is unset (503 `intake_disabled`), so the `.org` contact/lead path won't write until the secret is set and the Wix (or `.org` form) sender is wired. Relevant to `.org` "referral-partner"/contact flows.
- **Auth callbacks / cookie boundary (`.app`):** Supabase Auth cookies are host-scoped. If `.app` is a **separate host** from where sign-in currently happens, verify: the Supabase project's **redirect/allow-list URLs** include `https://recoveryresidence.app/*` callback paths; cookies are set on `.app` (not shared cross-domain with `.org` — which is correct, the public site should be anonymous). This is the primary **NEEDS VERIFICATION (Gate B)** item.
- **RLS / role scoping:** unchanged and already enforced (84/84 tables RLS-enabled; 0147/0149 predicate boundary live). The domain split does not alter authorization — it only changes which UI surface is served per host.

---

## 5. Migration / redirect map for existing URLs

Public (`.org`) — old → new (target routes are NEW; add redirects so no live URL 404s):
| Existing | Target | Redirect |
|---|---|---|
| `/recovery-residences` | `/residences` | 301 |
| `/recovery-residences/grace-house` | `/residences/grace-house` | 301 |
| `/recovery-residences/grace-house/apply` | `/apply/grace-house` | 301 |
| `/residence/directory/?apply=ejwrh` (canonical EJWRH) | `/apply/ejwrh` (internally redirects to the existing working route; **same residence-intake writer, residence_id 2**) | internal redirect |
| `/recovery-residences/list-your-residence` | `.app` list-your-residence or `.org/for-referral-partners` (decision) | 301/302 |
| `/recovery-residences/my-application` | `/apply/status` or `.app` (decision) | 301 |
| `ejwrh` Edge Function portal | redirect to `recoveryresidence.org/apply/ejwrh` **or** retire after traffic/dependency review (point 12) | 301 or retire |
| new | `/rights`, `/for-referral-partners`, `/residences/ejwrh` | create in `.org` build |

Authenticated (`.app`) target routes to establish: `/login`, `/residences`, `/residences/grace-house`, `/residences/ejwrh`, `/applications`, `/admissions`, `/beds`, `/documents`, `/incidents`, `/grievances`, `/reports`, `/settings/access` — mapped onto the existing `/staff/*`, `/admin/*`, `/residence/*` areas (wire, don't rebuild).

Slug resolution: `grace-house` → residence_id 1, `ejwrh` → residence_id 2, resolved **server-side** (the intake handler already resolves + active-checks `residence_id`; the public directory should resolve slug→row server-side too, never expose the id as the routing key).

---

## 6. Staging verification plan (Gate B — prepared, staging only)
1. Build (`pnpm build`) at a pinned release commit; deploy to `recoveryos-staging` via the existing manual, CI-gated workflow (no production DNS).
2. Exercise all **new public routes** on the staging workers.dev origin: `/residences`, `/residences/grace-house`, `/residences/ejwrh`, `/apply/grace-house`, `/apply/ejwrh`, `/rights`, `/for-referral-partners`; confirm slug→residence resolves server-side and `/apply/ejwrh` internally reaches the existing working EJWRH route.
3. Verify every old→new redirect returns the intended 301/302.
4. **Synthetic EJWRH submission** against staging → `residence-intake` with `INTAKE_TURNSTILE_OPTIONAL` on a staging secret (never production), synthetic data only, confirming it binds `residence_id 2`, active-check passes, and no second writer is involved. (Do **not** submit against production.)
5. `.app` auth: on staging, verify sign-in callback, cookie set on the `.app`-equivalent host, session persists, and an unauthenticated hit on an `.app` route redirects to `/login`.
6. Confirm the `ejwrh` portal decision (redirect vs retire) behaves as chosen on staging.
7. Mobile/accessibility smoke pass on the new public routes.

## 7. Rollback plan
- **Repo:** every change lands on a branch → PR → CI green; production candidate is a pinned commit. Revert = redeploy the previous pinned commit (the deploy workflow records exact commit/branch).
- **DNS/custom domains:** capture the exact pre-change binding of `.org`/`.app` (dashboard) **before** Gate C; rollback = re-point the custom domain to its prior target. Keep `vrcc.app` untouched as the current production front door until `.org/.app` are proven, so there is always a working surface.
- **Intake:** no writer change, so nothing to roll back there; the allowlist is additive. If Turnstile/secret issues arise, the receiver fails closed (safe) — fix config, not code.
- **Workers:** no deletion of any Worker during activation; cleanup of template/experiment Workers is a separate, later, owner-confirmed step.

## 8. Decisions required from Thomas
1. **Public route rename** `/recovery-residences/*` → `/residences/*` + new `/apply/*`, `/rights`, `/for-referral-partners` — approve the redirect map (§5).
2. **One-Worker host-routing (Option 1) vs two-Worker split (Option 2)** for `.org` vs `.app` (§3). Recommendation: Option 1.
3. **`ejwrh` portal disposition:** redirect to `recoveryresidence.org/apply/ejwrh`, or retire after a traffic/dependency review (point 12).
4. **`.app` as a distinct auth host:** confirm we add `https://recoveryresidence.app/*` to the Supabase Auth redirect allow-list and treat `.app` as the authenticated cookie host.
5. **Turnstile + secrets for `.org`:** authorize configuring a Turnstile site key for `recoveryresidence.org` and setting `TURNSTILE_SECRET` (and, separately, `LEAD_INTAKE_SECRET` if `.org` should feed the lead path).
6. **Stale-origin cleanup timing:** keep or prune `gracehouse4.pages.dev`/`vrcc.app` from the intake allowlist (not required for cutover).
7. **Cloudflare read access:** grant dashboard access or a zone/Pages-scoped API token so the current DNS/route/cert bindings can be captured before Gate C (currently REQUIRES ACCESS).

## 9. Activation checklists (Gate C — per domain; requires explicit authorization after staging evidence)

**recoveryresidence.org (public directory):**
- [ ] Capture current `.org` DNS/route/cert binding (rollback point).
- [ ] Deploy approved public build (pinned commit, CI green) to the canonical Worker.
- [ ] Bind `recoveryresidence.org` (+ `www`→apex) custom domain; verify TLS (valid cert, HSTS).
- [ ] Verify new public routes + slug→residence resolution + all redirects (§5).
- [ ] Verify `/apply/ejwrh` and `/apply/grace-house` reach the canonical `residence-intake` writer (residence_id 2 / 1); Turnstile passes on `.org`.
- [ ] Confirm the `ejwrh` portal is redirected or retired per decision 3.
- [ ] Mobile/accessibility check; monitoring/alerts on.

**recoveryresidence.app (authenticated workspace):**
- [ ] Capture current `.app` DNS/route/cert binding (rollback point).
- [ ] Add `https://recoveryresidence.app/*` to Supabase Auth redirect allow-list.
- [ ] Deploy approved build; bind `recoveryresidence.app` (+ `www`→apex) custom domain; verify TLS.
- [ ] Verify `/login` + callback + cookie set on `.app`; unauthenticated `.app` routes redirect to `/login`.
- [ ] Verify authorization: role/residence/assignment scoping holds on the `.app` routes (no cross-org/residence leakage); fixtures remain de-privileged.
- [ ] Verify the operational routes (`/applications`, `/admissions`, `/beds`, `/documents`, `/incidents`, `/grievances`, `/reports`, `/settings/access`) load under an authorized staff identity.
- [ ] Mobile/accessibility check; monitoring/alerts on; `vrcc.app` left intact until `.app` is proven.

_No DNS, deployment, publish, organization, residence, role, or application change is made by this document. Gate C requires Thomas's explicit authorization._
