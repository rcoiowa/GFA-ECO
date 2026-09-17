# PR #7 change-by-change review — KEEP / EXTEND / REVISE / RETIRE (2026-09-14)

**Subject:** [PR #7](https://github.com/rcoiowa/GFA-ECO/pull/7) — head
`825bb5c1ef80e3723725ff1a520208fff3188be7`, base
`claude/resume-previous-session-hbt3xp` @ `5065180…`, 13 commits / 40 files
(+2953 −462), draft, CI #156 green on the exact head.
**Posture:** review only. This document proposes an **integration sequence,
not a merge**. PR #7's merge remains HOLD; its own body carries a STOP
boundary, and its base is not `main` (the main-join question is a separate,
still-STOPPED plan the PR itself documents).

Dispositions evaluate behavior and security value on their own merits (not
"already on the branch"), and account for the post-PR findings: the 0148/0149
authorization work, the fixture-classification interaction, ejwrh provenance
(F-EF1), receiver Origin/Turnstile posture (F-EF2), raw error leakage
(F-EF6), legacy create-meeting (F-EF4), and domain references (F-EF5).

## A. Release-control changes — KEEP

| Change | Disposition | Rationale |
|---|---|---|
| `ci.yml`: `verify-0147-prepared`, `verify-cloudflare-boundaries`, `deno check` on the three intake entrypoints, 24 receiver tests | **KEEP + EXTEND** | Real regression guards. EXTEND: when 0147 is revised for classification awareness (see D), `verify-0147-prepared.mjs` must pin the new invariants; our branch's `verify-0148/0149-prepared` guards should ride the same CI list at integration. |
| `deploy-staging.yml` / `deploy-production-candidate.yml`: manual-only, typed confirmation, exact `release_ref`, CI-success-for-exact-SHA required | **KEEP** | Directly closes the "deploy an unreviewed/mismatched SHA" hazard (G10). |
| `workers/api` quarantine (README, blocked deploy script, wrangler note) | **KEEP** | Removes a duplicate ingress prototype from the deployable surface (LEGACY-001 direction). |
| README/boundary doc corrections | **KEEP** | Documentation truth. |

## B. Public-receiver hardening — KEEP (this is the security core of the PR)

| Change | Disposition | Rationale |
|---|---|---|
| `residence-intake` handler refactor: **missing-Origin rejection** (main's version accepts origin-less posts — F-EF2), **fail-closed Turnstile** (misconfiguration = refuse, with explicit `INTAKE_TURNSTILE_OPTIONAL` opt-out), **siteverify hostname + per-flow action pinning**, active-residence validation, canonical `residence_application` kind + legacy alias, generic error envelopes (raw `error.message` now goes to logs only — fixes F-EF6) | **KEEP**, with one **EXTEND**: `INTAKE_TURNSTILE_OPTIONAL=true` is a standing fail-open switch — add a guard/alert (deploy-time check or startup log escalation) so it cannot silently persist in production once Turnstile secrets exist. | Verified against `main`'s weaker deployed-line source; each control maps to a ratified R1 requirement. Judged on behavior: strict Origin + attested-hostname/action binding is the right posture for a secret-less public browser door. |
| `lead-intake` handler refactor + tests: Wix idempotency key, self-selected `residence_interest`, `submitted_at`, generic errors | **KEEP** | Matches prepared-0147 columns; the PR's apply-order rule (0147 before receiver redeploy) stands. |
| `TurnstileWidget` + wiring into the four public pages; directory-site forms carrying tokens | **KEEP** | Closes "receiver demands a token no form supplied." Client-side-only caveat for the authenticated PostgREST pages is honestly documented in the PR. |
| Receiver test suite (`supabase/functions/tests/`, 24 tests + asserts) | **KEEP + EXTEND** | EXTEND with fixture-classification receiver cases when 0147 activates (test identities excluded from workflow). |

## C. `ejwrh` changes — KEEP, gated on provenance

Canonical-kind submission, Turnstile widget, and the honest routing note (the
inline form's origin is deliberately not allowlisted; the working public path
is the directory forms). **KEEP.** Two gates before any redeploy: (1)
**F-EF1 / SUPA-FN-001 is a priority blocker — live `ejwrh` v2 must be mapped
to an exact source SHA first**; something running in production while absent
from `main` is not authoritative merely because it is running. (2) The PR's
own ordering rule: `residence-intake` (accepting the canonical kind) deploys
before this page. The page's server-rendered hard binding to residence 2 is
acceptable server-authoritative binding for this surface.

## D. Prepared 0147 amendments — KEEP + mandatory REVISE before apply

The PR's design-review resolutions (schema-qualified enums, `route_lead`
link-consistency + audited unlink, reopen rejected pending the ratified
transition matrix, dormant `response_due_at`, one-thread unique index) are
**KEEP** — each is verified by `verify-0147-prepared.mjs` and the 8/8 isolated
battery. **REVISE (new, from the 0148 work):** `is_intake_coordinator()` /
`is_intake_worker()` read `role_assignments` directly and text-match
`administrator` — a `test_fixture` admin would satisfy them, reintroducing the
P0 bypass on the intake queue. Before activation: classification-guard both
helpers, extend `recoveryos.is_privileged_role()` with the two new role keys,
extend the verify script, and re-replay against 0001–0149. Details:
`docs/architecture/intake-write-map-2026-09-14.md` §3.

## E. Content-truth and workspace changes — KEEP

Grievance surfaces on the canonical Grievance Policy v1.0 timeline; unratified
response-time promises removed; `MyApplicationPage`/`IntakeQueuePage`/staff
pages aligned. **KEEP** — matches the organizational-truth standard.

## F. Documents — KEEP as records (with their own statuses)

Decision records, Phase-1 identity authority, relational-operations analysis,
R1 front-door design (**PROPOSED**, not implementation authority),
lead-status transition matrix (**PROPOSAL — needs ratification**; reopen stays
rejected until then), consolidation report, main-join plan + manifest
(**STOPPED**, Gate L3). KEEP all as evidence; none opens a gate.

## G. Flags carried on the diff

- `sites/gfa-vrcc-residence/…` and the receiver allowlist's `vrcc.app` /
  `gracehouse4.pages.dev` / workers.dev entries → DOMAIN-003 dispositions at
  domain-migration time; no `recoverycommunity.*` origin exists yet anywhere.
- Nothing in the 40 files earns **RETIRE**: the PR already quarantines its own
  retire candidate (`workers/api`). Retirements identified elsewhere (legacy
  v2 functions, `housing_applications`) are outside this diff.

## H. Proposed integration sequence (NOT a merge; every step separately gated)

1. **Provenance first (SUPA-FN-001):** map live function versions —
   `ejwrh` v2 especially — to exact source SHAs; requires an authenticated
   CQCX session. Blocks C and any receiver redeploy.
2. **Base/lineage decision (REPO-001/G10, owner decision):** PR #7 targets a
   non-`main` base and its lineage carries migrations 0125–0146 that `main`
   lacks; the committed main-join plan (backup ref, 173-path manifest,
   exact-tree proof, rehearsed rollback) is the governing vehicle and remains
   STOPPED. Nothing merges before this decision.
3. **Database order stands:** 0148 → read-back → fixture-role revocation →
   0149 (@ `2a1c2e5`) → read-back — independent of PR #7 and already
   authorized.
4. **0147-REVISED:** apply the §D revision on the PR lineage (or as a
   follow-up commit), re-replay 0001–0149 + revised 0147 with fixture
   negative tests, then seek the separate 0147 apply authority.
5. **Receiver redeploys (deployment gate):** after 0147 applies —
   `lead-intake` first (apply-order rule), then `residence-intake` with
   Turnstile secrets set and `INTAKE_TURNSTILE_OPTIONAL` unset, then `ejwrh`.
   Each deploy records source SHA → version (fixes the provenance debt
   forward).
6. **R1 topology ratification** before promoting any new public path; the
   transition-matrix proposal ratification re-enables reopen behavior.

## Register updates

- REPO-003: PR #7 reviewed change-by-change — dispositions above; no wholesale
  merge; blockers = provenance (step 1), lineage decision (step 2), 0147
  revision (step 4).
- SUPA-FN-001: elevated to **priority blocker** for anything touching live
  functions (per executive direction 2026-09-14).
- MIG-0147: disposition now *prepared + REVISE required (classification
  interaction)*.
