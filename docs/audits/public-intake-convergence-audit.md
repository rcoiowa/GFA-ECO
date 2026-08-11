# Public Intake Convergence — Grace House + RecoveryResidence Domain Audit

**Date:** 2026-08-11 · **Type:** pre-production convergence audit + implementation preparation
· **Canonical backend:** `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch / "CQCX") · **Legacy:**
`ykykeioydvtxpyreshhs` ("YKY") · **Third-party:** `kmvlkvfxrjqrfxsljvxl` ("KMVL", the external
Grace House / gracehouse4 Lovable backend).

Status vocabulary: **CONFIRMED** (from source/config in this repo) · **DRIFT** (implementation
conflicts with current governance) · **SAFE** · **NOT IMPLEMENTED** · **UNKNOWN** (not inferable
from evidence available) · **BLOCKED** (needs runtime access this session lacks).

> Access note: Supabase MCP is authenticated to **YKY only** and was **not authorized** this
> session; there is **no Cloudflare API access**. All live-runtime facts (dashboard env vars,
> Pages bindings, DB row state, DNS) are therefore **UNKNOWN/BLOCKED** and marked as such. Findings
> below are from repository source + committed config unless explicitly labeled otherwise.

---

## Governance baseline (what is canonical _now_)

The current directive and the newest in-repo evidence agree: **CQCX is the canonical system of
record; YKY is a retired dev/archive project.** This is a governance change that post-dates most of
the repo's documentation.

- **CONFIRMED** canonical=CQCX: `apps/platform/src/main.tsx:23`, `.env.example:5`,
  `.github/workflows/ci.yml:23-35` (fails the build if the bundle contains YKY / lacks CQCX),
  `deploy-production-candidate.yml:19,42-53`, `scripts/sync-directory-site.mjs`,
  `docs/launch/launch-foundation-completion-report.md` (2026-08-08, "RecoveryOS-Launch").
- **SUPERSEDED** docs still calling YKY canonical: `docs/architecture/canonical-frontend-decision.md`
  (2026-08-07), `docs/source-inventory/deployment-registry.md`, `docs/discovery/deployment-registry.md`
  (2026-08-04, literally "canonical system of record"). Per governance ("verified live-system
  evidence and current ratified decisions override old docs"), these are historical.
- **Two migration lines** coexist: `supabase/migrations/` (0000–0036) is the **dev/YKY archive
  history**; `supabase/launch/migrations/` (0000–0121) is the **canonical CQCX bootstrap** proven
  from an empty project (launch report §D). New schema work extends the launch line — this audit
  adds `0122`.

---

## PHASE A — Source + runtime inventory

### 1. gracehouse4.pages.dev (external Grace House public site)

| Attribute                     | Finding                                                                                                                                                              | Status                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Source repo / branch          | `GFAVRCC/grace-harbor-16` / `main` (Lovable React+TS+shadcn)                                                                                                         | UNKNOWN (doc-asserted, `docs/source-inventory/deployment-registry.md:12`, marked UNVERIFIED; repo not in session scope) |
| Deployment                    | Cloudflare Pages `gracehouse4`                                                                                                                                       | CONFIRMED (referenced across docs); binding details BLOCKED (no CF access)                                              |
| Supabase project it writes to | Documented **KMVL** (`kmvlkvfxrjqrfxsljvxl`); discovery probe 2026-08-04 found "no live application-submission endpoint in the page"                                 | UNKNOWN — **not CQCX**; runtime unverifiable                                                                            |
| YKY references                | none in this repo (site is out-of-repo)                                                                                                                              | —                                                                                                                       |
| Cross-domain                  | `apps/platform` links out to `https://gracehouse4.pages.dev/` for document review (`ResidenceApplyPage.tsx:224`, `GraceHousePage.tsx:91`, `residenceListings.ts:34`) | CONFIRMED                                                                                                               |

