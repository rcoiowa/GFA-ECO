# Public-intake boundary — test matrix (Phase I)

Fixtures only. **Staging project, never the launch project.** All fixture rows
carry `test_fixture = true` and the `PUBLIC-INTAKE-TEST` namespace; run
`residence_intake_cleanup.sql` after.

## Runnable now (no live DB)

| # | Test | Command | Result |
| - | ---- | ------- | ------ |
| K | No retired ref in deployable assets | `node scripts/check-no-retired-ref.mjs` | ✅ PASS |
| K | Built bundle is CQCX, not YKY | `pnpm build && grep -RL ykykeioydvtxpyreshhs apps/platform/dist` | ✅ PASS |
| K | Synced directory asset is CQCX + `Content-Profile: recoveryos` | inspect `apps/platform/public/residence/directory/index.html` | ✅ PASS |
| — | Boundary security invariants (no anon grant, RLS on, no INSERT policy, no read-back) | `node scripts/verify-intake-boundary.mjs` | ✅ 16/16 |
| — | Workspace typecheck (incl. refactored gateway + new adapters) | `pnpm typecheck` | ✅ PASS |

## Require a disposable staging project (service role + anon key)

Set `SB=https://<staging-ref>.supabase.co`, `ANON=<publishable>`, `SR=<service-role>`.
Never use the launch project ref. `psql` steps assume `$DB_URL` for staging.

| # | Test | How | Expected |
| - | ---- | --- | -------- |
| A | Listing submission via Edge Function | `POST $SB/functions/v1/residence-intake` `{"kind":"listing","residence_name":"PUBLIC-INTAKE-TEST","contact_email":"x@example.test"}` | `201 {ok:true, submission_id}` |
| B | Listing moderation permissions | call `review_residence_listing_submission` as a non-admin JWT vs a platform-admin JWT | non-admin → `not_authorized`; admin → status advances + audit row |
| C | Grace House application intake | `POST .../residence-intake` `{"kind":"grace_house_application","residence_id":<id>,"applicant_name":"PUBLIC-INTAKE-TEST"}` | `201 {ok:true, intake_id}` |
| D | No public read-back of applications | `GET $SB/rest/v1/residence_application_intake` with `apikey:$ANON` `Accept-Profile: recoveryos` | `[]` / permission denied — never fixture rows |
| E | Referral submission (unchanged) | anon `POST $SB/rest/v1/referrals` `Content-Profile: recoveryos` `{status:'received',...}` | `201` |
| F | Directory public reads | anon `GET $SB/rest/v1/residence_directory_public?apikey=$ANON` | published rows only, curated columns, no street/postal |
| G | Authorized staff reads | platform-admin JWT `select * from residence_listing_submissions`; residence-staff JWT `select * from residence_application_intake` | rows visible to the right role |
| H | Unauthorized authenticated reads denied | a plain participant JWT selects either intake table | `[]` / denied |
| I | Anon update/delete denied | anon `PATCH`/`DELETE` on either intake table | `401/403` / permission denied |
| J | No request reaches YKY | inspect every endpoint host in the boundary + network trace | all hosts = `cqcxvwoukyhxyokfwnjm.*`; zero `ykykeioydvtxpyreshhs` |

### Direct-insert negative check (defense in depth)

Even with the public anon key, a direct write to the intake tables must fail —
there is no anon grant:

```bash
curl -s -X POST "$SB/rest/v1/residence_application_intake" \
  -H "apikey: $ANON" -H "authorization: Bearer $ANON" \
  -H "content-type: application/json" -H "content-profile: recoveryos" \
  -d '{"residence_id":1,"applicant_name":"PUBLIC-INTAKE-TEST direct"}'
# expected: 401/permission denied for schema/table — NOT 201
```

### Fixtures / cleanup

```bash
psql "$DB_URL" -f supabase/launch/tests/residence_intake_fixtures.sql
# ... run G/H/D/F reads ...
psql "$DB_URL" -f supabase/launch/tests/residence_intake_cleanup.sql
```
