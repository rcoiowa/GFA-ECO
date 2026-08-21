-- RecoveryOS Person Classification (P3B). Applied live as recoveryos_0030_person_classification.
-- First-class production-vs-test_fixture classification so demo/test identities can exist in
-- production infrastructure for controlled testing but NEVER become production authority or
-- production reporting data. Fixture status is a canonical record — NOT inferred from email
-- domain in application code.
--
-- LOCKED DECISION (P3B): the 4 @vrcc-v2.test identities (person 10/15/16/17) are TEST_FIXTURE.
-- They keep their baseline participant role only; their historical privileged v2 roles remain
-- ungranted. They are excluded from production pool discovery, coach lists, capacity, counts,
-- and (when eventually enabled) external notification delivery. They are NOT deleted.
--
-- Security note: fixture status is a METRICS/OPERATIONS boundary, not a security boundary — a
-- fixture account still follows ordinary RLS. Security continues to derive from role_assignments.

begin;

create table recoveryos.person_classification (
  person_id      bigint primary key references recoveryos.people(id) on delete cascade,
  classification text not null default 'production' check (classification in ('production','test_fixture')),
  reason         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table recoveryos.person_classification enable row level security;
-- Operational metadata: admins read; writes via admin/service only (no client policy).
create policy pc_admin_select on recoveryos.person_classification for select to authenticated
  using (recoveryos.is_admin_staff());
drop trigger if exists trg_pc_touch on recoveryos.person_classification;
create trigger trg_pc_touch before update on recoveryos.person_classification
  for each row execute function recoveryos.touch_updated_at();

-- Helpers
create or replace function recoveryos.is_test_fixture(p_person_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select exists (select 1 from recoveryos.person_classification
                 where person_id = p_person_id and classification = 'test_fixture');
$$;
create or replace function recoveryos.is_production_person(p_person_id bigint)
returns boolean language sql stable security definer set search_path = recoveryos, public as $$
  select not recoveryos.is_test_fixture(p_person_id);
$$;
revoke execute on function recoveryos.is_test_fixture(bigint), recoveryos.is_production_person(bigint) from public, anon;
grant execute on function recoveryos.is_test_fixture(bigint), recoveryos.is_production_person(bigint) to authenticated;

-- Classify the current cohort: default production; @vrcc-v2.test demo people are fixtures.
insert into recoveryos.person_classification (person_id, classification, reason)
select p.id, 'production', 'default'
from recoveryos.people p
on conflict (person_id) do nothing;

update recoveryos.person_classification pc
set classification = 'test_fixture', reason = 'vrcc-v2.test demo fixture (P3B locked decision)'
from recoveryos.people p
join auth.users u on u.id = p.auth_user_id
where pc.person_id = p.id and lower(u.email) like '%@vrcc-v2.test';

-- Fixture-aware PRODUCTION read models (canonical, staff-only, fixtures excluded).
-- Canonical open coaching pool: only production participants' open requests, decision fields only.
create or replace function recoveryos.list_open_support_requests()
returns table (
  support_request_id bigint, participant_person_id bigint, participant_name text,
  request_type text, preferred_modality recoveryos.service_modality, focus text, created_at timestamptz
) language sql security definer set search_path = recoveryos, public stable as $$
  select s.id, s.person_id, (pp.first_name || ' ' || pp.last_name),
         s.request_type, s.preferred_modality, s.focus, s.created_at
  from recoveryos.support_requests s
  join recoveryos.people pp on pp.id = s.person_id
  where s.status in ('submitted','open')
    and s.claimed_by_person_id is null
    and recoveryos.is_support_staff()
    and recoveryos.is_production_person(s.person_id)   -- fixture requests never reach a real coach's pool
  order by s.created_at;
$$;
revoke execute on function recoveryos.list_open_support_requests() from public, anon;
grant execute on function recoveryos.list_open_support_requests() to authenticated;

-- Production coach roster (active coaches) — excludes fixtures from any "list coaches" surface.
create or replace function recoveryos.list_active_coaches()
returns table (coach_person_id bigint, coach_name text) language sql security definer
set search_path = recoveryos, public stable as $$
  select distinct p.id, (p.first_name || ' ' || p.last_name)
  from recoveryos.people p
  join recoveryos.role_assignments ra on ra.person_id = p.id and ra.revoked_at is null
   and ra.role_key in ('coach','navigator')
  where recoveryos.is_admin_staff()
    and recoveryos.is_production_person(p.id)
  order by 2;
$$;
revoke execute on function recoveryos.list_active_coaches() from public, anon;
grant execute on function recoveryos.list_active_coaches() to authenticated;

commit;
notify pgrst, 'reload schema';
