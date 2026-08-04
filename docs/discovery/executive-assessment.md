# Executive Assessment — 2026-08-04

## Where the ecosystem actually stands

**The canonical platform exists and is substantial.** `rcoiowa/GFA-ECO`
(branch line ending at `recoveryos-greenfield-build-8pns7n` +
`residence-application-flow-jsesw6`) is a coherent React 19 + TypeScript
monorepo with a documented data model (migrations 0000–0019), RLS-first
security, ADRs 0001–0012, phase-by-phase build manifest, and experience
separation that already approximates the directive's model (public /
participant / resident / staff). It compiles clean. It is deployed to a
staging worker. It is **not** production.

**Production is the weakest artifact.** vrcc.app today serves the MVP build
from the vrcc.app repo — a deliberately small coaching/intake app — after an
unpushed, richer build was overwritten on ~Aug 2 (R-07). Three sibling
builds are live at once (vrcc.app, gfa-vrcc.pages.dev, `vrcc-app` worker),
five template workers are floating in the account, and the
RecoveryResidenceOS worker serves a stale build while its repo's newer
directory/application work sits undeployed. This is exactly the "connected
confusion" the directive targets.

**The deepest conflict is structural, not technical: R-01.** The canonical
repo and Supabase project contain a full housing-operations suite —
built across phases 4–8 and extended by the current branch — while the
directive rules that housing operations belong to a separate entity and
system, with RecoveryOS owning only a consent-mediated bridge. Nearly every
open question (merge the residence branch? apply 0018–0019? consolidate
RecoveryResidenceOS?) hangs on this one owner decision.

## High-risk areas

1. **Unowned production surface** — no registry says which of the three live
   vrcc.app-family builds is authoritative; any deploy anywhere can silently
   change "production" (already happened once, R-07).
2. **Second migration pipeline** — RecoveryResidenceOS CI can write schema
   to the canonical Supabase project outside this repo's migration line (R-06).
3. **Privacy gate vs. live registration** — production collects real
   participant data today while gate documentation is absent (R-02).
4. **Unverified live database** — all statements about applied migrations
   rest on prior reports; nothing was re-verified this session (B-01).
5. **Housing data in the recovery project** — if R-01 resolves to
   separation, screenings/incidents/fees for residents already live in the
   canonical DB and will need a governed carve-out, not a DROP (§4.2).

## Immediate quick wins (safe, additive, low-risk)

1. Record this registry set (done — this directory).
2. Owner deletes/labels the five `vite-react-template*` workers and states
   the purpose of `vrcc-app` (dashboard action, non-destructive rename/label).
3. Adopt a deploy-report template; stamp `recoveryos-staging` with its
   commit on next deploy.
4. Freeze RecoveryResidenceOS `db-migrations.yml` (one-line workflow disable
   in that repo — needs B-02 session) pending R-06.
5. Establish `main` + CI on GFA-ECO from the canonical line (Phase 2, after
   Gate A merge decision).

## Gap analysis vs. target architecture (§4.5, §10, §19)

| Target                                         | Status                                                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| React 19 / TS / Vite / Tailwind / React Router | ✅ VERIFIED in platform                                                                                                      |
| One person model, relationships not roles      | ✅ modeled (people / role_assignments / residencies / enrollments); workspace switcher exists                                |
| Supabase Auth + RLS as authorization           | ✅ designed & implemented in migrations; live state unverified                                                               |
| PWA-first                                      | ❌ no manifest/service worker in platform                                                                                    |
| TanStack Query / RHF / Zod                     | partial (Zod yes; others no)                                                                                                 |
| shadcn/ui-adapted design system                | custom `@recoveryos/ui` instead — evaluate at Phase 3, don't churn                                                           |
| Vitest / Playwright / a11y automation          | ❌ absent in canonical repo                                                                                                  |
| Turnstile / WAF                                | ❌ not configured (unverifiable)                                                                                             |
| Grace AI canonical service                     | ❌ does not exist; only content pages on a reference branch                                                                  |
| Immersive layer (Three.js/R3F)                 | present only in legacy vrcc.app build; not in platform                                                                       |
| Support Now everywhere                         | ✅ in platform (`packages/safety`); crisis-resource single source needs consolidation with grace-harbor canonical module     |
| One authoritative owner per capability         | ❌ residence directory exists in 3 places (platform branch, RROS repo, lost prod build); applications in 2; coach tools in 2 |

## Prioritized action list

1. **Owner: decide R-01** (HousingOps boundary) — everything sequences after it.
2. **Owner: confirm privacy-gate status in writing** (R-02).
3. Authorize Supabase connector → run the database inventory (B-01), producing deliverables 7/8/13/20.
4. Gate A plan: merge order for `8pns7n` + `jsesw6` into a protected `main`, CI, deploy-report discipline.
5. Session on RecoveryResidenceOS repo: freeze migration CI; disposition its directory/application features per R-01.
6. Session on vrcc.app repo: document that it is production; no feature work; prepare Phase 14 cutover checklist.
7. Content harvest: grace-vrcc pages (Grace AI architecture, slogans, Enneagram), grace-harbor crisis module, contact-connect coaching flows → IP Register (deliverable 16).

## Technical debt register (canonical repo)

- No CI, no tests, no lint config beyond Prettier.
- No PWA layer.
- `ResidentArea` bundle is 465 KB (needs code-splitting).
- Static Iowa directory data duplicated (platform TS module + RROS TS module
  - standalone `sites/recoveryresidence-directory/index.html`).
- Worker API (`workers/api`) deployed nowhere; secrets undocumented in dashboard.
- Migrations 0018–0019 exist in-repo but unapplied — drift risk if others
  apply migrations meanwhile.
