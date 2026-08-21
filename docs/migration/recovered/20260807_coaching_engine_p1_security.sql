-- P1 SECURITY COMPLETION for the Grace Coaching prototype layer.
-- Authored, applied live (migration `coaching_engine_p1_security`) and committed
-- in the same session, 2026-08-07. Prototype layer (public schema) — lives under
-- docs/migration/recovered/, not the canonical recoveryos chain.
--
-- Three things:
--   P1-C  provision_session_meeting(request_id, explicit_url, provider):
--         server-authoritative, JWT-derived meeting-link provisioning. The coach
--         on the request (or admin/navigator) only; state-checked; idempotent;
--         no client-supplied identity, no guessable public room. The create-meeting
--         Edge Function becomes a thin wrapper that calls this; it can no longer
--         set meeting_url by trusting a body-supplied coachEmail.
--   P1-D  Progressive disclosure: phone becomes column-revoked from `authenticated`
--         (broad reads keep id/name/role/county for the UI, never phone), and two
--         relationship-scoped read models expose only what each surface needs:
--           list_open_requests()  — pool discovery: minimal per-request summary,
--                                    staff only, unclaimed requests only.
--           get_my_participants() — record access: full contact (incl. phone) only
--                                    for participants with an ACTIVE assignment to
--                                    the calling coach (admins/navigators see all).
--   P1-E  v2_notification_deliveries: audit + idempotency substrate for the
--         hardened notify-fanout function (external channels stay OFF in P1).
--
-- ROLLBACK notes at the foot of the file.

begin;

-- ===========================================================================
-- P1-C — server-authoritative meeting provisioning
-- ===========================================================================
create or replace function public.provision_session_meeting(
  p_request_id uuid,
  p_explicit_url text default null,
  p_explicit_provider text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_req v2_session_requests%rowtype;
  v_is_staff boolean;
  v_owner boolean;
  v_room record;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'unauthenticated', 'message', 'Sign in required.');
  end if;

  select * into v_req from v2_session_requests where id = p_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'That session was not found.');
  end if;

  -- Authorization derives ONLY from the JWT subject, never from the request body.
  v_is_staff := coalesce(public.v2_my_role() = any (array['navigator','admin']::v2_role[]), false);
  v_owner := (v_req.coach_id = auth.uid());
  if not (v_owner or v_is_staff) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Only the assigned coach can create this meeting link.');
  end if;

  -- A link only makes sense once a coach owns the request.
  if v_req.coach_id is null then
    return jsonb_build_object('ok', false, 'code', 'no_coach',
      'message', 'This request needs a coach before a link can be created.');
  end if;
  -- State gate: negotiation or confirmed; never on a closed/cancelled request.
  if v_req.status not in ('requested','times_suggested','counter_proposed','confirmed') then
    return jsonb_build_object('ok', false, 'code', 'bad_state',
      'message', 'This session is not in a state that needs a meeting link.');
  end if;

  -- Idempotent: an existing link is returned, never regenerated on a retry/double-tap.
  if v_req.meeting_url is not null then
    return jsonb_build_object('ok', true, 'code', 'exists', 'url', v_req.meeting_url,
      'provider', 'existing');
  end if;

  perform set_config('app.coaching_rpc', '1', true);

  -- Explicit URL path (e.g. a Zoom meeting the caller already created, authorized above).
  if p_explicit_url is not null then
    update v2_session_requests set meeting_url = p_explicit_url where id = p_request_id;
    return jsonb_build_object('ok', true, 'code', 'set', 'url', p_explicit_url,
      'provider', coalesce(p_explicit_provider, 'external'));
  end if;

  -- Default: the coach's registered room. No public/guessable fallback.
  select r.room_url, r.provider, r.room_label into v_room
  from coach_meeting_rooms r
  join auth.users u on lower(u.email) = lower(r.coach_email)
  where u.id = v_req.coach_id and r.is_active
  order by r.updated_at desc limit 1;

  if v_room.room_url is null then
    return jsonb_build_object('ok', false, 'code', 'needs_room_setup',
      'message', 'The coach has not set up their meeting room yet.');
  end if;

  update v2_session_requests set meeting_url = v_room.room_url where id = p_request_id;
  return jsonb_build_object('ok', true, 'code', 'set', 'url', v_room.room_url,
    'provider', v_room.provider, 'roomLabel', v_room.room_label);
