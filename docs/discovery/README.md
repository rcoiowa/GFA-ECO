# Phase A Discovery — RecoveryOS Master Consolidation

Governing directive: **RecoveryOS Master Discovery, Consolidation & Execution
Commander** (owner-issued, 2026-08-04). This directory holds the Phase A
deliverables produced from what the current Claude Code environment can
actually reach. Verification language follows the directive exactly
(IDENTIFIED / INSPECTED / COMPILED / … / PRODUCTION VERIFIED); anything not
directly verified is marked **UNVERIFIED**.

## Environment scope (2026-08-04 session)

- Full read/write: `rcoiowa/GFA-ECO` (this repository) — the only repo this
  session can push to.
- Read-only (public clones): `Grace-For-Addictions/vrcc.app`,
  `Grace-For-Addictions/RecoveryResidenceOS`,
  `Grace-For-Addictions/contact-connect-dashboard`, `GFAVRCC/grace-harbor-16`.
- Cloudflare: read-only MCP (workers list/details) + unauthenticated HTTP
  probes of live domains. Pages projects are not enumerable via the MCP.
- Supabase: **MCP not authenticated in this session** — all database
  discovery below the repo's migration files is BLOCKED (see
  blockers-and-unverified.md).

## Deliverable status (directive §16)

| #     | Deliverable                                                 | Status                              | Location                                                                                                                                                      |
| ----- | ----------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Executive Assessment                                        | DONE (v1)                           | `executive-assessment.md`                                                                                                                                     |
| 2     | Current-State Architecture                                  | EXISTING — see note                 | `../architecture/product-architecture.md` (INSPECTED, pre-directive)                                                                                          |
| 3     | Evidence and Access Register                                | DONE (v1)                           | `evidence-and-access-register.md`                                                                                                                             |
| 4     | Knowledge Graph                                             | PARTIAL                             | capability lineage captured in `../source-inventory/*` + `../build-manifest.md`; graph doc pending DB access                                                  |
| 5     | Repository Inventory                                        | DONE (v1)                           | `repository-inventory.md`                                                                                                                                     |
| 6     | Deployment Registry                                         | DONE (v1, supersedes-in-time)       | `deployment-registry.md`                                                                                                                                      |
| 7     | Supabase Architecture Inventory                             | BLOCKED (auth)                      | migrations 0000–0019 in `../../supabase/migrations/` are the target model; live state unverifiable this session                                               |
| 8     | Migration Lineage Report                                    | PARTIAL                             | `../migration/README.md` (INSPECTED) + repo migrations; live reconciliation blocked                                                                           |
| 9     | Conversation and Decision Register                          | PARTIAL                             | `decision-and-reconciliation-register.md` (session-accessible history only)                                                                                   |
| 10–14 | Feature / Component / Route / Data / Design-System matrices | EXISTING (pre-directive, Phase 0–1) | `../source-inventory/feature-matrix.md`, `component-preservation.md`, `route-registry-sources.md`, `data-source-registry.md`; refresh pending DB access       |
| 15    | AI Systems Inventory                                        | PARTIAL                             | Grace AI references found only in vrcc.app donor build (grace-vrcc worker pages, undeployed); no canonical Grace AI service exists — see executive assessment |
| 16    | Intellectual Property Register                              | NOT STARTED                         | requires content sweep of donor builds                                                                                                                        |
| 17    | Duplicate Analysis                                          | PARTIAL                             | `../decisions/adr-0011-source-build-consolidation.md` + `decision-and-reconciliation-register.md`                                                             |
| 18    | Canonical Architecture Recommendation                       | EXISTING                            | ADR-0010/0011 (INSPECTED); reaffirmed in executive assessment                                                                                                 |
| 19    | Privacy and Compliance Gate Register                        | DONE (v1)                           | inside `decision-and-reconciliation-register.md` §Privacy gate                                                                                                |
| 20    | Security and RLS Register                                   | PARTIAL                             | migrations 0009/0011/0014/0018/0019 (INSPECTED); live verification blocked                                                                                    |
| 21    | Technical Debt Register                                     | PARTIAL                             | in `executive-assessment.md`                                                                                                                                  |
| 22    | High-Risk Areas                                             | DONE (v1)                           | in `executive-assessment.md`                                                                                                                                  |
| 23    | Immediate Quick Wins                                        | DONE (v1)                           | in `executive-assessment.md`                                                                                                                                  |
| 24    | Gap Analysis vs Target Architecture                         | PARTIAL                             | in `executive-assessment.md`                                                                                                                                  |
| 25    | Consolidation Roadmap                                       | EXISTING                            | `../build-manifest.md` phases; directive-phase mapping pending Gate A review                                                                                  |
| 26    | Implementation Backlog                                      | PARTIAL                             | in `executive-assessment.md`                                                                                                                                  |
| 27    | Blockers and Unverified Items                               | DONE (v1)                           | `blockers-and-unverified.md`                                                                                                                                  |
| 28    | Definition of Canonical Platform                            | EXISTING                            | `../../README.md` + ADR-0010                                                                                                                                  |
| 29    | Prioritized Action List                                     | DONE (v1)                           | in `executive-assessment.md`                                                                                                                                  |
| 30    | Owner Approval Checklist                                    | DONE (v1)                           | `owner-approval-checklist.md`                                                                                                                                 |

Nothing here overwrites the pre-existing registries under
`docs/source-inventory/` — those are the Phase 0–1 audit record; these
documents are the 2026-08-04 re-verification against the directive.
