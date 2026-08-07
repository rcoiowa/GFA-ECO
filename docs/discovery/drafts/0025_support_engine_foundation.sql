-- ============================================================================
-- DRAFT — NOT APPLIED to the live database.
-- Phase 1 foundation of the Recovery Support Engine, per
-- docs/discovery/recovery-support-engine-audit.md. Lives in drafts/ so that
-- supabase/migrations/ stays a truthful record of applied schema; move this
-- file to supabase/migrations/0025_support_engine_foundation.sql when it is
-- actually applied (Supabase access required — see audit §6), and only then
-- ship app code that depends on it.
-- ============================================================================
-- Adds: support_requests (the Support Need), coaching_relationships lifecycle
-- columns + one-active-primary constraint (the Human Relationship, spec §11),
-- an atomic concurrency-safe claim (spec §9/§38), session-record columns on
-- appointments (spec §21), and notifications (spec §26) modeled on the v2
-- prototype's design. Additive only; no existing rows or behavior change.

set search_path = recoveryos, public;

-- ---------------------------------------------------------------------------
-- 1. Support requests — the participant's ask, separated from scheduling
-- ---------------------------------------------------------------------------
create table support_requests (
  id bigint generated always as identity primary key,
  person_id bigint not null references people (id) on delete cascade,
  category text not null default 'recovery_coaching' check (category in (
    'recovery_coaching', 'peer_support', 'resource_navigation',
    'reentry_navigation', 'recovery_residence', 'employment', 'housing', 'other'
  )),
  message text,                       -- "anything you'd like your coach to know"
  preferred_contact text,             -- chat / phone / video / no_preference
  preferred_times text,               -- free-text windows; structured booking is Phase 4
  status text not null default 'submitted' check (status in (
    'draft', 'submitted', 'open', 'claimed', 'assigned', 'contacted',
    'scheduled', 'active', 'resolved', 'closed', 'cancelled'
  )),
  claimed_by_person_id bigint references people (id),
  coaching_relationship_id bigint references coaching_relationships (id),
  client_ref text unique,             -- offline-queue idempotency (kept from v2)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger support_requests_updated_at before update on support_requests
  for each row execute function set_updated_at();
-- The open pool: what eligible coaches scan. Partial index keeps it fast.
create index support_requests_pool_idx on support_requests (created_at)
  where status in ('submitted', 'open');
create index support_requests_person_idx on support_requests (person_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Coaching relationship lifecycle (spec §11) — additive columns
-- ---------------------------------------------------------------------------
alter table coaching_relationships
  add column status text not null default 'active' check (status in (
    'pending', 'active', 'paused', 'transferred', 'completed', 'ended'
  )),
  add column assignment_source text not null default 'import' check (assignment_source in (
    'self_claim', 'admin_assignment', 'transfer', 'residence', 'import'
  )),
  add column assigned_by_person_id bigint references people (id),
  add column is_primary boolean not null default true,
  add column end_reason text;

-- One active primary coach per participant. This unique index is what makes
-- concurrent claims safe: the second insert conflicts and reports gracefully.
create unique index coaching_one_active_primary
  on coaching_relationships (participant_person_id)
  where ended_at is null and is_primary and status in ('pending', 'active');

-- ---------------------------------------------------------------------------
-- 3. Notifications (spec §26) — v2_notifications design, canonical home
-- ---------------------------------------------------------------------------
create table notifications (
  id bigint generated always as identity primary key,
  recipient_person_id bigint not null references people (id) on delete cascade,
  kind text not null check (kind in (
    'coaching_request_received', 'coaching_request_claimed', 'coach_assigned',
    'new_message', 'scheduling_request', 'scheduling_counterproposal',
    'session_confirmed', 'session_rescheduled', 'session_cancelled',
    'session_reminder', 'session_ready', 'follow_up_due', 'general'
  )),
  title text not null,
  body text not null default '',
  link_path text,                     -- in-app deep link (spec §26/§68)
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_inbox_idx
  on notifications (recipient_person_id, read_at, created_at desc);

-- Insert helper: only ever runs inside triggers/RPCs, never callable directly.
create or replace function notify_person(
  recipient bigint, k text, t text, b text, link text default null
) returns void
language sql security definer set search_path = recoveryos, public as
$$
  insert into notifications (recipient_person_id, kind, title, body, link_path)
  select recipient, k, t, b, link where recipient is not null
$$;
revoke execute on function notify_person(bigint, text, text, text, text)
  from public, anon, authenticated;

-- New submitted request → tell every active coach (progressive disclosure:
-- the notification carries no request content beyond the category).
create or replace function support_request_fanout()
returns trigger
language plpgsql security definer set search_path = recoveryos, public as
$$
begin
  if new.status = 'submitted' then
    perform notify_person(ra.person_id, 'coaching_request_received',
      'Someone is looking for support',
      'A new ' || replace(new.category, '_', ' ') || ' request is waiting.',
      '/coach/requests')
    from role_assignments ra
    where ra.role_key = 'coach' and ra.revoked_at is null
      and ra.person_id <> new.person_id;
  end if;
  return new;
end
$$;
revoke execute on function support_request_fanout() from public, anon, authenticated;
create trigger support_requests_fanout
  after insert on support_requests
  for each row execute function support_request_fanout();

-- ---------------------------------------------------------------------------
-- 4. Atomic claim (spec §9, §38): row lock + unique index; no check-then-act
-- ---------------------------------------------------------------------------
-- Returns {outcome: 'claimed' | 'already_connected' | 'not_found'} plus the
-- relationship id on success. The losing coach in a race gets
-- 'already_connected' — never a raw conflict, never a phantom success.
create or replace function claim_support_request(request_id bigint)
returns jsonb
language plpgsql security definer set search_path = recoveryos, public as
$$
declare
  me bigint := current_person_id();
  req support_requests%rowtype;
  org bigint;
  rel_id bigint;
begin
  if me is null or not (has_role('coach') or has_role('administrator')) then
    raise exception 'not authorized';
  end if;

  select * into req from support_requests where id = request_id for update;
  if not found then
    return jsonb_build_object('outcome', 'not_found');
  end if;
  if req.status not in ('submitted', 'open') or req.claimed_by_person_id is not null then
    return jsonb_build_object('outcome', 'already_connected');
  end if;

  -- Organization: the claiming coach's active coach assignment, else the
  -- participant's enrolling org, else the first recovery_support org.
  select ra.organization_id into org from role_assignments ra
    where ra.person_id = me and ra.role_key = 'coach' and ra.revoked_at is null
      and ra.organization_id is not null
    limit 1;
  if org is null then
    select o.id into org from organizations o
      where o.organization_type = 'recovery_support' and o.is_active
      order by o.id limit 1;
  end if;
  if org is null then
    raise exception 'no organization available for coaching relationship';
  end if;

  begin
    insert into coaching_relationships
      (participant_person_id, coach_person_id, organization_id,
       status, assignment_source, is_primary)
    values (req.person_id, me, org, 'active', 'self_claim', true)
    returning id into rel_id;
  exception when unique_violation then
    -- Another coach holds the active primary relationship.
    return jsonb_build_object('outcome', 'already_connected');
  end;

  update support_requests
    set status = 'claimed', claimed_by_person_id = me,
        coaching_relationship_id = rel_id
    where id = request_id;

  perform notify_person(req.person_id, 'coaching_request_claimed',
    'You''re connected',
    'A recovery coach picked up your request and will reach out.',
    '/app/support');

  insert into audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (me, 'claim', 'support_requests', request_id,
          jsonb_build_object('relationship_id', rel_id));

  return jsonb_build_object('outcome', 'claimed', 'relationship_id', rel_id);
end
$$;
grant execute on function claim_support_request(bigint) to authenticated;
revoke execute on function claim_support_request(bigint) from public, anon;

-- ---------------------------------------------------------------------------
-- 5. Appointments as the canonical session record (spec §21) — additive
-- ---------------------------------------------------------------------------
alter table appointments
  add column modality text check (modality in ('video', 'phone', 'in_person')),
  add column platform text,
  add column meeting_url text,
  add column timezone text,
  add column duration_minutes int,
  add column requested_by_person_id bigint references people (id),
  add column confirmed_by_person_id bigint references people (id),
  add column confirmed_at timestamptz,
  add column cancellation_reason text,
  add column rescheduled_from_appointment_id bigint references appointments (id),
  add column follow_up_due date;
create index appointments_provider_idx
  on appointments (provider_person_id, starts_at)
  where provider_person_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Row-level security
-- ---------------------------------------------------------------------------
alter table support_requests enable row level security;
alter table notifications enable row level security;

-- Participants: own requests; may create (draft/submitted) and cancel.
create policy support_requests_self_select on support_requests
  for select using (person_id = current_person_id());
create policy support_requests_self_insert on support_requests
  for insert with check (
    person_id = current_person_id() and status in ('draft', 'submitted')
  );
create policy support_requests_self_update on support_requests
  for update using (person_id = current_person_id())
  with check (
    person_id = current_person_id()
    and status in ('draft', 'submitted', 'cancelled')
  );

-- Coaches: see the open pool and requests they claimed. Claims themselves go
-- through claim_support_request() only — no direct coach UPDATE policy.
create policy support_requests_coach_pool on support_requests
  for select using (
    has_role('coach') and (
      status in ('submitted', 'open')
      or claimed_by_person_id = current_person_id()
    )
  );
create policy support_requests_admin on support_requests
  for select using (has_role('administrator'));
create policy support_requests_admin_update on support_requests
  for update using (has_role('administrator'))
  with check (has_role('administrator'));

-- Notifications: recipient-only; updates may only set read state on own rows.
create policy notifications_own_select on notifications
  for select using (recipient_person_id = current_person_id());
create policy notifications_own_update on notifications
  for update using (recipient_person_id = current_person_id())
  with check (recipient_person_id = current_person_id());

-- ---------------------------------------------------------------------------
-- 7. Realtime for the live surfaces (idempotent, pattern from v2 go-live)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['notifications', 'support_requests']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'recoveryos' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table recoveryos.%I', t);
    end if;
  end loop;
end
$$;
