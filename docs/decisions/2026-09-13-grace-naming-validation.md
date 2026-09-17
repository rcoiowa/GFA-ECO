# Grace naming validation — 2026-09-13

Reviewed existing draft PR #8 at `741822dad3f763fe4589752394aae9986a5263d5`,
whose parent is the requested `4f75c5fe27986f15a5301b3611ae82462ea247b7`.
GitHub CI run **158**, ID `34747421549`, passed on that reviewed head.
It covered typecheck, build, and boundary/governance guards, not unit tests,
formatting, or browser tests. New-commit CI must be checked separately.

## Files corrected in this continuation

- `apps/platform/src/participant/pages/GracePage.tsx`: formatting; canonical
  disclosure value preserved exactly.
- `supabase/functions/grace/policy.ts`: formatting; canonical disclosure,
  instructions, safety logic, and policy version preserved exactly.
- `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`: completed
  the seven-label retirement list.
- `docs/product/grace-ai-support-navigator-implementation-authority-v1.1.md`:
  corrected the canonical disclosure apostrophe and formatted this new authority.
- `docs/discovery/p1-completion-report.md` and
  `docs/discovery/p1-github-source-of-truth.md`: historical notices added;
  original dated content retained.
- `docs/source-documents/README.md`: new historical notice for original source
  PDFs, DOCX, and HTML; no source binary modified.
- `docs/decisions/2026-09-13-grace-naming-terminology-audit.md`: replaced the
  file-level audit with exact occurrence locations and external coverage limits.
- This validation record.

## Check results

| Check                                            | Result                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot integrity                               | PASS: all 692 original tracked blobs match Git hashes.                                                                                                                                                                                                                                      |
| Install                                          | PASS with repository-pinned pnpm 10.34.5 and frozen lockfile. Bundled pnpm 11 initially rejected the repository’s build-script settings; a pinned install resolved it without dependency/config changes.                                                                                    |
| `pnpm typecheck`                                 | PASS across workspace.                                                                                                                                                                                                                                                                      |
| `pnpm test`                                      | PASS: 18 test files, 97 tests.                                                                                                                                                                                                                                                              |
| `pnpm build`                                     | PASS; existing bundle-size advisory remains.                                                                                                                                                                                                                                                |
| Focused formatting                               | PASS for both active disclosure files, naming decision, occurrence register, new V1.1 authority, and source notice.                                                                                                                                                                         |
| Full repository formatting                       | NOT PASS: 132 formatting warnings in the initial scan and one existing parse error in `supabase/functions/coaching/index.ts:118`. Historical records and unrelated code were not reformatted wholesale.                                                                                     |
| `node scripts/grace-eval.mjs selftest`           | PASS: all 7 harness cases; the printed critical/hard failure counts are expected negative test fixtures, not failed tests.                                                                                                                                                                  |
| `node scripts/grace-floor-selftest.mjs`          | PASS: 12 crisis cases and 14 ordinary controls, zero misses.                                                                                                                                                                                                                                |
| `node scripts/grace-model-lock-verify.mjs`       | PASS static, zero drift; LIVE portion skipped without credentials.                                                                                                                                                                                                                          |
| `node scripts/check-no-retired-ref.mjs`          | PASS.                                                                                                                                                                                                                                                                                       |
| `node scripts/icare-lock-verify.mjs`             | PASS, zero drift.                                                                                                                                                                                                                                                                           |
| `node scripts/check-icare-governance.mjs`        | PASS.                                                                                                                                                                                                                                                                                       |
| `node scripts/verify-intake-boundary.mjs`        | PASS: 21/21.                                                                                                                                                                                                                                                                                |
| `node scripts/verify-booking-integrity.mjs`      | PASS: 10/10.                                                                                                                                                                                                                                                                                |
| Local Playwright project                         | NOT PASS: 73 browser-launch failures, 1 request-only test passed. Chromium’s macOS MachPortRendezvous bootstrap registration was denied (1100), before page assertions. Installing the expected Chromium resolved the initial missing-browser prerequisite but not this sandbox limitation. |
| Live Grace and authenticated accessibility specs | NOT EXECUTED: 17 skipped by the existing live-access gate; fixture credentials unavailable.                                                                                                                                                                                                 |
| `node scripts/grace-eval.mjs all`                | BLOCKED: required backend URL, anon key, and fixture password unavailable; no provider scores produced.                                                                                                                                                                                     |
| Disclosure agreement                             | PASS: parsed participant and server string values equal the canonical disclosure byte-for-byte; Authority V1.1 agrees with Markdown whitespace normalized.                                                                                                                                  |
| Formatting-only source verification              | PASS: participant and server parsed syntax trees equivalent to the reviewed head, ignoring formatting punctuation and JSX whitespace.                                                                                                                                                       |
| Generated application text scan                  | PASS: zero broad legacy-token matches in the production build; canonical disclosure present.                                                                                                                                                                                                |

The exact case-insensitive repository results, extracted source-document locations,
and reasons for retention are in the [occurrence register](2026-09-13-grace-naming-terminology-audit.md).
The scan includes hidden files and the lockfile, not only application code.
PDF/DOCX text extraction supplements the repository scan; embedded-image OCR and
unreachable external content are not certified.

## Scope confirmation

Reviewed all 26 pre-existing PR file patches and this continuation. The existing
changes are role/disclosure strings, prompt/evaluation identity descriptions,
comments, naming/governance records, and historical notices. V1.1 carries forward
V1.0 sections without behavioral amendments. This continuation changes no source
logic; the two formatted active files retain equivalent parsed syntax trees.

No change to `ai_features` consent, stateless V1, transcripts/memory/retention,
safety/crisis behavior, Support Now/human handoff, RLS/permissions/privacy,
auditability, schemas/migrations, routes/APIs/function slugs/database identifiers,
analytics keys, model lock, policy version, Cloudflare/Supabase/DNS/Auth settings,
or deployment state. Original PDF/DOCX/HTML source bytes remain unchanged in this
continuation. No change to retired YKY or PR #7. No merge or deployment.

## External status and remaining decisions

No external content was edited. Reachable Wix development CMS content had no
retired Grace labels; ordinary article prose remains unchanged. Staging still
serves two outdated labels in its participant bundle; replacement is prepared in
this PR and requires a separately authorized deployment. The source agreement
check does not claim that the deployed server disclosure matches.

Unverified: Wix editor/unpublished pages, separate sandbox content, unpublished
blog drafts, translations and embedded experiences; authenticated staging Grace
and server disclosure; provider-backed evaluation; embedded-image text and any
external 2D/3D assets not reachable through the inspected surfaces.

Thomas’s naming decision is already ratified and needs no repeat approval.
Still separate: whether identity/disclosure wording warrants a policy-version
increment and model-lock/governance recertification; any later deployment;
any future compatibility migration. Those decisions were not made here.
This PR remains draft. This report does not certify the blocked checks or
unverified external surfaces as complete.
