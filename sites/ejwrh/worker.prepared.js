// EJWRH portal edge Worker — PREPARED, NOT DEPLOYED (Gate A; public deployment CLOSED).
// Route (at activation): recoveryresidence.org/ejwrh*  →  this Worker  →  origin function.
// The origin page is self-contained and sets its own security headers; this Worker
// re-asserts them at the public edge (belt and braces) and owns the public URL so the
// origin implementation can change without changing the address.

const ORIGIN = "https://cqcxvwoukyhxyokfwnjm.supabase.co/functions/v1/ejwrh";

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }
    const upstream = await fetch(ORIGIN, {
      method: request.method,
      headers: { accept: "text/html" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    const headers = new Headers(upstream.headers);
    headers.set(
      "content-security-policy",
      "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; " +
        "connect-src https://cqcxvwoukyhxyokfwnjm.supabase.co; base-uri 'none'; " +
        "form-action 'none'; frame-ancestors 'none'",
    );
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
    headers.set("x-frame-options", "DENY");
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};
