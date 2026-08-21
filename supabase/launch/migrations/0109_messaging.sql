-- 0109_messaging.sql — P4D-1: canonical relationship messaging.
--
-- Contract audit of 0025/0026 found: conversations already carry a
-- (participant, coach, context) uniqueness link and explicit membership, but no
-- creation path existed anywhere (no INSERT policy, no RPC — messaging was
-- structurally unreachable); messages permitted direct member INSERT (sender
-- pinned to self by RLS, but with no active-relationship check, no trim/empty
-- handling beyond a length CHECK, and no notification or measurement evidence);
-- msg_mark_read was an unrestricted row UPDATE (a member could rewrite message
-- BODIES, and a sender could mark their own message read); and admin staff could
-- read message bodies via msg_member_select. This migration:
--
--   1. makes conversation creation server-authoritative + idempotent
--      (ensure_relationship_conversation — lazy, on first open/send);
--   2. makes message send RPC-only (send_message: membership + ACTIVE
--      relationship required, body trimmed, empty rejected, sender/timestamps
--      pinned server-side, humane notification with NO message content);
--   3. makes read state a recipient-side transition only
--      (mark_conversation_read — messages become immutable to clients);
--   4. narrows admin visibility to conversation METADATA (existence, recency),
--      never message bodies — system administration is not care access;
--   5. adds messages + notifications to the realtime publication so clients
--      can subscribe (RLS still gates who receives each row).
--
-- Ended-relationship policy (conservative, flagged for product approval):
-- history stays readable to its members; NO new messages once the relationship
-- is no longer active.

-- ---------------------------------------------------------------------------
-- 1) Policy corrections
-- ---------------------------------------------------------------------------

-- Messages are immutable to clients; read-state moves through mark_conversation_read.
drop policy if exists msg_mark_read on recoveryos.messages;

-- Sends go through send_message; no direct INSERT path remains.
drop policy if exists msg_member_insert on recoveryos.messages;

-- Members only. Admin retains conversation/membership metadata via the
-- conversations + conversation_members policies, but message bodies are
-- readable exclusively by the people in the conversation.
drop policy if exists msg_member_select on recoveryos.messages;
create policy msg_member_select on recoveryos.messages for select to authenticated
  using (conversation_id in (select recoveryos.my_conversation_ids()));

-- ---------------------------------------------------------------------------
-- 2) ensure_relationship_conversation — lazy, idempotent, relationship-scoped
-- ---------------------------------------------------------------------------
-- The client never supplies the pairing as authority: the caller is derived
-- from auth.uid(), the counterpart is validated against an ACTIVE coaching
-- relationship, and the (participant, coach, 'coaching') unique index makes
-- creation idempotent no matter how many times either side opens the thread.
-- A participant may omit p_other_person_id (their primary active coach is
-- implied); a coach must name which of their participants.
create or replace function recoveryos.ensure_relationship_conversation(
  p_other_person_id bigint default null
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_rel recoveryos.coaching_relationships%rowtype;
  v_conv_id bigint;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'no_person');
  end if;

  if p_other_person_id is null then
    select * into v_rel from recoveryos.coaching_relationships
    where participant_person_id = v_me and status = 'active'
    order by is_primary desc, started_at desc limit 1;
  else
    select * into v_rel from recoveryos.coaching_relationships
    where status = 'active'
      and ((participant_person_id = v_me and coach_person_id = p_other_person_id)
        or (coach_person_id = v_me and participant_person_id = p_other_person_id))
    order by is_primary desc, started_at desc limit 1;
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_authorized',
      'message', 'Messaging opens once you''re connected with someone.');
  end if;

  insert into recoveryos.conversations
      (participant_person_id, coach_person_id, coaching_relationship_id, context)
  values (v_rel.participant_person_id, v_rel.coach_person_id, v_rel.id, 'coaching')
  on conflict (participant_person_id, coach_person_id, context)
  do update set coaching_relationship_id =
       coalesce(recoveryos.conversations.coaching_relationship_id, excluded.coaching_relationship_id)
  returning id into v_conv_id;

  insert into recoveryos.conversation_members (conversation_id, person_id, member_role)
  values (v_conv_id, v_rel.participant_person_id, 'participant'),
         (v_conv_id, v_rel.coach_person_id, 'coach')
  on conflict (conversation_id, person_id) do nothing;

  return jsonb_build_object('ok', true, 'code', 'ready', 'conversation_id', v_conv_id);
end $$;

