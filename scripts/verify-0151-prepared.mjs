import { readFileSync } from 'node:fs';

// Static invariant guard for prepared 0151 (R1 D4 option b — strict
// fail-closed classification semantics). Behavioral proof:
// supabase/launch/tests/p0_strict_classification_negative_tests.sql.

const sql = readFileSync(
  'supabase/launch/prepared/0151_strict_classification_semantics.prepared.sql',
  'utf8',
);
const rollback = readFileSync(
  'supabase/launch/prepared/0151_strict_classification_semantics.rollback.sql',
  'utf8',
);

const failures = [];
const need = (name, re, text = sql) => {
  if (!re.test(text)) failures.push(name);
};

need(
  'is_production_person requires an EXPLICIT production row',
  /function recoveryos\.is_production_person[\s\S]{0,400}?classification = 'production'/,
);
need(
  'is_production_actor routes through is_production_person',
  /function recoveryos\.is_production_actor\(\)[\s\S]{0,260}?is_production_person\(recoveryos\.current_person_id\(\)\)/,
);
need(
  'has_role privileged arm requires production classification',
  /function recoveryos\.has_role[\s\S]{0,700}?not recoveryos\.is_privileged_role\(target_role\)\s*\n\s*or recoveryos\.is_production_person\(recoveryos\.current_person_id\(\)\)/,
);
need(
  'staff_residence_ids requires production classification',
  /function recoveryos\.staff_residence_ids[\s\S]{0,500}?and recoveryos\.is_production_person\(recoveryos\.current_person_id\(\)\)/,
);
need(
  'is_residence_manager_of requires production classification',
  /function recoveryos\.is_residence_manager_of[\s\S]{0,500}?and recoveryos\.is_production_person\(recoveryos\.current_person_id\(\)\)/,
);
need('grant RPC refuses unclassified privileged targets', /'code', 'person_unclassified'/);
// Revision-2 anti-disclosure ordering must survive 0151's re-definition:
// caller authorization ('not_authorized') precedes every target-dependent code.
need(
  'grant RPC keeps caller authorization before target lookups',
  /create or replace function recoveryos\.grant_role_assignment[\s\S]*?'not_authorized'[\s\S]*?'person_not_found'[\s\S]*?'test_fixture_privilege_blocked'[\s\S]*?'person_unclassified'/,
);
need('grant RPC keeps the fixture code', /'code', 'test_fixture_privilege_blocked'/);
need('assign_lead refuses unclassified assignees', /'code', 'assignee_unclassified'/);
need('assign_lead keeps the fixture code', /'code', 'assignee_test_fixture_blocked'/);
need('pre-apply zero-missing STOP condition documented', /STOP AND INVESTIGATE/);
need('rollback restores the lenient 0030 semantics', /select not recoveryos\.is_test_fixture\(p_person_id\);/, rollback);

// Grant-discipline sweep (decision 5 standing control). Every function here is
// a REDEFINITION whose ACLs an earlier applied migration established
// (create-or-replace preserves proacl): is_production_person (0030),
// is_production_actor (0149R), has_role/staff_residence_ids (0148),
// is_residence_manager_of (0115), grant_role_assignment (0117),
// assign_lead (0149R).
const aclEstablishedElsewhere = new Set([
  'is_production_person',
  'is_production_actor',
  'has_role',
  'staff_residence_ids',
  'is_residence_manager_of',
  'grant_role_assignment',
  'assign_lead',
]);
for (const m of sql.matchAll(
  /create (?:or replace )?function recoveryos\.([a-z_]+)\s*\([^)]*\)\s*returns\s+(\w+)/gi,
)) {
  const [, fn, returns] = m;
  if (returns.toLowerCase() === 'trigger') continue;
  if (aclEstablishedElsewhere.has(fn)) continue;
  failures.push(`function ${fn} is new here and needs an intentional grant or lockdown`);
}

if (failures.length) {
  console.error('0151 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
console.log('0151 prepared strict-classification invariants verified.');
