-- 0112_navigation_domain.sql — P4E: Navigator domain correction + closed-loop navigation.
--
-- Contract audit findings this migration corrects/builds:
--   1. DOMAIN CORRECTION: claim_support_request() accepted any support staff and
--      ALWAYS created a coaching_relationships row — a navigator claiming a
--      navigation request would have become a fake coach. The claim RPC is now a
--      dispatcher: request type routes to the correct relationship domain, and
--      eligibility is enforced server-side per domain (React filtering is not
--      authorization).
--   2. navigation_relationships (0005) was minimal — it gains the same lifecycle
--      shape coaching received in 0025 (status, primacy, assignment provenance).
--   3. DEFENSE-IN-DEPTH DISCLOSURE FIX (carried from P4C): the open-pool server
--      projection no longer returns participant free-text `focus` pre-claim.
--   4. My Support becomes a real support-team read (coach + navigator).
--   5. Messaging gains a real `context = 'navigation'` backed by an actual
--      active navigation relationship — navigators are never pretend coaches.
--   6. Closed-loop navigation: navigation_needs (funder-neutral taxonomy) and
--      navigation_referrals (information / referral / warm handoff; activity
--      distinguished from outcome; unmet need stays measurable). The public
--      recovery-residence `referrals` table is NOT touched — different business
--      event, separate domain.
--   7. Service-event attestation: record_navigation_service_event +
--      complete_session (coach companion). Referral rows, messages, and
--      appointments never auto-create service delivery.

-- ---------------------------------------------------------------------------
-- 1) Role helpers — domain eligibility, not one blanket "support staff"
-- ---------------------------------------------------------------------------
create or replace function recoveryos.is_coach_staff()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('coach') or recoveryos.has_role('administrator')
      or recoveryos.has_role('system_administrator');
$$;

create or replace function recoveryos.is_navigator_staff()
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select recoveryos.has_role('navigator') or recoveryos.has_role('administrator')
      or recoveryos.has_role('system_administrator');
$$;

revoke execute on function recoveryos.is_coach_staff(), recoveryos.is_navigator_staff()
  from public, anon;
grant execute on function recoveryos.is_coach_staff(), recoveryos.is_navigator_staff()
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2) navigation_relationships — production lifecycle (mirrors coaching 0025)
-- ---------------------------------------------------------------------------
alter table recoveryos.navigation_relationships
  add column if not exists status text not null default 'active'
    check (status in ('pending','active','paused','transferred','completed','ended')),
  add column if not exists is_primary boolean not null default true,
  add column if not exists assigned_by_person_id bigint references recoveryos.people(id),
  add column if not exists assignment_source text
    check (assignment_source in ('request_pickup','navigator_assignment','admin_assignment','triage')),
  add column if not exists end_reason text,
  add column if not exists updated_at timestamptz not null default now();

-- Launch rule: one active PRIMARY navigator per participant (independent of coaching).
create unique index if not exists navigation_rel_one_active_primary
  on recoveryos.navigation_relationships(participant_person_id)
  where status = 'active' and is_primary;
create index if not exists navigation_rel_navigator_active_idx
  on recoveryos.navigation_relationships(navigator_person_id) where status = 'active';

drop trigger if exists trg_navigation_rel_touch on recoveryos.navigation_relationships;
create trigger trg_navigation_rel_touch before update on recoveryos.navigation_relationships
  for each row execute function recoveryos.touch_updated_at();

-- Defined after the lifecycle columns exist (SQL bodies validate at creation).
create or replace function recoveryos.my_navigation_participant_ids()
returns setof bigint language sql stable security definer set search_path = recoveryos, public as $$
  select participant_person_id from recoveryos.navigation_relationships
  where navigator_person_id = recoveryos.current_person_id() and status = 'active';
$$;
revoke execute on function recoveryos.my_navigation_participant_ids() from public, anon;
grant execute on function recoveryos.my_navigation_participant_ids() to authenticated;

-- Admin metadata read (participant/navigator select exists via 0009).
drop policy if exists navigation_rel_staff_select on recoveryos.navigation_relationships;
create policy navigation_rel_staff_select on recoveryos.navigation_relationships
  for select to authenticated using (recoveryos.is_admin_staff());

-- Request linkage for the navigation claim path.
alter table recoveryos.support_requests
  add column if not exists navigation_relationship_id bigint
    references recoveryos.navigation_relationships(id);

