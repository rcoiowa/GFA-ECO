#!/usr/bin/env node
// verify-domain-vocabulary.mjs — CI guard for the RATIFIED domain canon (P1, 2026-08-21).
//
// Pins three surfaces against each other so semantic drift fails the build:
//   1. the 0129 migration seed (SQL source of truth for the database),
//   2. the TypeScript mirror packages/domain/src/domains.ts (frontend source of truth),
//   3. the live need_category vocabulary in packages/domain/src/navigation.ts.
//
// Invariants (docs/architecture/domain-vocabulary-v1.0.md):
//   - exactly the 11 ratified machine keys, identical in SQL and TS;
//   - participant/staff labels identical in SQL and TS (labels may change — but only in BOTH);
//   - 'recovery' and 'community' both present (the hard semantic boundary);
//   - no 'safety', 'trauma', or fused 'recovery_community' key anywhere;
//   - every NEED_CATEGORIES key appears byte-identical as a subcategory in SQL and TS;
//   - identification_documents is cross-cutting (SQL: null domain + is_cross_cutting true;
//     TS: maps to null);
//   - 0129 creates NO Postgres enum (`create type` is prohibited for domains).
//
// Exit 1 on any violation.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const read = (p) => readFileSync(join(repoRoot, p), 'utf8');

const sql = read('supabase/launch/migrations/0129_domain_vocabulary.sql');
const ts = read('packages/domain/src/domains.ts');
const nav = read('packages/domain/src/navigation.ts');

const fail = (msg) => {
  console.error(`✖ domain-vocabulary: ${msg}`);
  process.exitCode = 1;
};

// ---- parse SQL domain seed ---------------------------------------------------------------
const sqlDomains = new Map();
const domainSeedRe = /\('([a-z_]+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*\n?\s*'(?:[^']|'')*',\s*(\d+)\)/g;
const domainBlock = sql.slice(sql.indexOf('insert into recoveryos.domains'), sql.indexOf('insert into recoveryos.domain_subcategories'));
for (const m of domainBlock.matchAll(domainSeedRe)) {
  sqlDomains.set(m[1], {
    participant: m[2].replace(/''/g, "'"),
    staff: m[3].replace(/''/g, "'"),
    sort: Number(m[4]),
  });
}

// ---- parse SQL subcategory seed ----------------------------------------------------------
const sqlSubs = new Map();
const subBlock = sql.slice(sql.indexOf('insert into recoveryos.domain_subcategories'));
const subRe = /\('([a-z_]+)',\s*(null|'[a-z_]+'),\s*'((?:[^']|'')*)',\s*(true|false)\)/g;
for (const m of subBlock.matchAll(subRe)) {
  sqlSubs.set(m[1], {
    domain: m[2] === 'null' ? null : m[2].slice(1, -1),
    crossCutting: m[4] === 'true',
  });
}

// ---- parse TS mirror -----------------------------------------------------------------------
const tsDomains = new Map();
const tsDomainRe = /key:\s*'([a-z_]+)',\s*\n?\s*participantLabel:\s*'((?:[^'\\]|\\.)*)',\s*\n?\s*staffLabel:\s*'((?:[^'\\]|\\.)*)',\s*\n?\s*sort:\s*(\d+)/g;
for (const m of ts.matchAll(tsDomainRe)) {
  tsDomains.set(m[1], { participant: m[2].replace(/\\'/g, "'"), staff: m[3].replace(/\\'/g, "'"), sort: Number(m[4]) });
}
const tsSubs = new Map();
const tsSubRe = /^\s{2}([a-z_]+):\s*(null|'[a-z_]+'),/gm;
const tsSubBlock = ts.slice(ts.indexOf('SUBCATEGORY_DOMAIN'), ts.indexOf('const byKey'));
for (const m of tsSubBlock.matchAll(tsSubRe)) {
  tsSubs.set(m[1], m[2] === 'null' ? null : m[2].slice(1, -1));
}

// ---- parse live need categories (scoped to the NEED_CATEGORIES array only) -----------------
const needStart = nav.indexOf('NEED_CATEGORIES');
const needEnd = nav.indexOf('] as const', needStart);
const needBlock = needStart >= 0 && needEnd > needStart ? nav.slice(needStart, needEnd) : '';
const needKeys = [...needBlock.matchAll(/\{\s*key:\s*'([a-z_]+)',\s*label:/g)].map((m) => m[1]);

// ---- invariants ------------------------------------------------------------------------------
const RATIFIED = [
  'recovery', 'community', 'housing', 'employment_purpose', 'health', 'family',
  'transportation', 'education', 'financial_stability', 'justice', 'other',
];

if (sqlDomains.size !== RATIFIED.length) fail(`SQL seed has ${sqlDomains.size} domains, expected ${RATIFIED.length}`);
if (tsDomains.size !== RATIFIED.length) fail(`TS mirror has ${tsDomains.size} domains, expected ${RATIFIED.length}`);
for (const key of RATIFIED) {
  if (!sqlDomains.has(key)) fail(`SQL seed missing ratified domain '${key}'`);
  if (!tsDomains.has(key)) fail(`TS mirror missing ratified domain '${key}'`);
  const s = sqlDomains.get(key);
  const t = tsDomains.get(key);
  if (s && t) {
    if (s.participant !== t.participant)
      fail(`participant label drift for '${key}': SQL '${s.participant}' vs TS '${t.participant}'`);
    if (s.staff !== t.staff) fail(`staff label drift for '${key}': SQL '${s.staff}' vs TS '${t.staff}'`);
    if (s.sort !== t.sort) fail(`sort drift for '${key}': SQL ${s.sort} vs TS ${t.sort}`);
  }
}
for (const banned of ['safety', 'trauma', 'recovery_community']) {
  if (sqlDomains.has(banned) || tsDomains.has(banned)) fail(`prohibited domain key '${banned}' present`);
}
if (!sqlDomains.has('recovery') || !sqlDomains.has('community')) {
  fail('the Recovery/Community boundary is broken — both must exist as separate domains');
}

if (needKeys.length === 0) fail('could not parse NEED_CATEGORIES from navigation.ts');
for (const key of needKeys) {
  if (!sqlSubs.has(key)) fail(`live need_category '${key}' missing from SQL subcategory seed`);
  if (!tsSubs.has(key)) fail(`live need_category '${key}' missing from TS SUBCATEGORY_DOMAIN`);
  const s = sqlSubs.get(key);
  const t = tsSubs.get(key);
  if (s && tsSubs.has(key) && s.domain !== t) {
    fail(`subcategory '${key}' domain drift: SQL '${s.domain}' vs TS '${t}'`);
  }
  if (s && s.domain !== null && !RATIFIED.includes(s.domain)) {
    fail(`subcategory '${key}' maps to unknown domain '${s.domain}'`);
  }
}
const idDocs = sqlSubs.get('identification_documents');
if (!idDocs || idDocs.domain !== null || !idDocs.crossCutting) {
  fail('identification_documents must be cross-cutting (null domain, is_cross_cutting true)');
}
if (tsSubs.get('identification_documents') !== null) {
  fail('identification_documents must map to null in the TS mirror');
}

if (/create\s+type/i.test(sql)) fail('0129 must not create a Postgres enum (ratification §17)');

if (process.exitCode === 1) process.exit(1);
console.log(
  `✓ domain-vocabulary: ${RATIFIED.length} ratified domains + ${needKeys.length} subcategories pinned (SQL ↔ TS ↔ live keys), Recovery ≠ Community intact.`,
);
