# Explicit document review release candidate

This change makes each assigned document require five explicit participant statements: provided/access, received, read or explained, understood, and opportunity for questions. Nothing is selected merely by opening the document. Signature templates also require a typed name and current electronic-records consent; acknowledgment-only templates do not. Optional information-sharing, supervision and service permissions remain separate.

An explanation request is saved in an authorized housing-staff queue. Completion is blocked until the participant explicitly confirms that the explanation was received and questions answered (self, or witnessed staff confirmation). General recovery support stays accessible. Requests do not send external messages or email.

Applicant `/my-housing/documents` and resident `/residence/documents` use the same exact-version review component. Getting settled links to that workflow. `/staff/document-review` provides scoped requests and witnessed paper review; the intake checklist links with the application ID. Participants can download or print a receipt containing exact version/hash, selected statements, participant/actor, signature when required, and server timestamp. Existing completion records are labeled as legacy and receive no invented checkbox statements or actor.

## Proposed migration and production boundary

`20261023201920_document_review_attestations.sql` was named by Supabase CLI 2.122.0 `migration new` in an isolated project. It is kept in this proposal directory; it is **not** part of the applied launch ledger or the frozen prepared migration chain. Do not apply, merge, or deploy until the exact candidate and security changes below receive action-time review and the required production approval.

The shared workflow applies to applicable assigned documents across residences; Grace House uses its existing template flags. The migration begins a transaction, uses 3-second lock and 30-second statement limits, and verifies the reviewed function fingerprints. A baseline mismatch aborts. It publishes no policy body and makes no historical completion backfill. Published Grace House content is outside this change.

| Security-sensitive change                                                                                      | Intended boundary                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revoke client assignment INSERT/UPDATE/DELETE, including column grants; remove `document_assignments_ack_self` | Ordinary clients can read their assignments, but completion must use the audited RPC.                                                                                                                            |
| Retire unchecked `acknowledge_document` / `record_paper_signature` behavior                                    | Old pending calls return `attestations_required`; an existing acknowledgment remains readable. All app signing entry points use the new workflow.                                                                |
| Add `document_review_receipts` and `document_clarification_requests`                                           | RLS enabled, no permissive policies, no direct PUBLIC/anon/authenticated/service-role table grants. Access is through narrowly authorized RPCs.                                                                  |
| Add authenticated RPC execution grants                                                                         | Self completion and receipt access; staff must have the exact assignment residence. Existing platform-admin paper authority is retained, not broadened. Cross-person/cross-residence actions fail.               |
| Add immutable receipt and completion-evidence triggers                                                         | A new completion requires the matching receipt. Receipt, assignment, existing NARR evidence trigger and audit succeed or roll back together. Completed historical assignments remain immutable.                  |
| Replace issuance and readiness document checks                                                                 | Current published edition and matching residence replace historical template-key matching; issuance is serialized per person. The same shared template at a new residence gets a separate applicable assignment. |

New security-definer functions pin `search_path` to `recoveryos, pg_temp`; internal helpers have no client execute grant. Electronic consent is checked and locked on the server; paper needs authorized staff plus an explicit witness confirmation. Exact version ID, content hash and all five boolean statements are checked server-side. No new credentials, account model, login provider, domain bridge, or policy wording changes are introduced.

### Readiness decision for action-time review

The candidate retains existing admission classes, override policy, screening consent, and conditional intake rules. An earlier edition no longer satisfies a currently pending edition. A recorded completion of the **current** applicable edition still counts, with `legacy_recorded` evidence status if it predates the new receipt system. Unknown provenance is neither erased nor retrospectively attested. If the operator wants current-edition legacy records re-reviewed, that is a separate explicit policy/assignment decision; this migration does not silently impose it.

### Release and failure handling

1. Review this diff and migration, re-read function fingerprints and grants (metadata only), and obtain the required specific approval for these permission/behavior changes. Freeze the tested tree and migration SHA-256.
2. Run CI and the isolated test command below on that exact tree. Do not use `live-gate.yml` defaults or production test records.
3. Apply the approved migration through the canonical authorized release process, then deploy only the tested app candidate. During the brief migration/app transition, old signing calls fail closed. Do not broad-merge deferred PRs.
4. A failure before COMMIT rolls back the DDL/data transaction. Do not retry blindly after an uncertain execution: inspect schema, function definitions, migration record and exact outcome first.
5. After commit, retain receipt/request/history tables and immutable evidence. Do **not** restore the old self-UPDATE policy or unchecked signing RPC. If necessary, suspend the two new completion RPC execute grants for `authenticated` under a separately reviewed repair, keep evidence reads available, and direct users to staff while preparing an additive correction. Reconcile any pending request or uncertain completion from its server receipt before retrying. No evidence deletion, rewriting, unpublishing or retrospective attestation.

## Verified local evidence

Base: `b5324c84054d4beec393fc9f839f11f15a769869` (verified current `origin/main` before packaging). No live participant rows were read; only document function/catalog metadata and public publication metadata were used. A read-only Grace House template-flag check confirmed the optional intake package is not required; no optional ROI/supervision grant is introduced. Fresh document definitions are frozen in `fixtures/live-document-functions.json` as a deliberate supplement to repository replay; that fixture contains schema source, not participants.

- `python3 scripts/test-document-review.py`: **75 checks passed**, real PostgreSQL 17.11 transactions, roles/RLS/triggers and concurrency. Includes clarification → confirmation → acknowledgment; electronic and paper signatures; acknowledgment-only receipts; consent absence/revocation/expiry; invalid/missing statements; cross-person/residence and anonymous denials; malformed context; direct write and temp-schema shadow attacks; exact old-row preservation; current-edition readiness; shared-template residence move; concurrent retry/issuance; late audit-failure rollback; publication-lock SELECT compatibility and completion timeout.
- `pnpm test`: **370 tests passed** (113 domain, 21 recovery content, 236 app). Actual React review components are tested with mocked data-access transport; shared renderer displays the pinned document/table. Staff paper review and receipts are included. Auth tests preserve internal document destinations through sign-in/register links and successful return; safe-return-path tests reject external URLs and strip assignment/person identifiers from auth callbacks.
- `pnpm typecheck`, `pnpm build`, and **24 local CI guard commands** passed. Build retains its chunk-size advisory.
- `deno test --allow-env supabase/functions/tests/`: **36 passed**. Local edge compile check is blocked by the environment proxy refusing `https://esm.sh/@supabase/supabase-js@2`; the unchanged edge functions must pass the normal CI compile check before release.

The database runner creates a disposable Docker container via a local Unix socket, with no network or exposed ports. It uses the repository's full schema replay (excluding the scheduler and old content publication, as in the existing isolated replay), applies captured document functions, seeds synthetic historical rows, then applies the exact candidate. GoTrue/auth and storage infrastructure are minimal local stubs; `auth.uid()` uses a test session setting. No test passwords/tokens or production connection are needed. Full browser-to-GoTrue/PostgREST integration has **not** been run; these are real database workflow tests plus component interaction tests, not a claim of deployed end-to-end verification.

Run locally with Docker, Python 3, Node/pnpm:

```sh
python3 scripts/test-document-review.py
pnpm typecheck
pnpm test
pnpm build
```

The added CI step runs the same disposable database suite. Review application/security outcomes before any production action.
