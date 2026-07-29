# RecoveryOS Supabase

Target project: `ykykeioydvtxpyreshhs` (configured in `.mcp.json`).

## Applying migrations

Migrations are ordered SQL files in `migrations/`. Apply in filename order via
the Supabase MCP `apply_migration` tool or the Supabase CLI:

```bash
supabase link --project-ref ykykeioydvtxpyreshhs
supabase db push
```

`seed/seed.sql` is development-only reference data (Grace For Addictions org,
VRCC/ANCHOR programs, Grace House residence, service and consent taxonomies).

## Non-negotiable schema rules

1. One `people` row per human. Auth accounts, roles, enrollments, and
   residencies all hang off `person_id` — never duplicate a person to add a
   relationship.
2. `service_events` is the only attribution spine. Every delivered service
   records `delivery_context` plus program/residence attribution.
3. RLS is the authorization boundary. Frontend guards are navigation sugar.
4. Consent history is append-only.
5. bigint identity primary keys; external platform IDs go in dedicated columns.
