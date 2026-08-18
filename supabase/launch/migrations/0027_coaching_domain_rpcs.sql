-- RecoveryOS Canonical Coaching Domain — transactional RPCs (P2A).
-- Applied live as recoveryos_0027_coaching_domain_rpcs. Canonical, person_id-keyed
-- equivalents of the verified P0 prototype RPCs, preserving atomicity, one-winner
-- concurrency, graceful loser responses, assignment history, and idempotency.
--
-- These are SHADOW-stage: they exist for parity testing and the future canonical
-- frontend. Production callers are NOT switched to them in P2 (that is P3, gated on
-- the parity report). Because canonical appointments/relationships have no direct
-- client INSERT/UPDATE policy for confirmed/active states, these definer RPCs are
-- the ONLY authoritative write path — server-authoritative by construction.

begin;

-- --------------------------------------------------------------------------
-- claim_support_request — atomic pool claim + relationship creation
-- --------------------------------------------------------------------------
create or replace function recoveryos.claim_support_request(p_support_request_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_req recoveryos.support_requests%rowtype;
  v_rel_id bigint;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;
  if not recoveryos.is_support_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Only coaches can pick up requests.');
  end if;

  select * into v_req from recoveryos.support_requests where id = p_support_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'This request is no longer here.');
  end if;
  if v_req.claimed_by_person_id = v_me then
    return jsonb_build_object('ok', true, 'code', 'already_yours', 'message', 'They are already with you.');
  end if;
  if v_req.claimed_by_person_id is not null then
    return jsonb_build_object('ok', false, 'code', 'already_claimed',
      'message', 'Another coach just picked this up. Someone else may still be waiting for support.');
  end if;
  if v_req.status not in ('submitted','open') then
    return jsonb_build_object('ok', false, 'code', 'not_open', 'message', 'This request is no longer open.');
  end if;

  -- Reuse an existing active primary relationship, else create one (unique index guards the race).
  select id into v_rel_id from recoveryos.coaching_relationships
    where participant_person_id = v_req.person_id and status='active' and is_primary
    for update;
  if v_rel_id is not null then
    -- someone else already coaches this participant
    if (select coach_person_id from recoveryos.coaching_relationships where id=v_rel_id) <> v_me then
      return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
        'message', 'They are already connected with another coach.');
    end if;
  else
    begin
      insert into recoveryos.coaching_relationships
        (participant_person_id, coach_person_id, organization_id, started_at,
         status, relationship_type, is_primary, assigned_by_person_id, assignment_source)
      values (v_req.person_id, v_me, 1, current_date,
              'active','coach', true, v_me, 'request_pickup')
      returning id into v_rel_id;
    exception when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
        'message', 'They were just connected with another coach.');
    end;
  end if;

  update recoveryos.support_requests
    set claimed_by_person_id = v_me, claimed_at = now(), coaching_relationship_id = v_rel_id,
        status = 'claimed', assigned_at = now(), last_actor_person_id = v_me
    where id = p_support_request_id;

  insert into recoveryos.support_request_events (support_request_id, event_type, actor_person_id, detail)
    values (p_support_request_id, 'claimed', v_me, jsonb_build_object('relationship_id', v_rel_id));

  return jsonb_build_object('ok', true, 'code', 'claimed', 'relationship_id', v_rel_id,
    'message', 'They''re with you now.');
end $$;

-- --------------------------------------------------------------------------
-- assign_participant_coach — atomic assign / transfer, history preserved
-- --------------------------------------------------------------------------
create or replace function recoveryos.assign_participant_coach(
  p_participant_person_id bigint, p_coach_person_id bigint, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_is_admin boolean := recoveryos.is_admin_staff();
  v_cur recoveryos.coaching_relationships%rowtype;
  v_had_active boolean := false;
  v_source text;
  v_new_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not (v_is_admin or (recoveryos.has_role('coach') and p_coach_person_id = v_me)) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Assigning another coach requires a navigator or admin.');
  end if;
  -- target must actually be a coach/navigator
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
    if not v_is_admin then
      return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
        'message', 'They are already connected with another coach.');
    end if;
    update recoveryos.coaching_relationships
      set status = 'transferred', ended_at = current_date, end_reason = coalesce(p_reason,'transferred'), updated_at = now()
      where id = v_cur.id;
  end if;

  v_source := case when v_is_admin and p_coach_person_id <> v_me then 'admin_assign'
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

