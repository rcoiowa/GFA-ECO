// residence-intake request handler — separated from index.ts so receiver-level
// tests can exercise every validation path with an injected database client and
// siteverify fetch, without a network or the Supabase runtime. index.ts wires
// Deno.serve to this handler with the real dependencies; the behavior contract
// (headers, status codes, {ok,code} envelopes) lives entirely here.

// Minimal shape of the service-role client this handler uses. The real
// implementation is @supabase/supabase-js; tests inject a fake.
// deno-lint-ignore no-explicit-any
export type AdminClient = { from: (table: string) => any };

export type IntakeDeps = {
  /** Factory for the service-role client (called once per request, after all pre-DB gates). */
  getAdmin: () => AdminClient;
  /** fetch used for the Turnstile siteverify call; defaults to global fetch. */
  fetch?: typeof fetch;
};

// Origins allowed to submit. Public discovery + Grace House frontends only.
export const ALLOWED_ORIGINS = new Set([
  'https://recoveryresidence.org',
  'https://www.recoveryresidence.org',
  'https://recoveryresidence.app',
  'https://www.recoveryresidence.app',
  'https://gracehouse4.pages.dev',
  // Canonical platform surfaces (vrcc.app is the production front door from the
  // 2026-08-31 cutover; the two workers.dev origins are the pilot and candidate
  // Workers). Reconciled 2026-08-31 with the origins found live in deployed v1 —
  // union only, nothing removed (docs/operations/vrcc-production-readiness-2026-08-31.md).
  'https://vrcc.app',
  'https://www.vrcc.app',
  'https://recoveryos-staging.thomas-499.workers.dev',
  'https://gfa-eco-recovery-residence-os.thomas-499.workers.dev',
  'http://localhost:5173',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const base: Record<string, string> = { 'content-type': 'application/json' };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    base['access-control-allow-origin'] = origin;
    base['access-control-allow-methods'] = 'POST, OPTIONS';
    base['access-control-allow-headers'] = 'content-type, authorization, apikey';
    base['access-control-max-age'] = '86400';
    base['vary'] = 'origin';
  }
  return base;
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers });

// Keep only short string values so the payload stays reviewable and bounded.
const clip = (s: unknown, n: number) =>
  typeof s === 'string' && s.trim() ? s.trim().slice(0, n) : null;
const asBool = (v: unknown) => v === true || v === 'true' || v === 'on';
const asInt = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.trunc(n) : null;
};

function boundedAnswers(raw: unknown): Record<string, string> {
  const answers: Record<string, string> = {};
  if (raw && typeof raw === 'object') {
    let count = 0;
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (count >= 40) break;
      if (typeof value === 'string' && value.trim() && key.length <= 64) {
        answers[key.slice(0, 64)] = value.trim().slice(0, 2000);
        count++;
      }
    }
  }
  return answers;
}

