# Canonical Completion Register, Gate Tree & Approval Packet — 2026-09-13

Controlling ledger for the RecoveryOS consolidation/completion program. Built on the
read-only baseline (`docs/audits/master-baseline-2026-09-13.md`, 2026-09-13T14:40:04Z) and
the consolidated reconciliation history
(`docs/audits/reconciliation-packets-consolidated-2026-09-13.md`).

Lifecycle vocabulary: proposed · ratified · prepared · committed · pushed · merged · applied ·
deployed · live-verified · superseded. Dispositions: verified complete · working-not-fully-
verified · incomplete · blocked · intentionally deferred · obsolete/superseded ·
unknown—evidence required.

**Nothing in this document authorizes a live change.** Every mutation sits behind its gate in
§3. This session performed none.

---

## 1. Canonical Completion Register

Columns: ID · Item · Lifecycle · Disposition · Evidence (E) / Next action (→) · Gate.

### A. Source & environment identity

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-A1 | Canonical repo/backend identity (GFA-ECO, CQCX) | live-verified | verified complete | E: baseline §2 | G0 ✓ |
| CCR-A2 | GitHub default branch is the 4-file setup branch | — | incomplete (hazard) | → set default to `main` after CCR-D3 lands | G10, packet E |
| CCR-A3 | Deployment provenance of both canonical Workers | live-verified | verified complete | E: run 73→`d7ab99d` (staging), run 2→`1542eaf` (candidate); bundles CQCX-only | G0 ✓ |
| CCR-A4 | `vrcc-app`/`virtualrecovery` Worker provenance (modified 2026-08-16) | deployed | unknown—evidence required | → identify actor/source before any retirement; likely answers vrcc.app | G10 |
| CCR-A5 | Archive tags from Gate 1 exist only in a dead session clone | prepared | blocked | E: SHA manifest in consolidation record §"Archive tag manifest" is authoritative → maintainer runs `git push origin --tags` after recreating from manifest | packet H |

