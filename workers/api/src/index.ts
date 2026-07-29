/**
 * RecoveryOS shared API gateway.
 * Phase 1 scope: health + version endpoints and the routing skeleton for
 * privileged operations that must not run in the browser (notifications,
 * integrations, Grace AI orchestration in later phases).
 */

export interface Env {
  SUPABASE_URL: string;
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  'cache-control': 'no-store',
} as const;

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), { headers: JSON_HEADERS });
    }

    if (url.pathname === '/version') {
      return new Response(
        JSON.stringify({ name: 'recoveryos-api', version: '0.1.0', phase: 1 }),
        { headers: JSON_HEADERS },
      );
    }

    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: JSON_HEADERS,
    });
  },
} satisfies ExportedHandler<Env>;