// Verifies the Turnstile token AND that Cloudflare attests it was minted on the
// same hostname the browser claims to submit from, for the action this flow
// expects — a token minted on another site or another form is rejected even if
// it is otherwise valid.
async function turnstileOk(
  token: unknown,
  ip: string | null,
  expected: { hostname: string; action: string },
  secret: string,
  optional: boolean,
  fetchFn: typeof fetch,
): Promise<boolean> {
  if (!secret) return optional; // fail closed unless explicitly opted out
  if (typeof token !== 'string' || !token) return false;
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const res = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const out = (await res.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (out.success !== true) return false;
    if (out.hostname !== expected.hostname) {
      console.error(
        `turnstile hostname mismatch: attested ${out.hostname}, origin ${expected.hostname}`,
      );
      return false;
    }
    if (out.action !== expected.action) {
      console.error(
        `turnstile action mismatch: attested ${out.action}, expected ${expected.action}`,
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error('turnstile siteverify failed:', e);
    return false;
  }
}

export async function handleRequest(req: Request, deps: IntakeDeps): Promise<Response> {
  const fetchFn = deps.fetch ?? fetch;
  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET') ?? '';
  const turnstileOptional = Deno.env.get('INTAKE_TURNSTILE_OPTIONAL') === 'true';

  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ ok: false, code: 'method_not_allowed' }, 405, cors);
  // Reject a MISSING Origin as well as an unapproved one: every legitimate submit
  // comes from a browser form on an allowlisted origin, which always sends Origin
  // on POST. Origin-less requests are non-browser clients this door is not for.
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return json({ ok: false, code: 'forbidden_origin' }, 403, cors);
  }
  if (!turnstileSecret && !turnstileOptional) {
    console.error('residence-intake misconfigured: TURNSTILE_SECRET unset and not opted out');
    return json({ ok: false, code: 'intake_unavailable' }, 503, cors);
  }

  let p: Record<string, unknown>;
  try {
    p = await req.json();
  } catch {
    return json({ ok: false, code: 'bad_json' }, 400, cors);
  }

  // Honeypot: a hidden field real users never fill. Pretend success on a hit so
  // bots don't learn they were caught.
  if (clip(p.company_website, 200) || clip(p.hp_field, 200)) {
    return json({ ok: true, code: 'received' }, 202, cors);
  }

  const kind = clip(p.kind, 40);
  // Expected Turnstile action per flow: tokens are minted per-form with an action
  // name, and a listing token must not authorize an application submit (or vice
  // versa). The hostname must match the (already allowlisted) submitting Origin.
  const expectedAction =
    kind === 'listing'
      ? 'residence_listing'
      : kind === 'residence_application' || kind === 'grace_house_application'
        ? 'residence_application'
        : null;
  if (expectedAction === null) {
    return json({ ok: false, code: 'unknown_kind' }, 400, cors);
  }
  const ip = req.headers.get('cf-connecting-ip');
  const originHostname = new URL(origin).hostname;
  const challengePassed = await turnstileOk(
    p.turnstile_token,
    ip,
    { hostname: originHostname, action: expectedAction },
    turnstileSecret,
    turnstileOptional,
    fetchFn,
  );
  if (!challengePassed) {
    return json({ ok: false, code: 'challenge_failed' }, 403, cors);
  }

  const admin = deps.getAdmin();

  // ---- FLOW 1: directory listing submission -------------------------------
  if (kind === 'listing') {
    const residence_name = clip(p.residence_name, 200);
    if (!residence_name) return json({ ok: false, code: 'residence_name_required' }, 400, cors);
    const row = {
      residence_name,
      organization_name: clip(p.organization_name, 200),
      address_city: clip(p.address_city, 120),
      address_state: clip(p.address_state, 60),
      address_county: clip(p.address_county, 120),
      population_served: clip(p.population_served, 300),
      residence_type: clip(p.residence_type, 120),
      support_level: clip(p.support_level, 40),
      narr_certified: p.narr_certified === undefined ? null : asBool(p.narr_certified),
      certification_details: clip(p.certification_details, 500),
      capacity: asInt(p.capacity),
      website: clip(p.website, 300),
      contact_name: clip(p.contact_name, 200),
      contact_email: clip(p.contact_email, 320),
      contact_phone: clip(p.contact_phone, 40),
      notes: clip(p.notes, 4000),
      source: clip(p.source, 60) ?? 'recoveryresidence.org',
    };
    if (!row.contact_email && !row.contact_phone) {
      return json({ ok: false, code: 'contact_required' }, 400, cors);
    }
    const { data, error } = await admin
      .from('residence_listing_submissions')
      .insert(row)
      .select('id')
      .single();
    if (error) {
      // Diagnostic detail stays in server logs only; the public body is generic.
      console.error('residence-intake listing insert failed:', error.message);
      return json({ ok: false, code: 'intake_failed' }, 500, cors);
    }
    return json({ ok: true, code: 'received', submission_id: data.id }, 201, cors);
  }

  // ---- FLOW 2: pre-account residence application ---------------------------
  // Canonical kind: 'residence_application' (any residence, bound by residence_id).
  // 'grace_house_application' is the deployed legacy alias — same flow since the R1
  // front-door work bound both houses' forms to this receiver — and stays accepted
  // so live forms keep working across redeploy ordering (2026-09-07 reconciliation
  // of the ambiguous EJWRH submission kind/residence mapping).
  const residence_id = asInt(p.residence_id);
  const applicant_name = clip(p.applicant_name, 200);
  if (residence_id === null) return json({ ok: false, code: 'residence_required' }, 400, cors);
  if (!applicant_name) return json({ ok: false, code: 'name_required' }, 400, cors);
  const applicant_email = clip(p.applicant_email, 320);
  const applicant_phone = clip(p.applicant_phone, 40);
  if (!applicant_email && !applicant_phone) {
    return json({ ok: false, code: 'contact_required' }, 400, cors);
  }
  // The residence must be a real, active canonical row — an application can never
  // bind to a retired, inactive, or invented residence id.
  const { data: residence, error: residenceError } = await admin
    .from('residences')
    .select('id, is_active')
    .eq('id', residence_id)
    .maybeSingle();
  if (residenceError) {
    console.error('residence-intake residence lookup failed:', residenceError.message);
    return json({ ok: false, code: 'intake_failed' }, 500, cors);
  }
  if (!residence || residence.is_active !== true) {
    return json({ ok: false, code: 'invalid_residence' }, 400, cors);
  }
  const row = {
    residence_id,
    applicant_name,
    applicant_email,
    applicant_phone,
    preferred_contact: clip(p.preferred_contact, 40),
    referral_source: clip(p.referral_source, 200),
    answers: boundedAnswers(p.answers),
    consent_to_contact: asBool(p.consent_to_contact),
    source: clip(p.source, 60) ?? 'gracehouse4',
  };
  const { data, error } = await admin
    .from('residence_application_intake')
    .insert(row)
    .select('id')
    .single();
  if (error) {
    console.error('residence-intake application insert failed:', error.message);
    return json({ ok: false, code: 'intake_failed' }, 500, cors);
  }
  // Deliberately return only an id — the sensitive row is never read back.
  return json({ ok: true, code: 'received', intake_id: data.id }, 201, cors);
}
