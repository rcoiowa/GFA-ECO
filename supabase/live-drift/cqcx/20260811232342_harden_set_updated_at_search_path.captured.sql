-- CAPTURED LIVE-STATE PROVENANCE — already applied to CQCX (cqcxvwoukyhxyokfwnjm).
-- Migration version: 20260811232342  name: harden_set_updated_at_search_path
-- Source: exact statements[] recorded in supabase_migrations.schema_migrations on CQCX.
--         Captured read-only 2026-08-14. Documents live state; not re-applied by the repo.
--
-- Effect: pins search_path='' on public.set_updated_at() (resolves the
-- function_search_path_mutable advisory introduced by the create migration).
-- Scope is public.set_updated_at ONLY — recoveryos.set_updated_at is a separate,
-- unaffected function. Live-verified 2026-08-14: proconfig = {search_path=""}, owner = postgres.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;
