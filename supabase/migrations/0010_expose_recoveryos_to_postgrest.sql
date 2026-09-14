-- Expose the recoveryos schema via PostgREST (same pattern the legacy system
-- uses for gfa_residence). RLS remains the row-level boundary; these are
-- table-level grants only. The db_schemas list preserves the existing entries.
set search_path = recoveryos, public;

alter role authenticator set pgrst.db_schemas to 'public,gfa_ui,gfa_community,gfa_residence,recoveryos';
notify pgrst, 'reload config';

grant usage on schema recoveryos to anon, authenticated;

grant select, insert, update on all tables in schema recoveryos to authenticated;
grant usage, select on all sequences in schema recoveryos to authenticated;

alter default privileges in schema recoveryos
  grant select, insert, update on tables to authenticated;
alter default privileges in schema recoveryos
  grant usage, select on sequences to authenticated;
