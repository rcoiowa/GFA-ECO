# Deployment Registry

Verified 2026-07-29 by direct inspection of the Cloudflare account (Workers list),
GitHub repository listing, live deployments, and cloned source trees in `source-builds/`.
Amended 2026-07-31 — see "2026-07-31 findings" below for the `gfa-vrcc.pages.dev`
Pages project and the new `gfa-eco-recovery-residence-os` Worker.

| Build                 | Repository                                                        | Branch                                      | Cloudflare Project                                                                   | Type                              | Domain(s)                                             | Data Source                                                          | Status                 |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| VRCC (current prod)   | `Grace-For-Addictions/vrcc.app`                                   | `main`                                      | Worker `virtualrecovery` (static assets, SPA)                                        | Base44-exported React (Vite, JSX) | `vrcc.app` + `virtualrecovery.thomas-499.workers.dev` | Base44 SDK + Supabase `ykykeioydvtxpyreshhs` (mvp module)            | **SOURCE** (live prod) |
| Recovery Residence OS | `Grace-For-Addictions/RecoveryResidenceOS`                        | `main`                                      | Worker `recovery-residence-os` (static assets, SPA)                                  | React 19 + TS + Vite + RR7        | `recovery-residence-os.thomas-499.workers.dev`        | Supabase `ykykeioydvtxpyreshhs` (`gfa_residence` + `gfa_ui` schemas) | **SOURCE** (live)      |
| Grace House           | `GFAVRCC/grace-harbor-16` (UNVERIFIED as the exact deploy source) | `main`                                      | Pages `gracehouse4` (UNVERIFIED — Pages projects not enumerable via available tools) | Lovable React + TS + shadcn       | `gracehouse4.pages.dev`                               | Supabase `kmvlkvfxrjqrfxsljvxl`                                      | **SOURCE**             |
| GFA Connection        | `Grace-For-Addictions/contact-connect-dashboard`                  | `main`                                      | Pages `gfaconnection` (named in its deploy script)                                   | Base44-style React (Vite, JSX)    | `gfaconnection.pages.dev`                             | Supabase `yqonwnzqtgmnoiymkefk`                                      | **SOURCE**             |
| Canonical RecoveryOS  | `rcoiowa/GFA-ECO`                                                 | `claude/recoveryos-greenfield-build-ka6992` | none yet (staging pending)                                                           | pnpm monorepo, React 19 + TS      | target: `vrcc.app`                                    | Supabase `ykykeioydvtxpyreshhs` (target)                             | **CANONICAL**          |

## Key verified facts

1. **The Cloudflare account contains exactly two Workers**: `virtualrecovery` and
   `recovery-residence-os`. Both are static-asset SPA deployments, not API workers.
