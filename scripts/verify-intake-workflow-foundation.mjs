#!/usr/bin/env node
// Static safety invariants for migration 0147. Live authorization behavior
// remains a later activation gate using verified staff identities.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const sql = readFileSync(
  join(repoRoot, 'supabase/launch/migrations/0147_intake_workflow_foundation.sql'),
  'utf8',
);

const checks = [];
const assert = (name, condition) => checks.push({ name, ok: Boolean(condition) });

assert('extends canonical recoveryos.leads', /alter table recoveryos\.leads/i.test(sql));
assert(
  'does not create a parallel lead table',
  !/create table recoveryos\.(intake_)?leads\b/i.test(sql),
);

for (const stage of ['new', 'assigned', 'contacted', 'waiting', 'scheduled', 'closed']) {
  assert(`queue stage includes ${stage}`, new RegExp(`'${stage}'`).test(sql));
}

assert('captures response deadline', /response_due_at timestamptz/i.test(sql));
assert('captures founder partnership deadline', /founder_response_due_at timestamptz/i.test(sql));
assert('captures overdue follow-up source', /next_follow_up_at timestamptz/i.test(sql));
assert('dedupes source records', /unique index leads_source_record_unique_idx/i.test(sql));

assert(
  'uses intake-specific membership',
  /create table recoveryos\.intake_team_members/i.test(sql),
);
assert(
  'membership has coordinator and worker only',
  /access_level in \('coordinator', 'worker'\)/i.test(sql),
);
assert(
  'does not alter broad role assignments',
  !/alter table recoveryos\.role_assignments/i.test(sql),
);
assert(
  'does not seed staff people or memberships',
  !/insert into recoveryos\.(people|role_assignments|intake_team_members)/i.test(sql),
);

assert(
  'housing path is explicit',
  /womens_recovery_housing[\s\S]*mens_recovery_housing[\s\S]*unsure/i.test(sql),
);
assert('ambiguous housing has confirm-route state', /confirm_route/i.test(sql));
assert('documents the no-name-inference rule', /Never derive this value from a name/i.test(sql));

for (const table of ['intake_team_members', 'intake_routing_rules', 'intake_contact_events']) {
  assert(
    `${table} has RLS enabled`,
    new RegExp(`alter table recoveryos\\.${table} enable row level security`, 'i').test(sql),
  );
  assert(
    `${table} revokes client access`,
    new RegExp(`revoke all on recoveryos\\.${table} from public, anon, authenticated`, 'i').test(
      sql,
    ),
  );
}

for (const field of [
  'actor_person_id',
  'occurred_at',
  'channel',
  'outcome',
  'minutes_spent',
  'next_follow_up_at',
]) {
  assert(`contact log captures ${field}`, new RegExp(`\\b${field}\\b`, 'i').test(sql));
}

assert(
  'contact log is identified as non-clinical',
  /not a clinical note or participant outcome record/i.test(sql),
);
assert(
  'contact history is not cascade-deleted with a lead',
  !/lead_id bigint[^\n]*on delete cascade/i.test(sql),
);
assert('does not send email', !/(resend\.com|sendgrid|mailgun|smtp)/i.test(sql));
assert('does not reference the retired backend', !sql.includes('ykykeioydvtxpyreshhs'));

let failures = 0;
for (const check of checks) {
  console.log(`${check.ok ? '✓' : '✗'} ${check.name}`);
  if (!check.ok) failures += 1;
}

console.log(`\n${checks.length - failures}/${checks.length} intake-foundation invariants passed.`);
process.exit(failures === 0 ? 0 : 1);
