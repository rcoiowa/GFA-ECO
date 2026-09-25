import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.mjs';
for (const [alias, residence] of [
  ['grace', 'grace-house'],
  ['grace-house', 'grace-house'],
  ['ejwrh', 'ejwrh'],
]) {
  test(`legacy ${alias} application redirects within its current deployment`, async () => {
    const result = await worker.fetch(
      new Request(`https://staging.example/residence/directory/?apply=${alias}`),
      {},
    );
    assert.equal(result.status, 302);
    assert.equal(
      result.headers.get('Location'),
      `https://staging.example/recovery-residences/${residence}/apply`,
    );
  });
}
test('general directory remains available', async () => {
  const result = await worker.fetch(new Request('https://staging.example/residence/directory/'), {
    ASSETS: { fetch: () => new Response('directory') },
  });
  assert.equal(await result.text(), 'directory');
});
