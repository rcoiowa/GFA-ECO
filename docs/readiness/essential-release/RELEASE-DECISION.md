# Essential front door + housing journeys — release decision

**Recommendation: review this narrow candidate, not the broad PR42 rollout.** Local
browser and application/database-contract checks pass. Publication is still on hold
for the named external gates; this is not a claim that the service is customer-ready.
No push, PR, remote merge, deploy, live data/permissions change, live credentials, or
paid provisioning occurred. Legacy `live-gate.yml` was never run.

## What belongs in this release

Base repair: `ef26ecd0dbe2d65dd792852b41809e31b926132a`, built on the last verified
served SHA `d9d0ff93efd0b3018eb0b97cacebced04d8d02ef`.
Original combined candidate `92833ac53b1a1ac1d42e9ba88731104d9fa586f3` and both
previous bundles are preserved unchanged.

| Scope                                                         | Decision and reason                                                                                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validated auth destinations and October migration review gate | Keep the baseline repair; registration, confirmation, recovery, consent and protected paths retain safe intent.                                                                     |
| Direct public task navigation                                 | Add resources, housing, My housing and role-aware `/home` links before the illustrated entrance. GFA content and optional building navigation stay intact.                          |
| PR42 housing follow-through component and repository          | Include ownership, explicit cover acceptance, due commitments, evidence-based bed state, contact history and safe failure handling. These support actual housing work.              |
| PR42 intake queue changes                                     | Include converted applications in staff follow-through; conversion must not hide unresolved commitments or contact history.                                                         |
| Manual build flag                                             | Add only `housing_follow_through_enabled`, default **false**, to the existing gated manual workflow. No workflow was dispatched.                                                    |
| Consent expiry correctness                                    | Include the two-file PR40 correction from `1126bfe9a953f5617680f410b4afc40b5b7777ea`: expired/revoked grants must not read “Currently: allowed.” No policy or consent data changes. |
| Private Admin collaboration                                   | Exclude: separate administrator workspace is not needed for housing intake/follow-through.                                                                                          |
| Bridge/OAuth/exchange/transport/persistence                   | Exclude all new bridge source, schemas and deployment work. No transcript sync or SSO.                                                                                              |
| Retention/deletion proposals                                  | Exclude; not necessary for this release.                                                                                                                                            |

The PR42 production-source subset is five copied files plus the housing-only export:
`HousingFollowThrough.tsx` and its test; `IntakeQueuePage.tsx` and its test;
`repositories/housingFollowThrough.ts`; one export in data-access/index.ts. The component
has one additional local UX repair: on a failed save the warning scrolls into view,
verified in mobile Chromium. No private Admin repository/export/route was copied.

The Housing-only SQL extract under this directory is a **disposable test fixture**,
not a new migration or live apply instruction. It is extracted from PR42's recorded
activation artifact and preserves the service_role/source-table revokes. Admin objects
and bridge namespaces are asserted absent. Actual live activation was not re-audited.

## Staged release decision

1. **Public front door:** direct task links and account-free pages passed local desktop/
   mobile inspection. Review GFA/Wix navigation separately before publishing. The supplied
   offline Wix artifact could not be materialized here, so its rendered navigation,
   donation links and contact links are not accepted by this report.
2. **Essential app repair:** review the narrow candidate and close actual Auth/email,
   Turnstile/receiver, PostgREST and linked-account acceptance before enabling housing
   controls. Keep the manual housing flag false until those gates pass. A successful
   mocked browser receipt is not evidence of a production submission or staff delivery.
3. **Defer PR42 Admin/bridge:** no dependency requires their rollout with these journeys.

The served frontend SHA has not been freshly confirmed since the earlier HTTP 403.
Reverify it and the exact approved release SHA before any publication. No domain change
is needed or authorized by this local work.

## What actually ran

Supported browser: local Chromium at `/usr/bin/chromium`, using only a loopback HTTP
Vite server and Playwright. Desktop 1280 × 900 and Pixel 7 mobile emulation. No cloud
browser, file URL, tunnel, public preview or external upload was used for testing.

**18 browser cases passed (9 journeys × 2 viewports):**

- Public task links; keyboard navigation to resources; support and housing remain public.
- Grace House and EJWRH account-free form validation and synthetic receipts.
- Uncertain receipt retains entered values and warns against duplicate submission.
- Housing return destination through registration navigation, reload, sign-in, reload and logout.
- Linked housing consent route without resident or participant roles.
- Staff converted-intake ownership, commitment, blocked closure, simulated stale-save failure,
  refresh/retry and reload persistence.
- Applicant denied staff intake, with no staff-intake query issued.
- Registration confirmation screen and return URL in a new navigation.

After screenshot review identified the offscreen staff error, both affected staff journeys
were rerun and passed (**2/2**) with an explicit error-in-viewport assertion. No unchanged
browser case was silently skipped. Screenshots contain only synthetic fixtures.

