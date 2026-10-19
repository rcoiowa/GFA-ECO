import test from 'node:test';
import assert from 'node:assert/strict';
import { createEndpoint } from './endpoint.mjs';
const config = { enabled: true, resource: 'https://synthetic.example/mcp', issuer: 'https://auth.synthetic.example' };
const request = (method, params = {}, token = 'synthetic-test-token') => new Request(config.resource, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
function fixture() {
  const replies = new Map(); let revoked = false; let calls = 0;
  const adapters = {
    verifyAccessToken: async token => token === 'synthetic-test-token' ? { subject: 'synthetic-admin' } : null,
    authorize: async (_principal, residence) => !revoked && (residence === null || residence === 'residence-a'),
    exchange: async (method, principal, a) => {
      calls++;
      if (a.request_id !== 'owned-request') throw new Error('not_authorized');
      if (method === 'reply_to_request') {
        const key = `${principal.subject}/${a.request_id}/${a.operation_id}`;
        if (replies.has(key) && replies.get(key) !== a.text) throw new Error('idempotency_conflict');
        replies.set(key, a.text); return { status: 'reply_received', reviewOnly: true };
      }
      return { status: 'queued', selectedContext: 'Synthetic maintenance request' };
    },
    subscriptions: async () => { throw new Error('callback_service_not_configured'); },
  };
  return { handle: createEndpoint(config, adapters), replies, revoke: () => { revoked = true; }, calls: () => calls };
}
test('default endpoint remains unavailable without infrastructure', async () => {
  const r = await createEndpoint({ enabled: false }, {})(request('server/discover')); assert.equal(r.status, 503); assert.equal((await r.json()).connected, false);
});
test('discovery and private tools require authentication', async () => {
  const { handle } = fixture(); assert.equal((await handle(request('tools/list', {}, null))).status, 401);
  const d = await (await handle(request('server/discover'))).json(); assert.deepEqual(d.result.supportedVersions, ['2026-07-28']);
});
test('residence and fresh revocation gates run before storage', async () => {
  const f = fixture();
  assert.equal((await (await f.handle(request('tools/call', { name: 'read_request', arguments: { residence_id: 'residence-b', request_id: 'owned-request' } }))).json()).error.message, 'not_authorized');
  assert.equal(f.calls(), 0); f.revoke(); assert.equal((await (await f.handle(request('tools/list'))).json()).error.message, 'not_authorized');
});
test('replies use exact owner/request and idempotent operation, never resident execution', async () => {
  const f = fixture(); const p = { name: 'reply_to_request', arguments: { residence_id: 'residence-a', request_id: 'owned-request', operation_id: 'op-1', text: 'Synthetic proposal only' } };
  for (let i = 0; i < 2; i++) assert.ok((await (await f.handle(request('tools/call', p))).json()).result);
  assert.equal(f.replies.size, 1);
  p.arguments.text = 'Changed payload'; assert.ok((await (await f.handle(request('tools/call', p))).json()).error);
  p.arguments.request_id = 'someone-elses-request'; assert.ok((await (await f.handle(request('tools/call', p))).json()).error);
});
test('bounded inputs and unknown fields are refused', async () => {
  const f = fixture();
  assert.equal((await f.handle(request('tools/call', { huge: 'x'.repeat(25000) }))).status, 400);
  const p = { name: 'read_request', arguments: { residence_id: 'residence-a', request_id: 'owned-request', owner: 'other' } };
  assert.ok((await (await f.handle(request('tools/call', p))).json()).error); assert.equal(f.calls(), 0);
});
test('unverified callbacks cannot become subscriptions', async () => {
  const { handle } = fixture();
  const p = { name: 'collaboration.requested', arguments: { residence_id: 'residence-a' }, delivery: { mode: 'webhook', url: 'http://localhost/callback', secret: 'invalid' } };
  assert.equal((await (await handle(request('events/subscribe', p))).json()).error.message, 'invalid_callback');
  p.delivery.url = 'https://callback.synthetic.example/event'; p.delivery.secret = `whsec_${btoa('x'.repeat(32))}`;
  assert.equal((await (await handle(request('events/subscribe', p))).json()).error.message, 'operation_unavailable');
});
