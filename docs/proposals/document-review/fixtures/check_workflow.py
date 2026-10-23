import subprocess,json,concurrent.futures,time
C=globals()['CONTAINER']; D='postgres'; count=0

def sql(s,pid=None,fail=None,db=None):
 if pid is not None:s=f"BEGIN; SET LOCAL ROLE authenticated; SET LOCAL test.uid='00000000-0000-0000-0000-{pid:012d}';\n"+s+';COMMIT;'
 r=subprocess.run(['docker','exec','-i',C,'psql','-X','-qAt','-U','postgres','-d',db or D,'-v','ON_ERROR_STOP=1'],input=s,text=True,capture_output=True)
 if fail:
  assert r.returncode and fail in r.stderr,(s,r.stdout,r.stderr);return
 assert r.returncode==0,(s,r.stdout,r.stderr)
 return r.stdout.strip()
def check(label,condition):
 global count
 assert condition,label
 count+=1;print('PASS',count,label,flush=True)
def rpc(fn,args='',pid=90001):return json.loads(sql(f'select recoveryos.{fn}({args})',pid))
def code(label,fn,args,expected,pid=90001):
 r=rpc(fn,args,pid);check(label,r.get('code')==expected);return r
T=json.dumps(dict.fromkeys(['provided','received','read_or_explained','understood','questions'],True))
original=sql('select jsonb_agg(to_jsonb(a) order by id) from recoveryos.document_assignments a where id in(90001,90002)')
for p in [90001,90002,90003,90007,90008]:sql('select count(*) from recoveryos.ensure_my_document_assignments()',p)
check('approved applicant assignments issued without optional document',sql('select count(*) from recoveryos.document_assignments where person_id=90001')=='4')
check('unapproved applicant receives no assignments',sql('select count(*) from recoveryos.document_assignments where person_id=90007')=='0')
check('resident A gets only A templates',sql('select count(*) from recoveryos.document_assignments where person_id=90002')=='3')
check('resident B gets only B templates',sql('select count(*) from recoveryos.document_assignments where person_id=90003')=='1')
def aid(pid,v):return int(sql(f'select id from recoveryos.document_assignments where person_id={pid} and document_version_id={v}'))
a=aid(90001,90002);ack=aid(90001,90003);b=aid(90002,90002);ba=aid(90002,90003);other=aid(90003,90006)
def complete(aid,pid=90001,checks=T,name='Synthetic Full Name',vid=None,h=None,paper=False,witness=True):
 v,h0=sql(f'select document_version_id,content_hash from recoveryos.document_assignments a join recoveryos.document_versions v on v.id=a.document_version_id where a.id={aid}').split('|')
 args=f"{aid},{vid or v},'{h or h0}','{checks}'::jsonb,"+("null" if name is None else "'"+name+"'")
 if paper:args+=','+str(witness).lower()
 return rpc('record_document_paper_review' if paper else 'complete_document_review',args,pid)
