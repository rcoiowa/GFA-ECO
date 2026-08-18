-- 0117_access_governance.sql — P4G: access governance, privilege precision, evidence layer.
--
-- Corrections and capabilities:
--   1. THE is_admin_staff SWEEP (§6). Live audit found 19 policies + 9 functions
--      still deciding authority on recoveryos.is_admin_staff(), whose historic
--      definition (navigator|program_manager|administrator|system_administrator)
--      already caused over-reach in P4E. Resolution: the two uses whose
--      operational intent genuinely includes navigators/program managers
--      (assign_participant_coach, list_active_coaches) are recreated on a NEW
--      precisely-named helper, is_care_operations_staff(); then is_admin_staff()
--      itself is REDEFINED as a deprecated alias of is_platform_admin(). Every
--      remaining policy/function that referenced it (appointments, bookings,
--      reminders, backfill log, coaching relationships, conversation metadata,
--      follow-ups, pool visibility, person classification, meeting rooms,
--      resources, slogans, support-request events, complete_follow_up, the five
--      booking RPC fallbacks, provision_appointment_meeting) is thereby
--      tightened to platform administrators in one drift-free step. No security
--      decision depends on the misleading name anymore; new code must never use
--      it (preflight-guarded).
--   2. staff_preauthorizations (§3–5, §11–12): the FOR ALL is_admin_staff
--      policy is replaced — reads are platform-admin, writes are RPC-only with
--      privilege tiers (system_administrator invitations require a system
--      administrator). The table gains purpose ('staff' | 'operator'),
--      organization/residence SCOPE, expiry, revocation, and creator. The
--      signup trigger now consumes only 'staff'-purpose invitations, grants
--      roles WITH their intended scope (a Grace House staff invite yields a
--      Grace-House-scoped role, never a global one), and skips operator
--      invitations entirely — those are consumed by residence provisioning,
--      resolving the P4F semantic collision. The one-email-forever UNIQUE
--      becomes one OPEN invitation per email (revoke → reinvite works).
--   3. Role governance (§8–10): grant/revoke RPCs over the scoped
--      role_assignments model — grantor pinned, scopes validated, duplicates
--      idempotent, history preserved via revoked_at, audit rows, no
--      self-escalation, system_administrator tier gated, and a last-admin
--      lockout guard.
--   4. Residence-referral triage (§13): the P4F residual whole-row UPDATE is
--      replaced by triage_residence_referral (legal transitions, handler
--      pinned). Identity linkage stays human-deliberate.
--   5. Evidence layer (§25–31): admin_operations_summary (platform admin),
--      admin_evidence_summary (platform admin + executive, aggregate-only),
--      admin_list_people (identity/access, never narrative) — aggregation in
--      PostgreSQL, fixture-aware, denominators explicit, no TTMHC.
--   6. Audit viewer (§23): audit_log read opens to platform admins (was
--      system_administrator-only; still append-only, no client writes).

-- ---------------------------------------------------------------------------
-- 1) Precise helpers + the sweep
-- ---------------------------------------------------------------------------
-- Care-operations staff: may orchestrate assignments across the support system
-- (the ONLY intent for which the old broad helper was legitimate).
create or replace function recoveryos.is_care_operations_staff()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('navigator') or recoveryos.has_role('program_manager')
      or recoveryos.is_platform_admin();
$$;
revoke execute on function recoveryos.is_care_operations_staff() from public, anon;
grant execute on function recoveryos.is_care_operations_staff() to authenticated;

