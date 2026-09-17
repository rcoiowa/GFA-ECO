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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : null);

export async function handleRequest(req: Request, deps: LeadIntakeDeps): Promise<Response> {
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
    const name =
      [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || 'A new inquiry';
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 4px">New website inquiry</h2>
      <p>${esc(name)} is waiting in the RecoveryOS lead queue (lead #${esc(data.id)}).</p>
      <p style="color:#666;font-size:12px">Open the admin lead queue for the full inquiry and contact details.</p></div>`;
    const alert = fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: resendFrom,
        to: alertTo,
        subject: 'New website inquiry in the lead queue',
        html,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          console.error(
            'lead-intake alert email failed:',
            res.status,
            await res.text().catch(() => ''),
          );
        }
      })
      .catch((e) => console.error('lead-intake alert email failed:', e));
    // Deferred reliably past the response instead of fire-and-forget: the Edge
    // runtime may otherwise terminate the isolate before the send completes.
    try {
      // @ts-ignore EdgeRuntime is provided by the Supabase Edge runtime.
      EdgeRuntime.waitUntil(alert);
    } catch {
      await alert;
    }
  }

  return json({ ok: true, code: 'received', lead_id: data.id });
}
