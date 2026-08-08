-- LAUNCH 0100 — Canonical coaching write surface (final architecture, no transition machinery).
--
-- Curated from dev migrations 0033/0036 with ALL migration scaffolding removed: no
-- write_authority gates (canonical is the only writer by construction), no v2 compatibility
-- projections, no legacy_projection_outbox. Notification generation is wired directly to the
-- domain via exception-safe AFTER triggers — one event source, in-app only.

begin;

-- ---- reschedule lineage on booking_requests --------------------------------------
alter table recoveryos.booking_requests
  add column if not exists reschedule_of_appointment_id bigint references recoveryos.appointments(id);

-- ---- booking write RPCs (SECURITY DEFINER; authority from JWT, never client) ------
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
  if not (
       v_me = p_participant_person_id
    or (v_me = p_provider_person_id and recoveryos.is_support_staff())
    or recoveryos.is_admin_staff()
  ) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
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

create or replace function recoveryos.counter_propose_booking_times(
  p_booking_request_id bigint,
  p_starts timestamptz[]
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
begin
  return recoveryos.propose_booking_times(p_booking_request_id, p_starts);
end $$;
revoke execute on function recoveryos.counter_propose_booking_times(bigint,timestamptz[]) from public, anon;

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
  v_dur int;
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

  v_dur := coalesce((extract(epoch from (v_a.ends_at - v_a.starts_at))/60)::int, 50);
  update recoveryos.appointments set status='rescheduled', updated_at=now() where id=v_a.id;

  insert into recoveryos.booking_requests
    (support_request_id, participant_person_id, provider_person_id, coaching_relationship_id,
     service_type_id, modality, duration_minutes, status, initiated_by_person_id, note,
     reschedule_of_appointment_id)
  values
    (v_a.support_request_id, v_a.person_id, v_a.provider_person_id, v_a.coaching_relationship_id,
     v_a.service_type_id, v_a.modality, v_dur, 'open', v_me, 'reschedule', v_a.id)
  returning id into v_bk;

  foreach v_start in array coalesce(p_starts, array[]::timestamptz[]) loop
    if v_start > now() then
      insert into recoveryos.booking_proposals
        (booking_request_id, proposed_by_person_id, proposed_start, proposed_end, round, is_active)
      values (v_bk, v_me, v_start, v_start + make_interval(mins => v_dur), 1, true);
      v_n := v_n + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'code', 'reschedule_opened',
    'booking_request_id', v_bk, 'from_appointment_id', v_a.id, 'count', v_n);
end $$;
revoke execute on function recoveryos.reschedule_booking(bigint,timestamptz[]) from public, anon;

-- accept_booking_proposal: the proven one-appointment transaction + reschedule lineage.
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
     rescheduled_from_appointment_id)
  values
    (v_bk.participant_person_id, v_bk.provider_person_id, v_bk.service_type_id,
     'Coaching session', v_prop.proposed_start, v_ends, 'confirmed',
     1, 1, v_bk.modality, 'America/Chicago',
     v_bk.initiated_by_person_id, v_me, now(),
     v_bk.id, v_bk.support_request_id, v_bk.coaching_relationship_id,
     v_bk.reschedule_of_appointment_id)
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

-- ---- canonical in-app notifications: dedup + emitters + domain wiring -------------
alter table recoveryos.notifications add column if not exists dedup_key text;
create unique index if not exists notifications_dedup_key_idx
  on recoveryos.notifications (dedup_key) where dedup_key is not null;

create or replace function recoveryos.emit_notification(
  p_recipient_person_id bigint, p_kind text, p_title text, p_body text, p_link text, p_dedup text
) returns bigint language plpgsql security definer set search_path = recoveryos, public as $$
declare v_id bigint;
begin
  if p_recipient_person_id is null then return null; end if;
  insert into recoveryos.notifications (recipient_person_id, kind, title, body, link_path, dedup_key)
  values (p_recipient_person_id, p_kind, p_title, p_body, p_link, p_dedup)
  on conflict (dedup_key) where dedup_key is not null do nothing
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function recoveryos.emit_notification(bigint,text,text,text,text,text) from public, anon, authenticated;

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
  v_p := recoveryos.emit_notification(v_a.person_id, v_kind, 'Session ' || p_event,
           'Your session is ' || p_event || ' for ' || v_when || ' (Central).', '/sessions',
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
  v_p := recoveryos.emit_notification(v_r.participant_person_id, 'coach_assigned', 'Coach assigned',
           'You have been matched with a recovery coach.', '/coach',
           'rel_assigned:' || v_r.id || ':' || v_r.participant_person_id);
  return jsonb_build_object('ok', true, 'code', 'emitted', 'notification', v_p);
end $$;
revoke execute on function recoveryos.notify_relationship_assigned(bigint) from public, anon, authenticated;

-- Domain wiring: ONE event source, exception-safe (a notify failure never aborts the write).
create or replace function recoveryos.trg_appointment_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
begin
  begin
    if (TG_OP = 'INSERT' and NEW.status = 'confirmed')
       or (TG_OP = 'UPDATE' and NEW.status = 'confirmed' and OLD.status is distinct from 'confirmed') then
      perform recoveryos.notify_appointment_event(NEW.id, 'confirmed');
    elsif TG_OP = 'UPDATE' and NEW.status = 'cancelled' and OLD.status is distinct from 'cancelled' then
      perform recoveryos.notify_appointment_event(NEW.id, 'cancelled');
    elsif TG_OP = 'UPDATE' and NEW.status = 'rescheduled' and OLD.status is distinct from 'rescheduled' then
      perform recoveryos.notify_appointment_event(NEW.id, 'rescheduled');
    end if;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'notify_failed', 'appointments', NEW.id, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_appointment_notify() from public, anon, authenticated;
drop trigger if exists trg_appointment_notify on recoveryos.appointments;
create trigger trg_appointment_notify
  after insert or update on recoveryos.appointments
  for each row execute function recoveryos.trg_appointment_notify();

create or replace function recoveryos.trg_relationship_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
begin
  begin
    if (TG_OP = 'INSERT' and NEW.status = 'active')
       or (TG_OP = 'UPDATE' and NEW.status = 'active' and OLD.status is distinct from 'active') then
      perform recoveryos.notify_relationship_assigned(NEW.id);
    end if;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'notify_failed', 'coaching_relationships', NEW.id, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_relationship_notify() from public, anon, authenticated;
drop trigger if exists trg_relationship_notify on recoveryos.coaching_relationships;
create trigger trg_relationship_notify
  after insert or update on recoveryos.coaching_relationships
  for each row execute function recoveryos.trg_relationship_notify();

commit;
