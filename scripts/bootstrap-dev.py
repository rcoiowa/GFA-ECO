#!/usr/bin/env python3
"""Hash-pinned live-parity bootstrap for DEV / disposable databases — Phase C2.

Builds an EMPTY database into the verified live CQCX schema shape by applying the
ordered, SHA-256-pinned entries of scripts/dev-bootstrap-manifest.json.

TARGETS (deliberately narrow):
  --target docker       (default) create a disposable, network-isolated pinned
                        postgres:17 container, apply, fingerprint, destroy.
  --target local-stack  apply to the Supabase CLI local stack database at
                        127.0.0.1:54322 (postgres superuser, local trust auth).
  --keep                with --target docker: keep the container running
                        (prints its name) instead of destroying it.

PRODUCTION REFUSAL (non-negotiable):
  * No DSN input exists. The only network target is 127.0.0.1:54322.
  * If the environment, arguments, or manifest contain the canonical production
    ref 'cqcx'+'vwoukyhxyokfwnjm' this script exits before touching anything.
  * Cloud DEV targets are a Phase C3 extension requiring its own authorization;
    this version cannot reach them.

FAIL-CLOSED GUARANTEES:
  * every manifest entry must exist and match its SHA-256 pin exactly;
  * manifest order must be strictly increasing with no duplicate paths;
  * every supabase/launch/migrations/*.sql file must be accounted for in the
    manifest (a new/unknown migration fails the run: schema drift is loud);
  * the chain guard (scripts/verify-prepared-chain.mjs) must pass first;
  * any SQL error aborts (ON_ERROR_STOP) and the target is torn down.

PROFILES:
  --profile live-parity (default) applies exactly what the verified live ledger
      holds: launch 0000-0145 (0104/0146 are activation entries, see below),
      prepared 0147-0149, the 20261005 batch, housing follow-through, the
      attestations migration (preceded by the captured live function
      definitions its baseline guard verifies against), seeds 0200-0203.
      Prepared 0150/0151 are NOT applied (unapplied in production).
  --profile replay-compat additionally applies prepared 0150/0151 after 0149,
      matching scripts/replay-launch-local.py semantics (for suites written
      against that superset).
  --include-activations additionally applies 0104 (pg_cron scheduler — needs a
      stack with pg_cron; plain postgres containers lack it) and 0146 (content
      activation). Off by default; parity gap is reported, not hidden.
  --with-fixtures applies supabase/dev-fixtures/ synthetic personas (guarded:
      the fixture SQL itself refuses to run unless the session sets
      recoveryos.devfixtures='on', which this script sets ONLY for its own
      disposable/local targets).

Verification: after apply, prints a deterministic SCHEMA FINGERPRINT (md5 over
ordered tables/columns, functions, policies, triggers, and RLS flags in the
recoveryos schema). --expect-fingerprint FP fails the run if it differs —
run twice on fresh targets to prove repeatability.
"""

from pathlib import Path
import argparse, hashlib, json, os, subprocess, sys, time, uuid

ROOT = Path(__file__).resolve().parents[1]
# DEV_BOOTSTRAP_MANIFEST exists ONLY so the guard test suite can point the
# script at deliberately broken manifests and prove the refusals fire. Its
# value and content pass through the same production-refusal scan.
MANIFEST = Path(os.environ['DEV_BOOTSTRAP_MANIFEST']) if os.environ.get('DEV_BOOTSTRAP_MANIFEST') \
    else Path(__file__).resolve().parents[1] / 'scripts' / 'dev-bootstrap-manifest.json'
PROD_REF = 'cqcx' + 'vwoukyhxyokfwnjm'  # split so this file never contains the literal
PINNED_IMAGE = 'postgres@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'

# Same synthetic infrastructure as the repository's isolated replay
# (scripts/replay-launch-local.py), including the historical 0138 containment
# placeholder — kept byte-consistent so both harnesses prove the same prelude.
PRELUDE = '''
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
'''

# The CLI local stack already provides roles, auth, storage, and extensions;
# only the historical 0138 containment placeholder is missing there.
LOCAL_STACK_PRELUDE = '''
create table if not exists public.housing_applications(id bigint primary key);
alter table public.housing_applications enable row level security;
revoke all on public.housing_applications from public,anon,authenticated,service_role;
'''

