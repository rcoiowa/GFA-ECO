#!/usr/bin/env node
// ICARE governance regression guard (Authority §20).
//
// Fails the build if prohibited behavior appears in EXECUTABLE / SOURCE
// implementation surfaces or active schema/config. Patterns are deliberately
// code-shaped (identifiers, column names, calls, numeric thresholds) so that
// prohibition *prose* — in the Authority, in docs, in Grace's own "never alert
// staff" comments — does not trip them.
//
// Scope: packages, apps/platform/src, workers, supabase/launch/migrations,
// supabase/functions. NOT scanned: docs/** (incl. the Authority + research +
// archive), root governance files (CLAUDE.md, icare-implementation-lock.json),
// tests, node_modules, dist. Inline escape hatch: a line containing
// `icare-governance-allow` is skipped (use rarely, with justification).
//
// Governed-but-not-auto-detected (too brittle to regex without false positives;
// enforced by the Authority + icare-implementation-lock.json instead): the 47
// benchmark being wired to automation in general code. Grace-scoped risk/stage/
// notification writes ARE detected below.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const SCAN_ROOTS = [
  'packages',
  'apps/platform/src',
  'workers',
  'supabase/launch/migrations',
  'supabase/functions',
];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.turbo']);
const isTest = (p) => /\.(test|spec)\.[tj]sx?$/.test(p) || /(^|\/)__tests__\//.test(p);
const isSelf = (p) => p.endsWith('scripts/check-icare-governance.mjs');

// Global prohibited patterns (any scanned file).
const GLOBAL = [
  { id: 'barc_subdomain_scoring', re: /barc[_a-z0-9]*sub(_?domain|scale)|\bsub(domain|scale)_score\b/i },
  { id: 'crisis_threshold', re: /crisis[_-]?(threshold|range|cutoff)/i },
  { id: 'barc_le35_crisis_logic', re: /(barc|total_?score|recovery_?capital)[^\n]{0,40}(<=\s*35|<\s*36)\b/i },
  { id: 'emotion_inference', re: /(infer|detect|classif\w*)[_-]?emotion|emotion[_-]?(infer|detect|classif\w*|score)|sentiment[_-]?score|facial[_-]?(emotion|expression)[_-]?(score|detect|classif\w*)|(vocal|voice)[_-]?tone[_-]?(score|detect|classif\w*)|mood[_-]?inference/i },
  // Code-shaped identifier (psychographicProfile, psychographic_score, …), NOT
  // the bare word in a "no psychographic tables are read" prohibition comment.
  { id: 'psychographic_profiling', re: /psychographic[_-]?(profil\w*|scor\w*|table|type|segment\w*)/i },
  { id: 'silent_staff_alert', re: /silent[_-]?(staff[_-]?)?alert/i },
];

// Grace-scoped patterns (only inside supabase/functions/grace/**).
const GRACE = [
  { id: 'grace_writes_notification', re: /\bemit_notification\s*\(/ },
  { id: 'grace_derives_risk_or_stage', re: /\b(risk[_-]?score|icare[_-]?stage)\b/i },
  { id: 'grace_staff_alert_or_escalate', re: /\b(notify_?staff|alert_?staff)\s*\(|\bescalate\s*\(/i },
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walk(full);
    else if (st.isFile()) yield full;
  }
}

const hits = [];
for (const root of SCAN_ROOTS) {
  for (const file of walk(join(repoRoot, root))) {
    const rel = relative(repoRoot, file);
    if (isTest(rel) || isSelf(rel)) continue;
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|sql|toml|json)$/.test(rel)) continue;
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const inGrace = rel.includes('supabase/functions/grace/');
    const rules = inGrace ? [...GLOBAL, ...GRACE] : GLOBAL;
    text.split('\n').forEach((line, i) => {
      if (line.includes('icare-governance-allow')) return;
      for (const rule of rules) {
        if (rule.re.test(line)) {
          hits.push(`${rel}:${i + 1} [${rule.id}] ${line.trim().slice(0, 160)}`);
        }
      }
    });
  }
}

if (hits.length > 0) {
  console.error(
    '\n✖ ICARE governance guard: prohibited behavior found in implementation surfaces.\n' +
      '  Governing authority: docs/product/recoveryos-icare-integration-authority-v1.0.md\n' +
      '  If a match is a legitimate false positive, add `icare-governance-allow` on the line with a\n' +
      '  justification, or narrow the code. Prohibited categories: BARC subdomain scoring, ≤35 crisis\n' +
      '  logic, crisis thresholds, passive emotion inference, psychographic profiling, silent staff\n' +
      '  alerts, and (in Grace) risk/stage derivation or staff notification.\n',
  );
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}

console.log('✓ ICARE governance guard: no prohibited behavior in implementation surfaces.');
