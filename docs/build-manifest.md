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

## Phase 4 — Resident experience ✅ (2026-07-30; DB push of 0013+seed pending)

- **Canonical document library** (`packages/residence-content`): 24 versioned
  documents — Resident Agreement, Rights & Responsibilities, House Guidelines,
  Fee Schedule & Refund Policy, Screening Policy & Consent (the 5-document
  move-in signature set), plus 11 policies (grievance, return-to-use,
  medication/MAT, naloxone/overdose, emergency, guests, good neighbor,
  confidentiality/42 CFR Part 2, property, transition/move-out, code of
  ethics) and 8 forms (intake, emergency contact, ROI, medication disclosure,
  move-in inventory, pass request, grievance, incident report). All
  person-first / trauma-aware / neuro-informed / grace-based per
  `docs/language-guide.md`.
- **Generation**: `pnpm generate:residence-docs` → `supabase/seed/documents_seed.sql`
  (templates + versions) and printable `docs/residence-documents/` (ADR-0012).
- **Signing flow**: migration 0013 (`requires_signature`, read policies,
  self-acknowledge policy, `ensure_my_document_assignments()` RPC);
  Documents page lists pending signatures, full library, signed history;
  DocumentDetail renders markdown + typed-name e-signature.
- **Residence operations wired**: Today (chores due today, tonight's curfew),
  My Residence (weekly chores, curfew table, rights links), Schedule
  (meetings, curfew, pass request + history), grievance filing (digital +
  paper parity).
- **Compliance**: `docs/compliance/narr-3.0-level-2-mapping.md` (4 domains /
  10 principles / 31 standards → evidence) and
  `docs/compliance/iowa-hhs-recovery-residence-checklist.md` (470-0025).
  Clause-level verification against the affiliate workbook + org rules
  upload still pending (noted in both docs).
- **Pending**: apply migration 0013 + documents_seed.sql to the live project
  (Supabase MCP needs re-auth); staff-side assignment/countersign tooling
  (Phase 5); per-residence config for fill-in facts (fees, times).

## Phases 5–8 ⬜

Staff workspace, coach/navigator workspaces, admin + analytics, hardening/deployment.
