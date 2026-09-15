import { readFileSync } from 'node:fs';

// Static invariant guard for the REVISED prepared 0147 (2026-09-15 edition).
// Superset of the PR #7 lineage guard: keeps every original invariant and adds
// the classification-alignment invariants (revision record R1–R8). Behavioral
// proof: supabase/launch/tests/p0_intake_classification_negative_tests.sql.

const sql = readFileSync(
  'supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql',
  'utf8',
);

const required = [
  // --- original PR #7 lineage invariants ---
  ['schema-qualified role enum', /alter type recoveryos\.role_key add value/],
  ['other-note invariant', /leads_triage_note_other_check/],
  ['dormant deadline invariant', /leads_response_due_dormant_check/],
  [
    'linked-intake one-to-one index',
    /create unique index if not exists leads_linked_intake_id_idx/,
  ],
  ['route_lead intake existence check', /'code', 'intake_not_found'/],
  ['route_lead residence match check', /'code', 'intake_residence_mismatch'/],
  ['route_lead duplicate-link envelope', /'code', 'intake_already_linked'/],
  ['route_lead link-interest consistency', /'code', 'link_conflicts_with_interest'/],
  ['route_lead explicit audited unlink', /'lead\.unlinked'/],
  ['reopen rejected until matrix ratified', /'code', 'reopen_not_ratified'/],
  ['record_lead_contact existence check', /'code', 'not_found'\)\s*;\s*end if;\s*if p_outcome/],
  ['assignee queue index', /leads_assignee_status_created_idx/],
  ['contact lead index', /lead_contact_events_lead_occurred_idx/],
  ['contact responder index', /lead_contact_events_responder_idx/],
  ['channel validation', /'code', 'invalid_channel'/],
  ['minutes validation', /'code', 'invalid_minutes'/],
  // --- classification-alignment invariants (0147R) ---
  [
    'is_privileged_role covers the intake roles',
    /is_privileged_role[\s\S]*?'system_administrator',\s*\n\s*'intake_coordinator', 'intake_worker'/,
  ],
  [
    'canonical actor predicate exists',
    /create or replace function recoveryos\.is_production_actor\(\)/,
  ],
  [
    'is_intake_coordinator flows through the canonical boundary',
    /function recoveryos\.is_intake_coordinator\(\)[\s\S]{0,220}?has_role\('intake_coordinator'\) or recoveryos\.is_platform_admin\(\)/,
  ],
  [
    'is_intake_worker flows through the canonical boundary',
    /function recoveryos\.is_intake_worker\(\)[\s\S]{0,220}?has_role\('intake_worker'\)/,
  ],
  [
    'can_work_lead assignment arm carries is_production_actor',
    /function recoveryos\.can_work_lead[\s\S]{0,400}?is_production_actor\(\)/,
  ],
  [
    'leads select policy assignment arm carries is_production_actor',
    /create policy leads_intake_select[\s\S]*?is_production_actor\(\)/,
  ],
  [
    'assign_lead refuses fixture assignees',
    /'code', 'assignee_test_fixture_blocked'/,
  ],
  [
    'assignee picker excludes fixtures',
    /list_intake_assignees[\s\S]*?is_production_person\(pe\.id\)/,
  ],
  [
    'enum-literal safety is deliberate and reverted',
    /set local check_function_bodies = off;[\s\S]*?set local check_function_bodies = on;/,
  ],
  ['apply-order rule names 0148 and 0149', /Requires 0148[\s\S]*?and 0149/],
];

const failures = required.filter(([, p]) => !p.test(sql)).map(([name]) => name);

// The two intake predicates must NOT read role_assignments directly (the exact
// defect the revision removes).
const coordBody = sql.match(/function recoveryos\.is_intake_coordinator\(\)[\s\S]*?\$\$;/)?.[0] ?? '';
const workerBody = sql.match(/function recoveryos\.is_intake_worker\(\)[\s\S]*?\$\$;/)?.[0] ?? '';
if (/role_assignments/.test(coordBody) || /role_assignments/.test(workerBody)) {
  failures.push('an intake predicate reads role_assignments directly');
}
if (/alter type\s+role_key\b/i.test(sql)) {
  failures.push('0147 contains an unqualified role_key enum reference');
}

if (failures.length) {
  console.error('0147 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
console.log('0147 (revised) prepared migration invariants verified.');
