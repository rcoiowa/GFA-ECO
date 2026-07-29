# RecoveryOS Supabase

Live project: `ykykeioydvtxpyreshhs` ("Grace For Addictions", us-west-2, PG17).

**Status: DEPLOYED.** Migrations 0000–0011 are applied to the live project as the
**`recoveryos` schema** (2026-07-29), alongside the untouched legacy schemas
(`public`, `gfa_ui`, `gfa_core`, `gfa_community`, `gfa_residence`). The app client
targets `recoveryos` via `db: { schema: 'recoveryos' }`. Reference data
(org, programs, Grace House, service/consent taxonomies) is seeded.

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
