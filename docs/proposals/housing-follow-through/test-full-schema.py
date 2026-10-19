"""Isolated application-schema replay; never accepts a URL or production target.
Usage: python test-full-schema.py EXISTING_LOCAL_DOCKER_CONTAINER NEW_DATABASE
Infrastructure differences: synthetic auth.users/auth.uid, empty storage bucket
catalog, no pg_cron scheduler (0104), no document content activation (0146).
These are explicit exclusions, not proof of complete production parity.
"""
from pathlib import Path
import re, subprocess, sys
root = Path(__file__).resolve().parents[3]
container, database = sys.argv[1:]
if not re.fullmatch(r'recoveryos-[a-z0-9-]+', container) or not re.fullmatch(r'housing_[a-z0-9_]+', database):
    raise SystemExit('Only explicitly named local review containers/databases are allowed')
subprocess.run(['docker','exec',container,'createdb','-U','postgres',database],check=True)
def run(sql, label):
    result = subprocess.run(['docker','exec','-i',container,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1'],input=sql,text=True,capture_output=True)
    if result.returncode:
        raise SystemExit(f'{label}: {result.stderr[-2000:]}')
    print('PASS',label)
run("""
do $$begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
 if not exists(select 1 from pg_roles where rolname='authenticator') then create role authenticator; end if;
end$$;
create schema auth;
create table auth.users(id uuid primary key,email text,deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
grant usage on schema auth to authenticated,anon;
create schema storage; create table storage.buckets(id text primary key,public boolean);
create schema extensions; create extension pgcrypto with schema extensions;
""",'synthetic Supabase infrastructure')
paths=sorted((root/'supabase/launch/migrations').glob('*.sql'))
for p in paths:
    if p.name.startswith(('0104_','0146_')):
        print('EXCLUDED infrastructure/content activation:',p.name); continue
    if p.name.startswith('0138_'):
        drift=root/'supabase/live-drift/cqcx/20260811232326_create_housing_applications_ejwrh.captured.sql'
        run(drift.read_text(),drift.name)
    if p.name.startswith('20261005071446'):
        for prepared in sorted((root/'supabase/launch/prepared').glob('014*.prepared.sql')):
            run(prepared.read_text(),prepared.name)
    run(p.read_text(),p.name)
for name in ['schema.sql','collaboration-schema.sql','test-full-contract.sql']:
    run((Path(__file__).parent/name).read_text(),name)

bridge=root/'workers/collaboration-proposal'
bridge_test=(bridge/'test-authorization.sql').read_text().replace('\\ir authorization-schema.sql',(bridge/'authorization-schema.sql').read_text())
run(bridge_test,'test-authorization.sql')

for name in ['retention-schema.sql','test-retention.sql']:
    run((Path(__file__).parent/name).read_text(),name)