create or replace function recoveryos.assign_participant_coach(
  p_participant_person_id bigint, p_coach_person_id bigint, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_is_ops boolean := recoveryos.is_care_operations_staff();
  v_cur recoveryos.coaching_relationships%rowtype;
  v_had_active boolean := false;
  v_source text;
  v_new_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not (v_is_ops or (recoveryos.has_role('coach') and p_coach_person_id = v_me)) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Assigning another coach requires a navigator or admin.');
  end if;
  if not exists (select 1 from recoveryos.role_assignments
                 where person_id = p_coach_person_id and revoked_at is null
                   and role_key in ('coach','navigator')) then
    return jsonb_build_object('ok', false, 'code', 'not_a_coach', 'message', 'That person is not a coach.');
  end if;

  select * into v_cur from recoveryos.coaching_relationships
    where participant_person_id = p_participant_person_id and status='active' and is_primary
    for update;
  if found then
    v_had_active := true;
    if v_cur.coach_person_id = p_coach_person_id then
      return jsonb_build_object('ok', true, 'code', 'already_assigned', 'message', 'They are already connected.');
    end if;
    if not v_is_ops then
      return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
        'message', 'They are already connected with another coach.');
    end if;
    update recoveryos.coaching_relationships
      set status = 'transferred', ended_at = current_date, end_reason = coalesce(p_reason,'transferred'), updated_at = now()
      where id = v_cur.id;
  end if;

  v_source := case when v_is_ops and p_coach_person_id <> v_me then 'admin_assign'
                   when v_had_active then 'admin_assign' else 'self_claim' end;
  begin
    insert into recoveryos.coaching_relationships
      (participant_person_id, coach_person_id, organization_id, started_at,
       status, relationship_type, is_primary, assigned_by_person_id, assignment_source)
    values (p_participant_person_id, p_coach_person_id, 1, current_date,
            'active','coach', true, v_me, v_source)
    returning id into v_new_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'conflict',
      'message', 'They were just assigned — refresh to see who is with them.');
  end;

  return jsonb_build_object('ok', true, 'code', 'assigned', 'relationship_id', v_new_id, 'message', 'They''re connected.');
end $$;

create or replace function recoveryos.list_active_coaches()
returns table (coach_person_id bigint, coach_name text) language sql security definer
set search_path = recoveryos, public stable as $$
  select distinct p.id, (p.first_name || ' ' || p.last_name)
  from recoveryos.people p
  join recoveryos.role_assignments ra on ra.person_id = p.id and ra.revoked_at is null
   and ra.role_key in ('coach','navigator')
  where recoveryos.is_care_operations_staff()
    and recoveryos.is_production_person(p.id)
  order by 2;
$$;

-- DEPRECATED ALIAS. is_admin_staff historically meant navigator|program_manager|
-- administrator|system_administrator and was used as if it meant "platform
-- admin" in ~28 places. It now IS the platform-admin predicate, which tightens
-- every remaining caller in one drift-free step. Do not use in new code — use
-- is_platform_admin() / is_care_operations_staff() / scoped helpers. The
-- preflight enforces this equivalence permanently.
create or replace function recoveryos.is_admin_staff()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.is_platform_admin();
$$;

-- ---------------------------------------------------------------------------
-- 2) staff_preauthorizations — scope, purpose, lifecycle, RPC-only writes
-- ---------------------------------------------------------------------------
alter table recoveryos.staff_preauthorizations
  add column if not exists purpose text not null default 'staff'
    check (purpose in ('staff','operator')),
  add column if not exists organization_id bigint references recoveryos.organizations(id),
  add column if not exists residence_id bigint references recoveryos.residences(id),
  add column if not exists expires_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists created_by_person_id bigint references recoveryos.people(id);

-- One OPEN invitation per email (was one-email-forever, which broke reinvites).
alter table recoveryos.staff_preauthorizations
  drop constraint if exists staff_preauthorizations_email_key;
create unique index if not exists staff_preauth_open_email_uidx
  on recoveryos.staff_preauthorizations (lower(email))
  where consumed_at is null and revoked_at is null;

drop policy if exists staff_preauth_admin on recoveryos.staff_preauthorizations;
create policy staff_preauth_platform_select on recoveryos.staff_preauthorizations
  for select to authenticated using (recoveryos.is_platform_admin());
-- Writes are RPC-only.

