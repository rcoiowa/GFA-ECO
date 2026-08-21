-- LAUNCH 0103 — Deliberate identity provisioning (no auto-privilege, no password seeding).
--
-- Authorization chain is fixed: auth.users -> recoveryos.people -> recoveryos.role_assignments.
-- Nothing derives authority from user-editable metadata or legacy profile text.
--
-- Mechanism: every new auth signup gets a people row + the 'participant' role (self-service
-- baseline). Staff/admin authority is granted ONLY through recoveryos.staff_preauthorizations —
-- a deliberate, admin-managed allowlist keyed by email, consumed exactly once at first sign-up.
-- No credentials are fabricated in SQL; humans register through the normal auth flow.

begin;

create table recoveryos.staff_preauthorizations (
  id           bigint generated always as identity primary key,
  email        text not null unique,
  role_keys    recoveryos.role_key[] not null,
  note         text,
  consumed_at  timestamptz,
  consumed_person_id bigint references recoveryos.people(id),
  created_at   timestamptz not null default now()
);
alter table recoveryos.staff_preauthorizations enable row level security;
create policy staff_preauth_admin on recoveryos.staff_preauthorizations for all to authenticated
  using (recoveryos.is_admin_staff()) with check (recoveryos.is_admin_staff());

create or replace function recoveryos.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_person bigint;
  v_pre recoveryos.staff_preauthorizations%rowtype;
  v_role recoveryos.role_key;
  v_first text;
begin
  begin
    v_first := coalesce(nullif(split_part(coalesce(NEW.email,''), '@', 1), ''), 'New');
    insert into recoveryos.people (auth_user_id, first_name, last_name)
    values (NEW.id, initcap(v_first), '')
    on conflict (auth_user_id) do nothing
    returning id into v_person;
    if v_person is null then
      select id into v_person from recoveryos.people where auth_user_id = NEW.id;
    end if;
    -- production classification by default (fixtures are classified explicitly, staging-only)
    insert into recoveryos.person_classification (person_id, classification)
    values (v_person, 'production') on conflict (person_id) do nothing;
    -- baseline self-service role
    insert into recoveryos.role_assignments (person_id, role_key, organization_id)
    select v_person, 'participant', 1
    where not exists (select 1 from recoveryos.role_assignments
                      where person_id = v_person and role_key = 'participant' and revoked_at is null);
    -- deliberate staff grant, consumed once
    select * into v_pre from recoveryos.staff_preauthorizations
      where lower(email) = lower(coalesce(NEW.email,'')) and consumed_at is null
      for update;
    if found then
      foreach v_role in array v_pre.role_keys loop
        insert into recoveryos.role_assignments (person_id, role_key, organization_id)
        select v_person, v_role, 1
        where not exists (select 1 from recoveryos.role_assignments
                          where person_id = v_person and role_key = v_role and revoked_at is null);
      end loop;
      update recoveryos.staff_preauthorizations
        set consumed_at = now(), consumed_person_id = v_person where id = v_pre.id;
    end if;
  exception when others then
    -- provisioning must never block sign-up; failures are audited and repairable by an admin
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'auth_provision_failed', 'auth.users', null, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.handle_new_auth_user() from public, anon, authenticated;
drop trigger if exists trg_recoveryos_new_auth_user on auth.users;
create trigger trg_recoveryos_new_auth_user
  after insert on auth.users
  for each row execute function recoveryos.handle_new_auth_user();

commit;
