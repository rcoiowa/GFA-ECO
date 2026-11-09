# GFARC review follow-up — November 9, 2026

Source: [PR49 review](https://github.com/rcoiowa/GFA-ECO/pull/49#pullrequestreview-5831012491), read November 9. Follow-up branch starts at merged main `28559c48bc3a07921488a8cb4a50d8c700eba645`. The earlier tested PR head was `03ebb39d503482aa317cb7b71662d188ee33a23a`; its tree equals that merge.

## Findings and corrections

1. **SQL escape report: not reproduced on the actual target.** Read-only synthetic constant queries on CQCX PostgreSQL 17.6 and local PGlite PostgreSQL 17.5 showed both escape spellings produce byte `0b`, preserve literal `v`, and trim vertical tabs. No participant rows were read. The proposal now uses explicitly documented octal `\013` in both the normalizer and CHECK constraint, with its exact hash repinned. This is explicit spelling and regression hardening, not evidence of production note corruption. [PostgreSQL lexical documentation](https://www.postgresql.org/docs/17/sql-syntax-lexical.html#SQL-SYNTAX-STRINGS-ESCAPE) lists octal escapes but omits the supported `\v` spelling. Seven synthetic round-trip cases cover leading/trailing `v`, a sole `v`, every intended trim character, whitespace-only input, an interior vertical tab, identical/normalized retries, and constraint rejection of unnormalized vertical-tab padding.
2. **Dirty in-app navigation: confirmed.** The previous local-link and beforeunload handlers did not intercept shell navigation or router history. The follow-up uses React Router's supported data-router blocker while retaining beforeunload for full-document exits. Existing routes, authorization boundaries and providers remain in place.
3. **Refresh-error draft loss: confirmed.** The previous `query.isError` branch unmounted the form even when cached workspace data existed. A failed background reconciliation now displays an inline retry warning and retains the original controlled and uncontrolled field values. A load with no workspace data still displays the full-page load error. Account changes, confirmed refreshed access loss and explicit authorization failures during refresh still clear private draft state. Existing uncertain-save error handling is unchanged.

## Boundaries

All durable-note SQL remains **prepared-only**, outside the migration chain. No production migration, release, test account, role change or participant-record action accompanies this follow-up. The approved sharing audience and existing recording authorization are unchanged.

Remaining activation gates are unchanged: an approved retention/correction policy; fresh live-schema/ledger reconciliation; isolated real-JWT/PostgREST and multi-session race acceptance; authenticated mobile, keyboard, zoom and accessibility browser acceptance; and exact release/served-frontend reconciliation. Synthetic DOM and database tests do not substitute for those checks. See [README](README.md) and [sharing decision](notes-sharing-decision.md).

## Verification of the follow-up

- `pnpm test`: 425 tests passed (113 domain, 21 recovery-content, 291 platform). The 36 Circle UI tests cover route leave/cancel/allow, programmatic navigation, memory-router Back/Forward, native beforeunload event handling, in-page anchors, uncertain-save departure, identical retry after a failed refresh, confirmed-save refresh failure, initial-load retry and explicit refresh-denial clearing.
- The existing 10 public App route tests now run under the catch-all data router. Seven additional nested shell tests cover relative child/parent routing across all workspace areas; backend and authorization dependencies are mocked, so these are routing tests rather than access certification.
- All four PGlite database suites passed, including independent rerun of the exact pinned proposal. Both literal changes and all new round-trip/constraint cases were independently reviewed; access grants and predicates are unchanged.
- Full workspace typecheck and build passed. Existing large-chunk warning remains.
- Canonical backend, table-access, language, ICARE, intake, booking, Grace static/safety/disclosure, views, domain, provenance, approved prepared-chain, Cloudflare boundary, weather-proxy and asset/artwork checks passed. Exact remote-commit CI is checked separately before reporting publication complete; local Deno and full authenticated browser acceptance remain unavailable.
