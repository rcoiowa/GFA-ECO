-- 0115_residence_hardening.sql — P4F: residence security hardening + support integration.
--
-- Audit findings this migration corrects (classification in the P4F report §A/F):
--   1. OPERATOR SELF-PROVISIONING (launch-blocking): create_residence_for_current_user
--      let ANY authenticated person create an organization + residence and grant
--      themselves residence_manager. Now requires platform admin OR a deliberate
--      operator preauthorization (staff_preauthorizations invitation) — the
--      white-label capability survives, its public exposure does not.
--   2. HIGH-IMPACT TRANSITIONS were generic table writes: staff UPDATE any field
--      of residence_applications (including decided_by), INSERT/UPDATE residencies
--      arbitrarily, FOR ALL on bed_assignments/passes/screenings/incidents.
--      Decisions become narrow RPCs with server-derived actors and legal
--      transitions; the generic write policies are dropped.
--   3. SCREENINGS/INCIDENTS become append-only records with pinned author
--      identity (corrections are new rows / reviewed amendments, never silent
--      rewrites). Coach/Navigator get no access (they never had SELECT — kept).
--   4. GRIEVANCES: every residence staff member could read every grievance and
--      nobody could resolve one. Read narrows to filer + residence manager +
--      platform admin; resolution is a manager RPC that a filer can never
--      perform on their own grievance.
--   5. RESIDENCE SUPPORT SEAM: intentional designation (support_team_memberships,
--      member_role 'residence_support') — never the whole employee roster —
--      surfaces in My Support as the third context and backs messaging
--      context='residence'. Discharge ends it; Coach/Navigator stay untouched.
--   6. RESIDENCE SERVICE ATTESTATION: explicit RPC with full residence
--      attribution (delivery_context='recovery_residence' CHECK satisfied);
--      operations/compliance rows never auto-create service events.

-- ---------------------------------------------------------------------------
-- 0) Helpers
-- ---------------------------------------------------------------------------
create or replace function recoveryos.is_residence_manager_of(p_residence_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select exists (
    select 1 from recoveryos.role_assignments ra
    where ra.person_id = recoveryos.current_person_id()
      and ra.role_key = 'residence_manager'
      and ra.residence_id = p_residence_id
      and ra.revoked_at is null);
$$;
revoke execute on function recoveryos.is_residence_manager_of(bigint) from public, anon;
grant execute on function recoveryos.is_residence_manager_of(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 1) Operator self-provisioning gate (§4) — capability preserved, exposure gated
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

  -- Launch posture: platform admin, or a deliberate operator invitation
  -- (an unconsumed preauthorization carrying residence_manager for this email).
  if recoveryos.is_platform_admin() then
    v_authorized_by := 'platform_admin';
  else
    select lower(email) into v_email from auth.users where id = auth.uid();
    select * into v_pre from recoveryos.staff_preauthorizations
      where lower(email) = v_email
        and 'residence_manager' = any(role_keys)
        and consumed_at is null
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
-- 2) Application lifecycle (§6–7) — decisions are RPC-only, actors derived
-- ---------------------------------------------------------------------------
drop policy if exists residence_applications_staff_write on recoveryos.residence_applications;

create or replace function recoveryos.review_residence_application(
  p_application_id bigint, p_decision text, p_note text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_decision not in ('in_review','approved','waitlisted','declined') then
    return jsonb_build_object('ok', false, 'code', 'invalid_decision');
  end if;
  select * into v_app from recoveryos.residence_applications where id = p_application_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  -- Marking in-review: any staff of the residence. Terminal decisions:
  -- residence MANAGER of that residence (or platform admin).
  if p_decision = 'in_review' then
    if v_app.residence_id not in (select recoveryos.staff_residence_ids())
       and not recoveryos.is_platform_admin() then
      return jsonb_build_object('ok', false, 'code', 'not_authorized');
    end if;
  else
    if not recoveryos.is_residence_manager_of(v_app.residence_id)
       and not recoveryos.is_platform_admin() then
      return jsonb_build_object('ok', false, 'code', 'not_authorized',
        'message', 'Application decisions are made by the residence manager.');
    end if;
  end if;

  -- Legal transitions only; terminal states are immutable here.
  if v_app.status in ('approved','declined','withdrawn') then
    if v_app.status = p_decision then
      return jsonb_build_object('ok', true, 'code', 'already_set');
    end if;
    return jsonb_build_object('ok', false, 'code', 'already_decided');
  end if;
  if v_app.status = p_decision then
    return jsonb_build_object('ok', true, 'code', 'already_set');
  end if;

  update recoveryos.residence_applications
     set status = p_decision,
         decided_at = case when p_decision in ('approved','waitlisted','declined') then now() else decided_at end,
         decided_by_person_id = case when p_decision in ('approved','waitlisted','declined') then v_me else decided_by_person_id end,
         notes = coalesce(nullif(trim(coalesce(p_note,'')), ''), notes)
   where id = p_application_id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'residence_application.' || p_decision, 'residence_applications', p_application_id, '{}'::jsonb);

  return jsonb_build_object('ok', true, 'code', p_decision);