check('cross-person state denied',rpc('document_workflow_state',str(a),90002)['code']=='not_authorized')
check('cross-person completion denied',complete(a,90002)['code']=='not_authorized')
check('cross-residence staff paper denied',complete(a,90005,paper=True)['code']=='not_authorized')
check('cross-residence staff queue denied',rpc('list_staff_document_reviews','90001,null',90005)['code']=='not_authorized')
check('cross-residence staff preparation denied',rpc('prepare_application_document_review','90001',90005)['code']=='not_authorized')
check('authorized staff queue available',rpc('list_staff_document_reviews','90001,null',90004)['ok'])
check('staff unrelated application filter denied',rpc('list_staff_document_reviews','90001,90003',90004)['code']=='not_authorized')
check('table RLS hides other-person assignments',sql(f'select count(*) from recoveryos.document_assignments where id={a}',90002)=='0')
sql(f'update recoveryos.document_assignments set acknowledged_at=now() where id={a}',90001,fail='permission denied')
check('self direct UPDATE bypass denied',True)
sql(f'insert into recoveryos.document_assignments(document_version_id,person_id) values(90002,90001)',90001,fail='permission denied')
check('self direct INSERT bypass denied',True)
sql('select count(*) from recoveryos.document_review_receipts',90001,fail='permission denied')
check('direct receipt table access denied',True)
sql("set role anon;select recoveryos.complete_document_review(1,1,'a','{}',null)",fail='permission denied')
check('anonymous completion denied',True)
sql("select recoveryos._complete_document_review(1,1,'x','{}',null,false,false)",90001,fail='permission denied')
check('internal completion helper inaccessible',True)
code('legacy acknowledge refuses unattested completion','acknowledge_document',f"{a},'Synthetic Full Name'",'attestations_required')
code('legacy paper refuses unattested completion','record_paper_signature',"90001,'synthetic_signature','Synthetic Full Name'",'attestations_required',90004)
for key in json.loads(T):
 c=json.loads(T);c[key]=False
 check('false statement rejected: '+key,complete(a,checks=json.dumps(c))['code']=='attestations_required')
for label,value in [('missing','{}'),('null','null'),('string','"yes"'),('extra',T[:-1]+',"extra":true}')]:
 check(label+' attestation JSON rejected',complete(a,checks=value)['code']=='attestations_required')
check('wrong expected version refused',complete(a,vid=90001)['code']=='document_changed')
check('wrong expected hash refused',complete(a,h='deadbeef')['code']=='document_changed')
check('signature missing refused',complete(a,name=None)['code']=='signature_name_required')
check('electronic consent required only signature',complete(a)['code']=='electronic_consent_required')
check('ack-only rejects supplied signature',complete(ack)['code']=='signature_not_required')
code('explanation request saved','request_document_explanation',f"{ack},'Explain this synthetic policy'",'requested')
code('duplicate explanation request idempotent','request_document_explanation',f"{ack},'Again'",'already_requested')
check('pending explanation prevents completion',complete(ack,name=None)['code']=='explanation_pending')
code('cross-person explanation resolve denied','confirm_document_explanation',f'{ack},true','not_authorized',90002)
code('explicit explanation confirmation required','confirm_document_explanation',f'{ack},false','confirmation_required')
code('participant confirms explanation','confirm_document_explanation',f'{ack},true','confirmed')
r=complete(ack,name=None)
check('ack-only completes without signature or electronic consent',r['ok'] and r['receipt']['method']=='acknowledgment' and r['receipt']['signature_name'] is None and r['receipt']['electronic_consent_grant_id'] is None)
check('five exact statements recorded with actor and server timestamp',len(r['receipt']['statements'])==5 and r['receipt']['actor_person_id']==90001 and r['receipt']['recorded_at'])
check('ack-only signed_at remains null',sql(f'select signed_at is null from recoveryos.document_assignments where id={ack}')=='t')
check('ack retry returns same receipt',complete(ack,name=None)['receipt']==r['receipt'])
check('one receipt and audit after retry',sql(f"select (select count(*) from recoveryos.document_review_receipts where assignment_id={ack}), (select count(*) from recoveryos.audit_log where entity_table='document_assignments' and entity_id={ack} and action='document_acknowledged')")=='1|1')
sql(f"update recoveryos.document_review_receipts set method='paper' where assignment_id={ack}",fail='immutable evidence')
check('receipt immutable even to ordinary owner UPDATE',True)
sql(f'delete from recoveryos.document_assignments where id={ack}',fail='immutable evidence')
check('completed assignment deletion blocked',True)
check('paper witness required',complete(a,90004,paper=True,witness=False)['code']=='witness_required')
r=complete(a,90004,paper=True)
check('authorized paper signature no electronic consent',r['ok'] and r['receipt']['method']=='paper' and r['receipt']['actor_person_id']==90004 and r['receipt']['person_id']==90001 and r['receipt']['electronic_consent_grant_id'] is None)
r=complete(b,90002)
check('electronic signature with current consent',r['ok'] and r['receipt']['method']=='electronic' and r['receipt']['electronic_consent_grant_id'] is not None)
check('historical assignments preserved exactly',sql('select jsonb_agg(to_jsonb(a) order by id) from recoveryos.document_assignments a where id in(90001,90002)')==original)
legacy=rpc('document_workflow_state','90002')
check('legacy record reports no invented statements or actor',legacy['receipt']['legacy_record'] and legacy['receipt']['statements']==[] and legacy['receipt']['actor_person_id'] is None)
ready=rpc('application_intake_readiness','90001')
items={x['key']:x for x in ready['items']}
check('readiness identifies attested current edition',items['sign:synthetic_signature']['met'] and items['sign:synthetic_signature']['historical_completed'] and items['sign:synthetic_signature']['document_version_id']==90002)
check('current legacy completion remains met and labeled',items['sign:synthetic_legacy']['met'] and items['sign:synthetic_legacy']['completion_evidence']=='legacy_recorded')
check('optional permissions are not bundled into document readiness',not any(x['key'].endswith('synthetic_optional') for x in ready['items']))
# Before any completion on person8, provoke an audit error AFTER receipt/assignment writes.
c=aid(90008,90003)
sql("create function public.synthetic_audit_failure() returns trigger language plpgsql as $$begin if new.action='document_acknowledged' then raise exception 'synthetic late audit failure';end if;return new;end$$;create trigger synthetic_audit_failure before insert on recoveryos.audit_log for each row execute function public.synthetic_audit_failure();")
try:
 try:complete(c,90008,name=None);raise AssertionError('fault should fail')
 except AssertionError as e:assert 'synthetic late audit failure' in str(e)
