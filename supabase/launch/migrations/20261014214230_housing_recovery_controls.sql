-- Prepared repair controls. No applicant identities or residence counts are seeded.
-- Scoped, audited writes follow existing recoveryos RPC authority; no table grants/RLS changes.
begin;

create or replace function recoveryos.reopen_residence_application(
  p_application_id bigint, p_expected_status text, p_reason text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_app recoveryos.residence_applications%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  select * into v_app from recoveryos.residence_applications where id=p_application_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  if not coalesce(recoveryos.is_residence_manager_of(v_app.residence_id),false) then
    return jsonb_build_object('ok',false,'code','not_authorized');
  end if;
  if v_app.status is distinct from p_expected_status then
    return jsonb_build_object('ok',false,'code','stale_application','message','The application changed. Reload before making a correction.');
  end if;
  if v_app.status not in ('approved','declined') then
    return jsonb_build_object('ok',false,'code','invalid_transition');
  end if;
  if length(trim(coalesce(p_reason,''))) < 10 or length(p_reason)>2000 then
    return jsonb_build_object('ok',false,'code','reason_required');
  end if;
  -- Conservative: any residency requires a separate reviewed correction, never an application reset.
  if exists(select 1 from recoveryos.residencies where person_id=v_app.person_id and residence_id=v_app.residence_id) then
    return jsonb_build_object('ok',false,'code','residency_exists','message','A residency already exists. Review the residency separately; do not reset this application.');
  end if;
  insert into recoveryos.audit_log(actor_person_id,action,entity_table,entity_id,detail)
  values(v_me,'residence_application.reopened','residence_applications',v_app.id,
    jsonb_build_object('previous_status',v_app.status,'previous_decided_at',v_app.decided_at,
      'previous_decided_by_person_id',v_app.decided_by_person_id,'reason',trim(p_reason),'new_status','in_review'));
  update recoveryos.residence_applications set status='in_review',decided_at=null,decided_by_person_id=null where id=v_app.id;
  -- Preserve notes, answers, original intake links, signatures, consent and all prior audit records.
  return jsonb_build_object('ok',true,'code','reopened');
end $$;

create or replace function recoveryos.set_residence_capacity(
  p_residence_id bigint, p_capacity integer, p_expected_capacity integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_old integer;
  v_beds bigint;
  v_residents bigint;
begin
  if v_me is null then return jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  if not coalesce(recoveryos.is_residence_manager_of(p_residence_id),false) then
    return jsonb_build_object('ok',false,'code','not_authorized');
  end if;
  select capacity into v_old from recoveryos.residences where id=p_residence_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  if v_old is distinct from p_expected_capacity then
    return jsonb_build_object('ok',false,'code','stale_capacity','message','Capacity changed. Reload this page before saving.');
  end if;
  if p_capacity is null or p_capacity<0 or p_capacity>1000 then
    return jsonb_build_object('ok',false,'code','invalid_capacity');
  end if;
  select count(*) into v_beds from recoveryos.residence_beds b
    join recoveryos.residence_rooms r on r.id=b.room_id join recoveryos.residence_units u on u.id=r.unit_id
    where u.residence_id=p_residence_id and b.is_active;
  select count(*) into v_residents from recoveryos.residencies
    where residence_id=p_residence_id and residency_status in ('approved','active','on_pass','transitioning');
  if p_capacity < greatest(v_beds,v_residents) then
    return jsonb_build_object('ok',false,'code','below_configured_capacity','message','Capacity cannot be below configured active beds or current residencies. Review those records first.');
  end if;
  if v_old is not distinct from p_capacity then return jsonb_build_object('ok',true,'code','already_set'); end if;
  update recoveryos.residences set capacity=p_capacity where id=p_residence_id;
  insert into recoveryos.audit_log(actor_person_id,action,entity_table,entity_id,detail)
    values(v_me,'residence.capacity_updated','residences',p_residence_id,
      jsonb_build_object('previous_capacity',v_old,'capacity',p_capacity));
  return jsonb_build_object('ok',true,'code','saved');
end $$;

create or replace function recoveryos.add_residence_room_beds(
  p_residence_id bigint, p_unit_name text, p_room_name text, p_bed_count integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_capacity integer;
  v_count bigint;
  v_unit bigint;
  v_room bigint;
begin
  if v_me is null then return jsonb_build_object('ok',false,'code','unauthenticated'); end if;
  if not coalesce(recoveryos.is_residence_manager_of(p_residence_id),false) then
    return jsonb_build_object('ok',false,'code','not_authorized');
  end if;
  -- Serialize layout changes for this residence, including capacity edits.
  select capacity into v_capacity from recoveryos.residences where id=p_residence_id for update;
  if not found then return jsonb_build_object('ok',false,'code','not_found'); end if;
  if v_capacity is null then return jsonb_build_object('ok',false,'code','capacity_required','message','Save confirmed capacity before configuring beds.'); end if;
  if p_bed_count is null or p_bed_count<1 or p_bed_count>100
    or length(trim(coalesce(p_unit_name,''))) not between 1 and 100
    or length(trim(coalesce(p_room_name,''))) not between 1 and 100 then
    return jsonb_build_object('ok',false,'code','invalid_room');
  end if;
  select count(*) into v_count from recoveryos.residence_units where residence_id=p_residence_id and lower(trim(name))=lower(trim(p_unit_name));
  if v_count>1 then return jsonb_build_object('ok',false,'code','ambiguous_unit'); end if;
  select id into v_unit from recoveryos.residence_units where residence_id=p_residence_id and lower(trim(name))=lower(trim(p_unit_name));
  if exists(select 1 from recoveryos.residence_rooms where unit_id=v_unit and lower(trim(name))=lower(trim(p_room_name))) then
    return jsonb_build_object('ok',false,'code','room_exists','message','This room already exists. Reload the bed board before adding anything else.');
  end if;
  select count(*) into v_count from recoveryos.residence_beds b
    join recoveryos.residence_rooms r on r.id=b.room_id join recoveryos.residence_units u on u.id=r.unit_id
    where u.residence_id=p_residence_id and b.is_active;
  if v_count+p_bed_count>v_capacity then
    return jsonb_build_object('ok',false,'code','exceeds_capacity','message','These beds would exceed the confirmed capacity.');
  end if;
  if v_unit is null then
    insert into recoveryos.residence_units(residence_id,name) values(p_residence_id,trim(p_unit_name)) returning id into v_unit;
  end if;
  insert into recoveryos.residence_rooms(unit_id,name) values(v_unit,trim(p_room_name)) returning id into v_room;
  insert into recoveryos.residence_beds(room_id,name) select v_room,'Bed '||n from generate_series(1,p_bed_count) n;
  insert into recoveryos.audit_log(actor_person_id,action,entity_table,entity_id,detail)
    values(v_me,'residence.room_beds_created','residences',p_residence_id,
      jsonb_build_object('unit_id',v_unit,'room_id',v_room,'bed_count',p_bed_count));
  return jsonb_build_object('ok',true,'code','created');
end $$;

revoke all on function recoveryos.reopen_residence_application(bigint,text,text),
  recoveryos.set_residence_capacity(bigint,integer,integer),
  recoveryos.add_residence_room_beds(bigint,text,text,integer) from public,anon;
grant execute on function recoveryos.reopen_residence_application(bigint,text,text),
  recoveryos.set_residence_capacity(bigint,integer,integer),
  recoveryos.add_residence_room_beds(bigint,text,text,integer) to authenticated;
commit;