end $$;

create or replace function recoveryos.withdraw_my_application(p_application_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_app from recoveryos.residence_applications where id = p_application_id for update;
  if not found or v_app.person_id <> v_me then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_app.status = 'withdrawn' then return jsonb_build_object('ok', true, 'code', 'already_withdrawn'); end if;
  if v_app.status not in ('submitted','in_review','waitlisted') then
    return jsonb_build_object('ok', false, 'code', 'not_withdrawable');
  end if;
  update recoveryos.residence_applications set status = 'withdrawn' where id = p_application_id;
  return jsonb_build_object('ok', true, 'code', 'withdrawn');
end $$;

-- ---------------------------------------------------------------------------
-- 3) Admission / beds / discharge (§9–11, §34) — transactional, race-guarded
-- ---------------------------------------------------------------------------
drop policy if exists residencies_staff_write on recoveryos.residencies;
drop policy if exists residencies_staff_update on recoveryos.residencies;
drop policy if exists bed_assignments_staff on recoveryos.bed_assignments;
create policy bed_assignments_staff_select on recoveryos.bed_assignments for select to authenticated
  using (exists (select 1 from recoveryos.residencies r
                 where r.id = bed_assignments.residency_id
                   and r.residence_id in (select recoveryos.staff_residence_ids())));

create or replace function recoveryos.admit_applicant(
  p_application_id bigint, p_bed_id bigint default null, p_admission_date date default current_date
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
  v_residency_id bigint;
  v_assignment_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_app from recoveryos.residence_applications where id = p_application_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_residence_manager_of(v_app.residence_id) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Admission is a residence-manager decision.');
  end if;
  if v_app.status <> 'approved' then
    return jsonb_build_object('ok', false, 'code', 'not_approved',
      'message', 'Only an approved application can be admitted.');
  end if;

  -- One live residency per person: the partial unique index is the arbiter.
  begin
    insert into recoveryos.residencies
      (person_id, residence_id, residency_status, admission_date)
    values (v_app.person_id, v_app.residence_id, 'active', p_admission_date)
    returning id into v_residency_id;
  exception when unique_violation then
    select id into v_residency_id from recoveryos.residencies
      where person_id = v_app.person_id
        and residency_status in ('approved','active','on_pass','transitioning');
    if exists (select 1 from recoveryos.residencies
               where id = v_residency_id and residence_id = v_app.residence_id) then
      return jsonb_build_object('ok', true, 'code', 'already_resident', 'residency_id', v_residency_id);
    end if;
    return jsonb_build_object('ok', false, 'code', 'live_residency_elsewhere',
      'message', 'They already have a live residency at another residence.');
  end;

  if p_bed_id is not null then
    if not exists (select 1 from recoveryos.residence_beds b
                   join recoveryos.residence_rooms rm on rm.id = b.room_id
                   join recoveryos.residence_units u on u.id = rm.unit_id
                   where b.id = p_bed_id and u.residence_id = v_app.residence_id) then
      return jsonb_build_object('ok', false, 'code', 'bed_not_in_residence');
    end if;
    begin
      insert into recoveryos.bed_assignments (residency_id, bed_id)
      values (v_residency_id, p_bed_id)
      returning id into v_assignment_id;
      update recoveryos.residencies set bed_assignment_id = v_assignment_id where id = v_residency_id;
    exception when unique_violation then
      -- bed already occupied — admission stands, bed does not.
      v_assignment_id := null;
    end;
  end if;

  -- Resident role/context is server-granted on admission (§34).
  if not exists (select 1 from recoveryos.role_assignments
                 where person_id = v_app.person_id and role_key = 'resident'
                   and residence_id = v_app.residence_id and revoked_at is null) then
    insert into recoveryos.role_assignments (person_id, role_key, residence_id, granted_by_person_id)
    values (v_app.person_id, 'resident', v_app.residence_id, v_me);
  end if;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'residency.admitted', 'residencies', v_residency_id,
          jsonb_build_object('application_id', p_application_id, 'bed_assigned', v_assignment_id is not null));

  return jsonb_build_object('ok', true, 'code', 'admitted',
    'residency_id', v_residency_id, 'bed_assignment_id', v_assignment_id,
    'bed_assigned', v_assignment_id is not null);
