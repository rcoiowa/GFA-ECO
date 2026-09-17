-- 0151_strict_classification_semantics.prepared.sql — R1 decision D4, OPTION (b)
-- (selected by the decision-maker 2026-09-15, superseding the packet's (a)).
--
-- STATUS: PREPARED ONLY. Preparation authorized by decision 6; APPLICATION IS
-- NOT AUTHORIZED. Requires 0147, 0148, and revised 0149 applied first (it
-- redefines functions those migrations establish).
--
-- DURABLE INVARIANT (decision 6): explicit production classification permits
-- the production authorization plane; test_fixture denies privileged access;
-- **missing classification ALSO denies privileged access** (fail closed).
--
-- Mechanism — one semantic change at the canonical boundary, then the guards
-- ride it:
--   * recoveryos.is_production_person(p): now requires an EXPLICIT
--     classification = 'production' row (was: "not test_fixture", which
--     treated missing as production). Every consumer inherits strict
--     semantics: the 0030/0117/0126/0132/0136 production read models, 0120
--     same_world, the 0147 notification-recipient filters, and the 0149R
--     assignee picker.
--   * recoveryos.is_production_actor(): routes through it.
--   * has_role / staff_residence_ids / is_residence_manager_of: privileged
--     access now requires is_production_person(current) rather than merely
--     "not fixture".
--   * grant_role_assignment / assign_lead: an UNCLASSIFIED target is refused
--     with its own envelope code (person_unclassified / assignee_unclassified)
--     so operators see the real cause; fixture targets keep their existing
--     codes.
--   * is_test_fixture() is unchanged (explicit test detection).
--
-- PRE-APPLY CONDITION (decision 6, mandatory): immediately before applying,
-- repeat the live zero-missing checks —
--   1. zero login-linked people holding any ACTIVE privileged role lack a
--      person_classification row;
--   2. zero login-linked people overall lack a person_classification row.
-- Any missing login-linked staff classification → STOP AND INVESTIGATE. Never
-- silently classify or backfill people to make this migration pass.
-- (Signup provisioning already writes an explicit production row — verified
-- both live and on the repo lineage — so "missing" should not recur.)
--
-- ROLLBACK: 0151_strict_classification_semantics.rollback.sql restores the
-- exact lenient definitions. Rolling back restores fail-open semantics for
-- missing classifications; record the reason.

begin;

-- 1) The canonical semantic change.
create or replace function recoveryos.is_production_person(p_person_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select exists (select 1 from recoveryos.person_classification
                 where person_id = p_person_id and classification = 'production');
$$;
comment on function recoveryos.is_production_person(bigint) is
  'STRICT (0151, decision 6 D4b): true only for an EXPLICIT production classification. '
  'Missing classification is NOT production — it denies the production authorization '
  'plane, excludes production read models/notifications, and is fixture-world for '
  'same_world purposes. Supersedes the 0030 "not test_fixture" semantics.';

create or replace function recoveryos.is_production_actor()
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.is_production_person(recoveryos.current_person_id());
$$;
comment on function recoveryos.is_production_actor() is
  'Canonical boundary (0149R, STRICT since 0151): true only when the current person '
  'carries an explicit production classification. Missing classification denies.';

-- 2) Privileged predicates: production required, not merely "not fixture".
create or replace function recoveryos.has_role(target_role recoveryos.role_key)
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from role_assignments ra
    where ra.person_id = current_person_id()
      and ra.role_key = target_role
      and ra.revoked_at is null
  )
  and (
    not recoveryos.is_privileged_role(target_role)
    or recoveryos.is_production_person(recoveryos.current_person_id())
  );
$$;
comment on function recoveryos.has_role(recoveryos.role_key) is
  'P0-INV (0147, STRICT since 0151): privileged roles require an explicit production '
  'classification — test_fixture AND missing classification both fail closed.';

create or replace function recoveryos.staff_residence_ids()
returns setof bigint
language sql stable security definer set search_path = recoveryos, public as $$
  select ra.residence_id from role_assignments ra
  where ra.person_id = current_person_id()
    and ra.role_key in ('residence_staff', 'residence_manager')
    and ra.residence_id is not null
    and ra.revoked_at is null
    and recoveryos.is_production_person(recoveryos.current_person_id());
$$;

create or replace function recoveryos.is_residence_manager_of(p_residence_id bigint)
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from recoveryos.role_assignments ra
    where ra.person_id = recoveryos.current_person_id()
      and ra.role_key = 'residence_manager'
      and ra.residence_id = p_residence_id
      and ra.revoked_at is null)
  and recoveryos.is_production_person(recoveryos.current_person_id());
$$;

