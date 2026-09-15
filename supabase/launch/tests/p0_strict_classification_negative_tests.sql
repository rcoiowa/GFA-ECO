-- p0_strict_classification_negative_tests.sql — 0151 (D4b strict fail-closed) battery.
--
-- ISOLATED REPLAY OR DISPOSABLE STAGING ONLY. Never the launch project.
-- Refuses to run unless: set recoveryos.negtest = 'on'. One transaction,
-- ends with ROLLBACK — nothing persists.
--
-- Prerequisites: launch 0001–0146 + 0148 + 0149 + revised 0147 + 0151 applied;
-- auth shim; superuser/service connection.
--
-- Proves (raises on any failure):
--   1. A login-linked person holding privileged roles but MISSING a
--      person_classification row fails every privileged predicate and reads
--      zero leads (fail closed — the D4b invariant).
--   2. The participant plane is unaffected for that person (non-privileged).
--   3. Explicitly production-classified staff remain fully functional.
--   4. grant_role_assignment refuses privileged grants to unclassified
--      targets (person_unclassified) while fixture targets keep their code.
--   5. assign_lead refuses unclassified assignees (assignee_unclassified).
--   6. Notification fan-out excludes unclassified recipients.

\set ON_ERROR_STOP on

do $$ begin
  if coalesce(current_setting('recoveryos.negtest', true), '') <> 'on' then
    raise exception 'REFUSING TO RUN: set recoveryos.negtest = ''on'' only on an isolated replay or disposable staging database.';
  end if;
  if position('classification = ''production''' in
       pg_get_functiondef('recoveryos.is_production_person(bigint)'::regprocedure)) = 0 then
    raise exception 'Strict 0151 is not applied to this database; apply it before running the battery.';
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
insert into recoveryos.residences (organization_id, name, address_city, address_state, is_active)
select (select id from recoveryos.organizations order by id limit 1),
       'NEGTEST-0151 Residence', 'X', 'IA', true;
select set_config('st.res', (select id::text from recoveryos.residences where name='NEGTEST-0151 Residence'), true);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000e6', 'negtest-0151-unclassified@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000e7', 'negtest-0151-prod-admin@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000e8', 'negtest-0151-fixture@negtest.p0'),
  ('00000000-0000-4000-8000-0000000000e9', 'negtest-0151-prod-coach@negtest.p0');

select set_config('st.uncl',   (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000e6'), true);
select set_config('st.padmin', (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000e7'), true);
select set_config('st.fx',     (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000e8'), true);
select set_config('st.pcoach', (select id::text from recoveryos.people where auth_user_id='00000000-0000-4000-8000-0000000000e9'), true);

-- Signup provisioning wrote 'production' rows; simulate the MISSING state for
-- one actor by deleting the row, and mark one as fixture.
delete from recoveryos.person_classification where person_id = current_setting('st.uncl')::bigint;
update recoveryos.person_classification set classification='test_fixture', reason='NEGTEST-0151'
 where person_id = current_setting('st.fx')::bigint;

-- Privileged roles land on the unclassified actor DIRECTLY (simulated drift;
-- the RPC now refuses this).
insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id) values
  (current_setting('st.uncl')::bigint,   'administrator',      1, null),
  (current_setting('st.uncl')::bigint,   'intake_coordinator', 1, null),
  (current_setting('st.uncl')::bigint,   'residence_manager',  1, current_setting('st.res')::bigint),
  (current_setting('st.padmin')::bigint, 'administrator',      1, null);

-- A lead: fires trg_lead_notify AFTER the actors exist.
insert into recoveryos.leads (first_name, email, message)
values ('NEGTEST-0151', 'negtest-0151-lead@negtest.p0', 'battery');
select set_config('st.lead', (select id::text from recoveryos.leads where email='negtest-0151-lead@negtest.p0'), true);

-- 6) Fan-out excludes unclassified recipients (strict is_production_person).
select pg_temp.ok('fan-out: unclassified admin received NO notifications',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('st.uncl')::bigint) = 0);
select pg_temp.ok('fan-out: production admin received the lead notification',
  (select count(*) from recoveryos.notifications
    where recipient_person_id = current_setting('st.padmin')::bigint) >= 1);

-- ---------------------------------------------------------------------------
-- 1/2) Unclassified privileged actor: fail closed everywhere; participant intact
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e6', true);
set local role authenticated;
select pg_temp.ok('unclassified: has_role(administrator) = false', recoveryos.has_role('administrator') = false);
select pg_temp.ok('unclassified: is_platform_admin = false',       recoveryos.is_platform_admin() = false);
select pg_temp.ok('unclassified: is_intake_coordinator = false',   recoveryos.is_intake_coordinator() = false);
select pg_temp.ok('unclassified: is_production_actor = false',     recoveryos.is_production_actor() = false);
select pg_temp.ok('unclassified: staff_residence_ids empty',
  not exists (select 1 from recoveryos.staff_residence_ids()));
select pg_temp.ok('unclassified: is_residence_manager_of = false',
  recoveryos.is_residence_manager_of(current_setting('st.res')::bigint) = false);
select pg_temp.ok('unclassified: reads 0 leads', (select count(*) from recoveryos.leads) = 0);
select pg_temp.ok('unclassified: has_role(participant) still true (non-privileged plane)',
  recoveryos.has_role('participant') = true);
reset role;

-- ---------------------------------------------------------------------------
-- 3/4/5) Production admin functional; RPC refusals carry the right codes
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000e7', true);
set local role authenticated;
select pg_temp.ok('prod-admin: is_platform_admin = true', recoveryos.is_platform_admin() = true);
select pg_temp.ok('prod-admin: is_intake_coordinator = true', recoveryos.is_intake_coordinator() = true);
select pg_temp.ok('grant coach to UNCLASSIFIED → person_unclassified',
  (recoveryos.grant_role_assignment(current_setting('st.uncl')::bigint, 'coach') ->> 'code') = 'person_unclassified');
select pg_temp.ok('grant coach to FIXTURE → test_fixture_privilege_blocked',
  (recoveryos.grant_role_assignment(current_setting('st.fx')::bigint, 'coach') ->> 'code') = 'test_fixture_privilege_blocked');
select pg_temp.ok('grant coach to PRODUCTION person → granted',
  (recoveryos.grant_role_assignment(current_setting('st.pcoach')::bigint, 'coach') ->> 'code') in ('granted','already_granted'));
select pg_temp.ok('grant participant to UNCLASSIFIED → allowed (non-privileged)',
  (recoveryos.grant_role_assignment(current_setting('st.uncl')::bigint, 'participant') ->> 'code') in ('granted','already_granted'));
select pg_temp.ok('assign_lead to UNCLASSIFIED → assignee_unclassified',
  (recoveryos.assign_lead(current_setting('st.lead')::bigint, current_setting('st.uncl')::bigint) ->> 'code') = 'assignee_unclassified');
reset role;

do $$ begin raise notice '0151 STRICT CLASSIFICATION BATTERY: ALL ASSERTIONS PASSED (transaction will roll back)'; end $$;

rollback;
