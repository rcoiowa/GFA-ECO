# RecoveryOS — Evidence Portability and DR-02 Decision Control (2026-10-29)

**Status: DRAFT PROPOSAL — NOT RATIFIED.** Nothing here is adopted governance,
an architectural decision, or implementation authority.
**Scope:** Documentation and audit methodology only.
**Decision:** DR-02 remains **open and contested**. No architecture approved.
**Decision owner:** Executive Director (Thomas). Preparation on a documentation
branch was authorized 2026-10-29; implementation, ratification, merging, and
production deployment were **not** authorized.
**Prepared on branch:** `claude/dr-02-evidence-portability-proposal`, from
`origin/main` at `3f710a3b32d79af527c1cf738e4b3ba08b480922`.
**Related record:** [GFA–RecoveryOS Distinction Register — Audit v1.0](../../audits/gfa-recoveryos-distinction-register-2026-10-28.md)
(canonical DR-02 tracker; this proposal does not restate or supersede it).

Controlling principle: **Provenance establishes origin. Verification
establishes evidence. Decision authority establishes permission to act.**

## Proposed controls

| Control | Required treatment |
|---|---|
| Provenance | Preserve originating session, tool, timestamp, commit SHA, and retrieval method |
| Verification | Record reviewing environment, independently inspected evidence, status, and limitations |
| Reviewer classification | Maintain reviewer-specific classifications without rewriting originating evidence |
| Revision control | Compare exact commit SHAs; do not infer equivalence from branch names |
| Artifact verification | Establish repository contents at a specified revision |
| Behavioral verification | Independently establish deployed functionality and security behavior |
| Decision authority | Require explicit authorization before changing architectural disposition |

## 1. Evidence provenance

Every material evidence record should preserve:

- Originating session and reviewing environment
- Tool or connector used
- Retrieval date and time
- Repository and exact commit SHA, where applicable
- Retrieval method and artifact identifier
- Verification status assigned by each reviewer (Institutional Evidence Ledger, Classes A–F)
- Known limitations and unresolved discrepancies

Provenance is immutable historical context. Verification is reviewer-specific
and may change as additional evidence becomes available. An upgrade in one
reviewer's classification is recorded as a new verification entry; it does not
rewrite the originating record.

## 2. Revision-aware reconciliation

Repository observations must be associated with exact revisions **and** with
the ref that was actually inspected. An absence observed at one revision does
not establish absence at a later revision. A reported commit remains reported
in a reviewing environment until its existence and relevant contents are
independently inspected.

### Worked example (this proposal's own preparation)

| Step | Observation | Classification in this environment |
|---|---|---|
| 2026-10-29, first check | `grep` for `DR-02`/`D-02` in the working tree found no match. The working tree was the feature branch `35-p0-restore-…` at `69833f5` (committed 2026-10-11), **not fetched**, not `main`. | Valid only for `69833f5`; says nothing about `main` |
| Reported | ChatGPT session reported GitHub commits, including `cc2f4f2`, adding DR-02 records | Class D — reported, provenance preserved |
| 2026-10-29, after `git fetch origin` | `cc2f4f2f7c042e3fb0344a7761ce253b90e34418` resolves; on `origin/main`; message "docs(audit): reconcile baseline aliases and preserve DR-02 competing proposals". `origin/main` head `3f710a3` adds the DR-02 evidence checkpoint. | Artifact verified at those SHAs (Class B for **repository contents only**) |
| Not established | Deployed routes, authentication, identity continuity, RLS behavior under tested identities, consent handling, data destinations | Unchanged — behavioral verification outstanding |

The first check was a scoping error (stale, unfetched, non-default branch), not
evidence of absence. This is the failure mode the revision-control rule exists
to prevent: record the SHA **and** the ref, and fetch before asserting absence.

## 3. Artifact versus behavioral verification

Artifact verification establishes what a specified repository revision contains.
Behavioral verification establishes what the deployed system actually does.

Neither substitutes for the other. Repository inspection alone cannot establish
deployment state, authentication continuity, authorization enforcement, consent
handling, or runtime data destinations. Metadata inspection (for example,
`pg_policies` definitions) establishes that a policy is defined, not that a
role boundary holds under tested identities.

Applied to the register's 2026-10-28 DR-02 evidence checkpoint, as reviewed from
this environment:

- The four repository paths it cites (`docs/architecture/route-registry.md`,
  `docs/architecture/recoverycommunity-domain-map-2026-09-24.md`,
  `apps/platform/src/App.tsx`, `docs/HANDOFF.md`) exist at `3f710a3`, and
  `App.tsx` contains host mappings for `recoverycommunity.center` and
  `recoverycommunity.app`. Artifact-level only.
- The read-only CQCX `pg_policies` observation was not reproduced here (no
  authenticated Supabase access in this environment). It remains Class D from
  this reviewer, with provenance attributed to the originating session.

## 4. DR-02 architectural control

| Disposition | Source | Status |
|---|---|---|
| Abstract | Baseline D-02 (Working v0.1) | Proposed |
| Unify | Audit v1.0 DR-02 | Proposed (competing) |
| Hybrid | Alternative raised in reconciliation | Under consideration |

**Final disposition: open and contested. None approved.**

## 5. Runtime evidence gate

Before architectural disposition, examine:

1. Deployed routes and application boundaries
2. Authentication and session behavior
3. Participant identity continuity and duplicate prevention
4. Authorization and Supabase RLS enforcement
5. Consent collection, persistence, and enforcement
6. Data destinations, ownership, and access boundaries

Each finding must record: environment, test method, evidence, exact source
revision, retrieval method, observation date, limitations, and any difference
between repository configuration and deployed behavior. Tests use synthetic
identities; no participant rows are queried.

## 6. Change-control boundaries

This proposal is prepared on a separate documentation branch. It does not
authorize production changes, database migrations, deployment, pull-request
creation, merging, governance ratification, or architectural implementation.
Any subsequent change requires separate approval from the authorized
decision-maker.

**Next milestone:** a source-backed DR-02 runtime verification report, followed
by an explicit architectural decision.
