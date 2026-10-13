#!/usr/bin/env node
// verify-support-workflow-authz-prepared.mjs
//
// STATIC invariant guard for the PREPARED support-workflow org-authorization fix
// (supabase/launch/proposed/20261012-support-workflow-org-authorization/). Runs
// without a database: asserts the organization-scoped posture is present in source
// so a future edit cannot silently weaken it. Behavioral proof lives in
// support_workflow_org_authorization_negative_tests.sql (isolated replay only).
//
// Separate from scripts/verify-prepared-chain.mjs — this file is OUTSIDE the
// Gate-A manifest-locked supabase/launch/prepared/ directory.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = 'supabase/launch/proposed/20261012-support-workflow-org-authorization';
const PREPARED = `${DIR}/support_workflow_org_authorization.prepared.sql`;
const ROLLBACK = `${DIR}/support_workflow_org_authorization.rollback.sql`;

const FILE_PINS = {
  [PREPARED]: 'b9ef29fd050604f02205154dd5622b27f8b2c819dd47b67295b88e6c58532884',
  [ROLLBACK]: 'cdda64ec2c410e346d23ad8379888ded3fb9e8b449b78bef6e38d256cd5888e3',
};

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const fails = [];
const ok = (m) => console.log('  ok   ' + m);
const bad = (m) => { fails.push(m); console.log('  FAIL ' + m); };

console.log('verify-support-workflow-authz-prepared: static offline check');

for (const [path, pin] of Object.entries(FILE_PINS)) {
  let bytes;
  try { bytes = readFileSync(path); } catch { bad(`missing file: ${path}`); continue; }
  const got = sha256(bytes);
  if (got === pin) ok(`file sha256 ${path.split('/').pop()}`);
  else bad(`file sha256 ${path.split('/').pop()} = ${got} != pinned ${pin}`);
}

const sql = readFileSync(PREPARED, 'utf8');
const rb = readFileSync(ROLLBACK, 'utf8');

const need = [
  ['F1: no hardcoded organization in prepared relationship inserts',
    () => !/,\s*1,\s*current_date/.test(sql)],
  ['F1: relationship inserts use the request organization (v_org)',
    () => (sql.match(/,\s*v_org,\s*current_date/g) || []).length === 2],
  ['F1: claim resolves org from the request row',
    () => /v_org\s*:?=?\s*[\s\S]{0,40}v_req\.organization_id/.test(sql) || /v_org\s*:=\s*v_req\.organization_id/.test(sql)],
  ['D2: claim refuses a request with no organization (org_unresolved)',
    () => /org_unresolved/.test(sql)],
  ['F2: org-scoped role helper requires an explicit org match (no null-org wildcard)',
    () => /create or replace function recoveryos\.has_role_in_org[\s\S]*?p_org_id is not null and exists[\s\S]*?ra\.organization_id = p_org_id/.test(sql)],
  ['F2: has_role_in_org preserves revocation guard',
    () => /create or replace function recoveryos\.has_role_in_org[\s\S]*?ra\.revoked_at is null/.test(sql)],
  ['F2: has_role_in_org preserves the test-fixture privilege exclusion',
    () => /create or replace function recoveryos\.has_role_in_org[\s\S]*?is_privileged_role\(target_role\)[\s\S]*?is_test_fixture\(recoveryos\.current_person_id\(\)\)/.test(sql)],
  ['F2: claim eligibility is org-scoped (is_coach_staff_in_org / is_navigator_staff_in_org)',
    () => /is_coach_staff_in_org\(v_org\)/.test(sql) && /is_navigator_staff_in_org\(v_org\)/.test(sql)],
  ['F3/F5: open-request list is org-scoped AND keeps the classification (same_world) check',
    () => /list_open_support_requests[\s\S]*?is_support_staff_in_org\(s\.organization_id\)[\s\S]*?same_world\(s\.person_id\)/.test(sql)],
  ['F3: support_requests staff pool policy is org-scoped',
    () => /create policy sr_staff_pool_select[\s\S]*?is_support_staff_in_org\(organization_id\)[\s\S]*?is_admin_staff_in_org\(organization_id\)/.test(sql)],
  ['F4: coaching_relationships staff read is org-scoped admin',
    () => /create policy coaching_rel_staff_select[\s\S]*?is_admin_staff_in_org\(organization_id\)/.test(sql)],
  ['F4: support_request_events admin read is org-scoped via parent request',
    () => /create policy sre_parties_select[\s\S]*?is_admin_staff_in_org\(s\.organization_id\)/.test(sql)],
  ['D3: explicit, logged cross-org handoff RPC gated to admin in the source org',
    () => /create or replace function recoveryos\.handoff_support_request[\s\S]*?is_admin_staff_in_org\(v_req\.organization_id\)[\s\S]*?event_type[\s\S]*?'handoff'/.test(sql)],
  ['helpers are execute-revoked from anon',
    () => /revoke execute on function[\s\S]*?has_role_in_org[\s\S]*?from public, anon/.test(sql)],
  // rollback restores prior live state
  ['rollback restores the hardcoded-org claim (prior live state)',
    () => (rb.match(/,\s*1,\s*current_date/g) || []).length === 2],
  ['rollback drops the org-scoped helpers',
    () => /drop function if exists recoveryos\.has_role_in_org/.test(rb)],
  ['rollback restores global is_admin_staff() policies',
    () => /create policy coaching_rel_staff_select[\s\S]*?is_admin_staff\(\)/.test(rb)],
];

for (const [label, fn] of need) {
  let pass = false;
  try { pass = fn(); } catch (e) { pass = false; }
  pass ? ok(label) : bad(label);
}

if (fails.length) { console.error(`\nFAILED: ${fails.length} check(s).`); process.exit(1); }
console.log('\nPASS: support-workflow org-authorization prepared invariants verified (static).');
