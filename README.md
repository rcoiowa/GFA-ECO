# RecoveryOS

RecoveryOS is the Grace For Addictions digital recovery-support ecosystem: one coherent
platform composed of clearly separated user experiences running on shared infrastructure.

**Simple on the surface. Comprehensive underneath.**

## Experiences

| App | Path | Audience |
| --- | --- | --- |
| VRCC Participant | `apps/vrcc` | People receiving recovery-support services through the Virtual Recovery Community Center |
| Resident | `apps/resident` | Recovery residence residents (recovery support + residence responsibilities) |
| Residence Staff | `apps/residence-staff` | Residence staff and operators (Phase 5) |
| Coach | `apps/coach` | Recovery coaches (Phase 6) |
| Navigator | `apps/navigator` | Resource navigators (Phase 6) |
| Admin | `apps/admin` | Administrators and executives (Phase 7) |

## Shared packages

| Package | Purpose |
| --- | --- |
| `@recoveryos/design-tokens` | Canonical color, type, spacing, and theme tokens (Tailwind v4 themes) |
| `@recoveryos/ui` | Accessible shared component library and app shell |
| `@recoveryos/domain` | Canonical domain types, enums, and validation schemas |
| `@recoveryos/data-access` | Supabase client factory and typed repositories |
| `@recoveryos/auth` | Auth provider, session context, role/relationship guards |
| `@recoveryos/safety` | Support Now escalation ladder and safety routing |

## Infrastructure

- **Supabase** — PostgreSQL, Auth, Storage, RLS (`supabase/migrations`)
- **Cloudflare Pages** — frontend hosting (one project per app)
- **Cloudflare Workers** — shared API gateway (`workers/api`)

## Getting started

```bash
pnpm install
cp .env.example apps/vrcc/.env.local   # fill in Supabase values
pnpm dev                               # runs the VRCC app
pnpm typecheck
pnpm build
```

## Documentation

- `docs/architecture/` — product architecture, application map, route registry
- `docs/decisions/` — architecture decision records
- `docs/data-dictionary/` — canonical data model
- `docs/deployment/` — deployment registry and environment reference
- `docs/build-manifest.md` — phase-by-phase implementation manifest

## Core domain rule

A **person** is not a login, a role, or an enrollment. The system separates:

```
AUTHENTICATION ACCOUNT → PERSON → ROLES / PROGRAM ENROLLMENTS / RESIDENCIES / RELATIONSHIPS / SERVICE EVENTS
```

A VRCC participant and a recovery residence resident are distinct relationships that one
person may hold simultaneously. They are never interchangeable, never duplicated, and
always separately attributable in analytics.
