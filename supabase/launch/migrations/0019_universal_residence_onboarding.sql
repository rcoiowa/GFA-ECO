-- Universal residence onboarding (Recovery Residence platform).
-- Any operator can create a residence profile — organization, residence,
-- house standards — and immediately hold the residence_manager role for it,
-- landing in the same operations workspace Grace House staff use. Design
-- source: the "Recovery Residence — Universal Recovery Housing Platform"
-- prototype (three-step wizard: organization → residence → standards).

set search_path = recoveryos, public;

-- House-standards profile fields from the onboarding wizard.
alter table residences
  add column if not exists level_of_support text,
  add column if not exists commitments text[] not null default '{}',
  add column if not exists curfew_weeknight text;

alter table residences
  add constraint residences_level_of_support_chk
  check (level_of_support is null or level_of_support in ('I', 'II', 'III', 'IV'));

-- Business structure of the operating organization (the organization_type
-- enum classifies its role in the ecosystem, not its legal form).
alter table organizations
  add column if not exists structure text;

alter table organizations
  add constraint organizations_structure_chk
  check (structure is null or structure in (
    'nonprofit_501c3', 'llc_private', 'faith_based', 'government', 'other'
  ));

-- Self-serve creation: organization + residence + manager role in one call.
create or replace function create_residence_for_current_user(
  p_org_name text,
  p_org_structure text,
  p_org_phone text,
  p_org_email text,
  p_residence_name text,
  p_population_served text,
  p_capacity int,
  p_weekly_fee numeric,
  p_level_of_support text,
  p_city text,
  p_state text,
  p_commitments text[],
  p_curfew_weeknight text
) returns residences
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  me people;
  org_id bigint;
  result residences;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select * into me from people where auth_user_id = auth.uid();
  if not found then
    raise exception 'No person record — complete onboarding first';
  end if;
  if coalesce(trim(p_org_name), '') = '' or coalesce(trim(p_residence_name), '') = '' then
    raise exception 'Organization and residence names are required';
  end if;

  insert into organizations (name, organization_type, structure)
  values (trim(p_org_name), 'recovery_residence_operator', p_org_structure)
  returning id into org_id;

  insert into residences (
    organization_id, name, address_city, address_state, capacity,
    population_served, shared_room_fee_weekly, level_of_support,
    commitments, curfew_weeknight, phone, email
  ) values (
    org_id, trim(p_residence_name), nullif(trim(p_city), ''), nullif(trim(p_state), ''),
    p_capacity, nullif(trim(p_population_served), ''), p_weekly_fee,
    p_level_of_support, coalesce(p_commitments, '{}'), nullif(trim(p_curfew_weeknight), ''),
    nullif(trim(p_org_phone), ''), nullif(trim(p_org_email), '')
  ) returning * into result;

  insert into role_assignments (person_id, role_key, organization_id, residence_id, granted_by_person_id)
  values (me.id, 'residence_manager', org_id, result.id, me.id);

  insert into audit_log (actor_person_id, action, entity_table, entity_id)
  values (me.id, 'residence.self_provisioned', 'residences', result.id);

  return result;
end;
$$;

revoke all on function create_residence_for_current_user(
  text, text, text, text, text, text, int, numeric, text, text, text, text[], text
) from public;
grant execute on function create_residence_for_current_user(
  text, text, text, text, text, text, int, numeric, text, text, text, text[], text
) to authenticated;
