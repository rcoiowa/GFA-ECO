# Supabase Edge Functions — captured from production

These are the deployed Edge Functions of project `ykykeioydvtxpyreshhs`, captured
verbatim on 2026-08-07 so production can be reconstructed from Git (they previously
existed only in the deployed environment).

> **Legacy capture — do not deploy to RecoveryOS-Launch.** `coaching` and
> `notify-fanout` target the retired project's `v2_*` tables and are preserved
> verbatim as evidence; they are NOT deployed on the canonical launch project
> and are not part of the launch line, whose notifications are **in-app only**
> (0100/0111 triggers). Known defect recorded during PR #6 review
> (2026-08-18, unfixed here because the capture is evidence, not deployable
> source): `notify-fanout` inserts its per-channel delivery claim as
> `status: "sent"` **before** the Resend/Twilio call, so a provider failure or
> a crash mid-send leaves a false `sent`/dead `failed` row that the
> `UNIQUE(notification_id, channel)` claim then makes permanently
> non-retryable. Any future canonical external-delivery function must use a
> claim lifecycle instead: claim as `pending`/`processing` → `sent` only on
> provider success → `failed` rows retryable (retry updates the existing row
> rather than re-inserting).

| Function | Deployed version captured | verify_jwt | Notes |
| --- | --- | --- | --- |
| `coaching` | v2 (2026-08-07, P0) | **false** | The Grace Coaching prototype — a self-contained HTML/JS app served as one response. `verify_jwt=false` is intentional (the page must load pre-auth); the app authenticates with the publishable key, RLS is the boundary, and all privileged mutations go through the P0 transactional RPCs (`claim_coaching_request`, `assign_participant_to_coach`, `accept_session_proposal`). |
| `create-meeting` | v5 (2026-08-07, P1-hardened) | true | Server-authoritative. Takes `{ session_request_id, provider? }`; derives caller identity from the JWT (never a body-supplied coach id) and delegates to the `provision_session_meeting` SECURITY DEFINER RPC, which enforces coach-ownership, session state, and idempotency. **No public jit.si fallback** — a coach without a registered room gets a controlled 409. |
| `notify-fanout` | v4 (2026-08-07, P1-hardened) | **false** | DB-webhook target on INSERT into `v2_notifications`. Fail-closed: requires a matching `x-webhook-secret` (`NOTIFY_WEBHOOK_SECRET`) or it sends nothing external; validates payload; records per-channel deliveries in `v2_notification_deliveries` (unique per `(notification_id, channel)` = idempotent); consent-gated; safe-fail. `verify_jwt=false` because the shared secret is the authentication (a DB webhook carries no user JWT). |

### Enabling external notification channels (email/SMS) — required before turning on

External channels are OFF by design. To enable, ALL of the following must be true:

1. Set function secret `NOTIFY_WEBHOOK_SECRET` to a long random value.
2. Create a Supabase **Database Webhook** on `INSERT` into `public.v2_notifications`
   pointing at `notify-fanout`, with a custom header `x-webhook-secret: <same value>`.
3. Set the provider secrets you want: `RESEND_API_KEY` (+ `NOTIFY_FROM_EMAIL`, `APP_URL`)
   for email; `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` for SMS.
4. External sends still require the recipient's per-user consent flags
   (`notify_email` / `notify_sms` = true in auth metadata) and, for SMS, a phone on file.

Until step 1+2 are done, any call without the correct secret is answered
`skipped_unverified` and no email/SMS is sent — an unsigned or forged call can never
trigger a delivery.

Also live but owned elsewhere (not coaching-scope, not captured here):
`grace-companion`, `grace-companion-v6`, `vrcc-api-gateway`, `vrcc-api-gateway-v6`,
`slogan-engine`, `notify-new-lead`, `Grace` (legacy Anthropic-proxy chat function —
historical "peer companion" label, retired 2026-09-13; makes no DB queries).

Deploy with the Supabase CLI (or the management API):

```bash
supabase functions deploy coaching       --project-ref ykykeioydvtxpyreshhs --no-verify-jwt
supabase functions deploy create-meeting --project-ref ykykeioydvtxpyreshhs
supabase functions deploy notify-fanout  --project-ref ykykeioydvtxpyreshhs
```

Any change deployed to production must be committed here in the same session
(same rule as migrations — see `docs/migration/live-drift-reconciliation.md`).
