-- 0151_strict_classification_semantics.rollback.sql — exact rollback to the
-- post-0149R lenient definitions ("missing classification = production").
-- WARNING: rolling back restores FAIL-OPEN semantics for unclassified logins
-- on every privileged path. Same authority as the apply; record the reason.

begin;

-- 0030 edition (lenient).
create or replace function recoveryos.is_production_person(p_person_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select not recoveryos.is_test_fixture(p_person_id);
$$;
comment on function recoveryos.is_production_person(bigint) is null;

-- 0149R edition.
create or replace function recoveryos.is_production_actor()
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select not recoveryos.is_test_fixture(recoveryos.current_person_id());
$$;
comment on function recoveryos.is_production_actor() is
  'Canonical boundary (0149R): true when the current person is not test_fixture-classified. '
  'Use this in any authorization arm that does not already flow through has_role().';

-- 0147 editions.
create or replace function recoveryos.has_role(target_role recoveryos.role_key)
returns boolean
language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from role_assignments ra
    where ra.person_id = current_person_id()
      and ra.role_key = target_role
      and ra.revoked_at is null
  )
  and not (
    recoveryos.is_privileged_role(target_role)
    and recoveryos.is_test_fixture(recoveryos.current_person_id())
  );
$$;
comment on function recoveryos.has_role(recoveryos.role_key) is
  'P0-INV (0147): privileged roles are never satisfied by a test_fixture-classified actor. '
  'Supersedes the 0030 note that classification is not a security boundary.';

create or replace function recoveryos.staff_residence_ids()
returns setof bigint
language sql stable security definer set search_path = recoveryos, public as $$
  select ra.residence_id from role_assignments ra
  where ra.person_id = current_person_id()
    and ra.role_key in ('residence_staff', 'residence_manager')
    and ra.residence_id is not null
    and ra.revoked_at is null
    and not recoveryos.is_test_fixture(recoveryos.current_person_id());
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
  and not recoveryos.is_test_fixture(recoveryos.current_person_id());
$$;

-- grant_role_assignment: 0147 revision-2 edition (fixture guard only, caller
-- authorization decided before any target lookup).
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

-- assign_lead: 0149R edition (fixture guard only).
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
  -- R6: a lead (production PII) is never assigned to a test-classified identity.
  if recoveryos.is_test_fixture(p_assignee_person_id) then
    return jsonb_build_object('ok', false, 'code', 'assignee_test_fixture_blocked',
      'message', 'Inquiries cannot be assigned to a test-classified identity.');
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
