#!/usr/bin/env python3
"""Disposable, network-isolated PostgreSQL workflow verification. No remote DB URL accepted."""
from pathlib import Path
import os, subprocess, json, runpy
R=Path(__file__).resolve().parents[1]
P=R/'docs/proposals/document-review'
C=f'gh-document-review-test-{os.getpid()}'
IMAGE='postgres@sha256:b8faeff7712663c2773a190181e1246e37e364b887611c04658c28b44e2408fe'
endpoint=os.environ.get('DOCKER_HOST') or subprocess.check_output(['docker','context','inspect','--format','{{.Endpoints.docker.Host}}'],text=True).strip()
if not endpoint.startswith('unix://'):raise SystemExit('Only a local Unix Docker socket is accepted; no remote database or Docker host.')
def sql(s,label):
 r=subprocess.run(['docker','exec','-i',C,'psql','-X','-q','-U','postgres','-v','ON_ERROR_STOP=1'],input=s,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(label+'\n'+r.stderr[-5000:])
try:
 subprocess.run(['docker','run','--rm','-d','--name',C,'--network','none','--tmpfs','/var/lib/postgresql/data:rw,size=1g','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE,'-c',"listen_addresses="],check=True,stdout=subprocess.DEVNULL)
 import time
 # The image runs a temporary initialization server first. Wait for PID 1 to
 # become the final postgres process before accepting socket readiness.
 for _ in range(150):
  main=subprocess.run(['docker','exec',C,'cat','/proc/1/comm'],capture_output=True,text=True)
  if main.stdout.strip()=='postgres' and subprocess.run(['docker','exec',C,'pg_isready','-U','postgres'],capture_output=True).returncode==0:break
  time.sleep(.2)
 else:raise RuntimeError('Isolated PostgreSQL startup timed out')
 sql('''create role anon;create role authenticated;create role service_role bypassrls;create role authenticator;
create schema auth;create table auth.users(id uuid primary key,email text,deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select current_user::text$$;
grant usage on schema auth to authenticated,anon;
create schema storage;create table storage.buckets(id text primary key,public boolean);
create schema extensions;create extension pgcrypto with schema extensions;
create table public.housing_applications(id bigint primary key);alter table public.housing_applications enable row level security;revoke all on public.housing_applications from public,anon,authenticated,service_role;''','synthetic infrastructure')
 for p in sorted((R/'supabase/launch/migrations').glob('*.sql')):
  # Same dependencies as the repository isolated replay: scheduler and old content edition excluded.
  if p.name.startswith(('0104_','0146_')):continue
  if p.name.startswith('20261005071446'):
   for f in sorted((R/'supabase/launch/prepared').glob('014*.prepared.sql')):sql(f.read_text(),f.name)
  sql(p.read_text(),p.name)
 for f in json.loads((P/'fixtures/live-document-functions.json').read_text()):sql(f['definition'],'captured '+f['name'])
 sql((P/'fixtures/synthetic-seed.sql').read_text(),'synthetic historical baseline')
 sql((P/'20261023201920_document_review_attestations.sql').read_text(),'candidate migration')
 print('PASS isolated replay and exact candidate migration',flush=True)
 runpy.run_path(str(P/'fixtures/check_workflow.py'),init_globals={'CONTAINER':C})
finally:
 subprocess.run(['docker','rm','-f',C],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
