-- Synthetic isolated schema only; data timestamps are changed solely to exercise cutoff behavior.
insert into recoveryos.housing_follow_through(intake_id,closed_at) values(200,now()-interval '366 days');
insert into recoveryos.housing_follow_through_events(intake_id,actor_person_id,action,detail) values(200,4,'close','{"evidence":"Synthetic old closed package"}');
insert into recoveryos.housing_source_references values('other','synthetic-retention-reference',200);
update recoveryos.admin_collaboration_workspaces set saved_at=now()-interval '91 days';
update recoveryos.admin_collaboration_revisions set saved_at=now()-interval '91 days';
select public.assert_true((recoveryos.purge_housing_collaboration_retention()->>'housing_packages')::integer=1,'only expired closed package purged');
select public.assert_true(exists(select 1 from recoveryos.housing_follow_through where intake_id=100 and next_action is not null),'open housing commitment retained');
select public.assert_true(exists(select 1 from recoveryos.residence_application_intake where id=200),'canonical intake retained');
select public.assert_true(not exists(select 1 from recoveryos.housing_source_references where intake_id=200),'closed source-reference package purged');
select public.assert_true(not exists(select 1 from recoveryos.admin_collaboration_workspaces),'expired inactive workspace purged');
set role authenticated;
select public.expect_failure('select recoveryos.purge_housing_collaboration_retention()','permission denied');
reset role;
