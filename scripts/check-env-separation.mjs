import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Environment-separation guard — Phase C2 (2026-11-12).
//
// Proves, on every CI run, that:
//   1. DEV configurations cannot reference the production Supabase project
//      (CQCX) — the DEV deploy workflow must carry its refusal gates, and the
//      DEV wrangler config must be the DEV Worker with no routes/domains;
//   2. production configurations cannot carry DEV credentials or Turnstile
//      TEST keys — the production-facing workflows must not contain the
//      always-pass test keys and must still target the canonical backend;
//   3. the fixture/bootstrap layer stays synthetic and production-refusing.
//
// This guard only ADDS failure modes. It weakens nothing.

const PROD_REF = 'cqcxvwoukyhxyokfwnjm';
const RETIRED_REF = 'ykykeioydvtxpyreshhs';
// Cloudflare's published always-pass/always-fail Turnstile TEST keys.
const TEST_KEY_MARKERS = ['1x00000000000000000000AA', '2x00000000000000000000AB', '1x0000000000000000000000000000000AA', '2x0000000000000000000000000000000AA', '3x0000000000000000000000000000000AA'];

const failures = [];
const read = (p) => readFileSync(p, 'utf8');

// --- 1. DEV deploy workflow: refusal gates present, no prod targeting -------
{
  const p = '.github/workflows/deploy-dev.yml';
  if (!existsSync(p)) failures.push(`${p} missing`);
  else {
    const t = read(p);
    if (!t.includes('wrangler.dev.jsonc')) failures.push(`${p}: must deploy only via wrangler.dev.jsonc`);
    if (!t.includes('may NEVER target the production Supabase project')) {
      failures.push(`${p}: production-refusal gate removed`);
    }
    if (!t.includes('environment: dev')) failures.push(`${p}: must use the dedicated GitHub environment 'dev'`);
    if (/VITE_SUPABASE_URL:\s*https:\/\/cqcx/.test(t)) failures.push(`${p}: hardcodes the production backend`);
    if (!t.includes('DEPLOY_DEV')) failures.push(`${p}: typed confirmation gate removed`);
  }
}

// --- DEV wrangler config: DEV worker name, no routes/domains ----------------
{
  const p = 'wrangler.dev.jsonc';
  if (!existsSync(p)) failures.push(`${p} missing`);
  else {
    const t = read(p).replace(/\/\/.*$/gm, '');
    if (!/"name"\s*:\s*"recoveryos-dev"/.test(t)) failures.push(`${p}: Worker name must be recoveryos-dev`);
    if (/routes|custom_domain/.test(t)) failures.push(`${p}: must not declare routes or custom domains`);
  }
}

// --- 2. Production-facing configs: canonical backend, no TEST keys ----------
for (const p of ['.github/workflows/deploy-staging.yml', '.github/workflows/deploy-production-candidate.yml']) {
  const t = read(p);
  if (!t.includes(PROD_REF)) failures.push(`${p}: no longer pins the canonical backend`);
  for (const k of TEST_KEY_MARKERS) {
    if (t.includes(k)) failures.push(`${p}: contains a Turnstile TEST key — test keys are DEV-only`);
  }
  if (t.includes('DEV_SUPABASE')) failures.push(`${p}: references DEV credentials`);
}
for (const p of ['wrangler.jsonc', 'wrangler.staging.jsonc']) {
  const t = read(p).replace(/\/\/.*$/gm, '');
  if (/"name"\s*:\s*"recoveryos-dev"/.test(t)) failures.push(`${p}: production wrangler config must not name the DEV Worker`);
}

// --- 3. Fixture/bootstrap layer: synthetic and production-refusing ----------
{
  const dir = 'supabase/dev-fixtures';
  for (const f of readdirSync(dir)) {
    const t = read(join(dir, f));
    if (t.includes(PROD_REF) || t.includes(RETIRED_REF)) failures.push(`${dir}/${f}: references a cloud project`);
    const emails = t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    for (const e of emails) {
      if (!e.endsWith('@example.test')) failures.push(`${dir}/${f}: non-synthetic email ${e}`);
    }
    if (!t.includes("recoveryos.devfixtures")) failures.push(`${dir}/${f}: missing the devfixtures run guard`);
  }
  const b = read('scripts/bootstrap-dev.py');
  if (!b.includes("'cqcx' + 'vwoukyhxyokfwnjm'")) failures.push('bootstrap-dev.py: production refusal constant removed');
  if (!b.includes('refuse_production')) failures.push('bootstrap-dev.py: production refusal check removed');
  if (b.includes(PROD_REF)) failures.push('bootstrap-dev.py: contains the literal production ref (must stay split)');
  const m = read('scripts/dev-bootstrap-manifest.json');
  if (m.includes(PROD_REF)) failures.push('dev-bootstrap-manifest.json: references the production project');
}

// --- config.toml: local-only, hazard note intact -----------------------------
{
  const t = read('supabase/config.toml');
  if (t.includes(PROD_REF)) failures.push('supabase/config.toml: references the production project');
  if (!t.includes('never `db reset`')) failures.push('supabase/config.toml: db-reset hazard note removed');
}

if (failures.length) {
  console.error('environment-separation guard failed:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('environment separation verified: DEV cannot reach the production backend; production configs carry no DEV credentials or Turnstile test keys; fixtures are synthetic and guarded.');
