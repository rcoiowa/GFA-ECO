import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The live Wix homepage embeds /gfa/. Omitting this standalone site makes
// the React SPA render its not-found page inside the public homepage.
const root = resolve(process.argv[2] ?? 'apps/platform/dist');
for (const file of [
  'index.html', 'connect.html', 'housing.html', 'give.html', 'privacy.html',
  'members.html', 'site.css', 'site.js', 'contact.js',
  'assets/original-logo.png', 'assets/horizon.jpg',
]) {
  if (!existsSync(resolve(root, 'gfa', file))) throw new Error(`Missing GFA asset: ${file}`);
}
if (!readFileSync(resolve(root, 'gfa/index.html'), 'utf8').includes('Your future is')) {
  throw new Error('GFA homepage must be the standalone site, not the SPA fallback');
}
const config = JSON.parse(readFileSync(resolve(root, 'gfa/contact-config.json'), 'utf8'));
if (typeof config.siteKey !== 'string') throw new Error('Missing GFA contact configuration');
console.log('GFA homepage, supporting pages, artwork and contact configuration present.');
