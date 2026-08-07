# Supabase Edge Functions — captured from production

These are the deployed Edge Functions of project `ykykeioydvtxpyreshhs`, captured
verbatim on 2026-08-07 so production can be reconstructed from Git (they previously
existed only in the deployed environment).

| Function | Deployed version captured | verify_jwt | Notes |
| --- | --- | --- | --- |
| `coaching` | v1 (2026-08-07 09:13 UTC) | **false** | The Grace Coaching prototype — a self-contained HTML/JS app served as one response. `verify_jwt=false` is intentional (the page must load pre-auth); the app itself authenticates with the publishable key and RLS is the boundary. |
| `create-meeting` | v4 (2026-07-23) | true | Caller-scoped anon client (RLS applies); Zoom S2S if secrets configured, else the coach's registered Ooma room from `coach_meeting_rooms`. |
| `notify-fanout` | v3 (2026-07-22) | true | Meant to be wired to a DB webhook on INSERT into `v2_notifications`. **Do not configure RESEND/TWILIO secrets until this function checks a shared webhook secret** — `verify_jwt` alone accepts any valid project JWT, so with secrets set it would act as a notification relay for any authenticated caller. No webhook is currently configured. |

Also live but owned elsewhere (not coaching-scope, not captured here):
`grace-companion`, `grace-companion-v6`, `vrcc-api-gateway`, `vrcc-api-gateway-v6`,
`slogan-engine`, `notify-new-lead`, `Grace` (Anthropic-proxy peer-companion; makes
no DB queries).

Deploy with the Supabase CLI (or the management API):

```bash
supabase functions deploy coaching       --project-ref ykykeioydvtxpyreshhs --no-verify-jwt
supabase functions deploy create-meeting --project-ref ykykeioydvtxpyreshhs
supabase functions deploy notify-fanout  --project-ref ykykeioydvtxpyreshhs
```

Any change deployed to production must be committed here in the same session
(same rule as migrations — see `docs/migration/live-drift-reconciliation.md`).
