-- 0147_intake_workflow_foundation.sql
--
-- Additive, INACTIVE foundation for the shared Contact Connect intake workflow.
-- This migration deliberately does not:
--   * seed or alter any staff account / role assignment;
--   * activate round-robin assignment or housing routing;
--   * replace the existing leads RLS policies or notification trigger;
--   * send email or expose a new UI route.
--
-- Activation belongs in a later migration after the four intended team members,
-- the archuleta@graceforaddictions.org identity mapping, and deadline durations
-- are verified. Until then, every new operational table is deny-by-default for
-- client roles. The service role may populate the structures only through a
-- separately reviewed canonical writer.
--
-- ROLLBACK (only while no workflow data depends on this migration):
--   drop function if exists recoveryos.can_access_intake_lead(bigint);
--   drop function if exists recoveryos.is_intake_worker();
--   drop function if exists recoveryos.is_intake_coordinator();
--   drop table if exists recoveryos.intake_contact_events;
--   drop table if exists recoveryos.intake_routing_rules;
--   drop table if exists recoveryos.intake_team_members;
--   drop index if exists recoveryos.leads_source_record_unique_idx;
--   drop index if exists recoveryos.leads_workflow_queue_idx;
--   alter table recoveryos.leads
--     drop column if exists source_record_id,
--     drop column if exists verified_at,
--     drop column if exists workflow_stage,
--     drop column if exists inquiry_kind,
--     drop column if exists priority_level,
--     drop column if exists external_organization_name,
--     drop column if exists housing_path,
--     drop column if exists routing_state,
--     drop column if exists response_due_at,
--     drop column if exists founder_response_due_at,
--     drop column if exists next_follow_up_at,
--     drop column if exists last_contacted_at,
--     drop column if exists assigned_at,
--     drop column if exists closed_at;

begin;

set search_path = recoveryos, public;

-- 1. Extend the canonical lead. Keep legacy `status` intact until the activation
-- migration maps it deliberately; do not create a parallel lead table.
alter table recoveryos.leads
  add column source_record_id text,
  add column verified_at timestamptz,
  add column workflow_stage text not null default 'new'
    check (workflow_stage in ('new', 'assigned', 'contacted', 'waiting', 'scheduled', 'closed')),
  add column inquiry_kind text not null default 'general_support'
    check (inquiry_kind in ('general_support', 'housing', 'partnership', 'other')),
  add column priority_level text not null default 'standard'
    check (priority_level in ('standard', 'priority')),
  add column external_organization_name text,
  add column housing_path text
    check (housing_path in ('womens_recovery_housing', 'mens_recovery_housing', 'unsure')),
  add column routing_state text not null default 'unreviewed'
    check (routing_state in ('unreviewed', 'confirm_route', 'routed')),
  add column response_due_at timestamptz,
  add column founder_response_due_at timestamptz,
  add column next_follow_up_at timestamptz,
  add column last_contacted_at timestamptz,
  add column assigned_at timestamptz,
  add column closed_at timestamptz;

alter table recoveryos.leads
  add constraint leads_housing_path_scope_check
    check (housing_path is null or inquiry_kind = 'housing'),
  add constraint leads_partnership_priority_check
    check (inquiry_kind <> 'partnership' or priority_level = 'priority'),
  add constraint leads_stage_time_check
    check (
      (workflow_stage <> 'closed' or closed_at is not null)
      and (assigned_to_person_id is null or assigned_at is not null)
    );

create unique index leads_source_record_unique_idx
  on recoveryos.leads (source, source_record_id)
  where source_record_id is not null;

create index leads_workflow_queue_idx
  on recoveryos.leads (workflow_stage, next_follow_up_at, response_due_at, created_at);

comment on column recoveryos.leads.housing_path is
  'A housing path explicitly selected by the person. Never derive this value from a name or another sensitive trait.';
comment on column recoveryos.leads.routing_state is
  'confirm_route means a human must ask which housing path the person seeks before routing.';
comment on column recoveryos.leads.founder_response_due_at is
  'Required for priority partnership requests once the founder identity and deadline policy are activated.';

