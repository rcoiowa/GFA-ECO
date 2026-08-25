#!/usr/bin/env node
// verify-intake-minimization.mjs — CI guard for the RATIFIED Gate B intake constraints
// (docs/plans/gate-b-ejwrh-intake-architecture.md, ratified 2026-08-24; B1–B4).
//
// Invariants pinned:
//   B4 minimization —
//   - is_moud NEVER appears in readiness/admission logic (0142) or as any eligibility
//     signal: MOUD is a care-coordination flag only;
//   - no banned narrative/over-collection columns anywhere in 0139–0142
//     (sud_history, trauma, treatment_narrative, diagnosis, criminal_history, ssn);
//   - supervision staff visibility is GRANT-ANCHORED (policy references grant
//     status/revocation, not bare staff scope);
//   - medication/supervision tables revoke client DML (RPC-only writes).
//   B1 document evidence —
//   - content hash is computed by trigger and set NOT NULL after an abort-on-null check;
//   - published versions + acknowledged assignments have immutability triggers;
//   - acknowledge_document distinguishes signature (signed_at + name) from ack-only;
//   - the frontend acknowledgment path calls the RPC, not a direct table UPDATE.
//   B3 admission gate —
//   - admit_applicant refuses on intake_incomplete, refuses non-overridable overrides,
//     and an override is incomplete without its follow_ups row + audit event;
//   - signature/ack/screening-consent/emergency-contact items are non-overridable.
//
// Exit 1 on any violation.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const read = (p) => readFileSync(join(repoRoot, p), 'utf8');
const has = (p) => existsSync(join(repoRoot, p));
// Comments legitimately NAME the prohibitions; the guard scans executable SQL only.
const readSql = (p) => read(p).replace(/--[^\n]*/g, '');

const fail = (msg) => {
  console.error(`✖ intake-minimization: ${msg}`);
  process.exitCode = 1;
};

const M = {
  docs: 'supabase/launch/migrations/0139_document_evidence.sql',
  consent: 'supabase/launch/migrations/0140_consent_extension.sql',
  conditional: 'supabase/launch/migrations/0141_conditional_intake_data.sql',
  readiness: 'supabase/launch/migrations/0142_intake_conversion_readiness.sql',
  medreview: 'supabase/launch/migrations/0143_medication_status_review.sql',
  lookup: 'supabase/launch/migrations/0144_intake_conversion_lookup.sql',
  econsent: 'supabase/launch/migrations/0145_electronic_records_consent.sql',
};

// ---- B4: banned over-collection vocabulary across all four migrations ----------------------
const BANNED_COLUMNS = [
  'sud_history', 'trauma', 'treatment_narrative', 'treatment_history',
  'diagnosis', 'criminal_history', 'justice_history', 'ssn', 'social_security',
];
for (const p of Object.values(M)) {
  if (!has(p)) continue;
  const sql = readSql(p).toLowerCase();
  for (const banned of BANNED_COLUMNS) {
    if (sql.includes(banned)) fail(`${p} contains banned over-collection term '${banned}'`);
  }
}

// ---- B4: MOUD is never an eligibility/readiness signal --------------------------------------
if (has(M.readiness)) {
  const sql = readSql(M.readiness);
  if (/is_moud/i.test(sql))
    fail('0142 references is_moud — MOUD must never be a readiness/eligibility signal');
}
if (has(M.conditional)) {
  const sql = read(M.conditional);
  if (!/is_moud boolean not null default false/.test(sql))
    fail('0141 must define is_moud as a plain care-coordination flag');
  if (/is_moud[^\n]*(eligib|readiness|deny|refuse|block)/i.test(readSql(M.conditional)))
    fail('0141 ties is_moud to eligibility language');
}
// ---- B4: grant-anchored supervision visibility + RPC-only writes ----------------------------
if (has(M.conditional)) {
  const sql = read(M.conditional);
  const policy = sql.slice(sql.indexOf('supervision_coordination_staff_read'));
  if (!/revoked_at is null/.test(policy.slice(0, 900)))
    fail('0141 supervision staff-read policy must be anchored to the active consent grant');
  if (!/revoke insert, update, delete on recoveryos\.residency_medication_items/.test(sql))
    fail('0141 must revoke client DML on residency_medication_items');
  if (!/revoke insert, update, delete on recoveryos\.supervision_coordination_records/.test(sql))
    fail('0141 must revoke client DML on supervision_coordination_records');
}

// ---- B2: disclosure stays audit infrastructure; scope vocabulary is enumerated --------------
if (has(M.consent)) {
  const sql = read(M.consent);
  for (const cat of ['residency_status', 'screening_results', 'attendance',
                     'medication_presence', 'progress_summary']) {
    if (!sql.includes(`'${cat}'`)) fail(`0140 missing enumerated information category '${cat}'`);
  }
  if (!/consent_not_active/.test(sql))
    fail('0140 record_consent_disclosure must verify the grant is active');
}