2. **vrcc.app IS Git-backed.** `Grace-For-Addictions/vrcc.app` contains
   `wrangler.jsonc` with `"name": "virtualrecovery"`; its last push
   (2026-07-28T00:49:12Z) is within 42 seconds of the `virtualrecovery` worker's last
   modification (2026-07-28T00:49:54Z); both `vrcc.app` and
   `virtualrecovery.thomas-499.workers.dev` serve the same title ("GFA VRCC —
   Connection Prevents Crisis"). Source builds A and D are **the same application** —
   one deployment, two URLs. The §7 "recover the non-Git build" task is therefore
   resolved: the editable source exists and is cloned in `source-builds/vrcc-current/`.
3. **Three different Supabase projects are in use** across builds (see
   data-source-registry.md). `ykykeioydvtxpyreshhs` is the shared/canonical one.
4. `source-builds/` clones are gitignored intake material, not production code.

## 2026-07-31 findings (the "two separate builds" question, answered)

Verified via the Cloudflare Workers list and the account's dashboard information
supplied by GFA:

1. **Pages project `gfa-vrcc` (`gfa-vrcc.pages.dev`) is a stale, superseded
   deployment of the same legacy VRCC app** — production branch `main`, last
   deployment ~2026-07-08 (23 days before this note), last commit
   `fix(coach-notes): surface save failures in CoachNoteForm (Gate 20c-3)`
   (Base44 code — `base44.auth.me()`). The Worker `virtualrecovery` was created
   2026-07-20 and took over serving `vrcc.app` from the same repository
   (`Grace-For-Addictions/vrcc.app`); the Pages project simply stopped receiving
   deploys. **Nothing is lost by archiving it**: its source of truth is the same
   Git repository that feeds the Worker. So yes — two deployments existed, but
   of one build; the live one is the Worker, and `gfa-vrcc.pages.dev` should be
   treated as ARCHIVED (leave it read-only or delete the Pages project once GFA
   confirms no bookmarks depend on it).
2. **A third Worker now exists: `gfa-eco-recovery-residence-os`** (created
   2026-07-30, dashboard "Hello world" starter — no real build ever deployed).
   Its name matches this repository (`rcoiowa/GFA-ECO`). The canonical platform's
   `apps/platform/wrangler.jsonc` has been renamed to match it, so the first real
   deploy (CLI or dashboard Git build) replaces the stub instead of minting a
   fourth deployment. Setup steps: `docs/deployment/consolidation-2026-07-31.md`.
3. The account therefore has exactly three Workers (`virtualrecovery`,
   `recovery-residence-os`, `gfa-eco-recovery-residence-os`) plus the legacy
   Pages projects. The consolidation end-state is unchanged: one canonical
   platform (this repo) serving `vrcc.app`, everything else ARCHIVED.

## 2026-08-31 CLASSIFICATION: `recoveryos-staging` is ACTIVE PILOT, not disposable staging

Executive notice 2026-08-31: real residents and coaches were given
`recoveryos-staging.thomas-499.workers.dev` and created accounts/onboarding activity there.
Verified: all of it lives in canonical CQCX (66 auth users = 66 people, roles, consents,
activity; backend identical to the production candidate). Treat the Worker as an **active
pilot surface**: never redeploy it with a non-CQCX backend, never tear it down while pilot
users depend on it. Full evidence and the URL-transition plan:
`docs/operations/staging-pilot-reconciliation-2026-08-31.md`.

## 2026-08-31 deployment (executive order: deploy updates to Cloudflare)

Commit `ec36922` (Gate B intake experience + 0146 EJWRH document-edition activation)
deployed to both canonical Workers via the repo's own workflows, on the executive
deployment order of 2026-08-31:

- **`recoveryos-staging`** — `deploy-staging.yml` run 71 (workflow_dispatch on the
  working branch), success; Worker modified 2026-08-31T00:28Z.
- **`gfa-eco-recovery-residence-os`** (production candidate) — first real deploy,
  replacing the 2026-08-07 build: `deploy-production-candidate.yml` run 1, triggered by
  trigger branch `deploy-candidate/ejwrh-activation-ec36922`; typecheck + full test suite +
  build + canonical-backend bundle guard all passed in-workflow; success; Worker modified
  2026-08-31T00:31Z. Both Workers verified updated via the Cloudflare account API.

**Deliberately NOT performed** (each is its own gated action, not an "update"):

1. **vrcc.app DNS/domain cutover** to the candidate Worker (Phase 9) — the deploy
   workflow states it never performs cutover; the domain still serves the legacy
   `virtualrecovery` Worker.
2. **EJWRH public route** `recoveryresidence.org/ejwrh*` (prepared Worker in
   `sites/ejwrh/`) — its activation checklist (Turnstile on `residence-intake`, route/zone
   binding, production-URL synthetic E2E) remains open; the application portal continues to
   serve from the Supabase functions URL.

| Deployment                             | Now                                      | After cutover                                               |
| -------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Worker `virtualrecovery` (vrcc.app)    | SOURCE — do not modify                   | ARCHIVED (workers.dev URL retained read-only until retired) |
| Worker `recovery-residence-os`         | SOURCE — do not modify                   | ARCHIVED                                                    |
| Worker `gfa-eco-recovery-residence-os` | CANONICAL staging target (stub, replace) | serves `vrcc.app` (Phase 9)                                 |
| Pages `gfa-vrcc`                       | ARCHIVED (stale duplicate of vrcc.app)   | retire after confirming no bookmarks                        |
| Pages `gracehouse4`                    | SOURCE                                   | ARCHIVED                                                    |
| Pages `gfaconnection`                  | SOURCE                                   | ARCHIVED (experiential concepts mined)                      |

> **2026-08-31: superseded for current state by `docs/operations/recoveryos-canonical-state-2026-08-31.md`** — the authoritative estate reconciliation (kept here as history).
