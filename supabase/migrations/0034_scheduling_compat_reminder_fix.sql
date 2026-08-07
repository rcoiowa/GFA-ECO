-- RecoveryOS Scheduling Compat — reminder-bridge fix (P3C-B1b). Applied live as
-- recoveryos_0034_scheduling_compat_reminder_fix.
--
-- The v2 reminder engine seeds v2_session_reminders from public.v2_on_session_confirmed, which
-- is a BEFORE UPDATE trigger firing only on the transition old.status <> 'confirmed' ->
-- new.status = 'confirmed'. compat_scheduling_to_v2 (0033) inserted the v2 row already at
-- 'confirmed', so on a canonical-native (canary) booking the transition never occurred and no
-- reminders were seeded. Fix: insert a non-confirmed placeholder, then UPDATE to the final
-- status so the confirm transition fires exactly once. Idempotent re-runs (row already
-- 'confirmed') update confirmed->confirmed, which the trigger ignores -> no duplicate reminders.

begin;

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

  v_mode := case v_a.modality::text when 'video' then 'video' when 'phone' then 'phone'
                                    when 'in_person' then 'in_person' else 'video' end;
  v_status := case v_a.status
    when 'confirmed'  then 'confirmed'
    when 'scheduled'  then 'confirmed'
    when 'completed'  then 'completed'
    when 'cancelled'  then 'cancelled'
    when 'rescheduled' then 'cancelled'
    else 'confirmed' end;
  v_stype := coalesce((select key from recoveryos.service_types where id = v_a.service_type_id), 'recovery_coach');
  v_stype := case v_stype when 'coaching_session' then 'recovery_coach'
                          when 'peer_support' then 'peer_support'
                          when 'navigation' then 'navigation' else 'recovery_coach' end;
  v_ref := 'canon:appt:' || v_a.id;

  select id into v_existing from public.v2_session_requests where client_ref = v_ref;

  -- New canonical-native row: insert a non-confirmed placeholder so the subsequent UPDATE
  -- into 'confirmed' produces the transition the v2 reminder trigger requires.
  if v_existing is null then
    insert into public.v2_session_requests
      (participant_id, coach_id, status, mode, topic, session_type,
       preferred_times, suggested_times, scheduled_at, client_ref)
    values
      (v_part, v_coach, 'accepted'::v2_session_status, v_mode::v2_session_mode, '', v_stype,
       '[]'::jsonb, '[]'::jsonb, v_a.starts_at, v_ref)
    returning id into v_existing;
  end if;

  update public.v2_session_requests set
    status       = v_status::v2_session_status,   -- accepted -> confirmed fires reminder seeding
    scheduled_at = v_a.starts_at,
    coach_id     = v_coach,
    mode         = v_mode::v2_session_mode,
    meeting_url  = coalesce(v_a.meeting_url, meeting_url),
    confirmed_by = v_coach,
    last_actor   = v_coach,
    updated_at   = now()
  where id = v_existing;
end $$;
revoke execute on function recoveryos.compat_scheduling_to_v2(bigint) from public, anon, authenticated;

commit;
notify pgrst, 'reload schema';
