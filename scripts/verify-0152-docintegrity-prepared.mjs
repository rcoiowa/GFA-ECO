#!/usr/bin/env node
// verify-0152-docintegrity-prepared.mjs
//
// STATIC, OFFLINE verifier for the PREPARED consolidated Grace House
// document-integrity correction (docs/corrections/2026-09-23-grace-house-doc-integrity/).
//
// This is deliberately SEPARATE from scripts/verify-prepared-chain.mjs: the
// 0147–0151 Gate-A manifest lock is not modified. 0152 lives outside
// supabase/launch/prepared/ and supabase/launch/migrations/ until it is
// promoted under a separate explicit apply authorization.
//
// It proves three things without touching any database:
//   1. The prepared and rollback SQL files are byte-for-byte the reviewed
//      artifacts (file sha256 == pinned).
//   2. Each of the four superseding editions embedded in the prepared SQL
//      hashes (sha256 of body_markdown) to the pinned full-edition hash — the
//      same value the DB trigger (0139) will compute and the postchecks assert.
//   3. The prepared SQL still declares every pinned placeholder hash and full
//      hash in its precheck/postcheck baselines (guards against a silent edit
//      to the expected-hash constants).
//
// Exit non-zero on any mismatch.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIR = join(ROOT, 'docs', 'corrections', '2026-09-23-grace-house-doc-integrity');
const PREPARED = join(DIR, '0152_grace_house_document_integrity.prepared.sql');
const ROLLBACK = join(DIR, '0152_grace_house_document_integrity.rollback.sql');

// --- pinned file digests (re-pin only under review) ---
const FILE_PINS = {
  [PREPARED]: '2dce28e7ad491b5ed82e48212568ce120ed205ddf1e786d2161dcd672cf66e0c',
  [ROLLBACK]: 'eb6252fe96e0c47052e27ff82c69aeda687eaacff1b1dc71c7b4cb963763f02f',
};

// --- pinned per-document hashes (body_markdown sha256) ---
// placeholder = live CQCX stub (precheck baseline); full = new superseding edition.
const DOCS = [
  { key: 'emergency_response_protocols', tag: '$b_emergency_response_protocols$',
    placeholder: 'bd3010c48bc3d809695b96b5a28fd18678a0ba5fb2289f2f8ff8a873c5576a34',
    full:        '192952fedf022700f4a1a17a64498c3b8744815d5585c4219f988f95f67bf7f6' },
  { key: 'curfew_pass_policy', tag: '$b_curfew_pass_policy$',
    placeholder: '142fc1e5e53e97c7440ac8519a4d4a42eaf19671654a677de1cf13af2e417bfe',
    full:        'ee19a60d856b0da155561eeecc69c45a6e2106379d7e62ebb35719c25752758f' },
  { key: 'exit_transition_policy', tag: '$b_exit_transition_policy$',
    placeholder: '8e7c46d1866a82c37abfa6e0e37d2b9789b63cdce389da86a4033d10bb88f328',
    full:        '48f3d09c3d8cf198cd69ee76d22ceb04dfb949ccfe69a3e151791b2c1b59f874' },
  { key: 'grievance_policy_form', tag: '$b_grievance_policy_form$',
    placeholder: 'a56c94ceb2afe712ba9c3c64070c9f8b73300333fb7739439473a24843cb0666',
    full:        'a41046d4e868488f1cb099a4f29818df21fba7e7992dafcd6cfa692e2d8e5757' },
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const fails = [];
const ok = (m) => console.log('  ok   ' + m);
const bad = (m) => { fails.push(m); console.log('  FAIL ' + m); };

console.log('verify-0152-docintegrity-prepared: static offline check');

// 1. file digests
for (const [path, pin] of Object.entries(FILE_PINS)) {
  let bytes;
  try { bytes = readFileSync(path); }
  catch { bad(`missing file: ${path}`); continue; }
  const got = sha256(bytes);
  if (got === pin) ok(`file sha256 ${path.split('/').pop()} = ${pin}`);
  else bad(`file sha256 ${path.split('/').pop()} = ${got} != pinned ${pin}`);
}

// 2 + 3. embedded bodies and declared baselines
const sql = readFileSync(PREPARED, 'utf8');
for (const d of DOCS) {
  const i = sql.indexOf(d.tag);
  const j = i < 0 ? -1 : sql.indexOf(d.tag, i + d.tag.length);
  if (i < 0 || j < 0) { bad(`${d.key}: dollar-quoted body ${d.tag} not found`); continue; }
  const body = sql.slice(i + d.tag.length, j);
  const got = sha256(Buffer.from(body, 'utf8'));
  if (got === d.full) ok(`${d.key}: embedded body -> ${d.full}`);
  else bad(`${d.key}: embedded body hashes ${got} != pinned full ${d.full}`);

  if (sql.includes(d.placeholder)) ok(`${d.key}: precheck declares placeholder ${d.placeholder.slice(0, 12)}…`);
  else bad(`${d.key}: prepared SQL no longer declares placeholder hash ${d.placeholder}`);
  if (sql.includes(d.full)) ok(`${d.key}: postcheck declares full ${d.full.slice(0, 12)}…`);
  else bad(`${d.key}: prepared SQL no longer declares full hash ${d.full}`);
}

// 4. withdrawal set + immutability guardrails present
for (const k of [
  'complete_operational_system', 'code_of_ethics', 'incident_report_system',
  'change_course_leaders_policy', 'narr_ii_self_assessment',
  'form_application_prescreening', 'intake_forms_package',
]) {
  if (sql.includes(`'${k}'`)) ok(`withdrawal set includes ${k}`);
  else bad(`withdrawal set missing ${k}`);
}
if (/update\s+(recoveryos\.)?document_versions\b/i.test(sql)) bad('prepared SQL UPDATEs document_versions (must supersede, never mutate)');
else ok('no UPDATE of document_versions (supersede-only)');
if (/delete\s+from\s+recoveryos\.document_versions/i.test(sql)) bad('prepared SQL DELETEs document_versions (forbidden in forward migration)');
else ok('no DELETE of document_versions in forward migration');

if (fails.length) {
  console.error(`\nFAILED: ${fails.length} check(s).`);
  process.exit(1);
}
console.log('\nPASS: 0152 prepared + rollback artifacts verified (static).');