end $$;

create or replace function recoveryos.assign_bed(p_residency_id bigint, p_bed_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_res recoveryos.residencies%rowtype;
  v_assignment_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_res from recoveryos.residencies where id = p_residency_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_res.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_res.residency_status not in ('approved','active','on_pass','transitioning') then
    return jsonb_build_object('ok', false, 'code', 'residency_not_live');
  end if;
  if not exists (select 1 from recoveryos.residence_beds b
                 join recoveryos.residence_rooms rm on rm.id = b.room_id
                 join recoveryos.residence_units u on u.id = rm.unit_id
                 where b.id = p_bed_id and u.residence_id = v_res.residence_id) then
    return jsonb_build_object('ok', false, 'code', 'bed_not_in_residence');
  end if;

  -- Transfer preserves history: release the old assignment, add the new one.
  update recoveryos.bed_assignments set released_at = now()
    where residency_id = p_residency_id and released_at is null;
  begin
    insert into recoveryos.bed_assignments (residency_id, bed_id)
    values (p_residency_id, p_bed_id)
    returning id into v_assignment_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'bed_taken',
      'message', 'Someone else was just assigned that bed.');
  end;
  update recoveryos.residencies set bed_assignment_id = v_assignment_id where id = p_residency_id;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'residency.bed_assigned', 'bed_assignments', v_assignment_id,
          jsonb_build_object('residency_id', p_residency_id, 'bed_id', p_bed_id));

  return jsonb_build_object('ok', true, 'code', 'assigned', 'bed_assignment_id', v_assignment_id);
end $$;

create or replace function recoveryos.discharge_residency(
  p_residency_id bigint, p_status text default 'exited', p_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_res recoveryos.residencies%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('exited','discharged','transitioning') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_res from recoveryos.residencies where id = p_residency_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_residence_manager_of(v_res.residence_id) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Discharge is a residence-manager decision.');
  end if;
  if v_res.residency_status in ('exited','discharged') then
    return jsonb_build_object('ok', true, 'code', 'already_ended');
  end if;

  update recoveryos.residencies
     set residency_status = p_status::recoveryos.residency_status,
         discharge_date = case when p_status in ('exited','discharged') then current_date else discharge_date end
   where id = p_residency_id;

  if p_status in ('exited','discharged') then
    update recoveryos.bed_assignments set released_at = now()
      where residency_id = p_residency_id and released_at is null;
    -- Active resident context ends; the PERSON does not (§34): participant
    -- identity and coaching/navigation relationships are untouched.
    update recoveryos.role_assignments set revoked_at = now()
      where person_id = v_res.person_id and role_key = 'resident'
        and residence_id = v_res.residence_id and revoked_at is null;
    -- Designated residence support ends with the residency (§33).
    update recoveryos.support_team_memberships set ended_at = current_date
      where person_id = v_res.person_id and member_role = 'residence_support' and ended_at is null;
  end if;

  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'residency.' || p_status, 'residencies', p_residency_id,
          jsonb_build_object('reason', nullif(trim(coalesce(p_reason,'')), '')));

  return jsonb_build_object('ok', true, 'code', p_status);
end $$;

-- ---------------------------------------------------------------------------
-- 4) Passes (§23) — resident requests; staff decides; server derives decider
-- ---------------------------------------------------------------------------
drop policy if exists passes_staff on recoveryos.passes;
create policy passes_staff_select on recoveryos.passes for select to authenticated
  using (exists (select 1 from recoveryos.residencies r
                 where r.id = passes.residency_id
                   and r.residence_id in (select recoveryos.staff_residence_ids())));

