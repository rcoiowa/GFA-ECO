import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Whole-chain manifest lock for the approved rev-2 prepared migration chain
// (Convergence Gate A, ratified 2026-09-17). Complements the per-artifact
// invariant guards (verify-0147..0151-prepared.mjs): those assert content
// posture; this one asserts the SET is exactly the approved set.
//
// Enforced invariants:
//   1. supabase/launch/prepared/ contains EXACTLY the approved rev-2 chain and
//      support artifacts — nothing missing, nothing extra.
//   2. Every artifact matches its approved SHA-256 pin. Any drift fails CI.
//      The remedy for a legitimate revision is a new executive-approved pin
//      recorded here — never editing the approved migration SQL to satisfy
//      the guard.
//   3. The superseded PR #7 intake artifacts (0147_shared_intake_workflow*,
//      0147_intake_workflow_foundation*) exist nowhere in an active path;
//      files bearing those names are allowed only under docs/superseded/.
//   4. The applied-ledger mirror supabase/launch/migrations/ carries no
//      artifact numbered >= 0147: 0147+ live only as prepared artifacts until
//      production application is separately authorized.
//      Separately authorized, applied downstream migrations are allowed only
//      by exact path and hash below; this never activates the intake chain.

const PREPARED_DIR = 'supabase/launch/prepared';

// ---------------------------------------------------------------------------
// Applied-status reconciliation (2026-11-11, Prompt 3 Phase A, Increment 2).
// The live CQCX ledger was read through authorized read-only access on
// 2026-11-11 and confirms the first three prepared artifacts of the approved
// rev-2 chain were APPLIED on 2026-09-17 under the ratified Convergence Gate A
// authorization (docs/decisions/2026-09-16-p0-approval-packet-rev2.md;
// docs/deployment/convergence-release-plan-2026-09-17.md; per-artifact
// live-readback verifications alongside each file). The pinned artifacts are
// NOT edited — their in-file "PREPARED ONLY / NOT APPLIED" status lines are
// historical text frozen by the hash pins above; THIS record is the current
// applied status. 0150 and 0151 remain NOT APPLIED (held/sequenced per G11),
// which the same ledger read confirms.
// Full mapping: docs/migration/applied-ledger-reconciliation-2026-11-11.md.
const APPLIED_PREPARED = {
  '0147_classification_authorization_isolation.prepared.sql': {
    ledger_version: '20260917145239',
    applied_on: '2026-09-17',
  },
  '0148_view_and_function_exposure_hardening.prepared.sql': {
    ledger_version: '20260917163228',
    applied_on: '2026-09-17',
  },
  '0149_shared_intake_workflow.prepared.sql': {
    ledger_version: '20260917163627',
    applied_on: '2026-09-17',
  },
};

// Applied to CQCX but PENDING AUTHORIZATION REVIEW (executive direction,
// 2026-11-11): the live ledger carries 20261023223104
// document_review_attestations (applied 2026-10-23) and the artifact below is
// byte-identical to the SHA-256 that draft PR #45 declared. The underlying
// apply-authorization record has NOT been located; per executive direction it
// must be located or reviewed, never retrospectively presumed. This pin only
// freezes the artifact so the applied SQL's source cannot drift while that
// review is open. It does not assert approval and does not activate anything.
const APPLIED_PENDING_AUTHORIZATION_REVIEW = {
  'docs/proposals/document-review/20261023201920_document_review_attestations.sql':
    '9894cacaad3c143ff07f819a702434a37e3847d689f42ab86b9f7f029fa8cb48',
};

// Executive authorization: docs/decisions/2026-10-05-circle-meeting-logging.md.
// Applied to canonical CQCX on October 5. No intake-chain dependency.
const APPLIED_DOWNSTREAM = {
  // Executive direction: docs/decisions/2026-10-05-accountless-application-workflow.md
  'supabase/launch/migrations/20261005093045_accountless_application_conversion.sql':
    '9bfd7406b4da4c40caa8ce66a2d42249e0a06b73fc3f78acc502b2db8e9ee3b6',
  // October 5 follow-up: docs/decisions/2026-10-05-circle-county-access-schedule.md
  'supabase/launch/migrations/20261005092358_circle_county_access_schedule.sql':
    'dca60784aa998e1f3b2876a96f8363efad23fc891c2624b97b5293f2cde443ce',
  'supabase/launch/migrations/20261005071446_circle_meeting_logging.sql':
    '0a9c40b4651333a40f824b301887d2a5912b6d1b8afe2823deb25736a823d142',
  // Housing follow-through + owner-private admin collaboration. Live ledger
  // 20261020010443 (applied 2026-10-20; ledger read verified 2026-11-11).
  // Adopted 2026-11-12 (Phase C2) from PR #42's branch where ACTIVATION.md
  // records it as 'approved and applied' with verified results (Class D);
  // approver attribution pending executive confirmation — this pin records
  // provenance, not authorization. The file embeds the verbatim applied SQL
  // (original artifact SHA-256 7bd74792…a439) after a provenance header;
  // the pin below is the adopted file's own hash.
  'supabase/launch/migrations/20261020010443_housing_follow_through_private_admin_collaboration.sql':
    '697799f8204f13aca062d94f9d1129efc8fcc17a645c460d493fed61eb11d9b4',
};

