# Support-workflow organization-scoped authorization — PREPARED (do not apply)

- **Prepared:** 2026-10-13 · **Branch:** `claude/support-workflow-org-authorization-2026-10-12` · base `origin/main` `79172a4`
- **State:** PREPARED + REVIEW. **Applying migrations, deploying, and changing production permissions remain separately gated** (prepared → apply / Gate B / Gate C). Nothing here mutates CQCX or production.
- **Addresses** the live findings reported 2026-10-12 (reconciliation record §E3 / B12): F1 hardcoded `organization_id = 1`; F2 role checks not org-scoped; F3 support-request visibility without org predicate; F4 broad administrator visibility; F5 classification ≠ tenancy.

## Files
| File | Purpose |
|---|---|
| `support_workflow_org_authorization.prepared.sql` | the fix (helpers, claim RPC, list fn, policies, handoff RPC) |
| `support_workflow_org_authorization.rollback.sql` | restores prior live definitions verbatim; drops new helpers |
| `support_workflow_org_authorization_negative_tests.sql` | behavioral battery (isolated replay only) |
| `../../../../scripts/verify-support-workflow-authz-prepared.mjs` | static CI invariant guard (wired into `.github/workflows/ci.yml`) |

## 1. Migration mapping (numbered 0150/0151/0152 ↔ live timestamp ledger)

Live application state established from the 2026-10-12 live ledger (reported) + repo at `79172a4`:

| Numbered prepared artifact | Live ledger entry | Status |
|---|---|---|
| `prepared/0147_classification_authorization_isolation` | "classification/authorization isolation" (Sep 17) | **APPLIED** |
| `prepared/0148_view_and_function_exposure_hardening` | "view/function exposure hardening" (Sep 17) | **APPLIED** |
| `prepared/0149_shared_intake_workflow` | "shared intake workflow" (Sep 17) | **APPLIED** |
| `prepared/0150_intake_consent_evidence` | — (not in ledger) | **PREPARED, NOT APPLIED** |
| `prepared/0151_strict_classification_semantics` | — (not in ledger) | **PREPARED, NOT APPLIED** |
| `0152_*` (numbered) | — | only **DOC-INTEGRITY document corrections** exist under `docs/corrections/`; unrelated to the support workflow; not applied |
| — | `20261005071446_circle_meeting_logging` | **APPLIED** (migrations/) |
| — | `20261005092358_circle_county_access_schedule` | **APPLIED** (migrations/) — org-scoped role-auth precedent reused here |
| — | `20261005093045_accountless_application_conversion` | **APPLIED** (migrations/) |

**Conclusions:** 0147–0149 are applied (stop calling them "prepared"). 0150/0151 remain prepared-not-applied; the Oct-5 timestamp migrations are unrelated changes. The applied lineage now uses **timestamp-named** migrations. **This fix is written against the applied state** (`migrations/≤0146` + `prepared/0147–0149` + the three `20261005*`), independent of the pending 0150/0151. On apply it should become a **timestamp-named** migration in `supabase/launch/migrations/`.

> It lives in `supabase/launch/proposed/` (OFF the Gate-A manifest, which locks `supabase/launch/prepared/` to an exact set) so CI's `verify-prepared-chain.mjs` is not disturbed.

## 2. Authoritative organization scope

- `role_assignments` already carries `organization_id`, `program_id`, `residence_id`, `revoked_at` — the scoping data exists.
- `support_requests`, `coaching_relationships`, `navigation_relationships` all carry `organization_id` (the first nullable; the latter two `NOT NULL`).
- New helper `has_role_in_org(role, org)` requires an **explicit org match** and reuses the `circle_county_access_schedule` program/residence-in-org pattern, preserving the `revoked_at is null` and test-fixture privilege guards.
- Global `has_role()` / `is_admin_staff()` are **left intact for platform administration**; participant-record access now goes through the `*_in_org` variants.