create or replace function recoveryos.decide_pass(p_pass_id bigint, p_decision text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_pass recoveryos.passes%rowtype;
  v_residence bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_decision not in ('approved','denied') then
    return jsonb_build_object('ok', false, 'code', 'invalid_decision');
  end if;
  select * into v_pass from recoveryos.passes where id = p_pass_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  select residence_id into v_residence from recoveryos.residencies where id = v_pass.residency_id;
  if v_residence not in (select recoveryos.staff_residence_ids()) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_pass.status = p_decision then return jsonb_build_object('ok', true, 'code', 'already_set'); end if;
  if v_pass.status <> 'requested' then
    return jsonb_build_object('ok', false, 'code', 'already_decided');
  end if;
  update recoveryos.passes set status = p_decision, decided_by_person_id = v_me where id = p_pass_id;
  return jsonb_build_object('ok', true, 'code', p_decision);
end $$;

create or replace function recoveryos.record_pass_return(p_pass_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_pass recoveryos.passes%rowtype;
  v_residence bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_pass from recoveryos.passes where id = p_pass_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  select residence_id into v_residence from recoveryos.residencies where id = v_pass.residency_id;
  if v_residence not in (select recoveryos.staff_residence_ids()) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_pass.status = 'returned' then return jsonb_build_object('ok', true, 'code', 'already_returned'); end if;
  if v_pass.status not in ('approved','active','overdue') then
    return jsonb_build_object('ok', false, 'code', 'not_returnable');
  end if;
  update recoveryos.passes set status = 'returned' where id = p_pass_id;
  return jsonb_build_object('ok', true, 'code', 'returned');
end $$;

-- ---------------------------------------------------------------------------
-- 5) Screenings + incidents (§20–21) — append-only, identity-pinned
-- ---------------------------------------------------------------------------
drop policy if exists screenings_staff on recoveryos.screenings;
create policy screenings_staff_select on recoveryos.screenings for select to authenticated
  using (exists (select 1 from recoveryos.residencies r
                 where r.id = screenings.residency_id
                   and r.residence_id in (select recoveryos.staff_residence_ids())));
create policy screenings_staff_insert on recoveryos.screenings for insert to authenticated
  with check (recorded_by_person_id = recoveryos.current_person_id()
              and exists (select 1 from recoveryos.residencies r
                          where r.id = screenings.residency_id
                            and r.residence_id in (select recoveryos.staff_residence_ids())));
-- No UPDATE/DELETE policies: a recorded screening is history. Corrections are
-- recorded as a new row referencing the same residency (operational practice).

drop policy if exists incidents_staff on recoveryos.incidents;
create policy incidents_staff_select on recoveryos.incidents for select to authenticated
  using (residence_id in (select recoveryos.staff_residence_ids()));
create policy incidents_staff_insert on recoveryos.incidents for insert to authenticated
  with check (reported_by_person_id = recoveryos.current_person_id()
              and residence_id in (select recoveryos.staff_residence_ids()));
-- Review/amendment is a manager RPC — never a silent rewrite of the narrative.
create or replace function recoveryos.review_incident(p_incident_id bigint, p_follow_up text default null)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_inc recoveryos.incidents%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_inc from recoveryos.incidents where id = p_incident_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_residence_manager_of(v_inc.residence_id) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  update recoveryos.incidents
     set reviewed_by_person_id = v_me, reviewed_at = now(),
         follow_up = coalesce(nullif(trim(coalesce(p_follow_up,'')), ''), follow_up)
   where id = p_incident_id;
  return jsonb_build_object('ok', true, 'code', 'reviewed');
end $$;

-- ---------------------------------------------------------------------------
-- 6) Grievances (§22) — least privilege, filer never controls disposition
-- ---------------------------------------------------------------------------
alter table recoveryos.grievances
  add column if not exists resolved_by_person_id bigint references recoveryos.people(id);

drop policy if exists grievances_involved on recoveryos.grievances;
create policy grievances_scoped_select on recoveryos.grievances for select to authenticated
  using (filed_by_person_id = recoveryos.current_person_id()
         or recoveryos.is_residence_manager_of(residence_id)
         or recoveryos.is_platform_admin());

