// Receiver-level tests for the residence-intake handler: every pre-database gate
// (method, origin, Turnstile configuration/hostname/action, honeypot, payload
// validation) plus both flows against an injected fake database client. No
// network, no Supabase runtime. Run: deno test --allow-env supabase/functions/tests/

import { assertEquals } from './asserts.ts';
import { type AdminClient, handleRequest } from '../residence-intake/handler.ts';

const GOOD_ORIGIN = 'https://recoveryresidence.org';

function req(body: unknown, opts: { origin?: string | null; method?: string } = {}): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (opts.origin !== null) headers.set('origin', opts.origin ?? GOOD_ORIGIN);
  return new Request('https://x.test/residence-intake', {
    method: opts.method ?? 'POST',
    headers,
    body: opts.method === 'GET' ? undefined : JSON.stringify(body),
  });
}

// Fake service-role client: records inserts, answers residence lookups.
function fakeAdmin(
  overrides: {
    residences?: Record<number, { id: number; is_active: boolean }>;
    insertError?: string;
  } = {},
): { client: AdminClient; inserts: Array<{ table: string; row: unknown }> } {
  const residences = overrides.residences ?? {
    1: { id: 1, is_active: true },
    2: { id: 2, is_active: true },
  };
  const inserts: Array<{ table: string; row: unknown }> = [];
  const client: AdminClient = {
    from(table: string) {
      return {
        insert(row: unknown) {
          inserts.push({ table, row });
          return {
            select: () => ({
              single: () =>
                Promise.resolve(
                  overrides.insertError
                    ? { data: null, error: { message: overrides.insertError } }
                    : { data: { id: 77 }, error: null },
                ),
            }),
          };
        },
        select: () => ({
          eq: (_col: string, id: number) => ({
            maybeSingle: () => Promise.resolve({ data: residences[id] ?? null, error: null }),
          }),
        }),
      };
    },
  };
  return { client, inserts };
}

function siteverify(result: {
  success: boolean;
  hostname?: string;
  action?: string;
}): typeof fetch {
  return (() => Promise.resolve(new Response(JSON.stringify(result)))) as typeof fetch;
}

const VALID_APPLICATION = {
  kind: 'residence_application',
  residence_id: 2,
  applicant_name: 'Test Person',
  applicant_phone: '515-555-0000',
  consent_to_contact: true,
  turnstile_token: 'tok',
};

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

const CONFIGURED = { TURNSTILE_SECRET: 's3cret', INTAKE_TURNSTILE_OPTIONAL: null };
const OPTIONAL_MODE = { TURNSTILE_SECRET: null, INTAKE_TURNSTILE_OPTIONAL: 'true' };

for (const kind of ['residence_application', 'grace_house_application']) {
  for (const consent of [undefined, null, false, 'true', 'on', 1]) {
    Deno.test(`${kind} rejects consent ${String(consent)} before verification or DB access`, () =>
      withEnv(CONFIGURED, async () => {
        const res = await handleRequest(
          req({ ...VALID_APPLICATION, kind, consent_to_contact: consent }),
          {
            getAdmin: () => {
              throw new Error('Must not access database');
            },
            fetch: () => {
              throw new Error('Must not verify a challenge');
            },
          },
        );
        assertEquals(res.status, 400);
        assertEquals(await body(res), { ok: false, code: 'consent_required' });
      }),
    );
  }
}

Deno.test('rejects non-POST methods', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req({}, { method: 'GET' }), { getAdmin: () => client });
    assertEquals(res.status, 405);
  }),
);

Deno.test('rejects a MISSING Origin header', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req(VALID_APPLICATION, { origin: null }), {
      getAdmin: () => client,
    });
    assertEquals(res.status, 403);
    assertEquals((await body(res)).code, 'forbidden_origin');
  }),
);

Deno.test('rejects an unapproved Origin', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req(VALID_APPLICATION, { origin: 'https://evil.example' }), {
      getAdmin: () => client,
    });
    assertEquals(res.status, 403);
    assertEquals((await body(res)).code, 'forbidden_origin');
  }),
);

Deno.test('fails closed (503) when Turnstile is unconfigured and not opted out', () =>
  withEnv({ TURNSTILE_SECRET: null, INTAKE_TURNSTILE_OPTIONAL: null }, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req(VALID_APPLICATION), { getAdmin: () => client });
    assertEquals(res.status, 503);
    assertEquals((await body(res)).code, 'intake_unavailable');
  }),
);

Deno.test('honeypot hit pretends success and writes nothing', () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client, inserts } = fakeAdmin();
    const res = await handleRequest(req({ ...VALID_APPLICATION, company_website: 'spam.biz' }), {
      getAdmin: () => client,
    });
    assertEquals(res.status, 202);
    assertEquals(inserts.length, 0);
  }),
);

Deno.test('rejects malformed JSON', () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client } = fakeAdmin();
    const headers = new Headers({ origin: GOOD_ORIGIN, 'content-type': 'application/json' });
    const res = await handleRequest(
      new Request('https://x.test/', { method: 'POST', headers, body: '{nope' }),
      { getAdmin: () => client },
    );
    assertEquals(res.status, 400);
    assertEquals((await body(res)).code, 'bad_json');
  }),
);

Deno.test('rejects an unknown kind before any Turnstile or DB work', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req({ kind: 'mystery' }), { getAdmin: () => client });
    assertEquals(res.status, 400);
    assertEquals((await body(res)).code, 'unknown_kind');
  }),
);

Deno.test('rejects a token Cloudflare attests for a DIFFERENT hostname', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req(VALID_APPLICATION), {
      getAdmin: () => client,
      fetch: siteverify({
        success: true,
        hostname: 'evil.example',
        action: 'residence_application',
      }),
    });
    assertEquals(res.status, 403);
    assertEquals((await body(res)).code, 'challenge_failed');
  }),
);

Deno.test('rejects a token minted for a DIFFERENT action (listing token on an application)', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req(VALID_APPLICATION), {
      getAdmin: () => client,
      fetch: siteverify({
        success: true,
        hostname: 'recoveryresidence.org',
        action: 'residence_listing',
      }),
    });
    assertEquals(res.status, 403);
    assertEquals((await body(res)).code, 'challenge_failed');
  }),
);

Deno.test('rejects a missing token when Turnstile is configured', () =>
  withEnv(CONFIGURED, async () => {
    const { client } = fakeAdmin();
    const res = await handleRequest(req({ ...VALID_APPLICATION, turnstile_token: undefined }), {
      getAdmin: () => client,
      fetch: siteverify({
        success: true,
        hostname: 'recoveryresidence.org',
        action: 'residence_application',
      }),
    });
    assertEquals(res.status, 403);
  }),
);

Deno.test('accepts a matching hostname + action token and stores the application', () =>
  withEnv(CONFIGURED, async () => {
    const { client, inserts } = fakeAdmin();
    const res = await handleRequest(req(VALID_APPLICATION), {
      getAdmin: () => client,
      fetch: siteverify({
        success: true,
        hostname: 'recoveryresidence.org',
        action: 'residence_application',
      }),
    });
    assertEquals(res.status, 201);
    const out = await body(res);
    assertEquals(out.ok, true);
    assertEquals(out.intake_id, 77);
    assertEquals(inserts[0].table, 'residence_application_intake');
  }),
);

Deno.test("legacy kind 'grace_house_application' still reaches the same flow", () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client, inserts } = fakeAdmin();
    const res = await handleRequest(
      req({ ...VALID_APPLICATION, kind: 'grace_house_application' }),
      { getAdmin: () => client },
    );
    assertEquals(res.status, 201);
    assertEquals(inserts[0].table, 'residence_application_intake');
  }),
);

Deno.test('rejects a nonexistent residence id', () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client } = fakeAdmin({ residences: {} });
    const res = await handleRequest(req(VALID_APPLICATION), { getAdmin: () => client });
    assertEquals(res.status, 400);
    assertEquals((await body(res)).code, 'invalid_residence');
  }),
);

Deno.test('rejects an inactive residence', () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client } = fakeAdmin({ residences: { 2: { id: 2, is_active: false } } });
    const res = await handleRequest(req(VALID_APPLICATION), { getAdmin: () => client });
    assertEquals(res.status, 400);
    assertEquals((await body(res)).code, 'invalid_residence');
  }),
);

Deno.test('a DB failure returns a GENERIC envelope with no diagnostic detail', () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client } = fakeAdmin({ insertError: 'insert or update on table "x" violates ...' });
    const res = await handleRequest(req(VALID_APPLICATION), { getAdmin: () => client });
    assertEquals(res.status, 500);
    const out = await body(res);
    assertEquals(out, { ok: false, code: 'intake_failed' });
  }),
);

Deno.test('listing flow stores the submission and requires contact info', () =>
  withEnv(OPTIONAL_MODE, async () => {
    const { client, inserts } = fakeAdmin();
    const missing = await handleRequest(req({ kind: 'listing', residence_name: 'Hope House' }), {
      getAdmin: () => client,
    });
    assertEquals((await body(missing)).code, 'contact_required');
    const ok = await handleRequest(
      req({ kind: 'listing', residence_name: 'Hope House', contact_email: 'a@b.co' }),
      { getAdmin: () => client },
    );
    assertEquals(ok.status, 201);
    assertEquals(inserts[0].table, 'residence_listing_submissions');
  }),
);
