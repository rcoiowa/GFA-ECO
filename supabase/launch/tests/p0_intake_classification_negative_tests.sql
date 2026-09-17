-- p0_intake_classification_negative_tests.sql — revised-0149 battery.
--
-- ISOLATED REPLAY OR DISPOSABLE STAGING ONLY. Never the launch project.
-- Refuses to run unless: set recoveryos.negtest = 'on'. One transaction,
-- ends with ROLLBACK — nothing persists.
--
-- Prerequisites: launch 0001–0146 + prepared 0147 + 0148 + REVISED 0149
-- applied; auth shim present; superuser/service connection.
--
-- Proves (raises on any failure):
--   1. A test_fixture administrator has NO intake privilege: predicates false,
--      zero lead rows, every RPC refuses.
--   2. A test_fixture identity holding intake_coordinator/intake_worker rows
--      directly (simulated drift) still has NO intake privilege — the roles
--      flow through the guarded canonical boundary.
--   3. A test_fixture identity ASSIGNED a lead directly still cannot read or
--      work it (the assignment arm carries the canonical guard).
--   4. Production coordinator, worker, and platform admin remain fully
--      functional (queue visibility, assign, contact, status).
--   5. assign_lead refuses fixture assignees; list_intake_assignees excludes
--      fixture identities; grant_role_assignment refuses intake roles for
--      fixture identities (is_privileged_role extension).

\set ON_ERROR_STOP on

do $$ begin
  if coalesce(current_setting('recoveryos.negtest', true), '') <> 'on' then
    raise exception 'REFUSING TO RUN: set recoveryos.negtest = ''on'' only on an isolated replay or disposable staging database.';
  end if;
  if to_regclass('recoveryos.lead_contact_events') is null then
    raise exception 'Revised 0149 is not applied to this database; apply it before running the battery.';
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
grant execute on function pg_temp.ok(text, boolean) to public;

-- ---------------------------------------------------------------------------
-- Arrange
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000d1', 'negtest-0149-fx-admin@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000d2', 'negtest-0149-fx-intake@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000d3', 'negtest-0149-prod-coord@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000d4', 'negtest-0149-prod-worker@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000d5', 'negtest-0149-prod-admin@negtest.p0');

