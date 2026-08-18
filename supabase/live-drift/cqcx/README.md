# CQCX live-drift capture (`supabase/live-drift/cqcx/`)

Repository-tracked **provenance** of changes that exist on the canonical **RecoveryOS-Launch**
Supabase project (`cqcxvwoukyhxyokfwnjm` / "CQCX") but were applied **outside** the repo's migration
lineage. Captured 2026-08-14 (read-only reconciliation).

**These files are NOT part of any auto-applied migration set.** The canonical launch bootstrap is
`supabase/launch/migrations/`. Nothing here is applied by CI or any pipeline. Files ending
`.captured.sql` document what is _already live_; a file ending `.PREPARED.sql` is a proposal awaiting
an explicit human gate; a file ending `.APPLIED.sql` was executed against CQCX under an authorized
gate (execution record in `docs/migration/ejwrh-intake-drift-reconciliation.md`).

## Contents

| File                                                            | What it is                                                                                                                                  | Applied to CQCX?             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `20260811232326_create_housing_applications_ejwrh.captured.sql` | Exact statements as recorded in `supabase_migrations.schema_migrations` on CQCX (migration `create_housing_applications_ejwrh`, 2026-08-11) | **YES** (live)               |
| `20260811232342_harden_set_updated_at_search_path.captured.sql` | Exact stored statements (migration `harden_set_updated_at_search_path`, 2026-08-11)                                                         | **YES** (live)               |
| `0123_housing_applications_least_privilege.APPLIED.sql`         | Least-privilege grant hardening for `public.housing_applications`                                                                           | **YES — applied 2026-08-14** |

## Provenance basis

The `.captured.sql` bodies are the **exact `statements[]` values** stored by Supabase for those two
migration versions (retrieved via `supabase_migrations.schema_migrations`), not a reconstruction or a
guess. The live-state snapshot (schema, grants, RLS, policies, indexes, triggers, ownership) and the
full analysis live in `docs/migration/ejwrh-intake-drift-reconciliation.md`.

## Governance note

`public.housing_applications` is a bespoke public intake table in the **`public`** schema — it is
**not** the canonical `recoveryos` intake boundary. The canonical prepared boundary is
`recoveryos.residence_application_intake` (migration `supabase/launch/migrations/0122_public_intake_boundary.sql`,
also not yet applied). Convergence of EJWRH/Grace House intake onto the canonical boundary is the
target end state; the `0123` hardening here is an **interim** least-privilege step only.
