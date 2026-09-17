# RecoveryOS Convergence Release Candidate — Gate Evidence Record (2026-09-17)

**Status:** Release-candidate evidence complete. **PR #15 remains DRAFT / NOT MERGED.**
This record is evidence only. It does **not** authorize a database migration, Edge Function
deployment, Cloudflare/DNS/Wix mutation, default-branch change, or any production cutover.

## Anchors

| Ref | SHA |
| --- | --- |
| Pre-convergence `main` | `4959156a507f6726cd9c2ddf3a1872358badbeb3` (tree `7558ddd8b813828594dc49b09b84ed352b0bd02a`) |
| PR #7 head (modern app/migration lineage) | `825bb5c1ef80e3723725ff1a520208fff3188be7` |
| PR #8 head (Grace naming payload) | `f0be9dd4b1a116c99a7483f19a0dc56affcdd6c7` (commits `f0be9dd`, `741822d`, `4f75c5f`) |
| RC branch | `release/recoveryos-convergence-2026-09-17` |
| RC head at Gate A entry | `afc45e80ac8d2ed08631693ca6d3fbc6d274cfbf` (CI run 194/195 green) |
| **Finalization head (pre this record)** | `73388a2c64ed6334c4776d74025adadb12bff6e2` (Gate A guard; CI run 196 push + 197 PR, both green) |

The **CANONICAL_RELEASE_CANDIDATE_SHA** is the branch head that carries this evidence record,
verified green by the CI run recorded in PR #15 for that exact SHA. The literal value is
recorded in the PR #15 status comment and the final approval packet.

## Gate A — Prepared-chain manifest lock

`scripts/verify-prepared-chain.mjs` added and wired into CI (`.github/workflows/ci.yml`,
step "Prepared-chain manifest lock (Gate A ...)"). No approved migration SQL was altered to
satisfy the guard; the guard pins the artifacts as they stand on the RC.

Enforces, failing CI on any breach:
1. `supabase/launch/prepared/` contains **exactly** the 14 approved rev-2 artifacts — nothing
   missing, nothing extra — each pinned by exact filename **and** SHA-256.
2. Any missing, extra, or hash-drifted prepared artifact fails CI.
3. The superseded PR #7 intake artifacts (`0147_shared_intake_workflow*`,
   `0147_intake_workflow_foundation*`) may exist only under `docs/superseded/`.
4. `supabase/launch/migrations/` carries no artifact numbered ≥ 0147.

Negative tests exercised locally (all correctly fail CI): hash drift on a prepared file;
resurrection of `0147_shared_intake_workflow.prepared.sql` in the active path; a
`supabase/launch/migrations/0147_*.sql` mirror; a missing approved artifact.

### Approved prepared-chain SHA-256 manifest (14 artifacts)

```
2913d1446d37fddd32d7a9400aff0b28b79d6f6251cc8cfa3a4a3e1e07636182  0147_classification_authorization_isolation.prepared.sql
e148994fdd18e69b3d7ffd7002457c0fd5f5dee7e017ea5dcd91154ead2a78b5  0147_classification_authorization_isolation.rollback.sql
d89a21c60a5ada53dd2bf21ee1ab2ad045cdbfcd22a432ab6fd091f04b6baa26  0147_live_readback_verification.sql
ce763899ed3c47a87d1fd62dc35c05f362bb2cf8f19832c47635482c8e4a8093  0148_view_and_function_exposure_hardening.prepared.sql
981f68cfc27c0419b456cd741a65000c18b1a700cfac079a31ed2d34507a287a  0148_view_and_function_exposure_hardening.rollback.sql
41d595dec64cf79de175d8debd5f0c024924b41c950a16a6eed6ff9a4100cfb5  0148_live_readback_verification.sql
f701f2714e0ebc6c70ab111d486c48559edc65d6e0965170b2243f75467def27  0149_shared_intake_workflow.prepared.sql
7cab6eb8e135f1a984dc1c2fed8472fa4fa5b33bad96b676bb8540136e4eccd4  0149_shared_intake_workflow.rollback.sql
b63092321ead6f58799684ae977fc1fa776052033039fd9c26b6b8d5ff84544c  0149_live_readback_verification.sql
0579a59611234fa26a9f05aa8698cbbb08e24b4faeca25d87f42e9482f0d6619  0150_intake_consent_evidence.prepared.sql
09aacb55615d183f48518bc4391665e20787bd0dfbb588755c16b51e03c8c21e  0150_intake_consent_evidence.rollback.sql
a6f119f25adc03fae7ed086cd43ef884d73f40c985d3a98272c685731e44af33  0151_strict_classification_semantics.prepared.sql
2654fb319c2ebde85a7c1abf2d6e6e6c39a3d2c825194ecbf97cff2069913b2f  0151_strict_classification_semantics.rollback.sql
77ea382153cd4f0164fa4961c4a2dbd53642143b215e04f4954e98d5f3c60d33  p0_fixture_role_revocation.gated.sql
```

