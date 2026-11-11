/** Offline review gate. Never connects to a database; SQL review is still required. */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
export function checkTableAccess(root) {
  const policy = JSON.parse(
    readFileSync(resolve(root, 'docs/readiness/2026-10-30/table-access-manifest.json'), 'utf8'),
  );
  const errors = [];
  const directory = 'supabase/launch/migrations';
  const files = readdirSync(resolve(root, directory))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const hash = (s) => createHash('sha256').update(s).digest('hex');
  for (const [file, digest] of Object.entries(policy.appliedHistory)) {
    try {
      if (hash(readFileSync(resolve(root, file))) !== digest)
        errors.push(`Applied history changed: ${file}`);
    } catch {
      errors.push(`Applied history missing: ${file}`);
    }
  }
  for (const name of files) {
    const file = `${directory}/${name}`;
    if (policy.appliedHistory[file]) continue;
    const sql = readFileSync(resolve(root, file), 'utf8');
    const review = policy.newMigrations[file];
    if (!review || review.sha256 !== hash(sql) || !review.reviewer || !review.rationale) {
      errors.push(`Missing exact-SQL review: ${file}`);
      continue;
    }
    // Deliberately conservative: quoted/dynamic/LIKE/AS SQL requires manual review too.
    const creates = [
      ...sql
        .replace(/--[^\n]*/g, '')
        .matchAll(/create\s+(?:unlogged\s+)?table\s+(?:if\s+not\s+exists\s+)?([\w".]+)/gi),
    ];
    for (const [, table] of creates) {
      const entry = review.tables?.[table];
      if (!/^(public|recoveryos)\.[a-z_][a-z_0-9]*$/.test(table) || !entry) {
        errors.push(`Missing qualified table decision: ${file}: ${table}`);
        continue;
      }
      if (!entry.rlsEvidence || !entry.denialTests || !entry.rpcReview)
        errors.push(`Incomplete RLS/RPC/test evidence: ${table}`);
      for (const role of ['PUBLIC', 'anon', 'authenticated', 'service_role']) {
        const decision = entry.roles?.[role];
        if (
          !decision ||
          !decision.reason ||
          !decision.sqlEvidence ||
          !Array.isArray(decision.privileges) ||
          decision.privileges.some((p) => !['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(p))
        )
          errors.push(`Missing explicit grant/no-access decision: ${table}: ${role}`);
      }
    }
  }
  return errors;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const errors = checkTableAccess(process.cwd());
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log('PASS table access review gate (historical checksums intact; new SQL reviewed)');
}
