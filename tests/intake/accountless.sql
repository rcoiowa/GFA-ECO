begin;
do $test$
declare
 v_uid uuid; v_res bigint; v_id bigint; v_person bigint; v_app bigint; v_result jsonb; v_auth_count bigint;
begin
 select p.auth_user_id into v_uid from recoveryos.people p join recoveryos.role_assignments r on r.person_id=p.id where r.role_key in ('administrator','system_administrator') and r.revoked_at is null and p.auth_user_id is not null limit 1;
 if v_uid is null then raise exception 'No test staff identity'; end if;
 perform set_config('request.jwt.claim.sub',v_uid::text,true);
 select id into v_res from recoveryos.residences limit 1;
 select count(*) into v_auth_count from auth.users;
 insert into recoveryos.residence_application_intake(residence_id,applicant_name,applicant_email,consent_to_contact,source,test_fixture)
 values(v_res,'ACCOUNTLESS-ROLLBACK Test','accountless-rollback-20261005@example.invalid',true,'accountless-rollback',true) returning id into v_id;
 v_result:=recoveryos.create_accountless_application_from_intake(v_id,'ACCOUNTLESS-ROLLBACK','Test',false);
 if v_result->>'code'<>'identity_confirmation_required' then raise exception 'Confirmation guard failed: %',v_result; end if;
 v_result:=recoveryos.create_accountless_application_from_intake(v_id,'ACCOUNTLESS-ROLLBACK','Test',true);
 if not (v_result->>'ok')::boolean then raise exception 'Create failed: %',v_result; end if;
 v_person:=(v_result->>'person_id')::bigint; v_app:=(v_result->>'application_id')::bigint;
 if (select auth_user_id from recoveryos.people where id=v_person) is not null then raise exception 'Auth unexpectedly linked'; end if;
 if (select count(*) from auth.users)<>v_auth_count then raise exception 'Auth user unexpectedly created'; end if;
 v_result:=recoveryos.create_accountless_application_from_intake(v_id,'ACCOUNTLESS-ROLLBACK','Test',true);
 if v_result->>'code'<>'already_converted' then raise exception 'Idempotence failed'; end if;
 v_result:=recoveryos.review_residence_application(v_app,'in_review',null);
 if not coalesce((v_result->>'ok')::boolean,false) then raise exception 'Review progression failed: %',v_result; end if;
end $test$;
select 'Accountless create, review progression, no auth user, confirmation and idempotence passed' as result;
rollback;
