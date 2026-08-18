-- Launch baseline: expose the canonical schema to PostgREST alongside the defaults.
-- (The dev-era version also exposed gfa_ui/gfa_community/gfa_residence — legacy
-- generations that do not exist in the launch project.)
alter role authenticator set pgrst.db_schemas to 'public,graphql_public,recoveryos';
notify pgrst, 'reload config';
grant usage on schema recoveryos to anon, authenticated;