create or replace function recoveryos.create_staff_invitation(
  p_email text,
  p_role_keys recoveryos.role_key[],
  p_purpose text default 'staff',
  p_residence_id bigint default null,
  p_organization_id bigint default null,
  p_expires_days int default 30,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Invitations are created by platform administrators.');
  end if;
  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_email');
  end if;
  if p_purpose not in ('staff','operator') then
    return jsonb_build_object('ok', false, 'code', 'invalid_purpose');
  end if;
  if p_role_keys is null or array_length(p_role_keys, 1) is null then
    return jsonb_build_object('ok', false, 'code', 'roles_required');
  end if;
  -- Privilege tiers (§4): only a system administrator may invite one.
  if 'system_administrator' = any(p_role_keys)
     and not recoveryos.has_role('system_administrator') then
    return jsonb_build_object('ok', false, 'code', 'privilege_tier',
      'message', 'Only a system administrator can invite a system administrator.');
  end if;
  if p_purpose = 'operator' then
    -- Operator invitations carry exactly the future capability; scope comes
    -- into existence when THEY provision their residence.
    if p_role_keys <> array['residence_manager']::recoveryos.role_key[] or p_residence_id is not null then
      return jsonb_build_object('ok', false, 'code', 'invalid_operator_invitation',
        'message', 'An operator invitation is residence_manager with no pre-existing residence.');
    end if;
  else
    -- Residence-scoped staff roles must name their residence (§12).
    if (p_role_keys && array['residence_staff','residence_manager','resident']::recoveryos.role_key[])
       and p_residence_id is null then
      return jsonb_build_object('ok', false, 'code', 'residence_scope_required',
        'message', 'Residence roles need the residence they apply to.');
    end if;
    if p_residence_id is not null
       and not exists (select 1 from recoveryos.residences where id = p_residence_id) then
      return jsonb_build_object('ok', false, 'code', 'residence_not_found');
    end if;
  end if;

  begin
    insert into recoveryos.staff_preauthorizations
      (email, role_keys, purpose, organization_id, residence_id, expires_at, note, created_by_person_id)
    values (v_email, p_role_keys, p_purpose, p_organization_id, p_residence_id,
            now() + make_interval(days => greatest(coalesce(p_expires_days, 30), 1)),
            nullif(trim(coalesce(p_note,'')), ''), v_me)
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'invitation_exists',
      'message', 'There is already an open invitation for that email.');
  end;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'invitation.created', 'staff_preauthorizations', v_id,
          jsonb_build_object('purpose', p_purpose, 'role_keys', p_role_keys,
                             'residence_id', p_residence_id));

  return jsonb_build_object('ok', true, 'code', 'created', 'invitation_id', v_id);
end $$;

create or replace function recoveryos.revoke_staff_invitation(p_invitation_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_pre recoveryos.staff_preauthorizations%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select * into v_pre from recoveryos.staff_preauthorizations where id = p_invitation_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_pre.consumed_at is not null then
    return jsonb_build_object('ok', false, 'code', 'already_consumed',
      'message', 'A consumed invitation is history — revoke the granted role instead.');
  end if;
  if v_pre.revoked_at is not null then
    return jsonb_build_object('ok', true, 'code', 'already_revoked');
  end if;
  update recoveryos.staff_preauthorizations set revoked_at = now() where id = p_invitation_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'invitation.revoked', 'staff_preauthorizations', p_invitation_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'revoked');
end $$;

-- Signup trigger v2: staff-purpose only, scope-aware, expiry/revocation-aware.
create or replace function recoveryos.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_person bigint;
  v_pre recoveryos.staff_preauthorizations%rowtype;
  v_role recoveryos.role_key;
  v_first text;
begin
  begin
    v_first := coalesce(nullif(split_part(coalesce(NEW.email,''), '@', 1), ''), 'New');
    insert into recoveryos.people (auth_user_id, first_name, last_name)
    values (NEW.id, initcap(v_first), '')
    on conflict (auth_user_id) do nothing
    returning id into v_person;
    if v_person is null then
      select id into v_person from recoveryos.people where auth_user_id = NEW.id;
    end if;
    insert into recoveryos.person_classification (person_id, classification)
    values (v_person, 'production') on conflict (person_id) do nothing;
    insert into recoveryos.role_assignments (person_id, role_key, organization_id)
    select v_person, 'participant', 1
    where not exists (select 1 from recoveryos.role_assignments
                      where person_id = v_person and role_key = 'participant' and revoked_at is null);
    -- Deliberate STAFF grant, consumed once, WITH its intended scope. Operator
    -- invitations are deliberately skipped: they are consumed later by
    -- create_residence_for_current_user, once the operator's residence exists.
    select * into v_pre from recoveryos.staff_preauthorizations
      where lower(email) = lower(coalesce(NEW.email,''))
        and consumed_at is null and revoked_at is null
        and (expires_at is null or expires_at > now())
        and purpose = 'staff'
      for update;
    if found then
      foreach v_role in array v_pre.role_keys loop
        insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id)
        select v_person, v_role, coalesce(v_pre.organization_id, 1), v_pre.residence_id
        where not exists (select 1 from recoveryos.role_assignments
                          where person_id = v_person and role_key = v_role
                            and residence_id is not distinct from v_pre.residence_id
                            and revoked_at is null);
      end loop;
      update recoveryos.staff_preauthorizations
        set consumed_at = now(), consumed_person_id = v_person where id = v_pre.id;
      insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
      values (v_person, 'invitation.consumed', 'staff_preauthorizations', v_pre.id,
              jsonb_build_object('role_keys', v_pre.role_keys, 'residence_id', v_pre.residence_id));
    end if;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'auth_provision_failed', 'auth.users', null, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Operator provisioning: purpose-aware, expiry/revocation-aware
