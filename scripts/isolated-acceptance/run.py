"""Disposable GitHub-runner acceptance. Never accepts remote targets or secrets.
Infrastructure setup is separate from historical application-schema replay.
"""
from pathlib import Path
import os, subprocess, tempfile, json, urllib.request, urllib.error, time, re
ROOT = Path(__file__).resolve().parents[2]
def run(args, **kw):
    return subprocess.run(args, check=True, text=True, **kw)
def out(args): return run(args, capture_output=True).stdout.strip()
assert os.environ.get('GITHUB_ACTIONS') == 'true', 'Hosted Actions fixture scope required'
assert os.environ.get('RUNNER_ENVIRONMENT') == 'github-hosted', 'No self-hosted runner'
assert out(['git','rev-parse','HEAD']) == os.environ['ACCEPTANCE_SHA'], 'SHA mismatch'
for key in ['SUPABASE_ACCESS_TOKEN','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','CLOUDFLARE_API_TOKEN','SMTP_HOST']:
    assert not os.environ.get(key), 'Refusing inherited production configuration: '+key
assert out(['docker','context','inspect','--format','{{.Endpoints.docker.Host}}']).startswith('unix://')
work=Path(tempfile.mkdtemp(prefix='gfa-acceptance-',dir=os.environ['RUNNER_TEMP']))
network='gfa-isolated-'+os.environ['GITHUB_RUN_ID']
project='gfa-acceptance'
def cli(*args, **kw): return run(['supabase','--workdir',str(work),*args], **kw)
def sql(value):
    return run(['docker','exec','-i','supabase_db_'+project,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At'],input=value,capture_output=True).stdout.strip()
try:
    cli('init',stdout=subprocess.DEVNULL)
    (work/'supabase/config.toml').write_text('''project_id = "gfa-acceptance"
[api]
enabled = true
port = 54321
schemas = ["public", "recoveryos"]
extra_search_path = ["public", "extensions"]
[db]
port = 54322
shadow_port = 54320
major_version = 17
[db.seed]
enabled = false
[auth]
enabled = true
site_url = "http://127.0.0.1:5178"
additional_redirect_urls = ["http://127.0.0.1:5178/**"]
enable_signup = true
[auth.email]
enable_signup = true
enable_confirmations = true
max_frequency = "1s"
[auth.rate_limit]
email_sent = 100
''')
    run(['docker','network','create','--internal','--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',network],stdout=subprocess.DEVNULL)
    with (work/'startup.log').open('w') as log:
        try: cli('start','--network-id',network,'--exclude','realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor',stdout=log,stderr=log)
        except subprocess.CalledProcessError:
            # CLI status/start can contain local keys: show no raw logs.
            print('FAIL official local stack startup; no fixtures executed',flush=True)
            raise
    net=json.loads(out(['docker','network','inspect',network]))[0]
    assert net['Internal'], 'Network must be internal'
    ids=out(['docker','ps','-q','--filter','label=com.supabase.cli.project='+project]).split()
    assert ids, 'No isolated containers'
    for cid in ids:
        c=json.loads(out(['docker','inspect',cid]))[0]
        assert set(c['NetworkSettings']['Networks']) == {network}, 'Unexpected network'
        for bindings in c['NetworkSettings']['Ports'].values():
            for b in bindings or []: assert b['HostIp']=='127.0.0.1', 'Nonloopback port'
        for e in c['Config']['Env']:
            if e.startswith('GOTRUE_SMTP_HOST='): assert 'mailpit' in e or 'inbucket' in e
            assert 'cqcxvwoukyhxyokfwnjm' not in e, 'Production target'
            assert not re.match(r'GOTRUE_HOOK_.*_ENABLED=true',e), 'Outbound hook'
    print('PASS exact SHA, internal network, loopback ports, local captured SMTP, no production config',flush=True)
    # CLI creates REAL auth schema/roles. Never run the stand-alone auth stub.
    sql('create table public.housing_applications(id bigint primary key); alter table public.housing_applications enable row level security; revoke all on public.housing_applications from public,anon,authenticated,service_role;')
    for p in sorted((ROOT/'supabase/launch/migrations').glob('*.sql')):
        if p.name.startswith(('0104_','0146_')):continue
        if p.name.startswith('20261005071446'):
            for q in sorted((ROOT/'supabase/launch/prepared').glob('014*.prepared.sql')):sql(q.read_text())
        sql(p.read_text())
    sql((ROOT/'docs/readiness/essential-release/housing-fixture.sql').read_text())
    sql("notify pgrst, 'reload schema';")
    print('PASS application replay on real Supabase infrastructure',flush=True)
    status=json.loads(cli('status','-o','json',capture_output=True).stdout)
    # Never print status: it contains ephemeral local keys.
    api=status['API_URL']; assert api in ['http://127.0.0.1:54321','http://localhost:54321']
    key=status['ANON_KEY']
    def http(path,data=None,token=None,method=None):
        headers={'apikey':key,'Content-Type':'application/json'}
        if token:headers['Authorization']='Bearer '+token
        req=urllib.request.Request(api+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
        try:
            with urllib.request.urlopen(req,timeout=20) as r:return r.status,json.load(r)
        except urllib.error.HTTPError as e:return e.code,json.load(e)
    email='applicant@example.invalid';password='Synthetic-only-acceptance-82!'
    code,user=http('/auth/v1/signup',{'email':email,'password':password})
    assert code==200 and user.get('id'), 'Signup failed'
    assert http('/auth/v1/token?grant_type=password',{'email':email,'password':password})[0]==400, 'Unconfirmed account must not sign in'
    # Read ONLY local captured mail via real Mailpit API.
    mail='http://127.0.0.1:54324'
    def inbox(path):
        with urllib.request.urlopen(mail+path,timeout=10) as r:return json.load(r)
    def confirm_mail():
        for _ in range(20):
            rows=inbox('/api/v1/messages').get('messages',[])
            if rows:break
            time.sleep(.5)
        assert rows, 'Captured email absent'
        message=inbox('/api/v1/message/'+rows[0]['ID'])
        body=message.get('HTML','')+message.get('Text','')
        import html
        links=re.findall(r'https?://[^\s<>"\']+',html.unescape(body))
        link=next(x for x in links if '/auth/v1/verify?' in x)
        from urllib.parse import urlsplit,parse_qs
        u=urlsplit(link); assert u.hostname in ['127.0.0.1','localhost'] and u.port==54321
        q=parse_qs(u.query)
        return http('/auth/v1/verify',{'token_hash':q['token'][0],'type':q['type'][0]})
    code,session=confirm_mail();assert code==200 and session.get('access_token'), 'Email confirmation failed'
    assert http('/auth/v1/token?grant_type=password',{'email':email,'password':password})[0]==200
    assert http('/auth/v1/recover',{'email':email})[0]==200
    time.sleep(1)
    code,recovery=confirm_mail();assert code==200 and recovery.get('access_token'),'Recovery confirmation failed'
    assert http('/auth/v1/user',{'password':password+'2'},recovery['access_token'],'PUT')[0]==200
    assert http('/auth/v1/token?grant_type=password',{'email':email,'password':password})[0]==400
    assert http('/auth/v1/token?grant_type=password',{'email':email,'password':password+'2'})[0]==200
    print('PASS real signup, captured confirmation, sign-in, captured recovery and password replacement',flush=True)
    # Fail closed until all remaining real browser/API acceptance cases exist.
    raise RuntimeError('ACCEPTANCE INCOMPLETE: real browser destinations, intake receiver, staff and linked-account HTTP cases pending')
finally:
    try: cli('stop','--no-backup',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    finally: subprocess.run(['docker','network','rm',network],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
