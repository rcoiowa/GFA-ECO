-- REVIEW PROPOSAL ONLY. Outside migration ledger. Never run against production from this branch.
-- Requires verified current classification-aware staff_residence_ids / is_care_operations_staff
-- and strict is_production_person (0151 semantics; verify actual deployed definitions).
-- Does not redefine permissions, role helpers, coaching claims, intake conversion, or bed inventory.
begin;
create table recoveryos.housing_follow_through (
  intake_id bigint primary key references recoveryos.residence_application_intake(id),
  owner_person_id bigint references recoveryos.people(id),
  proposed_cover_person_id bigint references recoveryos.people(id),
  next_action text,
  due_at timestamptz,
  closed_at timestamptz,
  bed_state text not null default 'unverified' check (bed_state in ('unverified','available','held','assigned','occupied')),
  bed_reference text,
  bed_evidence text,
  bed_verified_at timestamptz,
  bed_verified_by bigint references recoveryos.people(id),
  version integer not null default 0,
  check ((next_action is null) = (due_at is null)),
  check (closed_at is null or (next_action is null and proposed_cover_person_id is null)),
  check (proposed_cover_person_id is null or (owner_person_id is not null and proposed_cover_person_id <> owner_person_id)),
  check (bed_state = 'unverified' or (length(trim(bed_reference)) > 0 and length(trim(bed_evidence)) > 0 and bed_verified_at is not null and bed_verified_by is not null))
);
create table recoveryos.housing_follow_through_events (
  id bigint generated always as identity primary key,
  intake_id bigint not null references recoveryos.housing_follow_through(intake_id),
  actor_person_id bigint not null references recoveryos.people(id),
  occurred_at timestamptz not null default now(),
  action text not null,
  detail jsonb not null
);
alter table recoveryos.housing_follow_through enable row level security;
alter table recoveryos.housing_follow_through_events enable row level security;
revoke all on recoveryos.housing_follow_through, recoveryos.housing_follow_through_events from public, anon, authenticated;
grant select on recoveryos.housing_follow_through, recoveryos.housing_follow_through_events to authenticated;
-- Invoker subqueries retain the canonical intake's actual RLS restrictions.
create policy housing_read on recoveryos.housing_follow_through for select to authenticated
using (exists (select 1 from recoveryos.residence_application_intake i where i.id = intake_id));
create policy housing_event_read on recoveryos.housing_follow_through_events for select to authenticated
using (exists (select 1 from recoveryos.residence_application_intake i where i.id = intake_id));