create or replace function recoveryos.resolve_grievance(p_grievance_id bigint, p_status text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_g recoveryos.grievances%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('in_review','resolved','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_g from recoveryos.grievances where id = p_grievance_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_residence_manager_of(v_g.residence_id) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  -- A grievance is never disposed of by the person it may concern: the filer
  -- cannot resolve their own filing even if they hold the manager role.
  if v_g.filed_by_person_id = v_me then
    return jsonb_build_object('ok', false, 'code', 'conflict_of_interest',
      'message', 'Someone else must handle a grievance you filed.');
  end if;
  if v_g.status = p_status then return jsonb_build_object('ok', true, 'code', 'already_set'); end if;
  update recoveryos.grievances
     set status = p_status,
         resolved_at = case when p_status in ('resolved','closed') then now() else resolved_at end,
         resolved_by_person_id = case when p_status in ('resolved','closed') then v_me else resolved_by_person_id end
   where id = p_grievance_id;
  return jsonb_build_object('ok', true, 'code', p_status);
end $$;

-- ---------------------------------------------------------------------------
-- 7) Residence support seam (§15–17, §33) — intentional designation, not roster
-- ---------------------------------------------------------------------------
create or replace function recoveryos.designate_residence_support(
  p_person_id bigint, p_staff_person_id bigint
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_residence bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select residence_id into v_residence from recoveryos.residencies
    where person_id = p_person_id and residency_status in ('active','on_pass','transitioning')
    limit 1;
  if v_residence is null then
    return jsonb_build_object('ok', false, 'code', 'no_active_residency');
  end if;
  if not recoveryos.is_residence_manager_of(v_residence) and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if not exists (select 1 from recoveryos.role_assignments
                 where person_id = p_staff_person_id
                   and role_key in ('residence_staff','residence_manager')
                   and residence_id = v_residence and revoked_at is null) then
    return jsonb_build_object('ok', false, 'code', 'not_residence_staff',
      'message', 'Residence support must be staff at this residence.');
  end if;

  update recoveryos.support_team_memberships set ended_at = current_date
    where person_id = p_person_id and member_role = 'residence_support' and ended_at is null
      and member_person_id <> p_staff_person_id;
  if exists (select 1 from recoveryos.support_team_memberships
             where person_id = p_person_id and member_person_id = p_staff_person_id
               and member_role = 'residence_support' and ended_at is null) then
    return jsonb_build_object('ok', true, 'code', 'already_designated');
  end if;
  insert into recoveryos.support_team_memberships (person_id, member_person_id, member_role)
  values (p_person_id, p_staff_person_id, 'residence_support');

  return jsonb_build_object('ok', true, 'code', 'designated');
end $$;

create or replace function recoveryos.end_residence_support(p_person_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_residence bigint;
  v_count int;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select residence_id into v_residence from recoveryos.residencies
    where person_id = p_person_id and residency_status in ('active','on_pass','transitioning')
    limit 1;
  if v_residence is not null
     and not recoveryos.is_residence_manager_of(v_residence)
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_residence is null and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  update recoveryos.support_team_memberships set ended_at = current_date
    where person_id = p_person_id and member_role = 'residence_support' and ended_at is null;
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'code', case when v_count > 0 then 'ended' else 'none_active' end);
end $$;

-- My Support gains the third context: the DESIGNATED residence support person.
drop function if exists recoveryos.get_my_support_team();
create function recoveryos.get_my_support_team()
returns table (
  relationship_id bigint,
  support_person_id bigint,
  display_name text,
  role_label text,
  relationship_type text,
  context text,
  is_primary boolean,
  started_at date
) language sql stable security definer set search_path = recoveryos, public as $$
  select cr.id, p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
      trim(p.first_name || ' ' || left(coalesce(nullif(p.last_name, ''), ''), 1) ||
           case when coalesce(p.last_name, '') = '' then '' else '.' end)) as display_name,
    case cr.relationship_type
      when 'coach' then 'Recovery Coach'
      when 'peer' then 'Peer Support'
      when 'mentor' then 'Mentor'
      else 'Support'
    end as role_label,
    cr.relationship_type, 'coaching'::text as context, cr.is_primary, cr.started_at
  from recoveryos.coaching_relationships cr
  join recoveryos.people p on p.id = cr.coach_person_id
  where cr.participant_person_id = recoveryos.current_person_id() and cr.status = 'active'
  union all
  select nr.id, p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
      trim(p.first_name || ' ' || left(coalesce(nullif(p.last_name, ''), ''), 1) ||
           case when coalesce(p.last_name, '') = '' then '' else '.' end)),
    'Navigator', 'navigator', 'navigation'::text, nr.is_primary, nr.started_at
  from recoveryos.navigation_relationships nr
  join recoveryos.people p on p.id = nr.navigator_person_id
  where nr.participant_person_id = recoveryos.current_person_id() and nr.status = 'active'
  union all
  select sm.id, p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
      trim(p.first_name || ' ' || left(coalesce(nullif(p.last_name, ''), ''), 1) ||
           case when coalesce(p.last_name, '') = '' then '' else '.' end)),
    'Residence Support', 'residence_support', 'residence'::text, true, sm.started_at
  from recoveryos.support_team_memberships sm
  join recoveryos.people p on p.id = sm.member_person_id
  where sm.person_id = recoveryos.current_person_id()
    and sm.member_role = 'residence_support' and sm.ended_at is null
  order by context, is_primary desc, started_at desc;
