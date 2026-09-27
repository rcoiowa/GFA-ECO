# Development backend separation — prepared, not deployed

## Environment contract

- `recoveryos-staging.thomas-499.workers.dev` remains the production application embedded in GFA Wix. Do not rename or redeploy it as part of this cutover.
- `gfa-eco-recovery-residence-os.thomas-499.workers.dev` becomes development/testing. Keep the name.
- `vrcc.app` remains reserved for future immersive recovery experiences; do not attach it to this development Worker.
- Public baseline: commit `6984139a3008c7813d4fd222539b1e96bf3dc043`, successful staging deployment run `36287132977`. This preparation layers on the release branch, whose subsequent changes are Wix shell/documentation. The live release endpoint was inaccessible in this execution environment; runtime equality still needs verification before cutover.

## Implemented in this change

The former production-candidate workflow now deploys development only, manually, after successful CI for the exact source commit. It requires a separate `development` GitHub environment and uses `wrangler.development.json`. The production/staging workflow is unchanged.

Set environment variables only after provisioning and verifying the isolated backend:

- `DEVELOPMENT_SUPABASE_REF`
- `DEVELOPMENT_SUPABASE_URL`
- `DEVELOPMENT_SUPABASE_PUBLISHABLE_KEY`
- `DEVELOPMENT_TURNSTILE_SITE_KEY`
- Existing Cloudflare deployment token, scoped to the appropriate account/Worker where supported.

The development build refuses production or retired project references, missing configuration, mismatched URL/ref, production publishable keys, and secret/service keys. It scans generated text assets for forbidden backend references. Contact Connect, directory data access, and housing intake use the selected backend. Development HTML displays a testing notice and disables the GFA donation checkout link. Synthetic fixture credentials are used only for local build verification and must never be deployed.

## Provisioning and cutover still required

1. Confirm the Supabase billing organization as required by the provisioning tool, retrieve the current cost, and obtain the tool's cost confirmation before creation.
2. Create an isolated backend with matching schema, functions, RLS and public reference data. Prefer a persistent development branch if supported; otherwise use a separate project. No production users, participant records, referrals, or messages. Use synthetic fixtures.
3. Review copied functions/configuration before enabling them. Do not copy production service credentials, SMTP, Resend recipients, webhooks, payment secrets, or notification integrations. Disable outbound integrations or use sandbox credentials and test recipients. Keep Grace activation OFF.
4. Configure test Auth URLs for the development Worker only, separate test accounts, test Turnstile credentials, and matching intake secrets. Verify exposed `recoveryos` schema grants and RLS with anonymous and authenticated test users. Check functions, storage, and all application flows against the new project.
5. Verify the publishable key belongs to the new backend before storing GitHub variables. Test runtime requests and writes against the isolated project and confirm production receives none.
6. Audit Cloudflare dashboard Git builds and remove any automatic deployment path that can bypass this workflow. Existing workflows on older/default branches remain unchanged until this change is adopted. This draft alone does not enforce account-wide isolation.
7. Deploy development, compare routes/layout/features with the public baseline, verify release manifest and backend routing, and clear old service-worker caches if necessary. Keep the Wix embed URL unchanged.

## Promotion policy

New changes go to development first. Production promotion must be manual and use the exact tested source commit after development verification. Existing production workflow is manual, but an automated gate requiring a successful development deployment is not added by this preparation. Add that gate before resuming production releases. Never merge a Supabase branch into production as an incidental frontend deployment.

## Validation

Nine environment guard tests pass. The full platform development build passes with synthetic configuration, including the generated-asset scan. No backend was provisioned, no production data was accessed/copied, and no Worker was deployed by this preparation.
