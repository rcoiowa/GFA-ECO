# Isolated browser and API verification

The revised workflow was exercised in Chromium using the actual app, real GoTrue accounts, PostgREST and PostgreSQL 17.11. All accounts, applicants, residences, questions, signatures and receipts were synthetic. No production API, user, policy content or credential was used. The harness blocked browser requests outside localhost. The two transport-failure cases aborted responses after/beside real server execution; no successful API response was fabricated.

Services: Supabase CLI 2.122.0; GoTrue v2.197.0; PostgREST v16.5; Supabase PostgreSQL 17.11.0.006; Chromium via Playwright 1.62.1; actual Vite app and repository Markdown component. The repository launch schema, captured nonpersonal document-function definitions and the exact proposed migration were replayed into the isolated database. Synthetic infrastructure included organization 1 for the existing signup provisioning function, plus house-specific and accountless applicant records. Auth accounts were created through GoTrue, including an actual registration through the app.

The browser scenarios verify:

- Applicant and resident login, rightful document access, initially unchecked statements and exact assigned versions.
- Participant clarification request visible to authorized housing staff, separate explanation confirmation, and continued general support access.
- Separate affirmative electronic-records consent and typed signature where required; acknowledgment-only completion without a signature.
- Real immutable receipts with version/hash, all selected statements, participant, actor and server timestamp. Downloads match the displayed receipt; printing invokes the native print action with the same isolated record text.
- Authorized staff paper review, receipt retrieval after page reload, accountless applicant paper completion, and participant access to a staff-recorded paper receipt.
- Multi-residence staff application links resolve the application's authorized residence. Other-person receipt access, direct assignment UPDATE and wrong-residence staff context are denied through real REST requests.
- Sign-in/register link continuity and actual registration returning to the documents page. External return URLs are rejected. Application IDs remain excluded from auth return URLs; after signing in, the authorized intake link reselects the application.
- A successful completion displays its returned receipt without depending on another read. A deliberately lost response after a real paper commit, followed by a failed read, blocks retry until a queue refresh retrieves the committed receipt.

All 23 browser assertions passed. The separate PostgreSQL suite passed 80 checks, including repeated preparation while active elsewhere, same-residence history filtering, durable staff receipts, idempotency, concurrency, consent, exact historical preservation and audit-failure rollback. The component/domain suite adds regressions for successful receipt responses and uncertain-outcome handling.

Infrastructure limits: the full PostgreSQL image exceeded available Docker layer-unpack capacity, so the CLI's supported pinned slim images were used. Docker's internal-only network suppresses host port publication; loopback-only relays exposed the exact local stack containers to the test browser. The stock Auth health probe inherited an external proxy and falsely reported unhealthy; direct local health requests, actual logins, registration and all API workflows succeeded. This is functional integration evidence, not a claim that the deployment infrastructure or physical printer has been tested. Concurrent SQL behavior is covered separately; browser traffic was sequential except for normal app requests.

The original main-based candidate remains an implementation reference. Production-relative reconciliation onto live `d9d0ff93`, exact-tree CI, permission/readiness approval and an approved cutover are still required. Nothing in this evidence authorizes production migration, merge or deployment.
