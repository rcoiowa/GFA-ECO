# Local verification — 2026-10-21

Base: `d9d0ff93efd0b3018eb0b97cacebced04d8d02ef`. Node 24.19.0,
pnpm **10.34.5** (repository pin), PostgreSQL 17 Docker image digest
`sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3`.
All data/auth interactions in unit tests were synthetic mocks; database tests used
an isolated temporary container. No live-gate workflow or participant query ran.

| Check                                               | Exact result                                                                                                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` with pinned pnpm   | Passed; lockfile unchanged                                                                                                                                                                        |
| `pnpm test`                                         | Recovery content: 21 tests / 2 files; domain: 113 tests / 13 files; platform initially 207 tests / 39 files, all passed                                                                           |
| Final platform suite after adding two journey cases | **209 tests / 39 files passed**, zero failed                                                                                                                                                      |
| Final `pnpm typecheck`                              | All workspace packages passed                                                                                                                                                                     |
| `pnpm build`                                        | Passed; existing >500 kB chunk-size warning remains                                                                                                                                               |
| `node --test workers/platform/*.test.mjs`           | 10 passed, zero failed                                                                                                                                                                            |
| Existing CI source/governance guards                | 19 passed (listed below)                                                                                                                                                                          |
| Post-build GFA assets and center artwork checks     | Both passed; public/dist day and night images decode at 1672 × 941                                                                                                                                |
| `node scripts/check-table-access.mjs`               | Passed; 81 historical SQL checksums intact, no new unreviewed canonical SQL                                                                                                                       |
| `node --test scripts/check-table-access.test.mjs`   | 1 passed: unreviewed SQL denied, full decisions accepted, missing service_role decision denied, modified history denied                                                                           |
| `python scripts/replay-launch-local.py`             | Passed: 76 canonical migrations + 3 applied prepared migrations; historical-table denial; new defaults/existing grant preservation; two synthetic identities restricted to own row; INSERT denied |
| Remote Docker refusal                               | With `DOCKER_HOST=tcp://remote.invalid:2375`, runner exited 1 before connection/container creation: `Refusing non-local Docker endpoint: only a Unix socket is supported`                         |
| `git diff --check`                                  | Passed                                                                                                                                                                                            |

The 19 source guards: check-no-retired-ref, icare-lock-verify,
check-icare-governance, verify-intake-boundary, verify-booking-integrity,
grace-model-lock-verify, grace-floor-selftest, check-grace-disclosure-sync,
verify-view-privileges, verify-domain-vocabulary, verify-service-provenance,
verify-intake-minimization, verify-0147-prepared, verify-0148-prepared,
verify-0149-prepared, verify-0150-prepared, verify-0151-prepared,
verify-prepared-chain, verify-cloudflare-boundaries (all `scripts/*.mjs`).

New coverage includes malicious/encoded/control-character/external/recursive `next`,
unsafe legacy router state, sensitive parameter removal, repeated auth hops, refresh,
registration callback replay, immediate-session housing registration, password reset
callback/retry/completion, interrupted onboarding, completed consent return and denied
admin role. Existing housing and public-route regressions passed with the full suite.
These checks prove local routing behavior, not actual emailed links or production RLS.

## Failures encountered and resolved

- Environment pnpm 11 initially attempted an unwritable default store and then ignored
  build scripts. Used pinned pnpm 10.34.5 with writable temporary caches; final frozen
  install succeeded. Restored pnpm 11's unsolicited workspace setting change.
- An old test treated `/admin` as invalid navigation. Updated it to reject `/unknown`;
  the new integration test independently proves the preserved admin path still reaches
  `/not-authorized` for an unauthorized account.
- Typecheck caught possibly undefined test-call entries and a regex capture; fixed
  narrow assertions and reran workspace typecheck successfully.
- Two asset checks were initially started before the build completed and failed for
  missing generated files. Both passed after the completed build.
- A formatting invocation included a nonexistent `.tsx` alias path; corrected to the
  actual `.ts` file. No implementation failure remains from these intermediate checks.

## Not run / limitations

- Fresh live release JSON: HTTP 403; supplied last verified SHA remains provisional.
  GitHub CLI GraphQL was forbidden; GitHub connector PR reads and Git read-only refs
  succeeded. No approval-review denial occurred and no mutation was attempted remotely.
- No production metadata re-audit, participant records, live signup/mail, consent writes,
  actual-browser authenticated acceptance, or PostgREST/JWT tests. Catalog audit SQL is
  provided for review, not claimed as executed live.
- No full Supabase stack replay. 0104 cron, 0146 content activation, seeds, pending
  0150/0151 and Housing/Admin/bridge proposals are excluded explicitly. Local auth/storage
  stubs do not establish infrastructure parity or identity provisioning correctness.
- Deno is unavailable: Edge compile/receiver tests were not run. Edge source is unchanged.
- No legacy live-gate dispatch; reported operator test #25 skipping absent controls is
  not used as acceptance evidence.
- No deployment, merge, PR creation, push, domain/Wix/Auth changes or live grants/data.

Release decisions and safe replay constraints are in [README.md](README.md).

## PR42 composition check

`git apply --check /workspace/GFA-ECO-repair.patch` passed against an untouched
worktree at `b76557485756668d0c21e3e9fed2c43cbc6ad24d`. An initial CI-context
conflict was resolved by placing the additive review step after dependency installation.
No PR42 source was applied or modified. This is patch applicability only, not combined
PR42 runtime validation or activation approval.
