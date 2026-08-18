# Consolidation Record — Gate 1 (2026-08-18)

Establishes one canonical RecoveryOS Git lineage. Scope: Git only. No deploys, no migrations, no
DNS/domain changes, no Supabase/Cloudflare mutation, no branch/tag deletion, no history rewrite.
Evidence base: `docs/audits/canonical-reconciliation-2026-08-18.md`.

## Inputs

- Starting `main`: `950143af883671c25599b4f49af9a9617cea2482`
- Stack tip merged: `claude/public-support-onboarding-85u07i` =
  `c1db2aa2912de7797e55361963a7505702bcc4f7`
- Consolidation branch: `claude/consolidation-canonical-line-2026-08-18`
- Merge commit: `c1c0c52ce43e3b972d93d23e57e5b9ed7d786108` — **zero conflicts**; post-merge tree
  verified identical to the stack tip plus exactly the two doc files unique to `950143a`.

## Archive tag manifest (evidence freeze)

Annotated tags created and verified to resolve to the intended SHAs. **Note:** pushing
`refs/tags/*` to origin is rejected by this environment's credentials (HTTP 403; branch pushes
work). Tags exist in the session clone; a maintainer with tag-push rights should run
`git push origin --tags` (or recreate from this manifest — the SHAs below are authoritative).
Until then the same commits remain reachable via the still-existing branches, which this gate
forbids deleting.

| Branch | HEAD SHA | Archive tag |
|---|---|---|
| claude/grace-coaching-audit-b0fyhq | `990363ffc6b483f749b01482f2ef248b2c993d3c` | `archive/claude/grace-coaching-audit-b0fyhq` |
| claude/public-support-onboarding-85u07i | `c1db2aa2912de7797e55361963a7505702bcc4f7` | `archive/claude/public-support-onboarding-85u07i` |
| claude/recoveryos-greenfield-build-8pns7n | `36a8165316fd0061fec2f0c7845bc75243252396` | `archive/claude/recoveryos-greenfield-build-8pns7n` |
| claude/recoveryos-greenfield-build-ka6992 | `71fa3ac0981534513cb13cbc4fb539d19f996643` | `archive/claude/recoveryos-greenfield-build-ka6992` |
| claude/recoveryos-intake-audit-zouh7q | `fb4a52d25eeeb36405f5e5effae77c9ce0c117a3` | `archive/claude/recoveryos-intake-audit-zouh7q` |
| claude/residence-application-flow-jsesw6 | `34e7edb30662b3a9ef6c43709bd56e7d923e36a0` | `archive/claude/residence-application-flow-jsesw6` |
| claude/supabase-mcp-setup-ep29rp | `e901b22630842d69bcabb6021a49fe2df4eb109d` | `archive/claude/supabase-mcp-setup-ep29rp` |
| claude/what-is-built-here-3co21c | `2d47dc8982e4ca70334e18197841e5e6faa8a673` | `archive/claude/what-is-built-here-3co21c` |
| grace-compare/sonnet5-001 | `adcc3b355c292fbb8f34fb41573ce88e9d5d41d3` | `archive/grace-compare/sonnet5-001` |
| grace-eval/run-001 | `353c8a91aac4e40f9bd046d4ea37632320f1ff71` | `archive/grace-eval/run-001` |
| grace-eval/run-002 | `9f88868f0b944264fc427efee407b9ff1ec04aa5` | `archive/grace-eval/run-002` |
| grace-eval/run-003 | `8ceed6f08fe6a59710761279eddf8c7c14c5278e` | `archive/grace-eval/run-003` |
| grace-lock/apply-001 | `bfa2294192cd9f9f3e812712ac8eb762613abaca` | `archive/grace-lock/apply-001` |
| live-gate/run-001 | `de764e5572d5566a594159574c9057242d54f234` | `archive/live-gate/run-001` |
| live-gate/run-002 | `990363ffc6b483f749b01482f2ef248b2c993d3c` | `archive/live-gate/run-002` |
| main (pre-consolidation) | `950143af883671c25599b4f49af9a9617cea2482` | `archive/main-pre-consolidation-2026-08-18` |

## Canonicalization changes (the only non-merge edits in this gate)

1. `.mcp.json` — Supabase MCP target `ykykeioydvtxpyreshhs` → `cqcxvwoukyhxyokfwnjm`.
2. `docs/HANDOFF.md` — SUPERSEDED/HISTORICAL banner prepended; body preserved verbatim.
3. `docs/STATE-OF-THE-SYSTEM.md` — SUPERSEDED/HISTORICAL banner prepended; body preserved verbatim.
4. `docs/audits/canonical-reconciliation-2026-08-18.md` — reconciliation audit brought onto the
   canonical line (referenced by the banners), plus this record.

