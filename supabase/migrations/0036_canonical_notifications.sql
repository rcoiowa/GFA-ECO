-- RecoveryOS Canonical Notification Generation (P3C-B2). Applied live as
-- recoveryos_0036_canonical_notifications.
--
-- Canonical in-app notification generation for migrated domain events, with a single-source
-- dedup guarantee and a dormant canonical->v2 compatibility projection. Everything here is
-- DORMANT: notifications remains write_authority='v2', so the v2 emitters (v2_on_session_confirmed,
-- v2_session_request_notify) stay the one source and no duplicates are produced. When notifications
-- is flipped to 'canonical' (a later wave), canonical generation becomes the single source and the
-- compat projection copies each canonical notification into v2_notifications for the legacy UI
-- WITHOUT emitting a second independent event. External email/SMS remain OFF (in-app only).

begin;

-- Idempotency key so a given domain event yields exactly one notification per recipient.
alter table recoveryos.notifications add column if not exists dedup_key text;
create unique index if not exists notifications_dedup_key_idx
  on recoveryos.notifications (dedup_key) where dedup_key is not null;

-- Low-level emitter: one canonical notification, deduplicated. Returns the id, or null if the
-- dedup_key already existed (idempotent no-op).
create or replace function recoveryos.emit_notification(
  p_recipient_person_id bigint, p_kind text, p_title text, p_body text, p_link text, p_dedup text
) returns bigint language plpgsql security definer set search_path = recoveryos, public as $$
declare v_id bigint;
begin
  if p_recipient_person_id is null then return null; end if;
  insert into recoveryos.notifications (recipient_person_id, kind, title, body, link_path, dedup_key)
  values (p_recipient_person_id, p_kind, p_title, p_body, p_link, p_dedup)
  on conflict (dedup_key) where dedup_key is not null do nothing
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function recoveryos.emit_notification(bigint,text,text,text,text,text) from public, anon, authenticated;

-- Domain event -> canonical notifications for the appointment's participant + provider.
-- Gated on notifications authority = 'canonical' (dormant until flipped). Fixture recipients still
-- receive in-app notifications (allowed for controlled tests); external delivery, when it exists,
-- must separately exclude is_production_person=false — recorded in the notify contract, not here.
create or replace function recoveryos.notify_appointment_event(p_appointment_id bigint, p_event text)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_a recoveryos.appointments%rowtype;
  v_kind text; v_when text; v_p bigint; v_c bigint;
begin
  if recoveryos.write_authority_of('notifications') <> 'canonical' then
    return jsonb_build_object('ok', true, 'code', 'dormant');   -- v2 is the source
  end if;
  select * into v_a from recoveryos.appointments where id = p_appointment_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;

  v_kind := case p_event when 'confirmed' then 'session_confirmed'
                         when 'cancelled' then 'session_cancelled'
                         when 'rescheduled' then 'general'
                         when 'meeting_ready' then 'general' else 'general' end;
  v_when := to_char(v_a.starts_at at time zone coalesce(v_a.timezone,'America/Chicago'), 'Dy Mon DD at HH12:MI AM');
  v_p := recoveryos.emit_notification(v_a.person_id, v_kind, 'Session ' || p_event,
           'Your session is ' || p_event || ' for ' || v_when || ' (Central).', '/sessions',
           'appt:' || p_event || ':' || v_a.id || ':' || v_a.person_id);
  v_c := recoveryos.emit_notification(v_a.provider_person_id, v_kind, 'Session ' || p_event,
           'Session ' || p_event || ' for ' || v_when || ' (Central).', '/coach/sessions',
           'appt:' || p_event || ':' || v_a.id || ':' || coalesce(v_a.provider_person_id,0));
  return jsonb_build_object('ok', true, 'code', 'emitted',
    'participant_notification', v_p, 'provider_notification', v_c);
end $$;
revoke execute on function recoveryos.notify_appointment_event(bigint,text) from public, anon, authenticated;

-- Relationship event -> canonical notification (coach assigned). Gated/dormant.
create or replace function recoveryos.notify_relationship_assigned(p_relationship_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare v_r recoveryos.coaching_relationships%rowtype; v_p bigint;
begin
  if recoveryos.write_authority_of('notifications') <> 'canonical' then
    return jsonb_build_object('ok', true, 'code', 'dormant'); end if;
  select * into v_r from recoveryos.coaching_relationships where id = p_relationship_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  v_p := recoveryos.emit_notification(v_r.participant_person_id, 'coach_assigned', 'Coach assigned',
           'You have been matched with a recovery coach.', '/coach',
           'rel_assigned:' || v_r.id || ':' || v_r.participant_person_id);
  return jsonb_build_object('ok', true, 'code', 'emitted', 'notification', v_p);
end $$;
revoke execute on function recoveryos.notify_relationship_assigned(bigint) from public, anon, authenticated;

-- Canonical -> v2 notification compatibility (dormant until notifications='canonical').
-- Copies each canonical notification into v2_notifications for the legacy UI, mapped to a v2 recipient
-- uuid + a valid v2_notification_kind, WITHOUT emitting a second independent event. Idempotent by the
-- (recipient_id, title, created_at)-style natural key via legacy linkage; exception-safe.
create or replace function recoveryos.compat_notification_to_v2()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_rec uuid; v_kind public.v2_notification_kind;
begin
  if recoveryos.write_authority_of('notifications') <> 'canonical' then return NEW; end if;
  begin
    perform set_config('app.compat_projection', '1', true);   -- suppress inbound v2->canonical loop
    v_rec := recoveryos.v2_for_person(NEW.recipient_person_id);
    if v_rec is null then
      insert into recoveryos.backfill_log(domain, skipped_count, detail)
        values ('compat_notification', 1, jsonb_build_object('reason','no v2 identity','notif',NEW.id));
      return NEW;
    end if;
    -- map to a valid v2 kind; unknown canonical kinds degrade to 'general'
    begin v_kind := NEW.kind::public.v2_notification_kind; exception when others then v_kind := 'general'; end;
    insert into public.v2_notifications (recipient_id, kind, title, body, link_path, read_at, created_at)
    values (v_rec, v_kind, NEW.title, NEW.body, NEW.link_path, NEW.read_at, NEW.created_at);
  exception when others then
    insert into recoveryos.backfill_log(domain, exception_count, detail)
      values ('compat_notification', 1, jsonb_build_object('sqlerrm', sqlerrm, 'notif', NEW.id));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.compat_notification_to_v2() from public, anon, authenticated;
drop trigger if exists trg_compat_notification_to_v2 on recoveryos.notifications;
create trigger trg_compat_notification_to_v2
  after insert on recoveryos.notifications
  for each row execute function recoveryos.compat_notification_to_v2();

-- Anti-loop: the inbound v2->canonical notification projection must short-circuit when the write
-- came from our compat projection. Body otherwise identical to 0032 (authority-gated).
create or replace function recoveryos.project_v2_notification()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_rec bigint;
begin
  if current_setting('app.compat_projection', true) = '1' then return NEW; end if;
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

commit;
notify pgrst, 'reload schema';
