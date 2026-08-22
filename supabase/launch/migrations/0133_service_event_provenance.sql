-- 0133_service_event_provenance.sql — P2.2: provenance + idempotency foundation.
--
-- Implements the RATIFIED canon (docs/architecture/service-event-provenance-v1.0.md,
-- ratified 2026-08-22 + Final Reconciliation):
--   * `source` — how the event entered institutional record. CLOSED four-value vocabulary;
--     `imported`/`unknown`/`unclassified` do not exist. Immutable after creation. NOT NULL:
--     the backfill classifies every existing row by DEMONSTRABLE WRITER FINGERPRINT (never
--     provider-null alone) and this migration ABORTS — applying nothing — if any historical
--     row cannot be defensibly classified. No guessing, ever.
--   * `dedupe_key` — explicit idempotency anchor (ONE HUMAN ACTION → ONE DEDUPE KEY),
--     unique per acting owner. Never blocks legitimate repeated same-day contacts.
--   * outcome_status is DEPRECATED in place (never wired; drop only under a later
--     separately reviewed cleanup).
--
-- Writer fingerprints (the closed set of writers that have ever existed):
--   appointment_id set                                    -> complete_session   -> staff_attested
--   navigation_relationship_id set + resource_navigation  -> navigation RPC     -> staff_attested
--   residency_id set + residence_recovery_support         -> residence RPC      -> staff_attested
--   provider null + self type + modality self_directed    -> participant direct -> participant_self_reported
--
-- Transition trigger: pre-P2.3 writers (the direct participant path and the pre-0134 RPC
-- bodies) insert without source; the BEFORE trigger stamps them from the same insert-time
-- fingerprints and RAISES for anything unfingerprinted — no sourceless, no guessed row ever
-- lands (it fires before NOT NULL is evaluated). 0137 tightens it to require explicit source.
--
-- ROLLBACK: drop trigger service_events_provenance_guard on recoveryos.service_events;
--           drop function recoveryos.service_events_provenance_guard();
--           drop index recoveryos.service_events_dedupe_uidx;
--           alter table recoveryos.service_events drop column dedupe_key;
--           alter table recoveryos.service_events drop column source;
--           comment on column recoveryos.service_events.outcome_status is null;

set search_path = recoveryos, public;

-- 1) Columns (source added nullable only as the add -> backfill -> SET NOT NULL pattern).
alter table recoveryos.service_events
  add column if not exists source text
    check (source in ('participant_self_reported','staff_attested','partner_confirmed',
                      'system_derived')),
  add column if not exists dedupe_key uuid;

comment on column recoveryos.service_events.source is
  'How this event entered institutional record (RATIFIED closed vocabulary; immutable). '
  'participant_self_reported = the person recorded what THEY did (engagement, never org '
  'delivery); staff_attested = a staff member claimed delivery occurred; partner_confirmed '
  '= RESERVED, no writer until an approved workflow exists; system_derived = deterministic '
  'derivation from a linked confirmed fact (no independent external authority). Transport/'
  'ingestion is NEVER a source. Reporting authority is a separate layer; the Institutional '
  'Evidence Ledger A-F classification is a third — none impersonates another.';

comment on column recoveryos.service_events.dedupe_key is
  'Caller-supplied idempotency anchor: ONE HUMAN ACTION -> ONE DEDUPE KEY. A retry of the '
  'same action reuses the key; a new real interaction gets a new key. Unique per acting '
  'owner (provider, or person for self records). Immutable.';

comment on column recoveryos.service_events.outcome_status is
  'DEPRECATED (P2, 2026-08-22): never written by any workflow, no CHECK, no reader. An '
  'outcome slot on an activity row conflates the evidence ladder — outcomes live on the '
  'evidence-gated state records (referral connection, need resolution, goal status). Never '
  'wire; physical drop only under a later separately reviewed cleanup.';

-- 2) Backfill by writer fingerprint ONLY (never provider-null alone).
update recoveryos.service_events se set source = 'staff_attested'
where se.source is null and se.appointment_id is not null;

update recoveryos.service_events se set source = 'staff_attested'
where se.source is null
  and se.navigation_relationship_id is not null
  and se.service_type_id = (select id from recoveryos.service_types where key = 'resource_navigation');

update recoveryos.service_events se set source = 'staff_attested'
where se.source is null
  and se.residency_id is not null
  and se.service_type_id = (select id from recoveryos.service_types where key = 'residence_recovery_support');

update recoveryos.service_events se set source = 'participant_self_reported'
where se.source is null
  and se.provider_person_id is null
  and se.modality = 'self_directed'
  and se.service_type_id in (select id from recoveryos.service_types
                             where key in ('daily_check_in','recovery_capital_assessment',
                                           'recovery_practice'));

-- 3) ABORT if any row remains unclassified: report it, apply nothing, no invented source.
do $$
declare v_bad text;
begin
  select string_agg(format('id=%s type=%s provider=%s modality=%s', id, service_type_id,
                           coalesce(provider_person_id::text,'null'), modality), '; ')
    into v_bad
  from recoveryos.service_events where source is null;
  if v_bad is not null then
    raise exception 'P2 PROVENANCE ABORT: unclassifiable service_events rows — executive review required: %', v_bad;
  end if;
end $$;

alter table recoveryos.service_events alter column source set not null;

-- 4) Idempotency index: unique per acting owner; partial so keyless history is untouched.
create unique index if not exists service_events_dedupe_uidx
  on recoveryos.service_events ((coalesce(provider_person_id, person_id)), dedupe_key)
  where dedupe_key is not null;

-- 5) Provenance guard: stamp transition writers from demonstrable insert-time fingerprints;
--    refuse anything unfingerprinted; make source/dedupe_key immutable.
create or replace function recoveryos.service_events_provenance_guard()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare v_type_key text;
begin
  if tg_op = 'UPDATE' then
    if new.source is distinct from old.source
       or new.dedupe_key is distinct from old.dedupe_key then
      raise exception 'service_events.source and dedupe_key are immutable';
    end if;
    return new;
  end if;

  if new.source is not null then
    return new;  -- writer-stamped (0134+ path)
  end if;

  select key into v_type_key from recoveryos.service_types where id = new.service_type_id;

  -- Staff-writer fingerprints (covers pre-0134 RPC bodies during the transition).
  if new.appointment_id is not null
     or (new.navigation_relationship_id is not null and v_type_key = 'resource_navigation')
     or (new.residency_id is not null and v_type_key = 'residence_recovery_support') then
    new.source := 'staff_attested';
    return new;
  end if;

  -- Participant direct-insert fingerprint (RLS makes self the only client insert path).
  if new.provider_person_id is null
     and new.modality = 'self_directed'
     and v_type_key in ('daily_check_in','recovery_capital_assessment','recovery_practice')
     and new.person_id = recoveryos.current_person_id() then
    new.source := 'participant_self_reported';
    return new;
  end if;

  raise exception 'service event rejected: no provenance source and no demonstrable writer fingerprint';
end $$;

drop trigger if exists service_events_provenance_guard on recoveryos.service_events;
create trigger service_events_provenance_guard
  before insert or update on recoveryos.service_events
  for each row execute function recoveryos.service_events_provenance_guard();

notify pgrst, 'reload schema';
