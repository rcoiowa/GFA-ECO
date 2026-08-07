# P1-H — GitHub Source-of-Truth Map

**Date:** 2026-08-07. Every RecoveryOS-relevant deployed surface mapped to
reconstructable source. **GitHub is the authoritative source of deployable code;**
Cloudflare and Supabase are runtime, not source storage.

Legend: **VERIFIED SOURCE** (source read in a repo) · **VERIFIED LIVE** ·
**SOURCE CONTROL DRIFT** (deployed without reconstructable source) · **REQUIRES ACCESS**.

| Deployment (hostname / surface) | Repo | Branch | Commit | Deploy mechanism | Environment | Source status |
| --- | --- | --- | --- | --- | --- | --- |
| Worker `gfa-eco-recovery-residence-os` (canonical platform) | `rcoiowa/GFA-ECO` | `main` (deploy), work on `claude/grace-coaching-audit-b0fyhq` | tracked | `wrangler deploy` via `deploy-staging.yml` | production/staging | **VERIFIED SOURCE** |
| Worker `recoveryos-staging` | `rcoiowa/GFA-ECO` | build branch | **UNVERIFIED** (deployed commit not recorded) | wrangler | staging | VERIFIED SOURCE (repo), commit REQUIRES ACCESS |
| Edge Function `coaching` (Grace Coaching) | `rcoiowa/GFA-ECO` | `claude/grace-coaching-audit-b0fyhq` | `supabase/functions/coaching` | `supabase functions deploy` | production | **VERIFIED SOURCE** (captured P0.1; redeployed v2 P0) |
| Edge Function `create-meeting` | `rcoiowa/GFA-ECO` | this branch | `supabase/functions/create-meeting` | supabase deploy | production | **VERIFIED SOURCE** (captured + hardened P1) |
| Edge Function `notify-fanout` | `rcoiowa/GFA-ECO` | this branch | `supabase/functions/notify-fanout` | supabase deploy | production | **VERIFIED SOURCE** (captured + hardened P1) |
| Edge Functions `grace-companion`, `grace-companion-v6`, `Grace`, `slogan-engine`, `vrcc-api-gateway(-v6)`, `notify-new-lead` | — | — | — | supabase deploy | production | **SOURCE CONTROL DRIFT** — deployed, not in any repo in scope. `Grace` body captured to this session's notes (Anthropic-proxy peer companion); the rest REQUIRE ACCESS. Not coaching-scope. |
| Worker `virtualrecovery` (vrcc.app mvp, live) | `Grace-For-Addictions/vrcc.app` | deployed = `claude/live-app-source`; predecessor `main` | bundle `index-CoFlmJ02.js` (registry) | wrangler | production | **VERIFIED SOURCE** (branch exists), exact deployed commit REQUIRES ACCESS |
| CF Pages `gfa-vrcc` (`gfa-vrcc.pages.dev`) | `Grace-For-Addictions/vrcc.app` | `main` | — | Pages git build | production | VERIFIED SOURCE (repo), REQUIRES ACCESS to Pages |
| Worker `recovery-residence-os` (stale) | `Grace-For-Addictions/RecoveryResidenceOS` | pre-Jul-30 | — | wrangler | legacy | VERIFIED SOURCE (repo), stale |
| CF Pages `gfaconnection` (Contact-Connect) | `Grace-For-Addictions/contact-connect-dashboard` | `main` | single commit 2026-07-16 | Pages | prototype | VERIFIED SOURCE; targets project `yqonwnzqtgmnoiymkefk` |
| Supabase migrations (canonical project) | `rcoiowa/GFA-ECO` `supabase/migrations` + `docs/migration/recovered/` | this branch | 143-row manifest captured | `apply_migration` | production | **VERIFIED SOURCE** (manifest `docs/migration/live-migration-manifest.md`; prototype-layer migrations recovered) |
| `vrcc-app` Worker, 5 `vite-react-template*` | — | — | — | wrangler | experiments | REQUIRES ACCESS / likely SAFE TO RETIRE |

## Coaching scope: fully under source control

Everything in the Grace Coaching / RecoveryOS coaching path now reconstructs from
`rcoiowa/GFA-ECO`:
- the three coaching Edge Functions (`coaching`, `create-meeting`, `notify-fanout`),
- the full live migration manifest + the prototype-layer migrations
  (`docs/migration/recovered/`),
- the canonical schema (`supabase/migrations/`),
- the canonical frontend (`apps/platform` + `packages/*`).

## Remaining SOURCE CONTROL DRIFT (out of coaching scope, flagged)

- Non-coaching Edge Functions (`grace-companion*`, `vrcc-api-gateway*`, `slogan-engine`,
  `notify-new-lead`) are deployed with no repo home found. Capture them before any edit
  or retirement (same rule applied to the coaching functions in P0.1).
- `recoveryos-staging` and `virtualrecovery` deployed **commits** are not recorded — the
  deployment registry already flags that every future deploy must record exact
  commit + branch. Enforce via CI (write the deployed SHA into a deploy report, as
  `docs/discovery/deployment-registry.md` began doing).

## Rule (restated)

No surface is retired until its source is captured in GitHub. No production change is
made to a drifted surface before capturing it first. Cloudflare/Supabase hold runtime;
GitHub holds truth.
