-- Recovery residences and residencies.
-- Residency is a relationship between a person and a residence with its own
-- lifecycle. It never replaces or merges with VRCC participation.

set search_path = recoveryos, public;

create table residences (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations (id),
  location_id bigint references locations (id),
  name text not null,
  address_city text,
  address_state text,
  capacity int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table role_assignments
  add constraint role_assignments_residence_fk
  foreign key (residence_id) references residences (id);

create table residence_units (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id) on delete cascade,
  name text not null
);

create table residence_rooms (
  id bigint generated always as identity primary key,
  unit_id bigint not null references residence_units (id) on delete cascade,
  name text not null
);

create table residence_beds (
  id bigint generated always as identity primary key,
  room_id bigint not null references residence_rooms (id) on delete cascade,
  name text not null,
  is_active boolean not null default true
);

create table residence_applications (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id),
  residence_id bigint not null references residences (id),
  status text not null default 'submitted' check (status in (
    'submitted', 'in_review', 'approved', 'waitlisted', 'declined', 'withdrawn'
  )),
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by_person_id bigint references people (id),
  notes text
);
create index residence_applications_residence_idx on residence_applications (residence_id, status);

create table residencies (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id),
  residence_id bigint not null references residences (id),
  program_enrollment_id bigint references program_enrollments (id),
  admission_date date,
  anticipated_exit_date date,
  discharge_date date,
  residency_status residency_status not null default 'applicant',
  bed_assignment_id bigint, -- fk added below
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger residencies_updated_at before update on residencies
  for each row execute function set_updated_at();
create index residencies_person_idx on residencies (person_id);
create index residencies_residence_idx on residencies (residence_id, residency_status);
-- One live residency per person (across all residences).
create unique index residencies_active_uniq on residencies (person_id)
  where residency_status in ('approved', 'active', 'on_pass', 'transitioning');

create table bed_assignments (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  bed_id bigint not null references residence_beds (id),
  assigned_at timestamptz not null default now(),
  released_at timestamptz
);
create unique index bed_assignments_active_bed_uniq on bed_assignments (bed_id)
  where released_at is null;

alter table residencies
  add constraint residencies_bed_assignment_fk
  foreign key (bed_assignment_id) references bed_assignments (id);
