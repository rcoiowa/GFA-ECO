# Deploy Report — gfa-eco-recovery-residence-os — 2026-08-06

- **Worker / project:** `gfa-eco-recovery-residence-os` (staging)
- **Domain(s):** gfa-eco-recovery-residence-os.thomas-499.workers.dev
  (custom domains recoveryresidence.org / recoveryresidence.app pending
  dashboard binding; vrcc.app cutover pending validation sign-off)
- **Branch:** `main` (first deploy from the new default line)
- **Exact commit:** `c2a5d29f4` — merge of
  `claude/residence-application-flow-jsesw6` (through ADR-0014 +
  domain-scoped front doors + CI) and
  `claude/recoveryos-greenfield-build-8pns7n` (through slogan chain,
  Recovery Pulse, live-DB drift reconciliation)
- **Changed since last deploy (36a8165):** residence application flow,
  operator onboarding wizard, applicant status page, `HOST_HOMES`
  hostname-based front doors, ADR-0013/0014 + Phase A discovery docs, CI
  workflow, deploy-report template
- **Migration versions applied:** none by this deploy; live DB already at
  0000–0024 per `docs/migration/live-drift-reconciliation.md`
- **Environment/secret changes:** none (uses existing `CLOUDFLARE_API_TOKEN`)
- **Tests run:** CI typecheck+build (in-session verified; hosted runs
  #2/#3 died in GitHub's runner queue — infra, not code); deploy run #26
  (workflow_dispatch) completed **success** at 17:26:40Z after push-run
  #25 was killed unstarted in the same queue incident
- **Verification level reached:** ROUTE-RESOLVED / content-verified —
  bundle `index-BejBbAmL.js` served and confirmed to contain the
  directory ("Recovery housing options"), Grace House application
  ("Apply to Grace House"), operator wizard, and `HOST_HOMES` mappings
  (recoveryresidence.org, gracehouse.graceforaddictions.org); `/` → 200;
  `/residence/directory/` serves the static RecoveryResidence.org
  national directory page. Headless-browser click-through blocked by the
  session's egress proxy — AUTHENTICATED SMOKE-TEST still pending (next
  gate, human or browser-capable session)
- **Staging result:** LIVE on workers.dev
- **Rollback:** redeploy commit `36a8165` (previous successful deploy,
  run #24), or Cloudflare dashboard → worker → rollback to prior version
- **Production verification:** n/a — vrcc.app untouched, still serving
  the vrcc.app-repo MVP build