## Gate B — PostgreSQL 17 replay of the exact RC tree

**Server:** PostgreSQL **17.11** (Debian 17.11-1.pgdg13+2), Docker `postgres:17`, disposable
container. CQCX live is PostgreSQL 17.6; both are the 17.x major line. **No PostgreSQL-16 →
PostgreSQL-17 behavioral difference was observed at any step** — every result matches the
2026-09-16 PG16 rehearsal exactly.

Platform surface built to mirror Supabase (roles anon/authenticated/service_role/authenticator;
`auth.uid()` reading `request.jwt.claim.sub`; `extensions` schema + pgcrypto; `storage`
buckets/objects stubs) and the captured CQCX drift DDL from `supabase/live-drift/cqcx/`.

| Step | Result |
| --- | --- |
| Launch migrations 0000–0146 applied in order (+ seeds 0200–0202) | OK (0104 pg_cron and seed 0203 skipped per their own file headers / documented pre-0117 constraint; same skips as PG16) |
| 0146 EJWRH activation gate | 6 published v1.0 editions verified |
| Pre-fix P0 defect reproduced | fixture `coach` actor satisfied `has_role('coach')` = **true** (fail-open) |
| Apply rev-2 0147 | fixture `has_role('coach')` = **false**; production actor = **true** |
| P0 classification-isolation battery | **64 / 64** |
| 0147 live readback (22-identity) | 22 fixture privileged actors checked, 0 still privileged; production admin retained |
| Gated fixture-role revocation — drift refusal | 23-assignment state **REFUSED** and aborted |
| Gated fixture-role revocation — real run | **22** assignments revoked; **22** audit rows; 0 privileged fixture assignments remain |
| Apply 0148 + readback | all exposure-hardening readbacks OK (incl. global default-ACL excludes PUBLIC execute) |
| P0 battery rerun after 0148 | **64 / 64** |
| Apply 0149 + intake battery + readback | **25 / 25**; readback OK (fixtures 0 intake-privileged, production coordinator retained) |
| Rehearse held 0150 + sequenced 0151 (replay only) | applied cleanly |
| Strict classification battery (0151) | **17 / 17** |
| Rollback rehearsal (0151→0147, reverse order) | all five rolled back; pre-fix fail-open restored |
| Reapply rehearsal (0147→0148→0149) | reapplied cleanly; P0 battery **64 / 64** |

0150 stays production-HELD and 0151 stays sequenced behind 0150; both were rehearsal-only here.

## Gate C — Proofs P1–P7 against the final RC head

| Proof | Result |
| --- | --- |
| **P1** ancestry (`git merge-base --is-ancestor main RC`) | PASS — `main` is an ancestor of the RC |
| **P2** migrations-ledger parity vs PR #7 (`git diff PR7 RC -- supabase/launch/migrations`) | PASS — empty diff; ledger identical |
| **P3** prepared-chain SHA-256 = rev-2 pins | PASS — matches the 14-artifact manifest above |
| **P4** PR #8 payload integrity | PASS — 29/30 PR #8 files byte-identical in RC; the sole difference is `supabase/functions/README.md`, exactly the documented union of PR #7's retired-project safety warning with PR #8's Grace naming |
| **P5** application-tree parity | PASS — every `apps/` `packages/` `supabase/functions/` change in RC traces to the PR #8 payload; no unaccounted application-code change beyond PR #7 lineage |
| **P6** full-tree manifest / delta accounting | PASS — RC 856 blobs = PR #7 810 + 46 added; RC-vs-PR7 delta is 74 paths (46 add + 27 modify + 1 rename), each enumerated below |
| **P7** merge/revert rehearsal | PASS — merging RC into a copy of `main` then `git revert -m 1` reproduces `main`'s exact tree hash `7558ddd8b813828594dc49b09b84ed352b0bd02a` |

