# RCO Iowa inquiry backend

Date: October 7, 2026

Authority: Thomas DeGarmeaux requested that the best backend approach be implemented now and that RecoveryOS and Iowa's Recovery Community Center be linked from the RCO Iowa site. This authorizes the scoped endpoint and Cloudflare site deployment described here; it does not authorize unrelated prepared migrations, changes to clinical/participant flows, or a DNS cutover.

## Decision

Reuse canonical RecoveryOS-Launch and the existing `recoveryos.leads` queue for organizational coordination inquiries. Do not create another Supabase project or a parallel writable public intake table. Keep independent RCO Iowa branding; identify GFA's founding coordination transparently in the consent disclosure.

A separate project would duplicate identity, intake, operational support and reporting without providing a needed independent administrative boundary for this limited form. Revisit separation if independent operators require separate administration, legal data control, residency, or operational isolation. Public participation does not authorize access to other organizations' data.

## Implementation boundary

- Add an `/rco-iowa` adapter inside the canonical `lead-intake` function.
- Preserve deployed v15's `/contact` route and shared-secret receiver; reconcile the runtime-only contact adapter into GitHub to prevent rollback.
- No schema migration, RLS change, new project, or frontend privileged key.
- Explicit permission plus Turnstile, exact origins, bounded input, server-owned source/classification, generic errors, and idempotent receipt.
- Turnstile's existing production widget gains only the new RCO Iowa hostnames; existing domains and secrets remain intact.
- In-app notification behavior remains canonical. The new route suppresses external email alerts.
- Inquiry receipt is not a completed peer connection or service outcome.
- Link RecoveryOS to `https://recoverycommunity.app/` and the center to `https://recoverycommunity.center/`; both returned HTTP 200 during implementation.

## Evidence and limitations

Deployment/readiness update: full GitHub CI passed on `4b00478e82fa1df6cb96ca153e5bb2f13f103c19`; lead-intake v16 deployed. Production boundary probes then revealed missing `LEAD_INTAKE_SECRET` (`intake_disabled` on the legacy secret route); the RCO route correctly returns `unavailable`. The site keeps online submission disabled and offers direct email/phone contact until secrets are configured and a live Turnstile acceptance check passes. No bypass or hardcoded credential is used. This is a configuration blocker, not evidence of a completed live form-to-database test.

Live schema includes all required lead columns and a unique non-null `wix_submission_id` index. RLS is enabled; the current select policy permits intake coordinators or the assigned production actor. Anonymous users have no table grant. A transaction tested a synthetic service-role insert/read and rolled it back, including transactional notifications.

Security advisors reported pre-existing mutable search paths on `is_privileged_role` and `lead_contact_events_immutable`, disabled leaked-password protection, and six tables with RLS but no policies (deny by default). No schema/auth changes are made here. Follow-up references: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

`rcoiowa.org` still redirects to the older GFA initiative page. Connecting that domain is a separate site-routing action; the Cloudflare implementation is prepared for it. The site change does not activate organization self-enrollment, federated governance, cross-organization record access, or participant onboarding.
