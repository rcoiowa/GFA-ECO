# Applicant intake flow repair — October 13, 2026

Scope: frontend repair, prepared for review. No live records, roles, schema, or deployments changed.
Baseline: main 79172a47db0c851de4dde2df6b7cf249f6071172.

## Reviewed journey

Public receipt → optional account → staff conversion/link to verified person → staff review/approval → applicant documents and separate consent choices → staff readiness/move-in.
Conversion remains distinct from approval, consent, signature, and admission. No new application or person is created by the new housing area. The area's reads use the current signed-in person and existing RLS; document actions use existing server-authorized RPCs.

## Changes

- `/my-housing` unifies own application, assigned documents, and housing consent. Existing my-application URL redirects there. Navigation exposes Housing to participants and Consent to residents, including mobile navigation.
- No resident/staff role or VRCC consent gate for this own-record area. A login without a person record gets explicit identity-linking help, not automatic creation of a duplicate.
- Approved applicants go to housing documents instead of mandatory VRCC onboarding.
- Acknowledgment-only documents have a receipt action, with no fabricated signature or electronic-signature consent requirement.
- Links pin an assignment ID as well as document key; different published versions do not silently open an older signed assignment.
- Direct document entry initializes own assignments using the existing server function. Load failure does not claim completion; the applicant sees only assigned editions.
- Housing grants use `record_consent_grant`; withdrawal uses `revoke_consent_grant`. Scope-requiring releases no longer offer the generic privacy page's blanket Allow. New scoped releases continue through staff-assisted review; no disclosure activated.
- Staff sees linked/unlinked login state. Conversion success explains what happened and links to Applications. Staff checklist points to the actual applicant screens.

## Verification and limits

- Workspace TypeScript check passed.
- Platform suite: 198 tests passed before final navigation-only additions; rerun recorded in PR/CI.
- Production build passed (existing large-chunk warning).
- Live, READ ONLY SQL transactions with effective `authenticated` role and two distinct existing participant/resident-only subjects both resolved a person and returned zero other-person applications, documents, consent grants, and zero staff intake rows. No identity values or personal records were emitted. Transaction-local claim settings were rolled back. This tests selected database read paths, not browser login, write paths, or all privileged RPCs. Second subject had zero own applications; do not treat this as proof of successful own-application retrieval.
- Existing live policy/function inspection establishes self predicates and server-side acknowledgment ownership checks. No schema permissions were broadened by this change.

## Remaining release/operational checks

- Exact-commit CI and gated deployment remain required. The Worker named staging serves public production traffic.
- Browser acceptance with two controlled accounts: approved applicant without resident role, resident, different person, and logged-out visitor; own reads/actions work and foreign reads/actions fail. Do not use real participants to generate synthetic consent evidence.
- Two approved applications were observed without linked logins in the preceding audit. Identity linking/duplicate reconciliation requires verified person/account ownership; this patch deliberately does not merge or reassign records automatically. No existing safe post-conversion account-linking UI was found in the inspected repository; that remains a separate controlled remediation.
- Existing staff/platform organization-scoping findings are not solved by this frontend repair.
- The existing assignment issuer chooses the latest active residency or approved application; multi-residence/application selection remains a backend limitation. This change does not claim to fix it.

Rollback: redeploy the prior verified Worker version. No database rollback is required because this patch contains no migrations. Preserve any consent/document actions people legitimately completed after release.
