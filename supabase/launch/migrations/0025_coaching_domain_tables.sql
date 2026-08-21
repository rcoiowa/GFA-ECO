-- RecoveryOS Canonical Coaching Domain — TABLES (P2A, additive, shadow).
-- Applied live as recoveryos_0025_coaching_domain_tables. ADDITIVE ONLY: creates
-- new recoveryos.* entities and EXTENDS coaching_relationships + appointments with
-- new nullable columns. Drops/renames/removals: NONE. No legacy (v2_*/mvp_*) object
-- is touched. Every new table enables RLS immediately (deny-all until 0026 adds
-- policies) so there is never an open window under the schema's default grants.
--
-- Decomposes v2_session_requests' fused responsibilities into canonical entities:
--   Support Need        -> support_requests (+ support_request_events)
--   Relationship        -> coaching_relationships (EXTENDED)
--   Scheduling intent    -> booking_requests
--   Proposed times       -> booking_proposals
--   Confirmed session    -> appointments (EXTENDED) + service_events (existing spine)
--   Conversation         -> conversations / conversation_members / messages
--   Continuity           -> notifications / notification_deliveries / follow_ups
-- Provenance: every migrated row carries legacy_ref (the source uuid) — see 0028 backfill.

begin;

-- --------------------------------------------------------------------------
-- Shared updated_at touch
-- --------------------------------------------------------------------------
create or replace function recoveryos.touch_updated_at()
returns trigger language plpgsql set search_path = recoveryos, public as
$$ begin new.updated_at = now(); return new; end $$;

-- (v2 identity crosswalk omitted from launch baseline — migration-only scaffolding)

-- --------------------------------------------------------------------------
-- EXTEND coaching_relationships (existing: participant_person_id, coach_person_id,
-- organization_id, started_at date, ended_at date, created_at)
-- --------------------------------------------------------------------------
alter table recoveryos.coaching_relationships
  add column if not exists status text not null default 'active'
    check (status in ('pending','active','paused','transferred','completed','ended')),
  add column if not exists relationship_type text not null default 'coach'
    check (relationship_type in ('coach','mentor','temporary','peer')),
  add column if not exists is_primary boolean not null default true,
  add column if not exists assigned_by_person_id bigint references recoveryos.people(id),
  add column if not exists assignment_source text
    check (assignment_source in ('self_claim','admin_assign','request_pickup','backfill')),
  add column if not exists end_reason text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists legacy_ref uuid;

-- One active PRIMARY coach per participant (canonical form of the v2 partial-unique).
create unique index if not exists coaching_rel_one_active_primary
  on recoveryos.coaching_relationships(participant_person_id)
  where status = 'active' and is_primary;
create index if not exists coaching_rel_coach_active_idx
  on recoveryos.coaching_relationships(coach_person_id) where status='active';
create unique index if not exists coaching_rel_legacy_ref_idx
  on recoveryos.coaching_relationships(legacy_ref) where legacy_ref is not null;

drop trigger if exists trg_coaching_rel_touch on recoveryos.coaching_relationships;
create trigger trg_coaching_rel_touch before update on recoveryos.coaching_relationships
  for each row execute function recoveryos.touch_updated_at();

