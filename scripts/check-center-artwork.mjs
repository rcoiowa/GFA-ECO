import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// A valid PNG header does not prove that the full image survived upload.
// Decode every pixel in both the source and the deployable copies.
for (const directory of ['public', 'dist']) {
  for (const scene of ['day', 'night']) {
    const path = `../apps/platform/${directory}/images/recovery-community-center-${scene}.png`;
    const { data, info } = await sharp(fileURLToPath(new URL(path, import.meta.url)), {
      failOn: 'warning',
    }).raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 1672, `${path}: unexpected width`);
    assert.equal(info.height, 941, `${path}: unexpected height`);
    assert.equal(data.length, info.width * info.height * info.channels);
    console.log(`Decoded ${directory}/${scene}: ${info.width} × ${info.height}`);
  }
}