## 3. What the fix changes
- **F1** `claim_support_request`: resolves org from `v_req.organization_id` (no hardcoded `1`); writes the relationship with that org.
- **F2** claim eligibility uses `is_coach_staff_in_org` / `is_navigator_staff_in_org`.
- **F3/F5** `list_open_support_requests` and `sr_staff_pool_select` add an org predicate **on top of** the preserved `same_world()` classification check.
- **F4** `coaching_rel_staff_select` and `sre_parties_select` replace global `is_admin_staff()` with org-scoped `is_admin_staff_in_org(...)`.
- **Handoff** new `handoff_support_request(request, target_org, reason)` — an admin **in the request's current org** may move it to another org; logged as a `support_request_events` `handoff` row. This is the *only* sanctioned cross-org path.

## 4. Tests & results (this session)
- **Static verifier** `verify-support-workflow-authz-prepared.mjs`: **PASS (executed, 18/18)** — asserts F1–F5 posture, handoff gating, anon revocation, and rollback parity; now a CI step.
- **DDL install/rollback** on an ephemeral PostgreSQL 16 with faithful stubs: **PASS (executed)** — `prepared.sql` installs all 8 objects and 3 policies; `rollback.sql` reverts (helpers dropped). Proves the new SQL compiles, SQL-function references resolve, and policies attach.
- **Behavioral battery** (`*_negative_tests.sql`, 23 assertions): **AUTHORED, NOT EXECUTED this session** — it requires the full schema + auth shim and is **isolated-replay-only**, consistent with the existing `supabase/launch/tests/p0_*_negative_tests.sql`. Run it at Gate-B replay (`set recoveryos.negtest='on'`). Covers T1 same-org permitted, T2 cross-org read denied, T3 cross-org claim denied, T4 revoked-role denied, T5 test-fixture separation, T6 authorized handoff, T7 null-org request, T8 platform/participant separation.

## 5. Rollout / rollback
- **Rollout (gated):** apply 0150/0151 reconciliation decision first (D5 below); apply this fix as a timestamp-named migration via the normal apply path; run the behavioral battery on replay/staging; then re-run on the target before enabling. No frontend change required (same RPC signatures; `handoff_support_request` is additive).
- **Rollback:** run `rollback.sql` — restores prior function/policy definitions verbatim. **Data note:** it does **not** revert rows written while live (relationships created with the real org, handoff moves). Those are correct and left in place; reverting them is a separate, authorized data step.

## 6. Decisions for the lead (defaults chosen; flip at review)
- **D1 — null-org role = platform scope, NOT participant access.** A `role_assignments` row with `organization_id IS NULL` does not grant participant-record access in any org; participant access needs an explicit org-matching assignment. This is how "separate platform administration from participant-record access" is enforced. *Alternative:* treat null-org as wildcard (rejected for participant records). **Impact:** any platform admin/system_administrator who legitimately needs participant access must hold an explicit org-scoped role.
- **D2 — a support_request with `organization_id IS NULL` cannot be claimed** (`org_unresolved`) and is invisible to staff. *Alternative:* resolve org from the participant's program/enrollment. **Impact:** legacy null-org rows need reconciliation (see §7) before they can be worked.
- **D3 — cross-org handoff is explicit + logged** via `handoff_support_request`, authorized to an admin in the source org. *Alternative:* a referral-style record. Confirm the exact handoff authority and whether a target-org acceptance step is required.
- **D4 — appointments / booking NOT rewritten.** `appointments` has no `organization_id`; its cross-party admin read still uses global `is_admin_staff()`. Decide the org source (provider's org, or add a column) before org-scoping it. **This is a known residual cross-org read surface.**
- **D5 — 0150/0151 reconciliation.** Decide whether to apply 0150/0151 (and under which name) or retire them, before this fix is sequenced, since the lineage is now timestamp-named.

## 7. Existing records requiring reconciliation (NOT auto-changed)
This migration does **not** reassign or rewrite any existing row. Before/at apply, review (read-only):
1. `coaching_relationships` / `navigation_relationships` created by the old claim path with `organization_id = 1` that do **not** match their participant's/request's true org — list and correct under separate authorization.
2. `support_requests` with `organization_id IS NULL` or an org that disagrees with the participant's org — set the correct org (human decision) before they can be claimed under the new rules.
3. Any `role_assignments` relied upon for cross-org participant access today (null-org privileged roles) — under D1 these stop granting participant access; confirm the intended holders get explicit org-scoped grants so legitimate work is not interrupted.
