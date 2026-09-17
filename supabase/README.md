# RecoveryOS Supabase (retired dev-project history)

> **RETIRED / HISTORICAL (corrected 2026-08-21).** Everything below this banner describes the
> **retired** dev project `ykykeioydvtxpyreshhs` and is preserved as migration provenance only.
> The canonical live backend is **RecoveryOS-Launch `cqcxvwoukyhxyokfwnjm`** ("CQCX"); its
> bootstrap line lives in `supabase/launch/migrations/` (see `supabase/launch/README.md`), with
> out-of-band live changes reconciled in `supabase/live-drift/cqcx/`. Never apply the
> `supabase/migrations/` files below to CQCX and never deploy anything to the retired project.

Historical record of the retired dev project (`ykykeioydvtxpyreshhs`, us-west-2, PG17):

**Status at retirement: DEPLOYED (historical).** Migrations 0000–0013 were applied to that project as the
**`recoveryos` schema** (0000–0012 on 2026-07-29; 0013 on 2026-07-30), alongside
the untouched legacy schemas (`public`, `gfa_ui`, `gfa_core`, `gfa_community`,
`gfa_residence`). The app client targets `recoveryos` via
`db: { schema: 'recoveryos' }`. Reference data is seeded: org, programs, both
residences (Grace House + EJWRH), service/consent taxonomies, and all 19
canonical document templates/versions (8 signature documents carry their full
bodies in `document_versions.body_markdown`; the 11 non-signature documents
carry version-pinning pointer bodies — the app renders those from the bundled
package. To sync full bodies later, apply `seed/documents_seed.sql` via the
CLI as UPDATEs). Security advisors re-run 2026-07-30: no new findings beyond
the documented pre-existing GraphQL-visibility/deny-all notes.

## Applying migrations

Ordered SQL files in `migrations/`, applied via the Supabase MCP `apply_migration`
tool (migration names `recoveryos_<filename>`) or the CLI. Each file sets
`search_path = recoveryos, public`. After DDL that adds tables/functions, PostgREST
needs `notify pgrst, 'reload schema';` before the REST API sees them.

`seed/seed.sql` holds the reference data inserts (idempotent re-runs are safe).

## Non-negotiable schema rules

1. One `people` row per human. Auth accounts, roles, enrollments, and
   residencies all hang off `person_id` — never duplicate a person to add a
   relationship.
2. `service_events` is the only attribution spine. Every delivered service
   records `delivery_context` plus program/residence attribution.
3. RLS is the authorization boundary. Frontend guards are navigation sugar.
4. Consent history is append-only.
5. bigint identity primary keys; external platform IDs go in dedicated columns.
