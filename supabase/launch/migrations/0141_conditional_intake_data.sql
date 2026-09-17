-- 0141_conditional_intake_data.sql — Gate B4: conditional intake data (strict minimization).
--
-- (Applied BEFORE the B3 conversion/readiness migration 0142, which derives readiness from
-- these tables — the only dependency-driven reordering of the ratified B1→B4 sequence.)
--
-- RATIFIED constraints (Gate B §8, §11; B4 authorization): structured minimum fields only;
-- bounded values over narratives; NO universal SUD history, treatment narrative, trauma
-- narrative, broad medical history, or unrelated justice history; MOUD may NEVER operate as
-- a negative eligibility or readiness signal (guarded by scripts/verify-intake-minimization);
-- medication/justice/consent data role-restricted — no coach/navigator/external access;
-- natural action first (staff record these during the real intake conversation; the record
-- IS the documentation).
--
-- ROLLBACK:
--   drop function recoveryos.record_supervision_coordination(bigint, bigint, text, text, text, text);
--   drop function recoveryos.end_medication_item(bigint);
--   drop function recoveryos.record_medication_item(bigint, text, text, boolean, boolean);
--   drop function recoveryos.record_emergency_contact(bigint, text, text, text, boolean);
--   drop table recoveryos.supervision_coordination_records;
--   drop table recoveryos.residency_medication_items;
--   drop table recoveryos.emergency_contacts;

set search_path = recoveryos, public;

