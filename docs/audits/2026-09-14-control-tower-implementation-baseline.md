# Control Tower implementation environment — read-only baseline (2026-09-14)

**Baseline timestamp (UTC):** 2026-09-14T08:13:12Z
**Environment:** Claude Code remote implementation session (isolated container, fresh clone of `rcoiowa/GFA-ECO`)
**Working branch:** `claude/recoveryos-control-tower-implementation-2026-09-14` (created from `main` @ `4959156a507f6726cd9c2ddf3a1872358badbeb3`)
**Posture:** read-only re-verification first; all mutation/launch gates in the STOP/HOLD matrix remain **CLOSED**. Nothing in this session merged a PR, applied a migration, deployed anything, changed DNS/Cloudflare/Wix, or touched identities, roles, or data in any live system.

This baseline implements the "first session: read-only re-verification" step of the
Final Consolidated Synchronization Package (2026-09-14T07:43:56Z Control Tower
baseline). Branch separation is preserved as directed:

- **PR #7** (`claude/recoveryos-infrastructure-consolidation-2026-09-07`) — evidence/source workstream; not continued as the master implementation branch.
- **PR #8** (`codex/grace-ai-support-navigator-2026-09-13`) — Grace naming-only workstream; not used as the master branch.
- **This branch** — master reconciliation/implementation line.

## 1. Freshly verified in this environment (LIVE-VERIFIED here)

| Item | Finding | Evidence |
|---|---|---|
| `main` SHA | `4959156a507f6726cd9c2ddf3a1872358badbeb3` (PR #6 Gate-1 merge); `git pull --ff-only` reported already up to date | local git @ 2026-09-14T08:13:12Z |
| Repository default branch | still `claude/supabase-mcp-setup-ep29rp` (noncanonical hazard unchanged) | `git remote show origin` HEAD branch |
| PR #7 | OPEN / DRAFT / unmerged; head `825bb5c1ef80e3723725ff1a520208fff3188be7`; base `claude/resume-previous-session-hbt3xp` @ `5065180086c299fd006a5351c3af70943abd82ef`; 13 commits / 40 files / +2953 −462; mergeable_state clean; body retains its explicit STOP boundary | GitHub API read |
| CI run 156 | run ID `34174437146`, `push` event, exact head `825bb5c1…`, completed/success | GitHub Actions API read |
| PR #8 | OPEN / DRAFT / unmerged; head `f0be9dd4b1a116c99a7483f19a0dc56affcdd6c7`; base `main` @ `4959156a…`; naming/disclosure scope; "remain draft; do not merge or deploy" retained | GitHub API read |
| CI run 160 | run ID `34780798508`, `pull_request` event, exact head `f0be9dd4…`, completed/success | GitHub Actions API read |
| Migration lineage topology | `main` carries `supabase/launch/migrations/` only through **0124**; the 0125–0146 files (matching the CQCX applied ledger tail) exist on the PR #7 lineage (`claude/recoveryos-infrastructure-consolidation-2026-09-07` and its base). Prepared 0147 exists only on PR #7-family branches and `claude/contact-connect-intake-foundation` (as an applied-numbered file there — flagged for the intake write-map reconciliation). | `git ls-tree` across remote branches |
| P0 structural defect (repository-source corroboration) | On the 0146 lineage, `has_role`, `is_platform_admin`, `is_admin_staff`, `is_care_operations_staff`, `is_support_staff`, `is_coach_staff`, `is_navigator_staff` decide on roles only; `staff_residence_ids` and `is_residence_manager_of` read `role_assignments` directly; none consults `person_classification`. Reproduced behaviorally on an isolated Postgres 16 replay of launch 0001–0146 + seed: a `test_fixture`-classified login holding an administrator role assignment returned **true** for every privileged predicate. | replay evidence in `docs/decisions/2026-09-14-p0-classification-authorization-isolation.md` |

All of the above **matches** the 2026-09-14T07:43:56Z Control Tower record (LIVE-GH-001…005). No drift since that baseline was detected on the GitHub plane.

## 2. Not verifiable in this environment — carried forward, not re-verified

| System | Status here | Controlling evidence |
|---|---|---|
| CQCX (`cqcxvwoukyhxyokfwnjm`) live state | **UNKNOWN—EVIDENCE CARRIED FORWARD.** The Supabase MCP connector in this session requires authentication that cannot be completed non-interactively. No live CQCX query was run. Migration tail 0146, seven active Edge Functions, fixture-actor aggregates, and grants are carried forward from the 2026-09-14T07:43:56Z Control Tower read (LIVE-DB-001…008), the same UTC day. | Master Reconciliation Record §7 |
| Cloudflare account/Workers/DNS | **UNKNOWN—EVIDENCE REQUIRED** (connector requires authentication; unchanged from handoff). | Master Reconciliation Record plane 6 |
| Registrar state for `recoverycommunity.center` / `.app` | **UNKNOWN—EVIDENCE REQUIRED** (no registrar access here). | DOMAIN-002 |
| Wix live/DEV sites | Not re-inspected this session; carried forward (LIVE-WIX-001/002/003). | Master Reconciliation Record §13 |
| YKY (`ykykeioydvtxpyreshhs`) | **NOT ACCESSED** (frozen, out of scope — by rule). | ID-001 |

To restore live CQCX/Cloudflare verification capability in this environment, the
connectors must be authorized in claude.ai connector settings; until then every
CQCX claim in this workstream is repository-derived or carried forward and is
labeled as such.

## 3. Gate posture after this baseline

Unchanged from the handoff. G2 remains **FAIL / P0**; G15 remains **CLOSED / NOT AUTHORIZED**;
every STOP/HOLD row in the approval matrix remains CLOSED. This session's only
output is **prepared** work: the P0 remediation package (see
`docs/decisions/2026-09-14-p0-classification-authorization-isolation.md`), its
negative-test battery, rollback, and a CI guard — none of which applies anything
to a live system.

## 4. Register updates

- **SEC-P0-001** — advances from *blocked/inventory pending* to **PREPARED / awaiting apply authority**: affected-path inventory complete (repository-derived, replay-corroborated), invariant designed, prepared migration + rollback + 36-assertion negative battery authored and proven on the isolated replay.
- **GOV-002** — the CURRENT handoff records themselves are still not persisted to a repository documentation line (owner-gated); this baseline references them without copying them.
- New follow-up (proposed): **SEC-P0-002** — world-scoped staff access model to restore fixture-driven staff E2E (0120 symmetry) under classification isolation; requires separate design and ratification. Until then fixture-staff E2E is intentionally inoperative once 0148 applies.
