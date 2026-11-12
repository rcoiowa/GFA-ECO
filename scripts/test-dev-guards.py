#!/usr/bin/env python3
"""Negative-path proof suite for the DEV guards — Phase C2-V.

Proves, WITHOUT any container or cloud action, that the DEV tooling fails
closed BEFORE acting when given: a production backend reference, a checksum
mismatch, a missing artifact, an unmanifested migration, or out-of-order
entries — and that the DEV deploy workflow's refusal gates run before any
wrangler action and cannot be retargeted by inputs.

Every bootstrap invocation here uses a disposable manifest copy via
DEV_BOOTSTRAP_MANIFEST; the repository manifest is never modified. All
failures must occur during verification (no Docker daemon is required and
none is used — a test that reached the container stage would itself fail).
"""
import copy, json, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP = ROOT / 'scripts' / 'bootstrap-dev.py'
REAL = json.loads((ROOT / 'scripts' / 'dev-bootstrap-manifest.json').read_text())
results = []


def run_bootstrap(manifest: dict, extra_env=None):
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
        json.dump(manifest, f)
        path = f.name
    env = dict(os.environ, DEV_BOOTSTRAP_MANIFEST=path)
    if extra_env:
        env.update(extra_env)
    try:
        return subprocess.run([sys.executable, str(BOOTSTRAP)], env=env, cwd=ROOT,
                              capture_output=True, text=True, timeout=120)
    finally:
        os.unlink(path)


def expect(name, proc, needle):
    out = proc.stdout + proc.stderr
    ok = proc.returncode != 0 and needle in out
    results.append((name, ok))
    print(('PASS' if ok else 'FAIL'), name)
    if not ok:
        print('  returncode:', proc.returncode)
        print('  output tail:', out[-500:])


# 1. Production reference anywhere in the manifest → refused before anything runs.
m = copy.deepcopy(REAL)
m['entries'][0]['note'] = 'points at https://cqcx' + 'vwoukyhxyokfwnjm.supabase.co'
expect('production reference in manifest refused', run_bootstrap(m),
       'production project reference detected')

# 2. Cloud host anywhere → refused (cloud targets are a C3 extension).
m = copy.deepcopy(REAL)
m['entries'][0]['note'] = 'https://zzzzzzzzzzzzzzzzzzzz.supabase.co'
expect('cloud host in manifest refused', run_bootstrap(m), 'cloud Supabase host detected')

# 3. Checksum mismatch → named file, both hashes, nothing applied.
m = copy.deepcopy(REAL)
m['entries'][0]['sha256'] = '0' * 64
expect('checksum mismatch fails closed', run_bootstrap(m), 'checksum mismatch')

# 4. Missing artifact → named and fails.
m = copy.deepcopy(REAL)
m['entries'][0]['path'] = 'supabase/launch/migrations/does_not_exist.sql'
expect('missing artifact fails closed', run_bootstrap(m), 'missing artifact')

# 5. Unmanifested migration (drift) → fails. Simulated by REMOVING a launch
#    migration from the manifest copy (equivalent to a new file appearing).
m = copy.deepcopy(REAL)
removed = next(e for e in m['entries'] if e['path'].startswith('supabase/launch/migrations/0001'))
m['entries'] = [e for e in m['entries'] if e is not removed]
expect('unmanifested launch migration fails closed', run_bootstrap(m),
       'unmanifested launch migration')

# 6. Ordering violation → fails.
m = copy.deepcopy(REAL)
m['entries'][1]['order'] = m['entries'][0]['order']
expect('non-increasing order fails closed', run_bootstrap(m), 'strictly increasing')