-- --------------------------------------------------------------------------
-- support_requests — "what is this person asking GFA for help with?"
-- --------------------------------------------------------------------------
create table recoveryos.support_requests (
  id                     bigint generated always as identity primary key,
  person_id              bigint not null references recoveryos.people(id) on delete cascade,
  service_type_id        bigint references recoveryos.service_types(id),
  request_type           text not null default 'recovery_coach'
    check (request_type in ('peer_support','recovery_coach','life_coach','navigation','needs_assessment')),
  focus                  text,
  preferred_modality     recoveryos.service_modality not null default 'video',
  status                 text not null default 'submitted'
    check (status in ('submitted','open','claimed','assigned','contacted','scheduled','active','resolved','closed','cancelled')),
  urgency                text not null default 'normal' check (urgency in ('normal','elevated','priority')),
  delivery_context       recoveryos.delivery_context not null default 'vrcc',
  organization_id        bigint references recoveryos.organizations(id),
  program_id             bigint references recoveryos.programs(id),
  claimed_by_person_id   bigint references recoveryos.people(id),
  claimed_at             timestamptz,
  coaching_relationship_id bigint references recoveryos.coaching_relationships(id),
  assigned_at            timestamptz,
  resolved_at            timestamptz,
  closed_at              timestamptz,
  cancelled_at           timestamptz,
  last_actor_person_id   bigint references recoveryos.people(id),
  legacy_ref             uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index support_requests_open_idx on recoveryos.support_requests(status, created_at)
  where status in ('submitted','open');
create index support_requests_person_idx on recoveryos.support_requests(person_id);
create index support_requests_claimed_idx on recoveryos.support_requests(claimed_by_person_id) where claimed_by_person_id is not null;
create unique index support_requests_legacy_ref_idx on recoveryos.support_requests(legacy_ref) where legacy_ref is not null;
alter table recoveryos.support_requests enable row level security;
drop trigger if exists trg_support_requests_touch on recoveryos.support_requests;
create trigger trg_support_requests_touch before update on recoveryos.support_requests
  for each row execute function recoveryos.touch_updated_at();

create table recoveryos.support_request_events (
  id                 bigint generated always as identity primary key,
  support_request_id bigint not null references recoveryos.support_requests(id) on delete cascade,
  event_type         text not null,
  actor_person_id    bigint references recoveryos.people(id),
  detail             jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index support_request_events_req_idx on recoveryos.support_request_events(support_request_id, created_at);
alter table recoveryos.support_request_events enable row level security;

-- --------------------------------------------------------------------------
-- booking_requests / booking_proposals — scheduling negotiation
-- --------------------------------------------------------------------------
create table recoveryos.booking_requests (
  id                      bigint generated always as identity primary key,
  support_request_id      bigint references recoveryos.support_requests(id) on delete set null,
  participant_person_id   bigint not null references recoveryos.people(id) on delete cascade,
  provider_person_id      bigint references recoveryos.people(id),
  coaching_relationship_id bigint references recoveryos.coaching_relationships(id),
  service_type_id         bigint references recoveryos.service_types(id),
  modality                recoveryos.service_modality not null default 'video',
  duration_minutes        int not null default 50,
  status                  text not null default 'open'
    check (status in ('open','confirmed','cancelled','expired')),
  initiated_by_person_id  bigint references recoveryos.people(id),
  note                    text,
  appointment_id          bigint,  -- set on confirm (FK added after appointments extend)
  legacy_ref              uuid,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index booking_requests_participant_idx on recoveryos.booking_requests(participant_person_id, status);
create index booking_requests_provider_idx on recoveryos.booking_requests(provider_person_id, status);
create unique index booking_requests_legacy_ref_idx on recoveryos.booking_requests(legacy_ref) where legacy_ref is not null;
alter table recoveryos.booking_requests enable row level security;
drop trigger if exists trg_booking_requests_touch on recoveryos.booking_requests;
create trigger trg_booking_requests_touch before update on recoveryos.booking_requests
  for each row execute function recoveryos.touch_updated_at();

create table recoveryos.booking_proposals (
  id                  bigint generated always as identity primary key,
  booking_request_id  bigint not null references recoveryos.booking_requests(id) on delete cascade,
  proposed_by_person_id bigint not null references recoveryos.people(id),
  proposed_start      timestamptz not null,
  proposed_end        timestamptz,
  round               int not null default 0,
  is_active           boolean not null default true,
  accepted            boolean not null default false,
  rejected            boolean not null default false,
  created_at          timestamptz not null default now()
);
create index booking_proposals_req_idx on recoveryos.booking_proposals(booking_request_id) where is_active;
alter table recoveryos.booking_proposals enable row level security;

-- --------------------------------------------------------------------------
-- EXTEND appointments (existing: person_id, provider_person_id, service_type_id,
-- title, starts_at, ends_at, location_note, status, created_at)
-- --------------------------------------------------------------------------
alter table recoveryos.appointments
  add column if not exists organization_id bigint references recoveryos.organizations(id),
  add column if not exists program_id bigint references recoveryos.programs(id),
  add column if not exists modality recoveryos.service_modality,
  add column if not exists meeting_provider text,
  add column if not exists meeting_url text,
  add column if not exists timezone text not null default 'America/Chicago',
  add column if not exists requested_by_person_id bigint references recoveryos.people(id),
  add column if not exists confirmed_by_person_id bigint references recoveryos.people(id),
  add column if not exists confirmed_at timestamptz,
  add column if not exists rescheduled_from_appointment_id bigint references recoveryos.appointments(id),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists follow_up_due boolean not null default false,
  add column if not exists service_event_id bigint references recoveryos.service_events(id),
  add column if not exists booking_request_id bigint references recoveryos.booking_requests(id),
  add column if not exists support_request_id bigint references recoveryos.support_requests(id),
  add column if not exists coaching_relationship_id bigint references recoveryos.coaching_relationships(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists legacy_ref uuid;

-- Widen the status check to the full lifecycle (SUPERSET — existing values remain valid).
alter table recoveryos.appointments drop constraint if exists appointments_status_check;
alter table recoveryos.appointments add constraint appointments_status_check
  check (status in ('requested','scheduled','confirmed','in_progress','completed','cancelled','no_show','rescheduled'));

create index if not exists appointments_provider_idx on recoveryos.appointments(provider_person_id, starts_at)
  where status in ('scheduled','confirmed');
create unique index if not exists appointments_legacy_ref_idx on recoveryos.appointments(legacy_ref) where legacy_ref is not null;

drop trigger if exists trg_appointments_touch on recoveryos.appointments;
create trigger trg_appointments_touch before update on recoveryos.appointments
  for each row execute function recoveryos.touch_updated_at();

-- Now that appointments has an id column set is stable, wire booking_requests.appointment_id FK.
alter table recoveryos.booking_requests
  add constraint booking_requests_appointment_fk
  foreign key (appointment_id) references recoveryos.appointments(id) on delete set null;

-- --------------------------------------------------------------------------
-- Messaging
-- --------------------------------------------------------------------------
create table recoveryos.conversations (
  id                       bigint generated always as identity primary key,
  participant_person_id    bigint not null references recoveryos.people(id) on delete cascade,
  coach_person_id          bigint not null references recoveryos.people(id) on delete cascade,
  coaching_relationship_id bigint references recoveryos.coaching_relationships(id),
  context                  text not null default 'coaching' check (context in ('coaching','navigation')),
  legacy_ref               uuid,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create unique index conversations_pair_context_idx
  on recoveryos.conversations(participant_person_id, coach_person_id, context);
alter table recoveryos.conversations enable row level security;
drop trigger if exists trg_conversations_touch on recoveryos.conversations;
create trigger trg_conversations_touch before update on recoveryos.conversations
  for each row execute function recoveryos.touch_updated_at();

create table recoveryos.conversation_members (
  id              bigint generated always as identity primary key,
  conversation_id bigint not null references recoveryos.conversations(id) on delete cascade,
  person_id       bigint not null references recoveryos.people(id) on delete cascade,
  member_role     text not null check (member_role in ('participant','coach','navigator')),
  can_read_history boolean not null default true,
  joined_at       timestamptz not null default now(),
  unique (conversation_id, person_id)
);
create index conversation_members_person_idx on recoveryos.conversation_members(person_id);
alter table recoveryos.conversation_members enable row level security;

create table recoveryos.messages (
  id               bigint generated always as identity primary key,
  conversation_id  bigint not null references recoveryos.conversations(id) on delete cascade,
  sender_person_id bigint not null references recoveryos.people(id),
  body             text not null check (length(body) between 1 and 4000),
  read_at          timestamptz,
  legacy_ref       uuid,
  created_at       timestamptz not null default now()
);
create index messages_conversation_idx on recoveryos.messages(conversation_id, created_at);
create unique index messages_legacy_ref_idx on recoveryos.messages(legacy_ref) where legacy_ref is not null;
alter table recoveryos.messages enable row level security;

-- --------------------------------------------------------------------------
-- Notifications + deliveries
-- --------------------------------------------------------------------------
create table recoveryos.notifications (
  id                  bigint generated always as identity primary key,
  recipient_person_id bigint not null references recoveryos.people(id) on delete cascade,
  kind                text not null,
  title               text not null,
  body                text not null default '',
  link_path           text,
  read_at             timestamptz,
  legacy_ref          uuid,
  created_at          timestamptz not null default now()
);
create index notifications_inbox_idx on recoveryos.notifications(recipient_person_id, read_at, created_at desc);
create unique index notifications_legacy_ref_idx on recoveryos.notifications(legacy_ref) where legacy_ref is not null;
alter table recoveryos.notifications enable row level security;

create table recoveryos.notification_deliveries (
  id              bigint generated always as identity primary key,
  notification_id bigint not null references recoveryos.notifications(id) on delete cascade,
  channel         text not null check (channel in ('in_app','email','sms','push')),
  status          text not null default 'sent' check (status in ('sent','failed','skipped')),
  detail          text,
  created_at      timestamptz not null default now(),
  unique (notification_id, channel)
);
alter table recoveryos.notification_deliveries enable row level security;

-- --------------------------------------------------------------------------
-- Follow-ups (continuity of care — NOT a nullable appointment timestamp)
-- --------------------------------------------------------------------------
create table recoveryos.follow_ups (
  id                 bigint generated always as identity primary key,
  person_id          bigint not null references recoveryos.people(id) on delete cascade,
  assigned_person_id bigint references recoveryos.people(id),
  appointment_id     bigint references recoveryos.appointments(id) on delete set null,
  service_event_id   bigint references recoveryos.service_events(id) on delete set null,
  follow_up_type     text not null default 'check_in',
  due_at             timestamptz,
  status             text not null default 'open' check (status in ('open','done','cancelled')),
  note               text,
  completed_at       timestamptz,
  created_by_person_id bigint references recoveryos.people(id),
  legacy_ref         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index follow_ups_assigned_due_idx on recoveryos.follow_ups(assigned_person_id, due_at) where status='open';
create index follow_ups_person_idx on recoveryos.follow_ups(person_id);
alter table recoveryos.follow_ups enable row level security;
drop trigger if exists trg_follow_ups_touch on recoveryos.follow_ups;
create trigger trg_follow_ups_touch before update on recoveryos.follow_ups
  for each row execute function recoveryos.touch_updated_at();

-- --------------------------------------------------------------------------
-- Migration operations: state machine + backfill log (admin/system-only)
-- --------------------------------------------------------------------------
create table recoveryos.migration_state (
  id         bigint generated always as identity primary key,
  domain     text not null unique,
  stage      text not null default 'LEGACY_ONLY'
    check (stage in ('LEGACY_ONLY','CANONICAL_SHADOW','CANONICAL_PARITY','CANONICAL_READ','CANONICAL_WRITE','LEGACY_READ_ONLY','LEGACY_RETIRED')),
  notes      text,
  updated_at timestamptz not null default now()
);
alter table recoveryos.migration_state enable row level security;
drop trigger if exists trg_migration_state_touch on recoveryos.migration_state;
create trigger trg_migration_state_touch before update on recoveryos.migration_state
  for each row execute function recoveryos.touch_updated_at();

insert into recoveryos.migration_state (domain, stage, notes) values
  ('identities','CANONICAL_SHADOW','crosswalk populated; canonical is shadow'),
  ('relationships','CANONICAL_SHADOW','coaching_relationships extended; backfill shadow'),
  ('support_requests','CANONICAL_SHADOW','new table; backfill shadow'),
  ('bookings','CANONICAL_SHADOW','new tables; backfill shadow'),
  ('appointments','CANONICAL_SHADOW','extended; backfill shadow'),
  ('messages','CANONICAL_SHADOW','new tables; backfill shadow'),
  ('notifications','CANONICAL_SHADOW','new tables; backfill shadow'),
  ('follow_ups','CANONICAL_SHADOW','new table; no legacy source yet')
on conflict (domain) do nothing;

create table recoveryos.backfill_log (
  id              bigint generated always as identity primary key,
  domain          text not null,
  source_count    int not null default 0,
  mapped_count    int not null default 0,
  skipped_count   int not null default 0,
  exception_count int not null default 0,
  detail          jsonb not null default '{}'::jsonb,
  run_at          timestamptz not null default now()
);
alter table recoveryos.backfill_log enable row level security;

commit;

-- PostgREST: pick up the new tables/columns.
notify pgrst, 'reload schema';
