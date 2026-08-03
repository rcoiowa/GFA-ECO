# State of the System — verified 2026-08-02

Plain-language master status. Detailed registries: `docs/source-inventory/`,
migration plan: `docs/migration/`, phase log: `docs/build-manifest.md`.

## ~~The one blocking action~~ — RESOLVED 2026-08-02

The `CLOUDFLARE_API_TOKEN` secret landed and the pipeline is fully live:
every push to the build branch now auto-deploys to the `recoveryos-staging`
Worker on the GFA Cloudflare account.
**Permanent staging URL: https://recoveryos-staging.thomas-499.workers.dev**

## Cloudflare account (8 Workers + 2 Pages, verified live)

| Deployment | Verdict |
| --- | --- |
| Worker `virtualrecovery` → vrcc.app | LIVE PROD (legacy) — untouched until cutover |
| Worker `recovery-residence-os` | SOURCE — freeze until Phase 5 harvest done |
| Pages `gracehouse4`, `gfaconnection` | SOURCE — freeze until content harvested |
| Worker `vrcc-app` (created 2026-08-02) | DUPLICATE of vrcc.app build — safe to delete |
| Workers `vite-react-template`…`template5` (Aug 1–2) | Stock starter pages — safe to delete |
| Worker `recoveryos-staging` (own account, auto-deployed by GitHub Actions) | **CANONICAL STAGING** — takes over vrcc.app at cutover |
| Pages `gfa-vrcc` (gfa-vrcc.pages.dev, found 2026-08-02) | FOURTH copy of the rolled-back vrcc.app build (identical bundle); its dual route trees (/app + /vrcc/app) explain the mis-routed buttons. SOURCE for review; safe to delete after cutover |

The Aug 1–2 additions came from Cloudflare "deploy a template" clicks and a
repo-connect experiment (which also redeployed `virtualrecovery` and pushed
`Grace-For-Addictions/vrcc.app` at 17:40Z). No damage; production unaffected.

## GitHub

| Repo | Verdict |
| --- | --- |
| `rcoiowa/GFA-ECO` | CANONICAL (branch `claude/recoveryos-greenfield-build-ka6992`) — needs the secret; merge to `main` when ready |
| `Grace-For-Addictions/vrcc.app` | PROD SOURCE — freeze; no new work here |
| `RecoveryResidenceOS`, `contact-connect-dashboard`, `grace-harbor-16` | SOURCE — freeze until harvest completes, then archive |
| `vite-react-template`, `-2`, `-3` (two orgs) | Empty template repos — safe to delete |
| `Late-Night-Recovery-`, `icrco`, `ICRCO-` | Unreviewed — leave for later |

## Supabase

| Project | Verdict |
| --- | --- |
| `ykykeioydvtxpyreshhs` "Grace For Addictions" | CANONICAL — `recoveryos` schema live (migrations 0000–0014), legacy schemas untouched. Needs custom SMTP before real registrations (2 emails/hour default; confirmation required). |
| `giloyvmjpyqrnbqbkxim`, `vlsxjkqyaexcxwkbovlq` | INACTIVE — decide restore-and-inspect vs. ignore before Phase 8 |

## Decision queue (authorized human review)

Support Now phone numbers · resident rights/house expectations final language ·
Grace House public-page content · SMTP provider choice · inactive-project decision.

## Standing rule

New work happens only in `rcoiowa/GFA-ECO`. Legacy builds are read-only sources
until Phase 9 cutover, then labeled ARCHIVED. Avoid Cloudflare "deploy template"
buttons — they mint new repos and workers each time.