### B. Security & isolation (planes 1–5)

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-B1 | **P0: fixture administrator + executive with linked logins on CQCX** | live-verified (finding) | **incomplete — release-blocking** | E: baseline §3.2 (counts only) → packet B: revoke/downgrade or prove world-gate on every privileged path with negative tests | G2 ✗ |
| CCR-B2 | Classification symmetry for support pool (0120/0120b) | applied | verified complete (scope: pool path) | E: ledger + migration text | G2 partial |
| CCR-B3 | World-gate proof across ALL privileged paths (R1 design P0) | proposed | incomplete | E: R1 design doc 2026-09-07 (PROPOSED) → implement + negative tests | G2 ✗ |
| CCR-B4 | **P0: public vrcc.app front door still writes retired YKY** | live-verified (finding) | **incomplete — release-blocking** | E: baseline §3.1 → packet A (cutover or interim disablement of legacy registration) | G5 ✗ |
| CCR-B5 | Public-intake Edge Function hardening (Turnstile fail-closed, Origin required, residence-id validation, generic errors) | committed (`20d20c1`, PR #7 branch) | prepared, **not deployed** | → apply 0147 first, then redeploy `residence-intake`/`lead-intake`/`ejwrh` in the recorded order | G5, packet D |
| CCR-B6 | EJWRH `public.housing_applications` least-privilege (0123) | applied | verified complete (transitional) | E: APPLIED file + 08-14 packet verification → converge onto 0122 boundary eventually | G5 partial |
| CCR-B7 | Analytics/SECURITY DEFINER exposure (0125/0126/0135/0137) | applied | working-not-fully-verified | E: fresh security advisors 2026-09-13 — no ERROR; 4 INFO deny-by-default rls_enabled_no_policy (incl. 0123-designed `housing_applications`) → negative-test suite still owed | G3 |
| CCR-B11 | Auth leaked-password protection disabled (advisor WARN) | — | incomplete (one-toggle, gated prod Auth config) | E: security advisors 2026-09-13 → packet B2 | G3 |
| CCR-B8 | Cross-tenant/participant isolation negative-test suite | — | incomplete | → build/run as part of G3 closure; none found in corpus as a distinct suite beyond RLS gate tests | G3 |
| CCR-B9 | Turnstile server verification on two authenticated platform forms | — | incomplete (recorded limitation) | E: CI run 155 commit record | G5 |
| CCR-B10 | Deploy workflows require green CI on exact release SHA | committed (run 150) | prepared (not on deployed line until PR #7 lands) | | G10 |

### C. Data & migrations

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-C1 | Repo launch line ↔ CQCX ledger reconciliation | live-verified | verified complete | E: ledger 0000–0146 + 4 captured drift entries = repo exactly; 0147 absent both sides of "applied" | G6 ✓ |
| CCR-C2 | Migration 0147 (shared intake workflow) | prepared (canonical variant) | blocked (by design) | E: prepared file + CI guard + isolated-DB apply/rollback evidence (run 151); duplicate-0147 conflict resolved by 2026-09-03 executive decision → apply only under packet D | G6→G7 |
| CCR-C3 | Superseded `contact-connect-intake-foundation` unique-element reconciliation queue | ratified (supersession) | incomplete | E: decision doc queue (team-members table, routing-rules table, column mapping, contact-events naming) | G1 |
| CCR-C4 | Lead reopening transition matrix | proposed | incomplete (awaiting ratification) | E: run 155 record names it OPEN; gate S1 prerequisite | G1, packet D prereq |
| CCR-C5 | YKY data archaeology / ETL | — | intentionally deferred (governance: no participant-data migration out of YKY) | E: standing directive | n/a |

### D. Repository lineage & release engineering

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-D1 | PR #7 state | pushed (head `825bb5c`), CI green run 156 on exact head | working-not-fully-verified → see D2 | E: baseline §4.1; fast-forward mergeable onto its base | G10, packet C |
| CCR-D2 | Independent local revalidation of `825bb5c` | — | in progress this session (worktree agent: ci.yml steps replayed) | result recorded in §4 addendum of this file | G10 |
| CCR-D3 | Land application line on `main` (consolidation graph) | proposed (infra report §2) | blocked (STOP: main update / PR #7 merge) | → packet C then E | G10 |
| CCR-D4 | Stale open PRs #1 (head contained in main) and #2 (archived worker) | superseded | incomplete (housekeeping) | → close both with supersession notes | packet G |
| CCR-D5 | 180-file prettier drift (pre-existing; CI has no format step) | — | intentionally deferred | E: run 146 analysis (strict subset, three fixed, zero introduced) | post-launch list |
| CCR-D6 | Duplicate ADR numbering (two 0013s, two 0014s) | — | incomplete (docs) | still present on all current lines | G12 |

### E. Product, workflows & experiences

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-E1 | Public application front doors for both houses (distinct, residence-bound, minimized data) | deployed (staging `d7ab99d`) | working-not-fully-verified | E: run 73 commit + live staging fetch → UAT + prod-candidate redeploy after PR #7 | G7/G8 |
| CCR-E2 | EJWRH document edition (PSA executed per ED attestation; 6 resident-facing templates v1.0, hash-pinned) | applied + live-verified (0146, synthetic E2E in rolled-back txn) | verified complete (as recorded 08-31) | E: run 71/deploy 1 records | G7 ✓ |
| CCR-E3 | Six-stage intake workflow (leads → triage → routing → contact log → close w/ classification) | prepared (0147 + receiver v3 + queue UI) | incomplete (gated apply) | E: runs 140–151 records | G7 |
| CCR-E4 | Phase-1 intake identities (3 accounts to create, 2 reuse; coordinator/worker grants) | ratified (2026-09-05/06 decisions) | blocked (STOP: production identities) | → packet D companion step | G2/G7 |
| CCR-E5 | Coach/navigator/residence/staff workspaces, service_events spine, follow_ups | deployed (candidate `1542eaf`) | working-not-fully-verified | E: capability matrix (08-31 packet §G) → role-by-role UAT | G8/G13 |
| CCR-E6 | Accessibility (WCAG 2.2 AA) evidence | — | unknown—evidence required | no audit found in corpus → run audit before launch | G8 ✗ |
| CCR-E7 | Discharge/transition UI | — | incomplete (fast-follow per 08-18 audit) | RPC exists; consumer unverified since | G7 |

### F. Grace / AI (G9)

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-F1 | Grace generative provider | ratified OFF, lock-guarded | verified complete (as governance) | E: `grace-model-lock.json` + CI verify | G9 ✓ |
| CCR-F2 | Grace naming: "Grace — AI Support Navigator" | ratified (2026-09-13, ED-owned record; supersedes the directive's "Supportive" wording per its own escape clause) | verified complete (decision); PR #8 merge still main-gated | E: baseline §5 | G1 ✓ / packet E |
| CCR-F3 | ICARE authority + locks (workflow, no BARC thresholds, 47 reference-only) | ratified + CI-guarded | verified complete (governance) | E: locks + guards green in run 156 | G9 ✓ |
| CCR-F4 | Grace adversarial/crisis-adjacent scenario evidence | — | REPORTED only (eval runs 001–003, pre-08-09) | → refresh before any provider activation (which remains OFF) | G9 partial |

### G. Operations & governance

| ID | Item | Lifecycle | Disposition | Evidence / Next action | Gate |
|---|---|---|---|---|---|
| CCR-G1 | Scheduled monitoring | — | blocked (STOP gate; never enabled) | → packet, post-launch scope decision | G11 |
| CCR-G2 | Backup/restore rehearsal, incident runbooks, alert ownership | — | unknown—evidence required | no restore-test evidence in corpus | G11 ✗ |
| CCR-G3 | Records-retention period for signed artifacts | — | incomplete (open records-policy item, run 71 record) | owner policy decision | G12 |
| CCR-G4 | Supersede stale docs (HANDOFF/STATE banners done; supabase/*README YKY defects) | partial | incomplete | defects recorded in consolidation record | G12 |
| CCR-G5 | Repository-memory suite (CANONICAL-ARCHITECTURE, DATA-AUTHORITY, CURRENT-STATE, RELEASE-GATES) | proposed (08-18 audit §G) | incomplete | CLAUDE.md pointer exists; suite does not | G12 |
| CCR-G6 | Externally visible facts (rosters, metrics, legal claims) ratification | — | blocked on owner | nothing published this session | G12 |

## 2. Decisions & supersessions verified this session

| Decision | Date | Authority | Status |
|---|---|---|---|
| Canonical-line 0147 governs; contact-connect variant superseded (preserved) | 2026-09-03 | Executive Director (recorded) | ratified; reconciliation queue open (CCR-C3) |
| Phase-1 intake identities & grants | 2026-09-05/06 | Executive (recorded) | ratified; execution gated (CCR-E4) |
| Six deadline/routing decisions (business-time targets; manual assignment v1) | 2026-09-05 | Executive (recorded) | ratified; encoded in prepared 0147 |
| Triage classification incl. 'other' (administrative, never clinical) | 2026-09-07 | Executive (recorded) | ratified; encoded + tested |
| EJWRH activation order (PSA attested executed; 0146 apply) | 2026-08-31 | Executive order (recorded) | executed + live-verified then |
| Grace naming "AI Support Navigator" | 2026-09-13 | claimed ratified (branch record) | **conflict with directive wording — packet F** |

## 3. Gate tree (current state)

| Gate | State | Basis |
|---|---|---|
| G0 source/environment identity | **CLOSED-PASS** | baseline §2, this session |
| G1 scope & decisions reconciled | OPEN (near) | register built; CCR-C3/C4, packet F outstanding |
| G2 production/test isolation | **OPEN — P0** | CCR-B1/B3 |
| G3 DB authorization & RLS | OPEN | advisors recheck + negative suite (CCR-B7/B8) |
| G4 consent/privacy/audit | OPEN (partial) | engine applied (0007/0139/0140/0145); revocation negative tests not re-run |
| G5 public ingress & function security | **OPEN — P0** | CCR-B4 (vrcc.app→YKY), B5 undeployed hardening, B9 |
| G6 migration integrity | **CLOSED-PASS (with 0147 gated)** | CCR-C1 |
| G7 canonical service workflows | OPEN | intake workflow gated on 0147; rest working-not-fully-verified |
| G8 role experiences & accessibility | OPEN | CCR-E5/E6 |
| G9 AI safety & human handoff | CLOSED-PASS as locked governance; naming item open | CCR-F1–F4 |
| G10 infra provenance & release controls | OPEN (near) | provenance mapped ✓; CI-gate control + default branch await PR #7/main |
| G11 observability, rollback, operations | OPEN | CCR-G1/G2 |
| G12 documentation/training/governance | OPEN | CCR-D6, G3–G6 |
| G13 end-to-end UAT & production readiness | OPEN | not started this cycle |
| G14 authorized launch & live verification | CLOSED (not authorized) | — |
| G15 stabilization & closeout | n/a | — |

## 4. Residual Blocker & Approval Packet (decision-ready)

Every item: nothing proceeds without the named authorization. Risks of acting/not acting are
stated once where they matter most.

**A. vrcc.app cutover (P0).** The public domain serves the legacy MVP bound to retired YKY
(live-verified today). *Required decision:* (1) re-point vrcc.app to the canonical Worker
(needs Cloudflare zone/registrar action — the 08-31 packet recorded a registrar-delegation
mismatch that must be fixed first: delegate to the zone-assigned nameservers), or (2) as
interim, disable public registration on the legacy surface. *Risk of not acting:* every new
public registration lands in the frozen backend and deepens the split cohort. *Rollback:*
DNS re-point back (minutes). *Verification:* fetch vrcc.app → canonical title + CQCX-only
bundle; new test-free confirmation that YKY auth stops growing. *Owner:* Executive Director +
whoever holds registrar access. *Smallest decision:* "Fix delegation and re-point vrcc.app:
yes/no; if no, disable legacy registration: yes/no."

**B. Fixture admin/executive on CQCX (P0).** Two sign-in-capable test_fixture identities hold
administrator/executive roles. *Required decision:* authorize revoking those two role
assignments (or downgrading to fixture-scoped roles) — exact statement prepared on request;
alternatively authorize the R1 production-actor-gate implementation as the fix. *Risk of
acting:* live E2E gate suites that depend on a fixture admin may need a scoped replacement.
*Risk of not acting:* an admin-plane path not yet world-gated exposes production data to test
credentials. *Verification:* re-run the aggregate query → zero fixture admin/exec; gate suite
still green. *Smallest decision:* "Revoke the two fixture admin/exec role assignments now:
yes/no."

**C. Merge PR #7.** Head `825bb5c`; CI green on exact head (run 156); fast-forward onto its
base; independent local revalidation recorded in §5. Merging is explicitly STOP-gated.
*Smallest decision:* "Merge PR #7 into its base branch: yes/no."

**D. Intake activation chain (Type-D).** Order already recorded: ratify the lead-reopening
transition matrix (CCR-C4) → apply 0147 → create the three ratified intake accounts + grants
(CCR-E4) → redeploy hardened `lead-intake`/`residence-intake`/`ejwrh` (`20d20c1` versions;
residence-intake before the ejwrh page) → live smoke per prepared checklist. Each step has
its own rollback recorded in the infra report. *Smallest decision:* "Ratify matrix and
authorize the chain: yes/no (or step-by-step)."

**E. Repository governance.** After C: merge the consolidated line to `main`; set `main` as
GitHub default; push archive tags from the authoritative manifest; close stale PRs #1/#2
with supersession notes. *Smallest decision:* "Authorize repo housekeeping batch: yes/no."

**B2. Enable Auth leaked-password protection on CQCX.** One dashboard toggle
(HaveIBeenPwned check); flagged WARN by the fresh 2026-09-13 security advisor pull. Gated as
a production Auth config change; no user-visible behavior change except rejecting compromised
passwords at signup/reset. *Smallest decision:* "Enable: yes/no."

**F. Grace naming — RESOLVED, no decision needed.** The 2026-09-13 ED-owned ratified record
("Grace — AI Support Navigator") supersedes the directive's "Supportive" wording under the
directive's own escape clause. Only speak up if that record misstates intent. PR #8 merge
rides packet E.

**G. Verification access.** Re-authorize the Supabase connector (claude.ai → Settings →
Connectors) so the remaining live proofs (fresh security advisors, anon grant sweep,
world-gate negative tests) can run; grant Cloudflare zone read if DNS verification from
session tooling is wanted. *Smallest decision:* "Re-authorize: yes/no."

**H. Records retention period** for signed resident artifacts (CCR-G3): owner policy
decision; no system change until ratified.

## 5. Addendum — independent local revalidation of `825bb5c` (CCR-D2)

_Recorded when the isolated-worktree replay of ci.yml completed; see final session report._
