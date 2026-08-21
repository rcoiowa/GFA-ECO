-- RecoveryOS Write-Authority Cutover machinery (P3C-A). Applied live as
-- recoveryos_0032_write_authority_cutover. Builds the domain-by-domain write cutover
-- mechanism WITHOUT flipping any domain — every domain stays authority='v2'.
--
-- Core invariant (structural, not procedural): each domain has ONE authoritative writer,
-- selected by recoveryos.write_authority.authority ('v2' | 'canonical'). BOTH projection
-- directions self-gate on it:
--   * v2 → canonical projection (0031) fires only while authority = 'v2'
--   * canonical → v2 compatibility projection (this file) fires only while authority = 'canonical'
-- So the two directions can NEVER both be active for a domain — no circular sync is possible
-- by construction, and a cutover is a single-row UPDATE (set_write_authority).
--
-- This migration keeps ALL domains at 'v2'. No live write authority changes here. The compat
-- projections are dormant until a domain is flipped (P3C runbook), which also requires the
-- live consumer to be repointed to the canonical write RPCs + HTTP-verified.

begin;

create table recoveryos.write_authority (
  domain     text primary key,
  authority  text not null default 'v2' check (authority in ('v2','canonical')),
  updated_at timestamptz not null default now()
);
alter table recoveryos.write_authority enable row level security;
create policy wa_admin_select on recoveryos.write_authority for select to authenticated
  using (recoveryos.is_admin_staff());
insert into recoveryos.write_authority(domain) values
  ('relationships'),('support_requests'),('bookings'),('appointments'),('notifications'),('messages')
  on conflict do nothing;

create or replace function recoveryos.write_authority_of(p_domain text)
returns text language sql stable security definer set search_path = recoveryos, public as $$
  select coalesce((select authority from recoveryos.write_authority where domain = p_domain), 'v2');
$$;

create or replace function recoveryos.v2_for_person(p_person bigint)
returns uuid language sql stable security definer set search_path = recoveryos, public as $$
  select v2_profile_id from recoveryos.v2_identity_map
  where person_id = p_person and confidence = 'exact' order by v2_profile_id limit 1;
$$;

-- ---- Guard the existing v2 -> canonical projections on authority = 'v2' ----------
create or replace function recoveryos.project_v2_coach_assignment()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_part bigint; v_coach bigint;
begin
  if recoveryos.write_authority_of('relationships') <> 'v2' then return NEW; end if;
  begin
    v_part := recoveryos.person_for_v2(NEW.participant_id);
    v_coach := recoveryos.person_for_v2(NEW.coach_id);
    if v_part is null or v_coach is null then
      insert into recoveryos.backfill_log(domain, source_count, skipped_count, detail)
        values ('projection_relationship', 1, 1, jsonb_build_object('reason','endpoint unmapped','legacy_ref',NEW.id));
      return NEW;
    end if;
    insert into recoveryos.coaching_relationships
      (participant_person_id, coach_person_id, organization_id, started_at, ended_at,
       status, relationship_type, is_primary, assignment_source, legacy_ref)
    values (v_part, v_coach, 1, NEW.created_at::date, NEW.ended_at::date,
       case when NEW.is_active then 'active' else 'ended' end, 'coach', true, 'backfill', NEW.id)
    on conflict (legacy_ref) where legacy_ref is not null
      do update set status = case when NEW.is_active then 'active' else 'ended' end,
         ended_at = NEW.ended_at::date, updated_at = now();
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('projection_relationship', 1, jsonb_build_object('sqlerrm', sqlerrm, 'legacy_ref', NEW.id));
  end;
  return NEW;
end $$;

create or replace function recoveryos.project_v2_session_request()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_person bigint; v_coach bigint; v_status text; v_sr_id bigint;
begin
  begin
    v_person := recoveryos.person_for_v2(NEW.participant_id);
    if v_person is null then return NEW; end if;
    -- support-request portion (gated by support_requests authority)
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
    -- confirmed session -> appointment (gated by appointments authority)
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

create or replace function recoveryos.project_v2_notification()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_rec bigint;
begin
  if recoveryos.write_authority_of('notifications') <> 'v2' then return NEW; end if;
  begin
    v_rec := recoveryos.person_for_v2(NEW.recipient_id);
    if v_rec is null then return NEW; end if;
    insert into recoveryos.notifications (recipient_person_id, kind, title, body, link_path, read_at, legacy_ref, created_at)
    values (v_rec, NEW.kind::text, NEW.title, NEW.body, NEW.link_path, NEW.read_at, NEW.id, NEW.created_at)
    on conflict (legacy_ref) where legacy_ref is not null do update set read_at = excluded.read_at;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('projection_notification', 1, jsonb_build_object('sqlerrm', sqlerrm, 'legacy_ref', NEW.id));
  end;
  return NEW;
end $$;

