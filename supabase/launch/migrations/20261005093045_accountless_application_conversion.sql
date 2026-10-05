-- Executive direction 2026-10-05: an applicant need not create a login to proceed.
-- Additive staff-only action; existing review/readiness/admission gates remain authoritative.
create or replace function recoveryos.create_accountless_application_from_intake(
  p_intake_id bigint, p_first_name text, p_last_name text, p_confirm boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_i recoveryos.residence_application_intake%rowtype;
  v_person bigint;
  v_result jsonb;
  v_email text;
  v_phone text;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_i from recoveryos.residence_application_intake where id = p_intake_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if not exists (select 1 from recoveryos.staff_residence_ids() r(staff_id) where staff_id = v_i.residence_id)
     and not recoveryos.is_care_operations_staff() and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if v_i.status = 'converted' then
    return jsonb_build_object('ok', true, 'code', 'already_converted',
      'person_id', v_i.converted_person_id, 'application_id', v_i.converted_application_id);
  end if;
  if v_i.status in ('closed','declined') then
    return jsonb_build_object('ok', false, 'code', 'intake_closed');
  end if;
  if not coalesce(p_confirm,false) then
    return jsonb_build_object('ok', false, 'code', 'identity_confirmation_required');
  end if;
  if nullif(trim(p_first_name),'') is null or nullif(trim(p_last_name),'') is null
     or length(p_first_name) > 100 or length(p_last_name) > 100 then
    return jsonb_build_object('ok', false, 'code', 'name_required');
  end if;
  v_email := lower(nullif(trim(v_i.applicant_email),''));
  v_phone := nullif(regexp_replace(v_i.applicant_phone,'[^0-9]','','g'),'');
  -- Serialize this narrow staff action; repeated submissions cannot race into duplicate people.
  perform pg_advisory_xact_lock(824105, 1);
  if exists (select 1 from recoveryos.people p left join auth.users u on u.id=p.auth_user_id
    where (v_email is not null and lower(u.email)=v_email)
       or (lower(trim(p.first_name))=lower(trim(p_first_name))
           and lower(trim(p.last_name))=lower(trim(p_last_name))))
    or exists (select 1 from recoveryos.contact_methods c
      where (v_email is not null and c.kind='email' and lower(trim(c.value))=v_email)
         or (v_phone is not null and c.kind in ('phone','sms')
             and regexp_replace(c.value,'[^0-9]','','g')=v_phone)) then
    return jsonb_build_object('ok', false, 'code', 'identity_review_required',
      'message', 'An existing person may match. Verify and link their record instead of creating a duplicate; ask a care-operations administrator if needed.');
  end if;
  insert into recoveryos.people(first_name,last_name,auth_user_id)
    values(trim(p_first_name),trim(p_last_name),null) returning id into v_person;
  if v_email is not null then
    insert into recoveryos.contact_methods(person_id,kind,value,is_verified)
      values(v_person,'email',trim(v_i.applicant_email),false);
  end if;
  if v_phone is not null then
    insert into recoveryos.contact_methods(person_id,kind,value,is_verified)
      values(v_person,'phone',trim(v_i.applicant_phone),false);
  end if;
  v_result := recoveryos.convert_application_intake(p_intake_id,v_person,false);
  if not coalesce((v_result->>'ok')::boolean,false) then
    raise exception 'Accountless conversion refused: %', v_result->>'code';
  end if;
  insert into recoveryos.audit_log(actor_person_id,action,entity_table,entity_id,detail)
    values(v_me,'application_intake_accountless_person_created','residence_application_intake',p_intake_id,
      jsonb_build_object('person_id',v_person,'application_id',v_result->'application_id',
        'identity_confirmed',true,'auth_account_created',false));
  return v_result || jsonb_build_object('person_id',v_person);
end $$;
revoke all on function recoveryos.create_accountless_application_from_intake(bigint,text,text,boolean) from public,anon;
grant execute on function recoveryos.create_accountless_application_from_intake(bigint,text,text,boolean) to authenticated;
notify pgrst, 'reload schema';
