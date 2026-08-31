// residence-intake — canonical public recovery-housing intake receiver (launch).
//
// The single service-role write path for the two account-less public flows that
// must NOT grant anon direct table access:
//
//   kind:"listing"                -> recoveryos.residence_listing_submissions   (Flow 1)
//   kind:"grace_house_application"-> recoveryos.residence_application_intake     (Flow 2)
//
// Referrals (Flow 3) are UNCHANGED — they keep their existing constrained anon
// PostgREST insert into recoveryos.referrals (0016/0110). This function is only
// for the two flows whose tables are deliberately service-role-only.
//
//   public browser form (recoveryresidence.org / gracehouse4) → CORS-checked,
//   honeypot-checked, size-capped, field-allowlisted → service-role insert →
//   DB trigger emits in-app staff notifications (canonical, deduped).
//
// Unlike lead-intake (called server-to-server by a Wix automation holding a
// shared secret), this endpoint is invoked from PUBLIC BROWSERS, which cannot
// safely hold a secret. Its abuse controls are therefore: an origin allowlist,
// a honeypot field, strict payload caps, field allowlisting, and an OPTIONAL
// Cloudflare Turnstile check (enabled only when TURNSTILE_SECRET is set). The
// intake tables have NO anon grant, so even a leaked anon key cannot write to
// them directly — this function (service role) is the only door.
//
// Required secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Edge runtime provides these)
// Optional secrets:
//   TURNSTILE_SECRET   when set, a valid `turnstile_token` is required per submit

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET") ?? "";

// Origins allowed to submit. Public discovery + Grace House frontends only.
const ALLOWED_ORIGINS = new Set([
  "https://recoveryresidence.org",
  "https://www.recoveryresidence.org",
  "https://recoveryresidence.app",
  "https://www.recoveryresidence.app",
  "https://gracehouse4.pages.dev",
  // Canonical platform surfaces (vrcc.app is the production front door from the
  // 2026-08-31 cutover; the two workers.dev origins are the pilot and candidate
  // Workers). Reconciled 2026-08-31 with the origins found live in deployed v1 —
  // union only, nothing removed (docs/operations/vrcc-production-readiness-2026-08-31.md).
  "https://vrcc.app",
  "https://www.vrcc.app",
  "https://recoveryos-staging.thomas-499.workers.dev",
  "https://gfa-eco-recovery-residence-os.thomas-499.workers.dev",
  "http://localhost:5173",
  "https://gracehouse4.pages.dev",
  "https://vrcc.app",
  "https://recoveryos-staging.thomas-499.workers.dev",
  "http://localhost:5173",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const base: Record<string, string> = { "content-type": "application/json" };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    base["access-control-allow-origin"] = origin;
    base["access-control-allow-methods"] = "POST, OPTIONS";
    base["access-control-allow-headers"] = "content-type, authorization, apikey";
    base["access-control-max-age"] = "86400";
    base["vary"] = "origin";
  }
  return base;
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers });

// Keep only short string values so the payload stays reviewable and bounded.
const clip = (s: unknown, n: number) =>
  typeof s === "string" && s.trim() ? s.trim().slice(0, n) : null;
const asBool = (v: unknown) => v === true || v === "true" || v === "on";
const asInt = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 100000 ? Math.trunc(n) : null;
};

function boundedAnswers(raw: unknown): Record<string, string> {
  const answers: Record<string, string> = {};
  if (raw && typeof raw === "object") {
    let count = 0;
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (count >= 40) break;
      if (typeof value === "string" && value.trim() && key.length <= 64) {
        answers[key.slice(0, 64)] = value.trim().slice(0, 2000);
        count++;
      }
    }
  }
  return answers;
}

