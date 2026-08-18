-- Applied live 2026-08-03 as `recoveryos_0016_residency_phase` by a parallel
-- session; captured back into the repo during the 2026-08-04 reconciliation
-- (renumbered — see docs/migration/live-drift-reconciliation.md).
--
-- NOTE: this stores the current phase on the residency row, while this repo's
-- 0014 `residency_phases` table stores the phase *history*. Both are live and
-- non-conflicting; `getPhaseInfo()` still derives the phase from the admission
-- date, with the history table as the override source. Reconciling the two
-- into one read path is tracked in the reconciliation doc.
set search_path = recoveryos, public;

alter table residencies
  add column phase smallint not null default 1 check (phase between 1 and 3),
  add column phase_started_at date;

comment on column residencies.phase is
  'Grace House phase 1/2/3. Drives curfew ceiling and screening cadence.';

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