**Definitive answer to "what does gracehouse4 write to today?":** Not confirmable this session (no
Cloudflare/Lovable access). Documented backend is **KMVL, a separate project** — _not_ CQCX. The
one 2026-08-04 probe found no in-page submission endpoint at all. **Inference: LIKELY KMVL or
none — NOT CQCX → NOT SAFE FOR REAL APPLICATIONS.** (Distinguished from confirmed runtime evidence,
which is BLOCKED.)

### 2. RecoveryResidence directory / recoveryresidence.org build

| Attribute              | Finding                                                                                                                                                    | Status                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Source                 | `sites/recoveryresidence-directory/index.html` — static vanilla HTML/JS, listings hard-coded, 20 `.docx` downloads                                         | CONFIRMED                      |
| Supabase at rest       | `index.html:890-891` → **YKY** REST host + publishable key                                                                                                 | **DRIFT (at rest, by design)** |
| Build/serve            | `scripts/sync-directory-site.mjs` copies → `apps/platform/public/residence/directory/index.html`, served at `/residence/directory/` by the platform Worker | CONFIRMED                      |
| Build guard            | sync rewrites YKY→CQCX, refuses non-canonical URLs, throws if any YKY ref survives, requires `Content-Profile: recoveryos`                                 | CONFIRMED (fail-closed)        |
| Built artifact backend | **CQCX only** (verified this session: built asset YKY count 0, CQCX count 1, header present)                                                               | **SAFE**                       |

### 3. Canonical RecoveryOS staging directory

`https://recoveryos-staging.thomas-499.workers.dev/residence/directory/` — served from
`recoveryos-staging` Worker (`wrangler.staging.jsonc`, deploy-staging.yml on branch
`claude/grace-coaching-audit-b0fyhq`). Backend baked in at build = CQCX. **SAFE** (must remain
CQCX-only; now double-guarded by `scripts/check-no-retired-ref.mjs`).

### 4. Grace House application flow

| Path                                                                         | Project                              | Schema     | Target                                                         | Auth                         | Status                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------ | ---------- | -------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| In-platform `ResidenceApplyPage.tsx` → `applications.ts:22`                  | CQCX                                 | recoveryos | `residence_applications` insert                                | **Authenticated** (RLS 0018) | **SAFE** — but requires an account (not pre-account)                                                                            |
| External gateway `workers/api/src/index.ts` `/public/residence-applications` | **YKY** (`wrangler.toml:9`, pre-fix) | recoveryos | `residence_applications` + **auto-creates auth user + person** | Anonymous → service role     | **DRIFT** (YKY) **+ architectural DRIFT** (auto-provisions identities — violates "no auto-provision from anonymous submission") |

### 5. Referral flow

`sites/recoveryresidence-directory/index.html` → anon `POST /rest/v1/referrals`,
`Content-Profile: recoveryos`; table `recoveryos.referrals` (launch 0016/0110) has a **constrained
anon INSERT** policy (`status='received'`, handler fields null) and staff-only read/triage via RPC
`triage_residence_referral`. YKY at rest, **CQCX at build**. **SAFE.**

### 6. "List your residence" flow

`sites/recoveryresidence-directory/index.html:229` is a JavaScript `alert('… coming soon … email
listings@recoveryresidence.org')`; footer/empty-state are plain-text email. `apps/platform`'s
`/list-your-residence` is a registration funnel, not a listing record. **No
`residence_listing_submissions` table existed anywhere.** **NOT IMPLEMENTED.** (The directive's
"mailto link" description is imprecise — it was an `alert()`, not even a mailto.)

---

## Deliverable A — EXECUTIVE STATUS

| Surface                                   | Status                                                                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grace House public site** (gracehouse4) | **UNKNOWN → treat as UNSAFE** for real applications (backend documented as KMVL, not CQCX; runtime BLOCKED)                                                                 |
| **Grace House Apply**                     | **UNSAFE (today).** In-platform _authenticated_ path is SAFE; the _public pre-account_ path (external gateway) was YKY + auto-provisioning. Fix **prepared, not deployed.** |
| **RecoveryResidence directory staging**   | **SAFE** (CQCX-only built artifact, fail-closed sync guard, now CI-guarded at source too)                                                                                   |
| **RecoveryResidence listing submission**  | **NOT IMPLEMENTED** → boundary now **prepared** (table + Edge Function + adapter), needs form wiring + deploy                                                               |
| **RecoveryResidence referrals**           | **SAFE** (built path is CQCX-only; constrained anon insert)                                                                                                                 |
| **recoveryresidence.org**                 | **NOT READY** (public-directory view + listing intake prepared; frontend build, seed of published rows, and domain binding pending)                                         |
| **recoveryresidence.app**                 | **ROLE RECOMMENDED** — Option A; binding **HELD** until post-cutover                                                                                                        |

---

## Deliverable B — CURRENT WRITE MAP

| Surface                                      | Action | Current project                 | Current schema | Current target                                                                                                   | Desired project                  | Desired target                           | Status                                     |
| -------------------------------------------- | ------ | ------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------- | ------------------------------------------ |
| In-platform Grace House apply                | INSERT | CQCX                            | recoveryos     | `residence_applications` (auth)                                                                                  | CQCX                             | `residence_applications` (unchanged)     | **SAFE**                                   |
| External Grace House gateway (`workers/api`) | INSERT | YKY → **CQCX (prepared)**       | recoveryos     | `residence_applications` + auth/person creation → **`residence_application_intake`, no provisioning (prepared)** | CQCX                             | `residence_application_intake`           | **DRIFT → FIXED (prepared, not deployed)** |
| gracehouse4 external app                     | INSERT | KMVL / unknown                  | unknown        | unknown                                                                                                          | CQCX (via gateway)               | `residence_application_intake`           | **UNKNOWN / UNSAFE**                       |
| Directory referral                           | INSERT | YKY-at-rest → **CQCX at build** | recoveryos     | `referrals`                                                                                                      | CQCX                             | `referrals`                              | **SAFE**                                   |
| "List your residence"                        | INSERT | none (`alert`)                  | —              | —                                                                                                                | CQCX (via `residence-intake` fn) | `residence_listing_submissions`          | **NOT IMPLEMENTED → prepared**             |
| Public directory browse                      | SELECT | none (hard-coded)               | —              | —                                                                                                                | CQCX                             | `residence_directory_public` view (anon) | **prepared**                               |
| Website lead intake (Wix)                    | INSERT | CQCX                            | recoveryos     | `leads` (Edge fn `lead-intake`)                                                                                  | CQCX                             | `leads`                                  | **SAFE (unchanged)**                       |

---

## Deliverable C — DOMAIN REGISTRY

| Domain                                | Current state                               | Future role                                                                            | Deployment                                                         | Backend                                                     | Cutover status                                                                              |
| ------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **vrcc.app**                          | LIVE PROD (legacy Worker `virtualrecovery`) | Primary RecoveryOS/VRCC platform                                                       | → canonical Worker `gfa-eco-recovery-residence-os` at cutover      | CQCX (post-cutover)                                         | **HELD** — DNS repoint needs explicit auth (do not touch)                                   |
| **recoveryresidence.org**             | Owned, unlinked                             | Public national directory (search, profiles, referrals, listing submission, education) | new/thin frontend or platform route serving `/residence/directory` | CQCX (public view + intake)                                 | **NOT READY** — do not connect yet                                                          |
| **recoveryresidence.app**             | Owned, unlinked                             | Authenticated operator/staff experience                                                | **Option A** (alt hostname on canonical Worker)                    | CQCX                                                        | **HOLD** binding until post-cutover                                                         |
| **gracehouse4.pages.dev**             | LIVE separate Grace House site              | Public Grace House presentation (allowed to stay separate)                             | Cloudflare Pages `gracehouse4` (external Lovable)                  | KMVL/unknown today → **CQCX intake via gateway (prepared)** | separate frontend OK; system-of-record must converge to CQCX; **do not deploy gracehouse4** |
| **graceforaddictions.org/gracehouse** | Wix org site                                | Public org entry point for Grace House                                                 | Wix (native form; multi-email staff notify)                        | none (Wix) / optional `lead-intake` webhook                 | out of scope — do not modify Wix                                                            |
| **rcoiowa.org**                       | Live GFA initiative experience              | preserve as-is                                                                         | —                                                                  | —                                                           | **OUT OF SCOPE**                                                                            |
| **justgraceforaddictions.org**        | Owned/reserved                              | undecided                                                                              | —                                                                  | —                                                           | do not connect/modify                                                                       |

