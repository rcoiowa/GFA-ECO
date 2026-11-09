# GFARC workspace integration — November 9, 2026

Original integration based on verified main `b0af2c1`, merged as `28559c4`. See [review follow-up](review-followup.md) for the subsequent navigation, refresh and SQL-escape hardening. This is a tested frontend and **prepared-only** persistence extension, not a production release or complete source-guide migration.

## What changes

- Replaces the existing `/coach/circles` presentation with the selected GFA teal/serif direction, short facilitation guidance and clear return paths. Public Circle discovery remains separate.
- Preserves existing Circle authorization, records, roles and v1 RPC behavior. The October 5 policy includes applicable roles and CBH verified-email eligibility, not only explicit assignments.
- Reuses the portable JSON → CSS reference in `packages/design-tokens/reference`, scoped to this workspace. No global appearance or housing changes.
- Locks inputs during save; preserves uncertain-save entries; offers refresh/retry and duplicate-conflict guidance; protects unsaved return/switch actions; clears private drafts on account/access changes.
- Adds optional first-time participant counts and facilitator notes **only when the backend advertises `circle_documentation_v2`**. Without it, the existing form works and visibly explains unavailable fields. No silent downgrade or local browser storage.

## Prepared persistence design

`docs/proposals/gfarc-workspace/20261109_circle_documentation_v2.prepared.sql` is **not applied and not in the canonical migration chain**. The frontend can ship independently only after its remaining release gates; it will not enable the new fields against the current backend.

- First-time count is optional, 0 through participant attendance, excluding facilitators. Null means unknown/not collected, never zero. Cancelled meetings have no first-time count. Historical records are not rewritten.
- A new RPC-only, RLS-enabled table stores documentation alongside the existing occurrence, without adding sensitive columns to broadly privileged meeting storage. Explicit PUBLIC/anon/authenticated/service_role table revokes override inherited defaults.
- Notes are optional, at most 2,000 Unicode characters, trimmed and limited by instructions to meeting process/future facilitation. No participant names, contact information, diagnoses, trauma details, personal stories or individual case notes belong here.
- **Approved audience, narrowly implemented:** Thomas approved other authorized GFA staff and leadership on November 9. Shared readers require explicit GFA-scoped qualifying roles and production classification. CBH keeps its narrower staff list. Email-only/global-only/technical-admin-only access does not qualify. Leadership gets read-only documentation, never new recording rights. The recorder retains own-note access while still eligible. See `notes-sharing-decision.md` for exact mapping and source evidence.
- The versioned invoker RPC reuses the existing scoped private occurrence function and its identity/role locks. Occurrence and documentation are one transaction; a documentation failure rolls back both. v1 remains unchanged.
- Identical v2 retries by the same recorder return the existing ID; conflicting metadata is rejected. Cross-recorder v2 duplicates return the same conflict regardless of guessed note text. v1 retries never discard v2 metadata. A v2 retry cannot append metadata to an existing v1/historical record.
- The workspace preserves writable series and adds a separate read-only series list. History combines existing scoped meeting records with authorized shared documentation, limited to the latest 200. Counts are attendances, not unique reach or completed peer connections. Fixture/unclassified actors receive no new documentation capability or notes.

## Review and evidence

Exact SQL SHA-256 and explicit per-role decisions are recorded in `persistence-review.json`. Independent code/security review and an independent fixture rerun passed. This is not designated human governance approval.

Current CQCX catalog metadata was read on 2026-11-09 around 17:47 UTC: Circle RPC/predicate definitions match the repository, first-time/notes fields are absent, and the existing restrictive meeting policy is in place. No participant records were read. Applied Circle migration versions differ from repository filename timestamps, so do not infer a deployment ledger or replay plan from filenames.

The ratified intake prepared-chain directory is unchanged. This unrelated Circle proposal stays under docs/proposals; no approved-chain pin was changed. The table-access history gate does not automatically review proposal SQL. The synthetic Circle test explicitly loads this exact-hash prepared file and is now a pinned-dependency CI step. No existing applied migration was edited.

## Verification

- `pnpm typecheck`: workspace passed.
- `pnpm test`: 113 domain + 21 recovery-content + 291 platform tests passed (425). Includes 36 Circle UI, 22 data-access adapter, 5 navigation and 7 nested router-shell tests.
- `node tests/circle/database.mjs`: all four synthetic PGlite suites passed, including v2 recorder/shared-reader separation, explicit GFA role and scope matrices, read-only leadership, CBH exclusions, scope/identity/classification revocation, direct CRUD/helper denial, validation, null/zero semantics, historical/v1 ACL preservation, duplicates, legacy retry, and transactional rollback after a forced documentation failure.
- `pnpm build`: passed; existing large-chunk warning remains.
- Canonical backend, ICARE, language, table access, intake/booking/view/domain/provenance/prepared-chain, Cloudflare boundary, Grace static/safety/disclosure, public asset/artwork and contrast gates passed, including the unchanged approved intake prepared-chain lock. All 16 portable-theme contrast pairings passed. Table-access regression and 10 weather-proxy tests also passed.
- PGlite uses in-memory synthetic data and Auth stubs. Queued repeat calls are not a real multi-connection race or JWT/PostgREST test.
- Full disposable Postgres replay could not start because Docker is unavailable. Deno Edge Function checks were not run locally because Deno is unavailable; exact-commit CI remains required.

## Remaining activation/release gates

1. Shared-note audience is approved as documented in `notes-sharing-decision.md`. Establish a retention rule and correction/removal owner, or an explicit interim policy, before activating durable notes. No numeric retention period or permanent-no-correction rule is inferred.
2. Reconcile live function definitions, ACLs and migration ledger immediately before any approved forward-only production delta. Do not replay retired SQL, applied prepared history, seeds or unrelated proposal migrations.
3. On isolated Supabase infrastructure, prove real-JWT/PostgREST capability, save/readback, unauthorized access, scoped sharing, duplicate/revocation races and rollback. No participant records or live synthetic accounts.
4. Complete authenticated mobile/keyboard/zoom/accessibility and browser-history acceptance. The preceding Chromium attempt failed at process startup due socket permissions; no browser pass is claimed here.
5. Reconcile the actual served frontend SHA with main and unrelated changes; require successful CI for the exact release commit. No Grace activation or unrelated policy/configuration release.

The owner-private Sites v3 screenshot was inspected in the preceding UI work, but the source archive/original task was unavailable. The brief guide is a new implementation, not a verbatim migration. No device-local Sites records are imported. These source-parity and deployment gates remain open, so the full live migration is not yet complete.

## Existing test-environment discovery

Read-only discovery on November 9 found CQCX as the only active Supabase project. Its only listed branch is default main with the same project reference, not an isolated test branch. Three other projects are inactive, including retired development; none was activated or queried for records. The staging workflow explicitly targets CQCX, so its frontend is not a safe synthetic-test backend. Only dot cloud is connected; the listed Mac is offline. No approved authenticated isolated environment was found. Real-service acceptance remains unexecuted, not denied or uncertain. No project, branch or account was created.
