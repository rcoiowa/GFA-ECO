-- P0.3-P0.5 TRANSACTIONAL INTEGRITY for the Grace Coaching prototype layer.
-- Authored, applied live (migration name `coaching_engine_p0_rpcs`) and committed
-- in the same remediation session, 2026-08-07. Prototype layer (public schema) —
-- lives under docs/migration/recovered/, not the canonical recoveryos chain.
--
-- Replaces the three multi-statement browser workflows with atomic SECURITY
-- DEFINER RPCs, and makes the reminder lifecycle idempotent across reschedule:
--
--   P0.3 claim_coaching_request(p_request_id)
--        lock request -> verify open+unclaimed -> create/verify assignment ->
--        claim -> commit as one transaction. Graceful jsonb domain results,
--        never raw SQL errors, idempotent on retry.
--   P0.4 assign_participant_to_coach(p_participant_id, p_coach_id)
--        coach self-claim or admin/navigator assign+transfer: deactivate old and
--        activate new in ONE transaction (no unassigned window), history kept.
--   P0.5 accept_session_proposal(p_request_id, p_selected_time)
--        lock -> verify state -> verify the time is actually in the live
--        proposal set for the caller's side -> confirm once. Double-tap of the
--        same time returns ok idempotently; competing proposals die with the
--        status change (single-row negotiation model).
--
--   Reminder idempotency: partial unique (session_request_id, kind) on unsent
--   rows; confirm trigger now clears unsent reminders before reseeding, so a
--   reschedule (re-confirm) replaces stale reminder times instead of stacking,
--   and cancellation is already inert (sweep only fires while status =
--   'confirmed').
--
--   Server-authoritative confirm: a BEFORE UPDATE/INSERT guard rejects any
--   client-side transition INTO 'confirmed' that did not come through
--   accept_session_proposal (session flag app.coaching_rpc), and blocks
--   participants from moving coach_id on UPDATE. Other single-row transitions
--   (cancel, counter-propose, propose, complete) remain direct table writes
--   on purpose — they are single-invariant, single-row actions.
--
-- ROLLBACK: drop the three functions, drop trigger trg_v2_aa_transition_guard
-- and function v2_session_request_guard(), drop index
-- v2_session_reminders_pending_once, and re-create v2_on_session_confirmed
-- from docs/migration/recovered/20260807090611_..._triggers.sql.

begin;

-- ---------------------------------------------------------------------------
-- Reminder idempotency
-- ---------------------------------------------------------------------------
-- One pending reminder per (request, kind). Sent rows are history and may
-- repeat per kind across reschedules.
create unique index if not exists v2_session_reminders_pending_once
  on public.v2_session_reminders (session_request_id, kind)
  where sent_at is null;

-- Re-create the confirm trigger with reschedule-safe reminder seeding.
create or replace function public.v2_on_session_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_room text;
  v_coach_name text;
  v_part_name text;
begin
  if new.status = 'confirmed' and (old.status is distinct from 'confirmed') and new.scheduled_at is not null then
    new.confirmed_at := now();

    if new.meeting_url is null and new.coach_id is not null then
      select r.room_url into v_room
      from coach_meeting_rooms r
      join auth.users u on lower(u.email) = lower(r.coach_email)
      where u.id = new.coach_id and r.is_active
      order by r.updated_at desc limit 1;
      if v_room is not null then new.meeting_url := v_room; end if;
    end if;

    -- Reschedule safety: pending reminders for the old time are replaced.
    delete from v2_session_reminders
      where session_request_id = new.id and sent_at is null;

    insert into v2_session_reminders (session_request_id, remind_at, kind)
    select new.id, t.remind_at, t.kind from (values
      (new.scheduled_at - interval '24 hours', 'day_before'),
      (new.scheduled_at - interval '1 hour',  'hour_before'),
      (new.scheduled_at - interval '5 minutes','starting_now')
    ) as t(remind_at, kind)
    where t.remind_at > now()
    on conflict (session_request_id, kind) where sent_at is null do nothing;

    select display_name into v_coach_name from v2_profiles where id = new.coach_id;
    select display_name into v_part_name  from v2_profiles where id = new.participant_id;

    insert into v2_notifications (recipient_id, kind, title, body, link_path) values
      (new.participant_id, 'session_confirmed', 'Session confirmed',
       'Your ' || replace(new.session_type,'_',' ') || ' session with ' || coalesce(v_coach_name,'your coach') ||
       ' is set for ' || to_char(new.scheduled_at at time zone 'America/Chicago','Dy Mon DD at HH12:MI AM') || ' (Central). The join link is on your Upcoming Sessions.',
       '/sessions'),
      (new.coach_id, 'session_confirmed', 'Session confirmed',
       'Session with ' || coalesce(v_part_name,'participant') || ' confirmed for ' ||
       to_char(new.scheduled_at at time zone 'America/Chicago','Dy Mon DD at HH12:MI AM') || ' (Central).',
       '/coach/sessions');
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Server-authoritative transitions
-- ---------------------------------------------------------------------------
create or replace function public.v2_session_request_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Service-role / dashboard sessions (no JWT subject) bypass; RPCs set the flag.
  if auth.uid() is null or current_setting('app.coaching_rpc', true) = '1' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status = 'confirmed' then
      raise exception 'Sessions are confirmed through accept_session_proposal';
    end if;
    return new;
  end if;
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    raise exception 'Sessions are confirmed through accept_session_proposal';
  end if;
  if new.coach_id is distinct from old.coach_id
     and coalesce(public.v2_my_role() = any (array['coach','navigator','admin']::v2_role[]), false) is false then
    raise exception 'Coach routing changes require staff';
  end if;
  return new;
