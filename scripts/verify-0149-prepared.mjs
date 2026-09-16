import { readFileSync } from 'node:fs';

// Static invariant guard for the REVISED prepared 0149 (2026-09-15 edition).
// Superset of the PR #7 lineage guard: keeps every original invariant and adds
// the classification-alignment invariants (revision record R1–R8). Behavioral
// proof: supabase/launch/tests/p0_intake_classification_negative_tests.sql.

const sql = readFileSync(
  'supabase/launch/prepared/0149_shared_intake_workflow.prepared.sql',
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
  // --- classification-alignment invariants (0149R) ---
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
  ['apply-order rule names 0147 and 0148', /Requires 0147[\s\S]*?and 0148/],
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
  failures.push('0149 contains an unqualified role_key enum reference');
}

// Standing control (decision 5, 2026-09-15): after 0148's default-privilege
// hardening, every client-callable function must carry an INTENTIONAL grant;
// trigger/internal-only functions must appear in an explicit revoke or be
// trigger-returning. No function may rely on default ACLs.
// Redefinitions whose ACLs are established by an EARLIER applied migration:
// create-or-replace preserves the existing proacl, so no restatement is needed
// (and the approved artifact hash must not drift for a no-op). Each entry
// names its ACL source.
const aclEstablishedElsewhere = new Set([
  'is_privileged_role', // 0147: revoke public/anon + grant authenticated
]);
for (const m of sql.matchAll(
  /create (?:or replace )?function recoveryos\.([a-z_]+)\s*\([^)]*\)\s*returns\s+(\w+)/gi,
)) {
  const [, fn, returns] = m;
  if (returns.toLowerCase() === 'trigger') continue;
  if (aclEstablishedElsewhere.has(fn)) continue;
  const granted = new RegExp(`grant execute on function[\\s\\S]{0,400}?\\b${fn}\\b`).test(sql);
  const lockedInternal = new RegExp(
    `revoke execute on function[\\s\\S]{0,400}?\\b${fn}\\b[\\s\\S]{0,200}?from[^;]*authenticated`,
  ).test(sql);
  if (!granted && !lockedInternal) {
    failures.push(`function ${fn} relies on default ACLs (no intentional grant or internal lockdown)`);
  }
}

if (failures.length) {
  console.error('0149 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
console.log('0149 (revised) prepared migration invariants verified.');