Deliberately NOT done in this gate (recorded as follow-ups): ADR renumbering (duplicate
0013/0014); full repository-memory document suite; `supabase/README.md` +
`supabase/functions/README.md` still declare YKY live (see defect register below).

## Validation on the merged tree (all PASS)

| Check | Command | Result |
|---|---|---|
| Dependency integrity | `pnpm install --frozen-lockfile` | PASS |
| Retired-ref guard | `node scripts/check-no-retired-ref.mjs` | PASS (canonical = cqcx…) |
| ICARE lock | `node scripts/icare-lock-verify.mjs` | PASS (0 drift) |
| ICARE regression guard | `node scripts/check-icare-governance.mjs` | PASS |
| Grace model lock | `node scripts/grace-model-lock-verify.mjs` | PASS static, 0 drift (live check skipped — no creds by design) |
| Typecheck | `pnpm typecheck` | PASS |
| Tests | `pnpm test` | PASS — 17 files, 93/93 |
| Production build | `pnpm build` | PASS |
| Bundle backend guard | grep dist for retired/canonical refs | PASS (retired absent, canonical present) |

## Post-merge identifier classification

**YKY (`ykykeioydvtxpyreshhs`) — 51 files:**

- **CURRENT (guards, by design):** `.github/workflows/ci.yml`, `deploy-staging.yml`,
  `deploy-production-candidate.yml` (retired-ref block values / "NEVER" comments),
  `scripts/check-no-retired-ref.mjs`, `scripts/verify-intake-boundary.mjs`,
  `scripts/sync-directory-site.mjs` (rewrites the marker to CQCX at build; refuses to emit YKY).
- **CURRENT (guarded source-template marker):** `sites/recoveryresidence-directory/index.html:890`
  — required by the sync pipeline, canonicalized before it can reach any build output.
- **HISTORICAL (evidence; do not follow, do not delete):** all `docs/**` occurrences (migration
  reports, audits, discovery, ADR-0011, recovered SQL captures), banner text in `HANDOFF.md` /
  `STATE-OF-THE-SYSTEM.md`, `supabase/migrations/` (the YKY-era applied history — never apply to
  CQCX), `supabase/functions/coaching/index.ts` (captured legacy YKY function),
  provenance comment in `supabase/launch/migrations/0000_create_schema.sql`,
  `supabase/launch/tests/README.md`.
- **DEFECT (stale canonical declarations — follow-up, not fixed in this gate):**
  `supabase/README.md` ("Live project: ykyk…") and `supabase/functions/README.md` (deploy
  commands targeting YKY). Same class as the banners; batch with the repository-memory task.
- **TEST/FIXTURE:** none.

**CQCX (`cqcxvwoukyhxyokfwnjm`) — CURRENT everywhere it appears** (env template, CI guards,
deploy workflows, CLAUDE.md, launch docs, sync script, e2e helpers). No occurrence conflicts with
governance.

**Base44 — 16 files, all HISTORICAL:** ADR-0014 (its retirement decision), ADR-0011/0016,
discovery/source-inventory registers, Grace source audits. No code references. Nothing to fix.

**Retired infrastructure / old hosts:**

- `contact-connect-dashboard` (`vlsxjkqyaexcxwkbovlq`): 2 doc mentions — HISTORICAL (its
  deprecation record; live project INACTIVE).
- `gracehouse4.pages.dev` links in `GraceHousePage.tsx`, `ResidenceApplyPage.tsx`,
  `residenceListings.ts` — **CURRENT (by governance):** the separate Grace House presentation
  frontend may remain; it must not remain a system of record. The directory's Grace House
  `applyUrl` pointing there is a known convergence-phase item (0122), not a Gate 1 defect.
- `recoveryos-staging.thomas-499.workers.dev` and Cloudflare inventory tables in
  STATE-OF-THE-SYSTEM — HISTORICAL (banner applied).

**Conflicting canonical declarations remaining after this gate:** only the two `supabase/*README`
defects above; every other "canonical" claim on the tree resolves to CQCX / RecoveryOS-Launch.

## Confirmation

No deployment, no migration applied (0122 remains unapplied), no `residence-intake` deploy, no
Supabase change, no Cloudflare change, no DNS/domain change, no Grace activation, no production
environment variables touched, no live data touched, no branch or tag deleted, no history
rewritten, no force-push. Live systems were only read during the underlying audit.