-- ---------------------------------------------------------------------------
create or replace function recoveryos.create_residence_for_current_user(
  p_org_name text,
  p_org_structure text,
  p_org_phone text,
  p_org_email text,
  p_residence_name text,
  p_population_served text,
  p_capacity int,
  p_weekly_fee numeric,
  p_level_of_support text,
  p_city text,
  p_state text,
  p_commitments text[],
  p_curfew_weeknight text
) returns recoveryos.residences
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  me recoveryos.people;
  v_email text;
  v_pre recoveryos.staff_preauthorizations%rowtype;
  v_authorized_by text;
  org_id bigint;
  result recoveryos.residences;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select * into me from recoveryos.people where auth_user_id = auth.uid();
  if not found then
    raise exception 'No person record — complete onboarding first';
  end if;

  if recoveryos.is_platform_admin() then
    v_authorized_by := 'platform_admin';
  else
    select lower(email) into v_email from auth.users where id = auth.uid();
    select * into v_pre from recoveryos.staff_preauthorizations
      where lower(email) = v_email
        and purpose = 'operator'
        and 'residence_manager' = any(role_keys)
        and consumed_at is null and revoked_at is null
        and (expires_at is null or expires_at > now())
      limit 1;
    if not found then
      raise exception 'Residence creation requires an operator invitation. Contact Grace For Addictions to become an operator.';
    end if;
    update recoveryos.staff_preauthorizations
      set consumed_at = now(), consumed_person_id = me.id
      where id = v_pre.id;
    v_authorized_by := 'operator_preauthorization';
  end if;

  if coalesce(trim(p_org_name), '') = '' or coalesce(trim(p_residence_name), '') = '' then
    raise exception 'Organization and residence names are required';
  end if;

  insert into recoveryos.organizations (name, organization_type, structure)
  values (trim(p_org_name), 'recovery_residence_operator', p_org_structure)
  returning id into org_id;

  insert into recoveryos.residences (
    organization_id, name, address_city, address_state, capacity,
    population_served, shared_room_fee_weekly, level_of_support,
    commitments, curfew_weeknight, phone, email
  ) values (
    org_id, trim(p_residence_name), nullif(trim(p_city), ''), nullif(trim(p_state), ''),
    p_capacity, nullif(trim(p_population_served), ''), p_weekly_fee,
    p_level_of_support, coalesce(p_commitments, '{}'), nullif(trim(p_curfew_weeknight), ''),
    nullif(trim(p_org_phone), ''), nullif(trim(p_org_email), '')
  ) returning * into result;

  insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id, granted_by_person_id)
  values (me.id, 'residence_manager', org_id, result.id, me.id);

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (me.id, 'residence.operator_provisioned', 'residences', result.id,
          jsonb_build_object('authorized_by', v_authorized_by));

  return result;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Role governance (§8–10)
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

create or replace function recoveryos.revoke_role_assignment(p_assignment_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_row recoveryos.role_assignments%rowtype;
  v_remaining int;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_row from recoveryos.role_assignments where id = p_assignment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  if not recoveryos.is_platform_admin() then
    if v_row.role_key in ('residence_staff','resident') and v_row.residence_id is not null
       and recoveryos.is_residence_manager_of(v_row.residence_id) then
      null;
    else
      return jsonb_build_object('ok', false, 'code', 'not_authorized');
    end if;
  end if;
  if v_row.role_key = 'system_administrator' and not recoveryos.has_role('system_administrator') then
    return jsonb_build_object('ok', false, 'code', 'privilege_tier');
  end if;
  if v_row.revoked_at is not null then
    return jsonb_build_object('ok', true, 'code', 'already_revoked');
  end if;

  -- Lockout protection (§10): never revoke the last effective platform admin.
  if v_row.role_key in ('administrator','system_administrator') then
    select count(*) into v_remaining from recoveryos.role_assignments
      where role_key in ('administrator','system_administrator')
        and revoked_at is null and id <> p_assignment_id;
    if v_remaining = 0 then
      return jsonb_build_object('ok', false, 'code', 'last_admin',
        'message', 'This is the last platform administrator — provision another before revoking.');
    end if;
  end if;

  update recoveryos.role_assignments set revoked_at = now() where id = p_assignment_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'role.revoked', 'role_assignments', p_assignment_id,
          jsonb_build_object('person_id', v_row.person_id, 'role', v_row.role_key,
                             'residence_id', v_row.residence_id));
  return jsonb_build_object('ok', true, 'code', 'revoked');
