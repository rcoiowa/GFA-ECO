-- p0_fixture_role_revocation.gated.sql — Decision 2 of the 2026-09-14 P0
-- authorization (see docs/decisions/2026-09-14-p0-classification-authorization-isolation.md §9).
--
-- SEQUENCING GATE: run ONLY after prepared 0147 is applied to CQCX and
-- 0147_live_readback_verification.sql has passed. The script refuses to run
-- otherwise. Show the SCOPE PREVIEW output to the decision owner before
-- executing the revocation section, per the authorization.
--
-- What it does: sets revoked_at on the ACTIVE privileged role_assignments of
-- test_fixture-classified persons. Rows are never deleted; every revocation is
-- audited ('role.revoked', actor null, detail cites this authorization) and is
-- reversible by clearing revoked_at under a future explicit authority.
-- Aggregate output only — no names, emails, or intake content.
--
-- Safety guards beyond the authorization:
--   * refuses if 0147 is not applied (the structural fix must land first);
--   * refuses if the revocation would leave zero login-linked PRODUCTION
--     platform administrators (stronger form of the 0117 last-admin lockout).

\set ON_ERROR_STOP on

do $$
begin
  if to_regprocedure('recoveryos.is_privileged_role(recoveryos.role_key)') is null
     or position('is_privileged_role' in pg_get_functiondef('recoveryos.has_role(recoveryos.role_key)'::regprocedure)) = 0 then
    raise exception 'REFUSING: prepared 0147 is not applied — apply and read-back-verify it first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SCOPE PREVIEW (read-only; show this to the decision owner before executing)
-- ---------------------------------------------------------------------------
select ra.role_key,
       count(*)                       as active_assignments_to_revoke,
       count(distinct ra.person_id)   as distinct_fixture_persons
from recoveryos.role_assignments ra
join recoveryos.person_classification pc
  on pc.person_id = ra.person_id and pc.classification = 'test_fixture'
where ra.revoked_at is null
  and recoveryos.is_privileged_role(ra.role_key)
group by ra.role_key
order by ra.role_key;

-- ---------------------------------------------------------------------------
-- REVOCATION (single transaction; aborts whole if any guard fails)
-- ---------------------------------------------------------------------------
begin;

do $$
declare
  v_prod_admins int;
begin
  select count(distinct ra.person_id) into v_prod_admins
  from recoveryos.role_assignments ra
  join recoveryos.people p on p.id = ra.person_id and p.auth_user_id is not null
  left join recoveryos.person_classification pc on pc.person_id = ra.person_id
  where ra.role_key in ('administrator','system_administrator')
    and ra.revoked_at is null
    and coalesce(pc.classification, 'production') = 'production';
  if v_prod_admins = 0 then
    raise exception 'REFUSING: no login-linked production platform administrator would remain — provision one first.';
  end if;
end $$;

-- APPROVED-SCOPE GATE (revision 2, 2026-09-16). The 2026-09-14 independent
-- read-only CQCX verification recorded the exact scope this authorization
-- covers: 22 distinct login-linked test-fixture actors holding 22 active
-- privileged assignments — coach 17, administrator 1, executive 1,
-- navigator 1, residence_manager 1, residence_staff 1. Per the decision-2
-- condition ("execute only if it matches the approved scope"), any drift from
-- these aggregates ABORTS the transaction: reconcile and obtain a fresh scope
-- approval instead of improvising. (No personal data is read or printed.)
do $$
declare
  v_actors int; v_assignments int; v_loglinked int; v_bad int;
begin
  -- Total revocation scope (exactly what the UPDATE below would touch):
  select count(distinct ra.person_id), count(*)
    into v_actors, v_assignments
  from recoveryos.role_assignments ra
  join recoveryos.person_classification pc
    on pc.person_id = ra.person_id and pc.classification = 'test_fixture'
  where ra.revoked_at is null and recoveryos.is_privileged_role(ra.role_key);

  -- Of those, the login-linked subset (what the 2026-09-14 verification
  -- counted). Any difference means the revocation would exceed the shown
  -- scope (non-login-linked fixture assignments exist) — abort.
  select count(*) into v_loglinked
  from recoveryos.role_assignments ra
  join recoveryos.person_classification pc
    on pc.person_id = ra.person_id and pc.classification = 'test_fixture'
  join recoveryos.people p on p.id = ra.person_id and p.auth_user_id is not null
  where ra.revoked_at is null and recoveryos.is_privileged_role(ra.role_key);

  select count(*) into v_bad from (
    select ra.role_key::text as rk, count(*) as n
    from recoveryos.role_assignments ra
    join recoveryos.person_classification pc
      on pc.person_id = ra.person_id and pc.classification = 'test_fixture'
    where ra.revoked_at is null and recoveryos.is_privileged_role(ra.role_key)
    group by ra.role_key::text
  ) live
  full outer join (values ('coach',17),('administrator',1),('executive',1),
                          ('navigator',1),('residence_manager',1),('residence_staff',1))
       approved(rk, n)
    on approved.rk = live.rk
  where live.n is distinct from approved.n;

  if v_actors <> 22 or v_assignments <> 22 or v_loglinked <> 22 or v_bad > 0 then
    raise exception 'REFUSING: live scope (actors=%, assignments=%, login-linked=%, per-role mismatches=%) differs from the approved 2026-09-14 scope (22 login-linked actors, 22 assignments: coach 17, administrator 1, executive 1, navigator 1, residence_manager 1, residence_staff 1). Reconcile and re-approve the scope before revoking.', v_actors, v_assignments, v_loglinked, v_bad;
  end if;
  raise notice 'approved-scope gate ok: 22 actors / 22 assignments (all login-linked) match the 2026-09-14 verification';
end $$;

with target as (
  select ra.id, ra.person_id, ra.role_key, ra.residence_id
  from recoveryos.role_assignments ra
  join recoveryos.person_classification pc
    on pc.person_id = ra.person_id and pc.classification = 'test_fixture'
  where ra.revoked_at is null
    and recoveryos.is_privileged_role(ra.role_key)
  for update of ra
),
revoked as (
  update recoveryos.role_assignments ra
     set revoked_at = now()
    from target t
   where ra.id = t.id
  returning ra.id, t.person_id, t.role_key, t.residence_id
),
audited as (
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  select null, 'role.revoked', 'role_assignments', r.id,
         jsonb_build_object(
           'person_id', r.person_id, 'role', r.role_key, 'residence_id', r.residence_id,
           'authority', 'P0 SEC-P0-001 decision 2, executive authorization 2026-09-14',
           'record', 'docs/decisions/2026-09-14-p0-classification-authorization-isolation.md')
  from revoked r
  returning 1
)
select (select count(*) from revoked) as assignments_revoked,
       (select count(*) from audited) as audit_rows_written;

-- Post-condition: nothing privileged remains active on any fixture identity.
do $$
declare v_left int;
begin
  select count(*) into v_left
  from recoveryos.role_assignments ra
  join recoveryos.person_classification pc
    on pc.person_id = ra.person_id and pc.classification = 'test_fixture'
  where ra.revoked_at is null and recoveryos.is_privileged_role(ra.role_key);
  if v_left > 0 then
    raise exception 'POST-CONDITION FAIL: % privileged fixture assignment(s) still active — transaction aborts.', v_left;
  end if;
  raise notice 'post-condition ok: zero active privileged fixture assignments remain';
end $$;

commit;
