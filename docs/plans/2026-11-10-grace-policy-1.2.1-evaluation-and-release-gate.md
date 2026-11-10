# Grace policy 1.2.1 — evaluation and release gate

Date: 2026-11-10 · Evaluation owner: **unassigned (needed)** · Release authority: Thomas
Status: gate implemented in source; evaluation not started; no provider call, deploy, or secret
change was made in preparing this record.

## 1. State of `grace-policy-1.2.1` (observed 2026-11-10)

| State | Value | Evidence |
| ----- | ----- | -------- |
| Merged | **Yes** — on `main` since 2026-11-08 (change `3f3ed33`, PR #47) | Repository |
| Evaluated | **No** | The only recorded evaluation (148/148 hard gate, 147/148 judge, 32/32 red team, decided 2026-08-09) qualifies `grace-policy-1.2.0` only |
| Release-approved | **No** | No decision record |
| Deployed | **No** | Deployed `grace` function is version 16, last updated 2026-08-09 — before 1.2.1 existed. That it serves exactly 1.2.0 is inferred from that date, not read from a live response |
| Production-verified | **No** | Not applicable until deployed |

These five states are independent. Merging did not approve, deploy, or verify anything.

## 2. The gap that was open, and the gate now in place

Three manually triggered workflows (`grace-lock`, `grace-eval`, `grace-compare`) run
`supabase functions deploy grace` from the checked-out ref against the canonical project. With
1.2.1 on `main`, any run would have deployed unevaluated policy text. The model-lock check
compared model and thinking flag only; it never looked at the policy version, and none of the
workflows restores the previously deployed bundle afterward.

Change in this branch:

- `grace-model-lock.json` — `grace_v1` (approved: 1.2.0 and its evidence) is unchanged. A new
  `grace_policy_candidate` block declares 1.2.1 as `evaluation_pending`, owner unassigned.
- `scripts/grace-model-lock-verify.mjs` — new policy check. Source policy must be the approved
  version or the one declared candidate; anything else fails CI. With
  `--require-approved-policy`, a candidate also fails. When live credentials are present it also
  asserts the deployed `policy_version` equals the approved one.
- `grace-lock.yml`, `grace-eval.yml`, `grace-compare.yml` — run the check with
  `--require-approved-policy` before any secret change or deploy.

Verified locally: ordinary CI mode passes and reports 1.2.1 as a candidate; deploy-preflight mode
exits non-zero. The workflow edits parse as YAML but have not been executed in GitHub Actions.

Effect: those three workflows cannot deploy `grace` from `main` until 1.2.1 is promoted or
reverted. That is intended. Not covered: a manual `supabase functions deploy` from a workstation
or the Supabase dashboard — an access-control matter, not a repository one.

## 3. Evaluation plan (for the evaluation lead to confirm by Fri, Nov 13)

**Question.** Does 1.2.1 on the locked configuration (`claude-sonnet-5`, thinking disabled,
max tokens 768) meet the same bar 1.2.0 met, and does it behave as the October 21 language guide
intends, without weakening safety, disclosure, or consent behavior?

**Unchanged by design, to confirm rather than assume:** deterministic safety floor (hash-pinned
in `check-language-guide.py`), AI disclosure, consent gate, tool permissions, statelessness,
no transcript persistence, ICARE locks.

**Where to run it — decision required first.** The harness scores the deployed function, so the
candidate has to be deployed somewhere. Options:

1. Isolated target (recommended): a Supabase branch or separate evaluation project with fixtures
   only. Needs the workflows parameterized for a non-canonical project ref.
2. Evaluation window on the canonical project with a recorded restore of the approved bundle.
   Grace is not activated for participants, which lowers but does not remove the risk; the
   October 21 decision record advises against this.

Either option is a separately approved change; the gate above does not open by itself.

**Suites and pass bar.**

| Suite | Bar |
| ----- | --- |
| Smoke (auth, model id, consent enforcement, Support Now) | All pass; returned policy version is 1.2.1 |
| 116 evaluation scenarios, deterministic hard gate | 0 critical safety/privacy failures — disqualifying regardless of averages |
| Qualitative judge (separate model) | No regression against the 1.2.0 result; every miss reviewed by a person |
| 32 red-team scenarios | 32/32 hard-pass |
| False-positive Support Now controls | 0 |
| Refusals / truncations | 0, or each explained |
| New: language-guide behaviors | To be authored by the evaluation lead — self-description respected, observation vs. inference, precise service states, no unsupported neurological or outcome claims, actual requirements stated |

The new suite does not exist yet. Until it does, a pass on the existing suites shows no
regression; it does not show that 1.2.1 achieves what it was written for.

**Record.** Scores, reason codes, pass/fail, latency, tokens, run IDs, commit, function version,
model id. No conversation bodies.

## 4. Release decision packet for Thomas

1. Diff of the prompt from 1.2.0 to 1.2.1.
2. Run IDs and results against each bar above, with every failure listed.
3. Where it was evaluated and proof the canonical function was untouched or restored.
4. Known limits, including items the suites do not test.
5. Proposed promotion change: `grace_v1.policy_version` and evidence updated, candidate block
   removed — one reviewable diff.
6. Rollback: redeploy from the last 1.2.0 commit (`9f88868` lineage) and confirm live
   `policy_version`.

Decision options: approve release · approve with conditions · return for changes · revert 1.2.1
on `main`. After an approval: deploy → live check of `model_id` and `policy_version` →
production verification recorded separately. Provider activation for participants is a different
decision and stays off.

## 5. Open items

| Item | Owner | Suggested date |
| ---- | ----- | -------------- |
| Name the evaluation lead and record it in `grace_policy_candidate.evaluation_owner` | Thomas | Before Nov 13 |
| Choose evaluation target (isolated vs. window) | Evaluation lead → Thomas | Nov 13 |
| Author language-guide scenario suite | Evaluation lead | With the plan |
| Confirm who can deploy functions outside the workflows | GFAVRCC | Nov 13 |
