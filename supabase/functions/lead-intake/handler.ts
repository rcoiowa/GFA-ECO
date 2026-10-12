// lead-intake request handler — separated from index.ts so receiver-level tests
// can exercise every validation path with an injected database client, without a
// network or the Supabase runtime. index.ts wires Deno.serve to this handler with
// the real dependencies; the behavior contract lives entirely here.

// deno-lint-ignore no-explicit-any
export type AdminClient = { from: (table: string) => any };

export type LeadIntakeDeps = {
  getAdmin: () => AdminClient;
  /** fetch used for the optional staff alert email; defaults to global fetch. */
  fetch?: typeof fetch;
};

const CONTACT_ORIGINS = new Set([
  'https://vrcc.app',
  'https://www.vrcc.app',
  'https://recoveryos-staging.thomas-499.workers.dev',
  'https://gfa-eco-recovery-residence-os.thomas-499.workers.dev',
  'http://localhost:5173',
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : null);

function contactCors(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin && CONTACT_ORIGINS.has(origin)) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-methods'] = 'POST, OPTIONS';
    headers['access-control-allow-headers'] = 'content-type';
    headers['access-control-max-age'] = '86400';
    headers.vary = 'origin';
  }
  return headers;
}

function contactJson(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

async function contactChallengeOk(
  token: unknown,
  ip: string | null,
  hostname: string,
  secret: string,
  fetchFn: typeof fetch,
): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);
    const response = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    return (
      result.success === true &&
      result.hostname === hostname &&
      result.action === 'contact_connect'
    );
  } catch (error) {
    console.error('lead-intake Contact Connect Turnstile verification failed:', error);
    return false;
  }
}