end $$;
revoke execute on function public.provision_session_meeting(uuid, text, text) from public, anon;
grant execute on function public.provision_session_meeting(uuid, text, text) to authenticated, service_role;

-- ===========================================================================
-- P1-D — progressive disclosure
-- ===========================================================================
-- Column-level: `authenticated` may read everything on v2_profiles EXCEPT phone.
-- (Names/role/county stay broadly readable for the relational UI; phone is
-- "unnecessary personal data before a relationship" and is served only through
-- the relationship-scoped RPC below. service_role keeps full access for
-- notify-fanout.)
revoke select on public.v2_profiles from authenticated;
grant select (id, role, display_name, county, coach_id, created_at)
  on public.v2_profiles to authenticated;

-- Pool discovery: only the fields a coach needs to DECIDE on an unclaimed request.
-- Staff-only; no participant record access, no messages, no history.
create or replace function public.list_open_requests()
returns table (
  request_id uuid,
  participant_id uuid,
  participant_name text,
  county text,
  session_type text,
  mode v2_session_mode,
  topic text,
  preferred_times jsonb,
  created_at timestamptz
) language sql security definer set search_path = public stable as $$
  select sr.id, sr.participant_id, p.display_name, p.county,
         sr.session_type, sr.mode, sr.topic, sr.preferred_times, sr.created_at
  from v2_session_requests sr
  join v2_profiles p on p.id = sr.participant_id
  where sr.coach_id is null
    and sr.status = 'requested'
    and public.v2_my_role() = any (array['coach','navigator','admin']::v2_role[])
  order by sr.created_at;
$$;
revoke execute on function public.list_open_requests() from public, anon;
grant execute on function public.list_open_requests() to authenticated;

-- Record access: fuller participant info (incl. phone) ONLY for people with an
-- ACTIVE assignment to the calling coach. Admins/navigators see the full roster.
create or replace function public.get_my_participants()
returns table (
  participant_id uuid,
  display_name text,
  county text,
  phone text,
  assignment_method text,
  connected_at timestamptz
) language sql security definer set search_path = public stable as $$
  select p.id, p.display_name, p.county, p.phone, a.method, a.created_at
  from v2_coach_assignments a
  join v2_profiles p on p.id = a.participant_id
  where a.is_active
    and (
      a.coach_id = auth.uid()
      or public.v2_my_role() = any (array['navigator','admin']::v2_role[])
    )
  order by p.display_name;
$$;
revoke execute on function public.get_my_participants() from public, anon;
grant execute on function public.get_my_participants() to authenticated;

-- ===========================================================================
-- P1-E — notification delivery audit + idempotency substrate
-- ===========================================================================
create table if not exists public.v2_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.v2_notifications(id) on delete cascade,
  channel text not null check (channel in ('email','sms')),
  status text not null default 'sent' check (status in ('sent','failed','skipped')),
  detail text,
  created_at timestamptz not null default now(),
  unique (notification_id, channel)   -- one delivery attempt per channel = idempotent
);
alter table public.v2_notification_deliveries enable row level security;
-- Recipients may see the delivery state of their own notifications; only the
-- service role writes (the hardened function runs as service role).
create policy v2_nd_recipient_select on public.v2_notification_deliveries
  for select to authenticated
  using (exists (select 1 from v2_notifications n
                 where n.id = notification_id and n.recipient_id = auth.uid()));
revoke all on public.v2_notification_deliveries from anon;
grant select on public.v2_notification_deliveries to authenticated;

commit;

-- ROLLBACK:
--   drop function provision_session_meeting(uuid, text, text);
--   drop function list_open_requests();
--   drop function get_my_participants();
--   grant select on public.v2_profiles to authenticated;  -- restore table-wide read
--   drop table public.v2_notification_deliveries;
