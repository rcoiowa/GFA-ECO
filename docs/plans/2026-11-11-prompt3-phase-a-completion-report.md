# Prompt 3, Phase A — Completion Report (2026-11-11)

**Authorization:** Executive authorization of 2026-11-11 (Increments 1, 2, 3, 6 —
repository-level preparation and verification only). **Honored restrictions:** no production
or staging deployment, no database write or migration, no DNS/Cloudflare/Wix change, no
hosting retirement, no access change, no merge into any protected branch, no production
participant data in tests, no governance ratification. DR-02 and the attestation-authorization
question were deliberately left open, as directed.

## 1. Branch and commit references

**Deliverable branch:** `integration/reconcile-2026-11`, pushed to origin.
**HEAD: `1bd8a83`.** Base: deployed release `4990829e` (the SHA every public domain serves).

| Commit | Content |
| --- | --- |
| `6118ea1` | Merge of `origin/main` (`6aaa532`) into the deployed baseline — Increment 3 |
| `4fb0c46` | Edge Function source reconciliation — Increment 1 |
| `76e7514` | Merge-resolution correction: keep the deployed scoped paper-review workflow |
| `cba0cee` | Applied-status record for 0147–0149 + attestations pin — Increment 2 |
| `25d018b`, `7f1778b` | Prompt 1/2 deliverables cherry-picked so the branch is self-contained |
| `1bd8a83` | Successor current-state record + supersession notices — Increment 6 |