-- ---------------------------------------------------------------------------
-- 3) claim_support_request — dispatching claim (Option B, coaching path preserved)
-- ---------------------------------------------------------------------------
-- recovery_coach / life_coach → coaching_relationships type 'coach'
-- peer_support               → coaching_relationships type 'peer'
-- navigation / needs_assessment → navigation_relationships (navigator-led triage)
create or replace function recoveryos.claim_support_request(p_support_request_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_req recoveryos.support_requests%rowtype;
  v_rel_id bigint;
  v_domain text;
  v_rel_type text;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'unauthenticated');
  end if;

  select * into v_req from recoveryos.support_requests where id = p_support_request_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'This request is no longer here.');
  end if;

  v_domain := case when v_req.request_type in ('navigation','needs_assessment')
                   then 'navigation' else 'coaching' end;

  -- Server-side eligibility per domain — a navigator never becomes a coach and
  -- a coach never silently absorbs a navigation request.
  if v_domain = 'coaching' and not recoveryos.is_coach_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_eligible',
      'message', 'This request needs a recovery coach.');
  end if;
  if v_domain = 'navigation' and not recoveryos.is_navigator_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_eligible',
      'message', 'This request needs a navigator.');
  end if;

  if v_req.claimed_by_person_id = v_me then
    return jsonb_build_object('ok', true, 'code', 'already_yours', 'message', 'They are already with you.');
  end if;
  if v_req.claimed_by_person_id is not null then
    return jsonb_build_object('ok', false, 'code', 'already_claimed',
      'message', 'Someone else just picked this up. Others may still be waiting for support.');
  end if;
  if v_req.status not in ('submitted','open') then
    return jsonb_build_object('ok', false, 'code', 'not_open', 'message', 'This request is no longer open.');
  end if;

  if v_domain = 'coaching' then
    v_rel_type := case when v_req.request_type = 'peer_support' then 'peer' else 'coach' end;
    select id into v_rel_id from recoveryos.coaching_relationships
      where participant_person_id = v_req.person_id and status='active' and is_primary
      for update;
    if v_rel_id is not null then
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
                'active', v_rel_type, true, v_me, 'request_pickup')
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
  else
    select id into v_rel_id from recoveryos.navigation_relationships
      where participant_person_id = v_req.person_id and status='active' and is_primary
      for update;
    if v_rel_id is not null then
      if (select navigator_person_id from recoveryos.navigation_relationships where id=v_rel_id) <> v_me then
        return jsonb_build_object('ok', false, 'code', 'participant_has_navigator',
          'message', 'They are already connected with another navigator.');
      end if;
    else
      begin
        insert into recoveryos.navigation_relationships
          (participant_person_id, navigator_person_id, organization_id, started_at,
           status, is_primary, assigned_by_person_id, assignment_source)
        values (v_req.person_id, v_me, 1, current_date,
                'active', true, v_me,
                case when v_req.request_type = 'needs_assessment' then 'triage' else 'request_pickup' end)
        returning id into v_rel_id;
      exception when unique_violation then
        return jsonb_build_object('ok', false, 'code', 'participant_has_navigator',
          'message', 'They were just connected with another navigator.');
      end;
    end if;

    update recoveryos.support_requests
      set claimed_by_person_id = v_me, claimed_at = now(), navigation_relationship_id = v_rel_id,
          status = 'claimed', assigned_at = now(), last_actor_person_id = v_me
      where id = p_support_request_id;
  end if;

  insert into recoveryos.support_request_events (support_request_id, event_type, actor_person_id, detail)
    values (p_support_request_id, 'claimed', v_me,
            jsonb_build_object('relationship_id', v_rel_id, 'domain', v_domain));

  return jsonb_build_object('ok', true, 'code', 'claimed', 'relationship_id', v_rel_id,
    'domain', v_domain, 'message', 'They''re with you now.');
end $$;

-- ---------------------------------------------------------------------------
-- 4) Navigator assignment + relationship end
-- ---------------------------------------------------------------------------
create or replace function recoveryos.assign_participant_navigator(
  p_participant_person_id bigint, p_navigator_person_id bigint
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_navigator_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Assigning a navigator requires a navigator or admin.');
  end if;
  if not exists (select 1 from recoveryos.role_assignments
                 where person_id = p_navigator_person_id and role_key = 'navigator' and revoked_at is null) then
    return jsonb_build_object('ok', false, 'code', 'not_a_navigator',
      'message', 'That person is not a navigator.');
  end if;

  select id into v_rel_id from recoveryos.navigation_relationships
    where participant_person_id = p_participant_person_id and status='active' and is_primary
    for update;
  if v_rel_id is not null then
    if (select navigator_person_id from recoveryos.navigation_relationships where id=v_rel_id)
       = p_navigator_person_id then
      return jsonb_build_object('ok', true, 'code', 'already_assigned', 'relationship_id', v_rel_id);
    end if;
    return jsonb_build_object('ok', false, 'code', 'participant_has_navigator',
      'message', 'They are already connected with another navigator.');
  end if;

  begin
    insert into recoveryos.navigation_relationships
      (participant_person_id, navigator_person_id, organization_id, started_at,
       status, is_primary, assigned_by_person_id, assignment_source)
    values (p_participant_person_id, p_navigator_person_id, 1, current_date,
            'active', true, v_me, 'navigator_assignment')
    returning id into v_rel_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'participant_has_navigator',
      'message', 'They were just connected with another navigator.');
  end;

  perform recoveryos.emit_notification(p_participant_person_id, 'navigator_assigned',
    'A navigator is with you', 'You have been connected with a navigator.', '/vrcc/connect',
    'nav_assigned:' || v_rel_id || ':' || p_participant_person_id);

  return jsonb_build_object('ok', true, 'code', 'assigned', 'relationship_id', v_rel_id);
end $$;

