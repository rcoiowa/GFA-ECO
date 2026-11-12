// RCO Iowa public inquiry adapter. The canonical handler remains the only lead writer.
import { handleRequest, type LeadIntakeDeps } from "./handler.ts";

export const RCO_ORIGINS = new Set([
  "https://rco-iowa-public.thomas-499.workers.dev",
  "https://rcoiowa.org",
  "https://www.rcoiowa.org",
]);
export const RCO_PERMISSION =
  "I give RCO Iowa’s founding coordinator, Grace For Addictions, permission to store this inquiry in RecoveryOS and contact me about it using the details I provide. This does not enroll me or my organization, sign me up for marketing, or authorize sharing participant records.";
export const RCO_TOPICS = new Set([
  "Organizational participation",
  "RecoveryOS pilot conversation",
  "Shared governance conversation",
  "System partnership conversation",
  "Rural access and digital inclusion",
]);

export async function handleRcoInquiry(
  req: Request,
  deps: LeadIntakeDeps,
): Promise<Response> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-store",
    vary: "Origin",
  };
  if (origin && RCO_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type, apikey";
  }
  const reply = (code: string, status: number) =>
    new Response(
      JSON.stringify({ ok: status === 200, code }),
      { status, headers },
    );
  if (!origin || !RCO_ORIGINS.has(origin)) {
    return reply("forbidden_origin", 403);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") return reply("method_not_allowed", 405);
  const secret = Deno.env.get("TURNSTILE_SECRET");
  const intakeSecret = Deno.env.get("LEAD_INTAKE_SECRET");
  if (!secret || !intakeSecret) return reply("unavailable", 503);
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    return reply("invalid_request", 415);
  }
  let p: Record<string, unknown>;
  try {
    const reader = req.body?.getReader();
    if (!reader) return reply("invalid_request", 400);
    let text = "", size = 0;
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
  // Reject extra fields so callers cannot supply source, role, routing, or broad consent.
  const keys = new Set([
    "name",
    "email",
    "organization",
    "topic",
    "message",
    "submission_id",
    "contact_permission",
    "permission_version",
    "website",
    "turnstile_token",
  ]);
  if (Object.keys(p).some((k) => !keys.has(k))) {
    return reply("invalid_request", 400);
  }
  const text = (key: string, max: number) =>
    typeof p[key] === "string" && p[key].length <= max ? p[key].trim() : "";
  const name = text("name", 120), email = text("email", 320);
  const organization = text("organization", 140), topic = text("topic", 80);
  const message = text("message", 1200), id = text("submission_id", 36);
  if (
    !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !RCO_TOPICS.has(topic) ||
    p.contact_permission !== true ||
    p.permission_version !== "rco-iowa-inquiry-v1" || p.website ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(id) ||
    (p.organization !== undefined &&
      (typeof p.organization !== "string" || p.organization.length > 140)) ||
    (p.message !== undefined &&
      (typeof p.message !== "string" || p.message.length > 1200))
  ) return reply("invalid_request", 400);
  const token = text("turnstile_token", 2048);
  if (!token) return reply("verification_required", 400);
  try {
    const response = await (deps.fetch ?? fetch)(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: token }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await response.json();
    if (
      !response.ok || result.success !== true ||
      result.hostname !== new URL(origin).hostname ||
      result.action !== "rco_inquiry"
    ) {
      return reply("verification_failed", 400);
    }
  } catch {
    return reply("verification_unavailable", 503);
  }
  const timestamp = new Date().toISOString();
  const internal = new Request(req.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-lead-secret": intakeSecret,
    },
    body: JSON.stringify({
      first_name: name,
      email,
      interest: topic,
      message: `Organization/community: ${
        organization || "Not provided"
      }\n\n${message}`,
      source: "rco_iowa_inquiry_v1",
      submission_id: `rco-iowa-${id}`,
      submitted_at: timestamp,
      organization_inquiry: true,
    }),
  });
  try {
    const response = await handleRequest(
      internal,
      { ...deps, suppressExternalAlerts: true },
      JSON.stringify({
        version: "rco-iowa-inquiry-v1",
        text: RCO_PERMISSION,
        accepted: true,
        accepted_at: timestamp,
        origin,
      }),
    );
    if (!response.ok) return reply("submission_failed", 503);
    return reply("received", 200);
  } catch {
    return reply("submission_failed", 503);
  }
}