Diff vs `main`: 58 files, +4,552/−844. Diff vs deployed production: 122 files,
+10,410/−538 (dominated by main's Circle/GFARC, language-guide, and documentation work).

## 2. File-level reconciliation summary (merge conflicts: 14 files)

**Kept from the deployed line (live behavior):** the document-attestation workflow and its
test suite (`DocumentDetailPage.tsx/.test.tsx`), the resident documents page labels and the
"Earlier or inactive assignments" card (`DocumentsPage.tsx`), the intake checklist's link to
the scoped `/staff/document-review` workflow (`IntakeChecklist.tsx` — main's inline
`paper_sign` flow would have recorded signatures through the path the applied attestation
migration retired; its own tests caught this), and the intake-queue exact return path.

**Kept from `main` (approved later work):** the consent-accuracy fix (expired/revoked grants
no longer display as allowed — `PrivacyConsentPage.tsx`; note the deployed site still has
this defect, correcting my Prompt 2 matrix row D5), language-guide wording
(`MyApplicationPage.tsx` stops promising contact the system cannot verify), record-path
privacy mapping and formatting/async-test improvements, plus everything main added cleanly:
Circle/GFARC workspace, language guards in CI, the Grace 1.2.1 candidate gate.

**Merged as a union:** `authReturnPath.ts` destinations (main's full set + the deployed
`/staff/document-review`, `resident_rights` key, and intake-queue early return, with main's
record-path mapping) and its tests; `domain`/`data-access` barrel exports
(`documentAttestations` + `housingFollowThrough`); `AuthJourney.test.tsx` (both route sets,
both sides' unique journey tests).

## 3. Evidence that deployed function behavior is preserved (Increment 1)

- `lead-intake`: branch now carries the implementation verified matching deployed v16
  (bundle `9688a74f…`) — `/contact` + `/rco-iowa` adapters, origin allowlists, Turnstile
  hostname/action verification, permission receipts, alert suppression — plus its receiver
  tests. A redeploy from this branch no longer removes live Contact Connect / RCO Iowa routes.
- `residence-intake`: branch now carries the deployed v7 source (bundle `a85382bf…`,
  captured read-only 2026-11-11), including the CORS `x-client-info` preflight fix that
  previously existed at no branch head. `index.ts` was already identical; only `handler.ts`
  changed.
- Proof executed: `deno check` passes on `lead-intake`, `residence-intake`, `ejwrh`;
  **52/52 Edge Function receiver tests pass** (deno), covering contact/RCO origins,
  Turnstile failure modes, consent boundary, honeypot, idempotency, and generic error
  envelopes. Neither function was redeployed; before any future redeploy, re-capture the
  live source and compare bundle hashes (`docs/discovery/deployed-captures-2026-11-11/`).

## 4. Migration-lineage reconciliation status (Increment 2)

- 0147–0149: live ledger confirms applied 2026-09-17 under the ratified Convergence Gate A
  authorization; recorded in `scripts/verify-prepared-chain.mjs` (`APPLIED_PREPARED`)
  without touching the hash-pinned artifacts. 0150/0151 confirmed not applied.
- `document_review_attestations`: the repository artifact is byte-identical
  (SHA-256 `9894caca…`) to what draft PR #45 declared and the ledger shows applied
  2026-10-23. It is now hash-pinned as **applied, pending authorization review** — the
  authorization is *not* asserted, per your direction.
- Full mapping and carried-forward gaps (housing follow-through SQL exists only on unmerged
  PR #42's branch; `0123` ledger anomaly; replay-parity limitation):
  `docs/migration/applied-ledger-reconciliation-2026-11-11.md`. No SQL executed.

## 5. CI and governance verification results (local, final tree)

PASS: workspace typecheck · **455 tests** (315 platform + 119 domain + 21 content) ·
production build · all four governance locks (`grace-model-lock-verify` — static, approved
1.2.0 + gated 1.2.1 candidate intact; `icare-lock-verify`; `check-icare-governance`;
`check-no-retired-ref`) · `verify-prepared-chain` (all pins, including the two new checks) ·
`verify-0147…0151-prepared` · `check-table-access` (+ its node tests) · both language-guard
scripts · worker route tests · deno check + 52 deno receiver tests.

**Limitations:** hosted CI did not run — `ci.yml` does not trigger on `integration/*`
branches (it runs on PRs to `main`, which Phase A does not authorize opening). The
database-replay and Circle Postgres suites need Docker, unavailable in this environment.
The live half of the Grace lock check needs function-secret access. Browser/screen-reader
acceptance was not run (requires the staging gate). No live journey was exercised.

## 6. Outstanding executive decisions and unresolved evidence

Unchanged from the reconciliation plan §10, two explicitly deferred by you: the
**attestation apply-authorization record** (pinned, review pending — locating it may involve
PR #45's author session records or GitHub Actions history for 2026-10-23) and **DR-02**
(untouched; nothing in this branch unifies or abstracts RecoveryOS/VRCC). Also still open:
cutover/binding authorization record; Grace 1.2.1 evaluation owner; Issue #35 decisions;
Circle notes retention/correction owner; 0152 apply authorization; designation of
`docs/operations/recoveryos-canonical-state-2026-11-11.md` as the canonical current-state
record (prepared, not designated); housing follow-through SQL reconciliation (out of this
increment's scope).

## 7. Deployment-readiness assessment

**Not deployment-ready, by design and by evidence.** Ready: source-level reconciliation
(every live behavior this work could verify is preserved in version-controlled source;
static/unit/receiver verification green). Missing before any deploy authorization:
(a) hosted CI green on the exact SHA (requires a PR to `main` or a CI trigger addition);
(b) synthetic journey acceptance on a staging deploy — at minimum: both public application
forms, `/my-housing`, document attestation + receipt, consent display including
expired/revoked, Circle entry/return, sign-in returns, accessibility checks (keyboard,
reduced motion, 200% zoom) and the owed screen-reader pass; (c) a decision on the
attestation authorization record; (d) awareness that deploying this branch **changes live
behavior** in two reviewed ways — the consent-display fix and language-guide wording — which
should be acknowledged in the deploy authorization, not discovered after.

## 8. Recommended next authorization (with safeguards)

**Phase B — review and staging verification:** (1) human review of
`integration/reconcile-2026-11` (a PR into `main` can be opened on your word — not opened
now); (2) hosted CI on the exact HEAD; (3) staging deploy of that exact SHA via the existing
manual `Deploy staging` workflow and the synthetic acceptance above; (4) only then a separate
production authorization for the same SHA.

**Rollback and participant-continuity safeguards to carry into Phase B:** production rollback
is one redeploy of `4990829e` (release branch preserved; `release.json` verifies it);
function rollback targets the captured bundle hashes, never "whatever a branch has"; no step
in Phase B touches the database, so no data recovery path is needed; intake continuity is
protected because this branch now carries the live intake implementations verbatim; freeze
window — if anyone must hotfix production before Phase B completes, branch from `4990829e`,
fix, and merge the same commit into `integration/reconcile-2026-11` so the reconciliation
never regresses.

**Stopped here per the authorization. Nothing further will run without your review.**