create or replace function recoveryos.end_navigation_relationship(
  p_relationship_id bigint, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel recoveryos.navigation_relationships%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_rel from recoveryos.navigation_relationships where id = p_relationship_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_rel.navigator_person_id <> v_me and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_rel.status = 'ended' then
    return jsonb_build_object('ok', true, 'code', 'already_ended');
  end if;
  update recoveryos.navigation_relationships
    set status='ended', ended_at=current_date, end_reason=nullif(p_reason,'')
    where id = p_relationship_id;
  return jsonb_build_object('ok', true, 'code', 'ended');
end $$;

-- ---------------------------------------------------------------------------
-- 5) Open pool — defense-in-depth: no participant free text pre-claim
-- ---------------------------------------------------------------------------
drop function if exists recoveryos.list_open_support_requests();
create function recoveryos.list_open_support_requests()
returns table (
  support_request_id bigint, participant_person_id bigint, participant_name text,
  request_type text, preferred_modality recoveryos.service_modality, created_at timestamptz
) language sql security definer set search_path = recoveryos, public stable as $$
  select s.id, s.person_id, (pp.first_name || ' ' || pp.last_name),
         s.request_type, s.preferred_modality, s.created_at
  from recoveryos.support_requests s
  join recoveryos.people pp on pp.id = s.person_id
  where s.status in ('submitted','open')
    and s.claimed_by_person_id is null
    and recoveryos.is_support_staff()
    and recoveryos.is_production_person(s.person_id)
  order by s.created_at;
$$;
revoke execute on function recoveryos.list_open_support_requests() from public, anon;
grant execute on function recoveryos.list_open_support_requests() to authenticated;

-- ---------------------------------------------------------------------------
-- 6) My Support — coach AND navigator, with a context discriminator
-- ---------------------------------------------------------------------------
drop function if exists recoveryos.get_my_support_team();
create function recoveryos.get_my_support_team()
returns table (
  relationship_id bigint,
  support_person_id bigint,
  display_name text,
  role_label text,
  relationship_type text,
  context text,
  is_primary boolean,
  started_at date
) language sql stable security definer set search_path = recoveryos, public as $$
  select cr.id, p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
      trim(p.first_name || ' ' || left(coalesce(nullif(p.last_name, ''), ''), 1) ||
           case when coalesce(p.last_name, '') = '' then '' else '.' end)) as display_name,
    case cr.relationship_type
      when 'coach' then 'Recovery Coach'
      when 'peer' then 'Peer Support'
      when 'mentor' then 'Mentor'
      else 'Support'
    end as role_label,
    cr.relationship_type, 'coaching'::text as context, cr.is_primary, cr.started_at
  from recoveryos.coaching_relationships cr
  join recoveryos.people p on p.id = cr.coach_person_id
  where cr.participant_person_id = recoveryos.current_person_id() and cr.status = 'active'
  union all
  select nr.id, p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
      trim(p.first_name || ' ' || left(coalesce(nullif(p.last_name, ''), ''), 1) ||
           case when coalesce(p.last_name, '') = '' then '' else '.' end)),
    'Navigator', 'navigator', 'navigation'::text, nr.is_primary, nr.started_at
  from recoveryos.navigation_relationships nr
  join recoveryos.people p on p.id = nr.navigator_person_id
  where nr.participant_person_id = recoveryos.current_person_id() and nr.status = 'active'
  order by context, is_primary desc, started_at desc;
$$;
revoke execute on function recoveryos.get_my_support_team() from public, anon;
grant execute on function recoveryos.get_my_support_team() to authenticated;

-- Navigator roster — relationship-scoped identity, same disclosure boundary as 0108.
create or replace function recoveryos.get_my_navigation_participants()
returns table (
  relationship_id bigint,
  participant_person_id bigint,
  display_name text,
  pronouns text,
  is_primary boolean,
  started_at date,
  origin_request_type text
) language sql stable security definer set search_path = recoveryos, public as $$
  select nr.id, p.id,
    coalesce(nullif(trim(p.preferred_name), ''),
             trim(p.first_name || ' ' || coalesce(p.last_name, ''))) as display_name,
    p.pronouns, nr.is_primary, nr.started_at,
    (select s.request_type from recoveryos.support_requests s
      where s.navigation_relationship_id = nr.id order by s.created_at limit 1)
  from recoveryos.navigation_relationships nr
  join recoveryos.people p on p.id = nr.participant_person_id
  where nr.navigator_person_id = recoveryos.current_person_id() and nr.status = 'active'
  order by nr.started_at desc;
$$;
revoke execute on function recoveryos.get_my_navigation_participants() from public, anon;
grant execute on function recoveryos.get_my_navigation_participants() to authenticated;

-- ---------------------------------------------------------------------------
-- 7) Messaging — real navigation context (never a pretend coaching thread)
-- ---------------------------------------------------------------------------
alter table recoveryos.conversations
  add column if not exists navigation_relationship_id bigint
    references recoveryos.navigation_relationships(id);

