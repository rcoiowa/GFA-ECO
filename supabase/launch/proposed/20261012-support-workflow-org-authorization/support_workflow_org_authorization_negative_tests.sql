-- support_workflow_org_authorization_negative_tests.sql
--
-- ISOLATED REPLAY OR DISPOSABLE STAGING ONLY. Never the launch project.
-- Guarded: refuses to run unless  set recoveryos.negtest = 'on';
-- Everything runs in ONE transaction and ends with ROLLBACK — no rows persist.
--
-- Prerequisites: launch migrations 0001..0146 + prepared 0147..0149 + the three
-- 20261005* migrations + THIS prepared fix (support_workflow_org_authorization.prepared.sql)
-- applied; the auth shim (auth.users + auth.uid() reading request.jwt.claim.sub) present;
-- run as a superuser/service connection (impersonates `authenticated` via SET LOCAL ROLE).
--
-- Proves (each assertion raises on failure):
--   T1 permitted same-org: a coach with role IN org A sees and can claim an org-A request;
--      the relationship is created with org A (NOT hardcoded 1).
--   T2 denied cross-org read: a coach in org B cannot see an org-A open request (RLS + list).
--   T3 denied cross-org claim: a coach in org B gets 'not_eligible' claiming an org-A request.
--   T4 revoked-role denial: a coach whose org-A role is revoked cannot see or claim.
--   T5 test-fixture separation: a fixture identity holding the coach role does not satisfy
--      has_role_in_org and is denied.
--   T6 authorized handoff: an admin in org A hands a request to org B; a coach in org B can
--      then claim it; a coach in org A no longer can; a 'handoff' event is recorded.
--   T7 null-org request: cannot be claimed ('org_unresolved') and is invisible to staff.
--   T8 platform/participant separation: an administrator assigned at null-org (platform) does
--      NOT gain org-A participant-record access.

\set ON_ERROR_STOP on

do $$ begin
  if coalesce(current_setting('recoveryos.negtest', true), '') <> 'on' then
    raise exception 'REFUSING TO RUN: set recoveryos.negtest = ''on'' only on an isolated replay or disposable staging database.';
  end if;
  if to_regprocedure('recoveryos.has_role_in_org(recoveryos.role_key, bigint)') is null then
    raise exception 'Prepared fix not applied: recoveryos.has_role_in_org is missing. Apply support_workflow_org_authorization.prepared.sql first.';
  end if;
end $$;

begin;

create function pg_temp.ok(label text, cond boolean) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'NEGTEST FAIL: %', label; end if;
  raise notice 'ok: %', label;
end $$;
grant execute on function pg_temp.ok(text, boolean) to public;

create temporary table ids (label text primary key, id bigint) on commit drop;

-- ---------------------------------------------------------------------------
-- Arrange: two organizations, staff + participants, role assignments, requests
-- ---------------------------------------------------------------------------
with a as (
  insert into recoveryos.organizations (name, organization_type)
  values ('NEGTEST Org A','recovery_support') returning id)
insert into ids select 'orgA', id from a;
with b as (
  insert into recoveryos.organizations (name, organization_type)
  values ('NEGTEST Org B','recovery_support') returning id)
insert into ids select 'orgB', id from b;

-- auth users + people (production unless classified fixture)
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000a001','negtest.coachA@example.test'),
  ('00000000-0000-4000-8000-00000000a002','negtest.coachB@example.test'),
  ('00000000-0000-4000-8000-00000000a003','negtest.adminA@example.test'),
  ('00000000-0000-4000-8000-00000000a004','negtest.platAdmin@example.test'),
  ('00000000-0000-4000-8000-00000000a005','negtest.fixtureCoachA@example.test'),
  ('00000000-0000-4000-8000-00000000a006','negtest.revokedCoachA@example.test'),
  ('00000000-0000-4000-8000-00000000a101','negtest.partA1@example.test'),
  ('00000000-0000-4000-8000-00000000a102','negtest.partA2@example.test'),
  ('00000000-0000-4000-8000-00000000a103','negtest.partA3@example.test'),
  ('00000000-0000-4000-8000-00000000a104','negtest.partHand@example.test'),
  ('00000000-0000-4000-8000-00000000a105','negtest.partNull@example.test');

