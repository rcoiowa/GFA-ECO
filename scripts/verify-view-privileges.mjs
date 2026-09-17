#!/usr/bin/env node
// verify-view-privileges.mjs — static guard for the P0-1 view-exposure class (2026-08-21).
//
// Why this exists: a plain Postgres view executes with its OWNER's privileges and therefore
// bypasses RLS on the tables it reads. 0110_table_grants.sql grants SELECT on "all tables in
// schema recoveryos" to `authenticated` — which includes views — and its
// `alter default privileges` rule captures FUTURE views too. The 0008 analytics views shipped
// owner-privileged and client-readable for months before 0125 closed them.
//
// Rule enforced (mirrors launch_contract_check.sql step 9, but statically, pre-merge):
// every view created in supabase/launch/migrations/** must, in its own file or a later
// migration, either
//   (a) be created/altered with security_invoker = true, or
//   (b) have its client privileges revoked (`revoke … on <view> from … anon/authenticated`),
// unless explicitly allowlisted below with a justification.
//
// Exit 1 on any unguarded view.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const dir = join(repoRoot, 'supabase', 'launch', 'migrations');

// Deliberately client-readable curated projections. Each entry needs a reason.
const ALLOW = new Map([
  [
    'residence_directory_public',
    'anon directory projection — column-curated, no address/postal, documented in 0122',
  ],
]);

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const corpus = files.map((f) => ({
  file: f,
  text: readFileSync(join(dir, f), 'utf8').toLowerCase(),
}));

const viewRe = /create\s+(?:or\s+replace\s+)?view\s+(?:recoveryos\.)?([a-z0-9_]+)/g;

const failures = [];
for (let i = 0; i < corpus.length; i++) {
  for (const m of corpus[i].text.matchAll(viewRe)) {
    const view = m[1];
    if (ALLOW.has(view)) continue;

    // Search this file from the creation onward, plus every later file, for a guard.
    const scope = [corpus[i].text.slice(m.index), ...corpus.slice(i + 1).map((c) => c.text)];
    const invokerRe = new RegExp(
      `(create\\s+(?:or\\s+replace\\s+)?view\\s+(?:recoveryos\\.)?${view}[\\s\\S]{0,200}?with\\s*\\([^)]*security_invoker[^)]*\\))` +
        `|(alter\\s+view\\s+(?:recoveryos\\.)?${view}\\s+set\\s*\\([^)]*security_invoker\\s*=\\s*true[^)]*\\))`,
    );
    const revokeRe = new RegExp(
      `revoke\\s+[a-z, ]+\\s+on\\s+[^;]*(?:recoveryos\\.)?${view}[^;]*from[^;]*(anon|authenticated)`,
    );
    const guarded = scope.some((t) => invokerRe.test(t) || revokeRe.test(t));
    if (!guarded) {
      failures.push(`${corpus[i].file}: view "${view}" is neither security_invoker nor revoked from client roles`);
    }
  }
}

if (failures.length > 0) {
  console.error(
    '\n✖ Owner-privileged view(s) reachable by client roles (RLS bypass class — see 0125):\n',
  );
  for (const f of failures) console.error('  ' + f);
  console.error(
    '\n  Fix: set security_invoker = true, or revoke anon/authenticated privileges in the',
  );
  console.error('  creating migration — or allowlist here with a written justification.\n');
  process.exit(1);
}

console.log(`✓ view-privilege guard: ${files.length} migrations scanned, no unguarded client-readable view.`);
