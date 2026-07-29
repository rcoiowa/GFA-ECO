-- Scheduling and residence operations.
-- Residence operations are always residence-scoped and never leak into the
-- universal recovery-support surface.

create table appointments (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id),
  provider_person_id bigint references people (id),
  service_type_id bigint references service_types (id),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_note text,
  status text not null default 'scheduled' check (status in (
    'requested', 'scheduled', 'completed', 'cancelled', 'no_show'
  )),
  created_at timestamptz not null default now()
);
create index appointments_person_idx on appointments (person_id, starts_at);

create table meetings (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations (id),
  residence_id bigint references residences (id),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_required_for_residents boolean not null default false,
  created_at timestamptz not null default now()
);
create index meetings_time_idx on meetings (starts_at);
create index meetings_residence_idx on meetings (residence_id) where residence_id is not null;

create table meeting_attendance (
  id bigint generated always as identity primary key,
  meeting_id bigint not null references meetings (id) on delete cascade,
  person_id bigint not null references people (id),
  status text not null default 'expected' check (status in ('expected', 'present', 'absent', 'excused')),
  recorded_by_person_id bigint references people (id),
  recorded_at timestamptz,
  unique (meeting_id, person_id)
);

-- Residence operations ---------------------------------------------------

create table residence_chores (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true
);

create table chore_assignments (
  id bigint generated always as identity primary key,
  chore_id bigint not null references residence_chores (id) on delete cascade,
  residency_id bigint not null references residencies (id) on delete cascade,
  due_on date not null,
  completed_at timestamptz,
  verified_by_person_id bigint references people (id)
);
create index chore_assignments_residency_idx on chore_assignments (residency_id, due_on);

create table curfew_schedules (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  curfew_time time not null,
  unique (residence_id, day_of_week)
);

create table curfew_exceptions (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  exception_date date not null,
  approved_until timestamptz not null,
  reason text,
  approved_by_person_id bigint references people (id),
  created_at timestamptz not null default now()
);

create table passes (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  destination text,
  status text not null default 'requested' check (status in (
    'requested', 'approved', 'denied', 'active', 'returned', 'overdue'
  )),
  decided_by_person_id bigint references people (id),
  created_at timestamptz not null default now()
);
create index passes_residency_idx on passes (residency_id, starts_at desc);

create table screenings (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  screening_type text not null,
  collected_at timestamptz not null default now(),
  result text,
  recorded_by_person_id bigint references people (id)
);
create index screenings_residency_idx on screenings (residency_id, collected_at desc);

create table incidents (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id),
  residency_id bigint references residencies (id),
  occurred_at timestamptz not null,
  category text not null,
  summary text not null,
  reported_by_person_id bigint references people (id),
  created_at timestamptz not null default now()
);
create index incidents_residence_idx on incidents (residence_id, occurred_at desc);

create table grievances (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id),
  filed_by_person_id bigint not null references people (id),
  summary text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  filed_at timestamptz not null default now(),
  resolved_at timestamptz
);