$$;
revoke execute on function recoveryos.get_my_support_team() from public, anon;
grant execute on function recoveryos.get_my_support_team() to authenticated;

-- Messaging context='residence', backed by the intentional designation (one-to-one:
-- the two-member read model stays valid — no fake group thread, §16).
alter table recoveryos.conversations drop constraint if exists conversations_context_check;
alter table recoveryos.conversations add constraint conversations_context_check
  check (context in ('coaching','navigation','residence'));
alter table recoveryos.conversation_members drop constraint if exists conversation_members_member_role_check;
alter table recoveryos.conversation_members add constraint conversation_members_member_role_check
  check (member_role in ('participant','coach','navigator','residence_support'));

create or replace function recoveryos.ensure_relationship_conversation(
  p_other_person_id bigint default null, p_context text default null
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_crel recoveryos.coaching_relationships%rowtype;
  v_nrel recoveryos.navigation_relationships%rowtype;
  v_sm recoveryos.support_team_memberships%rowtype;
  v_context text;
  v_participant bigint; v_staff bigint; v_staff_role text;
  v_conv_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if p_context is not null and p_context not in ('coaching','navigation','residence') then
    return jsonb_build_object('ok', false, 'code', 'invalid_context');
  end if;

  if coalesce(p_context, 'coaching') = 'coaching' then
    if p_other_person_id is null then
      select * into v_crel from recoveryos.coaching_relationships
      where participant_person_id = v_me and status = 'active'
      order by is_primary desc, started_at desc limit 1;
    else
      select * into v_crel from recoveryos.coaching_relationships
      where status = 'active'
        and ((participant_person_id = v_me and coach_person_id = p_other_person_id)
          or (coach_person_id = v_me and participant_person_id = p_other_person_id))
      order by is_primary desc, started_at desc limit 1;
    end if;
    if found then
      v_context := 'coaching';
      v_participant := v_crel.participant_person_id; v_staff := v_crel.coach_person_id;
      v_staff_role := 'coach';
    end if;
  end if;

  if v_context is null and coalesce(p_context, 'navigation') = 'navigation' then
    if p_other_person_id is null then
      select * into v_nrel from recoveryos.navigation_relationships
      where participant_person_id = v_me and status = 'active'
      order by is_primary desc, started_at desc limit 1;
    else
      select * into v_nrel from recoveryos.navigation_relationships
      where status = 'active'
        and ((participant_person_id = v_me and navigator_person_id = p_other_person_id)
          or (navigator_person_id = v_me and participant_person_id = p_other_person_id))
      order by is_primary desc, started_at desc limit 1;
    end if;
    if found then
      v_context := 'navigation';
      v_participant := v_nrel.participant_person_id; v_staff := v_nrel.navigator_person_id;
      v_staff_role := 'navigator';
    end if;
  end if;

  if v_context is null and p_context = 'residence' then
    if p_other_person_id is null then
      select * into v_sm from recoveryos.support_team_memberships
      where person_id = v_me and member_role = 'residence_support' and ended_at is null
      order by started_at desc limit 1;
    else
      select * into v_sm from recoveryos.support_team_memberships
      where member_role = 'residence_support' and ended_at is null
        and ((person_id = v_me and member_person_id = p_other_person_id)
          or (member_person_id = v_me and person_id = p_other_person_id))
      order by started_at desc limit 1;
    end if;
    if found then
      v_context := 'residence';
      v_participant := v_sm.person_id; v_staff := v_sm.member_person_id;
      v_staff_role := 'residence_support';
    end if;
  end if;

  if v_context is null then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Messaging opens once you''re connected with someone.');
  end if;

  insert into recoveryos.conversations
      (participant_person_id, coach_person_id, coaching_relationship_id,
       navigation_relationship_id, context)
  values (v_participant, v_staff,
          case when v_context = 'coaching' then v_crel.id end,
          case when v_context = 'navigation' then v_nrel.id end,
          v_context)
  on conflict (participant_person_id, coach_person_id, context)
  do update set
    coaching_relationship_id =
      coalesce(recoveryos.conversations.coaching_relationship_id, excluded.coaching_relationship_id),
    navigation_relationship_id =
      coalesce(recoveryos.conversations.navigation_relationship_id, excluded.navigation_relationship_id)
  returning id into v_conv_id;

  insert into recoveryos.conversation_members (conversation_id, person_id, member_role)
  values (v_conv_id, v_participant, 'participant'), (v_conv_id, v_staff, v_staff_role)
  on conflict (conversation_id, person_id) do nothing;

  return jsonb_build_object('ok', true, 'code', 'ready',
    'conversation_id', v_conv_id, 'context', v_context);
end $$;

create or replace function recoveryos.send_message(
  p_conversation_id bigint, p_body text
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_body text := trim(coalesce(p_body, ''));
  v_conv recoveryos.conversations%rowtype;
  v_active boolean;
  v_recipient bigint;
  v_sender_name text;
  v_link text;
  v_msg_id bigint;
  v_created timestamptz;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if v_body = '' then
    return jsonb_build_object('ok', false, 'code', 'empty_message', 'message', 'Write a message first.');
  end if;
  if length(v_body) > 4000 then
    return jsonb_build_object('ok', false, 'code', 'too_long',
      'message', 'That message is a little long — try splitting it up.');
  end if;

  select * into v_conv from recoveryos.conversations where id = p_conversation_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.conversation_members
                 where conversation_id = v_conv.id and person_id = v_me) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if v_conv.context = 'navigation' then
    v_active := exists (select 1 from recoveryos.navigation_relationships
      where participant_person_id = v_conv.participant_person_id
        and navigator_person_id = v_conv.coach_person_id and status = 'active');
  elsif v_conv.context = 'residence' then
    v_active := exists (select 1 from recoveryos.support_team_memberships
      where person_id = v_conv.participant_person_id
        and member_person_id = v_conv.coach_person_id
        and member_role = 'residence_support' and ended_at is null);
  else
    v_active := exists (select 1 from recoveryos.coaching_relationships
      where participant_person_id = v_conv.participant_person_id
        and coach_person_id = v_conv.coach_person_id and status = 'active');
  end if;
  if not v_active then
    return jsonb_build_object('ok', false, 'code', 'relationship_ended',
      'message', 'This conversation is read-only now.');
  end if;

  insert into recoveryos.messages (conversation_id, sender_person_id, body)
  values (v_conv.id, v_me, v_body)
  returning id, created_at into v_msg_id, v_created;

  v_recipient := case when v_me = v_conv.participant_person_id
                      then v_conv.coach_person_id else v_conv.participant_person_id end;
  v_link := case
    when v_recipient = v_conv.participant_person_id then '/vrcc/messages'
    when v_conv.context = 'navigation' then '/navigator/messages/' || v_conv.participant_person_id
    when v_conv.context = 'residence' then '/staff/messages/' || v_conv.participant_person_id
    else '/coach/messages/' || v_conv.participant_person_id end;
  select coalesce(nullif(trim(p.preferred_name), ''), nullif(trim(p.first_name), ''), 'your support person')
    into v_sender_name from recoveryos.people p where p.id = v_me;

  if not exists (select 1 from recoveryos.notifications
                 where recipient_person_id = v_recipient and kind = 'new_message'
                   and link_path = v_link and read_at is null) then
    perform recoveryos.emit_notification(v_recipient, 'new_message',
      'New message from ' || v_sender_name, '', v_link, null);
  end if;

  return jsonb_build_object('ok', true, 'code', 'sent', 'message_id', v_msg_id, 'created_at', v_created);
end $$;

create or replace function recoveryos.mark_conversation_read(
  p_conversation_id bigint
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_conv recoveryos.conversations%rowtype;
  v_link text;
  v_count int;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  select * into v_conv from recoveryos.conversations where id = p_conversation_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.conversation_members
                 where conversation_id = v_conv.id and person_id = v_me) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  update recoveryos.messages
     set read_at = now()
   where conversation_id = v_conv.id and sender_person_id <> v_me and read_at is null;
  get diagnostics v_count = row_count;

  v_link := case
    when v_me = v_conv.participant_person_id then '/vrcc/messages'
    when v_conv.context = 'navigation' then '/navigator/messages/' || v_conv.participant_person_id
    when v_conv.context = 'residence' then '/staff/messages/' || v_conv.participant_person_id
    else '/coach/messages/' || v_conv.participant_person_id end;
  update recoveryos.notifications
     set read_at = now()
   where recipient_person_id = v_me and kind = 'new_message'
     and link_path = v_link and read_at is null;

  return jsonb_build_object('ok', true, 'code', 'marked', 'messages_marked', v_count);
end $$;

-- ---------------------------------------------------------------------------
-- 8) Residence support service attestation (§28–29)
-- ---------------------------------------------------------------------------
insert into recoveryos.service_types (key, name, category)
select 'residence_recovery_support', 'Residence Recovery Support', 'peer_support'
where not exists (select 1 from recoveryos.service_types where key = 'residence_recovery_support');

