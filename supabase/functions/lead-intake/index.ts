// lead-intake — canonical website-lead receiver (launch architecture).
//
// Successor to the legacy pipeline (Wix → anon PostgREST insert into public.wix_contact_submissions
// → trigger → notify-new-lead). The legacy table granted `anon` full DML; this function is the ONLY
// write path for canonical leads:
//
//   Wix automation (POST, shared secret) → validate → recoveryos.leads (service role)
//     → DB trigger emits in-app staff notifications (canonical, deduped)
//     → optional MINIMAL staff email alert via Resend (name + queue pointer only —
//       no free text or contact detail leaves for Resend until a data-flow
//       decision is ratified; participant-facing external delivery remains OFF).
//
// Required secrets:
//   LEAD_INTAKE_SECRET   shared secret the Wix automation must send as `x-lead-secret` header
// Optional secrets (staff email alert; omit to disable email entirely):
//   RESEND_API_KEY, RESEND_FROM, LEAD_ALERT_TO (comma-separated staff addresses)
//
// Payload (JSON, all fields optional strings unless noted):
//   { first_name, last_name, email, phone, message, interest, readiness, source,
//     submission_id, submitted_at, organization_inquiry, residence_interest }
// Legacy Wix field names (pathway_interest) are accepted and mapped.
//
// 0147 additions (REPO-PREPARED — redeploy this function only AFTER migration 0147 is
// applied, since it writes the new columns):
//   submission_id      stable Wix submission id -> idempotency (duplicate POSTs return
//                      the existing lead instead of creating a second record)
//   submitted_at       source timestamp from Wix
//   organization_inquiry  true = partnership/outside-organization request (priority)
//   residence_interest    EXPLICIT self-selected pathway only: 'grace_house' | 'ejwrh'.
//                      Anything else stored as 'unspecified' (coordinator confirm-route).
//                      Never inferred from names or message text.
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
