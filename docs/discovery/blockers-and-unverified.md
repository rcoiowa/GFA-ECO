# Blockers and Unverified Items — 2026-08-04

## Genuine blockers

| #    | Blocker                                                              | Blocks                                                                                                                                              | Resolution                                                                                                    |
| ---- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| B-01 | **Supabase MCP unauthenticated** in this session                     | Deliverables 7, 8, 13, 20 (live schema/RLS/row-count inventory); migration-lineage reconciliation; verification that 0000–0017 are actually applied | Authorize the Supabase connector in claude.ai connector settings, or run Phase A-DB in an interactive session |
| B-02 | **Cross-owner repo writes impossible** (session scoped to `rcoiowa`) | Any change to vrcc.app, RecoveryResidenceOS (incl. freezing its migration CI, wiring the residence page)                                            | Start sessions with those repos as initial sources                                                            |
| B-03 | **No Cloudflare API token** (MCP read-only)                          | Deploys, Pages settings inspection, worker cleanup, custom-domain verification                                                                      | Provide `CLOUDFLARE_API_TOKEN` to a build session, or owner acts in dashboard                                 |
| B-04 | **R-01 HousingOps boundary decision** (owner)                        | Merge/deploy of residence-application-flow branch; further housing-ops work; migrations 0018–0019                                                   | Owner decision at Gate A                                                                                      |
| B-05 | **Privacy gate written confirmation** (owner)                        | Any deploy enabling participant-facing writes                                                                                                       | Owner supplies gate documentation or formally acknowledges closed status                                      |

## Unverified items (must not be treated as facts)

- `claude/RecoveryOS-Master-Spec.md` — not found anywhere accessible.
- Live existence/contents of Supabase projects `cmodbvkydzqlzxqxwoeu` and
  `gffosjyiunshhmtpjsqa` — zero references in accessible code.
- Which service (Pages vs `virtualrecovery` worker) answers vrcc.app DNS.
- The commit deployed to `recoveryos-staging`.
- Purpose of workers `vrcc-app` and `vite-react-template`…`5`.
- Whether migrations 0000–0017 are truly applied live (reported by prior
  implementation reports; not re-verified this session).
- Contents of `GFAVRCC/icrco`, `GFAVRCC/ICRCO-`, `rcoiowa/Late-Night-Recovery-`.
- Any Claude conversation history beyond this session.
- Production usage volumes / row counts anywhere.
- Base44 runtime status for the legacy vrcc.app tree and
  contact-connect-dashboard.
