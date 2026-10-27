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

for (const hostname of ['recoveryresidence.org', 'www.recoveryresidence.org']) {
  for (const method of ['GET', 'HEAD']) {
    test(`${method} ${hostname} homepage redirects to the static directory without caching`, async () => {
      const result = await worker.fetch(
        new Request(`https://${hostname}/?source=gfa&apply=ejwrh`, { method }),
        {},
      );
      assert.equal(result.status, 302);
      assert.equal(
        result.headers.get('Location'),
        `https://${hostname}/residence/directory/?source=gfa&apply=ejwrh`,
      );
      assert.equal(result.headers.get('Cache-Control'), 'no-store');
      assert.equal(await result.text(), '');
    });
  }
}

test('homepage routing leaves every other host and non-root residence path with ASSETS', async () => {
  const urls = [
    'https://vrcc.app/',
    'https://www.vrcc.app/',
    'https://recoveryresidence.app/',
    'https://www.recoveryresidence.app/',
    'https://recoverycommunity.center/',
    'https://www.recoverycommunity.center/',
    'https://recoverycommunity.app/',
    'https://www.recoverycommunity.app/',
    'https://gracehouse.graceforaddictions.org/',
    'https://recoveryos-staging.example/',
    'https://recoveryresidence.org.example/',
    'https://other.recoveryresidence.org/',
    ...['recoveryresidence.org', 'www.recoveryresidence.org'].flatMap((host) =>
      [
        '/residence/directory/',
        '/residence/directory/index.html',
        '/recovery-residences',
        '/recovery-residences/grace-house',
        '/recovery-residences/grace-house/apply',
        '/recovery-residences/ejwrh',
        '/recovery-residences/ejwrh/apply',
        '/sign-in',
        '/release.json',
      ].map((path) => `https://${host}${path}?source=gfa`),
    ),
  ];
  for (const url of urls) {
    for (const method of ['GET', 'HEAD']) {
      const input = new Request(url, { method });
      const response = await worker.fetch(input, {
        ASSETS: {
          fetch(request) {
            assert.equal(request, input);
            return new Response('unchanged assets');
          },
        },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Location'), null);
      assert.equal(await response.text(), 'unchanged assets');
    }
  }
});

test('homepage redirect does not redirect or replay non-navigation methods', async () => {
  for (const host of ['recoveryresidence.org', 'www.recoveryresidence.org']) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const input = new Request(`https://${host}/?apply=grace`, { method });
      const response = await worker.fetch(input, {
        ASSETS: {
          fetch: (request) => {
            assert.equal(request, input);
            return new Response(null, { status: 405 });
          },
        },
      });
      assert.equal(response.status, 405);
      assert.equal(response.headers.get('Location'), null);
    }
  }
});
