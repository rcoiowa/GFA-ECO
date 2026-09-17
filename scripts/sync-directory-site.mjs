// Copies the RecoveryResidence.org directory presentation into the platform's
// public assets so it serves at /residence/directory/ from the same Worker as
// the app. Runtime backend configuration is canonicalized here so historical
// source-template values can never leak into a RecoveryOS production build.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'sites', 'recoveryresidence-directory', 'index.html');
const target = join(repoRoot, 'apps', 'platform', 'public', 'residence', 'directory', 'index.html');

const RETIRED_PROJECT_REF = 'ykykeioydvtxpyreshhs';

const CANONICAL_PROJECT_REF = 'cqcxvwoukyhxyokfwnjm';
// 2026-09-08: the source template now carries the CANONICAL backend values
// directly (the historical retired-project markers were removed from
// sites/recoveryresidence-directory), so this sync verifies + optionally
// re-points them rather than substituting retired markers.
const SOURCE_API = `https://${CANONICAL_PROJECT_REF}.supabase.co/rest/v1`;
const SOURCE_KEY = 'sb_publishable_OMRkXXJ71z9RlUIAAfy2Jw_h04TYK3x';
const CANONICAL_URL =
  process.env.VITE_SUPABASE_URL ?? `https://${CANONICAL_PROJECT_REF}.supabase.co`;
const CANONICAL_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? SOURCE_KEY;

if (!CANONICAL_URL.includes(CANONICAL_PROJECT_REF) || CANONICAL_URL.includes(RETIRED_PROJECT_REF)) {
  throw new Error(`Directory sync refused non-canonical Supabase URL: ${CANONICAL_URL}`);
}

let html = readFileSync(source, 'utf8');

if (!html.includes(SOURCE_API) || !html.includes(SOURCE_KEY)) {
  throw new Error(
    'Directory source backend markers changed; review sync canonicalization before building.',
  );
}
if (html.includes(RETIRED_PROJECT_REF)) {
  throw new Error(
    `Directory SOURCE contains retired Supabase ref ${RETIRED_PROJECT_REF}; refusing to build.`,
  );
}

html = html
  .replaceAll(SOURCE_API, `${CANONICAL_URL}/rest/v1`)
  .replaceAll(SOURCE_KEY, CANONICAL_KEY);

if (html.includes(RETIRED_PROJECT_REF)) {
  throw new Error(
    `Directory sync left retired Supabase ref ${RETIRED_PROJECT_REF} in generated runtime asset.`,
  );
}
if (!html.includes("'Content-Profile': 'recoveryos'")) {
  throw new Error('Directory referral POST must target the recoveryos PostgREST schema.');
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, html, 'utf8');
console.log(
  `Synced directory site → apps/platform/public/residence/directory/index.html (${CANONICAL_PROJECT_REF})`,
);