---

## Deliverable D — DRIFT REGISTER (every YKY dependency / schema mismatch)

| #   | Location                                                                  | Nature                                                                                                                               | Severity        | Disposition                                                                                                                                            |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | `workers/api/wrangler.toml:9` (pre-fix)                                   | **Real live value**: intake gateway `SUPABASE_URL` = YKY; **not** covered by the dist-only CI guard                                  | **HIGH**        | **FIXED (prepared)** → CQCX + now covered by `check-no-retired-ref.mjs`                                                                                |
| D2  | `workers/api/src/index.ts` (pre-fix)                                      | Gateway **auto-creates auth users + people** from anonymous submissions — violates the pre-account boundary + person-model authority | **HIGH**        | **FIXED (prepared)** → writes to `residence_application_intake`, no provisioning                                                                       |
| D3  | gracehouse4 backend                                                       | Documented as KMVL (separate project), not CQCX; unverifiable                                                                        | **HIGH**        | Converge via the refactored gateway (D1/D2); verify at deploy                                                                                          |
| D4  | `sites/recoveryresidence-directory/index.html:890-891`                    | YKY at rest (referral + will host listing)                                                                                           | MED (mitigated) | Accepted design: canonicalized to CQCX by `sync-directory-site.mjs` (fail-closed); source exempt in guard                                              |
| D5  | `supabase/functions/coaching/index.ts:95`, `supabase/functions/README.md` | Captured legacy Edge Function hard-coded to YKY + its deploy notes                                                                   | MED             | **Archive** (frozen migration source per `canonical-frontend-decision.md`); **must never be deployed to canonical**; guard-exempted with justification |
| D6  | `.mcp.json:5`                                                             | Supabase MCP `project_ref=ykykeioydvtxpyreshhs`                                                                                      | LOW             | Tooling config, not a deployable asset; left as-is (session MCP), flagged                                                                              |
| D7  | `.env.example:4` (pre-fix)                                                | Stale comment "project ref: ykykeioydvtxpyreshhs" above a CQCX value                                                                 | LOW             | **FIXED** (comment corrected)                                                                                                                          |
| D8  | `docs/**` registries                                                      | Call YKY "canonical system of record"                                                                                                | LOW             | Superseded by current governance; documentation-only                                                                                                   |
| D9  | `supabase/migrations/0000`, `0010` (+ launch mirror)                      | Legacy `gfa_*` schema exposure strings; `residence_applications.person_id` NOT NULL                                                  | INFO            | Dev-archive history / by-design FK — the reason a new pre-account intake table is required                                                             |

**Schema mismatch (root cause):** `recoveryos.residence_applications.person_id` is **NOT NULL FK to
people(id)** (`supabase/launch/migrations/0004_residences.sql:44`), and its only insert policy
requires `current_person_id()`. An anonymous, account-less applicant therefore **cannot** use it —
confirming the directive's instinct not to repoint historical `gfa_residence.applications` onto it.
A distinct pre-account intake object is required.

---

## Deliverable E — PROPOSED CQCX INTAKE MODEL

Architecture: **PUBLIC FRONTENDS → CONTROLLED CQCX INTAKE → STAFF REVIEW → CANONICAL RECORDS.**
Three distinct flows, never collapsed. Implemented additively in
`supabase/launch/migrations/0122_public_intake_boundary.sql`.

