-- 0148_classification_authorization_isolation.prepared.sql — P0 (SEC-P0-001, Gate G2)
--
-- STATUS: PREPARED ONLY. NOT APPLIED. Applying this file to CQCX
-- (cqcxvwoukyhxyokfwnjm) requires explicit, current apply authority under the
-- STOP/HOLD matrix. It is written against the live CQCX ledger tail
-- 0146_ejwrh_document_activation and validated on an isolated Postgres 16
-- replay of launch 0001–0146 + seed (see
-- docs/decisions/2026-09-14-p0-classification-authorization-isolation.md).
--
-- DEFECT (live-verified 2026-09-14, Control Tower baseline LIVE-DB-004/005/006;
-- reproduced structurally on the isolated replay): CQCX contains login-linked
-- person_classification = 'test_fixture' actors holding active privileged
-- role_assignments, while every privileged authorization predicate
-- (has_role → is_platform_admin / is_admin_staff / is_care_operations_staff /
-- is_support_staff / is_coach_staff / is_navigator_staff, plus the direct
-- role_assignments readers staff_residence_ids and is_residence_manager_of)
-- decides on roles alone. A test-classified login therefore satisfies
-- production privileged predicates.
--
-- INVARIANT ESTABLISHED (P0-INV):
--   1. A test_fixture-classified actor can never satisfy a privileged
--      authorization predicate. Privileged role keys are: coach, navigator,
--      residence_staff, residence_manager, program_manager, administrator,
--      executive, system_administrator. Baseline self-service keys
--      (participant, resident) are unchanged, so fixture participants keep
--      ordinary self-access and 0120 same_world participant semantics.
--   2. Staff notification fan-out (new lead, listing submission, application
--      intake) is delivered only to production-classified recipients.
--   3. grant_role_assignment refuses to grant a privileged role to a
--      test_fixture-classified person (code: test_fixture_privilege_blocked).
--
-- SUPERSESSION: the 0030 header note "fixture status is a METRICS/OPERATIONS
-- boundary, not a security boundary" is SUPERSEDED by the 2026-09-14 P0
-- determination. Classification is now part of the authorization boundary.
--
-- ACCEPTED CONSEQUENCE (fail-closed, documented for ratification): the
-- 0120 classification-symmetry capability of running staff-side E2E with
-- fixture STAFF actors becomes inoperative — a fixture coach/navigator no
-- longer satisfies is_support_staff(), so fixture-world staff journeys cannot
-- be exercised with fixture credentials until a world-scoped staff model is
-- separately designed, reviewed, and ratified. Fixture PARTICIPANT flows are
-- unaffected.
--
-- DELIBERATELY NOT DONE HERE: revoking the existing privileged
-- role_assignments held by fixture actors in CQCX (an identity/role data
-- change under a separate CLOSED gate). This migration makes those
-- assignments inert at every inspected predicate. See the approval packet
-- for the separately gated revocation statement.
--
-- ROLLBACK: 0148_classification_authorization_isolation.rollback.sql restores
-- the exact pre-0148 definitions (captured from the post-0146 replay catalog).
-- Rolling back restores the vulnerable behavior and needs the same authority.

begin;

-- ---------------------------------------------------------------------------
-- 1) Privileged-role vocabulary (pure; single source of truth for the guard)
-- ---------------------------------------------------------------------------
create or replace function recoveryos.is_privileged_role(target_role recoveryos.role_key)
returns boolean
language sql immutable as $$
  select target_role::text in (
    'coach', 'navigator', 'residence_staff', 'residence_manager',
    'program_manager', 'administrator', 'executive', 'system_administrator'
  );
$$;
revoke execute on function recoveryos.is_privileged_role(recoveryos.role_key) from public, anon;
grant execute on function recoveryos.is_privileged_role(recoveryos.role_key) to authenticated;
comment on function recoveryos.is_privileged_role(recoveryos.role_key) is
  'P0-INV (0148): role keys that a test_fixture-classified actor may never exercise. '
  'participant and resident stay non-privileged so fixture participants keep self-access.';

-- ---------------------------------------------------------------------------
-- 2) has_role — the root predicate gains the classification guard.
--    Every derived staff helper (is_platform_admin, is_admin_staff,
--    is_care_operations_staff, is_support_staff, is_coach_staff,
--    is_navigator_staff) and every policy calling has_role('<staff role>')
--    directly is closed in this one drift-free step (0117-sweep style).
-- ---------------------------------------------------------------------------
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
  'P0-INV (0148): privileged roles are never satisfied by a test_fixture-classified actor. '
  'Supersedes the 0030 note that classification is not a security boundary.';

-- ---------------------------------------------------------------------------
-- 3) staff_residence_ids — reads role_assignments directly (bypasses
--    has_role), so it carries its own guard. Fixture actors get no residence
--    staff scope anywhere this set is used (0009/0014/0015/0016 policies and
--    every later residence-domain policy).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4) is_residence_manager_of — same direct-read bypass, same guard (0115).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5) Notification fan-out — production events must not reach fixture staff.
--    Bodies are byte-faithful to the post-0146 catalog definitions except for
--    the added is_production_person(ra.person_id) recipient filter.
-- ---------------------------------------------------------------------------
create or replace function recoveryos.trg_lead_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare r record; v_name text;
begin
  begin
    v_name := coalesce(nullif(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')), ''), NEW.email, 'Someone');
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null and ra.role_key::text in ('administrator','coach','navigator')
        and recoveryos.is_production_person(ra.person_id)
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New website lead',
        v_name || ' reached out through the website.', '/admin/leads',
        'lead:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'lead_notify_failed', 'leads', NEW.id, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;

create or replace function recoveryos.trg_listing_submission_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare r record;
begin
  begin
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null
        and ra.role_key::text in ('administrator','system_administrator')
        and recoveryos.is_production_person(ra.person_id)
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New residence listing submission',
        coalesce(NEW.residence_name,'A residence') || ' asked to be listed in the directory.',
        '/admin/directory/submissions', 'listing:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'listing_notify_failed', 'residence_listing_submissions', NEW.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;

create or replace function recoveryos.trg_application_intake_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare r record; v_residence text;
begin
  begin
    select name into v_residence from recoveryos.residences where id = NEW.residence_id;
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null
        and (ra.residence_id = NEW.residence_id
             or ra.role_key::text in ('navigator','program_manager','administrator','system_administrator'))
        and recoveryos.is_production_person(ra.person_id)
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New housing application',
        'A new application came in for ' || coalesce(v_residence,'a residence') || '.',
        '/residences/applications/intake', 'appintake:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'application_intake_notify_failed', 'residence_application_intake', NEW.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;

-- ---------------------------------------------------------------------------
-- 6) grant_role_assignment — privileged roles can no longer be granted to a
--    test_fixture-classified person. Body is byte-faithful to the post-0146
--    catalog definition except for the added guard.
-- ---------------------------------------------------------------------------
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
  if not exists (select 1 from recoveryos.people where id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'person_not_found');
  end if;

  -- P0-INV (0148): a privileged role never lands on a test-classified identity.
  if recoveryos.is_privileged_role(p_role) and recoveryos.is_test_fixture(p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'test_fixture_privilege_blocked',
      'message', 'Privileged roles cannot be granted to a test-classified identity.');
  end if;

  -- Authority: platform admin for anything; residence managers only for
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

commit;
notify pgrst, 'reload schema';
