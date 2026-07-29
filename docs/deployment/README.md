# Deployment Registry

## Targets

| App | Cloudflare Pages project | Domain | Build command | Output |
| --- | --- | --- | --- | --- |
| VRCC | `recoveryos-vrcc` | `vrcc.app` | `pnpm --filter @recoveryos/vrcc build` | `apps/vrcc/dist` |
| Resident | `recoveryos-resident` | `residence.vrcc.app` | `pnpm --filter @recoveryos/resident build` | `apps/resident/dist` |
| API | Worker `recoveryos-api` | `api.vrcc.app` | `wrangler deploy` (from `workers/api`) | — |

SPA routing: each Pages project needs a `/* → /index.html 200` rule (Pages does this
automatically for single-page apps when no `_redirects` conflicts).

## Environment variables (per Pages project)

| Variable | Notes |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://ykykeioydvtxpyreshhs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable anon key (safe for frontend; RLS protects data) |
| `VITE_RECOVERYOS_EXPERIENCE` | `vrcc` / `resident` |

Worker secrets via `wrangler secret put` (none required in Phase 1).

## Database

Apply `supabase/migrations/*.sql` in order, then `supabase/seed/seed.sql` (dev only).
Requires authorized Supabase access (MCP connector or CLI link).

## Launch checklist (Phase 8, not yet run)

- [ ] RLS review against permission matrix
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Support Now contacts verified by GFA leadership (ADR-0007)
- [ ] Auth email templates + redirect URLs configured in Supabase
- [ ] Session/cookie domain strategy across subdomains verified
- [ ] Bundle code-splitting review (supabase-js chunk)
- [ ] Backup/recovery documentation
