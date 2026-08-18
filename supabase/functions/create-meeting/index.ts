// create-meeting — server-authoritative meeting-link provisioning for a GFA
// coaching session. HARDENED (P1-C):
//   * Caller identity comes ONLY from the authenticated JWT — never from a
//     body-supplied coachEmail/coach_id.
//   * Authorization, session-state, and idempotency are enforced inside the
//     SECURITY DEFINER RPC `provision_session_meeting`, which sets meeting_url
//     transactionally. The client cannot set a link, pick another coach's room,
//     or target an arbitrary request it doesn't own.
//   * No public/guessable fallback room. If the coach has no registered room we
//     return a controlled 409, we do NOT downgrade to an open jit.si room.
//
// Request body: { session_request_id: uuid, provider?: 'ooma'|'zoom' }
// Response:     { url, provider } | { error, code }
//
// Supported meeting modes: 'ooma' (the coach's registered Ooma Office room, the
// default and only configured provider) and 'zoom' (only when ZOOM_* secrets are
// present; creates a real scheduled meeting with a waiting room). Phone/in-person
// sessions carry no URL and never call this function.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const CODE_STATUS: Record<string, number> = {
  unauthenticated: 401, not_authorized: 403, not_found: 404,
  no_coach: 409, bad_state: 409, needs_room_setup: 409,
};

async function zoomMeeting(topic?: string, startsAt?: string, durationMin = 50) {
  const accountId = Deno.env.get('ZOOM_ACCOUNT_ID');
  const clientId = Deno.env.get('ZOOM_CLIENT_ID');
  const clientSecret = Deno.env.get('ZOOM_CLIENT_SECRET');
  if (!accountId || !clientId || !clientSecret) return null;
  const tokenRes = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: 'POST', headers: { Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}` } },
  );
  const { access_token } = await tokenRes.json();
  const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: topic ?? 'GFA session', type: startsAt ? 2 : 1, start_time: startsAt, duration: durationMin,
      settings: { waiting_room: true, join_before_host: false },
    }),
  });
  const m = await res.json();
  return m.join_url ? { url: m.join_url as string } : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Sign in required', code: 'unauthenticated' }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionRequestId = body?.session_request_id;
    const provider = body?.provider ?? 'ooma';
    if (!sessionRequestId || typeof sessionRequestId !== 'string') {
      return json({ error: 'session_request_id is required', code: 'bad_request' }, 400);
    }

    // Caller-scoped client: every read/RPC runs as the caller, RLS applies, and
    // the RPC's auth.uid() is the caller — the sole source of identity.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );

    let explicitUrl: string | null = null;
    let explicitProvider: string | null = null;

    if (provider === 'zoom') {
      // Only spend a Zoom API call if the caller can even see this request as its
      // coach (cheap RLS-gated pre-check); the RPC still does the authoritative
      // ownership + state check before persisting the URL.
      const { data: { user } } = await supabase.auth.getUser();
      const { data: row } = await supabase
        .from('v2_session_requests').select('coach_id, status').eq('id', sessionRequestId).maybeSingle();
      if (!row || !user || row.coach_id !== user.id) {
        return json({ error: 'Only the assigned coach can create this meeting link', code: 'not_authorized' }, 403);
      }
      const zoom = await zoomMeeting(`GFA session`, undefined, 50);
      if (zoom) { explicitUrl = zoom.url; explicitProvider = 'zoom'; }
      // If Zoom isn't configured, fall through to the coach's Ooma room via the RPC.
    }

    const { data, error } = await supabase.rpc('provision_session_meeting', {
      p_request_id: sessionRequestId,
      p_explicit_url: explicitUrl,
      p_explicit_provider: explicitProvider,
    });
    if (error) return json({ error: 'Could not create the meeting link', code: 'rpc_error' }, 500);
    if (!data?.ok) {
      return json({ error: data?.message ?? 'Unavailable', code: data?.code ?? 'error' },
        CODE_STATUS[data?.code] ?? 400);
    }
    return json({ url: data.url, provider: data.provider });
  } catch (_e) {
    // Never leak internals.
    return json({ error: 'Unexpected error creating the meeting link', code: 'internal' }, 500);
  }
});
