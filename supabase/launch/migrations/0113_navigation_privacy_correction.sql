-- 0113_navigation_privacy_correction.sql — P4E: close the is_admin_staff over-reach.
--
-- The P4E privacy verification (§44 matrix, rolled back) caught a real defect in
-- 0112 as first applied: its "admin" fallbacks used recoveryos.is_admin_staff(),
-- which 0026 defined as navigator|program_manager|administrator|system_administrator
-- — an OPERATIONAL-staff predicate, not a platform-admin one. Consequence: a
-- foreign navigator could update another navigator's participant needs, create
-- referrals for unrelated participants, read their needs/referrals via RLS, and
-- pass complete_session's provider check. This migration introduces a true
-- platform-admin predicate and rebinds every navigation-domain authorization
-- fallback (and complete_session) to it. Navigation access is relationship-scoped
-- or platform-admin — never "any operational staff".

create or replace function recoveryos.is_platform_admin()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('administrator') or recoveryos.has_role('system_administrator');
$$;
revoke execute on function recoveryos.is_platform_admin() from public, anon;
grant execute on function recoveryos.is_platform_admin() to authenticated;

-- ---- RLS: needs/referrals/relationship metadata are relationship-or-admin ----
drop policy if exists nav_needs_select on recoveryos.navigation_needs;
create policy nav_needs_select on recoveryos.navigation_needs for select to authenticated
  using (person_id = recoveryos.current_person_id()
         or person_id in (select recoveryos.my_navigation_participant_ids())
         or recoveryos.is_platform_admin());

drop policy if exists nav_referrals_select on recoveryos.navigation_referrals;
create policy nav_referrals_select on recoveryos.navigation_referrals for select to authenticated
  using (person_id = recoveryos.current_person_id()
         or person_id in (select recoveryos.my_navigation_participant_ids())
         or recoveryos.is_platform_admin());

drop policy if exists navigation_rel_staff_select on recoveryos.navigation_relationships;
create policy navigation_rel_staff_select on recoveryos.navigation_relationships
  for select to authenticated using (recoveryos.is_platform_admin());

