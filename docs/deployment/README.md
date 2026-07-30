# Deployment Registry — Canonical Platform

Legacy source deployments: `docs/source-inventory/deployment-registry.md`.

## Targets

| Component                | Cloudflare project                                                                    | Domain                                     | Build command                                                     | Output               |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------- | -------------------- |
| Platform (staging)       | Worker `recoveryos-staging` (static assets; config in `apps/platform/wrangler.jsonc`) | `recoveryos-staging.<account>.workers.dev` | `pnpm --filter @recoveryos/platform build` then `wrangler deploy` | `apps/platform/dist` |
| Platform (prod, Phase 9) | takes over `vrcc.app` custom domain                                                   | `vrcc.app`                                 | same                                                              | same                 |
| API gateway              | Worker `recoveryos-api`                                                               | `api.vrcc.app`                             | `wrangler deploy` (from `workers/api`)                            | —                    |

Staging deploy needs a `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit) available to
wrangler — the account's MCP connector is read-only and cannot deploy. Env vars are
baked at build time (`VITE_*`), so build with them set.

SPA routing: single-page-application fallback (`/* → /index.html`).

## Environment variables (Pages project)

| Variable                 | Notes                                      |
| ------------------------ | ------------------------------------------ |
| `VITE_SUPABASE_URL`      | `https://ykykeioydvtxpyreshhs.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable anon key (RLS protects data)   |

Worker secrets via `wrangler secret put` (none required yet).

## Cutover (Phase 9 — no-destructive-cutover rule)

1. Staging validated (UAT + checks below).
2. Re-point `vrcc.app` custom domain from Worker `virtualrecovery` to the platform
   deployment. Rollback = re-point back (DNS-level, minutes).
3. Legacy workers.dev / pages.dev URLs remain read-only archives until formally retired.

## Database

Canonical target schema: `supabase/migrations/*.sql`. Do NOT apply blindly to the live
project — it already hosts 4 application schemas. Follow `docs/migration/README.md`.

## Launch checklist (Phase 8/9, not yet run)

- [ ] Live-DB verification of the four legacy schemas (needs Supabase authorization)
- [ ] Canonical schema deployed per migration strategy; RLS review vs permission matrix
- [ ] ETL dedup validation (unique-people counts vs legacy)
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Support Now contacts verified by GFA leadership (ADR-0007)
- [ ] Auth email templates + redirect URLs configured in Supabase
- [ ] Staging UAT sign-off; rollback rehearsed
- [ ] Legacy deployments labeled ARCHIVED
