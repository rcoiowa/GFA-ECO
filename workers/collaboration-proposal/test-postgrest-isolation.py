"""Synthetic local-only HTTP credential isolation proof. No production URL accepted.
Run after full schema replay and token-role-schema.sql in a throwaway DB.
"""
import base64, hashlib, hmac, json, os, re, secrets, subprocess, sys, tempfile, time, urllib.request, urllib.error
container, db = sys.argv[1:]
assert re.fullmatch(r'recoveryos-[a-z0-9-]+', container) and re.fullmatch(r'housing_[a-z0-9_]+', db)
def sql(text):
    return subprocess.check_output(['docker','exec','-i',container,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At'],input=text,text=True).strip()
# These login/membership changes are local test infrastructure, NOT proposal grants.
sql("""alter role authenticator login; grant recoveryos_bridge_client to authenticator;
create or replace function public.bridge_isolation_probe() returns text language sql as $$select current_user::text$$;
revoke all on function public.bridge_isolation_probe() from public;
grant execute on function public.bridge_isolation_probe() to recoveryos_bridge_client;
""")
assert sql("select pg_has_role('recoveryos_bridge_client','authenticated','member')")=='f'
assert sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='recoveryos' and c.relkind in ('r','v') and has_table_privilege('recoveryos_bridge_client',c.oid,'SELECT,INSERT,UPDATE,DELETE')")=='0'
assert sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='recoveryos' and p.prorettype <> 'trigger'::regtype and has_function_privilege('recoveryos_bridge_client',p.oid,'EXECUTE')")=='0'
event={'claims':{'client_id':'00000000-0000-0000-0000-000000000009','role':'authenticated','aud':'authenticated','sub':'00000000-0000-0000-0000-000000000004','session_id':'00000000-0000-0000-0000-000000000008','scope':'openid','iat':int(time.time()),'exp':int(time.time())+600}}
claims=json.loads(sql("select recoveryos_bridge_private.restrict_access_token('"+json.dumps(event)+"'::jsonb)"))['claims']
assert claims['role']=='recoveryos_bridge_client' and claims['aud']=='https://bridge.synthetic.example/mcp'
secret=secrets.token_urlsafe(48)
def token(payload):
    enc=lambda v:base64.urlsafe_b64encode(json.dumps(v,separators=(',',':')).encode()).rstrip(b'=').decode()
    body=enc({'alg':'HS256','typ':'JWT'})+'.'+enc(payload)
    return body+'.'+base64.urlsafe_b64encode(hmac.new(secret.encode(),body.encode(),hashlib.sha256).digest()).rstrip(b'=').decode()
name='recoveryos-postgrest-isolation'
with tempfile.NamedTemporaryFile(mode='w',prefix='recoveryos-pgrst-') as env:
    os.chmod(env.name,0o600)
    env.write(f'PGRST_DB_URI=postgres://authenticator@127.0.0.1:5432/{db}\nPGRST_DB_CONFIG=false\nPGRST_DB_SCHEMAS=public,recoveryos\nPGRST_JWT_SECRET={secret}\nPGRST_SERVER_PORT=19001\nPGRST_DB_ANON_ROLE=anon\n');env.flush()
    subprocess.run(['docker','run','-d','--rm','--name',name,'--network','container:'+container,'--env-file',env.name,'postgrest/postgrest@sha256:d155c6718ed9a9f990d159a2ab7c0a3f16944dbb6d0a0344557421042acfe0df'],capture_output=True,check=True)
    ip=subprocess.check_output(['docker','inspect','-f','{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}',container],text=True).strip()
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    def call(path,profile='public',payload=claims,body=None):
        request=urllib.request.Request('http://'+ip+':19001/'+path,headers={'Authorization':'Bearer '+token(payload),'Accept-Profile':profile,'Content-Profile':profile,'Content-Type':'application/json'},data=None if body is None else json.dumps(body).encode())
        try:
            with opener.open(request,timeout=2) as response:return response.status,response.read().decode()
        except urllib.error.HTTPError as error:return error.code,error.read().decode()
    try:
        for attempt in range(30):
            try:
                status,body=call('rpc/bridge_isolation_probe')
                if status!=503:break
                time.sleep(.2)
            except urllib.error.URLError:time.sleep(.2)
        if status==503: print(subprocess.check_output(['docker','logs',name],text=True))
        assert status==200 and json.loads(body)=='recoveryos_bridge_client',(status,body)
        print('PASS restricted role authenticated through real PostgREST; no audience setting required')
        for path,profile in [('people?limit=1','recoveryos'),('rpc/read_admin_collaboration_workspace?p_residence_id=10','recoveryos'),('rpc/act_housing_follow_through','recoveryos'),('housing_applications?limit=1','public')]:
            status,_=call(path,profile)
            assert status in (401,403,404,406),(path,status)
            print('PASS ordinary API denied:',path,status)
        for path,body in [('rpc/act_housing_follow_through',{'p_intake_id':1,'p_version':0,'p_action':'close','p_detail':{}}),('rpc/save_admin_collaboration_workspace',{'p_residence_id':10,'p_version':0,'p_document':{}})]:
            status,_=call(path,'recoveryos',body=body)
            assert status==403,(path,status)
            print('PASS ordinary mutation denied:',path,status)
        # Even replacing resource audience cannot add ordinary API access to this role.
        status,_=call('people?limit=1','recoveryos',{**claims,'aud':'authenticated'})
        assert status in (401,403,404,406)
        print('PASS isolation independent of audience')
    finally:
        subprocess.run(['docker','stop',name],capture_output=True)
        sql('drop function public.bridge_isolation_probe()')
