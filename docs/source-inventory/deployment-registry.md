# Deployment Registry

Verified 2026-07-29 by direct inspection of the Cloudflare account (Workers list),
GitHub repository listing, live deployments, and cloned source trees in `source-builds/`.

| Build | Repository | Branch | Cloudflare Project | Type | Domain(s) | Data Source | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| VRCC (current prod) | `Grace-For-Addictions/vrcc.app` | `main` | Worker `virtualrecovery` (static assets, SPA) | Base44-exported React (Vite, JSX) | `vrcc.app` + `virtualrecovery.thomas-499.workers.dev` | Base44 SDK + Supabase `ykykeioydvtxpyreshhs` (mvp module) | **SOURCE** (live prod) |
| Recovery Residence OS | `Grace-For-Addictions/RecoveryResidenceOS` | `main` | Worker `recovery-residence-os` (static assets, SPA) | React 19 + TS + Vite + RR7 | `recovery-residence-os.thomas-499.workers.dev` | Supabase `ykykeioydvtxpyreshhs` (`gfa_residence` + `gfa_ui` schemas) | **SOURCE** (live) |
| Grace House | `GFAVRCC/grace-harbor-16` (UNVERIFIED as the exact deploy source) | `main` | Pages `gracehouse4` (UNVERIFIED — Pages projects not enumerable via available tools) | Lovable React + TS + shadcn | `gracehouse4.pages.dev` | Supabase `kmvlkvfxrjqrfxsljvxl` | **SOURCE** |
| GFA Connection | `Grace-For-Addictions/contact-connect-dashboard` | `main` | Pages `gfaconnection` (named in its deploy script) | Base44-style React (Vite, JSX) | `gfaconnection.pages.dev` | Supabase `yqonwnzqtgmnoiymkefk` | **SOURCE** |
| Canonical RecoveryOS | `rcoiowa/GFA-ECO` | `claude/recoveryos-greenfield-build-ka6992` | none yet (staging pending) | pnpm monorepo, React 19 + TS | target: `vrcc.app` | Supabase `ykykeioydvtxpyreshhs` (target) | **CANONICAL** |

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

## Legacy status plan

| Deployment | Now | After cutover |
| --- | --- | --- |
| Worker `virtualrecovery` (vrcc.app) | SOURCE — do not modify | ARCHIVED (workers.dev URL retained read-only until retired) |
| Worker `recovery-residence-os` | SOURCE — do not modify | ARCHIVED |
| Pages `gracehouse4` | SOURCE | ARCHIVED |
| Pages `gfaconnection` | SOURCE | ARCHIVED (experiential concepts mined) |
