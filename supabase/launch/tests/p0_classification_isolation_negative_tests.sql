-- p0_classification_isolation_negative_tests.sql — SEC-P0-001 / Gate G2 battery.
--
-- ISOLATED REPLAY OR DISPOSABLE STAGING ONLY. Never the launch project.
-- The battery refuses to run unless the operator explicitly sets
--   set recoveryos.negtest = 'on';
-- Everything runs in one transaction and ends with ROLLBACK, so no rows persist.
--
-- Prerequisites: launch migrations 0001–0146 + prepared 0147 applied; the
-- auth shim (auth.users + auth.uid() reading request.jwt.claim.sub) present;
-- run as a superuser/service connection (the battery impersonates
-- `authenticated` per actor via SET LOCAL ROLE).
--
-- What it proves (each assertion raises on failure):
--   1. Test_fixture actors are instantiated holding EVERY privileged role key
--      (coach, navigator, residence_staff, residence_manager, program_manager,
--      administrator, executive, system_administrator) and satisfy NO
--      privileged predicate for any of them, and hold NO residence staff scope.
--   2. Production staff predicates are unchanged (admin/navigator/residence
--      staff access preserved).
--   3. Fixture actors read ZERO rows from residence_application_intake and
--      residence_listing_submissions under RLS; production staff read them.
--   4. Notification fan-out for lead / listing / application events reaches
--      production staff only (asserted per fixture role holder).
--   5. grant_role_assignment refuses a privileged grant to a fixture identity
--      for EVERY one of the eight privileged role keys
--      (test_fixture_privilege_blocked) and still grants to production staff.
--   6. Participant-plane behavior for fixtures is preserved (participant role,
--      0120 same_world semantics).
--   7. Response-code uniformity (revision 2): an ordinary authenticated caller
--      — production participant or fixture participant — receives an
--      identical 'not_authorized' response from grant_role_assignment whether
--      the target is a production person, a fixture person, or nonexistent;
--      target-dependent codes (person_not_found,
--      test_fixture_privilege_blocked) are reachable only by authorized
--      callers.

\set ON_ERROR_STOP on

do $$ begin
  if coalesce(current_setting('recoveryos.negtest', true), '') <> 'on' then
    raise exception 'REFUSING TO RUN: set recoveryos.negtest = ''on'' only on an isolated replay or disposable staging database.';
  end if;
  if to_regprocedure('recoveryos.is_privileged_role(recoveryos.role_key)') is null then
    raise exception 'Prepared migration 0147 is not applied to this database; apply it before running the battery.';
  end if;
end $$;

begin;

create function pg_temp.ok(label text, cond boolean) returns void language plpgsql as $$
begin
  if cond is distinct from true then
    raise exception 'NEGTEST FAIL: %', label;
  end if;
  raise notice 'ok: %', label;
end $$;
-- Explicit grant: after 0148's default-privilege hardening, new functions no
-- longer get PUBLIC execute, and the battery calls ok() as `authenticated`.
grant execute on function pg_temp.ok(text, boolean) to public;

-- ---------------------------------------------------------------------------
-- Arrange: residence, actors, classifications, role assignments
-- ---------------------------------------------------------------------------
insert into recoveryos.residences (organization_id, name, address_city, address_state, is_active)
select (select id from recoveryos.organizations order by id limit 1),
       'NEGTEST-P0 Residence', 'Des Moines', 'IA', true;
select set_config('negtest.res',
  (select id from recoveryos.residences where name = 'NEGTEST-P0 Residence')::text, true);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000f1', 'negtest-p0-fixture-admin@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000f2', 'negtest-p0-fixture-navigator@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000f3', 'negtest-p0-fixture-coach@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000f4', 'negtest-p0-fixture-pm@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000f5', 'negtest-p0-fixture-exec@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000f6', 'negtest-p0-fixture-sysadmin@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000c1', 'negtest-p0-prod-admin@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000c2', 'negtest-p0-prod-navigator@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000c3', 'negtest-p0-prod-rstaff@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000c4', 'negtest-p0-prod-sysadmin@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000c5', 'negtest-p0-prod-participant@negtest.p0');