-- ---------------------------------------------------------------------------
-- 1) Emergency contacts — universal at intake. The person owns their contacts;
--    notification authorization is PER CONTACT (Gate A doctrine: operational emergency
--    authority is never checkbox-dependent; this authorizes NOTIFYING the contact).
-- ---------------------------------------------------------------------------
create table if not exists recoveryos.emergency_contacts (
  id bigint generated always as identity primary key,
  person_id bigint not null references recoveryos.people (id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  phone text not null check (length(phone) between 3 and 40),
  relationship text check (relationship is null or length(relationship) <= 120),
  notify_authorized boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists emergency_contacts_person_idx
  on recoveryos.emergency_contacts (person_id) where is_active;
create trigger emergency_contacts_updated_at before update on recoveryos.emergency_contacts
  for each row execute function recoveryos.set_updated_at();

alter table recoveryos.emergency_contacts enable row level security;
create policy emergency_contacts_self on recoveryos.emergency_contacts
  for all to authenticated
  using (person_id = recoveryos.current_person_id())
  with check (person_id = recoveryos.current_person_id());
create policy emergency_contacts_staff_read on recoveryos.emergency_contacts
  for select to authenticated
  using (exists (
    select 1 from recoveryos.residencies r
    where r.person_id = emergency_contacts.person_id
      and r.residence_id in (select recoveryos.staff_residence_ids())
    union all
    select 1 from recoveryos.residence_applications a
    where a.person_id = emergency_contacts.person_id
      and a.residence_id in (select recoveryos.staff_residence_ids())));

-- Staff record a contact during the intake conversation (audited).
create or replace function recoveryos.record_emergency_contact(
  p_person_id bigint, p_name text, p_phone text,
  p_relationship text default null, p_notify_authorized boolean default true
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = p_person_id
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = p_person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  insert into recoveryos.emergency_contacts (person_id, name, phone, relationship, notify_authorized)
  values (p_person_id, trim(p_name), trim(p_phone), nullif(trim(coalesce(p_relationship,'')),''), p_notify_authorized)
  returning id into v_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'emergency_contact_recorded', 'emergency_contacts', v_id,
          jsonb_build_object('person_id', p_person_id));
  return jsonb_build_object('ok', true, 'code', 'recorded', 'contact_id', v_id);
end $$;

-- ---------------------------------------------------------------------------
-- 2) Medication items — the structured minimum the signed Medication & MAT/MOUD policy
--    operationally needs (storage/count). NO dosage, NO diagnosis, NO narrative.
--    is_moud is a CARE-COORDINATION flag only — never eligibility, never readiness
--    (verify-intake-minimization guards this). Staff-recorded (RPC-only writes);
--    the person and their residence staff can read; nobody else.
-- ---------------------------------------------------------------------------
create table if not exists recoveryos.residency_medication_items (
  id bigint generated always as identity primary key,
  person_id bigint not null references recoveryos.people (id) on delete cascade,
  application_id bigint references recoveryos.residence_applications (id),
  residency_id bigint references recoveryos.residencies (id),
  name text not null check (length(name) between 1 and 200),
  storage_requirement text not null default 'self_managed'
    check (storage_requirement in ('self_managed','secure_storage','staff_count')),
  is_moud boolean not null default false,
  prescriber_on_file boolean not null default false,
  recorded_by_person_id bigint references recoveryos.people (id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists residency_medication_items_person_idx
  on recoveryos.residency_medication_items (person_id) where ended_at is null;

alter table recoveryos.residency_medication_items enable row level security;
create policy residency_medication_items_self_read on recoveryos.residency_medication_items
  for select to authenticated using (person_id = recoveryos.current_person_id());
create policy residency_medication_items_staff_read on recoveryos.residency_medication_items
  for select to authenticated
  using (exists (
    select 1 from recoveryos.residencies r
    where r.person_id = residency_medication_items.person_id
      and r.residence_id in (select recoveryos.staff_residence_ids())
    union all
    select 1 from recoveryos.residence_applications a
    where a.person_id = residency_medication_items.person_id
      and a.residence_id in (select recoveryos.staff_residence_ids())));
revoke insert, update, delete on recoveryos.residency_medication_items from anon, authenticated;

create or replace function recoveryos.record_medication_item(
  p_person_id bigint, p_name text,
  p_storage_requirement text default 'self_managed',
  p_is_moud boolean default false,
  p_prescriber_on_file boolean default false
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_id bigint;
  v_application_id bigint;
  v_residency_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if p_storage_requirement not in ('self_managed','secure_storage','staff_count') then
    return jsonb_build_object('ok', false, 'code', 'invalid_storage_requirement');
  end if;
  select id into v_residency_id from recoveryos.residencies
    where person_id = p_person_id and residency_status in ('active','on_pass','transitioning')
      and residence_id in (select recoveryos.staff_residence_ids())
    limit 1;
  if v_residency_id is null then
    select id into v_application_id from recoveryos.residence_applications
      where person_id = p_person_id
        and residence_id in (select recoveryos.staff_residence_ids())
      order by submitted_at desc limit 1;
  end if;
  if v_residency_id is null and v_application_id is null and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  insert into recoveryos.residency_medication_items
    (person_id, application_id, residency_id, name, storage_requirement,
     is_moud, prescriber_on_file, recorded_by_person_id)
  values (p_person_id, v_application_id, v_residency_id, trim(p_name), p_storage_requirement,
          p_is_moud, p_prescriber_on_file, v_me)
  returning id into v_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'medication_item_recorded', 'residency_medication_items', v_id,
          jsonb_build_object('person_id', p_person_id, 'storage', p_storage_requirement));
  return jsonb_build_object('ok', true, 'code', 'recorded', 'item_id', v_id);
end $$;

create or replace function recoveryos.end_medication_item(p_item_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_row recoveryos.residency_medication_items%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_row from recoveryos.residency_medication_items where id = p_item_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not recoveryos.is_platform_admin() and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = v_row.person_id
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = v_row.person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_row.ended_at is not null then return jsonb_build_object('ok', true, 'code', 'already_ended'); end if;
  update recoveryos.residency_medication_items set ended_at = now() where id = p_item_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'medication_item_ended', 'residency_medication_items', p_item_id, '{}'::jsonb);
  return jsonb_build_object('ok', true, 'code', 'ended');
end $$;

-- ---------------------------------------------------------------------------
-- 3) Supervision coordination records — exist ONLY under an active
--    supervision_coordination consent grant (Gate B §8: officer contact is stored only
--    alongside the active authorization; revocation ends staff visibility prospectively).
--    Bounded fields; no justice-history narrative.
-- ---------------------------------------------------------------------------
create table if not exists recoveryos.supervision_coordination_records (
  id bigint generated always as identity primary key,
  person_id bigint not null references recoveryos.people (id) on delete cascade,
  consent_grant_id bigint not null references recoveryos.consent_grants (id),
  officer_name text not null check (length(officer_name) between 1 and 200),
  officer_phone text check (officer_phone is null or length(officer_phone) <= 40),
  agency text check (agency is null or length(agency) <= 200),
  obligations_summary text check (obligations_summary is null or length(obligations_summary) <= 1000),
  is_active boolean not null default true,
  recorded_by_person_id bigint references recoveryos.people (id),
  created_at timestamptz not null default now()
);
create index if not exists supervision_coordination_person_idx
  on recoveryos.supervision_coordination_records (person_id) where is_active;

alter table recoveryos.supervision_coordination_records enable row level security;
-- Visibility is GRANT-ANCHORED: the person always sees their own; staff see rows only
-- while the underlying consent grant is active (granted, not revoked, not expired).
create policy supervision_coordination_self_read on recoveryos.supervision_coordination_records
  for select to authenticated using (person_id = recoveryos.current_person_id());
create policy supervision_coordination_staff_read on recoveryos.supervision_coordination_records
  for select to authenticated
  using (
    exists (select 1 from recoveryos.consent_grants g
            where g.id = supervision_coordination_records.consent_grant_id
              and g.status = 'granted' and g.revoked_at is null
              and (g.expires_at is null or g.expires_at > now()))
    and exists (
      select 1 from recoveryos.residencies r
      where r.person_id = supervision_coordination_records.person_id
        and r.residence_id in (select recoveryos.staff_residence_ids())
      union all
      select 1 from recoveryos.residence_applications a
      where a.person_id = supervision_coordination_records.person_id
        and a.residence_id in (select recoveryos.staff_residence_ids())));
revoke insert, update, delete on recoveryos.supervision_coordination_records from anon, authenticated;

create or replace function recoveryos.record_supervision_coordination(
  p_person_id bigint, p_consent_grant_id bigint,
  p_officer_name text, p_officer_phone text default null,
  p_agency text default null, p_obligations_summary text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_g recoveryos.consent_grants%rowtype;
  v_type_key text;
  v_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() and not exists (
       select 1 from recoveryos.residencies r
       where r.person_id = p_person_id
         and r.residence_id in (select recoveryos.staff_residence_ids())
       union all
       select 1 from recoveryos.residence_applications a
       where a.person_id = p_person_id
         and a.residence_id in (select recoveryos.staff_residence_ids())) then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select * into v_g from recoveryos.consent_grants where id = p_consent_grant_id;
  if not found or v_g.person_id <> p_person_id then
    return jsonb_build_object('ok', false, 'code', 'grant_mismatch');
  end if;
  select key into v_type_key from recoveryos.consent_types where id = v_g.consent_type_id;
  if v_type_key <> 'supervision_coordination'
     or v_g.status <> 'granted' or v_g.revoked_at is not null
     or (v_g.expires_at is not null and v_g.expires_at <= now()) then
    return jsonb_build_object('ok', false, 'code', 'consent_not_active',
      'message', 'Supervision coordination requires an active supervision_coordination consent.');
  end if;
  insert into recoveryos.supervision_coordination_records
    (person_id, consent_grant_id, officer_name, officer_phone, agency,
     obligations_summary, recorded_by_person_id)
  values (p_person_id, p_consent_grant_id, trim(p_officer_name),
          nullif(trim(coalesce(p_officer_phone,'')),''), nullif(trim(coalesce(p_agency,'')),''),
          nullif(trim(coalesce(p_obligations_summary,'')),''), v_me)
  returning id into v_id;
  insert into recoveryos.audit_log (actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'supervision_coordination_recorded', 'supervision_coordination_records', v_id,
          jsonb_build_object('person_id', p_person_id, 'grant_id', p_consent_grant_id));
  return jsonb_build_object('ok', true, 'code', 'recorded', 'record_id', v_id);
end $$;

revoke execute on function
  recoveryos.record_emergency_contact(bigint, text, text, text, boolean),
  recoveryos.record_medication_item(bigint, text, text, boolean, boolean),
  recoveryos.end_medication_item(bigint),
  recoveryos.record_supervision_coordination(bigint, bigint, text, text, text, text)
from public, anon;
grant execute on function
  recoveryos.record_emergency_contact(bigint, text, text, text, boolean),
  recoveryos.record_medication_item(bigint, text, text, boolean, boolean),
  recoveryos.end_medication_item(bigint),
  recoveryos.record_supervision_coordination(bigint, bigint, text, text, text, text)
to authenticated;

notify pgrst, 'reload schema';