-- Signature change (added p_context) — drop the 0109 single-argument version.
drop function if exists recoveryos.ensure_relationship_conversation(bigint);
create function recoveryos.ensure_relationship_conversation(
  p_other_person_id bigint default null, p_context text default null
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_crel recoveryos.coaching_relationships%rowtype;
  v_nrel recoveryos.navigation_relationships%rowtype;
  v_context text;
  v_participant bigint; v_staff bigint; v_staff_role text;
  v_conv_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if p_context is not null and p_context not in ('coaching','navigation') then
    return jsonb_build_object('ok', false, 'code', 'invalid_context');
  end if;

  if coalesce(p_context, 'coaching') = 'coaching' then
    if p_other_person_id is null then
      select * into v_crel from recoveryos.coaching_relationships
      where participant_person_id = v_me and status = 'active'
      order by is_primary desc, started_at desc limit 1;
    else
      select * into v_crel from recoveryos.coaching_relationships
      where status = 'active'
        and ((participant_person_id = v_me and coach_person_id = p_other_person_id)
          or (coach_person_id = v_me and participant_person_id = p_other_person_id))
      order by is_primary desc, started_at desc limit 1;
    end if;
    if found then
      v_context := 'coaching';
      v_participant := v_crel.participant_person_id; v_staff := v_crel.coach_person_id;
      v_staff_role := 'coach';
    end if;
  end if;

  if v_context is null and coalesce(p_context, 'navigation') = 'navigation' then
    if p_other_person_id is null then
      select * into v_nrel from recoveryos.navigation_relationships
      where participant_person_id = v_me and status = 'active'
      order by is_primary desc, started_at desc limit 1;
    else
      select * into v_nrel from recoveryos.navigation_relationships
      where status = 'active'
        and ((participant_person_id = v_me and navigator_person_id = p_other_person_id)
          or (navigator_person_id = v_me and participant_person_id = p_other_person_id))
      order by is_primary desc, started_at desc limit 1;
    end if;
    if found then
      v_context := 'navigation';
      v_participant := v_nrel.participant_person_id; v_staff := v_nrel.navigator_person_id;
      v_staff_role := 'navigator';
    end if;
  end if;

  if v_context is null then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Messaging opens once you''re connected with someone.');
  end if;

  -- conversations.coach_person_id holds "the staff member" for either context;
  -- the (participant, staff, context) unique index keeps threads distinct.
  insert into recoveryos.conversations
      (participant_person_id, coach_person_id, coaching_relationship_id,
       navigation_relationship_id, context)
  values (v_participant, v_staff,
          case when v_context = 'coaching' then v_crel.id end,
          case when v_context = 'navigation' then v_nrel.id end,
          v_context)
  on conflict (participant_person_id, coach_person_id, context)
  do update set
    coaching_relationship_id =
      coalesce(recoveryos.conversations.coaching_relationship_id, excluded.coaching_relationship_id),
    navigation_relationship_id =
      coalesce(recoveryos.conversations.navigation_relationship_id, excluded.navigation_relationship_id)
  returning id into v_conv_id;

  insert into recoveryos.conversation_members (conversation_id, person_id, member_role)
  values (v_conv_id, v_participant, 'participant'), (v_conv_id, v_staff, v_staff_role)
  on conflict (conversation_id, person_id) do nothing;

  return jsonb_build_object('ok', true, 'code', 'ready',
    'conversation_id', v_conv_id, 'context', v_context);
end $$;

-- send_message: ended-relationship check + staff link path are now context-aware.
create or replace function recoveryos.send_message(
  p_conversation_id bigint, p_body text
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_body text := trim(coalesce(p_body, ''));
  v_conv recoveryos.conversations%rowtype;
  v_active boolean;
  v_recipient bigint;
  v_sender_name text;
  v_link text;
  v_msg_id bigint;
  v_created timestamptz;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if v_body = '' then
    return jsonb_build_object('ok', false, 'code', 'empty_message', 'message', 'Write a message first.');
  end if;
  if length(v_body) > 4000 then
    return jsonb_build_object('ok', false, 'code', 'too_long',
      'message', 'That message is a little long — try splitting it up.');
  end if;

  select * into v_conv from recoveryos.conversations where id = p_conversation_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.conversation_members
                 where conversation_id = v_conv.id and person_id = v_me) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if v_conv.context = 'navigation' then
    v_active := exists (select 1 from recoveryos.navigation_relationships
      where participant_person_id = v_conv.participant_person_id
        and navigator_person_id = v_conv.coach_person_id and status = 'active');
  else
    v_active := exists (select 1 from recoveryos.coaching_relationships
      where participant_person_id = v_conv.participant_person_id
        and coach_person_id = v_conv.coach_person_id and status = 'active');
  end if;
  if not v_active then
    return jsonb_build_object('ok', false, 'code', 'relationship_ended',
      'message', 'This conversation is read-only now.');
  end if;

  insert into recoveryos.messages (conversation_id, sender_person_id, body)
  values (v_conv.id, v_me, v_body)
  returning id, created_at into v_msg_id, v_created;

  v_recipient := case when v_me = v_conv.participant_person_id
                      then v_conv.coach_person_id else v_conv.participant_person_id end;
  v_link := case
    when v_recipient = v_conv.participant_person_id then '/vrcc/messages'
    when v_conv.context = 'navigation' then '/navigator/messages/' || v_conv.participant_person_id
    else '/coach/messages/' || v_conv.participant_person_id end;
  select coalesce(nullif(trim(p.preferred_name), ''), nullif(trim(p.first_name), ''), 'your support person')
    into v_sender_name from recoveryos.people p where p.id = v_me;

  if not exists (select 1 from recoveryos.notifications
                 where recipient_person_id = v_recipient and kind = 'new_message'
                   and link_path = v_link and read_at is null) then
    perform recoveryos.emit_notification(v_recipient, 'new_message',
      'New message from ' || v_sender_name, '', v_link, null);
  end if;

  return jsonb_build_object('ok', true, 'code', 'sent', 'message_id', v_msg_id, 'created_at', v_created);
end $$;

create or replace function recoveryos.mark_conversation_read(
  p_conversation_id bigint
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_conv recoveryos.conversations%rowtype;
  v_link text;
  v_count int;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  select * into v_conv from recoveryos.conversations where id = p_conversation_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.conversation_members
                 where conversation_id = v_conv.id and person_id = v_me) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  update recoveryos.messages
     set read_at = now()
   where conversation_id = v_conv.id and sender_person_id <> v_me and read_at is null;
  get diagnostics v_count = row_count;

  v_link := case
    when v_me = v_conv.participant_person_id then '/vrcc/messages'
    when v_conv.context = 'navigation' then '/navigator/messages/' || v_conv.participant_person_id
    else '/coach/messages/' || v_conv.participant_person_id end;
  update recoveryos.notifications
     set read_at = now()
   where recipient_person_id = v_me and kind = 'new_message'
     and link_path = v_link and read_at is null;

  return jsonb_build_object('ok', true, 'code', 'marked', 'messages_marked', v_count);
end $$;

-- ---------------------------------------------------------------------------
-- 8) Navigation needs — funder-neutral taxonomy, humane lifecycle
-- ---------------------------------------------------------------------------
create table if not exists recoveryos.navigation_needs (
  id bigint generated always as identity primary key,
  person_id bigint not null references recoveryos.people(id) on delete cascade,
  navigation_relationship_id bigint references recoveryos.navigation_relationships(id),
  support_request_id bigint references recoveryos.support_requests(id),
  need_category text not null check (need_category in (
    'housing','recovery_residence','transportation','treatment_healthcare','mental_health',
    'employment','education_training','food_basic_needs','benefits_financial','legal_reentry',
    'identification_documents','family_childcare','digital_access','social_connection',
    'recovery_support','other')),
  status text not null default 'identified' check (status in (
    'identified','in_progress','resolved','partially_resolved','unresolved','deferred')),
  identified_at timestamptz not null default now(),
  resolved_at timestamptz,
  note text,
  created_by_person_id bigint references recoveryos.people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists navigation_needs_person_idx on recoveryos.navigation_needs(person_id, status);
create index if not exists navigation_needs_rel_idx on recoveryos.navigation_needs(navigation_relationship_id);
alter table recoveryos.navigation_needs enable row level security;
drop trigger if exists trg_navigation_needs_touch on recoveryos.navigation_needs;
create trigger trg_navigation_needs_touch before update on recoveryos.navigation_needs
  for each row execute function recoveryos.touch_updated_at();

create policy nav_needs_select on recoveryos.navigation_needs for select to authenticated
  using (person_id = recoveryos.current_person_id()
         or person_id in (select recoveryos.my_navigation_participant_ids())
         or recoveryos.is_admin_staff());
-- Writes are RPC-only: no INSERT/UPDATE policies exist.

create or replace function recoveryos.identify_navigation_need(
  p_person_id bigint, p_need_category text,
  p_note text default null, p_support_request_id bigint default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel_id bigint;
  v_need_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select id into v_rel_id from recoveryos.navigation_relationships
    where participant_person_id = p_person_id and navigator_person_id = v_me and status = 'active'
    order by is_primary desc limit 1;
  if v_rel_id is null and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Needs are identified within an active navigation relationship.');
  end if;

  insert into recoveryos.navigation_needs
    (person_id, navigation_relationship_id, support_request_id, need_category, note, created_by_person_id)
  values (p_person_id, v_rel_id, p_support_request_id, p_need_category, nullif(p_note,''), v_me)
  returning id into v_need_id;

  return jsonb_build_object('ok', true, 'code', 'identified', 'need_id', v_need_id);
exception when check_violation then
  return jsonb_build_object('ok', false, 'code', 'invalid_category');
end $$;

create or replace function recoveryos.update_navigation_need_status(
  p_need_id bigint, p_status text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_need recoveryos.navigation_needs%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('identified','in_progress','resolved','partially_resolved','unresolved','deferred') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_need from recoveryos.navigation_needs where id = p_need_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.navigation_relationships
                 where id = v_need.navigation_relationship_id and navigator_person_id = v_me and status='active')
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_need.status = p_status then
    return jsonb_build_object('ok', true, 'code', 'already_set');
  end if;
  update recoveryos.navigation_needs
     set status = p_status,
         resolved_at = case when p_status in ('resolved','partially_resolved') then now() else null end
   where id = p_need_id;
  return jsonb_build_object('ok', true, 'code', 'updated');
end $$;

-- ---------------------------------------------------------------------------
-- 9) Navigation referrals — the closed-loop connection record
--    (distinct from public recovery-residence `referrals`, which is untouched)
-- ---------------------------------------------------------------------------
create table if not exists recoveryos.navigation_referrals (
  id bigint generated always as identity primary key,
  person_id bigint not null references recoveryos.people(id) on delete cascade,
  navigation_relationship_id bigint references recoveryos.navigation_relationships(id),
  navigation_need_id bigint references recoveryos.navigation_needs(id),
  resource_id bigint references recoveryos.resources(id),
  organization_id bigint references recoveryos.organizations(id),
  destination_name text,
  referral_type text not null check (referral_type in ('information','referral','warm_handoff')),
  status text not null default 'initiated' check (status in (
    'initiated','contact_attempted','connected','not_connected',
    'participant_declined','partner_unavailable','closed')),
  connection_evidence text check (connection_evidence in (
    'participant_report','navigator_confirmation','partner_confirmation','platform_evidence')),
  attempted_at timestamptz,
  connected_at timestamptz,
  closed_at timestamptz,
  note text,
  created_by_person_id bigint references recoveryos.people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (resource_id is not null or organization_id is not null
         or nullif(trim(coalesce(destination_name,'')), '') is not null)
);
create index if not exists navigation_referrals_person_idx on recoveryos.navigation_referrals(person_id, status);
create index if not exists navigation_referrals_need_idx on recoveryos.navigation_referrals(navigation_need_id);
alter table recoveryos.navigation_referrals enable row level security;
drop trigger if exists trg_navigation_referrals_touch on recoveryos.navigation_referrals;
create trigger trg_navigation_referrals_touch before update on recoveryos.navigation_referrals
  for each row execute function recoveryos.touch_updated_at();

create policy nav_referrals_select on recoveryos.navigation_referrals for select to authenticated
  using (person_id = recoveryos.current_person_id()
         or person_id in (select recoveryos.my_navigation_participant_ids())
         or recoveryos.is_admin_staff());
-- Writes are RPC-only.

create or replace function recoveryos.create_navigation_referral(
  p_person_id bigint, p_referral_type text,
  p_need_id bigint default null, p_resource_id bigint default null,
  p_organization_id bigint default null, p_destination_name text default null,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel_id bigint;
  v_ref_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_referral_type not in ('information','referral','warm_handoff') then
    return jsonb_build_object('ok', false, 'code', 'invalid_type');
  end if;
  select id into v_rel_id from recoveryos.navigation_relationships
    where participant_person_id = p_person_id and navigator_person_id = v_me and status = 'active'
    order by is_primary desc limit 1;
  if v_rel_id is null and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_need_id is not null and not exists
     (select 1 from recoveryos.navigation_needs where id = p_need_id and person_id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'need_mismatch');
  end if;

  begin
    insert into recoveryos.navigation_referrals
      (person_id, navigation_relationship_id, navigation_need_id, resource_id, organization_id,
       destination_name, referral_type, note, created_by_person_id)
    values (p_person_id, v_rel_id, p_need_id, p_resource_id, p_organization_id,
            nullif(trim(coalesce(p_destination_name,'')),''), p_referral_type, nullif(p_note,''), v_me)
    returning id into v_ref_id;
  exception when check_violation then
    return jsonb_build_object('ok', false, 'code', 'destination_required',
      'message', 'Say where they''re being connected — a resource, organization, or destination.');
  end;

  -- A need with a referral is being worked.
  if p_need_id is not null then
    update recoveryos.navigation_needs set status = 'in_progress'
      where id = p_need_id and status = 'identified';
  end if;

  -- Participant-facing, deliberately generic (no need category in the title — §45).
  perform recoveryos.emit_notification(p_person_id, 'navigation_step',
    'A new connection step from your navigator', '', '/vrcc/connect',
    'nav_ref:' || v_ref_id || ':' || p_person_id);

  return jsonb_build_object('ok', true, 'code', 'created', 'referral_id', v_ref_id);
end $$;

-- Outcome recording — activity vs outcome stays distinguished; partner
-- confirmation is consent-gated (SUD disclosure is never implied by role).
create or replace function recoveryos.record_referral_outcome(
  p_referral_id bigint, p_status text, p_evidence text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_ref recoveryos.navigation_referrals%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_status not in ('initiated','contact_attempted','connected','not_connected',
                      'participant_declined','partner_unavailable','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  if p_evidence is not null and p_evidence not in
     ('participant_report','navigator_confirmation','partner_confirmation','platform_evidence') then
    return jsonb_build_object('ok', false, 'code', 'invalid_evidence');
  end if;

  select * into v_ref from recoveryos.navigation_referrals where id = p_referral_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.navigation_relationships
                 where id = v_ref.navigation_relationship_id
                   and navigator_person_id = v_me and status = 'active')
     and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if p_status = 'connected' and p_evidence is null then
    return jsonb_build_object('ok', false, 'code', 'evidence_required',
      'message', 'Say how you know they connected.');
  end if;

  -- Asking a partner "did they show up" discloses the relationship — requires
  -- an active data-sharing consent. Without it, follow up with the participant.
  if p_evidence = 'partner_confirmation' and not exists (
      select 1 from recoveryos.consent_grants g
      join recoveryos.consent_types t on t.id = g.consent_type_id
      where g.person_id = v_ref.person_id and t.category = 'data_sharing'
        and g.status = 'granted' and g.revoked_at is null
        and (g.expires_at is null or g.expires_at > now())) then
    return jsonb_build_object('ok', false, 'code', 'consent_required',
      'message', 'There''s no data-sharing consent on file — check with the participant directly instead.');
  end if;

  if v_ref.status = p_status then
    return jsonb_build_object('ok', true, 'code', 'already_set');
  end if;

  update recoveryos.navigation_referrals
     set status = p_status,
         connection_evidence = coalesce(p_evidence, connection_evidence),
         attempted_at = coalesce(attempted_at,
           case when p_status in ('contact_attempted','connected','not_connected') then now() end),
         connected_at = case when p_status = 'connected' then now() else connected_at end,
         closed_at = case when p_status = 'closed' then now() else closed_at end
   where id = p_referral_id;

  return jsonb_build_object('ok', true, 'code', 'updated');
end $$;

-- Participant loop-closure voice: "Were you able to connect?"
create or replace function recoveryos.confirm_my_connection(
  p_referral_id bigint, p_response text
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_ref recoveryos.navigation_referrals%rowtype;
  v_navigator bigint;
  v_name text;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'no_person'); end if;
  if p_response not in ('yes','not_yet','no_longer_needed','need_more_help') then
    return jsonb_build_object('ok', false, 'code', 'invalid_response');
  end if;
  select * into v_ref from recoveryos.navigation_referrals where id = p_referral_id for update;
  if not found or v_ref.person_id <> v_me then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  if p_response = 'yes' then
    update recoveryos.navigation_referrals
       set status = 'connected', connection_evidence = 'participant_report',
           connected_at = coalesce(connected_at, now()),
           attempted_at = coalesce(attempted_at, now())
     where id = p_referral_id;
  elsif p_response = 'not_yet' then
    update recoveryos.navigation_referrals
       set status = case when status in ('initiated') then 'contact_attempted' else status end,
           attempted_at = coalesce(attempted_at, now())
     where id = p_referral_id;
  elsif p_response = 'no_longer_needed' then
    update recoveryos.navigation_referrals
       set status = 'participant_declined', connection_evidence = 'participant_report',
           closed_at = coalesce(closed_at, now())
     where id = p_referral_id;
  end if;
  -- 'need_more_help' changes nothing on the row; it asks a human to step in.

  select navigator_person_id into v_navigator from recoveryos.navigation_relationships
    where id = v_ref.navigation_relationship_id;
  select coalesce(nullif(trim(preferred_name),''), nullif(trim(first_name),''), 'A participant')
    into v_name from recoveryos.people where id = v_me;
  perform recoveryos.emit_notification(v_navigator, 'connection_response',
    v_name || ' responded about a connection', '', '/navigator/people/' || v_me,
    null);

  return jsonb_build_object('ok', true, 'code', 'recorded', 'response', p_response);
end $$;

-- ---------------------------------------------------------------------------
-- 10) Service-event attestation — delivery is claimed by a human, never inferred
-- ---------------------------------------------------------------------------
alter table recoveryos.service_events
  add column if not exists appointment_id bigint references recoveryos.appointments(id),
  add column if not exists coaching_relationship_id bigint references recoveryos.coaching_relationships(id),
  add column if not exists navigation_relationship_id bigint references recoveryos.navigation_relationships(id),
  add column if not exists navigation_referral_id bigint references recoveryos.navigation_referrals(id);

-- One completed appointment → at most one service event, structurally.
create unique index if not exists service_events_appointment_uidx
  on recoveryos.service_events(appointment_id) where appointment_id is not null;

insert into recoveryos.service_types (key, name, category)
select 'resource_navigation', 'Resource Navigation', 'navigation'
where not exists (select 1 from recoveryos.service_types where key = 'resource_navigation');

create or replace function recoveryos.record_navigation_service_event(
  p_person_id bigint,
  p_modality recoveryos.service_modality default 'phone',
  p_delivery_context recoveryos.delivery_context default 'vrcc',
  p_started_at timestamptz default now(),
  p_duration_minutes int default null,
  p_referral_id bigint default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel recoveryos.navigation_relationships%rowtype;
  v_service_type bigint;
  v_existing bigint;
  v_event_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_rel from recoveryos.navigation_relationships
    where participant_person_id = p_person_id and navigator_person_id = v_me and status = 'active'
    order by is_primary desc limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Navigation service is recorded within an active navigation relationship.');
  end if;
  if p_referral_id is not null and not exists
     (select 1 from recoveryos.navigation_referrals where id = p_referral_id and person_id = p_person_id) then
    return jsonb_build_object('ok', false, 'code', 'referral_mismatch');
  end if;

  select id into v_service_type from recoveryos.service_types where key = 'resource_navigation';

  -- Idempotent legitimate retry: the same navigator attesting the same instant
  -- for the same person is one interaction, not two.
  select id into v_existing from recoveryos.service_events
    where person_id = p_person_id and provider_person_id = v_me
      and service_type_id = v_service_type and started_at = p_started_at;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_recorded', 'service_event_id', v_existing);
  end if;

  insert into recoveryos.service_events
    (person_id, service_type_id, provider_person_id, organization_id,
     delivery_context, modality, started_at, ended_at,
     navigation_relationship_id, navigation_referral_id)
  values
    (p_person_id, v_service_type, v_me, v_rel.organization_id,
     p_delivery_context, p_modality, p_started_at,
     case when p_duration_minutes is not null
          then p_started_at + make_interval(mins => p_duration_minutes) end,
     v_rel.id, p_referral_id)
  returning id into v_event_id;

  return jsonb_build_object('ok', true, 'code', 'recorded', 'service_event_id', v_event_id);
end $$;

-- Coach companion (P4D §31): explicit completed-session attestation → T4b evidence.
create or replace function recoveryos.complete_session(
  p_appointment_id bigint, p_duration_minutes int default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_a recoveryos.appointments%rowtype;
  v_existing bigint;
  v_event_id bigint;
  v_ends timestamptz;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_a from recoveryos.appointments where id = p_appointment_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_a.provider_person_id <> v_me and not recoveryos.is_admin_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  select id into v_existing from recoveryos.service_events where appointment_id = v_a.id;
  if v_a.status = 'completed' and v_existing is not null then
    return jsonb_build_object('ok', true, 'code', 'already_completed', 'service_event_id', v_existing);
  end if;
  if v_a.status not in ('confirmed','completed') then
    return jsonb_build_object('ok', false, 'code', 'not_completable',
      'message', 'Only a confirmed session can be marked complete.');
  end if;
  if v_a.starts_at > now() then
    return jsonb_build_object('ok', false, 'code', 'not_started_yet',
      'message', 'This session hasn''t started yet.');
  end if;

  v_ends := case when p_duration_minutes is not null
                 then v_a.starts_at + make_interval(mins => p_duration_minutes)
                 else coalesce(v_a.ends_at, v_a.starts_at + interval '50 minutes') end;

  update recoveryos.appointments set status = 'completed', updated_at = now() where id = v_a.id;

  begin
    insert into recoveryos.service_events
      (person_id, service_type_id, provider_person_id, organization_id, program_id,
       delivery_context, modality, started_at, ended_at, appointment_id, coaching_relationship_id)
    values
      (v_a.person_id, v_a.service_type_id, v_a.provider_person_id,
       coalesce(v_a.organization_id, 1), v_a.program_id,
       case when v_a.modality in ('video','phone','chat') then 'virtual'::recoveryos.delivery_context
            else 'vrcc'::recoveryos.delivery_context end,
       v_a.modality, v_a.starts_at, v_ends, v_a.id, v_a.coaching_relationship_id)
    returning id into v_event_id;
  exception when unique_violation then
    select id into v_event_id from recoveryos.service_events where appointment_id = v_a.id;
    return jsonb_build_object('ok', true, 'code', 'already_completed', 'service_event_id', v_event_id);
  end;

  return jsonb_build_object('ok', true, 'code', 'completed', 'service_event_id', v_event_id);
end $$;

-- ---------------------------------------------------------------------------
-- 11) Grants
-- ---------------------------------------------------------------------------
revoke execute on function
  recoveryos.assign_participant_navigator(bigint, bigint),
  recoveryos.end_navigation_relationship(bigint, text),
  recoveryos.ensure_relationship_conversation(bigint, text),
  recoveryos.identify_navigation_need(bigint, text, text, bigint),
  recoveryos.update_navigation_need_status(bigint, text),
  recoveryos.create_navigation_referral(bigint, text, bigint, bigint, bigint, text, text),
  recoveryos.record_referral_outcome(bigint, text, text),
  recoveryos.confirm_my_connection(bigint, text),
  recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint),
  recoveryos.complete_session(bigint, int)
from public, anon;
grant execute on function
  recoveryos.assign_participant_navigator(bigint, bigint),
  recoveryos.end_navigation_relationship(bigint, text),
  recoveryos.ensure_relationship_conversation(bigint, text),
  recoveryos.identify_navigation_need(bigint, text, text, bigint),
  recoveryos.update_navigation_need_status(bigint, text),
  recoveryos.create_navigation_referral(bigint, text, bigint, bigint, bigint, text, text),
  recoveryos.record_referral_outcome(bigint, text, text),
  recoveryos.confirm_my_connection(bigint, text),
  recoveryos.record_navigation_service_event(bigint, recoveryos.service_modality, recoveryos.delivery_context, timestamptz, int, bigint),
  recoveryos.complete_session(bigint, int)
to authenticated;

notify pgrst, 'reload schema';
