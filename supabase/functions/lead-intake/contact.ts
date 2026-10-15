// Public Contact Connect ingress. Business writes still use the canonical lead receiver.
// No Wix credentials, service role, or shared secret is sent to the browser.
import { handleRequest, type LeadIntakeDeps } from "./handler.ts";

export const CONTACT_ORIGINS = new Set([
  "https://www.graceforaddictions.org",
  "https://graceforaddictions.org",
  "https://recoveryos-staging.thomas-499.workers.dev",
  "https://gfa-eco-recovery-residence-os.thomas-499.workers.dev",
]);
export const CONTACT_PERMISSION =
  "I give Grace For Addictions permission to contact me about this request using the contact information I provide. This does not sign me up for marketing.";
const INTERESTS = new Set([
  "support",
  "loved_one",
  "housing",
  "referral",
  "volunteer",
  "partner",
  "giving",
  "not_sure",
]);

export async function handleContact(
  req: Request,
  deps: LeadIntakeDeps,
): Promise<Response> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-store",
    vary: "Origin",
  };
  if (origin && CONTACT_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type, apikey";
  }
  const reply = (code: string, status: number) =>
    new Response(JSON.stringify({ ok: status === 200, code }), {
      status,
      headers,
    });
  if (!origin || !CONTACT_ORIGINS.has(origin)) {
    return reply("forbidden_origin", 403);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") return reply("method_not_allowed", 405);
  const secret = Deno.env.get("TURNSTILE_SECRET");
  const leadSecret = Deno.env.get("LEAD_INTAKE_SECRET");
  if (!secret || !leadSecret) return reply("unavailable", 503);
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    return reply("invalid_request", 415);
  }
  let p: Record<string, unknown>;
  try {
    const reader = req.body?.getReader();
    if (!reader) return reply("invalid_request", 400);
    let text = "";
    let size = 0;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) return reply("request_too_large", 413);
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      await reader.cancel();
    }
    p = JSON.parse(text);
    if (!p || typeof p !== "object" || Array.isArray(p)) {
      return reply("invalid_request", 400);
    }
  } catch {
    return reply("invalid_request", 400);
  }
  const str = (key: string, max: number) =>
    typeof p[key] === "string" && p[key].length <= max ? p[key].trim() : "";
  const name = str("name", 120);
  const email = str("email", 320);
  const phone = str("phone", 40);
  const interest = str("interest", 30);
  const message = str("message", 500);
  const id = str("submission_id", 36);
  if (
    p.website ||
    p.contact_permission !== true ||
    !name ||
    !INTERESTS.has(interest) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(id) ||
    (!email && !phone) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    (phone && !/^[+\d().\s-]{7,40}$/.test(phone)) ||
    (typeof p.message === "string" && p.message.length > 500)
  ) {
    return reply("invalid_request", 400);
  }
  const token = str("turnstile_token", 2048);
  if (!token) return reply("verification_required", 400);
  try {
    const verify = await (deps.fetch ?? fetch)(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await verify.json();
    if (
      !verify.ok ||
      result.success !== true ||
      result.hostname !== new URL(origin).hostname ||
      result.action !== "contact_connect"
    ) {
      return reply("verification_failed", 400);
    }
  } catch {
    return reply("verification_unavailable", 503);
  }
  // These source, permission, timestamp and routing values are server-owned.
  // A permission receipt accompanies the inquiry; no general/marketing consent is inferred.
  const timestamp = new Date().toISOString();
  const internal = new Request(req.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-lead-secret": leadSecret,
    },
    body: JSON.stringify({
      first_name: name,
      email: email || null,
      phone: phone || null,
      interest,
      message,
      source: "gfa_contact_connect_v1",
      submission_id: `contact-${id}`,
      submitted_at: timestamp,
      organization_inquiry: interest === "partner" || interest === "referral",
    }),
  });
  try {
    const result = await handleRequest(
      internal,
      deps,
      JSON.stringify({
        version: "contact-connect-v1",
        text: CONTACT_PERMISSION,
        accepted: true,
        accepted_at: timestamp,
        origin,
      }),
    );
    if (!result.ok) return reply("submission_failed", 503);
    // Do not expose sequential lead IDs or echo personal data.
    return reply("received", 200);
  } catch {
    return reply("submission_failed", 503);
  }
}