# 6b. Cloud DEV target (Phase C3-A skeleton): inert and fail-closed until C3-B.
def run_dev_target(identity: dict | None, env_extra=None):
    env = dict(os.environ, DEV_BOOTSTRAP_MANIFEST='')
    env.pop('DEV_BOOTSTRAP_MANIFEST')
    if identity is None:
        env['DEV_PROJECT_IDENTITY'] = '/nonexistent/dev-project-identity.json'
    else:
        f = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False)
        json.dump(identity, f)
        f.close()
        env['DEV_PROJECT_IDENTITY'] = f.name
    if env_extra:
        env.update(env_extra)
    return subprocess.run([sys.executable, str(BOOTSTRAP), '--target', 'dev-project'],
                          env=env, cwd=ROOT, capture_output=True, text=True, timeout=120)

expect('dev-project without identity artifact refused', run_dev_target(None),
       'does not exist')
expect('dev-project identity naming PRODUCTION refused',
       run_dev_target({'ref': 'cqcx' + 'vwoukyhxyokfwnjm', 'approved_by': 'x', 'approved_on': 'x'}),
       'PRODUCTION project')
expect('dev-project identity naming a retired project refused',
       run_dev_target({'ref': 'ykykeioydvtxpyreshhs', 'approved_by': 'x', 'approved_on': 'x'}),
       'retired project')
expect('dev-project malformed ref refused',
       run_dev_target({'ref': 'not-a-ref', 'approved_by': 'x', 'approved_on': 'x'}),
       'malformed')
expect('dev-project without approval fields refused',
       run_dev_target({'ref': 'zzzzzzzzzzzzzzzzzzzz'}), 'missing approved_by')
expect('dev-project without DEV_DB_PASSWORD refused',
       run_dev_target({'ref': 'zzzzzzzzzzzzzzzzzzzz', 'approved_by': 'x', 'approved_on': 'x'},
                      env_extra={'DEV_DB_PASSWORD': ''}), 'DEV_DB_PASSWORD')

# The committed identity artifact must NOT exist before Phase C3-B authorizes it.
ok = not (ROOT / 'scripts' / 'dev-project-identity.json').exists()
results.append(('identity artifact absent until C3-B', ok))
print(('PASS' if ok else 'FAIL'), 'identity artifact absent until C3-B')

# 7. Workflow structure: deploy-dev.yml refuses before acting and cannot be retargeted.
wf = (ROOT / '.github/workflows/deploy-dev.yml').read_text()
checks = {
    'refusal gate precedes wrangler deploy':
        wf.index('may NEVER target the production Supabase project') < wf.index('wrangler@'),
    'CI requirement precedes wrangler deploy':
        wf.index('No successful CI run exists') < wf.index('wrangler@'),
    'asset grep precedes wrangler deploy':
        wf.index('reference the PRODUCTION project') < wf.index('wrangler@'),
    'only wrangler.dev.jsonc is deployed':
        len(re.findall(r'wrangler@[\d.]+ deploy', wf)) == 1 and 'deploy --config wrangler.dev.jsonc' in wf,
    # The dispatch inputs are exactly {release_ref, confirmation} — no input can
    # name a Worker, config, or URL, so wrong input cannot retarget the deploy.
    'inputs are exactly release_ref and confirmation':
        sorted(re.findall(r'^      (\w+):\s*$', wf.split('jobs:')[0], re.M)) == ['confirmation', 'release_ref'],
    'dedicated dev environment':
        'environment: dev' in wf,
}
for name, ok in checks.items():
    results.append((name, ok))
    print(('PASS' if ok else 'FAIL'), 'deploy-dev.yml:', name)

# 8. Separation guard present in CI and passing.
ci = (ROOT / '.github/workflows/ci.yml').read_text()
ok = 'check-env-separation.mjs' in ci
results.append(('separation guard wired into CI', ok))
print(('PASS' if ok else 'FAIL'), 'separation guard wired into CI')
proc = subprocess.run(['node', str(ROOT / 'scripts/check-env-separation.mjs')], capture_output=True, text=True, cwd=ROOT)
ok = proc.returncode == 0
results.append(('separation guard passes on current tree', ok))
print(('PASS' if ok else 'FAIL'), 'separation guard passes on current tree')

failed = [n for n, ok in results if not ok]
print(f'TOTAL {len(results)} guard proofs, {len(failed)} failed')
sys.exit(1 if failed else 0)