async function turnstileOk(token: unknown, ip: string | null): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // disabled → skip
  if (typeof token !== "string" || !token) return false;
  try {
    const form = new FormData();
    form.append("secret", TURNSTILE_SECRET);
    form.append("response", token);
    if (ip) form.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const out = (await res.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ ok: false, code: "method_not_allowed" }, 405, cors);
  // Reject cross-origin submissions from origins we do not recognize.
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ ok: false, code: "forbidden_origin" }, 403, cors);
  }

  let p: Record<string, unknown>;
  try {
    p = await req.json();
  } catch {
    return json({ ok: false, code: "bad_json" }, 400, cors);
  }

  // Honeypot: a hidden field real users never fill. Pretend success on a hit so
  // bots don't learn they were caught.
  if (clip(p.company_website, 200) || clip(p.hp_field, 200)) {
    return json({ ok: true, code: "received" }, 202, cors);
  }

  const ip = req.headers.get("cf-connecting-ip");
  if (!(await turnstileOk(p.turnstile_token, ip))) {
    return json({ ok: false, code: "challenge_failed" }, 403, cors);
  }

  const admin = createClient(SB_URL, SERVICE_KEY, { db: { schema: "recoveryos" } });
  const kind = clip(p.kind, 40);

  // ---- FLOW 1: directory listing submission -------------------------------
  if (kind === "listing") {
    const residence_name = clip(p.residence_name, 200);
    if (!residence_name) return json({ ok: false, code: "residence_name_required" }, 400, cors);
    const row = {
      residence_name,
      organization_name: clip(p.organization_name, 200),
      address_city: clip(p.address_city, 120),
      address_state: clip(p.address_state, 60),
      address_county: clip(p.address_county, 120),
      population_served: clip(p.population_served, 300),
      residence_type: clip(p.residence_type, 120),
      support_level: clip(p.support_level, 40),
      narr_certified: p.narr_certified === undefined ? null : asBool(p.narr_certified),
      certification_details: clip(p.certification_details, 500),
      capacity: asInt(p.capacity),
      website: clip(p.website, 300),
      contact_name: clip(p.contact_name, 200),
      contact_email: clip(p.contact_email, 320),
      contact_phone: clip(p.contact_phone, 40),
      notes: clip(p.notes, 4000),
      source: clip(p.source, 60) ?? "recoveryresidence.org",
    };
    if (!row.contact_email && !row.contact_phone) {
      return json({ ok: false, code: "contact_required" }, 400, cors);
    }
    const { data, error } = await admin
      .from("residence_listing_submissions")
      .insert(row)
      .select("id")
      .single();
    if (error) return json({ ok: false, code: "insert_error", message: error.message }, 500, cors);
    return json({ ok: true, code: "received", submission_id: data.id }, 201, cors);
  }

  // ---- FLOW 2: Grace House pre-account application ------------------------
  if (kind === "grace_house_application") {
    const residence_id = asInt(p.residence_id);
    const applicant_name = clip(p.applicant_name, 200);
    if (residence_id === null) return json({ ok: false, code: "residence_required" }, 400, cors);
    if (!applicant_name) return json({ ok: false, code: "name_required" }, 400, cors);
    const applicant_email = clip(p.applicant_email, 320);
    const applicant_phone = clip(p.applicant_phone, 40);
    if (!applicant_email && !applicant_phone) {
      return json({ ok: false, code: "contact_required" }, 400, cors);
    }
    const row = {
      residence_id,
      applicant_name,
      applicant_email,
      applicant_phone,
      preferred_contact: clip(p.preferred_contact, 40),
      referral_source: clip(p.referral_source, 200),
      answers: boundedAnswers(p.answers),
      consent_to_contact: asBool(p.consent_to_contact),
      source: clip(p.source, 60) ?? "gracehouse4",
    };
    const { data, error } = await admin
      .from("residence_application_intake")
      .insert(row)
      .select("id")
      .single();
    if (error) return json({ ok: false, code: "insert_error", message: error.message }, 500, cors);
    // Deliberately return only an id — the sensitive row is never read back.
    return json({ ok: true, code: "received", intake_id: data.id }, 201, cors);
  }

  return json({ ok: false, code: "unknown_kind" }, 400, cors);
});
