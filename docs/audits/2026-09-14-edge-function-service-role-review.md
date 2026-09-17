# Edge Function service-role write-scope review — repo sources (2026-09-14)

**Scope:** residual G3 item 3 / SUPA-FN-001 — what each function does with the
service role, what it writes, how it authenticates, and whether it fits its
contract. **Method:** read-only review of `supabase/functions/` on the
implementation branch (= `main` sources) plus branch comparison.
**Controlling caveat:** live CQCX function versions (lead-intake v11,
grace-coaching-canary v11, create-meeting v11, grace v14, grace-judge v7,
residence-intake v2, ejwrh v2) are **not provenance-mapped to these sources**
(SUPA-FN-001 open). This reviews what the repository would deploy; the live
bytes need the exact source-SHA reconciliation before certification.

## Per-function determinations

| Function | Live? | Service role? | Writes | Determination |
|---|---|---|---|---|
| `lead-intake` | ACTIVE v11 | **Yes** | `recoveryos.leads` INSERT only | Sound: fails closed without `LEAD_INTAKE_SECRET` (503), shared-secret header required, all fields length-clipped, empty leads rejected, staff email optional/internal. |
| `residence-intake` | ACTIVE v2 | **Yes** | `residence_listing_submissions`, `residence_application_intake` INSERT only | Narrow scope, bounded payloads, honeypot, origin allowlist, no read-back of sensitive rows. Known gaps below. |
| `grace` | ACTIVE v14 | No | none (reads via caller-JWT client; RLS applies) | Good posture: user-bound anon-key client, consent-gated (`consent_grants` checked), no service role, no transcript persistence path in source. |
| `grace-coaching-canary` | ACTIVE v11 | No | `support_requests` INSERT via caller-JWT client (RLS applies) | Good posture; canary-gated by env allowlist. |
| `grace-judge` | ACTIVE v7 | No | none | Eval-only; gated by `GRACE_EVAL_SECRET`. |
| `create-meeting` | ACTIVE v11 | No | via RPC `provision_session_meeting` | Caller-JWT client — but targets **legacy `v2_session_requests`** (public schema), not the recoveryos launch schema. See F-EF4. |
| `create-meeting-canonical` | not in active list | No | via RPC `provision_appointment_meeting` (`recoveryos`) | The canonical replacement exists in repo but is apparently **not the deployed one**. See F-EF4. |
| `notify-fanout` | not in active list | **Yes** | `v2_notification_deliveries` | Legacy v2 path; webhook-secret gated; hard-codes `vrcc.app` defaults. See F-EF5/LEGACY. |
| `coaching` | not in active list | No (serves client HTML) | client-side v2 tables | Legacy v2-era surface with a known pre-existing parse error (PR #8 notes). LEGACY-001 candidate. |
| `ejwrh` | **ACTIVE v2** | (unknown from main) | (unknown from main) | **No source on `main` at all** — source exists only on the PR #7 lineage. See F-EF1. |

## Findings

- **F-EF1 (HIGH, provenance):** a live function (`ejwrh` v2) has no source on
  the repository main line. Until the PR #7 lineage lands or the source is
  otherwise reconciled, the live EJWRH portal is running unreviewable-from-main
  code. Feeds REPO-003/G10; no new fix here — the fix is the provenance map.
- **F-EF2 (MEDIUM, ingress):** `main`'s `residence-intake` rejects a
  *mismatched* Origin but **accepts requests with no Origin header**, and
  Turnstile is skip-when-unset (fail-open by configuration). The PR #7 branch
  already carries missing-Origin rejection and fail-closed Turnstile —
  classify as KEEP in the PR #7 change review rather than duplicating a fix
  here. Live behavior of v2 unknown (F-EF1 caveat applies to versioning
  generally).
- **F-EF3 (G4/R1 design flag):** the Grace House application flow stores
  `consent_to_contact` as submitted (may be false) while requiring a contact
  method, and `residence_id` is client-supplied with no active-residence
  validation on `main` (PR #7 adds validation; R1's server-authoritative
  residence binding remains the ratified requirement). Route into the
  INGRESS-R1-001 / CONSENT-001 work, not a point fix.
- **F-EF4 (MEDIUM, canonical drift):** the deployed `create-meeting` (v11)
  source line targets legacy `v2_session_requests`, while the canonical
  `create-meeting-canonical` (recoveryos `appointments` + RPC) sits undeployed.
  Booking flows may be split across schemas. Needs the intake/write-map and
  deployment-provenance work (INTAKE-001, SUPA-FN-001) to converge.
- **F-EF5 (DOMAIN-003 register entries):** `vrcc.app` dependencies found in
  functions: `residence-intake` ALLOWED_ORIGINS includes `https://vrcc.app`
  (and `gracehouse4.pages.dev`, a staging worker, localhost);
  `notify-fanout` defaults `NOTIFY_FROM_EMAIL` to `VRCC <notify@vrcc.app>` and
  `APP_URL` to `https://vrcc.app`. The allowlist contains no
  `recoverycommunity.*` origins yet — the domain migration must revisit these
  under DOMAIN-003 (no blind replacement; each gets a disposition).
- **F-EF6 (LOW):** both service-role receivers return raw database
  `error.message` in their 500 envelopes — minor internal-detail disclosure;
  fold into the R1/receiver hardening pass.

## Secrets inventory (by name only)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`LEAD_INTAKE_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `LEAD_ALERT_TO`,
`TURNSTILE_SECRET`, `ANTHROPIC_API_KEY`, `GRACE_MODEL`, `GRACE_JUDGE_MODEL`,
`GRACE_EVAL_SECRET`, `GRACE_DISABLE_THINKING`, `CANARY_ENABLED`,
`CANARY_ALLOWED_SUBS`, `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`,
`ZOOM_CLIENT_SECRET`, `NOTIFY_WEBHOOK_SECRET`, `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `NOTIFY_FROM_EMAIL`, `APP_URL`.
Which are actually set live, and on which function, is not verifiable from
this session.

## Register updates

- **SUPA-FN-001:** stays open — this review covers repo sources; the live
  version ↔ source-SHA map (and F-EF1) is the remaining core.
- **DOMAIN-003:** F-EF5 entries added to the vrcc.app dependency register.
- **LEGACY-001:** `coaching`, `notify-fanout`, and the v2-targeting
  `create-meeting` line are retirement/convergence candidates once the
  canonical booking path is ratified and deployed.
- **INGRESS-R1-001 / CONSENT-001:** F-EF2/F-EF3 routed there.