**Boundary decision (direct anon INSERT vs server-side):** the codebase already has both precedents
— constrained anon INSERT (`referrals`) and Edge-Function/service-role-only (`leads`, 0102). The
governance-correct split:

- **Referrals (Flow 3):** keep the existing constrained anon INSERT — low sensitivity, proven, in
  scope of "do not redesign unless evidence requires." **No change.**
- **Listing submission (Flow 1) + Grace House application (Flow 2):** **server-side Edge Function
  (service role), tables have NO anon grant.** For the _sensitive_ Grace House data this is
  materially safer than a browser anon insert: the sensitive table has zero anon privilege (defense
  in depth beyond RLS), the function allowlists fields, caps sizes, blocks read-back, and applies
  origin/honeypot/optional-Turnstile controls. Uniform boundary for both new flows.

| Object                                    | Purpose                                          | Write path                                                                              | Read/Update                                                            | Key safety                                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `residence_listing_submissions` (table)   | Flow 1 moderated directory intake                | Edge Function `residence-intake` (service role)                                         | RLS: **platform-admin** only; RPCs `review_…` / `publish_…`            | No anon grant; no INSERT policy; `submitted→under_review→approved→published`/`rejected`; publish **deliberately** creates the residence                                                             |
| `residence_application_intake` (table)    | Flow 2 pre-account Grace House apply (sensitive) | Edge Function `residence-intake` **or** refactored `workers/api` gateway (service role) | RLS: residence-staff **or** care-ops; no public SELECT; RPC `review_…` | No anon grant; no INSERT policy; **no person_id** (account-less); minimum-necessary fields; `received→…→converted`; conversion is a deliberate staff act — never auto-creates auth/people/residency |
| `residence_directory_public` (view)       | Public directory reads (no account)              | —                                                                                       | **anon SELECT** (curated columns; published rows only)                 | Excludes exact street/postal + all operational data; only `is_active AND is_public_directory`                                                                                                       |
| `residences.is_public_directory` (column) | Opt-in publication flag                          | —                                                                                       | staff                                                                  | Default **false** — nothing is exposed until a platform admin publishes it                                                                                                                          |
| `referrals` (existing)                    | Flow 3                                           | constrained anon INSERT (unchanged)                                                     | staff                                                                  | Unchanged                                                                                                                                                                                           |

Every review/publish RPC is `SECURITY DEFINER`, `authenticated`-only, staff-gated, and writes a
`recoveryos.audit_log` row. New-row triggers emit exception-safe in-app staff notifications (generic
body — no sensitive detail in notification text), mirroring `trg_lead_notify` (0102).

---

## Deliverable F — FILES CHANGED

**New**

- `supabase/launch/migrations/0122_public_intake_boundary.sql` — intake tables, public view,
  `is_public_directory`, RLS, review/publish RPCs, notification triggers, grants.
- `supabase/functions/residence-intake/index.ts` — service-role public intake Edge Function.
- `packages/data-access/src/repositories/publicIntake.ts` — `searchPublicDirectory`,
  `submitResidenceListing`, `submitGraceHouseApplication`.
- `packages/data-access/src/repositories/intakeReview.ts` — staff review adapters + RPC wrappers.
- `scripts/check-no-retired-ref.mjs` — Phase H source-level YKY guardrail (wired into CI).
- `scripts/verify-intake-boundary.mjs` — static security-invariant checks (16/16 pass).
- `supabase/launch/tests/residence_intake_fixtures.sql`, `…_cleanup.sql`, `README.md` — Phase I.
- `docs/audits/public-intake-convergence-audit.md` — this document.

**Modified**

- `workers/api/src/index.ts` — gateway writes to `residence_application_intake`, **no** identity
  provisioning.
- `workers/api/wrangler.toml` — `SUPABASE_URL` YKY → CQCX.
- `.github/workflows/ci.yml` — added `check-no-retired-ref` step.
- `.env.example` — corrected stale YKY comment.
- `packages/data-access/src/index.ts` — export the two new repositories.

