"""Synthetic-only test: run after both contract suites in a disposable container/database."""
import concurrent.futures
import subprocess
import sys
container, database = sys.argv[1:]
def sql(statement):
    return subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-At'],input=statement,text=True,capture_output=True)
def must(statement):
    result=sql(statement)
    if result.returncode: raise RuntimeError(result.stderr)
    return result.stdout
must("insert into recoveryos.residence_application_intake(id,residence_id,status) values(300,10,'received'),(400,10,'received'); set role authenticated; set test.uid='00000000-0000-0000-0000-000000000001'; set test.actor='1'; select recoveryos.act_housing_follow_through(300,0,'claim'); select recoveryos.act_housing_follow_through(300,1,'propose_cover','{\"person_id\":\"2\"}'); select recoveryos.act_housing_follow_through(400,0,'claim');")
accept="set role authenticated; set test.uid='00000000-0000-0000-0000-000000000002'; set test.actor='2'; select recoveryos.act_housing_follow_through(300,2,'accept_cover');"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(sql,[accept,accept]))
assert sorted(r.returncode==0 for r in results)==[False,True], 'exactly one accepted handoff'
assert any('stale_version' in r.stderr for r in results), 'losing writer must get stale_version'
must("select public.assert_true((select owner_person_id=2 and version=3 from recoveryos.housing_follow_through where intake_id=300),'single transferred owner'); select public.assert_true((select count(*)=1 from recoveryos.housing_follow_through_events where intake_id=300 and action='accept_cover'),'one acceptance event'); set role authenticated; set test.uid='00000000-0000-0000-0000-000000000001'; set test.actor='1'; select public.expect_failure($q$select recoveryos.act_housing_follow_through(400,1,'link_source','{\"source\":\"contact_connect_submission\",\"reference\":\"synthetic-submission-2\"}')$q$,'source_already_linked');")
save="set role authenticated; set test.uid='00000000-0000-0000-0000-000000000004'; set test.actor='4'; select recoveryos.save_admin_collaboration_workspace(10,2,'{\"brief\":\"Concurrent synthetic revision\",\"notes\":\"\",\"intakeId\":100,\"batches\":[]}');"
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(sql,[save,save]))
assert sum('"ok": true' in r.stdout for r in results)==1
assert sum('stale_version' in r.stdout for r in results)==1
print('PASS: concurrent handoff acceptance, global source deduplication, concurrent draft saves')