-- (handle_new_auth_user auto-provisions people + participant role)

select set_config('negtest.fxadmin', (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000f1'), true);
select set_config('negtest.fxnav',   (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000f2'), true);
select set_config('negtest.fxcoach', (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000f3'), true);
select set_config('negtest.fxpm',    (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000f4'), true);
select set_config('negtest.fxexec',  (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000f5'), true);
select set_config('negtest.fxsys',   (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000f6'), true);
select set_config('negtest.padmin',  (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000c1'), true);
select set_config('negtest.pnav',    (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000c2'), true);
select set_config('negtest.prstaff', (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000c3'), true);
select set_config('negtest.psys',    (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000c4'), true);
select set_config('negtest.ppart',   (select id::text from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-0000000000c5'), true);

insert into recoveryos.person_classification (person_id, classification, reason) values
  (current_setting('negtest.fxadmin')::bigint, 'test_fixture', 'NEGTEST-P0'),
  (current_setting('negtest.fxnav')::bigint,   'test_fixture', 'NEGTEST-P0'),
  (current_setting('negtest.fxcoach')::bigint, 'test_fixture', 'NEGTEST-P0'),
  (current_setting('negtest.fxpm')::bigint,    'test_fixture', 'NEGTEST-P0'),
  (current_setting('negtest.fxexec')::bigint,  'test_fixture', 'NEGTEST-P0'),
  (current_setting('negtest.fxsys')::bigint,   'test_fixture', 'NEGTEST-P0')
on conflict (person_id) do update set classification = 'test_fixture', reason = 'NEGTEST-P0';

-- Simulate the live defect shape: fixture identities holding privileged roles
-- (direct inserts on purpose — the RPC now refuses; the live rows predate 0147).
-- Every one of the eight privileged role keys is instantiated on a fixture:
--   fxadmin: administrator + residence_manager + residence_staff
--   fxnav: navigator · fxcoach: coach · fxpm: program_manager
--   fxexec: executive · fxsys: system_administrator
insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id) values
  (current_setting('negtest.fxadmin')::bigint, 'administrator',        1, null),
  (current_setting('negtest.fxadmin')::bigint, 'residence_manager',    1, current_setting('negtest.res')::bigint),
  (current_setting('negtest.fxadmin')::bigint, 'residence_staff',      1, current_setting('negtest.res')::bigint),
  (current_setting('negtest.fxnav')::bigint,   'navigator',            1, null),
  (current_setting('negtest.fxcoach')::bigint, 'coach',                1, null),
  (current_setting('negtest.fxpm')::bigint,    'program_manager',      1, null),
  (current_setting('negtest.fxexec')::bigint,  'executive',            1, null),
  (current_setting('negtest.fxsys')::bigint,   'system_administrator', 1, null),
  (current_setting('negtest.padmin')::bigint,  'administrator',        1, null),
  (current_setting('negtest.pnav')::bigint,    'navigator',            1, null),
  (current_setting('negtest.prstaff')::bigint, 'residence_staff',      1, current_setting('negtest.res')::bigint),
  (current_setting('negtest.psys')::bigint,    'system_administrator', 1, null);

-- Sensitive rows + fan-out events (fires the three notify triggers).
insert into recoveryos.leads (first_name, last_name, email, message)
values ('NEGTEST-P0', 'Lead', 'negtest-p0-lead@negtest.p0', 'battery');
insert into recoveryos.residence_listing_submissions (residence_name, contact_email, source, test_fixture)
values ('NEGTEST-P0 Listing', 'negtest-p0-listing@negtest.p0', 'NEGTEST-P0', true);
insert into recoveryos.residence_application_intake
  (residence_id, applicant_name, applicant_email, answers, consent_to_contact, source, test_fixture)
values (current_setting('negtest.res')::bigint, 'NEGTEST-P0 Applicant',
        'negtest-p0-applicant@negtest.p0', jsonb_build_object('why','NEGTEST-P0'), true, 'NEGTEST-P0', true);

-- ---------------------------------------------------------------------------
-- 4) Fan-out reaches production staff only
-- ---------------------------------------------------------------------------
select pg_temp.ok('production admin received lead/listing/application notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.padmin')::bigint) >= 3);
select pg_temp.ok('fixture admin received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.fxadmin')::bigint) = 0);
select pg_temp.ok('fixture navigator received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.fxnav')::bigint) = 0);
select pg_temp.ok('fixture coach received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.fxcoach')::bigint) = 0);
select pg_temp.ok('fixture program manager received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.fxpm')::bigint) = 0);
select pg_temp.ok('fixture executive received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.fxexec')::bigint) = 0);
select pg_temp.ok('fixture system administrator received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.fxsys')::bigint) = 0);
select pg_temp.ok('production system administrator received listing/application notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('negtest.psys')::bigint) >= 2);

-- ---------------------------------------------------------------------------
-- 1) Fixture admin: every privileged predicate false, no staff scope
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f1', true);
set local role authenticated;
select pg_temp.ok('fx-admin: has_role(administrator) = false', recoveryos.has_role('administrator') = false);
select pg_temp.ok('fx-admin: is_platform_admin = false',        recoveryos.is_platform_admin() = false);
select pg_temp.ok('fx-admin: is_admin_staff = false',           recoveryos.is_admin_staff() = false);
select pg_temp.ok('fx-admin: is_care_operations_staff = false', recoveryos.is_care_operations_staff() = false);
select pg_temp.ok('fx-admin: is_support_staff = false',         recoveryos.is_support_staff() = false);
select pg_temp.ok('fx-admin: is_coach_staff = false',           recoveryos.is_coach_staff() = false);
select pg_temp.ok('fx-admin: is_navigator_staff = false',       recoveryos.is_navigator_staff() = false);
select pg_temp.ok('fx-admin: staff_residence_ids empty',
  not exists (select 1 from recoveryos.staff_residence_ids()));
select pg_temp.ok('fx-admin: is_residence_manager_of = false',
  recoveryos.is_residence_manager_of(current_setting('negtest.res')::bigint) = false);
-- 6) participant plane preserved
select pg_temp.ok('fx-admin: has_role(participant) still true', recoveryos.has_role('participant') = true);
select pg_temp.ok('fx-admin: same_world(fixture peer) = true',
  recoveryos.same_world(current_setting('negtest.fxnav')::bigint) = true);
select pg_temp.ok('fx-admin: same_world(production person) = false',
  recoveryos.same_world(current_setting('negtest.padmin')::bigint) = false);
-- 3) RLS: zero sensitive rows
select pg_temp.ok('fx-admin: residence_application_intake reads 0 rows',
  (select count(*) from recoveryos.residence_application_intake) = 0);
select pg_temp.ok('fx-admin: residence_listing_submissions reads 0 rows',
  (select count(*) from recoveryos.residence_listing_submissions) = 0);
reset role;

-- ---------------------------------------------------------------------------
-- 1) Fixture navigator: care-ops/support predicates false, no intake reads
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f2', true);
set local role authenticated;
select pg_temp.ok('fx-nav: has_role(navigator) = false',        recoveryos.has_role('navigator') = false);
select pg_temp.ok('fx-nav: is_care_operations_staff = false',   recoveryos.is_care_operations_staff() = false);
select pg_temp.ok('fx-nav: is_support_staff = false',           recoveryos.is_support_staff() = false);
select pg_temp.ok('fx-nav: residence_application_intake reads 0 rows',
  (select count(*) from recoveryos.residence_application_intake) = 0);
reset role;

-- ---------------------------------------------------------------------------
-- 1) Remaining privileged role keys, each instantiated on its own fixture
--    actor: every predicate false (revision 2 — all eight keys covered).
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f3', true);
set local role authenticated;
select pg_temp.ok('fx-coach: has_role(coach) = false',           recoveryos.has_role('coach') = false);
select pg_temp.ok('fx-coach: is_coach_staff = false',            recoveryos.is_coach_staff() = false);
select pg_temp.ok('fx-coach: is_support_staff = false',          recoveryos.is_support_staff() = false);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f4', true);
set local role authenticated;
select pg_temp.ok('fx-pm: has_role(program_manager) = false',    recoveryos.has_role('program_manager') = false);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f5', true);
set local role authenticated;
select pg_temp.ok('fx-exec: has_role(executive) = false',        recoveryos.has_role('executive') = false);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f6', true);
set local role authenticated;
select pg_temp.ok('fx-sys: has_role(system_administrator) = false', recoveryos.has_role('system_administrator') = false);
select pg_temp.ok('fx-sys: is_platform_admin = false',           recoveryos.is_platform_admin() = false);
select pg_temp.ok('fx-sys: residence_listing_submissions reads 0 rows',
  (select count(*) from recoveryos.residence_listing_submissions) = 0);
reset role;

-- ---------------------------------------------------------------------------
-- 2) Production staff unchanged
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c1', true);
set local role authenticated;
select pg_temp.ok('prod-admin: has_role(administrator) = true', recoveryos.has_role('administrator') = true);
select pg_temp.ok('prod-admin: is_platform_admin = true',       recoveryos.is_platform_admin() = true);
select pg_temp.ok('prod-admin: is_admin_staff = true',          recoveryos.is_admin_staff() = true);
select pg_temp.ok('prod-admin: is_care_operations_staff = true',recoveryos.is_care_operations_staff() = true);
select pg_temp.ok('prod-admin: is_support_staff = true',        recoveryos.is_support_staff() = true);
select pg_temp.ok('prod-admin: reads listing submissions',
  (select count(*) from recoveryos.residence_listing_submissions
    where contact_email = 'negtest-p0-listing@negtest.p0') = 1);
select pg_temp.ok('prod-admin: reads application intake (care-ops path)',
  (select count(*) from recoveryos.residence_application_intake
    where applicant_email = 'negtest-p0-applicant@negtest.p0') = 1);
-- 5) grant RPC refuses privileged grants to fixtures, allows production
select pg_temp.ok('grant coach to FIXTURE person → test_fixture_privilege_blocked',
  (recoveryos.grant_role_assignment(current_setting('negtest.fxnav')::bigint, 'coach')
     ->> 'code') = 'test_fixture_privilege_blocked');
