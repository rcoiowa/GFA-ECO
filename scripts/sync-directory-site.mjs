// Copies the canonical RecoveryResidence.org directory site into the
// platform's public assets so it serves at /residence/directory/ from the
// same Worker as the app. The copy is generated (gitignored) — the single
// source of truth stays sites/recoveryresidence-directory/index.html.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'sites', 'recoveryresidence-directory', 'index.html');
const target = join(repoRoot, 'apps', 'platform', 'public', 'residence', 'directory', 'index.html');

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log('Synced directory site → apps/platform/public/residence/directory/index.html');