### P6 delta accounting (RC vs PR #7 head), 74 paths

- **1 rename (R079):** `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql` →
  `0149_shared_intake_workflow.prepared.sql` (rev-2 renumbering).
- **46 added:** 20 Control Tower rev-2 chain artifacts (prepared 0147/0148/0149 rollbacks +
  readbacks, 0150/0151 prepared+rollback, `p0_fixture_role_revocation.gated.sql`, the three P0
  test batteries) + `verify-0148/0149/0150/0151-prepared.mjs` + `verify-prepared-chain.mjs`;
  25 documentation records (audits, decisions, architecture, compliance, operations, discovery,
  deployment plans, PR #8 naming decision docs, the `docs/superseded/` 0147 tombstone).
- **27 modified:** `.github/workflows/ci.yml` (CI union), `verify-0147-prepared.mjs` (rev-2
  edition), `supabase/functions/README.md` (union), and the PR #8 Grace-naming changes across
  participant copy, `grace`/`grace-judge` functions, `grace/policy.ts`, eval scenarios, and
  disclosure/source docs.

## Edge Function provenance (candidate blob SHAs, `index.ts` unless noted)

| Function | RC blob SHA (`index.ts`) | Provenance | Deploy posture |
| --- | --- | --- | --- |
| `lead-intake` | `a3936eb160a6256ec3e21f2a702acc57903ced42` | PR #7 lineage (differs from `main`) | candidate; deploy gated, NOT authorized here |
| `residence-intake` | `c3276f5e4cf350eb267599d6c7b1140b0e78849d` | PR #7 lineage (differs from `main`) | candidate; recorded Type D deploy gate, NOT authorized here |
| `ejwrh` | `51f8fdad7e0fb46f06d5fe35d5730bbfb5f5bfc7` | PR #7 lineage; **no source on `main`** | **SUPA-FN-001: UNKNOWN provenance → NO REDEPLOY** until exact live-source mapping proven |
| `grace` | `ec7bdd5b2262e35dec9071bc75e838a168f665e6` (policy.ts `06640cf3…`) | == PR #8 head (naming/disclosure only) | naming-only; no behavior change; deploy NOT authorized here |
| `grace-judge` | `c4e61837624db5a8e61b2d47f6d84860daa17b41` | == PR #8 head (naming/disclosure only) | naming-only; deploy NOT authorized here |
| `grace-coaching-canary` | `13512a5b16ff52c30457822463e90de85b4bff3c` | **byte-identical to `main`** | unchanged |
| `create-meeting` | `37a4d5dd3f720e3c3a0bb46799ccfcb45b7d601e` | **byte-identical to `main`** | unchanged |

## Remaining production execution order (separately authorized; NOT performed here)

1. Ledger re-verification on CQCX (tail `0146_ejwrh_document_activation`); PITR/backup capture.
2. Apply prepared **0147** → live readback (22-identity) → **gated fixture-role revocation**
   (exact 22/22 + 22 audit rows, drift-refusal in force).
3. Apply prepared **0148** → live readback.
4. Apply prepared **0149** → live readback.
5. **0150** stays HELD pending receiver conditions (no submission acceptance without evidence
   stamping); **0151** stays sequenced strictly behind 0150 (separate resequencing decision to
   move ahead of it).
6. Edge Functions: `ejwrh` NO REDEPLOY (SUPA-FN-001); other candidates deploy only under their
   own recorded gates.
7. Repository default-branch / merge-line decision (REPO-001) is separate and not settled here.

## Blockers preventing merge / deployment

- **PR #15 must stay DRAFT** until production change-control authorizes the execution order above.
- **SUPA-FN-001** — `ejwrh` provenance UNKNOWN; NO REDEPLOY until an exact live-source mapping
  reads PROVEN.
- **REPO-001** — canonical default branch / merge line unconfirmed; the RC does not itself
  authorize a merge to `main`.
- Live CQCX was not reachable from the release session (Supabase connector unauthenticated);
  all Gate B evidence is isolated-replay rehearsal, not a live application.
