// create-meeting (canonical / launch) — server-authoritative meeting-link provisioning for a
// canonical RecoveryOS appointment. Ports the P1-hardened v2 function onto recoveryos.*:
//   * Caller identity comes ONLY from the authenticated JWT — never from the body.
//   * Authorization, appointment-state, and idempotency are enforced inside the SECURITY
//     DEFINER RPC `recoveryos.provision_appointment_meeting` (provider-or-admin only,
//     joinable state only, existing URL returned, server-authoritative write).
//   * No public/guessable fallback room — an unregistered coach room is a controlled 409.
//
// Request body: { appointment_id: number, provider?: 'ooma'|'zoom' }
// Response:     { url, provider } | { error, code }

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const CODE_STATUS: Record<string, number> = {
  unauthenticated: 401,
  not_authorized: 403,
  not_found: 404,
  bad_state: 409,
  needs_room_setup: 409,
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
      topic: topic ?? 'GFA session',
      type: startsAt ? 2 : 1,
      start_time: startsAt,
      duration: durationMin,
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
    const appointmentId = body?.appointment_id;
    const provider = body?.provider ?? 'ooma';
    if (typeof appointmentId !== 'number') {
      return json({ error: 'appointment_id is required', code: 'bad_request' }, 400);
    }

    // Caller-scoped client: RLS applies; the RPC's auth.uid() is the sole identity source.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } }, db: { schema: 'recoveryos' } },
    );

    let explicitUrl: string | null = null;
    let explicitProvider: string | null = null;

    if (provider === 'zoom') {
      // Cheap RLS-gated pre-check so an unauthorized caller can't spend a Zoom API call;
      // the RPC still performs the authoritative ownership + state check before persisting.
      const { data: me } = await supabase.rpc('current_person_id');
      const { data: appt } = await supabase
        .from('appointments')
        .select('provider_person_id, status, starts_at')
        .eq('id', appointmentId)
        .maybeSingle();
      if (!appt || me == null || appt.provider_person_id !== me) {
        return json(
          { error: 'Only the assigned coach can create this meeting link', code: 'not_authorized' },
          403,
        );
      }
      const zoom = await zoomMeeting('GFA session', appt.starts_at ?? undefined, 50);
      if (zoom) {
        explicitUrl = zoom.url;
        explicitProvider = 'zoom';
      }
      // Zoom unconfigured -> fall through to the coach's registered room via the RPC.
    }

    const { data, error } = await supabase.rpc('provision_appointment_meeting', {
      p_appointment_id: appointmentId,
      p_explicit_url: explicitUrl,
      p_explicit_provider: explicitProvider,
    });
    if (error) return json({ error: 'Could not create the meeting link', code: 'rpc_error' }, 500);
    if (!data?.ok) {
      return json(
        { error: data?.message ?? 'Unavailable', code: data?.code ?? 'error' },
        CODE_STATUS[data?.code] ?? 400,
      );
    }
    return json({ url: data.url, provider: data.provider });
  } catch (_e) {
    // Never leak internals.
    return json({ error: 'Unexpected error creating the meeting link', code: 'internal' }, 500);
  }
});