-- 2. Intake-specific permission membership. This does not reuse broad coach,
-- navigator, residence, or administrator roles and it does not seed membership.
create table recoveryos.intake_team_members (
  person_id bigint primary key references recoveryos.people(id) on delete cascade,
  access_level text not null check (access_level in ('coordinator', 'worker')),
  eligible_for_round_robin boolean not null default false,
  is_active boolean not null default true,
  created_by_person_id bigint references recoveryos.people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recoveryos.intake_team_members enable row level security;
revoke all on recoveryos.intake_team_members from public, anon, authenticated;
grant select, insert, update, delete on recoveryos.intake_team_members to service_role;

-- Internal helper used by future RLS/RPC activation. It is safe before seeding:
-- no rows means false for every signed-in person.
create or replace function recoveryos.is_intake_coordinator()
returns boolean
language sql
stable
security definer
set search_path = recoveryos, public
as $$
  select exists (
    select 1
      from recoveryos.intake_team_members m
     where m.person_id = recoveryos.current_person_id()
       and m.is_active
       and m.access_level = 'coordinator'
  );
$$;

create or replace function recoveryos.is_intake_worker()
returns boolean
language sql
stable
security definer
set search_path = recoveryos, public
as $$
  select exists (
    select 1
      from recoveryos.intake_team_members m
     where m.person_id = recoveryos.current_person_id()
       and m.is_active
  );
$$;

revoke execute on function recoveryos.is_intake_coordinator() from public, anon;
revoke execute on function recoveryos.is_intake_worker() from public, anon;
grant execute on function recoveryos.is_intake_coordinator() to authenticated;
grant execute on function recoveryos.is_intake_worker() to authenticated;

-- 3. Explicit routing configuration. A route points to a verified person record,
-- never to a guessed identity. No rules are seeded by this migration.
create table recoveryos.intake_routing_rules (
  route_key text primary key
    check (route_key in ('womens_recovery_housing', 'mens_recovery_housing', 'partnership', 'default')),
  assignee_person_id bigint not null references recoveryos.people(id),
  is_active boolean not null default true,
  created_by_person_id bigint references recoveryos.people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recoveryos.intake_routing_rules enable row level security;
revoke all on recoveryos.intake_routing_rules from public, anon, authenticated;
grant select, insert, update, delete on recoveryos.intake_routing_rules to service_role;

-- 4. Shared, append-only contact history. Gmail remains the communication
-- channel; this table records that contact so another teammate can see that it
-- happened. The log stores only the minimum operational evidence.
create table recoveryos.intake_contact_events (
  id bigint generated always as identity primary key,
  lead_id bigint not null references recoveryos.leads(id),
  actor_person_id bigint not null references recoveryos.people(id),
  occurred_at timestamptz not null default now(),
  channel text not null
    check (channel in ('email', 'phone', 'text', 'in_person', 'video', 'other')),
  outcome text not null
    check (outcome in (
      'no_response', 'connected', 'information_shared', 'referral_made',
      'appointment_scheduled', 'waiting_on_inquirer', 'waiting_on_gfa', 'closed', 'other'
    )),
  minutes_spent integer not null default 0 check (minutes_spent between 0 and 1440),
  next_follow_up_at timestamptz,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index intake_contact_events_lead_timeline_idx
  on recoveryos.intake_contact_events (lead_id, occurred_at desc, id desc);

alter table recoveryos.intake_contact_events enable row level security;
revoke all on recoveryos.intake_contact_events from public, anon, authenticated;
grant select, insert on recoveryos.intake_contact_events to service_role;
grant usage, select on sequence recoveryos.intake_contact_events_id_seq to service_role;

comment on table recoveryos.intake_contact_events is
  'Minimum sufficient shared contact history for pre-account intake inquiries; not a clinical note or participant outcome record.';
comment on column recoveryos.intake_contact_events.note is
  'Optional brief operational context. Do not copy full email bodies or unnecessary sensitive details.';

-- Prepared access predicate. It is not attached to the legacy broad lead policy
-- in this foundation migration; activation must replace that policy atomically.
create or replace function recoveryos.can_access_intake_lead(p_lead_id bigint)
returns boolean
language sql
stable
security definer
set search_path = recoveryos, public
as $$
  select recoveryos.is_intake_coordinator()
      or exists (
        select 1
          from recoveryos.leads l
          join recoveryos.intake_team_members m
            on m.person_id = recoveryos.current_person_id()
           and m.is_active
         where l.id = p_lead_id
           and l.assigned_to_person_id = m.person_id
      );
$$;

revoke execute on function recoveryos.can_access_intake_lead(bigint) from public, anon;
grant execute on function recoveryos.can_access_intake_lead(bigint) to authenticated;

-- No client policy is created on the new tables. They remain deny-by-default
-- until the activation migration can be tested with verified coordinator,
-- assigned-worker, unassigned-worker, participant, and anonymous identities.

notify pgrst, 'reload schema';

commit;
