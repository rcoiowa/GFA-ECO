-- LAUNCH 0108 — Coach Workspace capabilities (P4C; smallest-safe backend changes).
--
-- Three justified additions discovered by the P4B/P4C contract reviews — no schema redesign:
--
-- 1. CANCELLATION HARDENING (P4B finding): sr_participant_cancel allowed unrestricted own-row
--    UPDATE and trusted the client to make the right transition. Replaced with a
--    server-authoritative cancel_support_request RPC (enumerated source statuses, lifecycle
--    fields only, idempotent, event-logged) and the broad UPDATE policy is DROPPED.
--
-- 2. COACH ROSTER DISCLOSURE (inverse of P4B's 0107): a coach could see relationship rows but
--    not WHO their active participants are (people is self+residence-staff readable only).
--    get_my_participants() returns relationship-scoped identity for the CALLER'S OWN active
--    relationships — display name, pronouns (participant-supplied), relationship context, and
--    the originating request context. No table policy widened; no table-wide people access.
--
-- 3. FOLLOW-UP LIFECYCLE: follow_ups had only a SELECT policy — nothing could create or
--    complete one. create_follow_up (coach with an active relationship; assigned to caller)
--    and complete_follow_up (assignee or admin; idempotent) are the minimal transitions.
--    Follow-up = "who needs another intentional contact, why, and when" — not a task manager.

begin;

-- ---- 1. cancellation hardening -----------------------------------------------------
create or replace function recoveryos.cancel_support_request(p_support_request_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_req recoveryos.support_requests%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_req from recoveryos.support_requests where id = p_support_request_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_req.person_id <> v_me then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_req.status = 'cancelled' then
    return jsonb_build_object('ok', true, 'code', 'already_cancelled');
  end if;
  -- Enumerated: only a still-unclaimed open/submitted request is self-cancellable.
  if v_req.status not in ('open', 'submitted') or v_req.claimed_by_person_id is not null then
    return jsonb_build_object('ok', false, 'code', 'not_cancellable',
      'message', 'This request is already being handled — reach out and we’ll sort it together.');
  end if;

  update recoveryos.support_requests
    set status = 'cancelled', cancelled_at = now(), last_actor_person_id = v_me
    where id = p_support_request_id;
  insert into recoveryos.support_request_events (support_request_id, event_type, actor_person_id, detail)
    values (p_support_request_id, 'cancelled', v_me, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'cancelled');
end $$;
revoke execute on function recoveryos.cancel_support_request(bigint) from public, anon;

-- The RPC is now the only cancellation path: remove the broad own-row UPDATE surface.
drop policy if exists sr_participant_cancel on recoveryos.support_requests;

-- ---- 2. coach roster disclosure ----------------------------------------------------
create or replace function recoveryos.get_my_participants()
returns table (
  relationship_id bigint,
  participant_person_id bigint,
  display_name text,
  pronouns text,
  relationship_type text,
  is_primary boolean,
  started_at date,
  origin_request_type text,
  origin_focus text
) language sql stable security definer set search_path = recoveryos, public as $$
  select
    cr.id,
    p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
             trim(p.first_name || ' ' || coalesce(p.last_name, ''))) as display_name,
    p.pronouns,
    cr.relationship_type,
    cr.is_primary,
    cr.started_at,
    sr.request_type,
    sr.focus
  from recoveryos.coaching_relationships cr
  join recoveryos.people p on p.id = cr.participant_person_id
  left join recoveryos.support_requests sr on sr.coaching_relationship_id = cr.id
  where cr.coach_person_id = recoveryos.current_person_id()
    and cr.status = 'active'
  order by cr.started_at desc;
$$;
revoke execute on function recoveryos.get_my_participants() from public, anon;
grant execute on function recoveryos.get_my_participants() to authenticated;

-- ---- 3. follow-up lifecycle --------------------------------------------------------
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
  -- Coach may create follow-ups only for their own active participants (admin for anyone).
  if not recoveryos.is_admin_staff() and not exists (
    select 1 from recoveryos.coaching_relationships
    where coach_person_id = v_me and participant_person_id = p_person_id and status = 'active'
  ) then
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
revoke execute on function recoveryos.create_follow_up(bigint,timestamptz,text,text,bigint) from public, anon;
grant execute on function recoveryos.create_follow_up(bigint,timestamptz,text,text,bigint) to authenticated;

create or replace function recoveryos.complete_follow_up(p_follow_up_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_fu recoveryos.follow_ups%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_fu from recoveryos.follow_ups where id = p_follow_up_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_fu.assigned_person_id is distinct from v_me and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_fu.status = 'done' then
    return jsonb_build_object('ok', true, 'code', 'already_done');
  end if;
  update recoveryos.follow_ups
    set status = 'done', completed_at = now(), updated_at = now()
    where id = p_follow_up_id;
  return jsonb_build_object('ok', true, 'code', 'completed');
end $$;
revoke execute on function recoveryos.complete_follow_up(bigint) from public, anon;
grant execute on function recoveryos.complete_follow_up(bigint) to authenticated;

commit;