select set_config('nt.fxadmin', (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000d1'), true);
select set_config('nt.fxintake',(select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000d2'), true);
select set_config('nt.coord',   (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000d3'), true);
select set_config('nt.worker',  (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000d4'), true);
select set_config('nt.padmin',  (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000d5'), true);

insert into recoveryos.person_classification (person_id, classification, reason) values
  (current_setting('nt.fxadmin')::bigint, 'test_fixture', 'NEGTEST-0149'),
  (current_setting('nt.fxintake')::bigint, 'test_fixture', 'NEGTEST-0149')
on conflict (person_id) do update set classification = 'test_fixture', reason = 'NEGTEST-0149';

-- Simulated drift: direct role rows, including intake roles on a fixture.
insert into recoveryos.role_assignments (person_id, role_key, organization_id) values
  (current_setting('nt.fxadmin')::bigint,  'administrator',      1),
  (current_setting('nt.fxintake')::bigint, 'intake_coordinator', 1),
  (current_setting('nt.fxintake')::bigint, 'intake_worker',      1),
  (current_setting('nt.coord')::bigint,    'intake_coordinator', 1),
  (current_setting('nt.worker')::bigint,   'intake_worker',      1),
  (current_setting('nt.padmin')::bigint,   'administrator',      1);

insert into recoveryos.leads (first_name, last_name, email, message)
values ('NEGTEST-0149', 'Lead', 'negtest-0149-lead@negtest.p0', 'battery');
select set_config('nt.lead', (select id::text from recoveryos.leads where email='negtest-0149-lead@negtest.p0'), true);

-- ---------------------------------------------------------------------------
-- 1) Fixture administrator: no intake privilege anywhere
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d1', true);
set local role authenticated;
select pg_temp.ok('fx-admin: is_intake_coordinator = false', recoveryos.is_intake_coordinator() = false);
select pg_temp.ok('fx-admin: reads 0 leads', (select count(*) from recoveryos.leads) = 0);
select pg_temp.ok('fx-admin: assign_lead → not_authorized',
  (recoveryos.assign_lead(current_setting('nt.lead')::bigint, current_setting('nt.worker')::bigint) ->> 'code') = 'not_authorized');
select pg_temp.ok('fx-admin: list_intake_assignees → not_authorized',
  (recoveryos.list_intake_assignees() ->> 'code') = 'not_authorized');
reset role;

-- ---------------------------------------------------------------------------
-- 2) Fixture identity with direct intake roles: boundary holds
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d2', true);
set local role authenticated;
select pg_temp.ok('fx-intake: has_role(intake_coordinator) = false', recoveryos.has_role('intake_coordinator') = false);
select pg_temp.ok('fx-intake: is_intake_coordinator = false', recoveryos.is_intake_coordinator() = false);
select pg_temp.ok('fx-intake: is_intake_worker = false',      recoveryos.is_intake_worker() = false);
select pg_temp.ok('fx-intake: reads 0 leads', (select count(*) from recoveryos.leads) = 0);
select pg_temp.ok('fx-intake: record_lead_contact → not_authorized',
  (recoveryos.record_lead_contact(current_setting('nt.lead')::bigint, 'phone', 'battery') ->> 'code') = 'not_authorized');
reset role;

-- ---------------------------------------------------------------------------
-- 3) Fixture identity ASSIGNED the lead directly: assignment arm guarded
-- ---------------------------------------------------------------------------
update recoveryos.leads set assigned_to_person_id = current_setting('nt.fxintake')::bigint
 where id = current_setting('nt.lead')::bigint;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d2', true);
set local role authenticated;
select pg_temp.ok('fx-intake (assigned): can_work_lead = false',
  recoveryos.can_work_lead(current_setting('nt.lead')::bigint) = false);
select pg_temp.ok('fx-intake (assigned): still reads 0 leads', (select count(*) from recoveryos.leads) = 0);
select pg_temp.ok('fx-intake (assigned): record_lead_contact → not_authorized',
  (recoveryos.record_lead_contact(current_setting('nt.lead')::bigint, 'phone', 'battery') ->> 'code') = 'not_authorized');
reset role;
update recoveryos.leads set assigned_to_person_id = null
 where id = current_setting('nt.lead')::bigint;

-- ---------------------------------------------------------------------------
-- 4/5) Production coordinator: functional, and the picker/assignment guards hold
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d3', true);
set local role authenticated;
select pg_temp.ok('prod-coord: is_intake_coordinator = true', recoveryos.is_intake_coordinator() = true);
select pg_temp.ok('prod-coord: sees the lead',
  (select count(*) from recoveryos.leads where id = current_setting('nt.lead')::bigint) = 1);
select pg_temp.ok('prod-coord: assign to FIXTURE → assignee_test_fixture_blocked',
  (recoveryos.assign_lead(current_setting('nt.lead')::bigint, current_setting('nt.fxintake')::bigint) ->> 'code') = 'assignee_test_fixture_blocked');
select pg_temp.ok('prod-coord: assign to production worker → assigned',
  (recoveryos.assign_lead(current_setting('nt.lead')::bigint, current_setting('nt.worker')::bigint) ->> 'code') = 'assigned');
select pg_temp.ok('prod-coord: assignee picker excludes the fixture identity',
  not exists (
    select 1 from jsonb_array_elements((recoveryos.list_intake_assignees() -> 'assignees')) a
    where (a ->> 'person_id')::bigint = current_setting('nt.fxintake')::bigint));
select pg_temp.ok('prod-coord: assignee picker includes the production worker',
  exists (
    select 1 from jsonb_array_elements((recoveryos.list_intake_assignees() -> 'assignees')) a
    where (a ->> 'person_id')::bigint = current_setting('nt.worker')::bigint));
select pg_temp.ok('prod-coord: set_lead_status waiting → status_set',
  (recoveryos.set_lead_status(current_setting('nt.lead')::bigint, 'waiting') ->> 'code') = 'status_set');
reset role;

-- ---------------------------------------------------------------------------
-- 4) Production worker (assigned): functional
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d4', true);
set local role authenticated;
select pg_temp.ok('prod-worker: sees the assigned lead',
  (select count(*) from recoveryos.leads where id = current_setting('nt.lead')::bigint) = 1);
select pg_temp.ok('prod-worker: record_lead_contact → recorded',
  (recoveryos.record_lead_contact(current_setting('nt.lead')::bigint, 'phone', 'reached voicemail') ->> 'code') = 'recorded');
select pg_temp.ok('prod-worker: reads the contact event back',
  (select count(*) from recoveryos.lead_contact_events where lead_id = current_setting('nt.lead')::bigint) = 1);
reset role;

-- ---------------------------------------------------------------------------
-- 4) Production platform admin: coordinator via the canonical boundary
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000d5', true);
set local role authenticated;
select pg_temp.ok('prod-admin: is_intake_coordinator = true (platform-admin arm)',
  recoveryos.is_intake_coordinator() = true);
-- 5) is_privileged_role extension: intake roles cannot be granted to fixtures.
select pg_temp.ok('grant intake_worker to FIXTURE → test_fixture_privilege_blocked',
  (recoveryos.grant_role_assignment(current_setting('nt.fxintake')::bigint, 'intake_worker') ->> 'code') = 'test_fixture_privilege_blocked');
select pg_temp.ok('grant intake_worker to PRODUCTION person → granted/already_granted',
  (recoveryos.grant_role_assignment(current_setting('nt.worker')::bigint, 'intake_worker') ->> 'code') in ('granted','already_granted'));
reset role;

do $$ begin raise notice '0149R INTAKE CLASSIFICATION BATTERY: ALL ASSERTIONS PASSED (transaction will roll back)'; end $$;

rollback;
