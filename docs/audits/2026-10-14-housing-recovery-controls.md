# Housing recovery controls — October 14, 2026

Status: implemented and tested in an isolated branch based on applicant-intake PR #37. Not deployed. Migration not applied. No live participant, identity, application, consent, role, residence, or bed record changed.

## Changes

- Applications links directly to the existing preapplication queue and explains conversion, approval, and admission separately.
- Residence managers can return an approved or declined application to review with a reason. The RPC checks authenticated identity, exact residence-manager scope, expected previous status, and absence of any residency for that person/residence. Prior decision metadata moves into an append-only audit event; answers, notes, intake links, document assignments, signatures, and consent remain intact. Withdrawn applications are excluded. A residency correction is a separate process.
- Bed Board exposes confirmed capacity and physical room/bed setup to scoped residence managers. The server checks capacity, current residencies, active beds, duplicate unit ambiguity, duplicate room names, and repeat submissions. It locks the residence for setup/capacity writes. It does not seed or assume any house capacity or layout.
- Unassigned beds are labeled unassigned, not a promise of public availability. Inactive unoccupied beds are omitted.
- The new RPCs deliberately use the existing audited privileged-write pattern, an empty search path, explicit schema names and role/ownership checks. EXECUTE is revoked from public/anon and granted to authenticated; authentication alone is insufficient. No underlying table privileges or RLS policies are broadened.

## Validation

- Platform TypeScript check passed.
- Platform suite: 39 files, 202 tests passed, including 3 new UI tests.
- Production Vite build passed; existing large-chunk warning remains.
- 22 isolated synthetic PostgreSQL checks passed using PGlite 0.3.14. They cover denied cross-residence/anonymous access, stale status/capacity, invalid capacity, duplicate-room retries, capacity ceilings, required correction reason, withdrawn exclusion, existing-residency rejection, audit metadata, and retained document/consent evidence.
- These tests use synthetic schema/helpers. They are not production-role, concurrency, complete historical migration-chain, or signed-in browser acceptance tests.
- No live deployment or successful applicant-document completion is asserted.

## Release dependencies

1. Complete the existing applicant-intake PR #37 acceptance gates, including controlled applicant accounts and foreign-record isolation.
2. Review this migration against the canonical live functions/policies, run integration and concurrency checks (including admission versus reopening/capacity), and confirm intended manager authority.
3. Apply the approved migration before publishing these controls. Run Supabase advisors and verify real role-scoped access.
4. Deploy the exact tested frontend through the established release workflow and verify both residence domains.

## Operational work remains separate

- Reconcile an accountless applicant with their verified login using a reviewed identity correction. Existing consent evidence makes deletion/recreation inappropriate. This branch performs no identity merge and does not prevent every future duplicate.
- Confirm each residence's actual operating capacity and room layout with its authorized operator before entering values.
- Preserve the distinction between applicants, people receiving recovery support, approved intake, and actual residency. A resident role is not a residency and does not link an application.
- Decide whether preapproval document reading should use a preview-only path. Existing assignment issuance requires approved application or active residency; do not approve applicants simply to show documents.
- Do not reset a converted intake status alone: the linked application remains. Decision correction belongs on the application with an audit trail.

No personal case details, contact information, or consent contents are included in this repository record.