create or replace function recoveryos.record_residence_support_service_event(
  p_person_id bigint,
  p_modality recoveryos.service_modality default 'in_person',
  p_started_at timestamptz default now(),
  p_duration_minutes int default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_res recoveryos.residencies%rowtype;
  v_org bigint;
  v_service_type bigint;
  v_existing bigint;
  v_event_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_res from recoveryos.residencies
    where person_id = p_person_id and residency_status in ('active','on_pass','transitioning')
    limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'no_active_residency');
  end if;
  if v_res.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Residence support is recorded by staff at the person''s residence.');
  end if;

  select organization_id into v_org from recoveryos.residences where id = v_res.residence_id;
  select id into v_service_type from recoveryos.service_types where key = 'residence_recovery_support';

  select id into v_existing from recoveryos.service_events
    where person_id = p_person_id and provider_person_id = v_me
      and service_type_id = v_service_type and started_at = p_started_at;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_recorded', 'service_event_id', v_existing);
  end if;

  insert into recoveryos.service_events
    (person_id, service_type_id, provider_person_id, organization_id,
     residence_id, residency_id, delivery_context, modality, started_at, ended_at)
  values
    (p_person_id, v_service_type, v_me, coalesce(v_org, 1),
     v_res.residence_id, v_res.id, 'recovery_residence', p_modality, p_started_at,
     case when p_duration_minutes is not null
          then p_started_at + make_interval(mins => p_duration_minutes) end)
  returning id into v_event_id;

  return jsonb_build_object('ok', true, 'code', 'recorded', 'service_event_id', v_event_id);
