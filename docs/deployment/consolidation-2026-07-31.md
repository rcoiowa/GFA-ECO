# Deployment Consolidation — 2026-07-31

Answers GFA's question: "the recoveryresidence.org directory needs to serve
inside vrcc.app/residence, and I think we have two separate builds going —
consolidate without losing anything."

## The two builds, resolved

There were **two deployments of one legacy build**, plus this canonical repo:

| Deployment                                | State                                                              |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Pages `gfa-vrcc` → `gfa-vrcc.pages.dev`   | STALE — last deploy ~2026-07-08; superseded, safe to archive       |
| Worker `virtualrecovery` → `vrcc.app`     | LIVE legacy prod (same repo: `Grace-For-Addictions/vrcc.app`)      |
| Worker `gfa-eco-recovery-residence-os`    | "Hello world" stub (created 2026-07-30) — now the canonical target |
| This repo (`rcoiowa/GFA-ECO`, RecoveryOS) | CANONICAL platform, replaces the legacy build at Phase 9 cutover   |

Nothing needs rescuing from `gfa-vrcc.pages.dev`: it deployed from the same
Git repository that feeds the live Worker, so its content is fully preserved
in Git. Details: `docs/source-inventory/deployment-registry.md`.

## Where the directory now lives in the canonical platform

`sites/recoveryresidence-directory/index.html` (single source of truth) is
copied at build time by `scripts/sync-directory-site.mjs` into
`apps/platform/public/residence/directory/` and therefore serves at:

    <platform origin>/residence/directory/

- `/residence` (no trailing path) remains the **authenticated resident
  portal**; `/residence/directory/` is the **public** directory — the Worker
  serves the exact-match static asset, and everything else under `/residence`
  falls through to the SPA.
- The directory page is self-contained (77 KB, no external assets) and its
  referral form posts straight to the canonical `recoveryos` schema
  (PostgREST, anon insert-only) — submissions appear in Staff → Applications.
- Linked from the public landing page and the Grace House page.

After Phase 9 cutover this is exactly `vrcc.app/residence/directory/`.

## Getting it live on vrcc.app TODAY (legacy Worker, ~2 minutes)

This session cannot push to `Grace-For-Addictions/vrcc.app` (cross-tenant
restriction), so a human — or a Claude session started with that repo as its
source — applies this:

1. In the `Grace-For-Addictions/vrcc.app` repo, create
   `public/residence/index.html` (to keep an existing in-app `/residence`
   route visible, use `public/residence/directory/index.html` instead).
2. Copy the full contents of this repo's
   `sites/recoveryresidence-directory/index.html` into that file, verbatim.
   It is origin-independent — the referral API URL and publishable key are
   embedded.
3. Commit to `main` and push. The `virtualrecovery` Worker redeploys
   automatically (its last deploys track pushes within ~1 minute).
4. Verify `https://vrcc.app/residence` serves the directory (static asset
   beats the SPA fallback for exact paths).

When the directory content changes, re-copy the file — or retire this mount
at cutover, when the canonical platform takes the domain.

## Deploying the canonical platform to the stub Worker

`apps/platform/wrangler.jsonc` is now named `gfa-eco-recovery-residence-os`,
matching the Worker created in the dashboard on 2026-07-30. Two ways to ship:

**A. Dashboard Git build (recommended — no local token):** In Cloudflare →
Workers & Pages → `gfa-eco-recovery-residence-os` → Settings → Build, connect
`rcoiowa/GFA-ECO`, branch `claude/recoveryos-greenfield-build-8pns7n`, and set:

- Build command: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @recoveryos/platform build`
- Deploy command: `npx wrangler deploy --config apps/platform/wrangler.jsonc`
- Root directory: `/` (repo root — the monorepo needs the workspace)
- Build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (values in `docs/deployment/README.md`)

**B. CLI:** with `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit) exported:

    pnpm --filter @recoveryos/platform build
    npx wrangler deploy --config apps/platform/wrangler.jsonc

Either way the "Hello world" stub is replaced by the real platform at
`gfa-eco-recovery-residence-os.<account>.workers.dev`, including
`/residence/directory/`.

## Nothing-lost checklist

- [x] `gfa-vrcc.pages.dev` content preserved in Git (`Grace-For-Addictions/vrcc.app`)
- [x] Live `vrcc.app` untouched (SOURCE discipline; mount instructions are additive)
- [x] Directory site single-sourced in this repo; the platform copy is generated
- [x] Stub Worker adopted rather than duplicated (wrangler name aligned)
- [ ] GFA: archive/delete Pages project `gfa-vrcc` after confirming no bookmarks
- [ ] GFA: apply the legacy mount (or start a Claude session on `vrcc.app` to do it)
- [ ] GFA: connect the dashboard Git build (option A) for continuous staging deploys