select pg_temp.ok('grant participant to FIXTURE person → allowed (non-privileged)',
  (recoveryos.grant_role_assignment(current_setting('negtest.fxnav')::bigint, 'participant')
     ->> 'code') in ('granted','already_granted'));
select pg_temp.ok('grant coach to PRODUCTION person → granted',
  (recoveryos.grant_role_assignment(current_setting('negtest.pnav')::bigint, 'coach')
     ->> 'code') in ('granted','already_granted'));
-- Authorized callers keep accurate diagnostics (person_not_found is NOT
-- suppressed for them — only for unauthorized callers, see section 7):
select pg_temp.ok('prod-admin: grant to NONEXISTENT person → person_not_found',
  (recoveryos.grant_role_assignment(999999999, 'coach') ->> 'code') = 'person_not_found');
reset role;

-- ---------------------------------------------------------------------------
-- 5) Grant refusal for EVERY privileged role key (revision 2). Caller is a
--    production system_administrator (passes both the platform-admin authority
--    check and the system_administrator privilege tier), so the fixture guard
--    is the deciding check for all eight keys.
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c4', true);
set local role authenticated;
select pg_temp.ok('grant ' || k || ' to FIXTURE person → test_fixture_privilege_blocked',
  (recoveryos.grant_role_assignment(
     current_setting('negtest.fxexec')::bigint,
     k::recoveryos.role_key,
     null, null,
     case when k in ('residence_staff','residence_manager')
          then current_setting('negtest.res')::bigint end
   ) ->> 'code') = 'test_fixture_privilege_blocked')
