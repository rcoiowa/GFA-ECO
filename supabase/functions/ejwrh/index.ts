// EJWRH public application compatibility endpoint.
//
// Supabase's managed Edge Function gateway rewrites HTML responses to
// text/plain, so this function must never be used as the browser UI. The
// application is a Cloudflare-served RecoveryOS page. Keep this public,
// no-JWT endpoint only as a redirect for old links and bookmarks.

export const EJWRH_APPLICATION_URL =
  'https://gfa-eco-recovery-residence-os.thomas-499.workers.dev/residence/directory/?apply=ejwrh';

export function handleEJWRHRequest(request: Request): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        application_url: EJWRH_APPLICATION_URL,
      }),
      {
        status: 405,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          allow: 'GET, HEAD',
          'cache-control': 'no-store',
        },
      },
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: EJWRH_APPLICATION_URL,
      'cache-control': 'no-store',
    },
  });
}

Deno.serve(handleEJWRHRequest);