insert into recoveryos.people (auth_user_id, first_name, last_name) values
  ('00000000-0000-4000-8000-00000000a001','CoachA','NT'),
  ('00000000-0000-4000-8000-00000000a002','CoachB','NT'),
  ('00000000-0000-4000-8000-00000000a003','AdminA','NT'),
  ('00000000-0000-4000-8000-00000000a004','PlatAdmin','NT'),
  ('00000000-0000-4000-8000-00000000a005','FixtureCoachA','NT'),
  ('00000000-0000-4000-8000-00000000a006','RevokedCoachA','NT'),
  ('00000000-0000-4000-8000-00000000a101','PartA1','NT'),
  ('00000000-0000-4000-8000-00000000a102','PartA2','NT'),
  ('00000000-0000-4000-8000-00000000a103','PartA3','NT'),
  ('00000000-0000-4000-8000-00000000a104','PartHand','NT'),
  ('00000000-0000-4000-8000-00000000a105','PartNull','NT');

-- fixture classification for FixtureCoachA (others default to production)
insert into recoveryos.person_classification (person_id, classification)
  select id, 'test_fixture' from recoveryos.people where auth_user_id = '00000000-0000-4000-8000-00000000a005';

-- role assignments (org-scoped), one revoked, one at null-org platform
insert into recoveryos.role_assignments (person_id, role_key, organization_id, revoked_at)
  select p.id, 'coach', (select id from ids where label='orgA'), null
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a001';
insert into recoveryos.role_assignments (person_id, role_key, organization_id, revoked_at)
  select p.id, 'coach', (select id from ids where label='orgB'), null
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a002';
insert into recoveryos.role_assignments (person_id, role_key, organization_id, revoked_at)
  select p.id, 'administrator', (select id from ids where label='orgA'), null
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a003';
insert into recoveryos.role_assignments (person_id, role_key, organization_id, revoked_at)
  select p.id, 'administrator', null, null
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a004';
insert into recoveryos.role_assignments (person_id, role_key, organization_id, revoked_at)
  select p.id, 'coach', (select id from ids where label='orgA'), null
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a005';
insert into recoveryos.role_assignments (person_id, role_key, organization_id, revoked_at)
  select p.id, 'coach', (select id from ids where label='orgA'), now()
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a006';

-- support requests (coaching domain), org-A and one null-org
with r as (
  insert into recoveryos.support_requests (person_id, request_type, organization_id, status)
  select p.id, 'recovery_coach', (select id from ids where label='orgA'), 'open'
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a101'
  returning id)
insert into ids select 'reqA1', id from r;
with r as (
  insert into recoveryos.support_requests (person_id, request_type, organization_id, status)
  select p.id, 'recovery_coach', (select id from ids where label='orgA'), 'open'
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a102'
  returning id)
insert into ids select 'reqA2', id from r;
with r as (
  insert into recoveryos.support_requests (person_id, request_type, organization_id, status)
  select p.id, 'recovery_coach', (select id from ids where label='orgA'), 'open'
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a103'
  returning id)
insert into ids select 'reqA3', id from r;
with r as (
  insert into recoveryos.support_requests (person_id, request_type, organization_id, status)
  select p.id, 'recovery_coach', (select id from ids where label='orgA'), 'open'
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a104'
  returning id)
insert into ids select 'reqHand', id from r;
with r as (
  insert into recoveryos.support_requests (person_id, request_type, organization_id, status)
  select p.id, 'recovery_coach', null, 'open'
    from recoveryos.people p where p.auth_user_id='00000000-0000-4000-8000-00000000a105'
  returning id)
insert into ids select 'reqNull', id from r;

-- ===========================================================================
-- T1 — permitted same-org: CoachA sees + claims reqA1; relationship org = orgA
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a001', true);
set local role authenticated;
select pg_temp.ok('T1 CoachA sees reqA1 in open list',
  exists (select 1 from recoveryos.list_open_support_requests() where support_request_id = (select id from ids where label='reqA1')));
select pg_temp.ok('T1 CoachA can read reqA1 row under RLS',
  (select count(*) from recoveryos.support_requests where id = (select id from ids where label='reqA1')) = 1);
select pg_temp.ok('T1 CoachA claim reqA1 succeeds',
  (recoveryos.claim_support_request((select id from ids where label='reqA1')) ->> 'code') = 'claimed');
reset role;
select pg_temp.ok('T1 relationship created with org A (not hardcoded 1)',
  exists (select 1 from recoveryos.coaching_relationships cr
          where cr.participant_person_id = (select id from recoveryos.people where auth_user_id='00000000-0000-4000-8000-00000000a101')
            and cr.organization_id = (select id from ids where label='orgA')));

-- ===========================================================================
-- T2 — denied cross-org read: CoachB cannot see org-A reqA2
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a002', true);
set local role authenticated;
select pg_temp.ok('T2 CoachB does NOT see reqA2 in open list',
  not exists (select 1 from recoveryos.list_open_support_requests() where support_request_id = (select id from ids where label='reqA2')));
