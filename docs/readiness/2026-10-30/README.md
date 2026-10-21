# GFA → VRCC handoff and October 30 readiness — review package

Prepared 2026-10-21. Local changes only. No publication, remote branch, PR, merge,
deployment, domain change, credentials, paid resources, or live database writes.

## Base and release reconciliation

- Remote main: `43bd9c288a397aef1fdcf16afe44e432ca50fb86` (read-only `git ls-remote`).
- Repair base: `d9d0ff93efd0b3018eb0b97cacebced04d8d02ef`, the last verified served
  frontend supplied by the operator, corroborated by PR40/42 metadata. A fresh
  `https://vrcc.app/release.json` request returned HTTP 403 here; current service
  identity is **not independently reverified**. Main lacks deployed applicant changes.
- PR42 remains open/draft at `b76557485756668d0c21e3e9fed2c43cbc6ad24d`, based on
  d9d0. It adds Housing/private Admin and bridge proposals, not the served UI.
  Nothing from it is implicitly activated by this patch.
- Open PRs inspected: 1, 2, 23, 24, 25, 33, 37, 38, 40, 41, 42. PR37 applicant
  features and PR40's earlier lobby work are already in d9d0. PR40's later consent
  expiry fix remains separate; PR38 recovery controls and PR41/42 activation work
  require their own reconciliation. No unrelated work was overwritten.
- PR42 reports Housing/Admin database activation separately from frontend release.
  Its SQL remains in `docs/proposals/housing-follow-through` on that branch.
  This base deliberately does not import or replay those proposals. Preserve its
  private source-table revokes, including service_role, and scoped RPC boundary
  when composing a future release.

## Handoff contract

Wix owns organizational content, donations, and generic inquiries. RecoveryOS owns
participant identity, consent, programs/housing, and staff workflows. Preserve GFA
intellectual content and accessible task links; building-style navigation is optional.

Suggested Wix task links (review before editing Wix):

| Task                                     | Destination                                 | Access                                                               |
| ---------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| Support now                              | https://vrcc.app/support                    | Public, no account                                                   |
| Community resources                      | https://vrcc.app/community-center/resources | Public, no account                                                   |
| Housing information/apply                | https://vrcc.app/recovery-residences        | Public directory/application pathways                                |
| My housing application/documents/consent | https://vrcc.app/my-housing                 | Signed in, own records; no resident role or VRCC enrollment required |
| Enter my workspace                       | https://vrcc.app/home                       | Role-aware operational entry                                         |

Do not add donor/contact imports, email-based person merging, transcript sync, SSO,
or credentials. A housing login without a linked person continues to show the
existing human-verification guidance; it does not provision or infer a linkage.
Registration with an immediate session now returns housing applicants to that entry
rather than forcing participant provisioning. Staff linking remains a human workflow.

## Return-path repair

One validator in `packages/domain/src/authReturnPath.ts` handles sign-in, register,
email-confirmation redirect, recovery request/callback, route guards and consent
onboarding. Guard destinations use query parameters so refreshing an auth page or
opening a confirmation/reset callback in a new tab retains approved intent. Router
state from older links is validated too. Auth pages are excluded as destinations to
prevent recursive loops. No persistent browser intent is kept to redirect a later user.

Only listed task routes, published document keys, finite `tab` values and named
anchors survive. Arbitrary query/hash text (including assignment IDs and tokens) is
removed. Person-detail URLs return to the corresponding authorized list without the
person ID; unknown document keys return to the document list. Unsupported destinations
fall back to `/home`. This is intentional privacy minimization, not full URL fidelity.
A newly introduced route/value requires review of the allowlist. Existing role guards,
consent checks, own-record RPCs/RLS, and human identity linkage remain authoritative.

Support/resources/directory routes stay public. The change does not add automatic
email-confirmation sign-in or bypass Supabase's normal session handling. Production
redirect allowlists/email templates still require verification for both callback paths
and their query strings; no Auth settings were changed.

## What October 30 changes

[Official Supabase notice](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically),
read 2026-10-21: new tables in `public` need explicit grants; existing table grants
and custom-schema defaults remain unchanged. Grants determine table access; RLS
limits rows after access is granted. This is not a request for blanket grants.

The base contains 78 canonical launch migrations and no new `public` table creation.
The browser client and `lead-intake` / `residence-intake` explicitly target `recoveryos`.
RecoveryOS-Launch and CQCX identify the same project `cqcxvwoukyhxyokfwnjm`.
The operator's preceding read-only audit found only deprecated `public.housing_applications`
with no anon/auth CRUD; that live fact was not queried again here. Do not restore access.
`metadata-audit.sql` provides an optional read-only catalog audit with no participant
queries. Review defaults by object-creating owner, effective ACLs, RLS, and RPC grants.

## New-table review gate

`node scripts/check-table-access.mjs` is wired into CI. The access manifest locks the
78 canonical files plus applied 0147–0149 prepared SQL by SHA-256. It detects changes
or removal of these files. It is a history lock, **not** retrospective approval of every
existing grant. Every newly added canonical SQL file needs an exact checksum, named
reviewer, and rationale; recognized CREATE TABLE statements additionally need explicit
per-role decisions for PUBLIC, anon, authenticated and service_role. Empty privileges
means intentional no-access and must include its reason and SQL evidence.