create function recoveryos.act_housing_follow_through(p_intake_id bigint, p_version integer, p_action text, p_detail jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = recoveryos, pg_temp as $$
declare
  v_actor bigint := recoveryos.current_person_id();
  v_intake recoveryos.residence_application_intake;
  v_row recoveryos.housing_follow_through;
  v_before jsonb;
  v_cover bigint;
  v_when timestamptz;
begin
  if auth.uid() is null or v_actor is null then raise exception 'not_authorized'; end if;
  select * into v_intake from recoveryos.residence_application_intake where id = p_intake_id;
  if not found or not coalesce((v_intake.residence_id in (select recoveryos.staff_residence_ids()) or recoveryos.is_care_operations_staff()), false) then
    raise exception 'not_authorized';
  end if;
  -- Serialize initialization and subsequent updates; conversion locks this same canonical row.
  perform 1 from recoveryos.residence_application_intake where id = p_intake_id for update;
  insert into recoveryos.housing_follow_through(intake_id) values (p_intake_id) on conflict do nothing;
  select * into v_row from recoveryos.housing_follow_through where intake_id = p_intake_id for update;
  if p_version is null or v_row.version <> p_version then raise exception 'stale_version'; end if;
  v_before := to_jsonb(v_row);
  if p_action = 'claim' then
    if v_row.owner_person_id is not null then raise exception 'already_owned'; end if;
    v_row.owner_person_id := v_actor;
  elsif p_action = 'accept_cover' then
    if v_row.proposed_cover_person_id is distinct from v_actor then raise exception 'acceptance_required'; end if;
    -- Residence authorization was checked above for the accepting actor, independently of ownership.
    v_row.owner_person_id := v_actor;
    v_row.proposed_cover_person_id := null;
  else
    if v_row.owner_person_id is distinct from v_actor then raise exception 'owner_required'; end if;
    if v_row.closed_at is not null and p_action <> 'reopen' then raise exception 'reopen_required'; end if;
    case p_action
      when 'propose_cover' then
        v_cover := (p_detail->>'person_id')::bigint;
        if v_cover is null or v_cover = v_actor then raise exception 'different_cover_required'; end if;
        -- This proposal grants no access. Only a currently authorized recipient may accept.
        if not coalesce(recoveryos.is_production_person(v_cover), false) or not exists (select 1 from recoveryos.role_assignments ra where ra.person_id = v_cover and ra.residence_id = v_intake.residence_id and ra.role_key::text in ('residence_staff','residence_manager') and ra.revoked_at is null) then raise exception 'eligible_residence_cover_required'; end if;
        v_row.proposed_cover_person_id := v_cover;
      when 'cancel_cover' then v_row.proposed_cover_person_id := null;
      when 'next_action' then
        if v_row.next_action is not null then raise exception 'complete_existing_commitment_first'; end if;
        if nullif(trim(p_detail->>'text'),'') is null or nullif(p_detail->>'due_at','') is null then raise exception 'action_and_due_required'; end if;
        v_row.next_action := trim(p_detail->>'text');
        v_row.due_at := (p_detail->>'due_at')::timestamptz;
      when 'complete_action' then
        if v_row.next_action is null or nullif(trim(p_detail->>'evidence'),'') is null then raise exception 'completion_evidence_required'; end if;
        v_row.next_action := null; v_row.due_at := null;
      when 'verify_bed' then
        if coalesce(p_detail->>'state','') not in ('available','held','assigned','occupied') or nullif(trim(p_detail->>'reference'),'') is null or nullif(trim(p_detail->>'evidence'),'') is null then raise exception 'bed_evidence_required'; end if;
        v_when := (p_detail->>'verified_at')::timestamptz;
        if v_when is null or v_when > now() then raise exception 'verification_time_invalid'; end if;
        v_row.bed_state := p_detail->>'state'; v_row.bed_reference := p_detail->>'reference';
        v_row.bed_evidence := p_detail->>'evidence'; v_row.bed_verified_at := v_when; v_row.bed_verified_by := v_actor;
      when 'link_source' then
        if coalesce(p_detail->>'source','') not in ('wix_contact','contact_connect_submission','pre_application','other') or nullif(trim(p_detail->>'reference'),'') is null then raise exception 'source_reference_required'; end if;
        if exists (select 1 from recoveryos.housing_follow_through_events where intake_id = p_intake_id and action = 'link_source' and detail->'input'->>'source' = p_detail->>'source' and detail->'input'->>'reference' = p_detail->>'reference') then raise exception 'source_already_linked'; end if;
      when 'contact' then
        if coalesce(p_detail->>'kind','') not in ('attempted','connected') or nullif(trim(p_detail->>'evidence'),'') is null then raise exception 'contact_evidence_required'; end if;
        v_when := (p_detail->>'occurred_at')::timestamptz;
        if (v_when is null and coalesce(p_detail->>'date_unknown','false') <> 'true') or v_when > now() then raise exception 'contact_time_invalid'; end if;
      when 'close' then
        if v_row.next_action is not null or v_row.proposed_cover_person_id is not null then raise exception 'unresolved_housing_commitments'; end if;
        if nullif(trim(p_detail->>'evidence'),'') is null then raise exception 'closure_reason_required'; end if;
        v_row.closed_at := now();
      when 'reopen' then v_row.closed_at := null;
      else raise exception 'unknown_action';
    end case;
  end if;
  update recoveryos.housing_follow_through set
    owner_person_id = v_row.owner_person_id, proposed_cover_person_id = v_row.proposed_cover_person_id,
    next_action = v_row.next_action, due_at = v_row.due_at, closed_at = v_row.closed_at,
    bed_state = v_row.bed_state, bed_reference = v_row.bed_reference, bed_evidence = v_row.bed_evidence,
    bed_verified_at = v_row.bed_verified_at, bed_verified_by = v_row.bed_verified_by, version = version + 1
    where intake_id = p_intake_id returning * into v_row;
  insert into recoveryos.housing_follow_through_events(intake_id, actor_person_id, action, detail)
    values(p_intake_id, v_actor, p_action, jsonb_build_object('input', p_detail, 'before', v_before, 'after', to_jsonb(v_row)));
  return to_jsonb(v_row);
end;
$$;
revoke all on function recoveryos.act_housing_follow_through(bigint, integer, text, jsonb) from public, anon;
grant execute on function recoveryos.act_housing_follow_through(bigint, integer, text, jsonb) to authenticated;
commit;
