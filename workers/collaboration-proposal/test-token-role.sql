-- Isolated synthetic database only, after token-role-schema.sql.
begin;
select public.assert_true(
 recoveryos_bridge_private.restrict_access_token('{"claims":{"sub":"synthetic","role":"authenticated","aud":"authenticated"}}') =
 '{"claims":{"sub":"synthetic","role":"authenticated","aud":"authenticated"}}'::jsonb,
 'first party token unchanged');
select public.assert_true(
 recoveryos_bridge_private.restrict_access_token('{"claims":{"client_id":"00000000-0000-0000-0000-000000000099","role":"authenticated"}}') =
 '{"claims":{"client_id":"00000000-0000-0000-0000-000000000099","role":"authenticated"}}'::jsonb,
 'unrelated OAuth client unchanged');
update recoveryos_bridge_private.client_approvals set enabled=false;
select public.expect_failure($q$select recoveryos_bridge_private.restrict_access_token('{"claims":{"client_id":"00000000-0000-0000-0000-000000000009","role":"authenticated"}}')$q$,'bridge client disabled');
rollback;
