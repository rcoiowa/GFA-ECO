-- 0114_navigator_follow_ups.sql — P4E: follow-ups for navigation relationships,
-- and the same is_admin_staff over-reach fix 0113 applied elsewhere.
--
-- 0108's create_follow_up authorized only active COACHING relationships, so a
-- navigator could not commit to following up with their own participant; and its
-- admin fallback used is_admin_staff() (which includes navigators and program
-- managers), so any navigator could create follow-ups for ANY participant.
-- Corrected: an active coaching OR navigation relationship with the person, or
-- platform admin. Completion (complete_follow_up) is assignee-scoped and needs
-- no change.

create or replace function recoveryos.create_follow_up(
  p_person_id bigint,
  p_due_at timestamptz,
  p_follow_up_type text,
  p_note text default null,
  p_appointment_id bigint default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin()
     and not exists (
       select 1 from recoveryos.coaching_relationships
       where coach_person_id = v_me and participant_person_id = p_person_id and status = 'active')
     and not exists (
       select 1 from recoveryos.navigation_relationships
       where navigator_person_id = v_me and participant_person_id = p_person_id and status = 'active')
  then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_due_at is null or p_due_at < now() - interval '1 day' then
    return jsonb_build_object('ok', false, 'code', 'bad_due_time');
  end if;
  insert into recoveryos.follow_ups
    (person_id, assigned_person_id, appointment_id, follow_up_type, due_at, status, note, created_by_person_id)
  values (p_person_id, v_me, p_appointment_id, coalesce(nullif(trim(p_follow_up_type), ''), 'check_in'),
          p_due_at, 'open', nullif(trim(coalesce(p_note, '')), ''), v_me)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'code', 'created', 'follow_up_id', v_id);
end $$;
