import { readFileSync } from 'node:fs';

// Static invariant guard for the prepared P0 classification-isolation
// migration (SEC-P0-001 / Gate G2). Runnable without a database — asserts the
// security posture is present in source so a future edit cannot silently
// weaken it. The behavioral proof lives in
// supabase/launch/tests/p0_classification_isolation_negative_tests.sql
// (isolated replay / disposable staging only).

const sql = readFileSync(
  'supabase/launch/prepared/0147_classification_authorization_isolation.prepared.sql',
  'utf8',
);
const rollback = readFileSync(
  'supabase/launch/prepared/0147_classification_authorization_isolation.rollback.sql',
  'utf8',
);

const required = [
  [
    'privileged-role vocabulary lists all eight staff/admin keys',
    /'coach', 'navigator', 'residence_staff', 'residence_manager',\s*\n\s*'program_manager', 'administrator', 'executive', 'system_administrator'/,
  ],
  [
    'has_role carries the classification guard',
    /create or replace function recoveryos\.has_role[\s\S]*?is_privileged_role\(target_role\)\s*\n\s*and recoveryos\.is_test_fixture\(recoveryos\.current_person_id\(\)\)/,
  ],
  [
    'staff_residence_ids carries the classification guard',
    /create or replace function recoveryos\.staff_residence_ids[\s\S]*?and not recoveryos\.is_test_fixture\(recoveryos\.current_person_id\(\)\)/,
  ],
  [
    'is_residence_manager_of carries the classification guard',
    /create or replace function recoveryos\.is_residence_manager_of[\s\S]*?and not recoveryos\.is_test_fixture\(recoveryos\.current_person_id\(\)\)/,
  ],
  [
    'lead fan-out filters recipients to production persons',
    /trg_lead_notify[\s\S]*?in \('administrator','coach','navigator'\)\s*\n\s*and recoveryos\.is_production_person\(ra\.person_id\)/,
  ],
  [
    'listing fan-out filters recipients to production persons',
    /trg_listing_submission_notify[\s\S]*?in \('administrator','system_administrator'\)\s*\n\s*and recoveryos\.is_production_person\(ra\.person_id\)/,
  ],
  [
    'application-intake fan-out filters recipients to production persons',
    /trg_application_intake_notify[\s\S]*?\('navigator','program_manager','administrator','system_administrator'\)\)\s*\n\s*and recoveryos\.is_production_person\(ra\.person_id\)/,
  ],
  [
    'grant_role_assignment refuses privileged grants to fixtures',
    /'code', 'test_fixture_privilege_blocked'/,
  ],
  [
    'grant_role_assignment decides caller authorization before target lookups',
    /create or replace function recoveryos\.grant_role_assignment[\s\S]*?'not_authorized'[\s\S]*?'person_not_found'[\s\S]*?'test_fixture_privilege_blocked'/,
  ],
  ['participant plane stays non-privileged (documented)', /participant and resident stay non-privileged/],
  ['prepared file reloads PostgREST schema cache', /notify pgrst, 'reload schema';/],
];

const failures = required.filter(([, p]) => !p.test(sql)).map(([name]) => name);

if (!/drop function if exists recoveryos\.is_privileged_role/.test(rollback)) {
  failures.push('rollback drops is_privileged_role');
}
if (/is_test_fixture\(recoveryos\.current_person_id\(\)\)/.test(rollback)) {
  failures.push('rollback restores unguarded definitions (no classification guard)');
}

if (/alter type\s+role_key\b/i.test(sql)) {
  failures.push('0147 contains an unqualified role_key enum reference');
}

if (failures.length) {
  console.error('0147 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
console.log('0147 prepared P0 classification-isolation invariants verified.');
