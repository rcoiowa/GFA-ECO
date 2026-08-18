-- LAUNCH 0105 — Canonical meeting provisioning.
--
-- Ports the P1-hardened v2 `provision_session_meeting` semantics onto canonical
-- recoveryos.appointments (the v2 version validated v2_session_requests + a coach-email room
-- registry). Security posture preserved exactly: identity from JWT only; only the appointment's
-- provider (or admin) may provision; appointment must be in a joinable state; idempotent
-- (existing URL returned); server-authoritative URL; NO public/guessable fallback room.

begin;

-- Provider room registry (e.g. a coach's Ooma Office room), keyed canonically by person.
create table recoveryos.provider_meeting_rooms (
  id         bigint generated always as identity primary key,
  person_id  bigint not null references recoveryos.people(id),
  provider   text not null default 'ooma',
  room_url   text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index provider_meeting_rooms_active_idx
  on recoveryos.provider_meeting_rooms (person_id, provider) where is_active;
alter table recoveryos.provider_meeting_rooms enable row level security;
create policy pmr_own_select on recoveryos.provider_meeting_rooms for select to authenticated
  using (person_id = recoveryos.current_person_id() or recoveryos.is_admin_staff());
create policy pmr_admin_manage on recoveryos.provider_meeting_rooms for all to authenticated
  using (recoveryos.is_admin_staff()) with check (recoveryos.is_admin_staff());

create or replace function recoveryos.provision_appointment_meeting(
  p_appointment_id bigint,
  p_explicit_url text default null,
  p_explicit_provider text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.appointments%rowtype;
  v_room text;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;

  select * into v_a from recoveryos.appointments where id = p_appointment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  -- Only the appointment's provider (or admin) provisions the meeting.
  if v_a.provider_person_id is distinct from v_me and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Only the assigned coach can create this meeting link.');
  end if;
  if v_a.status not in ('scheduled','confirmed') then
    return jsonb_build_object('ok', false, 'code', 'bad_state',
      'message', 'This session is not in a joinable state.');
  end if;

  -- Idempotent: an existing link is returned, never replaced silently.
  if v_a.meeting_url is not null then
    return jsonb_build_object('ok', true, 'code', 'exists',
      'url', v_a.meeting_url, 'provider', coalesce(v_a.meeting_provider,'ooma'));
  end if;

  if p_explicit_url is not null then
    -- Server-side integration result (e.g. Zoom) passed by the trusted edge function;
    -- still recorded transactionally here under the caller's authorization.
    update recoveryos.appointments
      set meeting_url = p_explicit_url, meeting_provider = coalesce(p_explicit_provider,'zoom'),
          updated_at = now()
      where id = v_a.id;
    return jsonb_build_object('ok', true, 'code', 'provisioned',
      'url', p_explicit_url, 'provider', coalesce(p_explicit_provider,'zoom'));
  end if;

  -- Default: the provider's registered active room. No public fallback.
  select room_url into v_room from recoveryos.provider_meeting_rooms
    where person_id = v_a.provider_person_id and is_active
    order by updated_at desc limit 1;
  if v_room is null then
    return jsonb_build_object('ok', false, 'code', 'needs_room_setup',
      'message', 'No meeting room is registered for this coach yet.');
  end if;

  update recoveryos.appointments
    set meeting_url = v_room, meeting_provider = 'ooma', updated_at = now()
    where id = v_a.id;
  return jsonb_build_object('ok', true, 'code', 'provisioned', 'url', v_room, 'provider', 'ooma');
end $$;
revoke execute on function recoveryos.provision_appointment_meeting(bigint,text,text) from public, anon;

commit;
