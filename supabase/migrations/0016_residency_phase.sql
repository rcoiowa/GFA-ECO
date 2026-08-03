-- Resident phase model (Grace House policy GH-CURFEW-001 v3.0 and the
-- screening policy): phase drives curfew ceilings and screening cadence, so
-- it belongs on the residency, not on a per-residence fixed schedule.
--   Phase 1: days 1-30 · Phase 2: days 31-90 · Phase 3: days 91+
-- Phase is stored (not derived) because staff may hold or advance a resident
-- deliberately; phase_started_at supports "days in phase" reporting.
set search_path = recoveryos, public;

alter table residencies
  add column phase smallint not null default 1 check (phase between 1 and 3),
  add column phase_started_at date;

comment on column residencies.phase is
  'Grace House phase 1/2/3. Drives curfew ceiling and screening cadence.';

-- Employment exception: the only curfew exception permitted by policy, and
-- only with a verified schedule on file with the House Manager.
create table employment_curfew_exceptions (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  employer_name text not null,
  schedule_note text not null,
  verified_by_person_id bigint references people (id),
  verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index employment_curfew_residency_idx
  on employment_curfew_exceptions (residency_id) where active;

alter table employment_curfew_exceptions enable row level security;

create policy employment_curfew_self_read on employment_curfew_exceptions
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );
create policy employment_curfew_staff on employment_curfew_exceptions
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );
