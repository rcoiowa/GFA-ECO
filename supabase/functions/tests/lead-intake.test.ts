// Receiver-level tests for the lead-intake handler: shared-secret gate, payload
// validation, idempotency, generic error envelopes, and the minimized alert email
// boundary — against an injected fake database client. No network, no Supabase
// runtime. Run: deno test --allow-env supabase/functions/tests/

import { assertEquals, assertStringIncludes } from './asserts.ts';
import { type AdminClient, handleRequest } from '../lead-intake/handler.ts';

function req(payload: unknown, opts: { secret?: string; method?: string } = {}): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (opts.secret) headers.set('x-lead-secret', opts.secret);
  return new Request('https://x.test/lead-intake', {
    method: opts.method ?? 'POST',
    headers,
    body: opts.method === 'GET' ? undefined : JSON.stringify(payload),
  });
}

function fakeAdmin(overrides: { existingWixId?: string; insertError?: string } = {}): {
  client: AdminClient;
  inserts: Array<{ table: string; row: Record<string, unknown> }>;
} {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const client: AdminClient = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          return {
            select: () => ({
              single: () =>
                Promise.resolve(
                  overrides.insertError
                    ? { data: null, error: { message: overrides.insertError } }
                    : { data: { id: 42 }, error: null },
                ),
            }),
          };
        },
        select: () => ({
          eq: (_col: string, value: string) => ({
            maybeSingle: () =>
              Promise.resolve({
                data: overrides.existingWixId === value ? { id: 9 } : null,
                error: null,
              }),
          }),
        }),
      };
    },
  };
  return { client, inserts };
}

async function body(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

function withEnv(vars: Record<string, string | null>, fn: () => Promise<void>): Promise<void> {
  const prior: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    prior[k] = Deno.env.get(k);
    if (v === null) Deno.env.delete(k);
    else Deno.env.set(k, v);
  }
  return fn().finally(() => {
    for (const [k, v] of Object.entries(prior)) {
      if (v === undefined) Deno.env.delete(k);
      else Deno.env.set(k, v);
    }
  });
}

const SECRET_ON = {
  LEAD_INTAKE_SECRET: 'wix-secret',
  RESEND_API_KEY: null,
  RESEND_FROM: null,
  LEAD_ALERT_TO: null,
};

const LEAD = { first_name: 'Lena', email: 'lena@example.org', message: 'hello' };

Deno.test('rejects non-POST methods', () =>
  withEnv(SECRET_ON, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req({}, { method: 'GET' }), { getAdmin: () => client });
    assertEquals(res.status, 405);
  }),
);

Deno.test('503 when the shared secret is not configured', () =>
  withEnv({ ...SECRET_ON, LEAD_INTAKE_SECRET: null }, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req(LEAD, { secret: 'anything' }), { getAdmin: () => client });
    assertEquals(res.status, 503);
    assertEquals((await body(res)).code, 'intake_disabled');
  }),
);

Deno.test('403 on a wrong or missing shared secret', () =>
  withEnv(SECRET_ON, async () => {
    const { client } = fakeAdmin();
    const wrong = await handleRequest(req(LEAD, { secret: 'nope' }), { getAdmin: () => client });
    assertEquals(wrong.status, 403);
    const missing = await handleRequest(req(LEAD), { getAdmin: () => client });
    assertEquals(missing.status, 403);
  }),
);

Deno.test('rejects malformed JSON and empty leads', () =>
  withEnv(SECRET_ON, async () => {
    const { client } = fakeAdmin();
    const headers = new Headers({ 'x-lead-secret': 'wix-secret' });
    const bad = await handleRequest(
      new Request('https://x.test/', { method: 'POST', headers, body: '{nope' }),
      { getAdmin: () => client },
    );
    assertEquals((await body(bad)).code, 'bad_json');
    const empty = await handleRequest(req({ first_name: 'OnlyAName' }, { secret: 'wix-secret' }), {
      getAdmin: () => client,
    });
    assertEquals((await body(empty)).code, 'empty_lead');
  }),
);

Deno.test('stores a valid lead; explicit residence interest only', () =>
  withEnv(SECRET_ON, async () => {
    const { client, inserts } = fakeAdmin();
    const res = await handleRequest(
      req({ ...LEAD, residence_interest: 'made_up_value' }, { secret: 'wix-secret' }),
      { getAdmin: () => client },
    );
    assertEquals(res.status, 200);
    assertEquals((await body(res)).lead_id, 42);
    assertEquals(inserts[0].table, 'leads');
    assertEquals(inserts[0].row.residence_interest, 'unspecified');
  }),
);

Deno.test('duplicate Wix submission returns the existing lead (idempotency)', () =>
  withEnv(SECRET_ON, async () => {
    const { client, inserts } = fakeAdmin({ existingWixId: 'wix-123' });
    const res = await handleRequest(
      req({ ...LEAD, submission_id: 'wix-123' }, { secret: 'wix-secret' }),
      { getAdmin: () => client },
    );
    const out = await body(res);
    assertEquals(out.code, 'duplicate_submission');
    assertEquals(out.id, 9);
    assertEquals(inserts.length, 0);
  }),
);

Deno.test('a DB failure returns a GENERIC envelope with no diagnostic detail', () =>
  withEnv(SECRET_ON, async () => {
    const { client } = fakeAdmin({ insertError: 'duplicate key value violates ...' });
    const res = await handleRequest(req(LEAD, { secret: 'wix-secret' }), {
      getAdmin: () => client,
    });
    assertEquals(res.status, 500);
    assertEquals(await body(res), { ok: false, code: 'intake_failed' });
  }),
);

Deno.test('alert email carries name + queue pointer ONLY — no message, email, or phone', () =>
  withEnv(
    {
      ...SECRET_ON,
      RESEND_API_KEY: 're_key',
      RESEND_FROM: 'alerts@graceforaddictions.org',
      LEAD_ALERT_TO: 'staff@graceforaddictions.org',
    },
    async () => {
      const { client } = fakeAdmin();
      let sent = '';
      const fetchFn = ((_url: string | URL | Request, init?: RequestInit) => {
        sent = String(init?.body ?? '');
        return Promise.resolve(new Response('{}', { status: 200 }));
      }) as typeof fetch;
      const res = await handleRequest(
        req(
          { ...LEAD, phone: '515-555-1234', message: 'very private free text' },
          { secret: 'wix-secret' },
        ),
        { getAdmin: () => client, fetch: fetchFn },
      );
      assertEquals(res.status, 200);
      assertStringIncludes(sent, 'Lena');
      assertStringIncludes(sent, 'lead queue');
      assertEquals(sent.includes('very private free text'), false);
      assertEquals(sent.includes('lena@example.org'), false);
      assertEquals(sent.includes('515-555-1234'), false);
    },
  ),
);
