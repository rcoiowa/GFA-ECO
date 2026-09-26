import { assertEquals } from './asserts.ts';
import { handleContact, CONTACT_PERMISSION } from '../lead-intake/contact.ts';
import type { AdminClient } from '../lead-intake/handler.ts';
const origin = 'https://recoveryos-staging.thomas-499.workers.dev';
const payload = {
  name: 'Synthetic Test',
  email: 'qa@example.invalid',
  interest: 'not_sure',
  contact_permission: true,
  submission_id: '12345678-1234-4234-8234-123456789012',
  turnstile_token: 'valid',
  message: 'Testing',
};
function request(p: unknown = payload, site = origin) {
  return new Request('https://example.test/lead-intake/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: site },
    body: JSON.stringify(p),
  });
}
function setup(options: { hostname?: string; action?: string; dbError?: boolean } = {}) {
  Deno.env.set('TURNSTILE_SECRET', 'test');
  Deno.env.set('LEAD_INTAKE_SECRET', 'test');
  Deno.env.delete('RESEND_API_KEY');
  const rows: Record<string, unknown>[] = [];
  const client: AdminClient = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
      insert: (row: Record<string, unknown>) => {
        rows.push(row);
        return {
          select: () => ({
            single: () =>
              Promise.resolve(
                options.dbError
                  ? { error: { message: 'private diagnostic' } }
                  : { data: { id: 123 }, error: null },
              ),
          }),
        };
      },
    }),
  };
  return {
    rows,
    deps: {
      getAdmin: () => client,
      fetch: (() =>
        Promise.resolve(
          Response.json({
            success: true,
            hostname: options.hostname ?? new URL(origin).hostname,
            action: options.action ?? 'contact_connect',
          }),
        )) as typeof fetch,
    },
  };
}
Deno.test(
  'Contact Connect rejects unapproved origin, missing consent and oversized body before write',
  async () => {
    const { rows, deps } = setup();
    assertEquals((await handleContact(request(payload, 'https://evil.invalid'), deps)).status, 403);
    assertEquals(
      (await handleContact(request({ ...payload, contact_permission: false }), deps)).status,
      400,
    );
    assertEquals(
      (await handleContact(request({ ...payload, message: 'x'.repeat(9000) }), deps)).status,
      413,
    );
    assertEquals(rows.length, 0);
  },
);
Deno.test(
  'Contact Connect requires configured verification and validates attested hostname/action',
  async () => {
    for (const options of [{ hostname: 'evil.invalid' }, { action: 'residence_application' }]) {
      const { rows, deps } = setup(options);
      assertEquals((await handleContact(request(), deps)).status, 400);
      assertEquals(rows.length, 0);
    }
    const { deps } = setup();
    Deno.env.delete('TURNSTILE_SECRET');
    assertEquals((await handleContact(request(), deps)).status, 503);
  },
);
Deno.test(
  'Contact Connect records only permitted fields and server-owned contact permission',
  async () => {
    const { rows, deps } = setup();
    const response = await handleContact(
      request({ ...payload, status: 'converted', notes: 'forged', residence_interest: 'ejwrh' }),
      deps,
    );
    assertEquals(response.status, 200);
    assertEquals(await response.json(), { ok: true, code: 'received' });
    assertEquals(rows[0].source, 'gfa_contact_connect_v1');
    assertEquals(rows[0].residence_interest, 'unspecified');
    assertEquals(rows[0].status, undefined);
    assertEquals(JSON.parse(String(rows[0].notes)).text, CONTACT_PERMISSION);
  },
);
Deno.test('Contact Connect never confirms success after database rejection', async () => {
  const { deps } = setup({ dbError: true });
  const response = await handleContact(request(), deps);
  assertEquals(response.status, 503);
  assertEquals(await response.json(), { ok: false, code: 'submission_failed' });
});
