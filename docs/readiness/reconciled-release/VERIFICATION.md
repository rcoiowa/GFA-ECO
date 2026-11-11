# Exact local source verification — 2026-10-21

PASS full platform: 42 files / 223 tests. New Grace cases cover consent present,
absent, rejected, unresolved, missing identity and reduced motion. Initial run
222 passed / 1 failed: missing scrollTo capability; capability guard added, six
focused Grace tests then all 223 passed.

PASS domain 113 tests / 13 files; recovery-content 21 / 2 files.
PASS eight workspace TypeScript checks; final platform check after fix passed.
PASS 20 static CI governance/access checks; 11 Worker/access Node tests.
PASS housing-enabled production build after final source fix; existing >500kB
chunk warning. Asset presence and public/dist artwork decode passed.
PASS desktop/mobile browser journeys: 18/18; local Chromium and synthetic transport
fixtures, no real Auth/PostgREST/Turnstile/provider. Account-free public support,
resources and housing, intake receipt/failure, registration/reload/sign-in/return,
linked housing without enrollment, staff follow-through/stale conflict/reload,
applicant staff denial and confirmation callback navigation exercised.
PASS disposable local PostgreSQL replay/contracts from cached pinned image,
network disabled: 76 canonical files plus 3 applied prepared files, excluding
0104 scheduler and 0146 content activation. Housing-only synthetic fixture and
source-table/RLS denials passed; no Admin/bridge installed. No remote database.

NOT RUN: real integrated Auth/email/PostgREST/linkage, actual Turnstile or external
email, provider calls, Deno/Edge dependency checks (Deno unavailable), assistive
technology/hardware, supplied Wix new artifact. These remain distinct gates.
No legacy live-gate, new registry pull, live data, permissions or credentials.

Full logs preserved in review evidence bundle. Tests used existing local binaries
with local workspace package links, no installs. No required service acceptance is
waived by source/unit/browser mock/SQL success. Merge/deploy remain blocked.
