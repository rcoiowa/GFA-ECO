-- RecoveryOS Scheduling Write Domain (P3C-B1/B1b). Applied live as
-- recoveryos_0033_scheduling_write_domain. Completes the booking+appointment canonical
-- write machinery as ONE transaction domain, adds the atomic scheduling authority switch,
-- the dormant canonical->v2 scheduling compatibility projection, and — the key guardrail —
-- a durable CRITICAL outbox so a confirmed canonical appointment can never silently diverge
-- from the legacy UI: a compat failure is recorded and retryable, never swallowed.
--
-- NOTHING is flipped here. bookings + appointments remain authority='v2'. The compat
-- projection and its trigger are dormant until set_scheduling_write_authority('canonical').
-- accept_booking_proposal already enforces the one-appointment invariant (P2) and is only
-- extended here to carry reschedule lineage.

begin;

-- ============================================================================
-- 1. SCHEDULING WRITE AUTHORITY (bookings + appointments move together — §9)
-- ============================================================================
-- Getter returns 'canonical' ONLY if BOTH domains agree; any disagreement or absence is
-- treated as 'v2' (safe). The setter is the only supported way to change them, and it always
-- sets both, so a split state (bookings=canonical, appointments=v2) cannot arise via the API.
create or replace function recoveryos.scheduling_write_authority()
returns text language sql stable security definer set search_path = recoveryos, public as $$
  select case
    when recoveryos.write_authority_of('bookings') = 'canonical'
     and recoveryos.write_authority_of('appointments') = 'canonical'
    then 'canonical' else 'v2' end;
$$;

