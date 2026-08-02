# RecoveryOS Build Manifest

Running record of what exists, per phase. Update in the same commit as the work.

## Consolidation Phase 0–1 — Preserve, register, audit ✅ (2026-07-29)

- All five legacy source builds identified, cloned (`source-builds/`, gitignored), and
  audited; vrcc.app confirmed Git-backed (repo `Grace-For-Addictions/vrcc.app` →
  Worker `virtualrecovery`) — the "non-Git build recovery" task is closed.
- Registries: `docs/source-inventory/` (deployments, source routes, feature matrix,
  data sources, component preservation). Migration strategy: `docs/migration/`.
- Architectural pivot to one route-separated platform app recorded in ADR-0010/0011;
  `apps/vrcc` + `apps/resident` merged into `apps/platform` with lazy-loaded
  experience areas, `[data-experience]` theming, and an experience switcher.
- Legacy deployments labeled SOURCE; none modified.

## Phase 0 — Foundation decisions ✅

- Product architecture: `docs/architecture/product-architecture.md`
- Route registry: `docs/architecture/route-registry.md`
- ADRs 0001–0009: `docs/decisions/`
- Data dictionary: `docs/data-dictionary/README.md`
- Canonical terminology: participant / resident / residency / enrollment / service event /
  delivery context (see domain enums)

## Phase 1 — Platform foundation ✅ (code complete; DB push pending credentials)

- Monorepo: pnpm workspaces, strict TS, Prettier
- Design system: `packages/design-tokens` (core + 3 themes), `packages/ui`
  (Button, Card, fields, Alert, Empty/Loading/Error states, AppShell, PageHeader)
- Domain: `packages/domain` (enums, entities, zod schemas)
- Data access: `packages/data-access` (Supabase singleton + repositories)
- Auth: `packages/auth` (AuthProvider, RequireAuth/RequirePerson/RequireRole)
- Safety: `packages/safety` (Support Now ladder + dialog, grounding practice)
- Database: `supabase/migrations/0001–0009` (full schema + RLS), `supabase/seed/seed.sql`
- API gateway: `workers/api` (health/version skeleton)
- Validation: `pnpm typecheck` clean (9 projects), `pnpm build` clean (2 apps)

**Database deployed (2026-07-29):** migrations 0000–0011 applied to the live
project as the `recoveryos` schema; reference data seeded; PostgREST exposure
configured; security advisors run (one warning fixed, deny-all/GraphQL-visibility
notes documented). Live E2E validated in a real browser: register → person
provisioning → check-in → consent → goal → resident-area denial, with all rows
verified server-side and test data removed. Client (`packages/data-access`) now
targets the `recoveryos` schema.

## Phase 2 — VRCC participant experience ✅ (initial)

- `apps/platform` `/app` area: landing, register, sign-in, onboarding provisioning
- Seven destinations: Today, My Recovery (working goals), Connect, Learn, Tools,
  Resources, My Journey (working check-in history)
- Working engines wired: daily check-in, goals, granular consent management
- Support Now on every screen; grounding practice; 404/not-authorized pages

## Phase 3 — Shared recovery service engines ◐ (in progress)

**Done (2026-07-29):** Recovery capital engine — canonical BARC-10 instrument
(`packages/domain/src/instruments/barc10.ts`, merged from the vrcc MVP module with the
soil-type framing preserved), assessment flow at `/app/tools/recovery-capital`,
`service_events` attribution now emitted by both check-ins and assessments
(migration 0012 self-insert policy; `recordSelfServiceEvent`). Live-validated:
assessment saved (score 44 → Thorny Soil), two vrcc-context service events recorded,
`analytics_people_served` deduplicates correctly.

**Remaining:** sessions/appointments engine, content engine (Brain Atlas, Recovering
the Mind, Training the Mind, Tapes We Carry, 59 slogans — canonical content intake
needed), goals→service-event linkage, Walls of Honor.

## Phase 4 — Resident experience ◐ (core workflows live, 2026-08-02)

- Resident Today: live responsibilities — today's chores (mark done), curfew
  tonight, next required meeting, pending-signature documents
- Documents: read + typed-name acknowledgement (migrations 0013/0014; the 0014
  security-definer helpers fix an RLS recursion found by live testing)
- Passes: request + status history · Grievance: protected filing flow
- Schedule: upcoming residence meetings · My Residence: rights/passes/grievance hub
- Demo world seeded: `participant.demo@vrcc.app` (Dana, VRCC-only) and
  `resident.demo@vrcc.app` (Rae, VRCC + active Grace House residency with chores,
  curfew, meetings, and an assigned rights document)
- Live E2E: Rae completed a chore, signed the rights document, and requested a
  pass; Dana saw no switcher and was denied `/residence`
- Staging deployed (temporary preview account):
  https://recoveryos-staging.pastoral-ticket.workers.dev

**Remaining:** wire `/residence/recovery`, `/residence/connect`, `/residence/journey`
to the shared engines with residence-context service events; meeting attendance.

## Phases 5–8 ⬜

Staff workspace, coach/navigator workspaces, admin + analytics, hardening/deployment.