end $$;
revoke execute on function public.v2_session_request_guard() from public, anon, authenticated;

drop trigger if exists trg_v2_aa_transition_guard on public.v2_session_requests;
create trigger trg_v2_aa_transition_guard
  before insert or update on public.v2_session_requests
  for each row execute function public.v2_session_request_guard();

-- ---------------------------------------------------------------------------
-- P0.3 — atomic claim
-- ---------------------------------------------------------------------------
create or replace function public.claim_coaching_request(p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_req v2_session_requests%rowtype;
  v_asg v2_coach_assignments%rowtype;
begin
  if coalesce(public.v2_my_role() = any (array['coach','navigator','admin']::v2_role[]), false) is false then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Only coaches can pick up requests.');
  end if;

  select * into v_req from v2_session_requests where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found',
      'message', 'This request is no longer here.');
  end if;
  if v_req.coach_id = auth.uid() then
    return jsonb_build_object('ok', true, 'code', 'already_yours',
      'message', 'They are already with you.');
  end if;
  if v_req.coach_id is not null then
    return jsonb_build_object('ok', false, 'code', 'already_claimed',
      'message', 'Another coach just picked this up. Someone else may still be waiting for support.');
  end if;
  if v_req.status <> 'requested' then
    return jsonb_build_object('ok', false, 'code', 'not_open',
      'message', 'This request is no longer open.');
  end if;

  select * into v_asg
    from v2_coach_assignments
    where participant_id = v_req.participant_id and is_active
    for update;
  if found and v_asg.coach_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
      'message', 'They are already connected with another coach.');
  end if;
  if not found then
    begin
      insert into v2_coach_assignments (participant_id, coach_id, assigned_by, method)
      values (v_req.participant_id, auth.uid(), auth.uid(), 'request_pickup');
    exception when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
        'message', 'They were just connected with another coach.');
    end;
  end if;

  perform set_config('app.coaching_rpc', '1', true);
  update v2_session_requests
     set coach_id = auth.uid(), claimed_at = now(), last_actor = auth.uid()
   where id = p_request_id;

  return jsonb_build_object('ok', true, 'code', 'claimed',
    'message', 'They''re with you now.');
