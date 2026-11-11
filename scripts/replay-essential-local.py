"""Synthetic, isolated application-schema replay. Never accepts a database URL.
Requires a locally available postgres:17 image; creates/destroys only its own container.
Run: python scripts/replay-essential-local.py
Not a Supabase infrastructure or production-parity test. No live seeds/captures.
"""
from pathlib import Path
import subprocess, time, uuid, os
ROOT = Path(__file__).resolve().parents[1]
def cmd(args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)
# Fail closed even if a caller has selected a remote Docker context.
endpoint = os.environ.get('DOCKER_HOST') or cmd(['docker','context','inspect','--format','{{.Endpoints.docker.Host}}'],capture_output=True).stdout.strip()
if not endpoint.startswith('unix://'):
    raise SystemExit('Refusing non-local Docker endpoint: only a Unix socket is supported')
IMAGE = 'postgres@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
cmd(['docker','image','inspect',IMAGE], stdout=subprocess.DEVNULL)
cmd(['node',str(ROOT/'scripts/check-table-access.mjs')],cwd=ROOT)
name = 'gfa-replay-' + uuid.uuid4().hex[:12]
container = cmd(['docker','run','-d','--rm','--network','none','--tmpfs','/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust','--name',name,IMAGE],capture_output=True).stdout.strip()
def sql(text, label):
    result = subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1'],input=text,text=True,capture_output=True)
    if result.returncode: raise RuntimeError(label + '\n' + result.stderr[-4000:])
    print('PASS', label, flush=True)
try:
    for attempt in range(60):
        if subprocess.run(['docker','exec',container,'pg_isready','-U','postgres'],capture_output=True).returncode == 0: break
        time.sleep(.5)
    else: raise RuntimeError('Local Postgres did not become ready')
    sql('''
create role anon; create role authenticated; create role service_role; create role authenticator;
create schema auth;
create table auth.users(id uuid primary key,email text,deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
grant usage on schema auth to authenticated,anon;
create schema storage; create table storage.buckets(id text primary key,public boolean);
create schema extensions; create extension pgcrypto with schema extensions;
-- Explicit inaccessible placeholder for historical 0138; no captured policies/grants/data.
create table public.housing_applications(id bigint primary key);
alter table public.housing_applications enable row level security;
revoke all on public.housing_applications from public,anon,authenticated,service_role;
''','synthetic infrastructure and historical containment placeholder')
    for p in sorted((ROOT/'supabase/launch/migrations').glob('*.sql')):
        if p.name.startswith(('0104_','0146_')):
            print('EXCLUDED scheduler/content activation:',p.name,flush=True); continue
        if p.name.startswith('20261005071446'):
            for prepared in sorted((ROOT/'supabase/launch/prepared').glob('014*.prepared.sql')):
                sql(prepared.read_text(),prepared.name)
        sql(p.read_text(),p.name)
    sql('''do $$ begin
      if exists(select 1 from information_schema.role_table_grants where table_schema='public' and table_name='housing_applications' and grantee in ('anon','authenticated','service_role') and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')) then
        raise exception 'Deprecated housing access restored'; end if;
      if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='housing_applications' and c.relrowsecurity) then raise exception 'Historical fixture lacks RLS'; end if;
    end $$;''','deprecated housing denial assertions')
    sql((ROOT/'docs/readiness/2026-10-30/default-privileges.test.sql').read_text(),'new-table defaults, existing grant preservation, two-identity RLS and denied INSERT')
    for fixture in ['housing-fixture.sql','housing-contract.sql']:
        sql((ROOT/'docs/readiness/essential-release'/fixture).read_text(),fixture)
    print('PASS essential housing contracts; no Admin/bridge installed')
    print('PASS application-schema replay; excluded infrastructure/content and proposal activation remain separate gates')
finally:
    cmd(['docker','rm','-f',container],stdout=subprocess.DEVNULL)
