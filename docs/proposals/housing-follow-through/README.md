# Housing follow-through and admin collaboration review

Review branch: `feat/housing-follow-through-review`, based on `43bd9c2`. No merge, deployment, live record mutation, production migration, or access expansion performed. No AGENTS.md was present under /workspace; CLAUDE.md was read. PR40 and unrelated release work were not merged or changed.

## Implemented slice

- Intake conversion stays visible in “Waiting on us”; every disposition retains a housing section and original source/review context. Conversion is not housing completion.
- Housing follows the existing intake primary key. Canonical application/person identifiers are read from that intake, never duplicated. Housing rows and append-only contact/action history survive conversion.
- One current owner; proposal does not transfer responsibility or grant access. The recipient must authenticate, remain residence-authorized, and explicitly accept. Changes use optimistic versions and database locks. Only housing commitments move; no coaching tables or relationship claims are used.
- One outstanding housing commitment with a required due time. It cannot silently be overwritten. Completion requires evidence; closure requires no open commitment or covering proposal. Reopening is explicit.
- Bed evidence records available / held / assigned / occupied separately, reference, evidence, observation time and actor. These are observations, not bed allocation commands; they do not mutate inventory or establish eligibility/admission.
- Previous connected contact can be recorded with an explicitly unknown date. Existing Wix/contact-connect/pre-application references may be recorded without importing identities or creating records. Exact duplicate references are refused. Linked inquiry contacts are read under their existing RLS; unavailable/hidden history is not described as no contact.
- `/admin/collaboration` has the existing administrator/system-administrator guard and backend administrator-context check. Durable workspaces are private to the authenticated administrator and scoped to one authorized residence; no cross-admin sharing is introduced. It provides a contextual brief, scoped IDs, notes, summary batches, proposed changes, manual matches, review decisions, durable server revisions and draft review annotations. Executives are excluded from this route.
- Summary batches retain source type, source date as supplied, coverage text, import timestamp, overlap notes and duplicate count. Line splitting is explicit, human-reviewed extraction, not AI interpretation. Exact normalized duplicates are skipped; different wording requires manual comparison. Relative weekdays remain text.
- Proposed destinations: facilities queue, decision log, policy review, meeting agenda, restricted follow-up. Reported/requested/proposed/announced/verified states remain distinct. Verification/policy review requires evidence. Restricted items require an authorized resident ID; no first-name matching. Edits invalidate approval. All decisions are review only; there is no resident write or execution transport.

## Deliberate limitations

Housing controls are **off by default** (`VITE_HOUSING_FOLLOW_THROUGH_ENABLED` must equal `true`). The backend is a reviewed SQL proposal under docs, outside the migration ledger. No live schema state is inferred from old “prepared/dark” comments, and none was queried or modified during this build.

Admin persistence now uses `read_admin_collaboration_workspace` and `save_admin_collaboration_workspace`, proposed in `collaboration-schema.sql`. Missing schema or denied access fails closed: the page explicitly reports persistence unavailable and disables editing/saving. Save is explicit, server-versioned and optimistic; errors never claim success or automatically retry an uncertain save. A reload is required before retry. Unsaved edits are not durable, and the paste buffer must be extracted into a batch before saving. No participant summaries are stored in browser localStorage.

Immutable server revisions record authenticated actor, server time, version and full snapshot. Embedded draft annotations are untrusted client content, clearly distinguished from the authoritative server save audit. The server validates intake/residence and resident membership, rejects incomplete review approval and execution states, and offers no resident write path. Cross-residence switching is blocked while edits are unsaved; loading another context clears the previous draft.

There is still no periodic scheduler, GroupMe connector, automated anonymizer, model provider or authenticated bridge to this dot conversation. The build does not change the locked Grace provider configuration. See `TRANSPORT-AND-DEPLOYMENT.md` for the concrete proposed transport and separate approvals.

The existing intake list read is limited to 100 rows. Matching only offers returned authorized records; absence does not establish that a person/application does not exist. The housing slice requires an existing linked intake. For a CRM contact with no established intake, retain contextual notes/source references pending an authorized identity/linking workflow; this change deliberately does not create a duplicate person or pre-application. Original Wix details and the real scenario are not seeded.

The covering proposal accepts only a canonical person ID with an active staff/manager assignment to the same residence and explicit production classification; it grants no access and cannot transfer unless the recipient has current residence/care-operations authorization. A scoped eligible-staff picker and long-term administrator reassignment procedure remain follow-up work. Linked inquiry RLS may legitimately hide historical contacts from housing staff; no permission is broadened to compensate.

## Local review

From repository root, after installing the pinned workspace dependencies:

```sh
node apps/platform/node_modules/vite/bin/vite.js --config apps/platform/vite.review.config.ts
```

