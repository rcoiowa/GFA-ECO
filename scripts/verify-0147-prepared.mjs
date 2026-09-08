import { readFileSync } from 'node:fs';

const sql = readFileSync(
  'supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql',
  'utf8',
);
const required = [
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
];
const failures = required.filter(([, p]) => !p.test(sql)).map(([name]) => name);
if (failures.length) {
  console.error('0147 prepared migration guard failed:', failures.join(', '));
  process.exit(1);
}
if (/alter type\s+role_key\s+add value/i.test(sql)) {
  console.error('0147 contains an unqualified role_key enum reference.');
  process.exit(1);
}
console.log('0147 prepared migration invariants verified.');