Browser transport is deliberately intercepted: fake Auth responses, dummy non-valid
session strings, fake Turnstile callback and synthetic data/RPC responses. All unexpected
external requests abort and all unexpected synthetic API requests fail the test. These
are frontend journey checks, not real Auth/PostgREST/Turnstile verification. No actual
account or credential was created. Browser state persists only within each disposable
Playwright test context; no participant records were fetched.

Front-door axe scan: no **serious/critical** WCAG 2 A/AA findings at either tested viewport.
Keyboard navigation and no horizontal overflow assertions passed. This is not a full
accessibility certification, screen-reader test or physical-device test. Actual screenshots
of the front door, forms, unlinked state, receipts and staff workflow were inspected.
The long staff panel remains vertically scrollable; no redesign is claimed.

**Other final checks:**

| Check                                 | Result                                                |
| ------------------------------------- | ----------------------------------------------------- |
| Full platform tests                   | 217 passed / 41 files                                 |
| Domain tests                          | 113 passed / 13 files                                 |
| Recovery-content tests                | 21 passed / 2 files                                   |
| Worker tests + access-gate test       | 11 passed                                             |
| Deno receiver tests                   | 36 passed                                             |
| Workspace typecheck                   | Passed                                                |
| Housing-enabled build                 | Passed; existing large-chunk warning remains          |
| Governance/boundary checks            | 19 passed                                             |
| Access manifest                       | Passed; 81 historical SQL checksums unchanged         |
| Built backend reference guard         | Canonical reference present, retired reference absent |
| GFA assets and artwork decoding       | Passed                                                |
| `git diff --check`                    | Passed                                                |
| Isolated essential housing SQL replay | Passed; details below                                 |

One initial unit assertion expected the account door to link to `/sign-in`. It was updated
to the required role-aware `/home`; the final full suite passed. No unresolved local code
failure remains in the tested paths.

## Database evidence and reproducibility

`python scripts/replay-essential-local.py` creates/removes only its own local no-network,
no-ports, tmpfs PostgreSQL container, rejects remote Docker endpoints and pins the same
image digest as the baseline runner. It accepts no DB URL or live project target.

It runs 76 of the 78 canonical files, excluding exactly `0104_reminder_cron.sql` and
`0146_ejwrh_document_activation.sql`, plus applied prepared 0147–0149 before October SQL.
It then applies the Housing-only fixture and tests with actual canonical authorization
helpers: residence isolation, explicit cover acceptance, conversion retaining commitments
and contact evidence, blocked premature closure, revoked staff denial, private service_role
source-table denial, and absence of Admin/bridge objects. It also retains the baseline new-
public-table defaults, existing-grant preservation, two-identity RLS and denied-write checks.

Not included: seeds, pending 0150/0151, captured drift, Admin/bridge/retention schemas,
Supabase Auth/Storage/cron infrastructure or actual HTTP PostgREST. `auth.uid()` is a local
fixture. Local SQL and mocked browser evidence are complementary, not one end-to-end test.

Browser command after frozen dependency install:

```sh
cd apps/platform
./node_modules/.bin/playwright test -c playwright.essential.config.ts
```

The dedicated config has no live project, no external base override, no reused server,
and a synthetic loopback Supabase URL. Do not substitute the repository's legacy live gate.

## Exact blockers and remaining gates

| Action / target                                                                              | Outcome / reason                                                                                                                                                                                                                                          | What is complete                                                                                                            |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Materialize `libfile_9ca6d60b53648191ae482b222071e107` Wix repair into this executor         | **Failed**, not an approval denial. Library resolved the file, but the current transfer helper returned `library file transfer failed: download failed` on the initial attempt and one bounded retry. No readable archive exists. Stopped; no workaround. | Local app browser is supported and tested. Wix pixels, mobile navigation, donations/contact preservation remain unverified. |
| Core Edge compile, `esm.sh/@supabase/supabase-js@2`                                          | Earlier **dependency fetch failure** (`unsuccessful tunnel`) remains unresolved; no claim of a pass. Edge source unchanged in this candidate.                                                                                                             | 36 local receiver logic tests pass; build/typecheck pass.                                                                   |
| Actual browser → Auth/Edge/Turnstile/PostgREST → DB                                          | **Not run / pending isolated acceptance environment.** Current browser uses transport fixtures; SQL tests are separate.                                                                                                                                   | Real Chromium rendering and interactions plus canonical SQL contract tests pass independently.                              |
| Real email confirmation/recovery, trusted account linking, assigned documents/consent writes | **Not run.** No accounts, credentials or participant changes authorized/created.                                                                                                                                                                          | Safe callback/return behavior and unlinked/role-independent housing navigation tested synthetically.                        |
| Current served release + live Housing ACL/RPC metadata                                       | **Not reverified** in this stage.                                                                                                                                                                                                                         | Exact source provenance recorded; no live changes.                                                                          |

Wix ownership remains public organizational content, donations and generic inquiries;
RecoveryOS owns participant identity, consent, programs/housing and staff workflows.
No automatic donor/contact import, email-based merging, companion sync or private strategy
is included. Publication and live database changes still require an exact reviewed decision.