// ---- B1: document evidence chain -------------------------------------------------------------
if (has(M.docs)) {
  const sql = read(M.docs);
  if (!/before insert or update of body_markdown/i.test(sql))
    fail('0139 content hash must be trigger-computed from body_markdown');
  if (!/alter column content_hash set not null/i.test(sql))
    fail('0139 must set content_hash NOT NULL after backfill');
  if (!/raise exception 'GATE B1 ABORT/.test(sql))
    fail('0139 must abort rather than leave unhashed versions');
  if (!/document_versions_immutable/.test(sql) || !/document_assignments_immutable/.test(sql))
    fail('0139 must install both immutability triggers');
  if (!/signed_at = now\(\), signature_name = trim/.test(sql.replace(/\s+/g, ' ')))
    fail('0139 acknowledge_document must record signed_at + signature_name for signature docs');
}

// Frontend acknowledgment path goes through the RPC (B6 later retires the direct update).
const repo = 'packages/data-access/src/repositories/residenceDocuments.ts';
if (has(repo)) {
  const ts = read(repo);
  if (!/rpc\('acknowledge_document'/.test(ts))
    fail(`${repo} must acknowledge via the acknowledge_document RPC`);
  if (/from\('document_assignments'\)\s*\.\s*update/.test(ts.replace(/\s+/g, ' ')))
    fail(`${repo} still updates document_assignments directly`);
}

// ---- 0143: medication review is a state record, never a fabricated item ---------------------
if (has(M.medreview)) {
  const sql = read(M.medreview);
  if (/insert into recoveryos\.residency_medication_items[\s\S]{0,400}'none/i.test(sql))
    fail("0143 must never fabricate a medication row representing 'none'");
  if (!/'reviewed_none'/.test(sql))
    fail("0143 readiness must surface the distinct 'reviewed_none' state");
  if (!/medication_status_reviewed/.test(sql))
    fail('0143 confirm action must be audited');
  if (!/set superseded_at = now\(\)/.test(sql))
    fail('0143 must supersede a standing none-review when an item is recorded');
  if (/is_moud[^\n]*(eligib|readiness|deny|refuse|block)/i.test(readSql(M.medreview)))
    fail('0143 ties is_moud to eligibility language');
}

// ---- 0145: legal-review invariants — e-consent gates e-signing; paper has parity -------------
if (has(M.econsent)) {
  const sql = read(M.econsent);
  if (!/electronic_consent_required/.test(sql))
    fail('0145 acknowledge_document must refuse e-signing without electronic-records consent');
  if (!/'self_only'/.test(sql))
    fail('0145 electronic-records consent must be self-only, in-app');
  if (!/signature_method = 'paper'/.test(sql) || !/document_signed_paper/.test(sql))
    fail('0145 must provide the audited paper-signature path with method recording');
  if (/electronic_records[^\n]{0,120}(readiness|eligib)/i.test(readSql(M.econsent)))
    fail('0145 must never make e-consent a readiness/eligibility item (paper has parity)');
}

// ---- B3: gated admission + narrow override ----------------------------------------------------
if (has(M.readiness)) {
  const sql = read(M.readiness);
  for (const code of ['intake_incomplete', 'override_not_permitted', 'override_reason_required']) {
    if (!sql.includes(`'${code}'`)) fail(`0142 admit gate missing refusal code '${code}'`);
  }
  if (!/insert into recoveryos\.follow_ups/.test(sql))
    fail('0142 override must create its follow_ups obligation');
  if (!/residency\.admission_override/.test(sql))
    fail('0142 override must write its audit_log event');
  // Non-overridable categories: signature, acknowledgment, screening consent,
  // emergency contact, pending-document-edition placeholder.
  const nonOverridable = [
    ["'sign:' \\|\\| v_t\\.key", 'signature documents'],
    ["'ack:' \\|\\| v_t\\.key", 'acknowledgment documents'],
    ["'screening_consent'", 'screening consent'],
    ["'emergency_contact'", 'emergency contact'],
    ["'signature_documents'", 'pending document edition'],
  ];
  for (const [keyPattern, label] of nonOverridable) {
    const re = new RegExp(`${keyPattern}[\\s\\S]{0,400}'overridable', false`);
    if (!re.test(sql)) fail(`0142 readiness item for ${label} must be non-overridable`);
  }
}

if (process.exitCode === 1) process.exit(1);
const present = Object.entries(M).filter(([, p]) => has(p)).map(([k]) => k);
console.log(
  `✓ intake-minimization: ${present.join('+')} verified — no banned collection, ` +
  'MOUD never gates, grant-anchored supervision, evidence chain + narrow override pinned.',
);
