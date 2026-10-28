import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateDevelopment, PRODUCTION_REF, RETIRED_REF, PRODUCTION_KEY } from './development-config.mjs';
const ref = validateDevelopment(process.env);
const env = { ...process.env, RECOVERYOS_ENV: 'development' };
for (const [args, cwd] of [
  [['scripts/sync-directory-site.mjs'], '.'],
  [['node_modules/vite/bin/vite.js', 'build'], 'apps/platform'],
]) {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error('Development build failed.');
}
const dist = 'apps/platform/dist';
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]);
}
for (const path of files(dist)) {
  if (!/\.(?:html|js|json|css|map|txt)$/.test(path)) continue;
  let content = readFileSync(path, 'utf8');
  if ([PRODUCTION_REF, RETIRED_REF, PRODUCTION_KEY].some(v => content.includes(v))) {
    throw new Error(`Non-test backend found in ${path}`);
  }
  if (path.endsWith('.html')) {
    content = content.replace(/href="https:\/\/(?:www\.)?graceforaddictions\.org\/donate[^"]*"/g,
      'href="#development-donations-disabled" aria-disabled="true"');
    content = content.replace(/<body([^>]*)>/i, '<body$1><aside id="development-donations-disabled" style="background:#fff2ab;color:#111;padding:12px;text-align:center">DEVELOPMENT / TESTING — Use synthetic data only. Real donations are disabled.</aside>');
    writeFileSync(path, content);
  }
}
const manifest = JSON.parse(readFileSync(`${dist}/release.json`, 'utf8'));
if (manifest.supabaseProject !== ref || manifest.environment !== 'development') throw new Error('Development manifest mismatch.');
console.log(`Development assets verified for ${ref}. No deployment performed.`);
