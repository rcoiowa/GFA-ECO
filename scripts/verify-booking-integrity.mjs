#!/usr/bin/env node
// Static invariant checks for the booking write-integrity remediation
// (PR #6 review findings on 0100_launch_coaching_write.sql, corrected
// additively by 0124_booking_write_integrity.sql because 0100 is applied on
// the live launch project). Runnable without a database — pins the corrected
// posture in source so a future edit cannot silently reintroduce either
// defect, and pins that the fix stays ADDITIVE (0100's applied history is
// never rewritten to contain it).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const read = (p) => readFileSync(join(repoRoot, p), 'utf8');

const m0100 = read('supabase/launch/migrations/0100_launch_coaching_write.sql');
const m0124 = read('supabase/launch/migrations/0124_booking_write_integrity.sql');

const checks = [];
const assert = (name, cond) => checks.push({ name, ok: !!cond });

// --- 0124 redefines both corrected functions ---------------------------------
assert(
  '0124 redefines create_booking_request',
  /create or replace function recoveryos\.create_booking_request/i.test(m0124),
);
assert(
  '0124 redefines propose_booking_times',
  /create or replace function recoveryos\.propose_booking_times/i.test(m0124),
);

// --- FIX 1: support-request ownership enforced before any write --------------
const createBody = m0124.slice(
  m0124.indexOf('create or replace function recoveryos.create_booking_request'),
  m0124.indexOf('create or replace function recoveryos.propose_booking_times'),
);
assert(
  'ownership check matches support_requests.person_id to the booking participant',
  /sr\.id = p_support_request_id[\s\S]{0,120}sr\.person_id = p_participant_person_id/i.test(createBody),
);
assert(
  'foreign support requests are rejected with support_request_mismatch',
  createBody.includes('support_request_mismatch'),
);
assert(
  'ownership is checked BEFORE the booking_requests insert',
  createBody.indexOf('support_request_mismatch') <
    createBody.indexOf('insert into recoveryos.booking_requests'),
);

// --- FIX 2: replacement times validated BEFORE deactivating the round --------
const proposeBody = m0124.slice(
  m0124.indexOf('create or replace function recoveryos.propose_booking_times'),
);
assert(
  'no_valid_times is decided BEFORE proposals are deactivated',
  proposeBody.includes('no_valid_times') &&
    proposeBody.indexOf('no_valid_times') < proposeBody.indexOf('set is_active = false'),
);
assert(
  'validation counts strictly future timestamps',
  /unnest\(coalesce\(p_starts, array\[\]::timestamptz\[\]\)\)[\s\S]{0,80}> now\(\)/i.test(proposeBody),
);

// --- Grants stay locked down (mirrors 0121 posture) --------------------------
assert(
  'both functions revoked from public/anon in 0124',
  /revoke execute on function recoveryos\.create_booking_request[\s\S]{0,120}from public, anon/i.test(
    m0124,
  ) && /revoke execute on function recoveryos\.propose_booking_times[\s\S]{0,80}from public, anon/i.test(m0124),
);

// --- Migration discipline: the fix is additive, never retro-edited into 0100 --
assert(
  '0100 (applied live) is NOT retro-edited with the ownership fix',
  !m0100.includes('support_request_mismatch'),
);
assert(
  'counter_propose_booking_times still delegates (0100) and inherits the fix',
  /counter_propose_booking_times[\s\S]{0,400}return recoveryos\.propose_booking_times/i.test(m0100),
);

let failed = 0;
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}`);
  if (!c.ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} invariant checks passed.`);
process.exit(failed === 0 ? 0 : 1);