from unnest(array['coach','navigator','residence_staff','residence_manager',
                  'program_manager','administrator','executive','system_administrator']) as k;
reset role;

-- ---------------------------------------------------------------------------
-- 7) Response-code uniformity (revision 2): unauthorized callers cannot
--    distinguish production, fixture, or nonexistent targets.
-- ---------------------------------------------------------------------------
-- Ordinary PRODUCTION participant caller:
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c5', true);
set local role authenticated;
select set_config('negtest.u1', recoveryos.grant_role_assignment(current_setting('negtest.padmin')::bigint, 'coach')::text, true);
select set_config('negtest.u2', recoveryos.grant_role_assignment(current_setting('negtest.fxadmin')::bigint, 'coach')::text, true);
select set_config('negtest.u3', recoveryos.grant_role_assignment(999999999, 'coach')::text, true);
select pg_temp.ok('ordinary prod caller: production target → not_authorized',
  (current_setting('negtest.u1')::jsonb ->> 'code') = 'not_authorized');
select pg_temp.ok('ordinary prod caller: identical response for production vs fixture target',
  current_setting('negtest.u1')::jsonb = current_setting('negtest.u2')::jsonb);
select pg_temp.ok('ordinary prod caller: identical response for production vs nonexistent target',
  current_setting('negtest.u1')::jsonb = current_setting('negtest.u3')::jsonb);
