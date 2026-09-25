# Housing application consolidation — September 25, 2026

## Chosen experience

Use one accountless application component with distinct Grace House (residence 1) and EJWRH (residence 2) routes. Submit through `residence-intake` into the existing staff intake queue. Show a receipt before inviting optional account creation. Existing `convert_application_intake` is the staff-verified linking boundary; never infer identity or grant residency from an email address, reference number, or application alone. A helper must not use their account as the applicant identity. VRCC consent and residence admission remain separate.

Canonical paths:

- `/recovery-residences/grace-house/apply`
- `/recovery-residences/ejwrh/apply`
- `/recovery-residences/my-application` (authenticated, linked applications)

Legacy directory application aliases redirect within the current origin. Directory application buttons use the same canonical routes. Grace House profile no longer promises automatic resident accounts or a guaranteed bed/waitlist outcome. Registration email confirmation retains the housing status destination. No submitted records, admissions, account permissions, or consents were changed.

## Verified audit

- Canonical database: `cqcxvwoukyhxyokfwnjm`.
- `public.housing_applications`: 0 rows.
- `recoveryos.residence_application_intake`: 3 rows, all marked test fixtures; 2 closed, 1 converted.
- `recoveryos.residence_applications`: 2 rows (Grace House approved, EJWRH withdrawn), both for the same identifiable test participant; Grace House is linked to a fixture intake.
- Production Wix Contact Connect: 122 submissions, 28 marked unseen; 17 explicitly selected recovery housing, 16 of those unseen. These are inquiries without a house selection, not completed residence applications. Private identifiers are excluded from this repository.
- Wix dev Contact Connect: 3 test submissions.
- Additional housing keyword matches exist but require human review; keyword matching does not establish application intent.
- An unseen Wix flag does not prove an absence of off-platform follow-up.

## Deployment blockers observed

1. Live `residence-intake` v3 supports only `grace_house_application`; the canonical source and newer forms use `residence_application`. The function is behind main.
2. Cloudflare account's Turnstile widget list is empty. Both deployment workflows omitted `VITE_TURNSTILE_SITE_KEY`. This patch adds the setting and fails deployment when missing. The shared form gives an honest unavailable message instead of accepting entries without challenge configuration.
3. Configure the real Turnstile widget for both Worker hostnames and the chosen production domains. Set the matching `TURNSTILE_SECRET` in Supabase using the secure settings interface; never commit it. Do not enable INTAKE_TURNSTILE_OPTIONAL on CQCX.
4. Deploy the existing canonical receiver (`index.ts` + `handler.ts`) after the secret is configured. Confirm approved-origin CORS, challenge action/hostname, consent rejection, and successful test intake receipt.
5. Deploy CI-green exact commit to staging; verify both forms, staff queue receipt, sign-up confirmation return, and staff conversion with a designated synthetic identity. Then promote the same commit to the candidate Worker.
6. Retarget old EJWRH endpoint only after the destination is verified.
7. Update Wix DEV navigation and Grace House standalone apply/referral buttons after application activation; preserve document access and intake/orientation. Live GFA website cutover remains separate.
8. Check the standalone Grace House application's actual persistence and any other Wix form namespaces/legacy collections before declaring a complete organization-wide submission reconciliation.

## Validation

Platform TypeScript check, 176 platform tests (32 files), 10 Worker tests, production bundle build, and intake/cloudflare boundary checks passed locally. No live application success or account linking was simulated through a real applicant identity. No applications were auto-approved or people contacted.
