import { readFileSync } from 'node:fs';

// Static invariant guard for prepared 0150 (R1 D3, evidence-preservation
// condition): consent-evidence columns exist, arrive as a pair, and NOTHING
// backfills or infers historical evidence.

const sql = readFileSync(
  'supabase/launch/prepared/0150_intake_consent_evidence.prepared.sql',
  'utf8',
);

const failures = [];
const need = (name, re) => {
  if (!re.test(sql)) failures.push(name);
};

need('adds consent_notice_version', /add column if not exists consent_notice_version text/);
need('adds consent_at', /add column if not exists consent_at timestamptz/);
need(
  'evidence arrives as a pair',
  /check \(\(consent_notice_version is null\) = \(consent_at is null\)\)/,
);
need('legacy-unknown documented on both columns', /LEGACY-UNKNOWN[\s\S]*LEGACY-UNKNOWN/);
need('never-inferred rule documented', /Never backfilled, never inferred/);

// The evidence-preservation condition: no statement may write the table.
const statements = sql
  .split('\n')
  .filter((l) => !l.trimStart().startsWith('--'))
  .join('\n');
if (/\bupdate\s+recoveryos\.residence_application_intake\b/i.test(statements)) {
  failures.push('0150 contains a backfill UPDATE (forbidden by the D3 condition)');
}
if (/\binsert\s+into\s+recoveryos\.residence_application_intake\b/i.test(statements)) {
  failures.push('0150 inserts rows (forbidden)');
}
if (/\bdefault\s+now\(\)/i.test(statements)) {
  failures.push('0150 defaults consent evidence from the clock (evidence must come from the receiver)');
}

if (failures.length) {
  console.error('0150 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
console.log('0150 prepared consent-evidence invariants verified.');