Open http://127.0.0.1:5174. This is a separate synthetic development harness, not a production login bypass. Its aliases replace all data and auth imports with synthetic functions; a localhost-only development endpoint saves synthetic snapshots to `/tmp/recoveryos-synthetic-review.json` (mode 0600, atomic rename and optimistic versions). It never uses browser storage. This is a clearly labeled synthetic persistence demonstration, not the production adapter. The normal app config does not import those aliases. No credentials are used. The harness demonstrates admin review; housing write behavior is tested against local PostgreSQL and the housing UI tests.

```sh
node node_modules/typescript/bin/tsc --noEmit -p apps/platform/tsconfig.json
node apps/platform/node_modules/vitest/vitest.mjs run --root apps/platform
node apps/platform/node_modules/vite/bin/vite.js build --config apps/platform/vite.config.ts --outDir /tmp/recoveryos-review-dist apps/platform
```

## Database proposal and reproducible local tests

`schema.sql` and `collaboration-schema.sql` are proposals, **not approved production migrations**. `test-bootstrap.sql` creates only synthetic IDs and minimal authorization contract stubs. These tests prove SQL behavior against those contracts; they do not prove the live helpers or full migration history. Never run the bootstrap/test scripts against an existing database.

```sh
docker run --name recoveryos-housing-review -e POSTGRES_HOST_AUTH_METHOD=trust -d postgres:17-alpine
# No published port, no mounted application secrets. Wait for pg_isready.
docker exec recoveryos-housing-review pg_isready -U postgres
docker exec -i recoveryos-housing-review psql -U postgres -v ON_ERROR_STOP=1 < docs/proposals/housing-follow-through/test-bootstrap.sql
docker exec -i recoveryos-housing-review psql -U postgres -v ON_ERROR_STOP=1 < docs/proposals/housing-follow-through/schema.sql
docker exec -i recoveryos-housing-review psql -U postgres -v ON_ERROR_STOP=1 < docs/proposals/housing-follow-through/test-contract.sql
docker exec -i recoveryos-housing-review psql -U postgres -v ON_ERROR_STOP=1 < docs/proposals/housing-follow-through/collaboration-schema.sql
docker exec -i recoveryos-housing-review psql -U postgres -v ON_ERROR_STOP=1 < docs/proposals/housing-follow-through/test-collaboration.sql
python3 docs/proposals/housing-follow-through/test-concurrency.py recoveryos-housing-review postgres
```

Tests cover cross-residence denial, anonymous denial, direct-write denial, append-only history, stale writes, cover acceptance, source deduplication, unknown-date contact, retained commitments/contact through conversion, evidence requirements, bed-state distinction and closure blocking.

## Deployment prerequisites — not executed

1. Review this branch independently of PR40/current release work. Obtain deployment and migration authorization separately.
2. Verify actual target schema, current RLS and classification-aware definitions of `current_person_id`, `staff_residence_ids`, `is_care_operations_staff`, `is_production_person`, and inquiry/contact access. Confirm the proposed writer predicate exactly matches current intake authority; adapt and retest if organizational policy differs. Verify FK types and the current conversion RPC behavior against this contract. Do not activate based on old labels.
3. Create a proper migration through the repository's approved CLI/migration process from the reviewed proposal. Run it on an isolated full-schema staging database with production-equivalent RLS, including revoked, unclassified, fixture, cross-organization and residence actors. Run concurrency and conversion-path integration checks and database security advisors. Review table/RPC grants; no changes to existing role helpers are required.
4. Plan data retention, backup and rollback. Do not drop housing history on rollback: disable the frontend flag and revoke new RPC execution first; retain rows for reconciliation. No destructive rollback script is supplied.
5. Only after approved migration and access verification, enable `VITE_HOUSING_FOLLOW_THROUGH_ENABLED=true` in the approved build. Smoke-test claim/propose/accept/contact/next-action/completion/closure with synthetic staging identities. Existing intake context remains usable with the flag off.
6. Separately authorize the proposed durable collaboration migration and implementation of a supported authenticated assistant bridge before promising persistence or connection. Any future execution adapter requires item-specific permission checks, authorization for the operation, idempotency, reviewed diffs, and durable audit. Group recaps must never automatically drive discipline, eligibility, housing, disclosure or risk labels.

## Validation results

- Platform TypeScript check passed.
- Full platform suite: 40 files, 208 tests passed, including persistence failure, restoration, stale-save and adapter tests.
- Production Vite bundle built successfully (existing large-chunk warning remains).
- Isolated PostgreSQL 17 housing and durable collaboration contract tests passed; actual parallel database sessions verified one accepted handoff, one winning draft revision and duplicate source rejection across intakes.
- Synthetic save/reload browser workflow passed using system Chromium; screenshot prepared for Library delivery, not a localhost link for the user. The Playwright browser download returned HTTP 403; the installed system browser provided a working alternative.
- Current Supabase RLS documentation reviewed. Changelog retrieval was blocked by HTTP 403; no version-dependent Supabase SDK features were added.
