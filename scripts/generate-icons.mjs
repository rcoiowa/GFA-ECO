#!/usr/bin/env node
/**
 * Rasterize the PWA icon set from the canonical SVG mark. Run once after any
 * icon.svg change and commit the PNGs:
 *
 *   node scripts/generate-icons.mjs
 *
 * Maskable variants pad the mark into the safe zone (80%) on the brand field
 * so launcher masks never clip the presence shapes.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'apps/platform/public/icons');
const svg = await readFile(join(iconsDir, 'icon.svg'));

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(join(iconsDir, `icon-${size}.png`));
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const maskable = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: '#6540A5' },
  })
    .composite([{ input: maskable, top: pad, left: pad }])
    .png()
    .toFile(join(iconsDir, `maskable-${size}.png`));
}
await writeFile(
  join(iconsDir, 'apple-touch-icon.png'),
  await sharp(svg).resize(180, 180).flatten({ background: '#6540A5' }).png().toBuffer(),
);
console.log('icons generated');