FINGERPRINT_SQL = '''
select md5(string_agg(line, chr(10) order by line)) from (
  select 'T|'||c.relname||'|'||a.attname||'|'||format_type(a.atttypid,a.atttypmod)||'|'||a.attnotnull as line
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
    where n.nspname='recoveryos' and c.relkind in ('r','v','m')
  union all
  select 'R|'||c.relname||'|'||c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='recoveryos' and c.relkind='r'
  union all
  select 'F|'||p.proname||'|'||pg_get_function_identity_arguments(p.oid)||'|'||md5(pg_get_functiondef(p.oid))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='recoveryos' and p.prokind='f'
  union all
  select 'P|'||c.relname||'|'||pol.polname||'|'||pol.polcmd::text||'|'||coalesce(pg_get_expr(pol.polqual,pol.polrelid),'')
    from pg_policy pol join pg_class c on c.oid=pol.polrelid
    join pg_namespace n on n.oid=c.relnamespace where n.nspname='recoveryos'
  union all
  select 'G|'||t.trigger_name||'|'||t.event_object_table||'|'||t.action_timing||'|'||t.event_manipulation
    from information_schema.triggers t where t.trigger_schema='recoveryos'
) s;
'''


def fail(msg: str) -> 'None':
    print(f'BOOTSTRAP FAILED: {msg}', file=sys.stderr)
    sys.exit(1)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def refuse_production(*texts: str) -> None:
    for t in texts:
        if PROD_REF in t:
            fail('production project reference detected — this tool never touches CQCX')
        if '.supabase.co' in t:
            fail('cloud Supabase host detected — cloud targets are a Phase C3 extension')


def load_manifest(profile: str, include_activations: bool, with_fixtures: bool):
    data = json.loads(MANIFEST.read_text())
    refuse_production(json.dumps(data))
    entries = data['entries']
    orders = [e['order'] for e in entries]
    if orders != sorted(orders) or len(set(orders)) != len(orders):
        fail('manifest order must be strictly increasing and unique')
    paths = [e['path'] for e in entries]
    if len(set(paths)) != len(paths):
        fail('duplicate path in manifest')
    for e in entries:
        p = ROOT / e['path']
        if not p.exists():
            fail(f"missing artifact: {e['path']}")
        actual = sha256(p)
        if actual != e['sha256']:
            fail(f"checksum mismatch: {e['path']} sha256={actual} pinned={e['sha256']}")
    # Drift detection: every launch migration must be in the manifest.
    manifested = {e['path'] for e in entries}
    for p in sorted((ROOT / 'supabase/launch/migrations').glob('*.sql')):
        rel = str(p.relative_to(ROOT))
        if rel not in manifested:
            fail(f'unmanifested launch migration (schema drift — update and re-pin the manifest deliberately): {rel}')
    selected = []
    for e in entries:
        kinds = set(e.get('profiles', ['live-parity', 'replay-compat']))
        if profile not in kinds:
            continue
        if e.get('activation') and not include_activations:
            print(f"SKIP activation (report as parity gap): {e['path']}")
            continue
        if e.get('fixture') and not with_fixtures:
            continue
        selected.append(e)
    return selected


