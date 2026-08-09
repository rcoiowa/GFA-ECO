#!/usr/bin/env node
/**
 * Grace V1 MODEL-LOCK preflight (directive Phase 1).
 *
 * Enforces the locked canonical Grace V1 provider configuration:
 *     GRACE_MODEL           = claude-sonnet-5
 *     GRACE_DISABLE_THINKING = 1  (true)
 *
 * Two checks:
 *   1. STATIC — `grace-model-lock.json` must still declare the APPROVED tuple
 *      below. If someone edits the lock file to a different model/flag WITHOUT a
 *      new model-evaluation decision (which would also change APPROVED here, a
 *      visible reviewable diff), this fails.
 *   2. LIVE (only when SUPABASE creds are present) — mints an ephemeral
 *      participant JWT, calls the DEPLOYED grace function, and asserts the
 *      returned `model_id` equals the locked model. A deployment whose GRACE_MODEL
 *      secret has drifted fails here. (thinking-disabled is applied atomically by
 *      the same secrets-set step; the function filters thinking from output so it
 *      is not independently observable in the response — the lock is set and
 *      recorded, and model_id is the observable drift signal.)
 *
 * Exit non-zero on any drift so CI / a deploy preflight blocks it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The single source of truth for the approved Grace V1 tuple. Changing this is a
// deliberate, reviewable act that must be backed by a new model-evaluation.
const APPROVED = { model: 'claude-sonnet-5', disable_thinking: true };

const __dir = dirname(fileURLToPath(import.meta.url));
const lock = JSON.parse(readFileSync(join(__dir, '..', 'grace-model-lock.json'), 'utf8')).grace_v1;

let fail = 0;
const check = (ok, msg) => {
  console.log(`  [${ok ? 'ok' : 'XX'}] ${msg}`);
  if (!ok) fail++;
};

console.log('Grace V1 model-lock — STATIC:');
check(lock.model === APPROVED.model, `lock model ${lock.model} === ${APPROVED.model}`);
check(lock.disable_thinking === APPROVED.disable_thinking, `lock disable_thinking ${lock.disable_thinking} === ${APPROVED.disable_thinking}`);

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const PASSWORD = process.env.P4H_E2E_PASSWORD ?? '';
const EMAIL = process.env.GRACE_EVAL_PARTICIPANT_EMAIL ?? 'p4h-participant@fixtures.recoveryos.test';

async function live() {
  if (!SUPABASE_URL || !ANON || !PASSWORD) {
    console.log('Grace V1 model-lock — LIVE: skipped (no SUPABASE creds); static check only.');
    return;
  }
  console.log('Grace V1 model-lock — LIVE (deployed function):');
  const tok = await (
    await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'content-type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
  ).json();
  if (!tok.access_token) {
    check(false, `authenticate fixture ${EMAIL}`);
    return;
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/grace`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: ANON, authorization: `Bearer ${tok.access_token}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi Grace, quick hello for a config check.' }] }),
  });
  const body = await res.json().catch(() => ({}));
  const modelId = body?.meta?.model_id ?? body?.model_id ?? null;
  if (body?.code === 'ai_unconfigured') {
    check(false, 'deployed grace returns ai_unconfigured (provider not set)');
    return;
  }
  if (body?.code === 'consent_required') {
    console.log('  [--] fixture lacks consent; cannot read live model_id (set consent to verify). Static lock still enforced.');
    return;
  }
  check(modelId === APPROVED.model, `deployed model_id ${modelId} === ${APPROVED.model}`);
}

await live();
console.log(`\ngrace-model-lock ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} drift)`);
process.exit(fail === 0 ? 0 : 1);
