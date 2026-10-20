-- Approved Housing + owner-private Admin Collaboration activation only.
-- Source: PR #41 reviewed schema.sql and collaboration-schema.sql at 443ac219.
-- No bridge objects, OAuth/token hooks, credentials, retention or scheduler.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
-- Requires verified current classification-aware staff_residence_ids / is_care_operations_staff
-- Explicit production checks below do not depend on unapplied 0151 helper semantics.
-- Does not redefine permissions, role helpers, coaching claims, intake conversion, or bed inventory.
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
create table recoveryos.housing_source_references (
  source text not null,
  reference text not null,
  intake_id bigint not null references recoveryos.housing_follow_through(intake_id),
  primary key (source, reference)
);
alter table recoveryos.housing_source_references enable row level security;
revoke all on recoveryos.housing_source_references from public, anon, authenticated;
-- References are surfaced through the authorized event stream only. Global uniqueness prevents duplicate intake linking.
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
  if auth.uid() is null or v_actor is null or not exists (select 1 from recoveryos.person_classification where person_id=v_actor and classification='production') then raise exception 'not_authorized'; end if;
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
        if not exists (select 1 from recoveryos.person_classification where person_id=v_cover and classification='production') or not exists (select 1 from recoveryos.role_assignments ra where ra.person_id = v_cover and ra.residence_id = v_intake.residence_id and ra.role_key::text in ('residence_staff','residence_manager') and ra.revoked_at is null) then raise exception 'eligible_residence_cover_required'; end if;
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
        insert into recoveryos.housing_source_references(source,reference,intake_id) values(p_detail->>'source',trim(p_detail->>'reference'),p_intake_id) on conflict do nothing;
        if not found then raise exception 'source_already_linked'; end if;
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