-- (messages projection keeps its own guard on 'messages'; unchanged direction, add guard)
create or replace function recoveryos.project_v2_direct_message()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_part bigint; v_coach bigint; v_sender bigint; v_conv bigint;
begin
  if recoveryos.write_authority_of('messages') <> 'v2' then return NEW; end if;
  begin
    v_part := recoveryos.person_for_v2(NEW.participant_id);
    v_coach := recoveryos.person_for_v2(NEW.coach_id);
    v_sender := recoveryos.person_for_v2(NEW.sender_id);
    if v_part is null or v_coach is null or v_sender is null then return NEW; end if;
    select id into v_conv from recoveryos.conversations
      where participant_person_id = v_part and coach_person_id = v_coach and context='coaching';
    if v_conv is null then
      insert into recoveryos.conversations(participant_person_id, coach_person_id, context)
      values (v_part, v_coach, 'coaching') returning id into v_conv;
      insert into recoveryos.conversation_members(conversation_id, person_id, member_role)
      values (v_conv, v_part, 'participant'), (v_conv, v_coach, 'coach') on conflict do nothing;
    end if;
    insert into recoveryos.messages(conversation_id, sender_person_id, body, read_at, legacy_ref, created_at)
    values (v_conv, v_sender, NEW.body, NEW.read_at, NEW.id, NEW.created_at)
    on conflict (legacy_ref) where legacy_ref is not null do update set read_at = excluded.read_at;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('projection_message', 1, jsonb_build_object('sqlerrm', sqlerrm, 'legacy_ref', NEW.id));
  end;
  return NEW;
end $$;

-- ---- Canonical -> v2 compatibility projections (dormant until authority='canonical') ----

-- relationships: coaching_relationships -> v2_coach_assignments
create or replace function recoveryos.compat_relationship_to_v2()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_part uuid; v_coach uuid;
begin
  if recoveryos.write_authority_of('relationships') <> 'canonical' then return NEW; end if;
  begin
    v_part := recoveryos.v2_for_person(NEW.participant_person_id);
    v_coach := recoveryos.v2_for_person(NEW.coach_person_id);
    if v_part is null or v_coach is null then
      insert into recoveryos.backfill_log(domain, skipped_count, detail)
        values ('compat_relationship', 1, jsonb_build_object('reason','no v2 identity for person','rel',NEW.id));
      return NEW;
    end if;
    if NEW.legacy_ref is not null then
      update public.v2_coach_assignments set is_active = (NEW.status='active'),
             ended_at = case when NEW.status='active' then null else now() end
        where id = NEW.legacy_ref;
    else
      if NEW.status = 'active' then
        update public.v2_coach_assignments set is_active=false, ended_at=now()
          where participant_id = v_part and is_active;
        insert into public.v2_coach_assignments(participant_id, coach_id, assigned_by, method, is_active)
        values (v_part, v_coach, v_coach, 'admin_assign', true);
      end if;
    end if;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('compat_relationship', 1, jsonb_build_object('sqlerrm', sqlerrm, 'rel', NEW.id));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.compat_relationship_to_v2() from public, anon, authenticated;
drop trigger if exists trg_compat_relationship_to_v2 on recoveryos.coaching_relationships;
create trigger trg_compat_relationship_to_v2
  after insert or update on recoveryos.coaching_relationships
  for each row execute function recoveryos.compat_relationship_to_v2();

-- support_requests: support_requests -> v2_session_requests
create or replace function recoveryos.compat_support_request_to_v2()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_part uuid; v_status text;
begin
  if recoveryos.write_authority_of('support_requests') <> 'canonical' then return NEW; end if;
  begin
    v_part := recoveryos.v2_for_person(NEW.person_id);
    if v_part is null then
      insert into recoveryos.backfill_log(domain, skipped_count, detail)
        values ('compat_support_request', 1, jsonb_build_object('reason','no v2 identity','sr',NEW.id));
      return NEW;
    end if;
    v_status := case NEW.status
      when 'open' then 'requested' when 'submitted' then 'requested' when 'claimed' then 'requested'
      when 'assigned' then 'requested' when 'scheduled' then 'confirmed' when 'resolved' then 'completed'
      when 'cancelled' then 'cancelled' else 'requested' end;
    if NEW.legacy_ref is not null then
      update public.v2_session_requests set status = v_status::v2_session_status, topic = coalesce(NEW.focus, topic)
        where id = NEW.legacy_ref;
    else
      insert into public.v2_session_requests(participant_id, status, mode, topic, session_type, preferred_times, suggested_times)
      values (v_part, v_status::v2_session_status, NEW.preferred_modality::text::v2_session_mode,
              coalesce(NEW.focus,''), NEW.request_type, '[]'::jsonb, '[]'::jsonb);
    end if;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('compat_support_request', 1, jsonb_build_object('sqlerrm', sqlerrm, 'sr', NEW.id));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.compat_support_request_to_v2() from public, anon, authenticated;
drop trigger if exists trg_compat_support_request_to_v2 on recoveryos.support_requests;
create trigger trg_compat_support_request_to_v2
  after insert or update on recoveryos.support_requests
  for each row execute function recoveryos.compat_support_request_to_v2();

-- ---- Atomic per-domain cutover switch (admin/service only) ----------------------
create or replace function recoveryos.set_write_authority(p_domain text, p_authority text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
begin
  if p_authority not in ('v2','canonical') then
    return jsonb_build_object('ok', false, 'code', 'bad_authority');
  end if;
  update recoveryos.write_authority set authority = p_authority, updated_at = now() where domain = p_domain;
  if not found then return jsonb_build_object('ok', false, 'code', 'unknown_domain'); end if;
  -- keep migration_state in step
  update recoveryos.migration_state
    set stage = case when p_authority='canonical' then 'CANONICAL_WRITE' else 'CANONICAL_READ' end,
        notes = 'write_authority=' || p_authority || ' (set_write_authority ' || now()::text || ')'
    where domain = p_domain;
  return jsonb_build_object('ok', true, 'code', 'set', 'domain', p_domain, 'authority', p_authority);
end $$;
revoke execute on function recoveryos.set_write_authority(text, text) from public, anon, authenticated;

commit;
notify pgrst, 'reload schema';
