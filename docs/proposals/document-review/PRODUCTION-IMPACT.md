# Narrow production-relative document workflow

This candidate has parent d9d0ff93efd0b3018eb0b97cacebced04d8d02ef. Main-based PR45/e999af5 is preserved separately. No main merge, production write, policy publication, credential change or deployment has occurred.

## Baseline and target evidence

The parent independently verified both https://vrcc.app/release.json and https://recoveryresidence.org/release.json in its cloud browser at 2026-10-23 21:27 UTC: Git SHA d9d0ff93efd0b3018eb0b97cacebced04d8d02ef and Supabase project cqcxvwoukyhxyokfwnjm. This environment's own public GETs remain proxy-blocked; the fresh baseline confirmation is parent-provided evidence, not an inference from Worker metadata. Reconfirm immediately before release; assess any intervening delta before proceeding.

Authorized read-only Cloudflare API checks at 2026-10-23 21:14 UTC show vrcc.app attached to recoveryos-staging, enabled in production. Serving deployment: f516e83e-804f-483f-8861-df67a9d9e68a; serving version: 30b03fbb-dd22-4bde-8af5-89703434b394 at 100%, created 2026-10-16 13:22 UTC. Version metadata contains no Git SHA. The repository's gfa-eco-recovery-residence-os name is a different Worker; do not blindly deploy to that target. Reconfirm routing/version immediately before any approved cutover.

## Exact reconciliation scope

Only document review components/routes, shared domain/data-access helpers, necessary auth-return continuity, the proposed SQL, isolated fixtures/tests and evidence were grafted. The three original patch conflicts were resolved with additive exports and deliberate auth test introduction. Main-only Grace/support/privacy, Community Center layout/copy, broad housing follow-through, security guard additions and other unrelated changes were excluded. Public assets, existing worker code/config, package versions, lockfile, frozen migration chains and all policy bodies remain exactly the live baseline.

The auth helper preserves all five deployed public next destinations, adds only /my-housing, /my-housing/consent, /my-housing/documents, /residence/documents, /staff/document-review and reviewed document keys. The exact existing staff notification target /residences/applications/intake is also retained, with all query/fragment values stripped and its role/RLS guards unchanged; neighboring paths are not allowlisted. It does not copy main's broad admin/coach/VRCC next allowlist. Auth callbacks drop application/person/assignment IDs and unknown query/fragment values. An unreviewed legacy router-state destination now falls back to /home instead of being trusted; this is a navigation change to review, not an authorization change. Housing signup can return to its housing page without enrolling the user in general-support onboarding; resident/staff routes still enforce their existing role/person gates. No consent definition, account model, credential bridge or provider changes.

Two final UI corrections are included: partial consent/question success responses do not replace full workflow state while readback is pending; staff paper controls disappear when readback says the edition is no longer current. The shared SQL is unchanged from reviewed e999af5: 39,579 bytes, SHA-256 9894cacaad3c143ff07f819a702434a37e3847d689f42ab86b9f7f029fa8cb48.

## Shared database impact requiring specific approval

This is shared across residences, not Grace House-only. Client assignment INSERT/UPDATE/DELETE and column grants are revoked and the self-UPDATE policy is removed; own SELECT remains. New completion must use authorized, exact-version/hash RPCs with five explicit statements, typed signature and affirmative electronic-records consent only when required. Staff paper completion retains exact-residence/platform-admin authority and explicit witness confirmation. No optional ROI/supervision/service permission is bundled.

Receipt and clarification tables have RLS and no direct client/service-role grants. Audited completion, immutable receipt and existing evidence trigger effects are atomic. Internal definer helpers are not client executable. Legacy pending acknowledge_document and record_paper_signature calls return attestations_required; historical completions stay readable and immutable. Current-edition legacy completions continue to count without invented checkbox evidence.

Readiness now requires the current applicable signature AND acknowledgment edition at the exact residence. Earlier editions do not satisfy it. Existing admit_applicant enforces non-overridable acknowledgment items too, so a superseded acknowledgment can block admission as well as intake completion. Existing admission classes, overrides, screening and conditional rules are unchanged. There is no automatic admission. This effect needs explicit action-time approval.

## Coordinated rollout and repair proposal

1. Reconfirm live public Git SHA, actual serving Worker/domain, candidate tree and SQL hash. Re-read only relevant production function/trigger/grant metadata and compare the migration's baseline guards. Parent reviews this exact scope and obtains specific production permission.
2. Preserve the serving Worker version for an app rollback; prepare the exact candidate build with accurate release metadata, without changing policy content or applying broad branch history. Dry-run the deployment package against the verified target only after review.
3. Coordinate a brief signing cutover. Apply the approved guarded migration first, verify the committed schema/permissions read-only, then deploy the exact app. New app before migration lacks RPCs; old/cached app after migration cannot complete pending documents until reload. Reads/general support remain available. Do not restore unchecked signing to conceal this mismatch.
4. Failure before SQL COMMIT rolls back that transaction. An uncertain outcome requires read-only reconciliation before retry. After commit, keep all receipts, requests and historical evidence. Roll back the app only with the understood signing interruption; do not restore the assignment bypass or delete evidence. If needed, separately approve temporarily suspending authenticated execution of the two new completion RPCs while retaining evidence reads, then ship a reviewed forward repair. This is a coordinated, partially reversible rollout; database evidence is intentionally additive.

No merge/deployment/production migration is authorized by this artifact. The parent confirmed the baseline SHA at 21:27 UTC; specific commit/push/CI authorization and production action-time permission remain pending.
