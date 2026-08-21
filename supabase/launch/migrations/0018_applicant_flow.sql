-- Applicant-side residence application flow.
-- Lets a signed-in person submit their own application to a residence and
-- follow its status, and gives applications a structured answers payload so
-- the intake form (platform or external Grace House site via the API
-- gateway) can be reviewed by staff without a separate document.

set search_path = recoveryos, public;

alter table residence_applications
  add column if not exists answers jsonb not null default '{}'::jsonb;

-- A person may submit an application for themselves. Status is forced to
-- 'submitted' at insert time (column default); decision fields stay null.
create policy residence_applications_self_insert on residence_applications
  for insert with check (
    person_id = current_person_id()
    and status = 'submitted'
    and decided_at is null
    and decided_by_person_id is null
  );

-- A person can always see their own applications (status included).
create policy residence_applications_self_select on residence_applications
  for select using (person_id = current_person_id());
