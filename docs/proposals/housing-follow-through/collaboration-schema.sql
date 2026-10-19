-- REVIEW PROPOSAL ONLY; outside applied ledger. No assistant/provider or resident-write permissions.
-- Requires verified classification-aware is_platform_admin, is_care_operations_staff and staff_residence_ids.
-- Workspace is PRIVATE to its creating admin, scoped to one residence; no automatic cross-admin sharing.
begin;
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
  if auth.uid() is null or v_actor is null or not coalesce(recoveryos.is_platform_admin(), false)
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
commit;
