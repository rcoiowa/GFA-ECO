#!/usr/bin/env node
/**
 * ICARE implementation-lock preflight.
 *
 * STATIC checks (no live system needed):
 *   1. icare-implementation-lock.json still declares the APPROVED governance
 *      invariants below. Editing the lock to weaken a rule WITHOUT a ratified
 *      Authority bump (which would also change APPROVED here — a visible,
 *      reviewable diff) fails.
 *   2. The lock and the canonical Authority agree: the Authority document must
 *      still assert the stages, the BARC 10–60 total, the ≤35-rejected rule, and
 *      the 47-reference-only rule. Silent divergence fails.
 *   3. The BARC-10 instrument code matches the locked shape: 10 items, a 1–6
 *      scale, and no subdomain/subscale scoring identifier.
 *
 * Exit non-zero on any drift so CI blocks it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Single source of truth for the approved ICARE governance invariants. Changing
// this is deliberate and must be backed by a ratified Authority version bump.
const APPROVED = {
  authority_version: '1.0',
  icare_stages: ['Identify', 'Connect', 'Assess', 'Respond', 'Empower'],
  icare_is_assessment_domain_set: false,
  grace_may_assign_or_infer_icare_stage: false,
  grace_may_create_silent_staff_alert: false,
  passive_emotion_or_risk_inference_allowed: false,
  barc10: {
    items: 10,
    item_min: 1,
    item_max: 6,
    total_min: 10,
    total_max: 60,
    subdomain_scoring_allowed: false,
    crisis_threshold_35_allowed: false,
    benchmark_47_tier: 'research_reference_only',
    benchmark_47_may_trigger_automation: false,
  },
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(readFileSync(join(root, 'icare-implementation-lock.json'), 'utf8')).icare_v1;
const authorityPath = 'docs/product/recoveryos-icare-integration-authority-v1.0.md';
const authority = readFileSync(join(root, authorityPath), 'utf8');
const barc = readFileSync(join(root, 'packages/domain/src/instruments/barc10.ts'), 'utf8');

let fail = 0;
const check = (ok, msg) => {
  console.log(`  [${ok ? 'ok' : 'XX'}] ${msg}`);
  if (!ok) fail++;
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('ICARE lock — STATIC (lock vs APPROVED):');
check(lock.authority === authorityPath, `lock authority path = ${authorityPath}`);
check(lock.authority_version === APPROVED.authority_version, `authority_version = ${APPROVED.authority_version}`);
check(eq(lock.icare_stages, APPROVED.icare_stages), 'ICARE stages = Identify,Connect,Assess,Respond,Empower');
check(lock.icare_is_assessment_domain_set === false, 'ICARE is NOT an assessment-domain set');
check(lock.grace_may_assign_or_infer_icare_stage === false, 'Grace may NOT assign/infer ICARE stage');
check(lock.grace_may_create_silent_staff_alert === false, 'Grace may NOT create silent staff alerts');
check(lock.passive_emotion_or_risk_inference_allowed === false, 'passive emotion/risk inference NOT allowed');
check(eq(lock.barc10, APPROVED.barc10), 'BARC-10 invariants match (10 items, 1–6, 10–60, no subdomain, ≤35 rejected, 47 reference-only)');

console.log('ICARE lock — Authority agreement:');
check(/Identify\s*→\s*Connect\s*→\s*Assess\s*→\s*Respond\s*→\s*Empower/.test(authority), 'Authority states the five ICARE stages');
check(/10\s*[–-]\s*60/.test(authority), 'Authority states BARC total 10–60');
check(/≤\s*35[\s\S]{0,80}(REJECTED|NOT CANONICAL)/i.test(authority) || /≤35[^\n]*rejected/i.test(authority), 'Authority rejects the ≤35 crisis threshold');
check(/47[\s\S]{0,120}(research-informed reference only|Tier 3)/i.test(authority), 'Authority marks 47 as research-informed reference only');

console.log('ICARE lock — BARC-10 code shape:');
const itemsMatch = barc.match(/BARC10_ITEMS\s*=\s*\[([\s\S]*?)\]\s*as const/);
const itemCount = itemsMatch ? (itemsMatch[1].match(/'/g) || []).length / 2 : -1;
check(itemCount === 10, `BARC10_ITEMS has 10 items (found ${itemCount})`);
check(/value:\s*1\b/.test(barc) && /value:\s*6\b/.test(barc), 'BARC10_SCALE spans 1–6');
// Code-shaped: a subdomain/subscale SCORING construct (identifier), not the word
// in a comment that says there is none.
check(
  !/barc[_a-z0-9]*sub(_?domain|scale)|sub(domain|scale)_score/i.test(barc),
  'BARC-10 code has NO subdomain/subscale scoring construct',
);

console.log(`\nicare-lock ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} drift)`);
process.exit(fail === 0 ? 0 : 1);
