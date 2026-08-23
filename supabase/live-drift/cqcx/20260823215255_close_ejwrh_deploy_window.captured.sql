-- CAPTURED LIVE-DRIFT MIGRATION (verbatim from supabase_migrations.schema_migrations.statements)
-- Version: 20260823215255 · Name: close_ejwrh_deploy_window
-- Applied to CQCX 2026-08-23 outside the repo lineage (EJWRH portal deploy session).
-- Verified live 2026-08-23 (Gate A): all four window policies absent from storage.objects.
-- The suggestion below to "re-open a scoped window" for future deploys is RETIRED by the
-- Gate A containment — see 20260823215058 capture header.

-- Deployment complete: remove the temporary anon write window on sites/ejwrh/*.
-- Public read of the bucket continues via the public-bucket endpoint; future deploys
-- re-open a scoped window or use the service role.
drop policy if exists "ejwrh_deploy_window_insert" on storage.objects;
drop policy if exists "ejwrh_deploy_window_update" on storage.objects;
drop policy if exists "ejwrh_deploy_window_delete" on storage.objects;
drop policy if exists "ejwrh_deploy_window_select" on storage.objects;