end $$;

-- ---------------------------------------------------------------------------
-- 9) Grants
-- ---------------------------------------------------------------------------
revoke execute on function
  recoveryos.review_residence_application(bigint, text, text),
  recoveryos.withdraw_my_application(bigint),
  recoveryos.admit_applicant(bigint, bigint, date),
  recoveryos.assign_bed(bigint, bigint),
  recoveryos.discharge_residency(bigint, text, text),
  recoveryos.decide_pass(bigint, text),
  recoveryos.record_pass_return(bigint),
  recoveryos.review_incident(bigint, text),
  recoveryos.resolve_grievance(bigint, text),
  recoveryos.designate_residence_support(bigint, bigint),
  recoveryos.end_residence_support(bigint),
  recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int)
from public, anon;
grant execute on function
  recoveryos.review_residence_application(bigint, text, text),
  recoveryos.withdraw_my_application(bigint),
  recoveryos.admit_applicant(bigint, bigint, date),
  recoveryos.assign_bed(bigint, bigint),
  recoveryos.discharge_residency(bigint, text, text),
  recoveryos.decide_pass(bigint, text),
  recoveryos.record_pass_return(bigint),
  recoveryos.review_incident(bigint, text),
  recoveryos.resolve_grievance(bigint, text),
  recoveryos.designate_residence_support(bigint, bigint),
  recoveryos.end_residence_support(bigint),
  recoveryos.record_residence_support_service_event(bigint, recoveryos.service_modality, timestamptz, int)
to authenticated;

notify pgrst, 'reload schema';