select pg_temp.ok('T2 CoachB cannot read reqA2 row under RLS',
  (select count(*) from recoveryos.support_requests where id = (select id from ids where label='reqA2')) = 0);
-- T3 — denied cross-org claim
select pg_temp.ok('T3 CoachB claim of org-A reqA2 is not_eligible',
  (recoveryos.claim_support_request((select id from ids where label='reqA2')) ->> 'code') = 'not_eligible');
reset role;
select pg_temp.ok('T3 no cross-org relationship was created',
  not exists (select 1 from recoveryos.coaching_relationships cr
              where cr.participant_person_id = (select id from recoveryos.people where auth_user_id='00000000-0000-4000-8000-00000000a102')));

-- ===========================================================================
-- T4 — revoked-role denial: RevokedCoachA cannot see or claim reqA3
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a006', true);
set local role authenticated;
select pg_temp.ok('T4 revoked coach does NOT see reqA3',
  not exists (select 1 from recoveryos.list_open_support_requests() where support_request_id = (select id from ids where label='reqA3')));
select pg_temp.ok('T4 revoked coach claim is not_eligible',
  (recoveryos.claim_support_request((select id from ids where label='reqA3')) ->> 'code') = 'not_eligible');
reset role;

-- ===========================================================================
-- T5 — test-fixture separation: FixtureCoachA (coach@orgA but fixture) denied
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a005', true);
set local role authenticated;
select pg_temp.ok('T5 fixture coach does not satisfy has_role_in_org(coach, orgA)',
  recoveryos.has_role_in_org('coach', (select id from ids where label='orgA')) = false);
select pg_temp.ok('T5 fixture coach claim is not_eligible',
  (recoveryos.claim_support_request((select id from ids where label='reqA3')) ->> 'code') = 'not_eligible');
reset role;

-- ===========================================================================
-- T6 — authorized handoff: AdminA hands reqHand to org B; CoachB can then claim;
--      CoachA no longer can; a 'handoff' event is recorded.
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a003', true);
set local role authenticated;
select pg_temp.ok('T6 AdminA handoff reqHand to org B succeeds',
  (recoveryos.handoff_support_request((select id from ids where label='reqHand'), (select id from ids where label='orgB'), 'capacity') ->> 'code') = 'handed_off');
reset role;
select pg_temp.ok('T6 reqHand now belongs to org B',
  (select organization_id from recoveryos.support_requests where id=(select id from ids where label='reqHand')) = (select id from ids where label='orgB'));
select pg_temp.ok('T6 a handoff event was recorded',
  exists (select 1 from recoveryos.support_request_events
          where support_request_id=(select id from ids where label='reqHand') and event_type='handoff'));
-- CoachA (org A) now cannot claim it
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a001', true);
set local role authenticated;
select pg_temp.ok('T6 CoachA (org A) can no longer claim the handed-off request',
  (recoveryos.claim_support_request((select id from ids where label='reqHand')) ->> 'code') = 'not_eligible');
reset role;
-- CoachB (org B) can claim it
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a002', true);
set local role authenticated;
select pg_temp.ok('T6 CoachB (org B) can claim the handed-off request',
  (recoveryos.claim_support_request((select id from ids where label='reqHand')) ->> 'code') = 'claimed');
reset role;

-- ===========================================================================
-- T7 — null-org request: not claimable, invisible to staff
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a001', true);
set local role authenticated;
select pg_temp.ok('T7 null-org request claim is org_unresolved',
  (recoveryos.claim_support_request((select id from ids where label='reqNull')) ->> 'code') = 'org_unresolved');
select pg_temp.ok('T7 null-org request invisible to staff pool',
  (select count(*) from recoveryos.support_requests where id=(select id from ids where label='reqNull')) = 0);
reset role;

-- ===========================================================================
-- T8 — platform/participant separation: PlatAdmin (administrator@null-org) gets
--      no org-A participant-record access.
-- ===========================================================================
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000a004', true);
set local role authenticated;
select pg_temp.ok('T8 platform admin does not satisfy is_admin_staff_in_org(orgA)',
  recoveryos.is_admin_staff_in_org((select id from ids where label='orgA')) = false);
select pg_temp.ok('T8 platform admin cannot read org-A coaching relationships',
  (select count(*) from recoveryos.coaching_relationships
     where organization_id=(select id from ids where label='orgA')) = 0);
reset role;

select 'ALL SUPPORT-WORKFLOW ORG-AUTHZ NEGATIVE TESTS PASSED' as result;

rollback;
