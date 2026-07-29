# RecoveryOS Build Manifest

Running record of what exists, per phase. Update in the same commit as the work.

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

**Pending external step:** apply migrations + seed to Supabase project
`ykykeioydvtxpyreshhs` (requires authorized Supabase access) and set app env vars.

## Phase 2 — VRCC participant experience ✅ (initial)

- `apps/vrcc`: landing, register, sign-in, onboarding provisioning
- Seven destinations: Today, My Recovery (working goals), Connect, Learn, Tools,
  Resources, My Journey (working check-in history)
- Working engines wired: daily check-in, goals, granular consent management
- Support Now on every screen; grounding practice; 404/not-authorized pages

## Phase 3 — Shared recovery service engines ⬜ (next)

Recovery capital assessment engine, sessions/appointments, content engine (Brain Atlas,
Recovering the Mind, Training the Mind, Tapes We Carry, 59 slogans — canonical content
intake needed), service-event emission from all engines.

## Phase 4 — Resident experience ⬜ (shell built)

`apps/resident` shell with 7-area nav, residence identity/status live; responsibilities,
chores, curfew, passes, documents pending.

## Phases 5–8 ⬜

Staff workspace, coach/navigator workspaces, admin + analytics, hardening/deployment.
