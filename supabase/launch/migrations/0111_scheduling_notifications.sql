-- 0111_scheduling_notifications.sql — P4D-2: notify the other party when a
-- proposal round lands (initial times or a counter-offer).
--
-- Scheduling contract audit: session confirmed/cancelled already notify via
-- trg_appointment_notify (0100), but nothing announced "times were suggested" —
-- the participant would only discover proposals by visiting the page. This adds
-- the missing emitter, following 0100's rules: one event source (an AFTER
-- trigger on the canonical row), exception-safe (a notification failure never
-- aborts the scheduling write), humane copy with no lifecycle vocabulary, and
-- dedup one-per-round-per-recipient so proposing three times yields one
-- notification, not three.

create or replace function recoveryos.trg_booking_proposal_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_bk recoveryos.booking_requests%rowtype;
  v_recipient bigint;
  v_name text;
begin
  begin
    select * into v_bk from recoveryos.booking_requests where id = new.booking_request_id;
    if found then
      v_recipient := case when new.proposed_by_person_id = v_bk.participant_person_id
                          then v_bk.provider_person_id else v_bk.participant_person_id end;
      if v_recipient is not null then
        select coalesce(nullif(trim(preferred_name), ''), nullif(trim(first_name), ''), 'Your support person')
          into v_name from recoveryos.people where id = new.proposed_by_person_id;
        perform recoveryos.emit_notification(
          v_recipient, 'times_proposed',
          v_name || ' suggested times for your session', '',
          case when v_recipient = v_bk.participant_person_id
               then '/vrcc/sessions'
               else '/coach/participants/' || v_bk.participant_person_id end,
          'times:' || v_bk.id || ':' || new.round || ':' || v_recipient);
      end if;
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;

drop trigger if exists trg_booking_proposal_notify on recoveryos.booking_proposals;
create trigger trg_booking_proposal_notify after insert on recoveryos.booking_proposals
  for each row execute function recoveryos.trg_booking_proposal_notify();