-- ---------------------------------------------------------------------------
-- 3) send_message — the only write path for messages
-- ---------------------------------------------------------------------------
create or replace function recoveryos.send_message(
  p_conversation_id bigint, p_body text
) returns jsonb
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_body text := trim(coalesce(p_body, ''));
  v_conv recoveryos.conversations%rowtype;
  v_recipient bigint;
  v_sender_name text;
  v_link text;
  v_msg_id bigint;
  v_created timestamptz;
begin
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'no_person');
  end if;
  if v_body = '' then
    return jsonb_build_object('ok', false, 'code', 'empty_message',
      'message', 'Write a message first.');
  end if;
  if length(v_body) > 4000 then
    return jsonb_build_object('ok', false, 'code', 'too_long',
      'message', 'That message is a little long — try splitting it up.');
  end if;

  select * into v_conv from recoveryos.conversations where id = p_conversation_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if not exists (select 1 from recoveryos.conversation_members
                 where conversation_id = v_conv.id and person_id = v_me) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  -- Ended-relationship policy: history remains readable, sending stops.
  if not exists (select 1 from recoveryos.coaching_relationships
                 where participant_person_id = v_conv.participant_person_id
                   and coach_person_id = v_conv.coach_person_id
                   and status = 'active') then
    return jsonb_build_object('ok', false, 'code', 'relationship_ended',
      'message', 'This conversation is read-only now.');
  end if;

  insert into recoveryos.messages (conversation_id, sender_person_id, body)
  values (v_conv.id, v_me, v_body)
  returning id, created_at into v_msg_id, v_created;

  -- In-app notification for the other person. Deliberately content-free (§8):
  -- name only, never the message body. One unread notification per thread —
  -- if they already have an unread one for this surface, don't stack another.
  v_recipient := case when v_me = v_conv.participant_person_id
                      then v_conv.coach_person_id else v_conv.participant_person_id end;
  v_link := case when v_recipient = v_conv.participant_person_id
                 then '/vrcc/messages'
                 else '/coach/messages/' || v_conv.participant_person_id end;
  select coalesce(nullif(trim(p.preferred_name), ''), nullif(trim(p.first_name), ''), 'your support person')
    into v_sender_name from recoveryos.people p where p.id = v_me;

  if not exists (select 1 from recoveryos.notifications
                 where recipient_person_id = v_recipient and kind = 'new_message'
                   and link_path = v_link and read_at is null) then
    perform recoveryos.emit_notification(v_recipient, 'new_message',
      'New message from ' || v_sender_name, '', v_link, null);
  end if;

  return jsonb_build_object('ok', true, 'code', 'sent',
    'message_id', v_msg_id, 'created_at', v_created);
end $$;

-- ---------------------------------------------------------------------------
-- 4) mark_conversation_read — recipient-side only, presentation-triggered
-- ---------------------------------------------------------------------------
-- Marks the OTHER person's messages read (a sender can never alter read state
-- of their own sent messages), and clears this thread's message notifications.
-- Called when the conversation is actually presented, never on background fetch.
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
  if v_me is null then
    return jsonb_build_object('ok', false, 'code', 'no_person');
  end if;
  select * into v_conv from recoveryos.conversations where id = p_conversation_id;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if not exists (select 1 from recoveryos.conversation_members
                 where conversation_id = v_conv.id and person_id = v_me) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  update recoveryos.messages
     set read_at = now()
   where conversation_id = v_conv.id and sender_person_id <> v_me and read_at is null;
  get diagnostics v_count = row_count;

  v_link := case when v_me = v_conv.participant_person_id
                 then '/vrcc/messages'
                 else '/coach/messages/' || v_conv.participant_person_id end;
  update recoveryos.notifications
     set read_at = now()
   where recipient_person_id = v_me and kind = 'new_message'
     and link_path = v_link and read_at is null;

  return jsonb_build_object('ok', true, 'code', 'marked', 'messages_marked', v_count);
end $$;

-- ---------------------------------------------------------------------------
-- 5) Grants
-- ---------------------------------------------------------------------------
revoke execute on function
  recoveryos.ensure_relationship_conversation(bigint),
  recoveryos.send_message(bigint, text),
  recoveryos.mark_conversation_read(bigint)
from public, anon;
grant execute on function
  recoveryos.ensure_relationship_conversation(bigint),
  recoveryos.send_message(bigint, text),
  recoveryos.mark_conversation_read(bigint)
to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Realtime publication — messages + notifications only (no all-database
--    subscription). RLS (member-only / recipient-only SELECT) gates delivery.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime'
                     and schemaname = 'recoveryos' and tablename = 'messages') then
      alter publication supabase_realtime add table recoveryos.messages;
    end if;
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime'
                     and schemaname = 'recoveryos' and tablename = 'notifications') then
      alter publication supabase_realtime add table recoveryos.notifications;
    end if;
  end if;
end $$;
