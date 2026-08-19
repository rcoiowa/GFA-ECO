#!/usr/bin/env node
// Static invariant checks for the public-intake boundary (migration 0122 +
// Edge Function). Runnable without a live database — asserts the security
// posture is present in source so a future edit cannot silently weaken it.
// The live RLS behaviour tests (anon cannot read/update/delete, staff can
// review) live in supabase/launch/tests/README.md and need a staging project.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const read = (p) => readFileSync(join(repoRoot, p), 'utf8');

const migration = read('supabase/launch/migrations/0122_public_intake_boundary.sql');
const fn = read('supabase/functions/residence-intake/index.ts');

const checks = [];
const assert = (name, cond) => checks.push({ name, ok: !!cond });

// --- Intake tables must NOT grant anon any DML (service-role-only writes) ----
assert(
  'no "grant ... to anon" on residence_listing_submissions',
  !/grant[\s\S]*residence_listing_submissions[\s\S]*to\s+anon/i.test(migration),
);
assert(
  'no "grant ... to anon" on residence_application_intake',
  !/grant[\s\S]*residence_application_intake[\s\S]*to\s+anon/i.test(migration),
);
assert('no bare "to anon" insert grant in 0122', !/\binsert\b[\s\S]{0,40}\bto\s+anon\b/i.test(migration));

// --- RLS enabled on both intake tables ---------------------------------------
assert(
  'RLS enabled on residence_listing_submissions',
  /alter table recoveryos\.residence_listing_submissions enable row level security/i.test(migration),
);
assert(
  'RLS enabled on residence_application_intake',
  /alter table recoveryos\.residence_application_intake enable row level security/i.test(migration),
);

// --- No INSERT policy on intake tables (inserts come only via service role) ---
assert(
  'no INSERT policy on either intake table',
  !/create policy[\s\S]*for insert[\s\S]*(residence_listing_submissions|residence_application_intake)/i.test(
    migration,
  ) && !/(residence_listing_submissions|residence_application_intake)[\s\S]*for insert/i.test(migration),
);

// --- Sensitive application intake: no public/anon SELECT ----------------------
assert(
  'application intake SELECT policy is staff-scoped, to authenticated only',
  /residence_application_intake_staff_select[\s\S]*for select to authenticated/i.test(migration) &&
    !/residence_application_intake[\s\S]*for select to anon/i.test(migration),
);

// --- Public directory view is anon-readable (curated projection) -------------
assert(
  'residence_directory_public granted to anon',
  /grant select on recoveryos\.residence_directory_public to anon/i.test(migration),
);
assert(
  'public directory view excludes exact street/postal',
  !/residence_directory_public[\s\S]*address_street/i.test(migration) &&
    !/residence_directory_public[\s\S]*postal_code/i.test(migration),
);

// --- Writes are RPC-only: no direct UPDATE policy, DML privileges revoked ----
// (PR #6 review remediation: a direct authenticated UPDATE policy plus 0110's
// schema-wide grants let staff bypass the audited review lifecycle via
// PostgREST PATCH. Lifecycle/PII changes must go through the review RPCs.)
const statements = migration.split(';');
const policyStatements = statements.filter((s) => /create\s+policy/i.test(s));
assert(
  'no UPDATE policy on residence_application_intake (review RPC is the only write path)',
  !policyStatements.some(
    (s) => s.includes('residence_application_intake') && /for\s+update/i.test(s),
  ),
);
assert(
  'no UPDATE policy on residence_listing_submissions (review/publish RPCs only)',
  !policyStatements.some(
    (s) => s.includes('residence_listing_submissions') && /for\s+update/i.test(s),
  ),
);
assert(
  'no DELETE/INSERT/UPDATE table privilege for client roles on residence_application_intake',
  /revoke insert, update, delete on recoveryos\.residence_application_intake\s+from anon, authenticated/i.test(
    migration,
  ),
);
assert(
  'no DELETE/INSERT/UPDATE table privilege for client roles on residence_listing_submissions',
  /revoke insert, update, delete on recoveryos\.residence_listing_submissions\s+from anon, authenticated/i.test(
    migration,
  ),
);
assert(
  'audited review RPC exists for application intake',
  /create or replace function recoveryos\.review_residence_application_intake/i.test(migration),
);

// --- Review RPCs are staff-only ----------------------------------------------
assert(
  'review/publish RPCs revoked from anon',
  /revoke execute on function[\s\S]*review_residence_listing_submission[\s\S]*from public, anon/i.test(
    migration,
  ),
);

// --- Edge Function: service-role client, no anon table write ------------------
assert('Edge Function uses SUPABASE_SERVICE_ROLE_KEY', /SUPABASE_SERVICE_ROLE_KEY/.test(fn));
assert('Edge Function enforces an origin allowlist', /ALLOWED_ORIGINS/.test(fn) && /forbidden_origin/.test(fn));
assert('Edge Function has a honeypot', /honeypot|company_website|hp_field/i.test(fn));
assert('Edge Function never reads sensitive intake back', !/\.select\('\*'\)/.test(fn));

// --- Neither new file references the retired project -------------------------
assert('migration has no retired ref', !migration.includes('ykykeioydvtxpyreshhs'));
assert('Edge Function has no retired ref', !fn.includes('ykykeioydvtxpyreshhs'));

let failed = 0;
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.name}`);
  if (!c.ok) failed++;
}
console.log(`\n${checks.length - failed}/${checks.length} invariant checks passed.`);
process.exit(failed === 0 ? 0 : 1);
