-- 0147_live_readback_verification.sql — post-apply live read-back (Decision 1 condition).
--
-- Run on CQCX immediately AFTER applying prepared 0147, on a service/admin SQL
-- connection. Read-only by design: the whole script runs in one transaction and
-- ends with ROLLBACK; it emits aggregate counts only (no names, emails, or
-- intake content). It raises an exception (non-zero exit under ON_ERROR_STOP)
-- on any failed check — a failure means STOP AND REPORT, per the authorization.
--
-- What it proves, directly against the live database:
--   A. The applied definitions carry the 0147 guard (catalog text check).
--   B. Every login-linked test_fixture person holding an active privileged
--      role fails every privileged predicate (evaluated per actor via the
--      auth.uid() claim, exactly how PostgREST evaluates them).
--   C. Every login-linked production-classified platform administrator still
--      satisfies is_platform_admin() (staff access preserved).

\set ON_ERROR_STOP on

begin;

-- A. Applied-definition checks --------------------------------------------------
do $$
begin
  if to_regprocedure('recoveryos.is_privileged_role(recoveryos.role_key)') is null then
    raise exception 'READBACK FAIL: is_privileged_role missing — 0147 not applied';
  end if;
  if position('is_privileged_role' in pg_get_functiondef('recoveryos.has_role(recoveryos.role_key)'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: has_role lacks the classification guard';
  end if;
  if position('is_test_fixture' in pg_get_functiondef('recoveryos.staff_residence_ids()'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: staff_residence_ids lacks the classification guard';
  end if;
  if position('is_test_fixture' in pg_get_functiondef('recoveryos.is_residence_manager_of(bigint)'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: is_residence_manager_of lacks the classification guard';
  end if;
  if position('is_production_person' in pg_get_functiondef('recoveryos.trg_lead_notify()'::regprocedure)) = 0
     or position('is_production_person' in pg_get_functiondef('recoveryos.trg_listing_submission_notify()'::regprocedure)) = 0
     or position('is_production_person' in pg_get_functiondef('recoveryos.trg_application_intake_notify()'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: a notification fan-out lacks the production-recipient filter';
  end if;
  if position('test_fixture_privilege_blocked' in pg_get_functiondef('recoveryos.grant_role_assignment(bigint,recoveryos.role_key,bigint,bigint,bigint)'::regprocedure)) = 0 then
    raise exception 'READBACK FAIL: grant_role_assignment lacks the fixture-grant guard';
  end if;
  -- Revision-2 anti-disclosure ordering: the caller-authorization branch must
  -- precede both target-dependent codes in the applied definition.
  declare v_def text;
  begin
    v_def := pg_get_functiondef('recoveryos.grant_role_assignment(bigint,recoveryos.role_key,bigint,bigint,bigint)'::regprocedure);
    if not (position('not_authorized' in v_def) > 0
            and position('not_authorized' in v_def) < position('person_not_found' in v_def)
            and position('not_authorized' in v_def) < position('test_fixture_privilege_blocked' in v_def)) then
      raise exception 'READBACK FAIL: grant_role_assignment does not decide caller authorization before target lookups (revision-2 ordering)';
    end if;
  end;
  raise notice 'readback A: applied definitions carry the 0147 guards (incl. revision-2 ordering)';
end $$;

-- B + C. Per-actor predicate evaluation (aggregate reporting only) --------------
-- Predicates are SECURITY DEFINER and depend only on auth.uid(); setting the
-- transaction-local JWT claim evaluates them exactly as an authenticated
-- session for that login would. Nothing identifying is printed.
do $$
declare
  a record;
  fx_checked int := 0; fx_failed int := 0;
  pr_checked int := 0; pr_failed int := 0;
  v_privileged boolean;
begin
  -- B: every login-linked fixture actor with an active privileged role
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
    v_privileged :=
         recoveryos.is_platform_admin()
      or recoveryos.is_admin_staff()
      or recoveryos.is_care_operations_staff()
      or recoveryos.is_support_staff()
      or recoveryos.is_coach_staff()
      or recoveryos.is_navigator_staff()
      or exists (select 1 from recoveryos.staff_residence_ids());
    if v_privileged then fx_failed := fx_failed + 1; end if;
  end loop;

  -- C: every login-linked production platform administrator keeps access
  for a in
    select distinct u.id as auth_id
    from recoveryos.people p
    join auth.users u on u.id = p.auth_user_id
    join recoveryos.role_assignments ra on ra.person_id = p.id and ra.revoked_at is null
    left join recoveryos.person_classification pc on pc.person_id = p.id
    where ra.role_key in ('administrator','system_administrator')
      and coalesce(pc.classification, 'production') = 'production'
  loop
    pr_checked := pr_checked + 1;
    perform set_config('request.jwt.claim.sub', a.auth_id::text, true);
    if not recoveryos.is_platform_admin() then pr_failed := pr_failed + 1; end if;
  end loop;

  perform set_config('request.jwt.claim.sub', '', true);

  raise notice 'readback B: fixture privileged actors checked=%, still privileged=%', fx_checked, fx_failed;
  raise notice 'readback C: production admins checked=%, lost access=%', pr_checked, pr_failed;

  if fx_checked = 0 then
    raise warning 'readback B checked 0 fixture actors — expected 22 per the 2026-09-14 independent verification; verify classification data before closing the gate.';
  elsif fx_checked <> 22 then
    raise warning 'readback B checked % fixture actors — the 2026-09-14 independent verification recorded 22 distinct login-linked privileged fixture actors (22 active assignments: 17 coach, 1 administrator, 1 executive, 1 navigator, 1 residence_manager, 1 residence_staff). Reconcile the difference and re-confirm the approved revocation scope BEFORE running the revocation step.', fx_checked;
  end if;
  if fx_failed > 0 then
    raise exception 'READBACK FAIL: % fixture actor(s) still satisfy a privileged predicate', fx_failed;
  end if;
  if pr_checked = 0 or pr_failed > 0 then
    raise exception 'READBACK FAIL: production admin verification failed (checked=%, lost=%)', pr_checked, pr_failed;
  end if;
end $$;

rollback;
