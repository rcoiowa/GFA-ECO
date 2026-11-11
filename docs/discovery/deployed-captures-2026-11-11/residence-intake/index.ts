// residence-intake — canonical public recovery-housing intake receiver (launch).
//
// The single service-role write path for the two account-less public flows that
// must NOT grant anon direct table access:
//
//   kind:"listing"                    -> recoveryos.residence_listing_submissions (Flow 1)
//   kind:"residence_application"      -> recoveryos.residence_application_intake  (Flow 2)
//   kind:"grace_house_application"    -> legacy alias for Flow 2 (deployed forms)
//
// Referrals (Flow 3) are UNCHANGED — they keep their existing constrained anon
// PostgREST insert into recoveryos.referrals (0016/0110). This function is only
// for the two flows whose tables are deliberately service-role-only.
//
//   public browser form (recoveryresidence.org / gracehouse4 / platform directory)
//   → CORS-checked, honeypot-checked, size-capped, field-allowlisted →
//   service-role insert → DB trigger emits in-app staff notifications.
//
// Unlike lead-intake (called server-to-server by a Wix automation holding a
// shared secret), this endpoint is invoked from PUBLIC BROWSERS, which cannot
// safely hold a secret. Its abuse controls are therefore: a MANDATORY origin
// allowlist (a missing Origin header is rejected, not just an unapproved one),
// a honeypot field, strict payload caps, field allowlisting, residence
// validation against active canonical rows, and Cloudflare Turnstile — which is
// MANDATORY in production (2026-09-07 hardening): the function fails closed with
// 503 when TURNSTILE_SECRET is unset unless INTAKE_TURNSTILE_OPTIONAL="true" is
// explicitly set (pre-production/local only; never set it on CQCX). Turnstile
// verification also checks the attested hostname (must match the submitting
// Origin) and action (per-flow). The intake tables have NO anon grant, so even a
// leaked anon key cannot write to them directly — this function (service role)
// is the only door. Public error bodies are generic {ok,code}; diagnostic detail
// goes only to server logs.
//
// Required secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Edge runtime provides these)
//   TURNSTILE_SECRET   a valid `turnstile_token` is required per submit
// Escape hatch (NEVER in production):
//   INTAKE_TURNSTILE_OPTIONAL="true"  skips the Turnstile requirement
//
// The request handler lives in handler.ts so receiver-level tests (CI: deno test)
// can exercise every validation path with injected dependencies.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleRequest } from './handler.ts';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve((req: Request) =>
  handleRequest(req, {
    getAdmin: () => createClient(SB_URL, SERVICE_KEY, { db: { schema: 'recoveryos' } }),
  }),
);