end $$;
revoke execute on function public.claim_coaching_request(uuid) from public, anon;
grant execute on function public.claim_coaching_request(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- P0.4 — atomic assign / transfer
-- ---------------------------------------------------------------------------
create or replace function public.assign_participant_to_coach(p_participant_id uuid, p_coach_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_role v2_role := public.v2_my_role();
  v_is_admin boolean := coalesce(v_role = any (array['navigator','admin']::v2_role[]), false);
  v_asg v2_coach_assignments%rowtype;
  v_had_active boolean := false;
  v_method text;
begin
  if not (v_is_admin or (v_role = 'coach'::v2_role and p_coach_id = auth.uid())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Coaches can connect participants with themselves; assigning others requires a navigator or admin.');
  end if;
  if coalesce((select role from v2_profiles where id = p_coach_id)
              = any (array['coach','navigator','admin']::v2_role[]), false) is false then
    return jsonb_build_object('ok', false, 'code', 'not_a_coach',
      'message', 'That person is not a coach.');
  end if;

  select * into v_asg
    from v2_coach_assignments
    where participant_id = p_participant_id and is_active
    for update;

  if found then
    v_had_active := true;
    if v_asg.coach_id = p_coach_id then
      return jsonb_build_object('ok', true, 'code', 'already_assigned',
        'message', 'They are already connected.');
    end if;
    if not v_is_admin then
      return jsonb_build_object('ok', false, 'code', 'participant_has_coach',
        'message', 'They are already connected with another coach.');
    end if;
    update v2_coach_assignments
       set is_active = false, ended_at = now()
     where id = v_asg.id;
  end if;

  v_method := case
    when v_is_admin and p_coach_id <> auth.uid() then 'admin_assign'
    when v_had_active then 'admin_assign'
    else 'self_claim'
  end;

  begin
    insert into v2_coach_assignments (participant_id, coach_id, assigned_by, method)
    values (p_participant_id, p_coach_id, auth.uid(), v_method);
  exception when unique_violation then
    -- Lost a race with a concurrent claim; the whole transaction rolls back,
    -- so the previous assignment (if any) is untouched.
    return jsonb_build_object('ok', false, 'code', 'conflict',
      'message', 'They were just assigned — refresh to see who is with them.');
  end;

  return jsonb_build_object('ok', true, 'code', 'assigned',
    'message', 'They''re connected.');
end $$;
revoke execute on function public.assign_participant_to_coach(uuid, uuid) from public, anon;
grant execute on function public.assign_participant_to_coach(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- P0.5 — server-authoritative proposal acceptance
-- ---------------------------------------------------------------------------
create or replace function public.accept_session_proposal(p_request_id uuid, p_selected_time timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_req v2_session_requests%rowtype;
  v_side text;
  v_offered boolean;
begin
  if p_selected_time is null then
    return jsonb_build_object('ok', false, 'code', 'no_time',
      'message', 'Pick a time to confirm.');
  end if;

  select * into v_req from v2_session_requests where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found',
      'message', 'This session request is no longer here.');
  end if;

  if auth.uid() = v_req.participant_id then v_side := 'participant';
  elsif auth.uid() = v_req.coach_id then v_side := 'coach';
  elsif coalesce(public.v2_my_role() = any (array['navigator','admin']::v2_role[]), false) then v_side := 'staff';
  else
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'This session belongs to someone else.');
  end if;

  -- Idempotent double-tap / retry.
  if v_req.status = 'confirmed' then
    if v_req.scheduled_at = p_selected_time then
      return jsonb_build_object('ok', true, 'code', 'already_confirmed',
        'message', 'Already confirmed.');
    end if;
    return jsonb_build_object('ok', false, 'code', 'confirmed_other_time',
      'message', 'This session was already confirmed for ' ||
        to_char(v_req.scheduled_at at time zone 'America/Chicago','Dy Mon DD, HH12:MI AM') || ' Central.');
  end if;
  if v_req.status not in ('requested','times_suggested','counter_proposed') then
    return jsonb_build_object('ok', false, 'code', 'not_open',
      'message', 'This request is no longer open for scheduling.');
  end if;
  if v_req.coach_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_claimed',
      'message', 'A coach needs to pick this up before a time can be confirmed.');
  end if;

  -- The selected time must be in the CURRENT proposal set for the caller's side:
  -- participants accept coach-suggested times; coaches accept participant times.
  if v_side = 'participant' then
    v_offered := v_req.status = 'times_suggested' and exists (
      select 1 from jsonb_array_elements_text(v_req.suggested_times) t
      where t.value::timestamptz = p_selected_time);
  elsif v_side = 'coach' then
    v_offered := v_req.status in ('requested','counter_proposed') and exists (
      select 1 from jsonb_array_elements_text(v_req.preferred_times) t
      where t.value::timestamptz = p_selected_time);
  else
    v_offered := exists (
      select 1 from jsonb_array_elements_text(v_req.suggested_times || v_req.preferred_times) t
      where t.value::timestamptz = p_selected_time);
  end if;
  if not coalesce(v_offered, false) then
    return jsonb_build_object('ok', false, 'code', 'time_not_offered',
      'message', 'That time is no longer on offer — take a look at the latest times.');
  end if;

  perform set_config('app.coaching_rpc', '1', true);
  update v2_session_requests
     set status = 'confirmed',
         scheduled_at = p_selected_time,
         confirmed_by = auth.uid(),
         last_actor = auth.uid()
   where id = p_request_id;

  return jsonb_build_object('ok', true, 'code', 'confirmed',
    'message', 'You''re scheduled.');
end $$;
revoke execute on function public.accept_session_proposal(uuid, timestamptz) from public, anon;
grant execute on function public.accept_session_proposal(uuid, timestamptz) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Addendum (applied live as `coaching_engine_trigger_fn_acl`): lock down direct
-- EXECUTE on the trigger/sweep functions so no client can call them directly.
-- Clears the security-definer advisor warnings; no behavior change.
-- ---------------------------------------------------------------------------
revoke execute on function public.v2_on_session_confirmed() from public, anon, authenticated;
revoke execute on function public.v2_on_coach_assigned() from public, anon, authenticated;
revoke execute on function public.v2_on_dm_insert() from public, anon, authenticated;
revoke execute on function public.v2_sweep_session_reminders() from public;
