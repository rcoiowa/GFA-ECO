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

const PREPARED_DIR = 'supabase/launch/prepared';

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
    if (Number.isInteger(n) && n >= 147) {
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
    'exact filenames + SHA-256 pins, no superseded 0147 in active paths, ledger mirror < 0147.',
);
