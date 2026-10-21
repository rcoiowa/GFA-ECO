# Verification — editorial patch

2026-10-21, local source based on pinned 3f93d250436c725f92e6ff642487a74a9dcf8236.

- PASS: platform Vitest targeted run, 3 files / 19 tests: GracePage.test.tsx
  (consent present/absent exact disclosure/full identity/support button/no generation),
  SupportNowPage.test.tsx (anonymous support), App.test.tsx (routing).
- PASS: platform `tsc --noEmit`, exit 0.
- PASS: grace-model-lock-verify.mjs STATIC, 0 drift. Live check skipped.
- PASS: icare-lock-verify.mjs, 0 drift.
- PASS: check-icare-governance.mjs.
- PASS: git diff --check.
- Initial targeted run: 17 passed, 2 failed because the new test expected Support Now
  to be a link rather than its actual button role. Corrected test only; final run
  passed all 19. No product behavior changed to satisfy the test.

Used existing local dependencies from preserved essential worktree through temporary
node_modules symlinks (removed after testing); no dependency installation, registry retry or live calls.
No full-suite/build/browser/screen-reader/real-device tests ran for this copy patch.
No actual provider, Auth, email, PostgREST, infrastructure logging, phone service,
or Wix validation ran. Earlier candidate tests are separate evidence, not results
for this patch. Provider and policy files, locks, canonical residence/RTM content,
route/database/function identifiers and the pinned worktree remain unchanged.

See COVERAGE.md for source limits, source-only findings, behavioral gaps and
unreviewed surfaces. No claim of complete site-wide conformance or release readiness.

## Complete claims guide follow-up / broader local verification

Complete 06 source reviewed; no further UI corrections required. Prior editorial
commit 1fbf1657a126393d192455b0db341d4664fb2e79 remains in ancestry.

- PASS full platform suite: 42 files / 219 tests.
- PASS full domain suite: 13 files / 113 tests.
- PASS full recovery-content suite: 2 files / 21 tests.
- PASS all eight executable workspace TypeScript checks (platform, auth,
  data-access, domain, recovery-content, residence-content, safety, ui).
  design-tokens has a CSS-only informational script.
- PASS 11 Node Worker/access-manifest tests.
- PASS 20 static CI script checks, including disclosure synchronization,
  policy/model locks, intake boundaries, minimization, vocabulary, provenance,
  privilege/prepared-chain checks and Cloudflare boundaries.
- PASS platform build using the existing sync-directory-site and Vite binaries;
  existing warning: minified chunks exceed 500 kB.
- PASS GFA asset presence and public/dist day/night image decode checks.

The pnpm wrapper failed before execution attempting to create its store under
/home/agent/.local/share/pnpm. Equivalent existing local binaries were used without
installation/network changes. Initial full platform run: 212 passed / 7 failed,
plus one unhandled error, because temporary cross-worktree dependency symlinks
resolved AuthContext outside the new worktree while tests mocked its local path.
Corrected local dependency layout (no source/test changes) and reran all platform
tests: 219 passed, no unhandled errors. Earlier two test-authoring failures above
are separate from this environment failure. No unresolved application test failure.

Deno tests/Edge compilation NOT RUN: Deno not available in this resumed environment;
no install/dependency retry. No full-browser, screen-reader, hardware, provider,
Auth/PostgREST/email or live checks. Build asset checks are not editorial review of
the generated public/gfa website, nor validation of the supplied Wix artifact.
