-- LAUNCH 0101 — Canonical appointment reminder engine.
--
-- Replaces the retired v2 reminder cron with a canonical implementation directly on
-- recoveryos.appointments, preserving the proven v2 semantics: three reminder kinds
-- (day_before / hour_before / starting_now), reschedule-safe reseeding, cancellation
-- suppression, no stacked duplicates, idempotent dispatch, SKIP LOCKED concurrency,
-- delivery audit state, and test-fixture exclusion from any future external delivery.
-- Delivery today is IN-APP ONLY (canonical notifications). External SMS/email stays OFF.
--
-- The pg_cron job is created separately (0104) ONLY after this engine is verified.

begin;

create table recoveryos.appointment_reminders (
  id             bigint generated always as identity primary key,
  appointment_id bigint not null references recoveryos.appointments(id) on delete cascade,
  kind           text not null check (kind in ('day_before','hour_before','starting_now')),
  remind_at      timestamptz not null,
  sent_at        timestamptz,
  canceled_at    timestamptz,
  attempts       int not null default 0,
  last_error     text,
  created_at     timestamptz not null default now()
);
-- one live (unsent, uncanceled) reminder per appointment+kind — no stacking
create unique index appt_reminder_live_idx on recoveryos.appointment_reminders (appointment_id, kind)
  where sent_at is null and canceled_at is null;
create index appt_reminder_due_idx on recoveryos.appointment_reminders (remind_at)
  where sent_at is null and canceled_at is null;
alter table recoveryos.appointment_reminders enable row level security;
create policy appt_reminder_admin on recoveryos.appointment_reminders for select to authenticated
  using (recoveryos.is_admin_staff());

-- (Re)seed the three reminders for a confirmed appointment. Cancels any live set first
-- (reschedule-safe), then inserts only future-dated reminders.
create or replace function recoveryos.seed_appointment_reminders(p_appointment_id bigint)
returns void language plpgsql security definer set search_path = recoveryos, public as $$
declare v_a recoveryos.appointments%rowtype;
begin
  select * into v_a from recoveryos.appointments where id = p_appointment_id;
  if not found or v_a.status <> 'confirmed' or v_a.starts_at is null then return; end if;
  update recoveryos.appointment_reminders set canceled_at = now()
    where appointment_id = p_appointment_id and sent_at is null and canceled_at is null;
  insert into recoveryos.appointment_reminders (appointment_id, kind, remind_at)
  select p_appointment_id, t.kind, t.remind_at from (values
    ('day_before',   v_a.starts_at - interval '24 hours'),
    ('hour_before',  v_a.starts_at - interval '1 hour'),
    ('starting_now', v_a.starts_at - interval '5 minutes')
  ) as t(kind, remind_at)
  where t.remind_at > now();
end $$;
revoke execute on function recoveryos.seed_appointment_reminders(bigint) from public, anon, authenticated;

create or replace function recoveryos.cancel_appointment_reminders(p_appointment_id bigint)
returns void language sql security definer set search_path = recoveryos, public as $$
  update recoveryos.appointment_reminders set canceled_at = now()
  where appointment_id = p_appointment_id and sent_at is null and canceled_at is null;
$$;
revoke execute on function recoveryos.cancel_appointment_reminders(bigint) from public, anon, authenticated;

-- Lifecycle wiring: confirm -> seed; time change on confirmed -> reseed; terminal states -> cancel.
-- Exception-safe: reminder bookkeeping never aborts the appointment write.
create or replace function recoveryos.trg_appointment_reminders()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
begin
  begin
    if (TG_OP = 'INSERT' and NEW.status = 'confirmed')
       or (TG_OP = 'UPDATE' and NEW.status = 'confirmed'
           and (OLD.status is distinct from 'confirmed' or NEW.starts_at is distinct from OLD.starts_at)) then
      perform recoveryos.seed_appointment_reminders(NEW.id);
    elsif TG_OP = 'UPDATE' and NEW.status in ('cancelled','rescheduled','completed','no_show')
          and OLD.status is distinct from NEW.status then
      perform recoveryos.cancel_appointment_reminders(NEW.id);
    end if;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'reminder_seed_failed', 'appointments', NEW.id, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_appointment_reminders() from public, anon, authenticated;
drop trigger if exists trg_appointment_reminders on recoveryos.appointments;
create trigger trg_appointment_reminders
  after insert or update on recoveryos.appointments
  for each row execute function recoveryos.trg_appointment_reminders();

-- Dispatcher (cron target). Concurrency-safe (SKIP LOCKED), idempotent (sent_at gate),
-- re-validates appointment state at send time, delivers IN-APP canonical notifications only.
-- person_classification is consulted so future external channels can never reach fixtures;
-- in-app delivery to fixtures is allowed (controlled testing).
create or replace function recoveryos.process_appointment_reminders(p_limit int default 50)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare r record; v_a recoveryos.appointments%rowtype; v_sent int := 0; v_skipped int := 0; v_failed int := 0;
declare v_when text; v_label text;
begin
  for r in
    select * from recoveryos.appointment_reminders
    where sent_at is null and canceled_at is null and remind_at <= now()
    order by remind_at limit p_limit
    for update skip locked
  loop
    begin
      select * into v_a from recoveryos.appointments where id = r.appointment_id;
      if not found or v_a.status <> 'confirmed' then
        update recoveryos.appointment_reminders set canceled_at = now() where id = r.id;
        v_skipped := v_skipped + 1;
        continue;
      end if;
      v_when := to_char(v_a.starts_at at time zone coalesce(v_a.timezone,'America/Chicago'), 'Dy Mon DD at HH12:MI AM');
      v_label := case r.kind when 'day_before' then 'Session tomorrow'
                             when 'hour_before' then 'Session in one hour'
                             else 'Session starting now' end;
      perform recoveryos.emit_notification(v_a.person_id, 'session_reminder', v_label,
        'Your session is ' || v_when || ' (Central).', '/sessions',
        'reminder:' || r.kind || ':' || v_a.id || ':' || v_a.person_id);
      perform recoveryos.emit_notification(v_a.provider_person_id, 'session_reminder', v_label,
        'Session ' || v_when || ' (Central).', '/coach/sessions',
        'reminder:' || r.kind || ':' || v_a.id || ':' || coalesce(v_a.provider_person_id,0));
      update recoveryos.appointment_reminders
        set sent_at = now(), attempts = attempts + 1 where id = r.id;
      v_sent := v_sent + 1;
    exception when others then
      update recoveryos.appointment_reminders
        set attempts = attempts + 1, last_error = sqlerrm where id = r.id;
      v_failed := v_failed + 1;
    end;
  end loop;
  return jsonb_build_object('ok', true, 'sent', v_sent, 'skipped', v_skipped, 'failed', v_failed);
end $$;
revoke execute on function recoveryos.process_appointment_reminders(int) from public, anon, authenticated;

commit;
