// Canonical Grace Edge Function — RecoveryOS-Launch.
//
// Server-authoritative AI peer companion. Contract (Grace Implementation
// Authority V1.0 / directive §5, §9, §10, §11, §13, §19, §20):
//   • requires an authenticated user JWT (verify_jwt=true) and derives the
//     person from Auth — NEVER trusts a participant id from the browser;
//   • re-checks the `ai_features` consent grant server-side (a modified client
//     cannot bypass consent);
//   • assembles MINIMUM-NECESSARY, already-authorized context via the caller's
//     own JWT so RLS enforces own-data-only (cross-participant reads are
//     impossible here);
//   • holds the provider credential server-side; the browser cannot choose the
//     model, the system prompt, the safety policy, the provider, or identity;
//   • bounds request/context size, times out, handles upstream errors safely;
//   • NEVER logs message/response bodies, NEVER emits body analytics, NEVER
//     writes a service_event, notification, or any participant record, NEVER
//     alerts staff. Conversation body is request/response only — nothing is
//     persisted here.
//
// Safety degrades gracefully: if consent is missing or the provider is
// unconfigured/failing, the function still returns the deterministic safety
// posture so the UI can surface Support Now without the model.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  buildSystemPrompt,
  deterministicSafetyFloor,
  DISCLOSURE,
  POLICY_VERSION,
  SURFACE_SUPPORT_NOW,
  type GraceContext,
  type RetrievalBlock,
  type SafetyCategory,
} from './policy.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

// ---- Bounds (directive §10) ------------------------------------------------
const MAX_MESSAGES = 24; // last N turns kept
const MAX_MSG_CHARS = 4000; // per-message clamp
const MAX_TOTAL_CHARS = 24000; // whole-conversation clamp
const PROVIDER_TIMEOUT_MS = 30000;
const MAX_TOKENS = 768;

// Model is server-side and env-overridable; NEVER from the client. It is
// deliberately NOT hardcoded to the historical value — final lock happens after
// the Grace evaluation suite runs against real credentials (report §O/§P).
const AI_CONSENT_TYPE_KEY = 'ai_features';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

interface InboundMessage {
  role?: string;
  content?: string;
}

