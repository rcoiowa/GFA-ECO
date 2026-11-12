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
  * No DSN input exists. Network targets are 127.0.0.1:54322 (local-stack) and —
    ONLY once Phase C3-B is separately authorized — the single approved DEV
    project named by scripts/dev-project-identity.json (see below).
  * If the arguments or manifest contain the canonical production ref
    'cqcx'+'vwoukyhxyokfwnjm' (or any cloud host, for the manifest) this script
    exits before touching anything.

CLOUD DEV TARGET (--target dev-project) — fail-closed by construction:
  * requires scripts/dev-project-identity.json, an executive-approval artifact
    that does NOT exist until Phase C3-B creates it ({"ref","approved_by",
    "approved_on"}). Without it, or with a malformed/production/retired ref,
    the target refuses before any connection.
  * requires DEV_DB_PASSWORD in the environment (never a file, never committed).
  * before applying anything it verifies the target is EMPTY/expected-state:
    no `recoveryos` schema and no applied migration rows; anything else refuses
    (a later authorization may add fingerprint-matched resume).
  * mirrors each applied migration into supabase_migrations.schema_migrations
    (version+name) so the DEV ledger reads like production's.

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
        # 120s window: a loaded machine (e.g. the CLI stack running alongside)
        # can push container startup past 30s — C2-V robustness finding.
        for _ in range(240):
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


RETIRED_REFS = ('ykykeioydvtxpyreshhs', 'vlsxjkqyaexcxwkbovlq')
# DEV_PROJECT_IDENTITY exists ONLY so the guard suite can prove the identity
# refusals with disposable files; the default is the committed C3-B artifact.
IDENTITY_FILE = Path(os.environ['DEV_PROJECT_IDENTITY']) if os.environ.get('DEV_PROJECT_IDENTITY') \
    else ROOT / 'scripts' / 'dev-project-identity.json'


def load_dev_identity():
    """Executive-approved DEV project identity — a Phase C3-B artifact.

    Fails closed: missing file, malformed ref, or a production/retired ref all
    refuse before any network connection exists.
    """
    if not IDENTITY_FILE.exists():
        fail('cloud DEV target refused: scripts/dev-project-identity.json does not exist. '
             'It is created only under an explicit Phase C3-B executive authorization.')
    ident = json.loads(IDENTITY_FILE.read_text())
    ref = ident.get('ref', '')
    import re as _re
    if not _re.fullmatch(r'[a-z]{20}', ref):
        fail('cloud DEV target refused: identity ref is malformed')
    if ref == PROD_REF:
        fail('cloud DEV target refused: identity names the PRODUCTION project')
    if ref in RETIRED_REFS:
        fail('cloud DEV target refused: identity names a retired project')
    for k in ('approved_by', 'approved_on'):
        if not ident.get(k):
            fail(f'cloud DEV target refused: identity missing {k}')
    return ident


