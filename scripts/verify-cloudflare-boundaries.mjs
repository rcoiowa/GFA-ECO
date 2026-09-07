import { readFileSync } from 'node:fs';

for (const path of [
  '.github/workflows/deploy-staging.yml',
  '.github/workflows/deploy-production-candidate.yml',
]) {
  const workflow = readFileSync(path, 'utf8');
  if (/^\s*push:\s*$/m.test(workflow)) throw new Error(`${path} must remain manual-only`);
  if (!/release_ref:/.test(workflow)) throw new Error(`${path} must require a release ref`);
  if (!/pnpm dlx wrangler@4\.14\.0/.test(workflow)) throw new Error(`${path} must pin Wrangler`);
  if (!/Require successful CI for the exact release commit/.test(workflow)) {
    throw new Error(`${path} must verify a successful CI run for the exact release commit`);
  }
}
const pkg = JSON.parse(readFileSync('workers/api/package.json', 'utf8'));
if (!String(pkg.scripts?.deploy).includes('DEPLOY BLOCKED')) {
  throw new Error('workers/api must remain deployment-quarantined');
}
console.log('Cloudflare execution and deployment boundaries verified.');