-- --------------------------------------------------------------------------
-- accept_booking_proposal — server-authoritative confirm; creates the appointment,
-- closes competing proposals, idempotent on double-tap.
-- --------------------------------------------------------------------------
create or replace function recoveryos.accept_booking_proposal(p_proposal_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_prop recoveryos.booking_proposals%rowtype;
  v_bk recoveryos.booking_requests%rowtype;
  v_appt_id bigint;
  v_ends timestamptz;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;

  select * into v_prop from recoveryos.booking_proposals where id = p_proposal_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  select * into v_bk from recoveryos.booking_requests where id = v_prop.booking_request_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  if v_me not in (v_bk.participant_person_id, coalesce(v_bk.provider_person_id, -1))
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  -- the acceptor must be the OTHER party from the proposer (you can't accept your own proposal)
  if v_prop.proposed_by_person_id = v_me and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'own_proposal',
      'message', 'Wait for the other person to accept, or offer a different time.');
  end if;

  -- Idempotent double-tap: already confirmed at this time.
  if v_bk.status = 'confirmed' and v_bk.appointment_id is not null then
    if exists (select 1 from recoveryos.appointments a where a.id = v_bk.appointment_id and a.starts_at = v_prop.proposed_start) then
      return jsonb_build_object('ok', true, 'code', 'already_confirmed', 'appointment_id', v_bk.appointment_id);
    end if;
    return jsonb_build_object('ok', false, 'code', 'confirmed_other_time',
      'message', 'This booking was already confirmed for another time.');
  end if;
  if v_bk.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'not_open');
  end if;
  if not v_prop.is_active then
    return jsonb_build_object('ok', false, 'code', 'stale_proposal',
      'message', 'That time is no longer on offer — take a look at the latest times.');
  end if;
  if v_bk.provider_person_id is null then
    return jsonb_build_object('ok', false, 'code', 'no_provider',
      'message', 'A coach needs to be on this booking before a time can be confirmed.');
  end if;

  v_ends := v_prop.proposed_start + make_interval(mins => v_bk.duration_minutes);

  insert into recoveryos.appointments
    (person_id, provider_person_id, service_type_id, title, starts_at, ends_at, status,
     organization_id, program_id, modality, timezone,
     requested_by_person_id, confirmed_by_person_id, confirmed_at,
     booking_request_id, support_request_id, coaching_relationship_id, legacy_ref)
  values
    (v_bk.participant_person_id, v_bk.provider_person_id, v_bk.service_type_id,
     'Coaching session', v_prop.proposed_start, v_ends, 'confirmed',
     1, 1, v_bk.modality, 'America/Chicago',
     v_bk.initiated_by_person_id, v_me, now(),
     v_bk.id, v_bk.support_request_id, v_bk.coaching_relationship_id, null)
  returning id into v_appt_id;

  update recoveryos.booking_requests set status='confirmed', appointment_id=v_appt_id where id=v_bk.id;
  update recoveryos.booking_proposals set is_active=false where booking_request_id=v_bk.id;
  update recoveryos.booking_proposals set accepted=true where id=p_proposal_id;

  -- advance the linked support_request
  if v_bk.support_request_id is not null then
    update recoveryos.support_requests set status='scheduled', last_actor_person_id=v_me
      where id = v_bk.support_request_id and status not in ('resolved','closed','cancelled');
  end if;

  return jsonb_build_object('ok', true, 'code', 'confirmed', 'appointment_id', v_appt_id);
end $$;

revoke execute on function
  recoveryos.claim_support_request(bigint),
  recoveryos.assign_participant_coach(bigint, bigint, text),
  recoveryos.accept_booking_proposal(bigint)
  from public, anon;
grant execute on function
  recoveryos.claim_support_request(bigint),
  recoveryos.assign_participant_coach(bigint, bigint, text),
  recoveryos.accept_booking_proposal(bigint)
  to authenticated;

commit;
