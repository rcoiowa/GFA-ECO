# RecoveryOS

RecoveryOS is the Grace For Addictions digital recovery-support ecosystem: one coherent
platform composed of clearly separated user experiences running on shared infrastructure.

**Simple on the surface. Comprehensive underneath.**

## One platform, several intentional front doors

`apps/platform` is the single frontend behind `vrcc.app` (ADR-0010). Experience shells
are route-separated and lazy-loaded:

| Route                                         | Audience                                  |
| --------------------------------------------- | ----------------------------------------- |
| `/` + `/recovery-residences/grace-house`      | Public entrance and residence information |
| `/app`                                        | VRCC participants                         |
| `/residence`                                  | Recovery residence residents              |
| `/coach` · `/navigator` · `/staff` · `/admin` | Professional workspaces (Phase 7)         |

This repo is also the consolidation target for five legacy builds (vrcc.app,
Recovery Residence OS, Grace House, Virtual Recovery, GFA Connection) — see
`docs/source-inventory/` for the audit registries and `source-builds/README.md`
for intake clones.

## Shared packages

| Package                     | Purpose                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `@recoveryos/design-tokens` | Canonical color, type, spacing, and theme tokens (Tailwind v4 themes) |
| `@recoveryos/ui`            | Accessible shared component library and app shell                     |
| `@recoveryos/domain`        | Canonical domain types, enums, and validation schemas                 |
| `@recoveryos/data-access`   | Supabase client factory and typed repositories                        |
| `@recoveryos/auth`          | Auth provider, session context, role/relationship guards              |
| `@recoveryos/safety`        | Support Now escalation ladder and safety routing                      |

## Infrastructure

- **Supabase** — PostgreSQL, Auth, Storage, RLS (`supabase/migrations` is the target
  model; live-DB reconciliation per `docs/migration/README.md`)
- **Cloudflare Pages** — hosts the platform (staging → `vrcc.app` at cutover)
- **Cloudflare Workers** — API/orchestration layer only (`workers/api`), never a second frontend

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