// Approved rev-2 pins (exact filename -> SHA-256), frozen at RC assembly.
// 0147 rev-2 pin da6ecb7/512f4624-lineage superseded by the convergence tree;
// hashes below are the convergence-RC canonical values.
const APPROVED = {
  '0147_classification_authorization_isolation.prepared.sql':
    '2913d1446d37fddd32d7a9400aff0b28b79d6f6251cc8cfa3a4a3e1e07636182',
  '0147_classification_authorization_isolation.rollback.sql':
    'e148994fdd18e69b3d7ffd7002457c0fd5f5dee7e017ea5dcd91154ead2a78b5',
  '0147_live_readback_verification.sql':
    'd89a21c60a5ada53dd2bf21ee1ab2ad045cdbfcd22a432ab6fd091f04b6baa26',
  '0148_view_and_function_exposure_hardening.prepared.sql':
    'ce763899ed3c47a87d1fd62dc35c05f362bb2cf8f19832c47635482c8e4a8093',
  '0148_view_and_function_exposure_hardening.rollback.sql':
    '981f68cfc27c0419b456cd741a65000c18b1a700cfac079a31ed2d34507a287a',
  '0148_live_readback_verification.sql':
    '41d595dec64cf79de175d8debd5f0c024924b41c950a16a6eed6ff9a4100cfb5',
  '0149_shared_intake_workflow.prepared.sql':
    'f701f2714e0ebc6c70ab111d486c48559edc65d6e0965170b2243f75467def27',
  '0149_shared_intake_workflow.rollback.sql':
    '7cab6eb8e135f1a984dc1c2fed8472fa4fa5b33bad96b676bb8540136e4eccd4',
  '0149_live_readback_verification.sql':
    'b63092321ead6f58799684ae977fc1fa776052033039fd9c26b6b8d5ff84544c',
  '0150_intake_consent_evidence.prepared.sql':
    '0579a59611234fa26a9f05aa8698cbbb08e24b4faeca25d87f42e9482f0d6619',
  '0150_intake_consent_evidence.rollback.sql':
    '09aacb55615d183f48518bc4391665e20787bd0dfbb588755c16b51e03c8c21e',
  '0151_strict_classification_semantics.prepared.sql':
    'a6f119f25adc03fae7ed086cd43ef884d73f40c985d3a98272c685731e44af33',
  '0151_strict_classification_semantics.rollback.sql':
    '2654fb319c2ebde85a7c1abf2d6e6e6c39a3d2c825194ecbf97cff2069913b2f',
  'p0_fixture_role_revocation.gated.sql':
    '77ea382153cd4f0164fa4961c4a2dbd53642143b215e04f4954e98d5f3c60d33',
};

// Filenames of the superseded PR #7 intake artifacts that must never return
// to an active path.
const SUPERSEDED_NAME = /^0147_(shared_intake_workflow|intake_workflow_foundation)/;
const HISTORICAL_PREFIX = 'docs/superseded/';

const failures = [];
const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
for (const [path, pin] of Object.entries(APPLIED_DOWNSTREAM)) {
  try {
    if (sha256(path) !== pin) failures.push(`applied downstream hash drift: ${path}`);
  } catch {
    failures.push(`missing applied downstream artifact: ${path}`);
  }
}

// Applied-status records must name real approved artifacts; the pending-review
// artifact must exist and match the hash the live apply was reconciled to.
for (const name of Object.keys(APPLIED_PREPARED)) {
  if (!(name in APPROVED)) failures.push(`applied-status record names unknown artifact: ${name}`);
}
for (const [path, pin] of Object.entries(APPLIED_PENDING_AUTHORIZATION_REVIEW)) {
  try {
    if (sha256(path) !== pin) {
      failures.push(`applied artifact pending authorization review drifted: ${path}`);
    }
  } catch {
    failures.push(`missing applied artifact pending authorization review: ${path}`);
  }
}

// --- 1 & 2: prepared dir is exactly the approved set, hash-pinned ---
const actual = readdirSync(PREPARED_DIR).sort();
for (const name of Object.keys(APPROVED)) {
  if (!actual.includes(name)) failures.push(`missing approved artifact: ${name}`);
}
for (const name of actual) {
  if (!(name in APPROVED)) {
    failures.push(`unapproved artifact present in prepared/: ${name}`);
    continue;
  }
  const got = sha256(join(PREPARED_DIR, name));
  if (got !== APPROVED[name]) {
    failures.push(`hash drift: ${name} sha256=${got} (approved ${APPROVED[name]})`);
  }
}

// --- 3 & 4: repository-wide filename scan (active tree only) ---
const SKIP = new Set(['node_modules', '.git', 'dist', '.turbo', 'build']);
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
for (const p of walk('.')) {
  const rel = p.replace(/^\.\//, '');
  const base = rel.split('/').pop();
  if (SUPERSEDED_NAME.test(base) && !rel.startsWith(HISTORICAL_PREFIX)) {
    failures.push(`superseded 0147 intake artifact outside ${HISTORICAL_PREFIX}: ${rel}`);
  }
  if (rel.startsWith('supabase/launch/migrations/')) {
    const n = Number.parseInt(base.slice(0, 4), 10);
    if (Number.isInteger(n) && n >= 147 && !Object.hasOwn(APPLIED_DOWNSTREAM, rel)) {
      failures.push(`migrations ledger mirror contains artifact >= 0147: ${rel}`);
    }
  }
}

if (failures.length) {
  console.error('prepared-chain manifest guard failed:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `prepared-chain manifest verified: ${Object.keys(APPROVED).length} approved rev-2 artifacts, ` +
    'exact filenames + SHA-256 pins, no superseded 0147 in active paths, ' +
    'ledger mirror < 0147 except separately authorized hash-pinned downstream artifacts.',
);