finally:sql('drop trigger synthetic_audit_failure on recoveryos.audit_log;drop function public.synthetic_audit_failure()')
check('late audit failure rolls back receipt and completion',sql(f'select (select count(*) from recoveryos.document_review_receipts where assignment_id={c}),(select acknowledged_at is null from recoveryos.document_assignments where id={c})')=='0|t')
# Simultaneous retries serialize on assignment and retain one immutable receipt/audit.
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rs=list(pool.map(lambda _:complete(c,90008,name=None),range(2)))
check('concurrent completion retries have one result',all(r['ok'] for r in rs) and rs[0]['receipt']==rs[1]['receipt'])
# New edition: previous signatures remain history and readiness becomes current pending.
sql("insert into recoveryos.document_versions(id,template_id,version,body_markdown,published_at) overriding system value values(90007,90001,'3','# Synthetic next edition','2026-03-01')")
ready=rpc('application_intake_readiness','90001');x=next(x for x in ready['items'] if x['key']=='sign:synthetic_signature')
check('new edition cannot be satisfied by old signature',not x['met'] and x['historical_completed'] and x['document_version_id']==90007)
oldpending=aid(90008,90002)
check('superseded pending assignment cannot complete',complete(oldpending,90004,paper=True)['code']=='not_pending_current')
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(lambda _:sql('select count(*) from recoveryos.ensure_my_document_assignments()',90008),range(2)))
check('concurrent assignment issuance no new duplicates',sql('select count(*) from recoveryos.document_assignments where person_id=90008 and document_version_id=90007')=='1')
# service-level direct completion without receipt is also rejected.
fresh=aid(90008,90007)
sql(f'update recoveryos.document_assignments set acknowledged_at=now() where id={fresh}',fail='matching immutable review receipt')
check('privileged direct completion still requires receipt',True)
# Staff confirmation does not itself sign or acknowledge.
code('staff-side question request fixture','request_document_explanation',f"{fresh},'Paper explanation'",'requested',90008)
code('wrong residence cannot resolve explanation','confirm_document_explanation',f'{fresh},true','not_authorized',90005)
code('right staff records explicit participant confirmation','confirm_document_explanation',f'{fresh},true','confirmed',90004)
check('explanation resolution never completes document',sql(f'select acknowledged_at is null from recoveryos.document_assignments where id={fresh}')=='t')
check('platform administrator existing paper authority retained',complete(other,90006,paper=True)['ok'])
# Revoked/expired consent on new pending signature: server always rechecks it.
sql('select count(*) from recoveryos.ensure_my_document_assignments()',90002);newb=aid(90002,90007)
sql("update recoveryos.consent_grants set revoked_at=now() where person_id=90002")
check('revoked electronic consent rejected',complete(newb,90002)['code']=='electronic_consent_required')
sql("update recoveryos.consent_grants set revoked_at=null,expires_at=now()-interval '1 minute' where person_id=90002")
check('expired electronic consent rejected',complete(newb,90002)['code']=='electronic_consent_required')
# Completion lock behavior: publication locks allow ordinary reads but prevent signing until released.
locker=subprocess.Popen(['docker','exec','-i',C,'psql','-X','-qAt','-U','postgres','-d',D],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
locker.stdin.write("begin;lock table recoveryos.document_templates in share mode;lock table recoveryos.document_versions in share row exclusive mode;select 'locked';\n");locker.stdin.flush();assert locker.stdout.readline().strip()=='locked'
check('ordinary document SELECT possible under publication lock',sql('select count(*) from recoveryos.document_versions') is not None)
try:
 try:complete(fresh,90004,paper=True);raise AssertionError('lock should time out')
 except AssertionError as e:assert 'lock timeout' in str(e)
finally:locker.communicate('rollback;\n',timeout=10)
check('lock timeout leaves completion untouched',sql(f'select acknowledged_at is null from recoveryos.document_assignments where id={fresh}')=='t')
# Malformed cross-house anchors cannot be completed by self or staff.
sql("insert into recoveryos.document_assignments(document_version_id,person_id,application_id) values(90006,90001,90001)")
bad=aid(90001,90006)
check('mismatched residence assignment cannot complete',complete(bad)['code']=='not_pending_current')
check('mismatched residence assignment denies staff',complete(bad,90004,paper=True)['code']=='not_authorized')
# Security-definer search paths prefer the real schema over attacker-created temp tables.
shadow=json.loads(sql(f"create temp table document_assignments(id bigint,person_id bigint);insert into document_assignments values({a},90002);select recoveryos.document_workflow_state({a})",90002))
check('temporary table shadow cannot change ownership',shadow['code']=='not_authorized')
# A common organization template still needs a new assignment after moving houses.
sql("insert into recoveryos.residences(id,organization_id,name) overriding system value values(90003,90001,'Synthetic House C');insert into recoveryos.document_templates(id,organization_id,residence_id,key,name,requires_signature,requires_acknowledgment,is_active) overriding system value values(90006,90001,null,'synthetic_shared','Synthetic common policy',false,true,true);insert into recoveryos.document_versions(id,template_id,version,body_markdown,published_at) overriding system value values(90008,90006,'1','# Synthetic common policy','2026-03-01');")
sql('select count(*) from recoveryos.ensure_my_document_assignments()',90008)
shared=aid(90008,90008)
check('shared template first residence completion',complete(shared,90008,name=None)['ok'])
sql("insert into recoveryos.residence_applications(id,person_id,residence_id,status,submitted_at) overriding system value values(90009,90008,90003,'approved',now()+interval '1 minute');update recoveryos.residence_applications set status='withdrawn' where id=90008")
sql('select count(*) from recoveryos.ensure_my_document_assignments()',90008)
check('move to another house receives separate applicable shared assignment',sql('select count(*) from recoveryos.document_assignments where person_id=90008 and document_version_id=90008')=='2')
ready=rpc('application_intake_readiness','90009',90008)
x=next(x for x in ready['items'] if x['key']=='ack:synthetic_shared')
check('another residence completion does not satisfy current readiness',not x['met'])
print('TOTAL',count)