reset role;
-- FIXTURE participant caller (same uniformity — fixtures cannot probe either):
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000f2', true);
set local role authenticated;
select set_config('negtest.v1', recoveryos.grant_role_assignment(current_setting('negtest.padmin')::bigint, 'coach')::text, true);
select set_config('negtest.v2', recoveryos.grant_role_assignment(current_setting('negtest.fxcoach')::bigint, 'coach')::text, true);
select set_config('negtest.v3', recoveryos.grant_role_assignment(999999999, 'coach')::text, true);
select pg_temp.ok('fixture caller: production target → not_authorized',
  (current_setting('negtest.v1')::jsonb ->> 'code') = 'not_authorized');
select pg_temp.ok('fixture caller: identical response for production vs fixture target',
  current_setting('negtest.v1')::jsonb = current_setting('negtest.v2')::jsonb);
select pg_temp.ok('fixture caller: identical response for production vs nonexistent target',
  current_setting('negtest.v1')::jsonb = current_setting('negtest.v3')::jsonb);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c2', true);
set local role authenticated;
select pg_temp.ok('prod-nav: is_care_operations_staff = true',  recoveryos.is_care_operations_staff() = true);
select pg_temp.ok('prod-nav: is_navigator_staff = true',        recoveryos.is_navigator_staff() = true);
select pg_temp.ok('prod-nav: is_platform_admin = false',        recoveryos.is_platform_admin() = false);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000c3', true);
set local role authenticated;
select pg_temp.ok('prod-rstaff: staff_residence_ids contains the residence',
  current_setting('negtest.res')::bigint in (select * from recoveryos.staff_residence_ids()));
select pg_temp.ok('prod-rstaff: reads application intake for own residence',
  (select count(*) from recoveryos.residence_application_intake
    where residence_id = current_setting('negtest.res')::bigint) = 1);
reset role;

do $$ begin raise notice 'P0 CLASSIFICATION-ISOLATION BATTERY: ALL ASSERTIONS PASSED (transaction will roll back)'; end $$;

rollback;
