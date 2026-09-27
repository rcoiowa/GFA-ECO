import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gfaRoute, GFA_REDIRECTS } from './gfa-routes.mjs';
const seen = [];
const env = {
  ASSETS: {
    fetch: async (request) => {
      seen.push(new URL(request.url).pathname);
      return new Response(
        '<head><meta name="robots" content="noindex,nofollow"></head><h1>GFA</h1>',
        { headers: { 'content-type': 'text/html' } },
      );
    },
  },
};
test('GFA host serves reviewed new homepage and removes preview-only noindex', async () => {
  const response = await gfaRoute(new Request('https://www.graceforaddictions.org/'), env);
  assert.equal(seen.at(-1), '/gfa/');
  const body = await response.text();
  assert.ok(!body.includes('noindex'));
  assert.ok(body.includes('rel="canonical"'));
});
test('Other RecoveryOS domains and app routes are not re-routed', async () => {
  assert.equal(await gfaRoute(new Request('https://vrcc.app/'), env), null);
  assert.equal(
    await gfaRoute(
      new Request('https://www.graceforaddictions.org/recovery-residences/ejwrh/apply'),
      env,
    ),
    null,
  );
});
test('Each verified legacy alias has a local destination, never a Wix site', async () => {
  for (const [path, target] of Object.entries(GFA_REDIRECTS)) {
    const response = await gfaRoute(new Request('https://www.graceforaddictions.org' + path), env);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://www.graceforaddictions.org' + target);
  }
});

test('Clean public paths resolve to Cloudflare canonical assets without a redirect to /gfa', async () => {
  for (const name of ['connect', 'housing', 'give', 'privacy', 'members']) {
    const clean = await gfaRoute(new Request(`https://www.graceforaddictions.org/${name}`), env);
    assert.equal(clean.status, 200);
    assert.equal(seen.at(-1), `/gfa/${name}`);
    const legacyExtension = await gfaRoute(
      new Request(`https://www.graceforaddictions.org/${name}.html`),
      env,
    );
    assert.equal(
      legacyExtension.headers.get('location'),
      `https://www.graceforaddictions.org/${name}`,
    );
  }
});