create or replace function recoveryos.set_scheduling_write_authority(p_authority text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
begin
  if p_authority not in ('v2','canonical') then
    return jsonb_build_object('ok', false, 'code', 'bad_authority');
  end if;
  update recoveryos.write_authority set authority = p_authority, updated_at = now()
    where domain in ('bookings','appointments');
  update recoveryos.migration_state
    set stage = case when p_authority='canonical' then 'CANONICAL_WRITE' else 'CANONICAL_READ' end,
        notes = 'scheduling write_authority=' || p_authority || ' (set_scheduling_write_authority ' || now()::text || ')'
    where domain in ('bookings','appointments');
  return jsonb_build_object('ok', true, 'code', 'set', 'authority', p_authority,
    'domains', jsonb_build_array('bookings','appointments'));
end $$;
revoke execute on function recoveryos.set_scheduling_write_authority(text) from public, anon, authenticated;

-- ============================================================================
-- 2. LEGACY PROJECTION OUTBOX (§31/§32 — CRITICAL user-visible compatibility)
-- ============================================================================
create table if not exists recoveryos.legacy_projection_outbox (
  id            bigint generated always as identity primary key,
  domain        text not null,
  canonical_id  bigint not null,
  event_type    text not null,
  legacy_target text not null,
  criticality   text not null default 'CRITICAL_USER_VISIBLE'
                 check (criticality in ('NONCRITICAL','CRITICAL_USER_VISIBLE')),
  status        text not null default 'open'
                 check (status in ('open','done','failed')),
  attempts      int not null default 0,
  last_error    text,
  next_attempt_at timestamptz,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index if not exists lpo_pending_idx on recoveryos.legacy_projection_outbox (status, next_attempt_at)
  where status <> 'done';
alter table recoveryos.legacy_projection_outbox enable row level security;
drop policy if exists lpo_admin_select on recoveryos.legacy_projection_outbox;
create policy lpo_admin_select on recoveryos.legacy_projection_outbox for select to authenticated
  using (recoveryos.is_admin_staff());

-- ============================================================================
-- 3. RESCHEDULE LINEAGE — carry the prior appointment id on the booking request
-- ============================================================================
alter table recoveryos.booking_requests
  add column if not exists reschedule_of_appointment_id bigint references recoveryos.appointments(id);

-- ============================================================================
-- 4. BOOKING WRITE RPCs (SECURITY DEFINER; authority derived from JWT, never client)
-- ============================================================================

-- create_booking_request: participant-initiated OR coach-initiated (staff), admin allowed.
-- Requires an active coaching relationship between participant and provider (unless admin).
create or replace function recoveryos.create_booking_request(
  p_participant_person_id bigint,
  p_provider_person_id    bigint,
  p_support_request_id    bigint,
  p_service_type_id       bigint,
  p_modality              text,
  p_duration_minutes      int,
  p_note                  text,
  p_starts                timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel bigint;
  v_bk bigint;
  v_start timestamptz;
  v_dur int := coalesce(p_duration_minutes, 50);
  v_mod recoveryos.service_modality := coalesce(p_modality,'video')::recoveryos.service_modality;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  -- authorization: caller is the participant, or the provider (must be staff), or admin
  if not (
       v_me = p_participant_person_id
    or (v_me = p_provider_person_id and recoveryos.is_support_staff())
    or recoveryos.is_admin_staff()
  ) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  -- validate an active scheduling relationship exists (unless admin overriding)
  if p_provider_person_id is not null then
    select id into v_rel from recoveryos.coaching_relationships
      where participant_person_id = p_participant_person_id
        and coach_person_id = p_provider_person_id
        and status = 'active'
      order by is_primary desc limit 1;
    if v_rel is null and not recoveryos.is_admin_staff() then
      return jsonb_build_object('ok', false, 'code', 'no_relationship',
        'message', 'A coaching relationship is needed before a session can be booked.');
    end if;
  end if;

  insert into recoveryos.booking_requests
    (support_request_id, participant_person_id, provider_person_id, coaching_relationship_id,
     service_type_id, modality, duration_minutes, status, initiated_by_person_id, note)
  values
    (p_support_request_id, p_participant_person_id, p_provider_person_id, v_rel,
     coalesce(p_service_type_id, 1), v_mod, v_dur, 'open', v_me, nullif(p_note,''))
  returning id into v_bk;

  if p_starts is not null then
    foreach v_start in array p_starts loop
      if v_start > now() then
        insert into recoveryos.booking_proposals
          (booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active)
        values (v_bk, v_me, v_start, v_start + make_interval(mins => v_dur), 1, true);
      end if;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'code', 'created', 'booking_request_id', v_bk);
end $$;
revoke execute on function recoveryos.create_booking_request(bigint,bigint,bigint,bigint,text,int,text,timestamptz[]) from public, anon;

-- propose_booking_times: add a new active round of proposals; supersede the prior active set
-- (history preserved via round + is_active). Used for both proposals and counterproposals.
create or replace function recoveryos.propose_booking_times(
  p_booking_request_id bigint,
  p_starts timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_bk recoveryos.booking_requests%rowtype;
  v_round int;
  v_start timestamptz;
  v_n int := 0;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_bk from recoveryos.booking_requests where id = p_booking_request_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_me not in (v_bk.participant_person_id, coalesce(v_bk.provider_person_id,-1))
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_bk.status <> 'open' then return jsonb_build_object('ok', false, 'code', 'not_open'); end if;

  select coalesce(max(round),0)+1 into v_round from recoveryos.booking_proposals where booking_request_id = v_bk.id;
  update recoveryos.booking_proposals set is_active = false where booking_request_id = v_bk.id and is_active;

  foreach v_start in array coalesce(p_starts, array[]::timestamptz[]) loop
    if v_start > now() then
      insert into recoveryos.booking_proposals
        (booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active)
      values (v_bk.id, v_me, v_start, v_start + make_interval(mins => v_bk.duration_minutes), v_round, true);
      v_n := v_n + 1;
    end if;
  end loop;
  if v_n = 0 then return jsonb_build_object('ok', false, 'code', 'no_valid_times',
    'message', 'Add at least one future time.'); end if;

  return jsonb_build_object('ok', true, 'code', 'proposed', 'round', v_round, 'count', v_n);
end $$;
revoke execute on function recoveryos.propose_booking_times(bigint,timestamptz[]) from public, anon;

-- counter_propose_booking_times: same transaction semantics as propose (round increments).
create or replace function recoveryos.counter_propose_booking_times(
  p_booking_request_id bigint,
  p_starts timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
begin
  return recoveryos.propose_booking_times(p_booking_request_id, p_starts);
end $$;
revoke execute on function recoveryos.counter_propose_booking_times(bigint,timestamptz[]) from public, anon;

-- cancel_booking: cancel the request + any confirmed appointment; deactivate proposals.
create or replace function recoveryos.cancel_booking(
  p_booking_request_id bigint,
  p_reason text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_bk recoveryos.booking_requests%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_bk from recoveryos.booking_requests where id = p_booking_request_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_me not in (v_bk.participant_person_id, coalesce(v_bk.provider_person_id,-1))
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  update recoveryos.booking_requests set status='cancelled', updated_at=now() where id=v_bk.id;
  update recoveryos.booking_proposals set is_active=false where booking_request_id=v_bk.id and is_active;
  if v_bk.appointment_id is not null then
    update recoveryos.appointments
      set status='cancelled', cancelled_at=now(), cancellation_reason=nullif(p_reason,''), updated_at=now()
      where id=v_bk.appointment_id and status not in ('completed','cancelled');
  end if;
  return jsonb_build_object('ok', true, 'code', 'cancelled', 'booking_request_id', v_bk.id);
end $$;
revoke execute on function recoveryos.cancel_booking(bigint,text) from public, anon;

-- reschedule_booking: preserve history — mark the current appointment 'rescheduled' and open a
-- NEW booking request whose eventual appointment links back via rescheduled_from_appointment_id.
create or replace function recoveryos.reschedule_booking(
  p_appointment_id bigint,
  p_starts timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.appointments%rowtype;
  v_bk bigint;
  v_start timestamptz;
  v_n int := 0;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_a from recoveryos.appointments where id = p_appointment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_me not in (v_a.person_id, coalesce(v_a.provider_person_id,-1))
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_a.status not in ('scheduled','confirmed') then
    return jsonb_build_object('ok', false, 'code', 'not_reschedulable'); end if;

  update recoveryos.appointments set status='rescheduled', updated_at=now() where id=v_a.id;

  insert into recoveryos.booking_requests
    (support_request_id, participant_person_id, provider_person_id, coaching_relationship_id,
     service_type_id, modality, duration_minutes, status, initiated_by_person_id, note,
     reschedule_of_appointment_id)
  values
    (v_a.support_request_id, v_a.person_id, v_a.provider_person_id, v_a.coaching_relationship_id,
     v_a.service_type_id, v_a.modality,
     coalesce((extract(epoch from (v_a.ends_at - v_a.starts_at))/60)::int, 50),
     'open', v_me, 'reschedule', v_a.id)
  returning id into v_bk;

  foreach v_start in array coalesce(p_starts, array[]::timestamptz[]) loop
    if v_start > now() then
      insert into recoveryos.booking_proposals
        (booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active)
      values (v_bk, v_me, v_start,
        v_start + make_interval(mins => coalesce((extract(epoch from (v_a.ends_at - v_a.starts_at))/60)::int, 50)), 1, true);
      v_n := v_n + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'code', 'reschedule_opened',
    'booking_request_id', v_bk, 'from_appointment_id', v_a.id, 'count', v_n);
end $$;
revoke execute on function recoveryos.reschedule_booking(bigint,timestamptz[]) from public, anon;

-- ============================================================================
-- 5. accept_booking_proposal — re-created verbatim (P2 logic) + reschedule lineage only
-- ============================================================================
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

  if v_me not in (v_bk.participant_person_id, coalesce(v_bk.provider_person_id, -1)) and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized'); end if;
  if v_prop.proposed_by_person_id = v_me and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'own_proposal',
      'message', 'Wait for the other person to accept, or offer a different time.'); end if;

  if v_bk.status = 'confirmed' and v_bk.appointment_id is not null then
    if exists (select 1 from recoveryos.appointments a where a.id = v_bk.appointment_id and a.starts_at = v_prop.proposed_start) then
      return jsonb_build_object('ok', true, 'code', 'already_confirmed', 'appointment_id', v_bk.appointment_id); end if;
    return jsonb_build_object('ok', false, 'code', 'confirmed_other_time',
      'message', 'This booking was already confirmed for another time.'); end if;
  if v_bk.status <> 'open' then return jsonb_build_object('ok', false, 'code', 'not_open'); end if;
  if not v_prop.is_active then
    return jsonb_build_object('ok', false, 'code', 'stale_proposal',
      'message', 'That time is no longer on offer — take a look at the latest times.'); end if;
  if v_bk.provider_person_id is null then
    return jsonb_build_object('ok', false, 'code', 'no_provider',
      'message', 'A coach needs to be on this booking before a time can be confirmed.'); end if;

  v_ends := v_prop.proposed_start + make_interval(mins => v_bk.duration_minutes);

  insert into recoveryos.appointments
    (person_id, provider_person_id, service_type_id, title, starts_at, ends_at, status,
     organization_id, program_id, modality, timezone,
     requested_by_person_id, confirmed_by_person_id, confirmed_at,
     booking_request_id, support_request_id, coaching_relationship_id,
     rescheduled_from_appointment_id, legacy_ref)
  values
    (v_bk.participant_person_id, v_bk.provider_person_id, v_bk.service_type_id,
     'Coaching session', v_prop.proposed_start, v_ends, 'confirmed',
     1, 1, v_bk.modality, 'America/Chicago',
     v_bk.initiated_by_person_id, v_me, now(),
     v_bk.id, v_bk.support_request_id, v_bk.coaching_relationship_id,
     v_bk.reschedule_of_appointment_id, null)
  returning id into v_appt_id;

  update recoveryos.booking_requests set status='confirmed', appointment_id=v_appt_id where id=v_bk.id;
  update recoveryos.booking_proposals set is_active=false where booking_request_id=v_bk.id;
  update recoveryos.booking_proposals set accepted=true where id=p_proposal_id;

  if v_bk.support_request_id is not null then
    update recoveryos.support_requests set status='scheduled', last_actor_person_id=v_me
      where id = v_bk.support_request_id and status not in ('resolved','closed','cancelled');
  end if;

  return jsonb_build_object('ok', true, 'code', 'confirmed', 'appointment_id', v_appt_id);
end $$;

-- ============================================================================
-- 6. Defensive anti-circular: short-circuit the inbound v2->canonical session projection
--    whenever the write originates from our compat projection (app.compat_projection='1').
--    Body otherwise identical to 0032 (authority-gated portions preserved).
-- ============================================================================
create or replace function recoveryos.project_v2_session_request()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_person bigint; v_coach bigint; v_status text; v_sr_id bigint;
begin
  if current_setting('app.compat_projection', true) = '1' then return NEW; end if;
  begin
    v_person := recoveryos.person_for_v2(NEW.participant_id);
    if v_person is null then return NEW; end if;
    if recoveryos.write_authority_of('support_requests') = 'v2' then
      v_status := case NEW.status
        when 'requested' then 'open' when 'times_suggested' then 'open' when 'counter_proposed' then 'open'
        when 'confirmed' then 'scheduled' when 'completed' then 'resolved' when 'cancelled' then 'cancelled' else 'open' end;
      insert into recoveryos.support_requests
        (person_id, service_type_id, request_type, focus, preferred_modality, status,
         delivery_context, organization_id, program_id, legacy_ref, created_at)
      values (v_person,
        (select id from recoveryos.service_types where key = case NEW.session_type
           when 'recovery_coach' then 'coaching_session' when 'life_coach' then 'coaching_session'
           when 'peer_support' then 'peer_support' when 'navigation' then 'navigation'
           when 'needs_assessment' then 'support_request' else 'coaching_session' end),
        NEW.session_type, nullif(NEW.topic,''), NEW.mode::text::recoveryos.service_modality, v_status,
        'vrcc', 1, 1, NEW.id, NEW.created_at)
      on conflict (legacy_ref) where legacy_ref is not null
        do update set status = excluded.status, focus = excluded.focus, updated_at = now()
      returning id into v_sr_id;
    end if;
    if NEW.status = 'confirmed' and NEW.scheduled_at is not null
       and recoveryos.write_authority_of('appointments') = 'v2' then
      v_coach := recoveryos.person_for_v2(NEW.coach_id);
      if v_coach is not null then
        insert into recoveryos.appointments
          (person_id, provider_person_id, title, starts_at, status, organization_id, program_id,
           modality, meeting_url, timezone, confirmed_at, support_request_id, legacy_ref)
        values (v_person, v_coach, 'Coaching session', NEW.scheduled_at, 'confirmed', 1, 1,
           NEW.mode::text::recoveryos.service_modality, NEW.meeting_url, 'America/Chicago',
           NEW.confirmed_at, coalesce(v_sr_id, (select id from recoveryos.support_requests where legacy_ref = NEW.id)), NEW.id)
        on conflict (legacy_ref) where legacy_ref is not null
          do update set starts_at = excluded.starts_at, status = excluded.status,
             meeting_url = excluded.meeting_url, updated_at = now();
      end if;
    end if;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('projection_support_request', 1, jsonb_build_object('sqlerrm', sqlerrm, 'legacy_ref', NEW.id));
  end;
  return NEW;
end $$;

-- ============================================================================
-- 7. CANONICAL -> v2 SCHEDULING COMPATIBILITY (composes v2_session_requests) — §10-§12
--    Dormant: driven only by the appointments trigger when scheduling authority='canonical'.
--    Sets app.coaching_rpc (bypass v2 transition guard) + app.compat_projection (anti-circular).
--    Idempotency key: v2_session_requests.client_ref = 'canon:appt:<id>'.
-- ============================================================================
create or replace function recoveryos.compat_scheduling_to_v2(p_appointment_id bigint)
returns void language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_a recoveryos.appointments%rowtype;
  v_part uuid; v_coach uuid;
  v_mode text; v_status text; v_stype text;
  v_ref text;
  v_existing bigint;
begin
  perform set_config('app.coaching_rpc', '1', true);
  perform set_config('app.compat_projection', '1', true);

  select * into v_a from recoveryos.appointments where id = p_appointment_id;
  if not found then raise exception 'appointment % not found', p_appointment_id; end if;

  v_part := recoveryos.v2_for_person(v_a.person_id);
  v_coach := recoveryos.v2_for_person(v_a.provider_person_id);
  if v_part is null then raise exception 'no v2 identity for participant person %', v_a.person_id; end if;

  -- modality: only video/phone/in_person exist in v2_session_mode; everything else -> video
  v_mode := case v_a.modality::text when 'video' then 'video' when 'phone' then 'phone'
                                    when 'in_person' then 'in_person' else 'video' end;
  v_status := case v_a.status
    when 'confirmed'  then 'confirmed'
    when 'scheduled'  then 'confirmed'
    when 'completed'  then 'completed'
    when 'cancelled'  then 'cancelled'
    when 'rescheduled' then 'cancelled'  -- the superseded row; the new appt gets its own confirmed row
    else 'confirmed' end;
  v_stype := coalesce((select key from recoveryos.service_types where id = v_a.service_type_id), 'recovery_coach');
  v_stype := case v_stype when 'coaching_session' then 'recovery_coach'
                          when 'peer_support' then 'peer_support'
                          when 'navigation' then 'navigation' else 'recovery_coach' end;
  v_ref := 'canon:appt:' || v_a.id;

  select id into v_existing from public.v2_session_requests where client_ref = v_ref;

  if v_existing is not null then
    update public.v2_session_requests set
      status = v_status::v2_session_status,
      scheduled_at = v_a.starts_at,
      coach_id = v_coach,
      mode = v_mode::v2_session_mode,
      meeting_url = coalesce(v_a.meeting_url, meeting_url),
      confirmed_by = v_coach,
      last_actor = v_coach,
      updated_at = now()
    where id = v_existing;
  else
    insert into public.v2_session_requests
      (participant_id, coach_id, status, mode, topic, session_type,
       preferred_times, suggested_times, scheduled_at, meeting_url, confirmed_by, last_actor, client_ref)
    values
      (v_part, v_coach, v_status::v2_session_status, v_mode::v2_session_mode, '', v_stype,
       '[]'::jsonb, '[]'::jsonb, v_a.starts_at, v_a.meeting_url, v_coach, v_coach, v_ref);
  end if;
end $$;
revoke execute on function recoveryos.compat_scheduling_to_v2(bigint) from public, anon, authenticated;

-- Trigger: enqueue CRITICAL outbox row, then attempt compat. On failure, record durable degraded
-- state (never re-raise -> the canonical appointment write still commits). §31/§32 guardrail.
create or replace function recoveryos.trg_scheduling_compat()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_out bigint;
begin
  if recoveryos.scheduling_write_authority() <> 'canonical' then return NEW; end if;
  insert into recoveryos.legacy_projection_outbox
    (domain, canonical_id, event_type, legacy_target, criticality, status, attempts)
  values ('scheduling', NEW.id, TG_OP || ':' || NEW.status, 'v2_session_requests',
          'CRITICAL_USER_VISIBLE', 'open', 0)
  returning id into v_out;
  begin
    perform recoveryos.compat_scheduling_to_v2(NEW.id);
    update recoveryos.legacy_projection_outbox
      set status='done', completed_at=now(), attempts=attempts+1 where id=v_out;
  exception when others then
    update recoveryos.legacy_projection_outbox
      set status='failed', attempts=attempts+1, last_error=sqlerrm,
          next_attempt_at=now() + interval '1 minute' where id=v_out;
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_scheduling_compat() from public, anon, authenticated;
drop trigger if exists trg_scheduling_compat on recoveryos.appointments;
create trigger trg_scheduling_compat
  after insert or update on recoveryos.appointments
  for each row execute function recoveryos.trg_scheduling_compat();

-- Retry processor for failed/open CRITICAL outbox rows (admin/service/cron only).
create or replace function recoveryos.process_legacy_projection_outbox(p_limit int default 50)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare r record; v_done int := 0; v_fail int := 0;
begin
  for r in
    select id, canonical_id from recoveryos.legacy_projection_outbox
    where domain='scheduling' and status in ('open','failed')
      and (next_attempt_at is null or next_attempt_at <= now())
    order by created_at limit p_limit
    for update skip locked
  loop
    begin
      perform recoveryos.compat_scheduling_to_v2(r.canonical_id);
      update recoveryos.legacy_projection_outbox
        set status='done', completed_at=now(), attempts=attempts+1 where id=r.id;
      v_done := v_done + 1;
    exception when others then
      update recoveryos.legacy_projection_outbox
        set status='failed', attempts=attempts+1, last_error=sqlerrm,
            next_attempt_at=now() + (interval '1 minute' * least(attempts+1, 10)) where id=r.id;
      v_fail := v_fail + 1;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'processed', v_done, 'failed', v_fail);
end $$;
revoke execute on function recoveryos.process_legacy_projection_outbox(int) from public, anon, authenticated;

commit;
notify pgrst, 'reload schema';
