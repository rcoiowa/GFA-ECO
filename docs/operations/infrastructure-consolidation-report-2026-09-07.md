# RecoveryOS infrastructure consolidation — session report, 2026-09-07

Continuation of the consolidation delivered in
[PR #7](https://github.com/rcoiowa/GFA-ECO/pull/7)
(head branch `claude/recoveryos-infrastructure-consolidation-2026-09-07`).
Evidence classes follow the Institutional Evidence Ledger: **B** = verified
operational evidence gathered live this session; **C** = leadership-confirmed;
**D** = reported/historical.

Nothing in this report authorizes a live mutation. Every live change remains
behind its own approval gate (§8).

---

## 1. PR #7 review result (Class B)

All 11 originally changed files inspected; CI run
[34163560170](https://github.com/rcoiowa/GFA-ECO/actions/runs/34163560170)
confirmed `success` on exactly `fdea101`. Local verification on that head:
frozen install; all 14 governance guard scripts pass; `pnpm typecheck` clean;
164/164 platform tests pass (30 files); `pnpm build` succeeds; the
canonical-backend asset check passes (no retired ref, canonical ref present);
`actionlint` clean on `ci.yml` and both deploy workflows. Independent SQL
review confirmed the prepared 0147 depends only on objects the launch chain
provides (`recoveryos.role_key` from 0001, `audit_log` from 0007, policy names
from 0102, `residence_application_intake` from 0122).

One real gap was found and then closed (§3): neither deploy workflow verified
that CI succeeded for the exact dispatched ref, and the staging workflow ran
no typecheck/tests of its own.

## 2. Repository lineage and the proposed consolidation graph

### Measured state (Class B, `git merge-base` / `rev-list`)

- Default branch `claude/supabase-mcp-setup-ep29rp` = a single commit
  `e901b22` (2026-07-19). It **is** an ancestor of `main` — not orphaned from
  it.
- `main` (tip `4959156`, 128 commits, PR #6 merge of 2026-08-21) and the
  application line share **no git ancestor**: the application line was
  re-rooted at `990f038` (2026-08-23) as a disconnected history. Content-wise
  `main` is the same product ~161 files behind the resume tip.
- Merge base of resume/audit: `08b979f`. After it:
  `claude/resume-previous-session-hbt3xp` carries 3 unique commits / 9 unique
  files (ratified 0147 delta + InquiriesPage UI + decision docs);
  `claude/recoveryos-canonical-audit-1pvcwr` carried 2 unique commits / 3
  unique docs.
- Both live Cloudflare Workers run commits from the shared application-line
  history (`d7ab99d` staging, `1542eaf` candidate) — ancestors of the
  consolidation head.

### Already done (non-destructive, this session)

`claude/recoveryos-canonical-audit-1pvcwr` was merged `--no-ff` into the
consolidation branch (merge commit `0f8306f`), preserving both unique audit
commits and all three unique documents. The audit branch itself is untouched.

### Proposed graph (each arrow is a reviewed PR / approval gate — see §8)

```
e901b22 (default branch)──…──4959156 (main)
                                     \
                                      \   (Gate L3: unrelated-histories join)
990f038──…──08b979f──…──5065180 (resume) ──────────────► main'
                  \                     ▲
                   \                    │ Gate L2: merge PR #7 (no squash)
                    ├──236cc8c──96cd26d (audit)
                    │              \
                    └──…──fdea101───0f8306f──…──HEAD (consolidation branch)
```

1. **Gate L2 — merge PR #7** (consolidation → resume, merge commit, never
   squash) so the resume branch becomes the complete application line.
2. **Gate L3 — update `main`**: join the two roots with a deterministic
   two-parent merge commit whose tree is exactly the application-line tree:
   `git commit-tree <app-tip>^{tree} -p <main-tip> -p <app-tip>` — proven
   locally this session (produces the application tree byte-for-byte, keeps
   both histories, no force push, no history rewrite). Push that commit to
   `main` via a reviewed PR or a plain fast-forward of the merge commit.
3. **Gate L4 — set the repository default branch to `main`.**
4. **Gate L5 — branch protection on `main`**: require pull requests, require
   the `CI` check, forbid force pushes, restrict deletion. (Configuration
   steps in §3; no branch is deleted or archived without its own approval.)

Rollback for L2/L3: both are pure merge commits — revert the merge commit
(`git revert -m 1`) restores the previous tip; no history is rewritten at any
step.

## 3. GitHub deployment controls

### Done in the repo (Class B, commit `2a0647f`)

- Both deploy workflows are `workflow_dispatch`-only (no push triggers), take
  an exact `release_ref`, resolve it to an immutable SHA, and require typed
  confirmations `DEPLOY_STAGING` / `DEPLOY_CANDIDATE`.
- NEW: both now query the GitHub API and **fail unless a successful CI run
  exists for the exact resolved SHA**; token permissions pinned to
  `contents: read` + `actions: read`.
- `scripts/verify-cloudflare-boundaries.mjs` (in CI) now enforces
  manual-only triggers, the release-ref input, the pinned Wrangler version,
  the CI-for-exact-commit gate, and the `workers/api` quarantine.
- The `staging` and `production-candidate` environment names are referenced
  by the workflows, so environment protection rules apply to every run.

### Requires the GitHub UI — Settings → Environments

This session's tool surface has no environments/branch-protection API, so
these are exact manual steps:

- `production-candidate`: add **Required reviewers** (at least one human),
  restrict deployment branches/tags to the canonical branch, and store
  `CLOUDFLARE_API_TOKEN` as an **environment** secret (not repository-wide).
- `staging`: same required-reviewer protection is recommended — it is an
  ACTIVE PILOT with real participants
  (docs/operations/staging-pilot-reconciliation-2026-08-31.md).
- `p4h-live-gate` (used by live-gate.yml) already exists; review who can
  dispatch it since it holds `SUPABASE_SERVICE_ROLE_KEY`.
- Cloudflare token scope: verify in the Cloudflare dashboard that
  `CLOUDFLARE_API_TOKEN` is an account-scoped token with only the
  "Edit Cloudflare Workers" template for this single account. Not readable
  from this session.

The other push-triggered workflows (`grace-*`, `live-gate`) run evaluations
and tests only — none invokes Wrangler or touches DNS (verified by
inspection).

## 4. Cloudflare account audit (Class B via MCP; gaps noted)

Workers (10, from the live account listing):

| Worker                          | Last modified     | Disposition                                                                          |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `recoveryos-staging`            | 2026-09-02 21:38Z | ACTIVE PILOT — deployed by dispatch run 73, commit `d7ab99d` (application line)      |
| `gfa-eco-recovery-residence-os` | 2026-09-01 19:36Z | Production candidate ONLY — deployed by candidate run 2, commit `1542eaf`            |
| `vrcc-app`                      | 2026-08-16        | Legacy (pre-consolidation experiment) — do not deploy; keep pending disposition gate |
| `virtualrecovery`               | 2026-08-16        | Legacy App B (cross-account vrcc.app README origin per 08-31 audit) — untouched      |
| `recovery-residence-os`         | 2026-07-29        | LEGACY, YKY-backed per 08-31 audit — frozen, untouched                               |
| `vite-react-template` 1–5       | 2026-08-01/02     | Template experiments — candidates for a future cleanup gate                          |

- **No Worker named `recoveryos-api` exists** (live listing, confirming the
  08-18 audit): the `workers/api` prototype was never deployed. Its
  `wrangler.toml` names `recoveryos-api`; the prototype is quarantined in-repo
  (deploy script blocked, CI-guarded). Nothing to detach or delete.
- Storage: one stray KV namespace `my_kv_namespace` (experiment; delete only
  under a cleanup gate). No R2 buckets, no D1 databases.
- Deployment attribution: every recorded deploy of the two canonical Workers
  came through the GitHub workflows (runs 71–73 staging; runs 1–2 candidate).
  The old push-trigger paths those runs used were removed by PR #7.
- **Tool-surface gaps (verify in dashboard):** routes/custom domains, Workers
  Builds/Git integrations, environment variables/secrets, deployed version
  ids, and observability settings are not exposed by the available MCP tools,
  and `*.workers.dev` is blocked by this session's egress policy. Class C/D
  state from docs/operations/recoveryos-canonical-state-2026-08-31.md:
  staging = workers.dev only; candidate = workers.dev + an inert vrcc.app
  binding in a PENDING zone; both bundles CQCX-verified at deploy time by the
  workflow guard (the guard runs in every deploy, so this holds for the 09-01
  and 09-02 deploys too). Dashboard checks to complete: no Git-integration
  auto-builds on either canonical Worker; no unexpected routes; token scope.
- Live-asset spot check to run from an unrestricted network:
  `curl -s https://recoveryos-staging.thomas-499.workers.dev/assets/index-*.js | grep -c cqcxvwoukyhxyokfwnjm` (expect ≥1; retired ref expect 0).
- No workflow performs DNS or vrcc.app cutover (verified by inspection of all
  seven workflow files).

## 5. Prepared migration 0147 — design review status (Class B; CORRECTED 2026-09-08)

Testing environment: local PostgreSQL 16.13 (isolated cluster, unix socket
only), full launch chain 0001–0146 + seed 0200 replayed with a minimal
Supabase shim (auth schema/roles, pg_cron, storage/legacy-drift stubs). CQCX
was touched read-only.

All four open questions were reproduced as real defects on the isolated
database. Three are fixed in the prepared file and re-tested; the fourth
(reopening) is **deliberately NOT encoded** — the independent review correctly
found the 2026-09-07 session had encoded reopen semantics before ratifying a
transition matrix, and that encoding has been removed (commits `4529d4f`,
`9b2e90f`):

| Question                       | Empirical finding (before)                                                      | Status                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `linked_intake_id` one-to-one? | Two leads could link the same intake                                            | FIXED — partial index is now UNIQUE; violation surfaces as `intake_already_linked`                                                                                                                                                                                                                                                                                                              |
| `route_lead` verifies intake?  | Nonexistent id leaked a raw FK exception; wrong-residence link accepted         | FIXED — existence + active-residence match verified (`grace_house`=1, `ejwrh`=2, the pinned canonical mapping); changing interest can never preserve a mismatching existing link (`link_conflicts_with_interest`); unlinking is an explicit, audited act (`p_unlink` → `lead.unlinked`); 8/8 tests pass                                                                                         |
| Closed leads reopen?           | Reopen allowed silently; stale `spam` label stayed on the active lead; no audit | **NOT DECIDED.** The prepared file now REJECTS reopening (`reopen_not_ratified`); closed→closed reclassification remains as the audited correction path. The complete transition matrix — including the recommended reopen rule and alternatives — is PROPOSED in docs/decisions/proposals/2026-09-08-lead-status-transition-matrix.md and awaits ratification before any reopen behavior ships |
| `{ok, code}` everywhere?       | `route_lead` and `record_lead_contact` leaked SQL exceptions                    | FIXED — pre-checks + `unique_violation` handler; all error paths return envelopes (verified for every RPC)                                                                                                                                                                                                                                                                                      |

Additional verification: forced-failure apply rolls back atomically (zero
0147 artifacts, prior 0102 policies intact); clean apply from true 0146 state
succeeds in one transaction; `anon` has no EXECUTE on any lead RPC;
`lead_contact_events` is RLS-enabled and SELECT-only for `authenticated` with
an update/delete-blocking trigger; all expected indexes/constraints present.
`scripts/verify-0147-prepared.mjs` (in CI) now pins the new invariants.

**0147 stays in `supabase/launch/prepared/` — moving it into the ledger or
applying it to CQCX requires explicit activation approval (Gate S1).**

Rollback procedure for the eventual apply: the migration is a single
transaction, so a failed apply self-reverts (proven above). Post-apply
rollback is a reviewed down script: drop the six RPCs and the three helper
functions, drop `lead_contact_events`, drop the new lead
columns/constraints/indexes, restore the 0102 `leads_status_check`, and
re-create the 0102 `leads_staff_select`/`leads_staff_update` policies. The
two enum labels cannot be dropped in place but are inert once the helpers are
gone. Take a pre-apply `pg_dump --schema-only` snapshot for verification.

## 6. Public intake hardening (repo-prepared, commit `20d20c1`; redeploys gated)

| Requirement                                 | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reject missing Origin as well as unapproved | Done — `residence-intake` now 403s origin-less POSTs (`lead-intake` is server-to-server behind its shared secret; browser Origin is not its control)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Turnstile mandatory in production           | Done END-TO-END (2026-09-08 correction — the 2026-09-07 version required a token no form supplied): the receiver fails closed 503 when `TURNSTILE_SECRET` is unset (escape hatch `INTAKE_TURNSTILE_OPTIONAL=true`, never production), verifies the siteverify-attested **hostname** against the submitting Origin and the per-flow **action**; every surface posting to the receiver (both directory house forms, the EJWRH inline form, the publicIntake adapters) renders the widget and sends the token; ResidenceApplyPage and ListYourResidencePage carry the widget as a client-side gate — NOTE their write paths are authenticated PostgREST, not this receiver, so their tokens are not server-verified today (routing them through a verifying boundary is a separate decision). **Activation prerequisite: configure the site key (VITE_TURNSTILE_SITE_KEY / directory `TURNSTILE_SITE_KEY` / ejwrh env) together with the receiver's `TURNSTILE_SECRET`** |
| Generic public errors                       | Done — `{ok, code}` only; diagnostics to server logs (`console.error`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Residence IDs active + match path           | Done — application binds only to an existing, active `recoveryos.residences` row                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Reliable deferred work                      | Done — `EdgeRuntime.waitUntil` for the lead-intake alert email, with logged failures                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Resend data-flow decision                   | Alert email minimized to name + queue pointer (no free text, no message, no contact detail) until a data-flow decision is ratified — documented in-code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| EJWRH kind/residence ambiguity              | Reconciled — canonical kind `residence_application` (any residence, bound by validated `residence_id`); `grace_house_application` kept as the deployed legacy alias; the ejwrh page's header documents that the working public application path is the recoveryresidence.org directory form and the redeploy ordering (residence-intake before ejwrh)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**Ordering rule (unchanged): migration 0147 applies before the prepared
lead-intake version redeploys** — the receiver writes the new columns.
Rollback for a function redeploy: Supabase keeps prior function versions;
redeploy the previous version (`ezbr_sha256` values recorded in §7).

## 7. Supabase operational review (Class B, read-only, CQCX only)

Live state verified 2026-09-07 (matches the briefing exactly):

- Migration ledger tail: `20260831001422 / 0146_ejwrh_document_activation`;
  no 0147 entries.
- Seven ACTIVE Edge Functions: lead-intake v11 (`fd25fa73…`),
  grace-coaching-canary v11, create-meeting v11, grace v14, grace-judge v7,
  residence-intake v2 (`b8f15fe2…`), ejwrh v2 (`41ef42a6…`).
- `recoveryos.lead_contact_events`: absent. 0147 lead columns: absent. Intake
  enum labels: absent. Leads: 2, both `new`.
- The retired project `ykykeioydvtxpyreshhs` was not accessed.

Security advisors (5 findings):

- WARN `auth_leaked_password_protection` — disabled. **Recommendation:**
  enable (HaveIBeenPwned k-anonymity check). Auth impact: it applies at
  sign-up/password-change (and can require a reset for compromised
  credentials), so pilot participants with weak passwords may be prompted to
  choose new ones — communicate first. **Gated; not enabled this session.**
  Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- 4× INFO `rls_enabled_no_policy` (`public.housing_applications` — the
  deliberate 0138 containment; `recoveryos.funding_sources`, `locations`,
  `organization_relationships` — deny-all reference tables). Deny-all is the
  intended least-privilege posture; no change recommended. Remediation link:
  https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Performance advisors: triaged individually in §7.1 — no mass index creation or
removal, no mass RLS rewrites. Re-run both advisors after any authorized
database change and attach the before/after outputs.

### 7.1 Performance advisor triage (237 lints, 2026-09-07T22:16Z)

| Lint                           | Count / level            | Triage decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `multiple_permissive_policies` | 99 WARN across 30 tables | These are the deliberate self-access + staff-access policy pairs — the intended least-privilege model, evaluated as OR. NO mass RLS rewrite. Two targeted, individually-gated improvement candidates: (a) the ~14 tables whose policies bind to `public` (flagged for all five roles including `anon`) can be narrowed `to authenticated` one policy at a time — same semantics, fewer per-role evaluations; (b) `service_events` is the only table with THREE overlapping SELECT policies for `authenticated` (`provider_read`, `select_self`, `staff`) — first candidate if read latency is ever measured there. [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) |
| `unindexed_foreign_keys`       | 106 INFO                 | Expected at this stage: FKs are indexed where query paths exist; data volumes are tiny (2 leads). Do NOT mass-create 106 indexes. Notable: 0147 itself already covers `leads_assigned_to_person_id_fkey` (its `leads_assignee_status_created_idx` leads on that column) and adds the queue/contact-log indexes. `residence_application_intake`'s three flagged FKs (`converted_application_id`, `converted_person_id`, `reviewed_by_person_id`) are the next candidates once review/conversion traffic exists. `audit_log` has zero findings. [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)                                                                            |
| `unused_index`                 | 32 INFO                  | The database is weeks old with near-zero traffic — "unused" is not evidence of uselessness yet. Drop nothing; re-evaluate after the pilot generates real query volume. [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Full advisor output was captured this session; re-run
`get_advisors(security)` + `get_advisors(performance)` after any authorized
DB change and diff against this baseline.

## 8. Approval gates — all STOPPED, nothing live was changed

| Gate | Action awaiting explicit approval                                                                                                                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1   | Configure environment required-reviewers + branch protections (GitHub UI steps in §3)                                                                                                                                                                                |
| L2   | Merge PR #7 into `claude/resume-previous-session-hbt3xp`                                                                                                                                                                                                             |
| L3   | Update `main` via the deterministic unrelated-histories join (§2)                                                                                                                                                                                                    |
| L4   | Change the repository default branch to `main`                                                                                                                                                                                                                       |
| L5   | Branch protection rules on `main`; any branch archive/delete is separate                                                                                                                                                                                             |
| C1   | Any Cloudflare dashboard change (disable Git auto-builds if found, token re-scope, route/domain changes, legacy Worker cleanup)                                                                                                                                      |
| S1   | Promote 0147 from `supabase/launch/prepared/` into the ledger and apply to CQCX (prerequisite: ratify the lead-status transition matrix proposal — docs/decisions/proposals/2026-09-08-lead-status-transition-matrix.md; until then reopening is rejected by design) |
| S2   | Redeploy Edge Functions (order: 0147 apply → residence-intake → lead-intake → ejwrh; Turnstile configured first)                                                                                                                                                     |
| S3   | Enable leaked-password protection (after participant communication)                                                                                                                                                                                                  |
| S4   | Resend data-flow decision (whether full inquiry text/contact detail may transit Resend)                                                                                                                                                                              |
| D1   | Any DNS / vrcc.app cutover (no workflow performs one; unchanged)                                                                                                                                                                                                     |

Live deploys of the hardened stack additionally require dispatching the
manual workflows with typed confirmation against a CI-green SHA — the
workflows themselves now enforce that.

## 9. Session change log (all on the PR #7 branch)

| Commit    | Content                                                                     |
| --------- | --------------------------------------------------------------------------- |
| `0f8306f` | No-ff merge preserving the canonical-audit branch's 2 commits / 3 documents |
| `2a0647f` | CI-success-for-exact-SHA gate in both deploy workflows + guard enforcement  |
| `4529d4f` | 0147 design-review changes (partially superseded by `9b2e90f` — see §10)    |
| `20d20c1` | Public-intake hardening across the three Edge Functions                     |
| `9b2e90f` | 2026-09-08 corrective session (independent review findings — see §10)       |

CI: runs 148 (`fdea101`), 149 (`0f8306f`), 150 (`2a0647f`), 151 (`4529d4f`),
and 152 (`20d20c1`) all concluded `success`.

## 10. 2026-09-08 corrective session (independent review findings)

The independent review found that a green CI result did not resolve several
substantive matters. Status of each finding:

1. **Turnstile client integration** — CLOSED. The 2026-09-07 receiver required
   a token that no form supplied (deploying it would have broken every
   legitimate submission). All submitting surfaces now render the widget and
   send the token (§6); the two authenticated platform forms carry the widget
   with the server-verification limitation noted in §6.
2. **Server-side hostname/action validation** — CLOSED (§6).
3. **route_lead consistency + explicit unlink** — CLOSED, tested 8/8 on the
   isolated database (§5).
4. **Transition matrix before reopen** — OPEN BY DESIGN: the premature reopen
   encoding was removed; the prepared 0147 rejects reopening
   (`reopen_not_ratified`) until the matrix proposal is ratified (§5, Gate S1).
5. **Unsupported "2 business days" promises** — CLOSED. Grievance surfaces now
   carry the canonical Grievance Policy v1.0 timeline (24-hour acknowledgment,
   5-business-day written response); application-response deadline promises and
   the unratified "every two weeks" waitlist cadence were replaced with
   truthful non-deadline commitments across the platform pages, both directory
   copies, the EJWRH form, and the preserved prototype.
6. **Deno compile checks + receiver tests in CI** — CLOSED: `deno check` on
   all three intake entrypoints and 24 receiver-level tests
   (`supabase/functions/tests/`, dependency-free fakes) run in CI; the
   intake receivers were refactored into testable `handler.ts` modules with
   unchanged `Deno.serve` entrypoints.
7. **Join plan strengthening** — CLOSED as a plan (execution still Gate L3):
   docs/plans/main-join-plan-2026-09-08.md adds the backup ref, the committed
   file manifest (+ regeneration requirement), the mandatory exact-tree proof,
   and a locally rehearsed rollback (revert reproduces `main`'s tree hash).
8. **Report corrections** — this section and the corrected §5/§6/§8 rows.

Also in the corrective session: the directory source template
(`sites/recoveryresidence-directory`) now carries canonical CQCX values
directly and `scripts/sync-directory-site.mjs` verifies them (hard-failing on
any retired-project reference) instead of substituting retired markers.

Monitoring posture: per the 2026-09-08 instruction, the PR subscription and
hourly check-ins are STOPPED; nothing is deployed, merged, applied, or
changed live, and all §8 gates remain closed.
