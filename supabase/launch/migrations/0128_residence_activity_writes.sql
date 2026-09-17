-- 0128_residence_activity_writes.sql — P0.5-C: meetings, attendance, and chore assignment
-- become recordable.
--
-- The tables have existed since 0006 with read paths and NARR auto-evidence triggers, but no
-- UI or client write path ever existed — so supervision and Exhibit E "house meetings
-- attended/expected" were structurally 0/0 and resident chore cards were permanently empty.
--
-- Posture (0115 conventions, unchanged): RPC-only writes — no client table write policies are
-- added; SECURITY DEFINER, search_path pinned, staff-of-residence authorization via
-- staff_residence_ids(), {ok, code} envelopes, revoke from public/anon + grant to
-- authenticated. The existing 0017 NARR auto-evidence triggers fire on these inserts and, per
-- 0126, claim MET with an evidence line but never verification.
--
-- ROLLBACK: drop function recoveryos.record_meeting(bigint,text,timestamptz,boolean,text);
--           drop function recoveryos.record_meeting_attendance(bigint,bigint,text);
--           drop function recoveryos.assign_chore(bigint,bigint,date);
--           drop function recoveryos.complete_chore_assignment(bigint);

set search_path = recoveryos, public;

create or replace function recoveryos.record_meeting(
  p_residence_id bigint,
  p_title text,
  p_starts_at timestamptz,
  p_is_required boolean default false,
  p_description text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_org bigint;
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if nullif(trim(coalesce(p_title, '')), '') is null then
    return jsonb_build_object('ok', false, 'code', 'title_required');
  end if;
  if p_starts_at is null then
    return jsonb_build_object('ok', false, 'code', 'time_required');
  end if;
  select organization_id into v_org from recoveryos.residences where id = p_residence_id;
  if v_org is null then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  insert into recoveryos.meetings
    (organization_id, residence_id, title, description, starts_at, is_required_for_residents)
  values (v_org, p_residence_id, trim(p_title), nullif(trim(coalesce(p_description,'')), ''),
          p_starts_at, coalesce(p_is_required, false))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'code', 'recorded', 'meeting_id', v_id);
end $$;
revoke execute on function recoveryos.record_meeting(bigint,text,timestamptz,boolean,text) from public, anon;
grant execute on function recoveryos.record_meeting(bigint,text,timestamptz,boolean,text) to authenticated;

create or replace function recoveryos.record_meeting_attendance(
  p_meeting_id bigint, p_person_id bigint, p_status text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_meeting recoveryos.meetings%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('expected','present','absent','excused') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_meeting from recoveryos.meetings where id = p_meeting_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  -- Residence meetings: staff of that residence. Organization-wide meetings
  -- (residence_id null): platform admin only — attendance there is not a
  -- house-staff record.
  if v_meeting.residence_id is not null then
    if v_meeting.residence_id not in (select recoveryos.staff_residence_ids())
       and not recoveryos.is_platform_admin() then
      return jsonb_build_object('ok', false, 'code', 'not_authorized');
    end if;
  elsif not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  insert into recoveryos.meeting_attendance (meeting_id, person_id, status, recorded_by_person_id, recorded_at)
  values (p_meeting_id, p_person_id, p_status, v_me, now())
  on conflict (meeting_id, person_id) do update
    set status = excluded.status,
        recorded_by_person_id = excluded.recorded_by_person_id,
        recorded_at = excluded.recorded_at;

  return jsonb_build_object('ok', true, 'code', 'recorded');
end $$;
revoke execute on function recoveryos.record_meeting_attendance(bigint,bigint,text) from public, anon;
grant execute on function recoveryos.record_meeting_attendance(bigint,bigint,text) to authenticated;

create or replace function recoveryos.assign_chore(
  p_chore_id bigint, p_residency_id bigint, p_due_on date
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_chore recoveryos.residence_chores%rowtype;
  v_residence bigint;
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_due_on is null then return jsonb_build_object('ok', false, 'code', 'due_date_required'); end if;
  select * into v_chore from recoveryos.residence_chores where id = p_chore_id and is_active;
  if not found then return jsonb_build_object('ok', false, 'code', 'chore_not_found'); end if;
  select residence_id into v_residence from recoveryos.residencies
    where id = p_residency_id and residency_status in ('active','on_pass','transitioning');
  if v_residence is null then return jsonb_build_object('ok', false, 'code', 'no_active_residency'); end if;
  if v_residence <> v_chore.residence_id then
    return jsonb_build_object('ok', false, 'code', 'wrong_residence');
  end if;
  if v_residence not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if exists (select 1 from recoveryos.chore_assignments
             where chore_id = p_chore_id and residency_id = p_residency_id and due_on = p_due_on) then
    return jsonb_build_object('ok', true, 'code', 'already_assigned');
  end if;

  insert into recoveryos.chore_assignments (chore_id, residency_id, due_on)
  values (p_chore_id, p_residency_id, p_due_on)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'code', 'assigned', 'assignment_id', v_id);
end $$;
revoke execute on function recoveryos.assign_chore(bigint,bigint,date) from public, anon;
grant execute on function recoveryos.assign_chore(bigint,bigint,date) to authenticated;

create or replace function recoveryos.complete_chore_assignment(p_assignment_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_row recoveryos.chore_assignments%rowtype;
  v_residence bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_row from recoveryos.chore_assignments where id = p_assignment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  select residence_id into v_residence from recoveryos.residencies where id = v_row.residency_id;
  if v_residence not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_row.completed_at is not null then
    return jsonb_build_object('ok', true, 'code', 'already_done');
  end if;

  update recoveryos.chore_assignments
     set completed_at = now(), verified_by_person_id = v_me
   where id = p_assignment_id;

  return jsonb_build_object('ok', true, 'code', 'completed');
end $$;
revoke execute on function recoveryos.complete_chore_assignment(bigint) from public, anon;
grant execute on function recoveryos.complete_chore_assignment(bigint) to authenticated;

notify pgrst, 'reload schema';
