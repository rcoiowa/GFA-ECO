-- RecoveryOS Live Projection (P3B). Applied live as recoveryos_0031_v2_live_projection.
-- ONE-WAY projection triggers: a v2_* write (which remains the authoritative write path
-- during P3B) additionally projects into the canonical shadow so canonical READS stay
-- synchronized. Direction is strictly legacy → canonical (never circular).
--
-- SAFETY (critical): every projection is EXCEPTION-SAFE. A projection failure is logged to
-- recoveryos.backfill_log and SWALLOWED — it can NEVER abort or fail the underlying v2 write.
-- Unmapped identities are skipped (recorded), never guessed. Idempotent via legacy_ref.
--
-- These triggers do not change v2 write semantics or authority; they only keep canonical
-- reads current. They are removed at P3C when canonical becomes write-authoritative (the
-- direction then reverses: canonical → legacy compatibility projection).

begin;

create or replace function recoveryos.person_for_v2(p_v2 uuid)
returns bigint language sql stable security definer set search_path = recoveryos, public as $$
  select person_id from recoveryos.v2_identity_map where v2_profile_id = p_v2 and confidence = 'exact';
$$;

-- ---- support_requests (+ appointment on confirm) --------------------------------
create or replace function recoveryos.project_v2_session_request()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_person bigint; v_coach bigint; v_status text; v_sr_id bigint;
begin
  begin
    v_person := recoveryos.person_for_v2(NEW.participant_id);
    if v_person is null then
      insert into recoveryos.backfill_log(domain, source_count, skipped_count, detail)
        values ('projection_support_request', 1, 1, jsonb_build_object('reason','participant unmapped','legacy_ref',NEW.id));
      return NEW;
    end if;
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

    -- confirmed session -> canonical appointment (one-way, coach must be mapped)
    if NEW.status = 'confirmed' and NEW.scheduled_at is not null then
      v_coach := recoveryos.person_for_v2(NEW.coach_id);
      if v_coach is not null then
        insert into recoveryos.appointments
          (person_id, provider_person_id, title, starts_at, status, organization_id, program_id,
           modality, meeting_url, timezone, confirmed_at, support_request_id, legacy_ref)
        values (v_person, v_coach, 'Coaching session', NEW.scheduled_at, 'confirmed', 1, 1,
           NEW.mode::text::recoveryos.service_modality, NEW.meeting_url, 'America/Chicago',
           NEW.confirmed_at, v_sr_id, NEW.id)
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
revoke execute on function recoveryos.project_v2_session_request() from public, anon, authenticated;
drop trigger if exists trg_project_v2_session_request on public.v2_session_requests;
create trigger trg_project_v2_session_request
  after insert or update on public.v2_session_requests
  for each row execute function recoveryos.project_v2_session_request();

-- ---- coaching_relationships ------------------------------------------------------
create or replace function recoveryos.project_v2_coach_assignment()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_part bigint; v_coach bigint;
begin
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
revoke execute on function recoveryos.project_v2_coach_assignment() from public, anon, authenticated;
drop trigger if exists trg_project_v2_coach_assignment on public.v2_coach_assignments;
create trigger trg_project_v2_coach_assignment
  after insert or update on public.v2_coach_assignments
  for each row execute function recoveryos.project_v2_coach_assignment();

-- ---- notifications ---------------------------------------------------------------
create or replace function recoveryos.project_v2_notification()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_rec bigint;
begin
  begin
    v_rec := recoveryos.person_for_v2(NEW.recipient_id);
    if v_rec is null then
      insert into recoveryos.backfill_log(domain, source_count, skipped_count, detail)
        values ('projection_notification', 1, 1, jsonb_build_object('reason','recipient unmapped','legacy_ref',NEW.id));
      return NEW;
    end if;
    insert into recoveryos.notifications
      (recipient_person_id, kind, title, body, link_path, read_at, legacy_ref, created_at)
    values (v_rec, NEW.kind::text, NEW.title, NEW.body, NEW.link_path, NEW.read_at, NEW.id, NEW.created_at)
    on conflict (legacy_ref) where legacy_ref is not null
      do update set read_at = excluded.read_at;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('projection_notification', 1, jsonb_build_object('sqlerrm', sqlerrm, 'legacy_ref', NEW.id));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.project_v2_notification() from public, anon, authenticated;
drop trigger if exists trg_project_v2_notification on public.v2_notifications;
create trigger trg_project_v2_notification
  after insert or update on public.v2_notifications
  for each row execute function recoveryos.project_v2_notification();

-- ---- messages --------------------------------------------------------------------
create or replace function recoveryos.project_v2_direct_message()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_part bigint; v_coach bigint; v_sender bigint; v_conv bigint;
begin
  begin
    v_part := recoveryos.person_for_v2(NEW.participant_id);
    v_coach := recoveryos.person_for_v2(NEW.coach_id);
    v_sender := recoveryos.person_for_v2(NEW.sender_id);
    if v_part is null or v_coach is null or v_sender is null then
      insert into recoveryos.backfill_log(domain, source_count, skipped_count, detail)
        values ('projection_message', 1, 1, jsonb_build_object('reason','endpoint unmapped','legacy_ref',NEW.id));
      return NEW;
    end if;
    select id into v_conv from recoveryos.conversations
      where participant_person_id = v_part and coach_person_id = v_coach and context = 'coaching';
    if v_conv is null then
      insert into recoveryos.conversations(participant_person_id, coach_person_id, context)
      values (v_part, v_coach, 'coaching') returning id into v_conv;
      insert into recoveryos.conversation_members(conversation_id, person_id, member_role)
      values (v_conv, v_part, 'participant'), (v_conv, v_coach, 'coach')
      on conflict (conversation_id, person_id) do nothing;
    end if;
    insert into recoveryos.messages(conversation_id, sender_person_id, body, read_at, legacy_ref, created_at)
    values (v_conv, v_sender, NEW.body, NEW.read_at, NEW.id, NEW.created_at)
    on conflict (legacy_ref) where legacy_ref is not null
      do update set read_at = excluded.read_at;
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('projection_message', 1, jsonb_build_object('sqlerrm', sqlerrm, 'legacy_ref', NEW.id));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.project_v2_direct_message() from public, anon, authenticated;
drop trigger if exists trg_project_v2_direct_message on public.v2_direct_messages;
create trigger trg_project_v2_direct_message
  after insert on public.v2_direct_messages
  for each row execute function recoveryos.project_v2_direct_message();

commit;
