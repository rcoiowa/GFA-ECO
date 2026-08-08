-- Identity and organizations.
-- A person is not a login: auth.users links to people via auth_user_id, and a
-- person can exist before (or without) an account, e.g. an applicant entered
-- by residence staff.

set search_path = recoveryos, public;

create table people (
  id bigint generated always as identity primary key,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  pronouns text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger people_updated_at before update on people
  for each row execute function set_updated_at();

create table person_profiles (
  person_id bigint primary key references people (id) on delete cascade,
  bio text,
  recovery_date date,
  accessibility_preferences jsonb not null default '{}'::jsonb,
  communication_preferences jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Chicago',
  updated_at timestamptz not null default now()
);
create trigger person_profiles_updated_at before update on person_profiles
  for each row execute function set_updated_at();

create table contact_methods (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  kind text not null check (kind in ('email', 'phone', 'sms', 'mail')),
  value text not null,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index contact_methods_person_idx on contact_methods (person_id);

create table organizations (
  id bigint generated always as identity primary key,
  name text not null,
  organization_type text not null check (organization_type in (
    'recovery_support', 'recovery_residence_operator', 'referral_partner',
    'funder', 'government', 'healthcare', 'other'
  )),
  parent_organization_id bigint references organizations (id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Explicit inter-organization relationships: never assume Grace For
-- Addictions owns/operates/staffs every residence.
create table organization_relationships (
  id bigint generated always as identity primary key,
  from_organization_id bigint not null references organizations (id),
  to_organization_id bigint not null references organizations (id),
  relationship_type organization_relationship_type not null,
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  unique (from_organization_id, to_organization_id, relationship_type)
);

create table locations (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations (id),
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  is_active boolean not null default true
);

create table programs (
  id bigint generated always as identity primary key,
  organization_id bigint not null references organizations (id),
  key text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true
);

create table funding_sources (
  id bigint generated always as identity primary key,
  organization_id bigint references organizations (id),
  name text not null,
  reference_code text,
  is_active boolean not null default true
);
