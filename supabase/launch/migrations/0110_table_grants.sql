-- 0110_table_grants.sql — restore PostgREST table privileges (launch-blocking fix).
--
-- Found during the P4D messaging contract audit: the curated launch 0010 kept
-- schema USAGE but dropped the dev bootstrap's table-level grants, so the
-- `authenticated` role had NO privileges on ANY recoveryos table — every direct
-- PostgREST read/write in the platform would fail with 42501 the first time a
-- real HTTP request hit the launch project. (SECURITY DEFINER RPCs masked this
-- in DB verification, and the HTTP gate — deliberately still un-passed — is the
-- gate that would have caught it at soft launch.)
--
-- This restores the archive/dev project's proven posture, under which the 0009/
-- 0026 RLS policies are THE ONLY row gate: table privileges let a policy be
-- evaluated; the policy decides. Tables whose policies were deliberately
-- removed (e.g. messages INSERT/UPDATE in 0109) remain blocked by RLS even
-- with these grants in place.

grant select, insert, update on all tables in schema recoveryos to authenticated;

-- Public referral intake is the one anonymous write surface (matches dev).
grant insert on recoveryos.referrals to anon;

-- Future tables created by the migration role inherit the same posture.
alter default privileges in schema recoveryos
  grant select, insert, update on tables to authenticated;
