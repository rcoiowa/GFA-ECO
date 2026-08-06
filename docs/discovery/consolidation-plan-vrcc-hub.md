# Consolidation Plan — vrcc.app hub, domain-scoped front doors

Owner intent (2026-08-04): everything serves up through **vrcc.app**, and
each experience also serves standalone on its own domain for people who
don't come in through the hub. Domains in hand: `vrcc.app`,
`recoveryresidence.org`, `recoveryresidence.app`; Grace House gets a
landing without needing a fourth domain. Decision record: ADR-0014.

## How "separate but one" works

One repo (GFA-ECO), one Supabase project, **one platform deployment** with
multiple custom domains attached. The SPA picks its front door by hostname
(`HOST_HOMES` in `apps/platform/src/App.tsx` — implemented): the domain
changes what `/` shows, while every route remains reachable everywhere. No
second codebase, no duplicate auth, no cross-app link rot — yet a visitor
landing on recoveryresidence.org never needs to know vrcc.app exists.

| Domain                                        | `/` opens                                                            | Today                                        | After cutover                                      |
| --------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| vrcc.app                                      | Community-center hub (landing → VRCC, Residence, Grace House)        | vrcc.app-repo MVP (Worker `virtualrecovery`) | platform Worker                                    |
| recoveryresidence.org                         | `/recovery-residences` — public housing directory + profiles + apply | unbound                                      | platform Worker                                    |
| recoveryresidence.app                         | `/recovery-residences/list-your-residence` — operator entrance       | unbound                                      | platform Worker                                    |
| gracehouse.graceforaddictions.org (or vanity) | `/recovery-residences/grace-house`                                   | unbound                                      | platform Worker (mapping already in `HOST_HOMES`)  |
| graceforaddictions.org                        | grace-harbor-16 marketing site                                       | unbound (repo has no deploy)                 | its own Worker, links fixed to vrcc.app            |
| gracehouse4.pages.dev                         | Grace House document set                                             | live                                         | stays until the portal document library is primary |

Sister builds keep serving their own visitors during transition (vrcc.app
MVP stays production until the platform passes staging validation), which
satisfies "each respective build serves up separately" both now and after.

## Critical path to “Grace House working end-to-end”

1. **Merge the branch line** → `residence-application-flow-jsesw6` already
   contains `8pns7n`; promote it (or its merge) to a protected `main`; add
   CI (typecheck + build). _(doable in-session once approved — no conflicts,
   this branch is a fast-forward of 8pns7n)_
2. **Apply migrations 0018–0019** (cleared by ADR-0014) — needs Supabase
   access (authorize connector) or an interactive session.
3. **Deploy the platform** to `recoveryos-staging` with a commit-stamped
   deploy report — needs `CLOUDFLARE_API_TOKEN` or dashboard Git build.
4. **Validate on workers.dev**: register → apply to Grace House → staff
   approve → bed board placement → applicant sees status + VRCC onboarding
   prompt (AUTHENTICATED SMOKE-TEST level).
5. **Bind domains** (dashboard): recoveryresidence.org/.app to the platform
   Worker immediately (they're unbound — zero risk); vrcc.app re-points
   from `virtualrecovery` only after step 4 sign-off (rollback = re-point).
6. **Fold in and freeze RecoveryResidenceOS** (its directory/apply already
   re-implemented here); disable its `db-migrations.yml` (needs a session
   on that repo).
7. **Grace-harbor-16** gets a wrangler config + Workers Builds + its links
   pointed at vrcc.app (needs a session on that repo) — parallel track,
   not blocking Grace House.

## Residence-experience backlog (from the prototype, per ADR-0014)

Triage "Attention needed" dashboard with acknowledge loop → resident daily
check-ins with staff flagging → admit-from-waitlist one-click → furlough
lifecycle with return confirmation → prototype visual identity/tone pass.
These land inside `/staff` + `/residence` after the critical path ships.