function sendStaffAlert(
  lead: { first_name: string | null; last_name: string | null },
  leadId: unknown,
  config: { key: string; from: string; to: string[] },
  fetchFn: typeof fetch,
): Promise<void> {
  const name =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || 'A new inquiry';
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="margin:0 0 4px">New website inquiry</h2>
    <p>${esc(name)} is waiting in the RecoveryOS lead queue (lead #${esc(leadId)}).</p>
    <p style="color:#666;font-size:12px">Open the admin lead queue for the full inquiry and contact details.</p></div>`;
  const alert = fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: config.from,
      to: config.to,
      subject: 'New website inquiry in the lead queue',
      html,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        console.error(
          'lead-intake alert email failed:',
          response.status,
          await response.text().catch(() => ''),
        );
      }
    })
    .catch((error) => console.error('lead-intake alert email failed:', error));
  try {
    // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime.
    EdgeRuntime.waitUntil(alert);
    return Promise.resolve();
  } catch {
    return alert;
  }
}

async function handleContactConnect(req: Request, deps: LeadIntakeDeps): Promise<Response> {
  const fetchFn = deps.fetch ?? fetch;
  const origin = req.headers.get('origin');
  const cors = contactCors(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') {
    return contactJson({ ok: false, code: 'method_not_allowed' }, 405, cors);
  }
  if (!origin || !CONTACT_ORIGINS.has(origin)) {
    return contactJson({ ok: false, code: 'forbidden_origin' }, 403, cors);
  }

  const turnstileSecret = Deno.env.get('TURNSTILE_SECRET') ?? '';
  if (!turnstileSecret) {
    console.error('lead-intake Contact Connect is unavailable: TURNSTILE_SECRET is unset');
    return contactJson({ ok: false, code: 'intake_unavailable' }, 503, cors);
  }

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    payload = parsed as Record<string, unknown>;
  } catch {
    return contactJson({ ok: false, code: 'bad_json' }, 400, cors);
  }

  if (typeof payload.website === 'string' && payload.website.trim()) {
    return contactJson({ ok: true, code: 'received' }, 202, cors);
  }
  if (payload.contact_permission !== true) {
    return contactJson({ ok: false, code: 'consent_required' }, 400, cors);
  }

  const name = clip(payload.name, 120)?.trim() || null;
  const email = clip(payload.email, 320)?.trim() || null;
  const phone = clip(payload.phone, 40)?.trim() || null;
  const interest = clip(payload.interest, 40)?.trim() || null;
  const message = clip(payload.message, 500)?.trim() || null;
  const allowedInterests = new Set([
    'support',
    'loved_one',
    'housing',
    'referral',
    'volunteer',
    'partner',
    'giving',
    'not_sure',
  ]);
  if (!name) return contactJson({ ok: false, code: 'name_required' }, 400, cors);
  if (!email && !phone) return contactJson({ ok: false, code: 'contact_required' }, 400, cors);
  if (!interest || !allowedInterests.has(interest)) {
    return contactJson({ ok: false, code: 'interest_required' }, 400, cors);
  }

  const hostname = new URL(origin).hostname;
  const challengePassed = await contactChallengeOk(
    payload.turnstile_token,
    req.headers.get('cf-connecting-ip'),
    hostname,
    turnstileSecret,
    fetchFn,
  );
  if (!challengePassed) {
    return contactJson({ ok: false, code: 'challenge_failed' }, 403, cors);
  }

  const lead = {
    first_name: name,
    last_name: null,
    email,
    phone,
    interest,
    message,
    source: 'gfa_contact_connect',
  };
  const { data, error } = await deps.getAdmin().from('leads').insert(lead).select('id').single();
  if (error) {
    console.error('lead-intake Contact Connect insert failed:', error.message);
    return contactJson({ ok: false, code: 'intake_failed' }, 500, cors);
  }

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const resendFrom = Deno.env.get('RESEND_FROM') ?? '';
  const alertTo = (Deno.env.get('LEAD_ALERT_TO') ?? '')
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);
  if (resendKey && resendFrom && alertTo.length > 0) {
    await sendStaffAlert(
      lead,
      data.id,
      { key: resendKey, from: resendFrom, to: alertTo },
      fetchFn,
    );
  }

  return contactJson({ ok: true, code: 'received', lead_id: data.id }, 200, cors);
}

async function handleWixIntake(req: Request, deps: LeadIntakeDeps): Promise<Response> {
  const fetchFn = deps.fetch ?? fetch;
  const intakeSecret = Deno.env.get('LEAD_INTAKE_SECRET') ?? '';
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const resendFrom = Deno.env.get('RESEND_FROM') ?? '';
  const alertTo = (Deno.env.get('LEAD_ALERT_TO') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (req.method !== 'POST') return json({ ok: false, code: 'method_not_allowed' }, 405);
  if (!intakeSecret) return json({ ok: false, code: 'intake_disabled' }, 503);
  if (req.headers.get('x-lead-secret') !== intakeSecret) {
    return json({ ok: false, code: 'forbidden' }, 403);
  }

  let p: Record<string, unknown>;
  try {
    p = await req.json();
  } catch {
    return json({ ok: false, code: 'bad_json' }, 400);
  }

  // Residence interest is honored ONLY as an explicit self-selected value.
  const rawInterestPath = clip(p.residence_interest, 40);
  const residence_interest =
    rawInterestPath === 'grace_house' || rawInterestPath === 'ejwrh'
      ? rawInterestPath
      : 'unspecified';
  const organization_inquiry = p.organization_inquiry === true || p.organization_inquiry === 'true';
  const submittedAtRaw = clip(p.submitted_at, 40);
  const submitted_at =
    submittedAtRaw && !Number.isNaN(Date.parse(submittedAtRaw))
      ? new Date(submittedAtRaw).toISOString()
      : null;

  const lead = {
    first_name: clip(p.first_name, 120),
    last_name: clip(p.last_name, 120),
    email: clip(p.email, 320),
    phone: clip(p.phone, 40),
    message: clip(p.message, 4000),
    interest: clip(p.interest ?? p.pathway_interest, 200),
    readiness: clip(p.readiness, 200),
    source: clip(p.source, 60) ?? 'website',
    wix_submission_id: clip(p.submission_id, 120),
    submitted_at,
    organization_inquiry,
    residence_interest,
    // response_due_at is deliberately NOT written (ratified 2026-09-05, decision 3):
    // business-time targets govern operationally, but automated deadline computation is
    // deferred until GFA's operating calendar is ratified. The queue surfaces age since
    // receipt; nothing fabricates an overdue determination from assumed hours.
  };
  if (!lead.email && !lead.phone && !lead.message) {
    return json({ ok: false, code: 'empty_lead' }, 400);
  }

  const admin = deps.getAdmin();

  // Idempotency: a repeated Wix submission returns the existing record — one inquiry,
  // one thread, never a disconnected duplicate.
  if (lead.wix_submission_id) {
    const { data: existing } = await admin
      .from('leads')
      .select('id')
      .eq('wix_submission_id', lead.wix_submission_id)
      .maybeSingle();
    if (existing) return json({ ok: true, code: 'duplicate_submission', id: existing.id }, 200);
  }

  const { data, error } = await admin.from('leads').insert(lead).select('id').single();
  if (error) {
    // Diagnostic detail stays in server logs; the caller gets a generic envelope.
    console.error('lead-intake insert failed:', error.message);
    return json({ ok: false, code: 'intake_failed' }, 500);
  }

  // Optional internal staff email alert (never participant-facing).
  //
  // DATA-FLOW BOUNDARY (2026-09-07 hardening): the alert is a MINIMAL notification —
  // it deliberately carries NO free text and NO contact detail (no message, no
  // readiness, no email/phone). Sending the person's message or contact information
  // through Resend (an external processor) requires a documented data-flow decision
  // first; until one is ratified, staff read the full inquiry only inside the
  // RecoveryOS lead queue, which is RLS/role-bounded.
  if (resendKey && resendFrom && alertTo.length > 0) {
    await sendStaffAlert(
      lead,
      data.id,
      { key: resendKey, from: resendFrom, to: alertTo },
      fetchFn,
    );
  }

  return json({ ok: true, code: 'received', lead_id: data.id });
}

export async function handleRequest(req: Request, deps: LeadIntakeDeps): Promise<Response> {
  const pathname = new URL(req.url).pathname.replace(/\/+$/, '');
  if (pathname.endsWith('/lead-intake/contact')) return handleContactConnect(req, deps);
  return handleWixIntake(req, deps);
}