class DockerTarget:
    def __init__(self, keep: bool):
        self.name = 'gfa-dev-bootstrap-' + uuid.uuid4().hex[:12]
        self.keep = keep

    def __enter__(self):
        endpoint = os.environ.get('DOCKER_HOST') or subprocess.run(
            ['docker', 'context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
            capture_output=True, text=True).stdout.strip()
        if not endpoint.startswith('unix://'):
            fail('only a local Unix Docker socket is supported')
        subprocess.run(['docker', 'image', 'inspect', PINNED_IMAGE], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(['docker', 'run', '-d', '--rm', '--network', 'none', '--tmpfs',
                        '/var/lib/postgresql/data', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust',
                        '--name', self.name, PINNED_IMAGE], check=True, stdout=subprocess.DEVNULL)
        for _ in range(60):
            if subprocess.run(['docker', 'exec', self.name, 'pg_isready', '-U', 'postgres'],
                              capture_output=True).returncode == 0:
                return self
            time.sleep(0.5)
        fail('disposable Postgres did not become ready')

    def sql(self, text: str, label: str):
        r = subprocess.run(['docker', 'exec', '-i', self.name, 'psql', '-X', '-q', '-U', 'postgres',
                            '-v', 'ON_ERROR_STOP=1'], input=text, text=True, capture_output=True)
        if r.returncode:
            raise RuntimeError(f'{label}\n{r.stderr[-4000:]}')
        print('APPLY', label, flush=True)
        return r.stdout

    def query(self, text: str) -> str:
        r = subprocess.run(['docker', 'exec', '-i', self.name, 'psql', '-X', '-qAt', '-U', 'postgres',
                            '-v', 'ON_ERROR_STOP=1'], input=text, text=True, capture_output=True)
        if r.returncode:
            raise RuntimeError(r.stderr[-2000:])
        return r.stdout.strip()

    def __exit__(self, *exc):
        if self.keep:
            print(f'KEPT container {self.name} (docker rm -f {self.name} to destroy)')
        else:
            subprocess.run(['docker', 'rm', '-f', self.name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


class LocalStackTarget:
    """Supabase CLI local stack only: 127.0.0.1:54322. No other host exists here."""
    DSN = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

    def __enter__(self):
        return self

    def _psql(self, args, text_in):
        return subprocess.run(['psql', self.DSN, '-X', '-q', '-v', 'ON_ERROR_STOP=1', *args],
                              input=text_in, text=True, capture_output=True)

    def sql(self, text: str, label: str):
        r = self._psql([], text)
        if r.returncode:
            raise RuntimeError(f'{label}\n{r.stderr[-4000:]}')
        print('APPLY', label, flush=True)
        return r.stdout

    def query(self, text: str) -> str:
        r = self._psql(['-At'], text)
        if r.returncode:
            raise RuntimeError(r.stderr[-2000:])
        return r.stdout.strip()

    def __exit__(self, *exc):
        pass


def apply_entry(target, entry):
    p = ROOT / entry['path']
    if entry.get('kind') == 'captured_functions':
        for f in json.loads(p.read_text()):
            target.sql(f['definition'], f"captured {f['name']}")
        return
    body = p.read_text()
    if entry.get('fixture'):
        body = "set recoveryos.devfixtures = 'on';\n" + body
    target.sql(body, entry['path'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--target', choices=['docker', 'local-stack'], default='docker')
    ap.add_argument('--profile', choices=['live-parity', 'replay-compat'], default='live-parity')
    ap.add_argument('--include-activations', action='store_true')
    ap.add_argument('--with-fixtures', action='store_true')
    ap.add_argument('--keep', action='store_true')
    ap.add_argument('--expect-fingerprint')
    ap.add_argument('--skip-prelude', action='store_true',
                    help='local-stack already provides auth/storage schemas; skip the synthetic prelude')
    args = ap.parse_args()

    refuse_production(json.dumps(vars(args)), os.environ.get('DEV_BOOTSTRAP_MANIFEST', ''), str(MANIFEST))

    print('Running chain guard first…')
    r = subprocess.run(['node', str(ROOT / 'scripts/verify-prepared-chain.mjs')], cwd=ROOT)
    if r.returncode:
        fail('verify-prepared-chain.mjs failed; refusing to bootstrap from an unverified tree')

    entries = load_manifest(args.profile, args.include_activations, args.with_fixtures)
    print(f'{len(entries)} manifest entries verified (profile={args.profile})')

    target_cls = DockerTarget(args.keep) if args.target == 'docker' else LocalStackTarget()
    with target_cls as t:
        if not args.skip_prelude:
            if args.target == 'docker':
                t.sql(PRELUDE, 'synthetic infrastructure prelude')
            else:
                t.sql(LOCAL_STACK_PRELUDE, 'local-stack 0138 containment placeholder')
        for e in entries:
            apply_entry(t, e)
        fp = t.query(FINGERPRINT_SQL)
        print(f'SCHEMA FINGERPRINT {fp}')
        if args.expect_fingerprint and fp != args.expect_fingerprint:
            fail(f'fingerprint mismatch: got {fp}, expected {args.expect_fingerprint}')
        # Repeat the fingerprint read to prove the verification itself is stable.
        fp2 = t.query(FINGERPRINT_SQL)
        if fp2 != fp:
            fail('fingerprint not stable across repeated reads')
        print('BOOTSTRAP OK')


if __name__ == '__main__':
    main()
