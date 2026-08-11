#!/usr/bin/env node
// Permanent guardrail (Phase H): fail the build if any DEPLOYABLE / public
// canonical asset reintroduces the retired Supabase project ref. This is the
// source-level companion to the dist-bundle grep in .github/workflows/ci.yml —
// it catches drift BEFORE a build (e.g. a worker var, an Edge Function, a
// package pointing back at the retired project).
//
// The retired ref is allowed ONLY in explicitly designated contexts:
//   - historical documentation & migration notes (docs/**, supabase/**/migrations/**)
//   - the source-intake archive (source-builds/**)
//   - build guards that reference it AS the forbidden pattern (this file,
//     scripts/sync-directory-site.mjs, .github/workflows/**)
//   - the directory template that is YKY-at-rest by design and canonicalized to
//     CQCX at build time by sync-directory-site.mjs
//   - tests that verify this guard
//
// Everything else is scanned. Exit 1 on any hit.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RETIRED_REF = 'ykykeioydvtxpyreshhs'; // legacy/dev project (retired)
const CANONICAL_REF = 'cqcxvwoukyhxyokfwnjm'; // RecoveryOS-Launch (canonical)

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');

// Deployable / public canonical asset roots to scan.
const SCAN_ROOTS = [
  'apps/platform/src',
  'apps/platform/public',
  'apps/platform/dist',
  'packages',
  'workers',
  'supabase/functions',
];

// Paths (relative to repo root) where the retired ref is deliberately allowed.
const ALLOW_PREFIXES = [
  'docs/',
  'source-builds/',
  'supabase/migrations/',
  'supabase/launch/migrations/',
  '.github/workflows/',
  'scripts/sync-directory-site.mjs',
  'scripts/check-no-retired-ref.mjs',
  'sites/recoveryresidence-directory/', // YKY-at-rest template; canonicalized at build
  // Captured legacy Edge Functions from the retired project — frozen migration
  // sources per docs/architecture/canonical-frontend-decision.md. They are
  // archive, NOT canonical deployables, and must never be deployed against the
  // canonical project (tracked in the audit drift register).
  'supabase/functions/README.md',
  'supabase/functions/coaching/',
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.turbo', 'dist-types']);

function isAllowed(relPath) {
  return ALLOW_PREFIXES.some((p) => relPath === p || relPath.startsWith(p));
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // missing root (e.g. dist before build) is fine
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
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (st.isFile()) {
      yield full;
    }
  }
}

const hits = [];
for (const root of SCAN_ROOTS) {
  for (const file of walk(join(repoRoot, root))) {
    const rel = relative(repoRoot, file);
    if (isAllowed(rel)) continue;
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (text.includes(RETIRED_REF)) {
      text.split('\n').forEach((line, i) => {
        if (line.includes(RETIRED_REF)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 160)}`);
      });
    }
  }
}

if (hits.length > 0) {
  console.error(
    `\n✖ Retired Supabase project ref "${RETIRED_REF}" found in deployable canonical assets.\n` +
      `  New public submissions must target the canonical RecoveryOS-Launch project (${CANONICAL_REF}).\n` +
      `  If this occurrence is legitimately historical/archival, add its path to ALLOW_PREFIXES\n` +
      `  in scripts/check-no-retired-ref.mjs with a justification.\n`,
  );
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}

console.log(`✓ No retired ref (${RETIRED_REF}) in deployable canonical assets. Canonical = ${CANONICAL_REF}.`);
