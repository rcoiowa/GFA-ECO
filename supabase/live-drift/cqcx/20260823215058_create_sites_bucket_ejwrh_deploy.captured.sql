-- CAPTURED LIVE-DRIFT MIGRATION (verbatim from supabase_migrations.schema_migrations.statements)
-- Version: 20260823215058 · Name: create_sites_bucket_ejwrh_deploy
-- Applied to CQCX 2026-08-23 outside the repo lineage (EJWRH portal deploy session).
--
-- PATTERN RETIRED (Gate A): the temporary ANON-WRITABLE storage window this migration
-- opened (~2 minutes, closed by 20260823215255) is a defacement-grade deploy pattern for a
-- page functioning as a legal/consent instrument — for the window's duration, any holder of
-- the public URL could overwrite the page. The intended FINAL state is: window closed
-- (verified live), bucket private (Gate A containment 0138), page served self-contained from
-- the version-controlled Edge Function. Future static-site deploys use the service role or a
-- version-controlled function — NEVER an anon write window. This capture preserves history;
-- it is not a pattern to reproduce.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sites', 'sites', true, 5242880, array['text/html','image/png','image/jpeg','image/svg+xml','text/css','application/javascript'])
on conflict (id) do update set public = true;

-- temporary, tightly-scoped upload window: anon may write only under sites/ejwrh/
create policy "ejwrh_deploy_window_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'sites' and name like 'ejwrh/%');
create policy "ejwrh_deploy_window_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'sites' and name like 'ejwrh/%')
  with check (bucket_id = 'sites' and name like 'ejwrh/%');