end $$;

-- ---------------------------------------------------------------------------
-- 5) Residence-referral triage (§13) — closes the P4F residual
-- ---------------------------------------------------------------------------
drop policy if exists referrals_staff_update on recoveryos.referrals;

create or replace function recoveryos.triage_residence_referral(
  p_referral_id bigint, p_status text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_ref recoveryos.referrals%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('contacted','converted','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_ref from recoveryos.referrals where id = p_referral_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_ref.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_ref.status = p_status then return jsonb_build_object('ok', true, 'code', 'already_set'); end if;
  if v_ref.status in ('converted','closed') then
    return jsonb_build_object('ok', false, 'code', 'already_settled');
  end if;
  update recoveryos.referrals
     set status = p_status,
         handled_by_person_id = v_me,
         handled_at = coalesce(handled_at, now())
   where id = p_referral_id;
  return jsonb_build_object('ok', true, 'code', p_status);
end $$;

-- ---------------------------------------------------------------------------
-- 6) Audit viewer read (§23) — platform admins; still append-only
-- ---------------------------------------------------------------------------
drop policy if exists audit_log_no_direct_read on recoveryos.audit_log;
create policy audit_log_platform_admin_select on recoveryos.audit_log
  for select to authenticated using (recoveryos.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 7) Evidence layer (§25–31) — aggregation in PostgreSQL, denominators explicit
-- ---------------------------------------------------------------------------
create or replace function recoveryos.admin_operations_summary()
returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not recoveryos.is_platform_admin()
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true,
      'open_support_requests', (select count(*) from recoveryos.support_requests s
          where s.status in ('submitted','open') and s.claimed_by_person_id is null
            and recoveryos.is_production_person(s.person_id)),
      'oldest_open_request_hours', (select coalesce(round(extract(epoch from (now() - min(s.created_at))) / 3600), 0)
          from recoveryos.support_requests s
          where s.status in ('submitted','open') and s.claimed_by_person_id is null
            and recoveryos.is_production_person(s.person_id)),
      'open_navigation_requests', (select count(*) from recoveryos.support_requests s
          where s.status in ('submitted','open') and s.claimed_by_person_id is null
            and s.request_type in ('navigation','needs_assessment')
            and recoveryos.is_production_person(s.person_id)),
      'overdue_follow_ups', (select count(*) from recoveryos.follow_ups f
          where f.status = 'open' and f.due_at < now()
            and recoveryos.is_production_person(f.person_id)),
      'sessions_today', (select count(*) from recoveryos.appointments a
          where a.status in ('confirmed','scheduled')
            and (a.starts_at at time zone coalesce(a.timezone,'America/Chicago'))::date
                = (now() at time zone 'America/Chicago')::date
            and recoveryos.is_production_person(a.person_id)),
      'open_referral_loops', (select count(*) from recoveryos.navigation_referrals r
          where r.status in ('initiated','contact_attempted','not_connected')
            and recoveryos.is_production_person(r.person_id)),
      'unresolved_needs', (select count(*) from recoveryos.navigation_needs n
          where n.status in ('identified','in_progress','unresolved')
            and recoveryos.is_production_person(n.person_id)),
      'residence_applications_waiting', (select count(*) from recoveryos.residence_applications a
          where a.status in ('submitted','in_review')
            and recoveryos.is_production_person(a.person_id)),
      'active_residencies', (select count(*) from recoveryos.residencies r
          where r.residency_status in ('active','on_pass','transitioning')
            and recoveryos.is_production_person(r.person_id)),
      'unreviewed_incidents', (select count(*) from recoveryos.incidents i where i.reviewed_at is null),
      'pending_invitations', (select count(*) from recoveryos.staff_preauthorizations p
          where p.consumed_at is null and p.revoked_at is null
            and (p.expires_at is null or p.expires_at > now())))
  end;
