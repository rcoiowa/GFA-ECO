// Builds a drag-and-drop deployment package for Cloudflare Pages
// ("Upload assets" flow) — no Git connection, build settings, or
// environment variables required. Run: node scripts/package-pages-upload.mjs
// (after `pnpm build`). Produces recoveryos-pages-upload.zip.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'apps', 'platform', 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('No build found. Run `pnpm build` first.');
  process.exit(1);
}

// SPA fallback for Pages. Static assets (including the public directory at
// /residence/directory/) are matched first, so this only catches client
// routes such as /app, /residence, /staff.
writeFileSync(join(dist, '_redirects'), '/* /index.html 200\n');

const zip = join(process.cwd(), 'recoveryos-pages-upload.zip');
execFileSync('zip', ['-r', '-q', zip, '.'], { cwd: dist });
console.log(`Packaged ${zip}`);
