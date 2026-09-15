-- 0147_live_readback_verification.sql — post-apply live read-back for the
-- REVISED 0147. Read-only; one transaction ending in ROLLBACK; aggregate
-- output only; raises on failure (STOP AND REPORT).
--
-- Run on CQCX immediately AFTER applying revised 0147 (which itself requires
-- 0148 + 0149 applied and read-back-verified first).

\set ON_ERROR_STOP on

begin;

-- A. Applied-definition checks
do $$
begin
  if position('has_role' in pg_get_functiondef('recoveryos.is_intake_coordinator()'::regprocedure)) = 0
     or position('role_assignments' in pg_get_functiondef('recoveryos.is_intake_coordinator()'::regprocedure)) > 0 then
    raise exception 'READBACK FAIL: is_intake_coordinator does not flow through the canonical boundary';
  end if;
  if position('has_role' in pg_get_functiondef('recoveryos.is_intake_worker()'::regprocedure)) = 0
     or position('role_assignments' in pg_get_functiondef('recoveryos.is_intake_worker()'::regprocedure)) > 0 then
    raise exception 'READBACK FAIL: is_intake_worker does not flow through the canonical boundary';
  end if;
  if position('is_production_actor' in pg_get_functiondef('recoveryos.can_work_lead(bigint)'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: can_work_lead assignment arm lacks the canonical guard';
  end if;
  if not recoveryos.is_privileged_role('intake_coordinator'::recoveryos.role_key)
     or not recoveryos.is_privileged_role('intake_worker'::recoveryos.role_key) then
    raise exception 'READBACK FAIL: is_privileged_role does not cover the intake roles';
  end if;
  if position('assignee_test_fixture_blocked' in pg_get_functiondef('recoveryos.assign_lead(bigint,bigint)'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: assign_lead lacks the fixture-assignee guard';
  end if;
  if position('is_production_person' in pg_get_functiondef('recoveryos.list_intake_assignees()'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: list_intake_assignees lacks the fixture exclusion';
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'recoveryos' and tablename = 'leads'
      and policyname = 'leads_intake_select'
      and qual like '%is_production_actor%'
  ) then
    raise exception 'READBACK FAIL: leads_intake_select assignment arm lacks the canonical guard';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'recoveryos' and tablename = 'leads'
      and policyname in ('leads_staff_select','leads_staff_update')
  ) then
    raise exception 'READBACK FAIL: the broad 0102 lead policies are still present';
  end if;
  raise notice 'readback A ok: revised-0147 definitions carry the canonical boundary';
end $$;

-- B. Per-actor simulation (aggregate only): every login-linked fixture actor
--    holding ANY active privileged role must fail both intake predicates;
--    every login-linked production intake coordinator / platform admin must
--    pass is_intake_coordinator.
do $$
declare
  a record;
  fx_checked int := 0; fx_failed int := 0;
  pr_checked int := 0; pr_failed int := 0;
begin
  for a in
    select distinct u.id as auth_id
    from recoveryos.person_classification pc
    join recoveryos.people p on p.id = pc.person_id
    join auth.users u on u.id = p.auth_user_id
    join recoveryos.role_assignments ra on ra.person_id = p.id and ra.revoked_at is null
    where pc.classification = 'test_fixture'
      and recoveryos.is_privileged_role(ra.role_key)
  loop
    fx_checked := fx_checked + 1;
    perform set_config('request.jwt.claim.sub', a.auth_id::text, true);
    if recoveryos.is_intake_coordinator() or recoveryos.is_intake_worker() then
      fx_failed := fx_failed + 1;
    end if;
  end loop;

  for a in
    select distinct u.id as auth_id
    from recoveryos.people p
    join auth.users u on u.id = p.auth_user_id
    join recoveryos.role_assignments ra on ra.person_id = p.id and ra.revoked_at is null
    left join recoveryos.person_classification pc on pc.person_id = p.id
    where ra.role_key::text in ('intake_coordinator','administrator','system_administrator')
      and coalesce(pc.classification, 'production') = 'production'
  loop
    pr_checked := pr_checked + 1;
    perform set_config('request.jwt.claim.sub', a.auth_id::text, true);
    if not recoveryos.is_intake_coordinator() then pr_failed := pr_failed + 1; end if;
  end loop;

  perform set_config('request.jwt.claim.sub', '', true);
  raise notice 'readback B: fixture privileged actors checked=%, intake-privileged=%', fx_checked, fx_failed;
  raise notice 'readback C: production coordinator/admin actors checked=%, lost access=%', pr_checked, pr_failed;
  if fx_failed > 0 then
    raise exception 'READBACK FAIL: % fixture actor(s) satisfy an intake predicate', fx_failed;
  end if;
  if pr_checked = 0 or pr_failed > 0 then
    raise exception 'READBACK FAIL: production coordinator/admin verification failed (checked=%, lost=%)', pr_checked, pr_failed;
  end if;
end $$;

rollback;