$$;
revoke execute on function recoveryos.admin_operations_summary() from public, anon;
grant execute on function recoveryos.admin_operations_summary() to authenticated;

create or replace function recoveryos.admin_evidence_summary()
returns jsonb language sql stable security definer set search_path = recoveryos, public as $$
  select case when not (recoveryos.is_platform_admin() or recoveryos.has_role('executive'))
    then jsonb_build_object('ok', false, 'code', 'not_authorized')
    else jsonb_build_object('ok', true,
      'funnel', (select jsonb_build_object(
        'requests', count(*),
        'claimed', count(*) filter (where s.claimed_at is not null),
        'still_waiting', count(*) filter (where s.status in ('submitted','open') and s.claimed_by_person_id is null),
        'median_minutes_to_claim', round(coalesce((percentile_cont(0.5) within group
            (order by extract(epoch from (s.claimed_at - s.created_at)) / 60)
            filter (where s.claimed_at is not null))::numeric, 0)),
        'p90_minutes_to_claim', round(coalesce((percentile_cont(0.9) within group
            (order by extract(epoch from (s.claimed_at - s.created_at)) / 60)
            filter (where s.claimed_at is not null))::numeric, 0)))
        from recoveryos.support_requests s where recoveryos.is_production_person(s.person_id)),
      'relationships', (select jsonb_build_object(
        'coaching_established', count(*) filter (where true),
        'coaching_active', count(*) filter (where cr.status = 'active'),
        'responded_t1', count(*) filter (where exists (
            select 1 from recoveryos.conversations c
            join recoveryos.messages m on m.conversation_id = c.id
            where c.coaching_relationship_id = cr.id and m.sender_person_id = c.coach_person_id)),
        'two_way_t4a', count(*) filter (where exists (
            select 1 from recoveryos.conversations c
            join recoveryos.messages m on m.conversation_id = c.id
            where c.coaching_relationship_id = cr.id and m.sender_person_id = c.coach_person_id)
          and exists (
            select 1 from recoveryos.conversations c
            join recoveryos.messages m on m.conversation_id = c.id
            where c.coaching_relationship_id = cr.id and m.sender_person_id = c.participant_person_id)))
        from recoveryos.coaching_relationships cr
        where recoveryos.is_production_person(cr.participant_person_id)),
      'navigation', (select jsonb_build_object(
        'needs', (select count(*) from recoveryos.navigation_needs n where recoveryos.is_production_person(n.person_id)),
        'needs_by_category', (select coalesce(jsonb_object_agg(need_category, cnt), '{}'::jsonb)
          from (select need_category, count(*) as cnt from recoveryos.navigation_needs n
                where recoveryos.is_production_person(n.person_id) group by 1) x),
        'needs_resolved', (select count(*) from recoveryos.navigation_needs n
          where n.status = 'resolved' and recoveryos.is_production_person(n.person_id)),
        'needs_partially_resolved', (select count(*) from recoveryos.navigation_needs n
          where n.status = 'partially_resolved' and recoveryos.is_production_person(n.person_id)),
        'needs_unresolved', (select count(*) from recoveryos.navigation_needs n
          where n.status = 'unresolved' and recoveryos.is_production_person(n.person_id)),
        'referrals', (select count(*) from recoveryos.navigation_referrals r where recoveryos.is_production_person(r.person_id)),
        'warm_handoffs', (select count(*) from recoveryos.navigation_referrals r
          where r.referral_type = 'warm_handoff' and recoveryos.is_production_person(r.person_id)),
        'connected', (select count(*) from recoveryos.navigation_referrals r
          where r.status = 'connected' and recoveryos.is_production_person(r.person_id)),
        'participant_declined', (select count(*) from recoveryos.navigation_referrals r
          where r.status = 'participant_declined' and recoveryos.is_production_person(r.person_id)),
        'partner_unavailable', (select count(*) from recoveryos.navigation_referrals r
          where r.status = 'partner_unavailable' and recoveryos.is_production_person(r.person_id)))),
      'residence', (select jsonb_build_object(
        'applications', (select count(*) from recoveryos.residence_applications a where recoveryos.is_production_person(a.person_id)),
        'decisions', (select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb)
          from (select status, count(*) as cnt from recoveryos.residence_applications a
                where recoveryos.is_production_person(a.person_id) group by 1) x),
        'active_residencies', (select count(*) from recoveryos.residencies r
          where r.residency_status in ('active','on_pass','transitioning')
            and recoveryos.is_production_person(r.person_id)),
        'capacity', (select coalesce(sum(capacity), 0) from recoveryos.residences),
        'median_length_of_stay_days', (select round(coalesce((percentile_cont(0.5) within group
            (order by (r.discharge_date - r.admission_date)))::numeric, 0))
          from recoveryos.residencies r
          where r.discharge_date is not null and r.admission_date is not null
            and recoveryos.is_production_person(r.person_id)))),
      'services', (select jsonb_build_object(
        'people_served', (select count(distinct e.person_id) from recoveryos.service_events e
          where recoveryos.is_production_person(e.person_id)),
        'events', (select count(*) from recoveryos.service_events e where recoveryos.is_production_person(e.person_id)),
        'by_type', (select coalesce(jsonb_object_agg(t.name, x.cnt), '{}'::jsonb)
          from (select service_type_id, count(*) as cnt from recoveryos.service_events e
                where recoveryos.is_production_person(e.person_id) group by 1) x
          join recoveryos.service_types t on t.id = x.service_type_id),
        'funding_attributed', (select count(*) from recoveryos.service_events e
          where e.funding_source_id is not null and recoveryos.is_production_person(e.person_id)),
        'funding_unattributed', (select count(*) from recoveryos.service_events e
          where e.funding_source_id is null and recoveryos.is_production_person(e.person_id)))))
  end;
