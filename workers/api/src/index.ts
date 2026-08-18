/**
 * RecoveryOS shared API gateway.
 * Health/version endpoints plus the public residence-application intake:
 * external application flows (the Grace House site at gracehouse4.pages.dev,
 * and later recoveryresidence.app) POST here.
 *
 * The gateway is a CONTROLLED CQCX INTAKE BOUNDARY. It writes the submission
 * to recoveryos.residence_application_intake (service role) so it lands in the
 * staff review queue — and does NOT provision anything: no auth user, no
 * person, no residency. A prospective resident may apply before they have a
 * RecoveryOS account; staff create canonical records deliberately, later, from
 * the intake row. This preserves the person-model authority chain and matches
 * the canonical lead-intake / residence-intake boundary posture.
 */

export interface Env {
  SUPABASE_URL: string;
  /** Set via `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`. */
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  'cache-control': 'no-store',
} as const;

/** Origins allowed to submit public applications. */
const ALLOWED_ORIGINS = new Set([
  'https://gracehouse4.pages.dev',
  'https://vrcc.app',
  'https://recoveryresidence.app',
  'https://www.recoveryresidence.app',
  'https://recovery-residence-os.thomas-499.workers.dev',
  'http://localhost:5173',
]);

/** External slugs → canonical residence names (recoveryos.residences.name). */
const RESIDENCE_SLUGS: Record<string, string> = {
  'grace-house': 'Grace House',
  ejwrh: 'Ernest & Johnnie White Recovery House',
};

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

interface ApplicationRequest {
  residence?: string;
  applicant?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  answers?: Record<string, unknown>;
}

async function handleApplication(request: Request, env: Env, cors: Record<string, string>) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'intake_not_configured' }, 503, cors);
  }

  let body: ApplicationRequest;
  try {
    body = (await request.json()) as ApplicationRequest;
  } catch {
    return json({ error: 'invalid_json' }, 400, cors);
  }

  const residenceName = RESIDENCE_SLUGS[body.residence ?? ''] ?? null;
  const firstName = (body.applicant?.first_name ?? '').trim();
  const lastName = (body.applicant?.last_name ?? '').trim();
  const email = (body.applicant?.email ?? '').trim().toLowerCase();
  if (!residenceName) return json({ error: 'unknown_residence' }, 400, cors);
  if (!firstName || !lastName) return json({ error: 'name_required' }, 400, cors);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return json({ error: 'valid_email_required' }, 400, cors);

  // Answers: keep only short string values so the payload stays reviewable.
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.answers ?? {})) {
    if (typeof value === 'string' && value.trim() && key.length <= 64) {
      answers[key] = value.trim().slice(0, 2000);
    }
  }

  const serviceHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'content-type': 'application/json',
  };

  // 1. Residence lookup (canonical model lives in the recoveryos schema).
  const residenceRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/residences?name=eq.${encodeURIComponent(residenceName)}&is_active=eq.true&select=id`,
    { headers: { ...serviceHeaders, 'accept-profile': 'recoveryos' } },
  );
  const residences = residenceRes.ok ? ((await residenceRes.json()) as { id: number }[]) : [];
  const residenceId = residences[0]?.id;
  if (residenceId === undefined) return json({ error: 'residence_unavailable' }, 502, cors);

  // 2. Write the submission to the controlled pre-account intake table. NO auth
  //    user, NO person, NO residency is created — an anonymous public submission
  //    must never provision identities. Staff review the intake row and create
  //    canonical records deliberately, later.
  const intakeRes = await fetch(`${env.SUPABASE_URL}/rest/v1/residence_application_intake`, {
    method: 'POST',
    headers: { ...serviceHeaders, 'content-profile': 'recoveryos', prefer: 'return=minimal' },
    body: JSON.stringify({
      residence_id: residenceId,
      applicant_name: `${firstName} ${lastName}`,
      applicant_email: email,
      answers,
      source: new URL(request.url).hostname,
    }),
  });
  if (!intakeRes.ok) return json({ error: 'application_failed' }, 502, cors);

  return json(
    {
      status: 'received',
      next: 'Thanks — your application is in. Grace House staff will reach out within 2 business days to talk through next steps.',
    },
    201,
    cors,
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request.headers.get('origin'));

    if (url.pathname === '/health') {
      return json({ status: 'ok' }, 200);
    }

    if (url.pathname === '/version') {
      return json({ name: 'recoveryos-api', version: '0.2.0', phase: 4 }, 200);
    }

    if (url.pathname === '/public/residence-applications') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: cors });
      }
      if (request.method === 'POST') {
        return handleApplication(request, env, cors);
      }
      return json({ error: 'method_not_allowed' }, 405, cors);
    }

    return json({ error: 'not_found' }, 404);
  },
} satisfies ExportedHandler<Env>;