New migration entry shape in `table-access-manifest.json`:

```json
{
  "sha256": "exact reviewed SQL hash",
  "reviewer": "reviewer identity",
  "rationale": "purpose and consumers",
  "tables": {
    "recoveryos.example": {
      "rlsEvidence": "RLS enablement and ownership/scope policies, or private-only rationale",
      "denialTests": "test paths and results for anon, cross-person, cross-residence, unauthorized staff",
      "rpcReview": "invoker/definer, search_path, PUBLIC execute revocation, scoped authorization",
      "roles": {
        "PUBLIC": { "privileges": [], "reason": "private", "sqlEvidence": "explicit revoke" },
        "anon": { "privileges": [], "reason": "account-only", "sqlEvidence": "explicit revoke" },
        "authenticated": {
          "privileges": ["SELECT"],
          "reason": "own-row read",
          "sqlEvidence": "exact grant + policy"
        },
        "service_role": {
          "privileges": [],
          "reason": "RPC-only source",
          "sqlEvidence": "explicit revoke"
        }
      }
    }
  }
}
```

Reviewers must verify that evidence against SQL/tests. This conservative lexical gate
is not a SQL parser or an authorization proof: dynamic DDL, views, functions, sequences,
column grants, inheritance, default privileges and prepared/proposal SQL require manual
review too. Explicitly revoke inherited defaults for private tables; do not restore
service_role merely because its name sounds privileged. Add only needed CRUD/sequence
privileges. Never grant all tables to fix one permission error. Exposed tables with client
grants require RLS and positive and negative policy tests. No new table or grant is
introduced by this package.

## Safe replay and history reconciliation

`supabase/launch` is canonical; `supabase/migrations` is retired history. The old launch
README's generic empty-project claim is not sufficient for the present tree:
0138 references a historical public table whose creation is only in live-drift capture.
Applied 0147–0149 still reside in prepared files and must be ordered before the October
circle/accountless migrations. No applied history has been edited or moved.

Run only in a disposable local environment:

```sh
# Fetch free local test image if not already cached; no hosted project is provisioned.
docker pull postgres@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3
python scripts/replay-launch-local.py
node scripts/check-table-access.mjs
node --test scripts/check-table-access.test.mjs
```

The runner refuses a non-Unix Docker endpoint, accepts no connection URL/project ref,
creates its own randomly named container, exposes no ports, disables its network,
uses tmpfs storage and removes only that container in `finally`. It uses synthetic
Supabase auth/storage infrastructure and **no live seeds, participant data, or captures**.
It supplies a minimal empty historical `public.housing_applications` placeholder with
RLS and no client/service privileges, solely so unmodified 0138 containment can run.
This is a test fixture, never a proposed production table. Lexical canonical order is
preserved, with an explicit insertion of applied prepared 0147–0149 before October SQL.

Explicit exclusions: 0104 cron infrastructure, 0146 document-content activation, all
seeds, prepared 0150/0151 and proposals. This is application-schema replay, not a full
Supabase boot, production parity test, or an executable plan to reset any remote DB.
It exercises 76 canonical migrations + 3 applied prepared files, then proves deprecated
housing remains inaccessible and tests October defaults, preserved existing access,
new-table denial, explicit own-row SELECT for two synthetic identities and denied INSERT.
The fixture uses auth.uid stubs, not Supabase JWT/PostgREST. No real mail is sent.

For a later **separately authorized** full empty Supabase replay, first produce a reviewed
baseline/version ledger distinguishing already-applied prepared SQL and Housing/Admin
activation from pending proposals. Reconcile the metadata-only applied version list to
exact checksums; do not move files blindly, reapply prepared changes to live, or replay
captures. Resolve 0138's empty-baseline treatment with a new bootstrap specification;
retain its deployed history unchanged. Run the ledger on isolated Supabase infrastructure,
including storage/auth/extensions, reviewed static content and cron with outbound effects
disabled. Verify effective ACL/RLS/RPC denial matrices and configuration. Then decide a
forward-only production delta; never use remote reset or the retired migration chain.

**Do not dispatch `.github/workflows/live-gate.yml` with its defaults.** It seeds synthetic
accounts and defaults to RecoveryOS-Launch; a staging frontend is not a separate DB.
Operator test #25 reportedly skips form assertions when controls are absent. Neither
that result nor generic green CI proves provisioning or authenticated browser acceptance.

## Remaining review/release gates

1. Reverify served SHA; compose this repair with the chosen main/PR42 release and PR40's
   outstanding consent-expiry fix explicitly. This package activates none of those features.
2. Review navigation allowlist, minimized detail destinations, and Wix task-link wording.
3. In an isolated full Supabase setup, verify real email confirmation/recovery redirects,
   linked/unlinked housing accounts, interrupted consent and two-account browser isolation.
   Never use actual participant records or default live-gate fixtures for acceptance.
4. Review the applied migration ledger and proposal activation differences; verify private
   Admin/source revokes and scoped RPCs against metadata. Local fixture tests are not live evidence.
5. Publication, merge, deployment, Wix/domain/Auth settings, live database permissions/data,
   credentials and provisioning remain outside this authorization.

See `VERIFICATION.md` for exact local results and limitations.
