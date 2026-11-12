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

for (const path of ['/', '/directory', '/directory/']) {
  test(`housing directory entry ${path} serves the searchable asset`, async () => {
    let served;
    const result = await worker.fetch(new Request(`https://recoveryresidence.org${path}`), {
      ASSETS: { fetch: (request) => {
        served = new URL(request.url).pathname;
        return new Response('searchable directory');
      } },
    });
    assert.equal(served, '/residence/directory/');
    assert.equal(await result.text(), 'searchable directory');
  });
}
for (const path of ['/recovery-residences/grace-house', '/recovery-residences/ejwrh/apply']) {
  test(`current residence route ${path} stays unchanged`, async () => {
    let served;
    await worker.fetch(new Request(`https://recoveryresidence.org${path}`), {
      ASSETS: { fetch: (request) => { served = new URL(request.url).pathname; return new Response('app'); } },
    });
    assert.equal(served, path);
  });
}
test('other domain homepages stay unchanged', async () => {
  let served;
  await worker.fetch(new Request('https://recoverycommunity.center/'), {
    ASSETS: { fetch: (request) => { served = new URL(request.url).pathname; return new Response('app'); } },
  });
  assert.equal(served, '/');
});
