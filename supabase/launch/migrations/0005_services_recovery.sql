-- Canonical service delivery and shared recovery engines.
-- service_events is the single attribution spine: every delivered service
-- records who, what, where (delivery_context + program/residence), and by
-- whom — preventing double counting across VRCC and residence contexts.

set search_path = recoveryos, public;

create table service_types (
  id bigint generated always as identity primary key,
  key text not null unique,
  name text not null,
  category text not null check (category in (
    'coaching', 'peer_support', 'mentoring', 'accountability', 'recovery_circle',
    'navigation', 'assessment', 'education', 'practice', 'check_in',
    'support_request', 'event', 'other'
  )),
  is_active boolean not null default true
);

create table service_events (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id),
  service_type_id bigint not null references service_types (id),
  provider_person_id bigint references people (id),
  organization_id bigint not null references organizations (id),
  program_id bigint references programs (id),
  residence_id bigint references residences (id),
  residency_id bigint references residencies (id),
  delivery_context delivery_context not null,
  modality service_modality not null default 'self_directed',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  outcome_status text,
  funding_source_id bigint references funding_sources (id),
  created_at timestamptz not null default now(),
  -- Residence attribution must be complete or absent, never partial.
  check (
    (delivery_context = 'recovery_residence' and residence_id is not null)
    or delivery_context <> 'recovery_residence'
  )
);
create index service_events_person_idx on service_events (person_id, started_at desc);
create index service_events_context_idx on service_events (delivery_context, started_at desc);
create index service_events_program_idx on service_events (program_id) where program_id is not null;
create index service_events_residence_idx on service_events (residence_id) where residence_id is not null;

-- Shared recovery engines -----------------------------------------------

create table recovery_plans (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  title text not null default 'My recovery plan',
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger recovery_plans_updated_at before update on recovery_plans
  for each row execute function set_updated_at();
create index recovery_plans_person_idx on recovery_plans (person_id);

create table goals (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  recovery_plan_id bigint references recovery_plans (id) on delete set null,
  title text not null,
  detail text,
  status goal_status not null default 'active',
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger goals_updated_at before update on goals
  for each row execute function set_updated_at();
create index goals_person_idx on goals (person_id, status);

create table action_steps (
  id bigint generated always as identity primary key,
  goal_id bigint not null references goals (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

create table check_ins (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  mood_rating int check (mood_rating between 1 and 5),
  craving_rating int check (craving_rating between 1 and 5),
  note text,
  delivery_context delivery_context not null default 'vrcc',
  created_at timestamptz not null default now()
);
create index check_ins_person_idx on check_ins (person_id, created_at desc);

create table recovery_capital_assessments (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  instrument_key text not null,
  responses jsonb not null default '{}'::jsonb,
  total_score numeric,
  delivery_context delivery_context not null default 'vrcc',
  completed_at timestamptz not null default now()
);
create index rca_person_idx on recovery_capital_assessments (person_id, completed_at desc);

-- Professional relationships --------------------------------------------

create table coaching_relationships (
  id bigint generated always as identity primary key,
  participant_person_id bigint not null references people (id),
  coach_person_id bigint not null references people (id),
  organization_id bigint not null references organizations (id),
  started_at date not null default current_date,
  ended_at date,
  created_at timestamptz not null default now()
);
create index coaching_participant_idx on coaching_relationships (participant_person_id) where ended_at is null;
create index coaching_coach_idx on coaching_relationships (coach_person_id) where ended_at is null;

create table navigation_relationships (
  id bigint generated always as identity primary key,
  participant_person_id bigint not null references people (id),
  navigator_person_id bigint not null references people (id),
  organization_id bigint not null references organizations (id),
  started_at date not null default current_date,
  ended_at date,
  created_at timestamptz not null default now()
);
create index navigation_participant_idx on navigation_relationships (participant_person_id) where ended_at is null;
create index navigation_navigator_idx on navigation_relationships (navigator_person_id) where ended_at is null;

create table support_team_memberships (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id),
  member_person_id bigint not null references people (id),
  member_role text not null,
  started_at date not null default current_date,
  ended_at date
);
create index support_team_person_idx on support_team_memberships (person_id) where ended_at is null;