$$;
revoke execute on function recoveryos.admin_evidence_summary() from public, anon;
grant execute on function recoveryos.admin_evidence_summary() to authenticated;

-- Identity & access (never narrative): the /admin/people read.
create or replace function recoveryos.admin_list_people()
returns table (
  person_id bigint,
  display_name text,
  classification text,
  roles jsonb,
  has_active_coaching boolean,
  has_active_navigation boolean,
  has_active_residency boolean
) language sql stable security definer set search_path = recoveryos, public as $$
  select p.id,
    coalesce(nullif(trim(p.preferred_name), ''), trim(p.first_name || ' ' || coalesce(p.last_name,''))),
    coalesce(pc.classification::text, 'production'),
    coalesce((select jsonb_agg(jsonb_build_object('assignment_id', ra.id, 'role', ra.role_key,
                                                  'residence_id', ra.residence_id))
              from recoveryos.role_assignments ra
              where ra.person_id = p.id and ra.revoked_at is null), '[]'::jsonb),
    exists (select 1 from recoveryos.coaching_relationships cr
            where cr.participant_person_id = p.id and cr.status = 'active'),
    exists (select 1 from recoveryos.navigation_relationships nr
            where nr.participant_person_id = p.id and nr.status = 'active'),
    exists (select 1 from recoveryos.residencies r
            where r.person_id = p.id and r.residency_status in ('active','on_pass','transitioning'))
  from recoveryos.people p
  left join recoveryos.person_classification pc on pc.person_id = p.id
  where recoveryos.is_platform_admin()
  order by 2;
$$;
revoke execute on function recoveryos.admin_list_people() from public, anon;
grant execute on function recoveryos.admin_list_people() to authenticated;

-- ---------------------------------------------------------------------------
-- 8) Grants
-- ---------------------------------------------------------------------------
revoke execute on function
  recoveryos.create_staff_invitation(text, recoveryos.role_key[], text, bigint, bigint, int, text),
  recoveryos.revoke_staff_invitation(bigint),
  recoveryos.grant_role_assignment(bigint, recoveryos.role_key, bigint, bigint, bigint),
  recoveryos.revoke_role_assignment(bigint),
  recoveryos.triage_residence_referral(bigint, text)
from public, anon;
grant execute on function
  recoveryos.create_staff_invitation(text, recoveryos.role_key[], text, bigint, bigint, int, text),
  recoveryos.revoke_staff_invitation(bigint),
  recoveryos.grant_role_assignment(bigint, recoveryos.role_key, bigint, bigint, bigint),
  recoveryos.revoke_role_assignment(bigint),
  recoveryos.triage_residence_referral(bigint, text)
to authenticated;

notify pgrst, 'reload schema';
