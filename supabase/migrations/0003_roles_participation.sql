-- Roles and program participation.
-- Roles are scoped assignments (org / program / residence), never a single
-- column on the user. Participation is an enrollment record, never a flag.

create table role_assignments (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  role_key role_key not null,
  organization_id bigint references organizations (id),
  program_id bigint references programs (id),
  residence_id bigint, -- fk added in 0004 after residences exists
  granted_by_person_id bigint references people (id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index role_assignments_person_idx on role_assignments (person_id) where revoked_at is null;

create table program_enrollments (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  program_id bigint not null references programs (id),
  status enrollment_status not null default 'inquiry',
  referral_source text,
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger program_enrollments_updated_at before update on program_enrollments
  for each row execute function set_updated_at();
create index program_enrollments_person_idx on program_enrollments (person_id);
create index program_enrollments_program_idx on program_enrollments (program_id, status);
-- One live enrollment per person per program.
create unique index program_enrollments_active_uniq
  on program_enrollments (person_id, program_id)
  where status in ('inquiry', 'eligible', 'enrolled', 'paused');