class DevProjectTarget:
    """The single approved cloud DEV project. Inert until C3-B provisions it."""

    def __init__(self):
        ident = load_dev_identity()
        pw = os.environ.get('DEV_DB_PASSWORD')
        if not pw:
            fail('cloud DEV target refused: DEV_DB_PASSWORD not set')
        self.ref = ident['ref']
        self.dsn = f"postgresql://postgres:{pw}@db.{self.ref}.supabase.co:5432/postgres?sslmode=require"
        self.ledger = True

    def __enter__(self):
        # Expected-state verification: refuse anything but an empty project.
        # Managed-baseline note (C3-B2 preflight finding): a FRESH managed
        # project has NO supabase_migrations.schema_migrations table at all —
        # the platform's migration mechanism creates it on first apply. The
        # expected states are therefore: ledger table ABSENT (fresh baseline)
        # or PRESENT WITH ZERO ROWS; any rows refuse.
        schema = self.query("select count(*) from pg_namespace where nspname = 'recoveryos'")
        if schema.strip() != '0':
            fail('cloud DEV target refused: recoveryos schema already exists (not an empty project)')
        rows = self.query("""
            select coalesce((select count(*)::text from supabase_migrations.schema_migrations), '0')
            where exists (select 1 from information_schema.tables
                          where table_schema='supabase_migrations' and table_name='schema_migrations')
            union all select '0' limit 1""")
        if rows.strip() not in ('', '0'):
            fail('cloud DEV target refused: migration ledger is not empty')
        print(f'DEV target {self.ref}: verified empty/expected state (ledger absent or empty)')
        return self

    def _psql(self, args, text_in):
        return subprocess.run(['psql', self.dsn, '-X', '-q', '-v', 'ON_ERROR_STOP=1', *args],
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
    ap.add_argument('--target', choices=['docker', 'local-stack', 'dev-project'], default='docker')
    ap.add_argument('--profile', choices=['live-parity', 'replay-compat'], default='live-parity')
    ap.add_argument('--include-activations', action='store_true')
    ap.add_argument('--with-fixtures', action='store_true')
    ap.add_argument('--keep', action='store_true')
    ap.add_argument('--expect-fingerprint')
    ap.add_argument('--skip-prelude', action='store_true',
                    help='local-stack already provides auth/storage schemas; skip the synthetic prelude')
    ap.add_argument('--emit-plan', metavar='OUT',
                    help='run EVERY gate (chain guard, identity when --target dev-project, '
                         'manifest hash/order/drift checks, profile selection) but connect to '
                         'NOTHING; write the verified ordered plan as JSON to OUT. Used by the '
                         'authorized-connector apply path so the same refusals govern it.')
    args = ap.parse_args()

    refuse_production(json.dumps(vars(args)), os.environ.get('DEV_BOOTSTRAP_MANIFEST', ''), str(MANIFEST))

    print('Running chain guard first…')
    r = subprocess.run(['node', str(ROOT / 'scripts/verify-prepared-chain.mjs')], cwd=ROOT)
    if r.returncode:
        fail('verify-prepared-chain.mjs failed; refusing to bootstrap from an unverified tree')

    entries = load_manifest(args.profile, args.include_activations, args.with_fixtures)
    print(f'{len(entries)} manifest entries verified (profile={args.profile})')

    if args.emit_plan:
        ident_ref = None
        if args.target == 'dev-project':
            ident_ref = load_dev_identity()['ref']
        plan = {
            'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'target': args.target,
            'dev_ref': ident_ref,
            'profile': args.profile,
            'include_activations': args.include_activations,
            'with_fixtures': args.with_fixtures,
            'prelude': 'docker' if args.target == 'docker' else 'managed-placeholder',
            'entries': entries,
        }
        Path(args.emit_plan).write_text(json.dumps(plan, indent=1))
        print(f'PLAN EMITTED ({len(entries)} entries) -> {args.emit_plan}; nothing was contacted')
        return

    if args.target == 'docker':
        target_cls = DockerTarget(args.keep)
    elif args.target == 'local-stack':
        target_cls = LocalStackTarget()
    else:
        target_cls = DevProjectTarget()
    with target_cls as t:
        if not args.skip_prelude:
            if args.target == 'docker':
                t.sql(PRELUDE, 'synthetic infrastructure prelude')
            else:
                t.sql(LOCAL_STACK_PRELUDE, 'managed-stack 0138 containment placeholder')
        for e in entries:
            apply_entry(t, e)
            # Mirror applied migrations into the managed ledger so DEV's
            # schema_migrations reads like production's (names identical;
            # version timestamps are DEV-local apply times).
            if getattr(t, 'ledger', False) and e.get('kind') != 'captured_functions' \
                    and not e.get('fixture') and e['path'].endswith('.sql') \
                    and ('launch/migrations/' in e['path'] or 'launch/prepared/' in e['path']
                         or 'document-review/2026' in e['path']):
                stem = Path(e['path']).stem.replace('.prepared', '')
                t.sql("insert into supabase_migrations.schema_migrations (version, name) "
                      f"values (to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'), '{stem}') "
                      "on conflict do nothing;", f'ledger row: {stem}')
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