-- ---- RPC fallbacks: platform admin only --------------------------------------
create or replace function recoveryos.identify_navigation_need(
  p_person_id bigint, p_need_category text,
  p_note text default null, p_support_request_id bigint default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel_id bigint;
  v_need_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select id into v_rel_id from recoveryos.navigation_relationships
    where participant_person_id = p_person_id and navigator_person_id = v_me and status = 'active'
    order by is_primary desc limit 1;
  if v_rel_id is null and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Needs are identified within an active navigation relationship.');
  end if;

  insert into recoveryos.navigation_needs
    (person_id, navigation_relationship_id, support_request_id, need_category, note, created_by_person_id)
  values (p_person_id, v_rel_id, p_support_request_id, p_need_category, nullif(p_note,''), v_me)
  returning id into v_need_id;

  return jsonb_build_object('ok', true, 'code', 'identified', 'need_id', v_need_id);
exception when check_violation then
  return jsonb_build_object('ok', false, 'code', 'invalid_category');
end $$;

create or replace function recoveryos.update_navigation_need_status(
  p_need_id bigint, p_status text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_need recoveryos.navigation_needs%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('identified','in_progress','resolved','partially_resolved','unresolved','deferred') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_need from recoveryos.navigation_needs where id = p_need_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.navigation_relationships
                 where id = v_need.navigation_relationship_id and navigator_person_id = v_me and status='active')
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_need.status = p_status then
    return jsonb_build_object('ok', true, 'code', 'already_set');
  end if;
  update recoveryos.navigation_needs
     set status = p_status,
         resolved_at = case when p_status in ('resolved','partially_resolved') then now() else null end
   where id = p_need_id;
  return jsonb_build_object('ok', true, 'code', 'updated');
end $$;

create or replace function recoveryos.create_navigation_referral(
  p_person_id bigint, p_referral_type text,
  p_need_id bigint default null, p_resource_id bigint default null,
  p_organization_id bigint default null, p_destination_name text default null,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel_id bigint;
  v_ref_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_referral_type not in ('information','referral','warm_handoff') then
    return jsonb_build_object('ok', false, 'code', 'invalid_type');
  end if;
  select id into v_rel_id from recoveryos.navigation_relationships
    where participant_person_id = p_person_id and navigator_person_id = v_me and status = 'active'
    order by is_primary desc limit 1;
  if v_rel_id is null and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_need_id is not null and not exists
     (select 1 from recoveryos.navigation_needs where id = p_need_id and person_id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'need_mismatch');
  end if;

  begin
    insert into recoveryos.navigation_referrals
      (person_id, navigation_relationship_id, navigation_need_id, resource_id, organization_id,
       destination_name, referral_type, note, created_by_person_id)
    values (p_person_id, v_rel_id, p_need_id, p_resource_id, p_organization_id,
            nullif(trim(coalesce(p_destination_name,'')),''), p_referral_type, nullif(p_note,''), v_me)
    returning id into v_ref_id;
  exception when check_violation then
    return jsonb_build_object('ok', false, 'code', 'destination_required',
      'message', 'Say where they''re being connected — a resource, organization, or destination.');
  end;

  if p_need_id is not null then
    update recoveryos.navigation_needs set status = 'in_progress'
      where id = p_need_id and status = 'identified';
  end if;

  perform recoveryos.emit_notification(p_person_id, 'navigation_step',
    'A new connection step from your navigator', '', '/vrcc/connect',
    'nav_ref:' || v_ref_id || ':' || p_person_id);

  return jsonb_build_object('ok', true, 'code', 'created', 'referral_id', v_ref_id);
end $$;

create or replace function recoveryos.record_referral_outcome(
  p_referral_id bigint, p_status text, p_evidence text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_ref recoveryos.navigation_referrals%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('initiated','contact_attempted','connected','not_connected',
                      'participant_declined','partner_unavailable','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  if p_evidence is not null and p_evidence not in
     ('participant_report','navigator_confirmation','partner_confirmation','platform_evidence') then
    return jsonb_build_object('ok', false, 'code', 'invalid_evidence');
  end if;

  select * into v_ref from recoveryos.navigation_referrals where id = p_referral_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.navigation_relationships
                 where id = v_ref.navigation_relationship_id
                   and navigator_person_id = v_me and status = 'active')
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if p_status = 'connected' and p_evidence is null then
    return jsonb_build_object('ok', false, 'code', 'evidence_required',
      'message', 'Say how you know they connected.');
  end if;

  if p_evidence = 'partner_confirmation' and not exists (
      select 1 from recoveryos.consent_grants g
      join recoveryos.consent_types t on t.id = g.consent_type_id
      where g.person_id = v_ref.person_id and t.category = 'data_sharing'
        and g.status = 'granted' and g.revoked_at is null
        and (g.expires_at is null or g.expires_at > now())) then
    return jsonb_build_object('ok', false, 'code', 'consent_required',
      'message', 'There''s no data-sharing consent on file — check with the participant directly instead.');
  end if;

  if v_ref.status = p_status then
    return jsonb_build_object('ok', true, 'code', 'already_set');
  end if;

  update recoveryos.navigation_referrals
     set status = p_status,
         connection_evidence = coalesce(p_evidence, connection_evidence),
         attempted_at = coalesce(attempted_at,
           case when p_status in ('contact_attempted','connected','not_connected') then now() end),
         connected_at = case when p_status = 'connected' then now() else connected_at end,
         closed_at = case when p_status = 'closed' then now() else closed_at end
   where id = p_referral_id;

  return jsonb_build_object('ok', true, 'code', 'updated');
end $$;

create or replace function recoveryos.end_navigation_relationship(
  p_relationship_id bigint, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel recoveryos.navigation_relationships%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_rel from recoveryos.navigation_relationships where id = p_relationship_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_rel.navigator_person_id <> v_me and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_rel.status = 'ended' then
    return jsonb_build_object('ok', true, 'code', 'already_ended');
  end if;
  update recoveryos.navigation_relationships
    set status='ended', ended_at=current_date, end_reason=nullif(p_reason,'')
    where id = p_relationship_id;
  return jsonb_build_object('ok', true, 'code', 'ended');
end $$;

-- complete_session: only the appointment's provider (or platform admin) attests.
create or replace function recoveryos.complete_session(
  p_appointment_id bigint, p_duration_minutes int default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.appointments%rowtype;
  v_existing bigint;
  v_event_id bigint;
  v_ends timestamptz;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_a from recoveryos.appointments where id = p_appointment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_a.provider_person_id <> v_me and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  select id into v_existing from recoveryos.service_events where appointment_id = v_a.id;
  if v_a.status = 'completed' and v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_completed', 'service_event_id', v_existing);
  end if;
  if v_a.status not in ('confirmed','completed') then
    return jsonb_build_object('ok', false, 'code', 'not_completable',
      'message', 'Only a confirmed session can be marked complete.');
  end if;
  if v_a.starts_at > now() then
    return jsonb_build_object('ok', false, 'code', 'not_started_yet',
      'message', 'This session hasn''t started yet.');
  end if;

  v_ends := case when p_duration_minutes is not null
                 then v_a.starts_at + make_interval(mins => p_duration_minutes)
                 else coalesce(v_a.ends_at, v_a.starts_at + interval '50 minutes') end;

  update recoveryos.appointments set status = 'completed', updated_at = now() where id = v_a.id;

  begin
    insert into recoveryos.service_events
      (person_id, service_type_id, provider_person_id, organization_id, program_id,
       delivery_context, modality, started_at, ended_at, appointment_id, coaching_relationship_id)
    values
      (v_a.person_id, v_a.service_type_id, v_a.provider_person_id,
       coalesce(v_a.organization_id, 1), v_a.program_id,
       case when v_a.modality in ('video','phone','chat') then 'virtual'::recoveryos.delivery_context
            else 'vrcc'::recoveryos.delivery_context end,
       v_a.modality, v_a.starts_at, v_ends, v_a.id, v_a.coaching_relationship_id)
    returning id into v_event_id;
  exception when unique_violation then
    select id into v_event_id from recoveryos.service_events where appointment_id = v_a.id;
    return jsonb_build_object('ok', true, 'code', 'already_completed', 'service_event_id', v_event_id);
  end;

  return jsonb_build_object('ok', true, 'code', 'completed', 'service_event_id', v_event_id);
end $$;
