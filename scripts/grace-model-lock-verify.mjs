#!/usr/bin/env node
/**
 * Grace V1 MODEL-LOCK preflight (directive Phase 1).
 *
 * Enforces the locked canonical Grace V1 provider configuration:
 *     GRACE_MODEL           = claude-sonnet-5
 *     GRACE_DISABLE_THINKING = 1  (true)
 *
 * Three checks:
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
 *   3. POLICY — the POLICY_VERSION in supabase/functions/grace/policy.ts must be
 *      either the APPROVED policy (grace_v1.policy_version, the one the recorded
 *      evaluation evidence qualifies) or the single DECLARED candidate
 *      (grace_policy_candidate, status evaluation_pending). An undeclared version
 *      fails everywhere. With `--require-approved-policy` (used by every workflow
 *      that runs `supabase functions deploy grace`) a candidate ALSO fails, so
 *      merged-but-unevaluated policy text cannot reach the deployed function.
 *      Merged, evaluated, release-approved, deployed and production-verified are
 *      separate states; this check only guards merged -> deployed.
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
const lockFile = JSON.parse(readFileSync(join(__dir, '..', 'grace-model-lock.json'), 'utf8'));
const lock = lockFile.grace_v1;
const candidate = lockFile.grace_policy_candidate ?? null;
const REQUIRE_APPROVED_POLICY = process.argv.includes('--require-approved-policy');
const policySource = readFileSync(
  join(__dir, '..', 'supabase', 'functions', 'grace', 'policy.ts'),
  'utf8',
);
const sourcePolicy = policySource.match(/export const POLICY_VERSION = '([^']+)'/)?.[1] ?? null;

let fail = 0;
const check = (ok, msg) => {
  console.log(`  [${ok ? 'ok' : 'XX'}] ${msg}`);
  if (!ok) fail++;
};

console.log('Grace V1 model-lock — STATIC:');
check(lock.model === APPROVED.model, `lock model ${lock.model} === ${APPROVED.model}`);
check(lock.disable_thinking === APPROVED.disable_thinking, `lock disable_thinking ${lock.disable_thinking} === ${APPROVED.disable_thinking}`);

console.log(
  `Grace V1 policy gate — STATIC${REQUIRE_APPROVED_POLICY ? ' (deploy preflight: approved policy required)' : ''}:`,
);
check(Boolean(sourcePolicy), `policy.ts declares POLICY_VERSION (${sourcePolicy})`);
const isApproved = sourcePolicy === lock.policy_version;
const isDeclaredCandidate =
  !isApproved &&
  candidate !== null &&
  sourcePolicy === candidate.policy_version &&
  candidate.status === 'evaluation_pending';
if (candidate !== null) {
  check(
    candidate.policy_version !== lock.policy_version,
    `declared candidate ${candidate.policy_version} differs from approved ${lock.policy_version}`,
  );
}
if (isApproved) {
  check(true, `source policy ${sourcePolicy} is the approved, evaluated policy`);
} else if (isDeclaredCandidate && !REQUIRE_APPROVED_POLICY) {
  check(
    true,
    `source policy ${sourcePolicy} is a declared CANDIDATE (evaluation pending; approved = ${lock.policy_version}); not approved for deployment`,
  );
} else if (isDeclaredCandidate) {
  check(
    false,
    `source policy ${sourcePolicy} is an unevaluated candidate; this workflow deploys grace and requires approved ${lock.policy_version} (see ${candidate.evaluation_plan})`,
  );
} else {
  check(
    false,
    `source policy ${sourcePolicy} is neither approved (${lock.policy_version}) nor a declared evaluation_pending candidate`,
  );
}

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
  const deployedPolicy = body?.policy_version ?? null;
  if (deployedPolicy === null) {
    console.log('  [--] deployed policy_version not present in response; not asserted.');
  } else {
    check(
      deployedPolicy === lock.policy_version,
      `deployed policy_version ${deployedPolicy} === approved ${lock.policy_version}`,
    );
  }
}

await live();
console.log(`\ngrace-model-lock ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} drift)`);
process.exit(fail === 0 ? 0 : 1);
