-- 0127_relational_continuity.sql — P0.5-B: relationship lifecycle + honest notification links.
--
-- THE RULE (executive directive, 2026-08-21): TRANSFER MUST PRESERVE CONTINUITY WITHOUT
-- REWRITING HISTORY. The prior relationship remains historically intact (status flips to
-- 'transferred'/'ended' with reason + effective date — never deleted, never overwritten); a
-- successor relationship begins as a NEW row; open follow-ups explicitly move to the successor
-- so nothing a participant is waiting on silently disappears.
--
-- 1) end_coaching_relationship — NEW. Relationships could be created but never ended: the
--    one-active-primary unique index made a participant permanently bound to their first
--    claimer. Coach-on-the-row or platform admin; active -> ended (+reason, effective today);
--    the participant is notified through the existing notification spine (no new kinds);
--    audit-logged. Open follow-ups KEEP their assignee: ending a relationship does not
--    un-promise a check-in — completing or handing them off stays a visible human decision.
-- 2) assign_participant_coach — re-created (prior body: 0117) with one addition: on an
--    admin/care-ops TRANSFER, the departing coach's OPEN follow-ups for that participant are
--    reassigned to the successor (completed history untouched), and the count is audited.
-- 3) notify_appointment_event / notify_relationship_assigned — re-created (prior bodies: 0100)
--    with links that point at routes that exist: '/sessions' -> '/vrcc/sessions',
--    participant 'coach assigned' '/coach' -> '/vrcc/connect'. A notification must lead to its
--    object; the client-side safeLinkPath remap still covers previously stored rows.
--
-- ROLLBACK: drop function recoveryos.end_coaching_relationship(bigint, text);
--           re-apply the 0117 assign_participant_coach body and the 0100 notify bodies.

set search_path = recoveryos, public;

-- 1) ---------------------------------------------------------------------------------------
create or replace function recoveryos.end_coaching_relationship(
  p_relationship_id bigint, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel recoveryos.coaching_relationships%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_rel from recoveryos.coaching_relationships
    where id = p_relationship_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_rel.coach_person_id <> v_me and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_rel.status = 'ended' then return jsonb_build_object('ok', true, 'code', 'already_ended'); end if;
  if v_rel.status not in ('active','paused','pending') then
    return jsonb_build_object('ok', false, 'code', 'not_endable',
      'message', 'This connection is already ' || v_rel.status || '.');
  end if;

  update recoveryos.coaching_relationships
     set status = 'ended', ended_at = current_date,
         end_reason = nullif(trim(coalesce(p_reason, '')), ''),
         updated_at = now()
   where id = p_relationship_id;

  -- Participant visibility — existing kind, existing route, deduped. Exception-safe:
  -- a notification failure never aborts the lifecycle write.
  begin
    perform recoveryos.emit_notification(v_rel.participant_person_id, 'general',
      'A change to your support team',
      'Your coaching connection has ended. Whenever you want to connect with a coach again, just ask — the door stays open.',
      '/vrcc/connect', 'rel_ended:' || v_rel.id || ':' || v_rel.participant_person_id);
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (v_me, 'notify_failed', 'coaching_relationships', v_rel.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;

  insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'coaching_relationship.ended', 'coaching_relationships', v_rel.id,
          jsonb_build_object('reason', p_reason));

  return jsonb_build_object('ok', true, 'code', 'ended');
end $$;
revoke execute on function recoveryos.end_coaching_relationship(bigint, text) from public, anon;
grant execute on function recoveryos.end_coaching_relationship(bigint, text) to authenticated;

-- 2) ---------------------------------------------------------------------------------------
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
  v_moved int := 0;
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

  -- P0.5-B continuity: on a transfer, the departing coach's OPEN follow-ups for
  -- this participant move to the successor — a promised check-in never silently
  -- loses its owner. Completed/cancelled history is untouched.
  if v_had_active then
    update recoveryos.follow_ups
       set assigned_person_id = p_coach_person_id, updated_at = now()
     where person_id = p_participant_person_id
       and assigned_person_id = v_cur.coach_person_id
       and status = 'open';
    get diagnostics v_moved = row_count;

    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (v_me, 'coaching_relationship.transferred', 'coaching_relationships', v_cur.id,
            jsonb_build_object('successor_relationship_id', v_new_id,
                               'successor_coach_person_id', p_coach_person_id,
                               'open_follow_ups_moved', v_moved,
                               'reason', p_reason));
  end if;

  return jsonb_build_object('ok', true, 'code', 'assigned', 'relationship_id', v_new_id,
    'open_follow_ups_moved', v_moved, 'message', 'They''re connected.');
end $$;

-- 3) ---------------------------------------------------------------------------------------
create or replace function recoveryos.notify_appointment_event(p_appointment_id bigint, p_event text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_a recoveryos.appointments%rowtype;
  v_kind text; v_when text; v_p bigint; v_c bigint;
begin
  select * into v_a from recoveryos.appointments where id = p_appointment_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  v_kind := case p_event when 'confirmed' then 'session_confirmed'
                         when 'cancelled' then 'session_cancelled'
                         else 'general' end;
  v_when := to_char(v_a.starts_at at time zone coalesce(v_a.timezone,'America/Chicago'), 'Dy Mon DD at HH12:MI AM');
  -- P0.5-B: links point at routes that exist ('/sessions' was never a route).
  v_p := recoveryos.emit_notification(v_a.person_id, v_kind, 'Session ' || p_event,
           'Your session is ' || p_event || ' for ' || v_when || ' (Central).', '/vrcc/sessions',
           'appt:' || p_event || ':' || v_a.id || ':' || v_a.person_id);
  v_c := recoveryos.emit_notification(v_a.provider_person_id, v_kind, 'Session ' || p_event,
           'Session ' || p_event || ' for ' || v_when || ' (Central).', '/coach/sessions',
           'appt:' || p_event || ':' || v_a.id || ':' || coalesce(v_a.provider_person_id,0));
  return jsonb_build_object('ok', true, 'code', 'emitted',
    'participant_notification', v_p, 'provider_notification', v_c);
end $$;
revoke execute on function recoveryos.notify_appointment_event(bigint,text) from public, anon, authenticated;

create or replace function recoveryos.notify_relationship_assigned(p_relationship_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare v_r recoveryos.coaching_relationships%rowtype; v_p bigint;
begin
  select * into v_r from recoveryos.coaching_relationships where id = p_relationship_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  -- P0.5-B: the participant's link goes to THEIR connection page, not a staff route.
  v_p := recoveryos.emit_notification(v_r.participant_person_id, 'coach_assigned', 'Coach assigned',
           'You have been matched with a recovery coach.', '/vrcc/connect',
           'rel_assigned:' || v_r.id || ':' || v_r.participant_person_id);
  return jsonb_build_object('ok', true, 'code', 'emitted', 'notification', v_p);
end $$;
revoke execute on function recoveryos.notify_relationship_assigned(bigint) from public, anon, authenticated;

notify pgrst, 'reload schema';
