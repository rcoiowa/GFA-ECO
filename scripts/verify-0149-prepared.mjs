import { readFileSync } from 'node:fs';

// Static invariant guard for the prepared G3 exposure-hardening migration
// (SEC-DB-001 findings F1/F2/F3). Behavioral proof lives in the G3 audit
// (exploit tests on the isolated replay).

const sql = readFileSync(
  'supabase/launch/prepared/0149_view_and_function_exposure_hardening.prepared.sql',
  'utf8',
);
const rollback = readFileSync(
  'supabase/launch/prepared/0149_view_and_function_exposure_hardening.rollback.sql',
  'utf8',
);

const required = [
  [
    'directory view loses client writes',
    /revoke insert, update, delete on recoveryos\.residence_directory_public from anon, authenticated;/,
  ],
  [
    'check-ins staff view loses client writes',
    /revoke insert, update, delete on recoveryos\.check_ins_staff_view from anon, authenticated;/,
  ],
  [
    'narr_auto_evidence loses every client execute',
    /revoke execute on function recoveryos\.narr_auto_evidence\(bigint, text, text\) from public, anon, authenticated;/,
  ],
  [
    'has_role execute becomes explicit (authenticated only)',
    /revoke execute on function recoveryos\.has_role\(recoveryos\.role_key\) from public, anon;/,
  ],
  [
    'global default privileges stop granting PUBLIC execute (FOR ROLE postgres)',
    /alter default privileges for role postgres revoke execute on functions from public;/,
  ],
  [
    'scope note documents why the global form is required',
    /schema-scoped ALTER DEFAULT PRIVILEGES [\s\S]*?cannot remove the built-in PUBLIC/i,
  ],
  ['schema cache reload', /notify pgrst, 'reload schema';/],
];

const failures = required.filter(([, p]) => !p.test(sql)).map(([name]) => name);

// The prepared file must never (re)grant anon anything (comments excluded).
const sqlStatements = sql
  .split('\n')
  .filter((l) => !l.trimStart().startsWith('--'))
  .join('\n');
if (/grant [^;]*to [^;]*anon/i.test(sqlStatements)) {
  failures.push('prepared 0149 grants something to anon');
}
// The rollback must restore the exposures it documents.
if (!/grant execute on function recoveryos\.narr_auto_evidence/.test(rollback)) {
  failures.push('rollback restores narr_auto_evidence PUBLIC execute');
}

if (failures.length) {
  console.error('0149 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
console.log('0149 prepared exposure-hardening invariants verified.');