function clampMessages(raw: unknown): { role: 'user' | 'assistant'; content: string }[] {
  const arr = Array.isArray(raw) ? (raw as InboundMessage[]) : [];
  const mapped = arr
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: String(m.content ?? '').slice(0, MAX_MSG_CHARS),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_MESSAGES);
  // trim leading assistant turns so the transcript starts with a user turn
  while (mapped.length && mapped[0].role !== 'user') mapped.shift();
  // whole-conversation char budget (drop oldest until under budget)
  let total = mapped.reduce((n, m) => n + m.content.length, 0);
  while (total > MAX_TOTAL_CHARS && mapped.length > 1) {
    const dropped = mapped.shift();
    total -= dropped ? dropped.content.length : 0;
    while (mapped.length && mapped[0].role !== 'user') {
      const d2 = mapped.shift();
      total -= d2 ? d2.content.length : 0;
    }
  }
  return mapped;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, code: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json({ ok: false, code: 'unauthenticated' }, 401);
  }

  // Caller-scoped client: every DB read below runs under the participant's own
  // JWT, so RLS guarantees own-data-only. No service-role client is used.
  const sb = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData?.user) return json({ ok: false, code: 'unauthenticated' }, 401);

  // Derive the person from Auth — never from the browser body.
  const { data: person } = await sb
    .schema('recoveryos')
    .from('people')
    .select('id, first_name, preferred_name')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle();
  if (!person) return json({ ok: false, code: 'no_person' }, 403);

  // Parse + bound the body. Any client-supplied system_prompt / model / policy
  // / identity / provider / tool fields are read ONLY to be ignored.
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: 'bad_request' }, 400);
  }
  const messages = clampMessages(body.messages);
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
  const floor: SafetyCategory = deterministicSafetyFloor(lastUser);
  const surfaceSupportNow = SURFACE_SUPPORT_NOW.has(floor);
  const safety = { category: floor, surface_support_now: surfaceSupportNow };

  if (!messages.length) {
    return json({ ok: false, code: 'empty', safety, policy_version: POLICY_VERSION }, 400);
  }

  // ---- Server-side consent gate (directive §9) — cannot be bypassed by a
  // modified browser. No provider call happens without an active grant.
  const { data: consentType } = await sb
    .schema('recoveryos')
    .from('consent_types')
    .select('id')
    .eq('key', AI_CONSENT_TYPE_KEY)
    .maybeSingle();
  let consentActive = false;
  if (consentType) {
    const { data: grant } = await sb
      .schema('recoveryos')
      .from('consent_grants')
      .select('status, revoked_at, expires_at')
      .eq('person_id', person.id)
      .eq('consent_type_id', consentType.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    consentActive =
      !!grant &&
      grant.status === 'granted' &&
      grant.revoked_at === null &&
      (grant.expires_at === null || new Date(grant.expires_at).getTime() > Date.now());
  }
  if (!consentActive) {
    // Structured, non-sensitive — the frontend explains and offers the consent UX.
    return json({ ok: false, code: 'consent_required', safety, policy_version: POLICY_VERSION }, 200);
  }

  // ---- Minimum-necessary authorized context (directive §8) — own data only.
  // NO psychographic tables are read (Enneagram/True Colors/MBTI/Big Five/
  // attachment/ACE/shame/isolation/inferred stage/risk are never touched).
  const ctx: GraceContext = {
    firstName: person.preferred_name || person.first_name || null,
    icarePhase: null,
    hasCoach: false,
    hasNavigator: false,
    nextSessionAt: null,
    faithPreference: null,
  };
  try {
    const [coach, nav, appt] = await Promise.all([
      sb
        .schema('recoveryos')
        .from('coaching_relationships')
        .select('id')
        .eq('participant_person_id', person.id)
        .eq('status', 'active')
        .limit(1),
      sb
        .schema('recoveryos')
        .from('navigation_relationships')
        .select('id')
        .eq('participant_person_id', person.id)
        .eq('status', 'active')
        .limit(1),
      sb
        .schema('recoveryos')
        .from('appointments')
        .select('starts_at, status')
        .eq('person_id', person.id)
        .eq('status', 'confirmed')
        .gt('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(1),
    ]);
    ctx.hasCoach = !!(coach.data && coach.data.length);
    ctx.hasNavigator = !!(nav.data && nav.data.length);
    if (appt.data && appt.data[0]) ctx.nextSessionAt = appt.data[0].starts_at as string;
  } catch {
    // Context is best-effort; Grace still works without it.
  }

  // ---- Canonical retrieval (directive §14/§15) — exact slogans from
  // recoveryos.slogans; never fabricated. Small, bounded subset.
  const retrieval = await retrieveCanonical(sb, lastUser);

  // ---- Provider call (server-side key; model server-side) ------------------
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
  const model = Deno.env.get('GRACE_MODEL') ?? '';
  if (!apiKey || !model) {
    // Not configured for generation yet. Safety posture still returned so the
    // UI surfaces Support Now; NO fabricated model output.
    return json(
      {
        ok: false,
        code: 'ai_unconfigured',
        safety,
        disclosure: DISCLOSURE,
        policy_version: POLICY_VERSION,
      },
      200,
    );
  }

  const system = buildSystemPrompt(ctx, floor, retrieval);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system, messages }),
    });
    if (!res.ok) {
      // Do NOT log the upstream body (may echo content). Status only.
      console.error('grace upstream status', res.status);
      return json(
        { ok: false, code: 'provider_error', safety, policy_version: POLICY_VERSION },
        200,
      );
    }
    const data = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const content = Array.isArray(data.content)
      ? data.content
          .filter((b) => b.type === 'text')
          .map((b) => b.text ?? '')
          .join('')
      : '';
    return json({
      ok: true,
      code: 'ok',
      content,
      safety,
      retrieval: { used: retrieval.usedRetrieval, slogan_numbers: retrieval.sloganNumbers },
      policy_version: POLICY_VERSION,
      model_id: model, // process metadata only; not a body
    });
  } catch (_err) {
    // Timeout or network — never log the request/response body.
    console.error('grace provider exception');
    return json({ ok: false, code: 'provider_error', safety, policy_version: POLICY_VERSION }, 200);
  } finally {
    clearTimeout(timeout);
  }
});

/**
 * Retrieve exact canonical content from recoveryos.slogans (+ a couple of
 * resources) via the caller's JWT. Lightweight relevance: match category/tags
 * against keywords in the last user message; fall back to a small default set.
 * Never fabricates; provenance (slogan number + attribution) preserved.
 */
async function retrieveCanonical(
  sb: ReturnType<typeof createClient>,
  lastUser: string,
): Promise<RetrievalBlock> {
  const empty: RetrievalBlock = { text: '', sloganNumbers: [], usedRetrieval: false };
  try {
    const { data: slogans } = await sb
      .schema('recoveryos')
      .from('slogans')
      .select('id, slogan_text, slogan_short, category, tags, author_credit')
      .eq('is_active', true)
      .limit(60);
    if (!slogans || !slogans.length) return empty;

    const t = lastUser.toLowerCase();
    const scored = slogans
      .map((s) => {
        const hay = `${s.category ?? ''} ${(s.tags ?? []).join(' ')}`.toLowerCase();
        const words = hay.split(/[^a-z]+/).filter((w) => w.length > 3);
        const score = words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
        return { s, score };
      })
      .sort((a, b) => b.score - a.score);
    const top = (scored[0]?.score ? scored.filter((x) => x.score > 0) : scored).slice(0, 3);

    const lines = top.map(
      (x) => `  • [#${x.s.id}] "${x.s.slogan_text}"${x.s.slogan_short ? ` — ${x.s.slogan_short}` : ''}`,
    );
    const attribution = top[0]?.s.author_credit ?? 'Recovering the Mind, Grace For Addictions';
    const text = `
Canonical slogans available (use at most ONE, verbatim, only if it fits; the
person may decline; attribute to: ${attribution}):
${lines.join('\n')}`;
    return { text, sloganNumbers: top.map((x) => Number(x.s.id)), usedRetrieval: true };
  } catch {
    return empty;
  }
}
