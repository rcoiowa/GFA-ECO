# RecoveryOS canonical state — 2026-11-11

**Status: PREPARED SUCCESSOR RECORD — executive designation as the canonical current-state
record is PENDING** (Prompt 3 Phase A, Increment 6). Until designated, it is verified
evidence, not governance. It succeeds `recoveryos-canonical-state-2026-08-31.md` in time and
corrects the parts of that record that later verified evidence moved past. Verification
details: `docs/discovery/source-of-truth-assessment-2026-11-11.md` and
`docs/plans/2026-11-11-gfa-reconciliation-decision-and-release-plan.md`.

Everything below is Class B (verified 2026-11-11 by runtime probe, authorized read-only
Supabase/Cloudflare access, or repository inspection) unless marked.

## Repository

- Canonical repo: `rcoiowa/GFA-ECO`. `main` HEAD `6aaa532` (2026-11-10).
- **Production serves a release line that is not on `main`:** release SHA
  `4990829e16ec4c83ec62fa245f0f9b4f0308dd0b` = head of
  `release/restore-housing-directory-20261104`; the lines diverged at `79172a47`
  (2026-10-12). Reconciliation branch prepared: `integration/reconcile-2026-11`
  (merge of both lines + deployed-function source reconciliation; **not merged, not
  deployed** — awaiting review and separate authorization).

## Public surfaces (runtime-verified 2026-11-11)

- `vrcc.app`, `www.vrcc.app`, `recoverycommunity.center`, `recoverycommunity.app`,
  `recoveryresidence.app` → platform shell; `recoveryresidence.org` → housing-directory
  entrance. All six plus `recoveryos-staging.thomas-499.workers.dev` report
  `release.json = 4990829e… / cqcxvwoukyhxyokfwnjm`.
- Serving Worker: `recoveryos-staging` (content-identical and modified 18 minutes after the
  release commit; domain-binding configuration itself not exposed to the read tool — Class E
  on the binding, pending one Cloudflare dashboard read). The Worker named
  `gfa-eco-recovery-residence-os` ("production candidate") is **behind** production
  (last modified 2026-10-13). `rco-iowa-public` serves `rcoiowa.org` (Class E).
  Legacy `virtualrecovery` and `vrcc-app` Workers no longer exist. Still live:
  `gfa-vrcc.pages.dev`, `gracehouse4.pages.dev` (legacy), the Wix site.

## Backend (CQCX `cqcxvwoukyhxyokfwnjm`, `recoveryos` schema)

- Applied ledger (read 2026-11-11, 94 entries): launch `0000`–`0146`, early EJWRH drift
  entries, **`0147`–`0149` (2026-09-17)**, `20261005*` (circle ×2, accountless conversion),
  `20261020010443` housing follow-through (2026-10-20), `20261023223104`
  document_review_attestations (2026-10-23). **Not applied:** 0150, 0151, 0152.
- Ledger↔repository mapping and gaps:
  `docs/migration/applied-ledger-reconciliation-2026-11-11.md`. Two applied migrations'
  SQL still live outside the canonical tree (housing follow-through — unmerged PR #42
  branch; attestations — hash-pinned proposal file, **apply-authorization record not yet
  located; review pending by executive direction**).
- Edge Functions (live): `grace` v16 — **serves approved `grace-policy-1.2.0`** (read from
  deployed source) — `grace-judge` v9, `grace-coaching-canary` v13, `create-meeting` v13,
  `lead-intake` v16, `residence-intake` v7, `ejwrh` v7. Deployed `lead-intake` and
  `residence-intake` sources are reconciled into `integration/reconcile-2026-11`
  (captures: `docs/discovery/deployed-captures-2026-11-11/`, designated branch).
  Correctly absent: `coaching`, `notify-fanout`, `create-meeting-canonical`.
- Retired YKY project (`ykykeioydvtxpyreshhs`): frozen and out of scope per the 2026-09-01
  executive scope update; current platform status unverified (Class F).

## Governance locks (unchanged; this record changes nothing)

- `grace-model-lock.json` — approved policy `grace-policy-1.2.0`; `grace-policy-1.2.1` is a
  declared **candidate, evaluation pending** (gate blocks Grace deploys); provider
  activation documented OFF (Class C/D — env not readable).
- `icare-implementation-lock.json` + ICARE Authority v1.0 — all invariants verified in CI
  and locally 2026-11-11.
- Prepared-chain manifest guard — now also carries the verified applied status of
  0147–0149 and the attestations pin (see Increment 2 record).
- Distinction register (2026-10-28): all 12 records open; **DR-02 remains UNRESOLVED and is
  not advanced by any reconciliation work.**

## Open gates (pointers, not restated)

Grace 1.2.1 evaluation (owner unnamed); Issue #35 routing/delivery gates and decisions;
0150/0151/0152 apply authorizations; attestation authorization review; Circle notes
retention/correction owner; cutover/binding authorization record; Wix language publication;
legacy-surface retirement. Decision queue: §10 of the 2026-11-11 reconciliation plan.