---

## Deliverable G — SQL PREPARED

`supabase/launch/migrations/0122_public_intake_boundary.sql` (additive; idempotent-safe;
`begin/commit`; ends with `notify pgrst, 'reload schema'`). **Not applied** — no live disposable
non-production environment is authorized this session; apply to a **staging** project only.
Fixtures/cleanup: `supabase/launch/tests/residence_intake_fixtures.sql` /
`residence_intake_cleanup.sql`.

---

## Deliverable H — TEST EVIDENCE

Commands run this session (staging-free, runnable):

| Command                                                             | Result                                                                                                                     |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/check-no-retired-ref.mjs`                             | ✅ PASS (0 retired refs in deployable assets); proven to fail when YKY reintroduced                                        |
| `node scripts/verify-intake-boundary.mjs`                           | ✅ **16/16** invariants (no anon grant, RLS on, no INSERT policy, no read-back, anon-view granted, RPCs revoked from anon) |
| `pnpm install --frozen-lockfile`                                    | ✅                                                                                                                         |
| `pnpm typecheck` (10 projects incl. `workers/api`, `apps/platform`) | ✅ PASS                                                                                                                    |
| `pnpm build`                                                        | ✅ built; `apps/platform/dist` YKY=0, CQCX present                                                                         |
| synced `…/residence/directory/index.html`                           | ✅ YKY=0, CQCX=1, `Content-Profile: recoveryos` present                                                                    |
| `pnpm test`                                                         | ✅ 44 platform tests + package suites pass (no regression)                                                                 |

Live RLS behaviour tests (A–J: anon cannot read/update/delete intake, staff can review, no request
reaches YKY) are **prepared** in `supabase/launch/tests/README.md` and require a disposable staging
project (Supabase MCP unauthenticated + no Cloudflare access this session ⇒ **BLOCKED**, not run).

---

## Deliverable I — DEPLOYMENT PLAN (exact order; each step gated by explicit authorization)

1. **Converge public intake (staging).** Apply `0122` to a **staging** CQCX-clone project; deploy
   `residence-intake` Edge Function; deploy the refactored `workers/api` (service-role secret set,
   CQCX var) to a **staging** route. Run `supabase/launch/tests/README.md` A–K. Cleanup fixtures.
2. **Test Grace House.** Point a _staging_ copy of the gracehouse4 form (or a curl harness) at the
   staging gateway; confirm intake rows land in `residence_application_intake`, no auth/person
   created, staff can review, anon cannot read. Seed `is_public_directory=true` for Grace House;
   verify `residence_directory_public`.
3. **Prepare RecoveryResidence.org.** Wire the "List your residence" form + public directory search
   to the adapters; build the directory frontend; verify CQCX-only. Keep domain **unbound**.
4. **Deploy production candidate.** Apply `0122` to the **launch** project (no fixtures). Deploy the
   Edge Function + gateway to production routes. Re-point the _live_ gracehouse4 form to the CQCX
   gateway (external app change) so real applications stop going to KMVL/YKY. CI green incl. both
   YKY guards.
5. **Merge RecoveryOS.** Merge the working branch to `main` after review (separate from PR #4 /
   default-branch normalization, which are explicitly out of scope).
6. **Cut over vrcc.app.** Only with explicit authorization: repoint DNS to
   `gfa-eco-recovery-residence-os` per launch report §S. Bind `recoveryresidence.org` /
   `recoveryresidence.app` (Option A) at/after this step.
7. **Prove no YKY traffic.** Network-trace every intake path (curl + DB origin checks); confirm all
   hosts are CQCX; `check-no-retired-ref` green; no `residence_applications`/intake writes on YKY.
8. **Retire legacy resources.** After the observation window and separate authorization: freeze YKY
   (per §U), retire legacy workers (§V), archive `grace-harbor-16`/KMVL after Phase-8 data decision.

---

## Deliverable J — GO / NO-GO

The intake convergence **design and code are complete, typechecked, built, and unit-tested**, but
the flows are **not yet exercised against a live database**, and the two highest-severity drifts
(D1/D2/D3) are **fixed only in source, not deployed**. Real Grace House applications today still
have no safe CQCX path. Therefore:

**PUBLIC INTAKE CONVERGENCE: NO-GO**

Blockers preventing GO:

1. **Live verification blocked** — Supabase MCP unauthenticated (YKY-scoped) + no Cloudflare access;
   RLS tests A–J and the "no YKY traffic" proof (I.7) have not run.
2. **`0122` not applied** to any live project (needs a disposable staging CQCX clone).
3. **gracehouse4 still writes off-canonical** (KMVL/unknown) — the live external form must be
   re-pointed to the refactored CQCX gateway before it can accept real applications.
4. **Gateway fix not deployed** — `workers/api` (CQCX + no provisioning) exists only in source.
5. **recoveryresidence.org frontend not built** and no residences seeded as `is_public_directory`
   (the public view returns nothing until publication happens).
6. **Edge Function not deployed** and its secrets (`SUPABASE_SERVICE_ROLE_KEY`, optional
   `TURNSTILE_SECRET`) not set on the canonical project.
7. **Governance doc reconciliation** — superseded registries (D8) should be marked historical so YKY
   is unambiguously non-canonical in the record.

None of these are design defects; they are deploy-and-verify gates that, by directive, require
explicit authorization and a non-production target. Clearing 1–6 (and re-running Deliverable H's
live tier green) flips this to GO.

---

## PHASE G — recoveryresidence.app role (recommendation)

**Recommend Option A:** `recoveryresidence.app` is an **alternate hostname bound to the canonical
RecoveryOS Worker**, with hostname-aware routing that lands authenticated operators on `/residences`.

| Criterion                                     | A (alt hostname on canonical Worker)                                           | B (thin separate operator frontend)                         | C (redirect to vrcc.app/residences)                        |
| --------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| Auth / cookies                                | Same Worker/SPA under its own origin — clean, first-party session per hostname | Separate origin — its own auth surface to build + maintain  | Redirect loses deep-link context; session on vrcc.app only |
| Cross-origin                                  | None (same code, own hostname)                                                 | CORS to CQCX (fine) but a second app boundary               | Cross-site redirect friction                               |
| Maintenance / duplication                     | **Lowest** — one codebase, one deploy                                          | **Highest** — a second frontend to keep at parity           | Low, but the `.app` brand is just a signpost               |
| White-label potential                         | **Best** — hostname-aware theming/routing is the seam for future operators     | Possible but duplicated                                     | None                                                       |
| Fit with "one platform, one system of record" | **Strong**                                                                     | Weak (duplicate frontend risk the governance warns against) | Neutral                                                    |

Option A gives RecoveryResidence.app a real authenticated-operations identity without a second
frontend, and positions hostname-aware routing as the future white-label seam. **Bind only
post-cutover** (the canonical Worker must be the production surface first) — until then, **HOLD**.

## PHASE E / F — convergence & directory architecture (prepared, not connected)

- **Grace House (Phase E):** frontend stays separate (gracehouse4), **system of record converges to
  CQCX** via the refactored gateway → `residence_application_intake` (no identity provisioning).
  Prepared, not deployed; gracehouse4 itself is not touched.
- **recoveryresidence.org (Phase F):** public directory reads via `residence_directory_public`
  (anon, curated, published-only); listing submissions via `residence-intake` (moderated, never
  auto-published); referrals via the existing constrained anon path. No YKY; no auth for basic
  search; no operational data exposed; Grace House gets a richer profile + Apply action through the
  intake boundary. Domain remains unbound.

---

### Branch note

The directive names the working branch `claude/grace-coaching-audit-b0fyhq`; the harness pins pushes
to `claude/recoveryos-intake-audit-zouh7q`. To honor both, this work is built **on top of** the
canonical branch's code (merged in) and pushed only to the designated intake-audit branch.