-- 3) grant_role_assignment: unclassified privileged targets refused explicitly.
--    Body is faithful to the 0147 revision-2 edition (caller authorization
--    decided before any target lookup — the anti-disclosure ordering) except
--    the added D4b branch, which sits with the other target checks so it is
--    likewise reachable only by authorized callers.
create or replace function recoveryos.grant_role_assignment(
  p_person_id bigint,
  p_role recoveryos.role_key,
  p_organization_id bigint default null,
  p_program_id bigint default null,
  p_residence_id bigint default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;

  -- Authority FIRST (no target information revealed to unauthorized callers):
  -- platform admin for anything; residence managers only for
  -- residence_staff/resident WITHIN their own residence.
  if not recoveryos.is_platform_admin() then
    if p_role in ('residence_staff','resident') and p_residence_id is not null
       and recoveryos.is_residence_manager_of(p_residence_id) then
      null; -- authorized within scope
    else
      return jsonb_build_object('ok', false, 'code', 'not_authorized');
    end if;
  end if;
  -- Privilege tier: only a system administrator creates system administrators.
  if p_role = 'system_administrator' and not recoveryos.has_role('system_administrator') then
    return jsonb_build_object('ok', false, 'code', 'privilege_tier',
      'message', 'Only a system administrator can grant that role.');
  end if;

  -- Target checks (authorized callers only from here down).
  if not exists (select 1 from recoveryos.people where id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'person_not_found');
  end if;

  -- P0-INV (0147): a privileged role never lands on a test-classified identity.
  if recoveryos.is_privileged_role(p_role) and recoveryos.is_test_fixture(p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'test_fixture_privilege_blocked',
      'message', 'Privileged roles cannot be granted to a test-classified identity.');
  end if;
  -- D4b (0151): nor on an UNCLASSIFIED identity — classify deliberately first.
  if recoveryos.is_privileged_role(p_role) and not recoveryos.is_production_person(p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'person_unclassified',
      'message', 'Privileged roles require an explicit production classification.');
  end if;

  -- Scope validation.
  if p_role in ('residence_staff','residence_manager','resident') and p_residence_id is null then
    return jsonb_build_object('ok', false, 'code', 'residence_scope_required');
  end if;
  if p_residence_id is not null
     and not exists (select 1 from recoveryos.residences where id = p_residence_id) then
    return jsonb_build_object('ok', false, 'code', 'residence_not_found');
  end if;

  if exists (select 1 from recoveryos.role_assignments
             where person_id = p_person_id and role_key = p_role
               and residence_id is not distinct from p_residence_id
               and program_id is not distinct from p_program_id
               and revoked_at is null) then
    return jsonb_build_object('ok', true, 'code', 'already_granted');
  end if;

  insert into recoveryos.role_assignments
    (person_id, role_key, organization_id, program_id, residence_id, granted_by_person_id)
  values (p_person_id, p_role, coalesce(p_organization_id, 1), p_program_id, p_residence_id, v_me)
  returning id into v_id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'role.granted', 'role_assignments', v_id,
          jsonb_build_object('person_id', p_person_id, 'role', p_role, 'residence_id', p_residence_id));

  return jsonb_build_object('ok', true, 'code', 'granted', 'assignment_id', v_id);
end $$;

-- 4) assign_lead: unclassified assignees refused explicitly.
--    Body is faithful to the 0149R edition except the added elsif branch.
create or replace function recoveryos.assign_lead(p_lead_id bigint, p_assignee_person_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_lead recoveryos.leads;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if not recoveryos.is_intake_coordinator() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select * into v_lead from recoveryos.leads where id = p_lead_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  -- R6 (0149R): a lead is never assigned to a test-classified identity.
  if recoveryos.is_test_fixture(p_assignee_person_id) then
    return jsonb_build_object('ok', false, 'code', 'assignee_test_fixture_blocked',
      'message', 'Inquiries cannot be assigned to a test-classified identity.');
  end if;
  -- D4b (0151): nor to an UNCLASSIFIED identity.
  if not recoveryos.is_production_person(p_assignee_person_id) then
    return jsonb_build_object('ok', false, 'code', 'assignee_unclassified',
      'message', 'Inquiries require an assignee with an explicit production classification.');
  end if;
  if not exists (select 1 from recoveryos.role_assignments ra
                 where ra.person_id = p_assignee_person_id and ra.revoked_at is null
                   and ra.role_key::text in ('intake_coordinator','intake_worker',
                                             'administrator','system_administrator')) then
    return jsonb_build_object('ok', false, 'code', 'assignee_not_intake_staff');
  end if;
  update recoveryos.leads
     set assigned_to_person_id = p_assignee_person_id,
         status = case when status = 'new' then 'assigned' else status end,
         -- response_due_at deliberately untouched (dormant; decision 3).
         updated_at = now()
   where id = p_lead_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'lead.assigned', 'leads', p_lead_id,
          jsonb_build_object('assignee_person_id', p_assignee_person_id));
  return jsonb_build_object('ok', true, 'code', 'assigned');
end $$;

commit;
notify pgrst, 'reload schema';
