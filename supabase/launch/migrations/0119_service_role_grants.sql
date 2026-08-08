-- 0119_service_role_grants.sql — P4H-G1: standard Supabase service_role
-- posture for the canonical schema.
--
-- The curated launch schema granted table privileges to `authenticated`
-- (0110) but never to `service_role`, so server-side operator tooling (the
-- CI fixture seeder, future maintenance scripts) could not use PostgREST
-- with the service key. service_role is Supabase's server-only role: it
-- carries BYPASSRLS by platform design and its key never ships to a
-- browser (verified in the P4H secrets audit). Granting it the ordinary
-- table privileges restores the standard Supabase contract without
-- touching client-facing authorization — RLS for authenticated/anon is
-- unchanged and still preflight-guarded.
grant usage on schema recoveryos to service_role;
grant select, insert, update, delete on all tables in schema recoveryos to service_role;
grant usage, select on all sequences in schema recoveryos to service_role;
alter default privileges in schema recoveryos
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema recoveryos
  grant usage, select on sequences to service_role;