-- Requires verified classification-aware is_platform_admin, is_care_operations_staff and staff_residence_ids.
-- Workspace is PRIVATE to its creating admin, scoped to one residence; no automatic cross-admin sharing.
create table recoveryos.admin_collaboration_workspaces (
  owner_person_id bigint not null references recoveryos.people(id),
  residence_id bigint not null references recoveryos.residences(id),
  version integer not null check (version > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  saved_at timestamptz not null default now(),
  primary key (owner_person_id, residence_id)
);
create table recoveryos.admin_collaboration_revisions (
  owner_person_id bigint not null,
  residence_id bigint not null,
  version integer not null,
  actor_person_id bigint not null references recoveryos.people(id),
  saved_at timestamptz not null default now(),
  document jsonb not null,
  primary key (owner_person_id, residence_id, version),
  foreign key (owner_person_id, residence_id) references recoveryos.admin_collaboration_workspaces(owner_person_id, residence_id)
);
alter table recoveryos.admin_collaboration_workspaces enable row level security;
alter table recoveryos.admin_collaboration_revisions enable row level security;
-- RPC-only reads/writes. No direct table grants or permissive policies, including default grants.
revoke all on recoveryos.admin_collaboration_workspaces, recoveryos.admin_collaboration_revisions from public, anon, authenticated;

create function recoveryos.read_admin_collaboration_workspace(p_residence_id bigint)
returns jsonb language plpgsql security definer set search_path = recoveryos, pg_temp as $$
declare v_actor bigint := recoveryos.current_person_id(); v_row recoveryos.admin_collaboration_workspaces; v_audit jsonb;
begin
  if auth.uid() is null or v_actor is null or not exists (select 1 from recoveryos.person_classification where person_id=v_actor and classification='production') or not coalesce(recoveryos.is_platform_admin(), false)
     or not coalesce((p_residence_id in (select recoveryos.staff_residence_ids()) or recoveryos.is_care_operations_staff()),false)
     or not exists(select 1 from recoveryos.residences where id=p_residence_id) then
    return jsonb_build_object('ok',false,'code','not_authorized');
  end if;
  select * into v_row from recoveryos.admin_collaboration_workspaces where owner_person_id=v_actor and residence_id=p_residence_id;
  select coalesce(jsonb_agg(jsonb_build_object('version',version,'actor_person_id',actor_person_id,'saved_at',saved_at) order by version),'[]') into v_audit
    from recoveryos.admin_collaboration_revisions where owner_person_id=v_actor and residence_id=p_residence_id;
  return jsonb_build_object('ok',true,'workspace',jsonb_build_object('version',coalesce(v_row.version,0),'saved_at',v_row.saved_at,
    'document',coalesce(v_row.document,'{"brief":"","notes":"","intakeId":null,"batches":[]}'::jsonb),'audit',v_audit));
end $$;

create function recoveryos.save_admin_collaboration_workspace(p_residence_id bigint, p_version integer, p_document jsonb)
returns jsonb language plpgsql security definer set search_path = recoveryos, pg_temp as $$
declare v_actor bigint := recoveryos.current_person_id(); v_gate jsonb; v_version integer; v_batch jsonb; v_item jsonb; v_person bigint;
begin
  v_gate := recoveryos.read_admin_collaboration_workspace(p_residence_id);
  if not coalesce((v_gate->>'ok')::boolean,false) then return v_gate; end if;
  if p_document is null or jsonb_typeof(p_document) <> 'object' or pg_column_size(p_document) > 1048576
     or jsonb_typeof(p_document->'batches') is distinct from 'array'
     or jsonb_typeof(p_document->'brief') is distinct from 'string'
     or jsonb_typeof(p_document->'notes') is distinct from 'string'
     or not (p_document ? 'intakeId') then
    return jsonb_build_object('ok',false,'code','invalid_document');
  end if;
  if p_document->>'intakeId' is not null and not exists (select 1 from recoveryos.residence_application_intake where id=(p_document->>'intakeId')::bigint and residence_id=p_residence_id) then
    return jsonb_build_object('ok',false,'code','context_mismatch');
  end if;
  -- Validate every proposed target; client-side selectors are never the authorization boundary.
  for v_batch in select value from jsonb_array_elements(p_document->'batches') loop
    if jsonb_typeof(v_batch->'items') is distinct from 'array' then return jsonb_build_object('ok',false,'code','invalid_batch'); end if;
    for v_item in select value from jsonb_array_elements(v_batch->'items') loop
      if v_item->>'residenceId' is not null and (v_item->>'residenceId')::bigint <> p_residence_id then return jsonb_build_object('ok',false,'code','context_mismatch'); end if;
      v_person := (v_item->>'personId')::bigint;
      if v_person is not null and not exists(select 1 from recoveryos.residencies where person_id=v_person and residence_id=p_residence_id and residency_status::text in ('approved','active','on_pass','transitioning')) then return jsonb_build_object('ok',false,'code','resident_mismatch'); end if;
      if coalesce(v_item->>'decision','') not in ('pending','approved for review','rejected','evidence requested') then return jsonb_build_object('ok',false,'code','review_only'); end if;
      if coalesce(v_item->>'type','') not in ('facilities issue','household decision','policy clarification','meeting follow-through','restricted resident-specific question')
         or coalesce(v_item->>'reportState','') not in ('reported','requested','proposed','announced','verified')
         then return jsonb_build_object('ok',false,'code','invalid_item'); end if;
      if v_item->>'decision' <> 'pending' and nullif(trim(v_item->>'reviewReason'),'') is null then return jsonb_build_object('ok',false,'code','review_incomplete'); end if;
      if v_item->>'decision' = 'approved for review' then
        if v_item->>'residenceId' is null or coalesce(v_item->>'matchingConfirmed','false') <> 'true'
          or nullif(trim(v_item->>'proposedChange'),'') is null or nullif(trim(v_item->>'currentRecord'),'') is null
          or v_item->>'currentRecord' = 'Not verified'
          or (v_item->>'type' = 'restricted resident-specific question' and v_person is null)
          or ((v_item->>'type' = 'policy clarification' or v_item->>'reportState' = 'verified') and nullif(trim(v_item->>'evidence'),'') is null)
          then return jsonb_build_object('ok',false,'code','review_incomplete'); end if;
      end if;
    end loop;
  end loop;
  -- Per-actor residence lock also serializes first insert (no row yet); there is no last-writer-wins overwrite.
  perform pg_advisory_xact_lock(hashtextextended('collaboration:' || v_actor || ':' || p_residence_id,0));
  select version into v_version from recoveryos.admin_collaboration_workspaces where owner_person_id=v_actor and residence_id=p_residence_id for update;
  if p_version is null or coalesce(v_version,0) <> p_version then return jsonb_build_object('ok',false,'code','stale_version'); end if;
  insert into recoveryos.admin_collaboration_workspaces(owner_person_id,residence_id,version,document)
    values(v_actor,p_residence_id,p_version+1,p_document)
    on conflict(owner_person_id,residence_id) do update set version=excluded.version,document=excluded.document,saved_at=now();
  -- Authoritative audit identity/time/version come only from the server. Embedded draft history is untrusted annotation.
  insert into recoveryos.admin_collaboration_revisions(owner_person_id,residence_id,version,actor_person_id,document)
    values(v_actor,p_residence_id,p_version+1,v_actor,p_document);
  return recoveryos.read_admin_collaboration_workspace(p_residence_id);
end $$;
revoke all on function recoveryos.read_admin_collaboration_workspace(bigint) from public, anon;
revoke all on function recoveryos.save_admin_collaboration_workspace(bigint,integer,jsonb) from public, anon;
grant execute on function recoveryos.read_admin_collaboration_workspace(bigint) to authenticated;
grant execute on function recoveryos.save_admin_collaboration_workspace(bigint,integer,jsonb) to authenticated;
-- Production default ACL grants service_role table/sequence rights automatically.
-- Remove those inherited grants on these new objects only; add no broader backend access.
revoke all on recoveryos.housing_follow_through, recoveryos.housing_follow_through_events,
 recoveryos.housing_source_references, recoveryos.admin_collaboration_workspaces,
 recoveryos.admin_collaboration_revisions from service_role;
revoke all on sequence recoveryos.housing_follow_through_events_id_seq from service_role;
notify pgrst, 'reload schema';
commit;
