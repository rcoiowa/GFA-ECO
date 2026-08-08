-- launch_contract_check.sql — permanent PostgREST privilege/RLS regression guard (P4E §39).
--
-- Exists because of the 0110 discovery: the launch project had correct RLS
-- policies but NO table privileges for `authenticated` — a class of defect that
-- SECURITY DEFINER RPC tests structurally cannot catch, because definer
-- functions run with the owner's privileges. This preflight verifies the
-- direct-PostgREST contract itself. Run it against RecoveryOS-Launch after any
-- migration batch and before any soft-launch gate. It is a REGRESSION GUARD,
-- not a replacement for the real authenticated-HTTP gate.
--
-- PASS: final select returns one row. FAIL: the DO block raises with the
-- specific broken contract, and nothing after it runs.

do $contract$
declare
  missing text;
  n int;
begin
  -- 1) Schema USAGE for the PostgREST roles.
  if not has_schema_privilege('authenticated', 'recoveryos', 'USAGE') then
    raise exception 'LAUNCH-CONTRACT FAIL: authenticated lacks USAGE on schema recoveryos';
  end if;
  if not has_schema_privilege('anon', 'recoveryos', 'USAGE') then
    raise exception 'LAUNCH-CONTRACT FAIL: anon lacks USAGE on schema recoveryos';
  end if;

  -- 2) authenticated holds SELECT/INSERT/UPDATE on every canonical table
  --    (RLS policies — not privileges — are the row gate).
  select string_agg(tablename, ', ' order by tablename) into missing
  from pg_tables
  where schemaname = 'recoveryos'
    and not (has_table_privilege('authenticated', format('recoveryos.%I', tablename), 'SELECT')
         and has_table_privilege('authenticated', format('recoveryos.%I', tablename), 'INSERT')
         and has_table_privilege('authenticated', format('recoveryos.%I', tablename), 'UPDATE'));
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: authenticated missing table privileges on: %', missing;
  end if;

  -- 3) anon privileges limited to the explicitly public surface (referral intake).
  select string_agg(tablename, ', ' order by tablename) into missing
  from pg_tables
  where schemaname = 'recoveryos' and tablename <> 'referrals'
    and (has_table_privilege('anon', format('recoveryos.%I', tablename), 'SELECT')
      or has_table_privilege('anon', format('recoveryos.%I', tablename), 'INSERT')
      or has_table_privilege('anon', format('recoveryos.%I', tablename), 'UPDATE')
      or has_table_privilege('anon', format('recoveryos.%I', tablename), 'DELETE'));
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: anon has unexpected privileges on: %', missing;
  end if;

  -- 4) RLS enabled on every canonical table.
  select string_agg(c.relname, ', ' order by c.relname) into missing
  from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'recoveryos' and c.relkind = 'r' and not c.relrowsecurity;
  if missing is not null then
    raise exception 'LAUNCH-CONTRACT FAIL: RLS disabled on: %', missing;
  end if;

  -- 5) RLS actually blocks: an unknown authenticated identity (simulated JWT
  --    claims + role, the same path PostgREST takes) reads zero people rows —
  --    proving privileges did not silently widen into data exposure, and that
  --    definer-function results were not standing in for normal grants.
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-00000000dead","role":"authenticated"}', true);
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000dead', true);
  execute 'set local role authenticated';
  select count(*) into n from recoveryos.people;
  execute 'reset role';
  if n <> 0 then
    raise exception 'LAUNCH-CONTRACT FAIL: unknown authenticated identity can read % people rows', n;
  end if;
end $contract$;

select 'LAUNCH CONTRACT PASS — schema usage, table privileges, anon scope, RLS posture verified' as result;
