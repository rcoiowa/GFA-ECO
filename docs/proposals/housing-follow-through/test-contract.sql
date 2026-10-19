-- Run after test-bootstrap.sql and schema.sql ONLY in an isolated throwaway database.
\set ON_ERROR_STOP on
create function public.assert_true(ok boolean, label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAILED: %', label; end if; end $$;
create function public.expect_failure(statement text, expected text) returns void language plpgsql security invoker as $$
begin
  begin execute statement; exception when others then
    if position(expected in sqlerrm) > 0 then return; end if;
    raise exception 'Unexpected refusal: %', sqlerrm;
  end;
  raise exception 'Expected refusal: %', expected;
end $$;
set role authenticated;
set test.uid = '00000000-0000-0000-0000-000000000001';
set test.actor = '1';
select recoveryos.act_housing_follow_through(100,0,'claim');
select recoveryos.act_housing_follow_through(100,1,'contact','{"kind":"connected","date_unknown":"true","evidence":"Administrator confirms previous personal contact"}');
select recoveryos.act_housing_follow_through(100,2,'link_source','{"source":"wix_contact","reference":"synthetic-contact-1"}');
select recoveryos.act_housing_follow_through(100,3,'link_source','{"source":"contact_connect_submission","reference":"synthetic-submission-1"}');
select recoveryos.act_housing_follow_through(100,4,'link_source','{"source":"contact_connect_submission","reference":"synthetic-submission-2"}');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,5,'link_source','{"source":"contact_connect_submission","reference":"synthetic-submission-2"}')$q$, 'source_already_linked');
select recoveryos.act_housing_follow_through(100,5,'next_action','{"text":"Clarify ambiguous timing and verify housing evidence","due_at":"2026-10-25T12:00:00Z"}');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,6,'close','{"evidence":"Converted"}')$q$, 'unresolved_housing_commitments');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,6,'next_action','{"text":"Overwrite","due_at":"2026-10-25T12:00:00Z"}')$q$, 'complete_existing_commitment_first');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,6,'propose_cover','{"person_id":"3"}')$q$, 'eligible_residence_cover_required');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,6,'propose_cover','{"person_id":"5"}')$q$, 'eligible_residence_cover_required');
select recoveryos.act_housing_follow_through(100,6,'propose_cover','{"person_id":"2"}');
select public.assert_true((select owner_person_id = 1 from recoveryos.housing_follow_through where intake_id=100), 'proposal does not transfer');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,7,'accept_cover')$q$, 'acceptance_required');
set test.actor='3';
select public.assert_true((select count(*)=0 from recoveryos.housing_follow_through), 'unauthorized residence read denied');
select public.assert_true((select count(*)=0 from recoveryos.housing_follow_through_events), 'unauthorized history read denied');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,7,'accept_cover')$q$, 'not_authorized');
set test.actor='2';
select recoveryos.act_housing_follow_through(100,7,'accept_cover');
select public.assert_true((select owner_person_id=2 and proposed_cover_person_id is null and next_action is not null from recoveryos.housing_follow_through where intake_id=100), 'acceptance transfers only housing responsibility and retains commitment');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,7,'complete_action','{"evidence":"Done"}')$q$, 'stale_version');
reset role;
update recoveryos.residence_application_intake set status='converted', converted_person_id=5, converted_application_id=500 where id=100;
set role authenticated;
select public.assert_true((select next_action is not null from recoveryos.housing_follow_through where intake_id=100), 'conversion retains unresolved commitment');
select public.assert_true((select count(*)=1 from recoveryos.housing_follow_through_events where action='contact' and detail->'input'->>'kind'='connected'), 'conversion retains completed contact');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,8,'verify_bed','{"state":"occupied"}')$q$, 'bed_evidence_required');
select recoveryos.act_housing_follow_through(100,8,'verify_bed','{"state":"available","reference":"synthetic-bed-a","evidence":"Staff observation","verified_at":"2026-01-01T12:00:00Z"}');
select public.assert_true((select bed_state='available' from recoveryos.housing_follow_through where intake_id=100), 'availability never implies occupied');
select recoveryos.act_housing_follow_through(100,9,'complete_action','{"evidence":"Synthetic documented clarification"}');
select recoveryos.act_housing_follow_through(100,10,'close','{"evidence":"No housing commitments remain"}');
select public.assert_true((select count(*)=11 from recoveryos.housing_follow_through_events where intake_id=100), 'append-only audit retained');
select public.expect_failure($q$update recoveryos.housing_follow_through set owner_person_id=1 where intake_id=100$q$, 'permission denied');
select public.expect_failure($q$delete from recoveryos.housing_follow_through_events$q$, 'permission denied');
select public.expect_failure($q$select recoveryos.act_housing_follow_through(200,0,'claim')$q$, 'not_authorized');
reset role;
set role anon;
select public.expect_failure($q$select recoveryos.act_housing_follow_through(100,11,'reopen')$q$, 'permission denied');
select public.expect_failure($q$select * from recoveryos.housing_follow_through$q$, 'permission denied');
reset role;
select 'PASS: synthetic housing contract tests' as result;
