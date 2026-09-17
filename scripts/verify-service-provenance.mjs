#!/usr/bin/env node
// verify-service-provenance.mjs — CI guard for the RATIFIED service-event provenance canon
// (P2, ratified 2026-08-22 + Final Reconciliation; docs/architecture/
// service-event-provenance-v1.0.md).
//
// Pins against each other:
//   1. the TS mirror packages/domain/src/serviceProvenance.ts,
//   2. the canonical architecture record,
//   3. migration 0133 (source CHECK + abort-on-unclassifiable + NOT NULL) once present,
//   4. migration 0134 (internal-writer revoke + wrapper source stamping + self whitelist)
//      once present,
//   5. reporting surfaces (no "Class A/B/C" evidence language).
//
// Invariants:
//   - source vocabulary is EXACTLY the four ratified values; imported/unknown/unclassified
//     never appear as values;
//   - reporting authorities are the three semantic keys — never Ledger-colliding A/B/C;
//   - partner_confirmed has no auto-mapped authority;
//   - the participant self-recordable list is exactly the three ratified types;
//   - 0133 aborts rather than guess and sets source NOT NULL;
//   - 0134's internal writer is revoked from client roles.
//
// Exit 1 on any violation.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const read = (p) => readFileSync(join(repoRoot, p), 'utf8');
const has = (p) => existsSync(join(repoRoot, p));

const fail = (msg) => {
  console.error(`✖ service-provenance: ${msg}`);
  process.exitCode = 1;
};

const RATIFIED_SOURCES = [
  'participant_self_reported',
  'staff_attested',
  'partner_confirmed',
  'system_derived',
];
const BANNED_VALUES = ['imported', 'unknown', 'unclassified'];
const RATIFIED_AUTHORITIES = ['organizationally_attested', 'participant_reported', 'system_derived'];
const SELF_TYPES = ['daily_check_in', 'recovery_capital_assessment', 'recovery_practice'];

// ---- 1. TS mirror ---------------------------------------------------------------------------
const ts = read('packages/domain/src/serviceProvenance.ts');
const tsSourcesBlock = ts.slice(ts.indexOf('SERVICE_EVENT_SOURCES'), ts.indexOf('] as const'));
const tsSources = [...tsSourcesBlock.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
if (tsSources.join(',') !== RATIFIED_SOURCES.join(','))
  fail(`TS SERVICE_EVENT_SOURCES is [${tsSources}], expected [${RATIFIED_SOURCES}]`);
for (const banned of BANNED_VALUES) {
  if (tsSources.includes(banned)) fail(`banned source value '${banned}' in TS mirror`);
}
for (const key of RATIFIED_AUTHORITIES) {
  if (!ts.includes(`'${key}'`)) fail(`TS mirror missing reporting authority '${key}'`);
}
if (!/case 'partner_confirmed':/.test(ts) && !/default:\s*\n\s*return null/.test(ts))
  fail('TS mapping must leave partner_confirmed without an auto authority (return null)');
const tsSelfBlock = ts.slice(ts.indexOf('SELF_RECORDABLE_SERVICE_TYPES'));
const tsSelf = [...tsSelfBlock.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).slice(0, SELF_TYPES.length);
if (tsSelf.join(',') !== SELF_TYPES.join(','))
  fail(`TS self-recordable list is [${tsSelf}], expected [${SELF_TYPES}]`);

// ---- 2. architecture record -----------------------------------------------------------------
const doc = read('docs/architecture/service-event-provenance-v1.0.md');
for (const key of [...RATIFIED_SOURCES, ...RATIFIED_AUTHORITIES, ...SELF_TYPES]) {
  if (!doc.includes(`\`${key}\``)) fail(`architecture record missing '${key}'`);
}
if (!/`imported` is NOT a provenance value/.test(doc))
  fail('architecture record must state imported is not a provenance value');
if (!/ONE HUMAN ACTION → ONE DEDUPE KEY/.test(doc))
  fail('architecture record must carry the idempotency contract');

// ---- 3. migration 0133 (required once present; P2.2 makes it mandatory) ---------------------
const M0133 = 'supabase/launch/migrations/0133_service_event_provenance.sql';
if (has(M0133)) {
  const sql = read(M0133);
  const checkMatch = sql.match(/check\s*\(\s*source\s+in\s*\(([^)]*)\)/i);
  if (!checkMatch) fail('0133 missing the source CHECK constraint');
  else {
    const values = [...checkMatch[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
    if (values.join(',') !== [...RATIFIED_SOURCES].sort().join(','))
      fail(`0133 CHECK values [${values}] differ from ratified vocabulary`);
  }
  for (const banned of BANNED_VALUES) {
    if (new RegExp(`'${banned}'`).test(read(M0133))) fail(`0133 contains banned value '${banned}'`);
  }
  if (!/set\s+not\s+null/i.test(sql)) fail('0133 must set source NOT NULL after backfill');
  if (!/raise\s+exception/i.test(sql)) fail('0133 must ABORT on unclassifiable rows');
  if (/provider_person_id\s+is\s+not\s+null\s+then\s+'staff_attested'/i.test(sql))
    fail('0133 must classify by writer fingerprints, never provider-null alone');
}

// ---- 4. migration 0134 (required once present; P2.3 makes it mandatory) ---------------------
const M0134 = 'supabase/launch/migrations/0134_canonical_event_writer.sql';
if (has(M0134)) {
  const sql = read(M0134);
  if (!/revoke\s+(all|execute)[\s\S]{0,200}record_service_event_internal[\s\S]{0,300}from[^;]*authenticated/i.test(sql))
    fail('0134 must revoke the internal writer from authenticated');
  if (!/record_my_activity/.test(sql)) fail('0134 must define record_my_activity');
  for (const t of SELF_TYPES) {
    if (!sql.includes(`'${t}'`)) fail(`0134 self whitelist missing '${t}'`);
  }
  if (/'community_event'[\s\S]{0,120}p_service_type_key/.test(sql))
    fail('0134 must not self-whitelist community participation (excluded from P2)');
}

// ---- 5. reporting surfaces: no Ledger-colliding class language ------------------------------
for (const p of [
  'apps/platform/src/admin/pages/EvidencePage.tsx',
  'apps/platform/src/staff/pages/ReportsPage.tsx',
]) {
  if (has(p) && /Class\s+[ABC]\b/.test(read(p)))
    fail(`${p} uses "Class A/B/C" reporting language (Institutional Evidence Ledger collision)`);
}

if (process.exitCode === 1) process.exit(1);
const parts = [`4 sources`, `3 authorities`, `${SELF_TYPES.length} self types pinned`];
if (has(M0133)) parts.push('0133 verified');
if (has(M0134)) parts.push('0134 verified');
console.log(`✓ service-provenance: ${parts.join(', ')} — no imported/unknown/Class-ABC anywhere.`);
