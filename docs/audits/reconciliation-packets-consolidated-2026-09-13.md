# Reconciliation Packets — Consolidated Record (2026-09-13)

**Purpose:** one document gathering every reconciliation packet produced across the
GFA-ECO working sessions ("chats") and their branches, so the reconciliation history can
be read in one place: what each packet reconciled, what it decided or recorded, what it
left open, and which packet supersedes which.

**Method and scope (what was actually reviewed):**

- All 27 remote branches of `rcoiowa/GFA-ECO` were enumerated and swept for
  reconciliation-titled and reconciliation-bearing documents (`git ls-remote` +
  per-branch tree listing, 2026-09-13). Each session branch is the durable output of one
  working chat, so the branch sweep is the practical review of the chats' reconciliation
  work.
- Google Drive was searched (`title contains 'reconciliation'`, full-text
  `'reconciliation packet'`): **no reconciliation packets exist in Drive** — the only
  full-text hits were unrelated documents (a fundraising draft, a funding/compliance
  analysis).
- **Limitation (Class F — Unknown):** claude.ai chat transcripts and claude.ai Projects
  are not readable from this environment. Any reconciliation discussion that was never
  committed to a branch or saved to Drive is not represented here. The available
  evidence does not independently establish that no such material exists.

**Evidence discipline:** everything below is restated from the source packets
(Class D — reported/historical, as of each packet's own date) unless the packet itself
records live verification (which it carries at its own stated evidence level). **This
consolidation performed no live verification of Supabase, Cloudflare, DNS, or deployed
state.** For any operational decision, re-verify against live systems; the packets'
"current state" claims age quickly — several were superseded within days.

---

## 1. Master inventory

Twelve reconciliation packets, in chronological order. "On main" = present on the
canonical `main` line at `4959156` (PR #6 merge, 2026-08-21). Branch-only packets exist
solely on the named session branches.

| #  | Date       | Packet                                                       | Path                                                              | Provenance (session branch)                                                                                        | On main?                                             |
| -- | ---------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| 1  | 2026-08-04 | Decision and Reconciliation Register                         | `docs/discovery/decision-and-reconciliation-register.md`          | discovery session (Master Directive review)                                                                        | Yes                                                  |
| 2  | 2026-08-04 | Live Database Drift Reconciliation (YKY era)                 | `docs/migration/live-drift-reconciliation.md`                     | `claude/recoveryos-greenfield-build-8pns7n`                                                                        | Yes                                                  |
| 3  | 2026-08-09 | Grace Authority V1.0 Implementation Reconciliation           | `docs/product/grace-ai-authority-v1.0-reconciliation.md`          | Grace governance sessions (`grace-lock/apply-001` line)                                                            | Yes                                                  |
| 4  | 2026-08-11 | Public Intake Convergence Audit (drift register + plan)      | `docs/audits/public-intake-convergence-audit.md`                  | `claude/recoveryos-intake-audit-zouh7q`                                                                            | Yes                                                  |
| 5  | 2026-08-14 | EJWRH Intake Drift — Provenance, Writer Trace & Hardening    | `docs/migration/ejwrh-intake-drift-reconciliation.md`             | intake-audit line (+ `supabase/live-drift/cqcx/` captures)                                                         | Yes                                                  |
| 6  | 2026-08-14 | ICARE Authority v1.0 — Reconciliation & Deliverables         | `docs/product/recoveryos-icare-integration-authority-v1.0-reconciliation.md` | ICARE governance session                                                                                 | Yes                                                  |
| 7  | 2026-08-18 | RecoveryOS Canonical Reconciliation (audit)                  | `docs/audits/canonical-reconciliation-2026-08-18.md`              | `claude/recoveryos-canonical-reconciliation-a25g21`                                                                | Yes                                                  |
| 8  | 2026-08-18 | Consolidation Record — Gate 1 (+ PR #6 remediation addendum) | `docs/audits/consolidation-record-2026-08-18.md`                  | `claude/consolidation-canonical-line-2026-08-18` → PR #6                                                           | Yes                                                  |
| 9  | 2026-08-25 | EJWRH PSA v4.0 → v4.1 Reconciliation Record                  | `docs/agreements/ejwrh-psa-v4.1-reconciliation.md`                | `claude/recoveryos-canonical-audit-1pvcwr` (also on `resume-previous-session-hbt3xp`, `infrastructure-consolidation-2026-09-07`) | **No — branch-only**                                 |
| 10 | 2026-08-31 | Staging Pilot Reconciliation (+ same-day correction)         | `docs/operations/staging-pilot-reconciliation-2026-08-31.md`      | `claude/recoveryos-canonical-audit-1pvcwr` (also on the two branches above)                                        | **No — branch-only**                                 |
| 11 | 2026-08-31 | Canonical Multi-Repository State Reconciliation              | `docs/operations/recoveryos-canonical-state-2026-08-31.md`        | `claude/recoveryos-state-reconciliation-7ed7so` (this branch **only**)                                             | **No — branch-only**                                 |
| 12 | 2026-09-07/08 | Infrastructure Consolidation Session Report (PR #7)       | `docs/operations/infrastructure-consolidation-report-2026-09-07.md` | `claude/recoveryos-infrastructure-consolidation-2026-09-07`                                                      | **No — branch-only**                                 |

**Related records that support the packets but are not themselves reconciliation
packets:** `docs/migration/README.md` (the standing reconciliation/ETL strategy for
legacy data), ADR-0011 (source-build consolidation decision),
`supabase/live-drift/cqcx/README.md` + captured SQL (the EJWRH drift evidence),
`docs/discovery/unidentified-schema-drift-client.md`,
`docs/launch/service-readiness-scorecard.md`, and the three recovered YKY migrations
`supabase/migrations/0020–0022` (artifacts of packet #2).

---

## 2. Consolidated synthesis, packet by packet

### 2.1 Decision and Reconciliation Register — 2026-08-04 (#1)

Registered ten material conflicts (R-01…R-10) between the owner's Master Directive
(2026-08-04), verified repo/production state, and prior approved documents; none resolved
unilaterally — each assigned an owner decision at Gate A. Headlines:

- **R-01 HousingOps boundary — DECIDED 2026-08-04:** Recovery Residence becomes the
  separate housing platform (ADR-0013); in-repo housing-ops code frozen as donor
  material; migrations 0018–0019 held unapplied pending gate RR-5.
- **R-02 Privacy gate — treated as CLOSED:** no deploys enabling new participant writes;
  the packet's Privacy and Compliance Gate Register found board adoption, credential
  inventory, production-data governance, and sensitive-flow authority all UNVERIFIED
  (consent engine itself implemented, migration 0007 / ADR-0009).
- **R-04 Primary keys:** ADR-0004 bigint keys stand as the existing domain standard.
- **R-05 Master Spec:** `claude/RecoveryOS-Master-Spec.md` named as authority #2 was NOT
  FOUND — owner to supply or confirm supersession (still unresolved in any later packet).
- **R-07 Production regression of vrcc.app:** the pre-Aug-2 production build had no
  pushed source and was overwritten; accepted as lost REFERENCE ARTIFACT; features
  rebuilt canonically.

### 2.2 Live Database Drift Reconciliation — 2026-08-04 (#2)

First drift event: parallel sessions worked the same YKY Supabase project. Three live
migrations that existed only in the database were read back out of
`schema_migrations` and committed verbatim as `0020–0022` (renumbered to avoid
collisions). Parallel branch work was merged or cherry-picked (themes/ThemeSwitcher,
verified Support Now warmline numbers replacing a placeholder, staging deploy workflow);
duplicate implementations were deliberately not taken. Established the standing rule:
**one session owns the live database at a time; every applied migration is committed in
the same session; run `list_migrations` and compare before applying anything.**
Known overlaps left for later: duplicated phase storage (0014 history table vs 0022
current-phase column) and two application-intake paths (canonical vs legacy Grace House).

### 2.3 Grace Authority V1.0 Implementation Reconciliation — 2026-08-09 (#3)

Section-by-section reconciliation of the ratified Grace AI Authority v1.0 against the
certified Grace V1 implementation (edge function + policy 1.2.0, locked model, evaluation
runs). Classification across all sections: CONFORMING (with non-blocking REFINE notes);
identity/disclosure microcopy verbatim; boundaries (not therapist/clinical/legal/crisis
service), return-to-use no-shame doctrine, and validation-without-sycophancy all
evidence-backed by eval runs. Grace generative-provider activation remains **locked
OFF** — a governance invariant repeated by every later packet.

### 2.4 Public Intake Convergence Audit — 2026-08-11 (#4)

Pre-production convergence audit of the public intake surfaces (gracehouse4 external
site, RecoveryResidence directory, Grace House application flow, referral flow, listing
flow) against the new governance baseline **CQCX canonical / YKY retired**. Produced the
write map, domain registry, drift register (every YKY dependency), the proposed CQCX
intake model (migration 0122 + `residence-intake` edge function — **prepared, not
deployed**), and a gated deployment plan. This is the packet that designed the canonical
public-intake boundary later verified unapplied by packet #7 and hardened around by #5.

### 2.5 EJWRH Intake Drift Reconciliation — 2026-08-14 (#5)

Second drift event, now on canonical CQCX: two out-of-band migrations (2026-08-11)
created `public.housing_applications` (EJWRH online application intake) outside the
canonical `recoveryos` boundary. The packet captured both verbatim
(`supabase/live-drift/cqcx/`), traced the writer (anonymous PostgREST INSERT path;
exact deploying frontend UNKNOWN/blocked by tooling), verified 0 rows (no applicant PII
at rest), and identified latent over-privilege in default public-schema grants. A
**grants-only least-privilege hardening was applied live under authorization**
(`0123 … APPLIED`): anon reduced to INSERT-only, authenticated to none, the public
submit path preserved, verified by privilege introspection with no fixture data
created. Standing recommendation: converge EJWRH (and Grace House) intake onto
`recoveryos.residence_application_intake` (0122) under a separate gate.

### 2.6 ICARE Authority v1.0 Reconciliation — 2026-08-14 (#6)

ICARE Authority ratified as canonical: 9 requirements SOURCE-CONFIRMED, 2
GOVERNANCE-CORRECTED (ICARE is a workflow, not a clinical instrument; 47 is not a
clinical threshold), with implementation locks and CI guards. OPEN bindings isolated
(BARC-10 licensing, exact 47-item provenance, Hope Hub, Thrive Iowa crosswalk) —
explicitly non-gating and awaiting human decision/live verification. No artifact met the
removal rule.

### 2.7 RecoveryOS Canonical Reconciliation — 2026-08-18 (#7)

The comprehensive audit-only packet (no mutations): verified from Git + live Supabase +
Cloudflare that `main` was entirely YKY-era while all CQCX-era work formed **one linear
80-commit stack** whose tip (`claude/public-support-onboarding-85u07i`, `c1db2aa`) was
the most complete line, conflict-free against main. Produced the branch survival matrix
(merge the tip; tag and archive everything else; nothing needs cherry-picking), a
ten-item conflict register (CQCX-vs-YKY drift, `.mcp.json` legacy pointer, two migration
histories, three coexisting residence-intake models, duplicate ADR numbers, unknown
Worker modifications, stale onboarding docs), the human-service workflow status
matrices, the minimum-operational-release definition, and the repository-memory plan
(CLAUDE.md pointer pattern, CANONICAL-ARCHITECTURE / DATA-AUTHORITY / CURRENT-STATE /
RELEASE-GATES docs).

### 2.8 Consolidation Record — Gate 1, 2026-08-18 (#8)

**Executed packet #7's plan** (Git only): merged the stack tip into main with zero
conflicts (PR #6, merge `4959156` on 2026-08-21), created the 16-tag archive/evidence
freeze (tag push blocked by credentials — SHAs recorded as authoritative), fixed
`.mcp.json` to CQCX, bannered HANDOFF/STATE-OF-THE-SYSTEM as superseded, and classified
every remaining YKY/CQCX/Base44 identifier on the tree (CURRENT-guard vs HISTORICAL vs
DEFECT — the two `supabase/*README` stale-YKY defects left as follow-ups). Full
validation suite PASS (93/93 tests at the time). The PR #6 addendum verified and fixed
five review findings (staff-gate dead-end, booking ownership check via additive 0124,
removal of a residence-intake direct-UPDATE bypass on 0122, proposal-loss fix, and a
documented-not-fixed defect in the captured legacy notify-fanout function).

### 2.9 EJWRH PSA v4.0 → v4.1 Reconciliation Record — 2026-08-25 (#9, branch-only)

Agreement-level reconciliation of the leadership-supplied Professional Services
Agreement v4 (unsigned; not treated as executed authority) against ratified executive
decisions: authority model corrected (GFA = contracted recovery-program and technical
services provider; the housing Operator retains admission/discharge/residency
authority), internal contradictions on referral-agreement execution resolved, fee
schedule replaced with the ratified published rates plus an Operator fee-reduction
clause (a superseded named-resident clause was replaced with a no-names "existing prior
agreements" provision), the compensation model's revenue-percentage framing flagged and
reworked, legal-claim hygiene applied, and downstream document changes identified but
deliberately NOT applied (hashes frozen). Produced canonical v4.1 text
(`docs/agreements/ejwrh-psa-v4.1.md`).

### 2.10 Staging Pilot Reconciliation — 2026-08-31 (#10, branch-only)

Triggered by the executive notice that `recoveryos-staging` had been given to real
residents and coaches: reclassified that Worker as **ACTIVE PILOT / pre-production
containing real participant data — not disposable staging** (no reset/purge performed or
needed). Primary answer: pilot users already live on the canonical CQCX identity/data
layer, so moving to the production URL is a front-end URL transition only (one fresh
sign-in; no account or data migration). Carries an important same-day **CORRECTION**: 60
of 66 accounts are live-suite test fixtures; the real human cohort is **6 accounts**
(2 staff + 4 participants/coaches) — earlier "66 pilot users" phrasing overstated the
human population. One open confirmation for the Executive Director: any registration
attempted on staging before 2026-08-08 would have landed in the retired project (no
evidence found; closed if no user reports a vanished account).

### 2.11 Canonical Multi-Repository State Reconciliation — 2026-08-31 (#11, branch-only)

The widest-scope VERIFY→RECONCILE→REPORT packet (four repos, deployments, backends,
DNS/cutover state; explicit evidence-level labels; no mutations). Key findings as of its
date: the canonical product is the GFA-ECO platform at deployed commit `ec36922` on
Workers `recoveryos-staging` (pilot) and `gfa-eco-recovery-residence-os` (production
candidate) against CQCX; **the live application line had diverged from `main`** (main
recorded 61 commits behind and, per packet #12, the application line was re-rooted with
no shared git ancestor); the GitHub default branch was still a four-file setup branch (a
naming hazard); real users existed in TWO places — the 6-person canonical pilot cohort
on CQCX **and** a separate legacy cohort (~26 real-domain accounts) still signing in on
YKY via the old vrcc.app surface minutes before the cutover attempt; the vrcc.app
Cloudflare zone was PENDING (registrar delegation mismatch), so the new Worker binding
had no public effect — public state UNKNOWN from that environment, requiring one human
`dig NS` + browser check. Includes drift/contradiction register, unreconciled-value
inventory, blockers, and the smallest ordered next-action set.

### 2.12 Infrastructure Consolidation Session Report — 2026-09-07/08 (#12, branch-only)

Continuation under PR #7, using the Institutional Evidence Ledger classes: PR #7 head
fully validated (14 governance guards, 164/164 tests, actionlint); measured the lineage
problem precisely (main and the application line share no git ancestor; the
resume/audit branches carry small unique deltas; both live Workers run
application-line ancestors); merged the canonical-audit branch into the consolidation
branch `--no-ff`; closed a real deploy-control gap (workflows didn't verify CI success
for the exact dispatched ref); reviewed prepared migration 0147 and public-intake
hardening (repo-prepared, redeploys gated); Cloudflare and Supabase read-only audits;
**all live-mutation gates STOPPED** — nothing live changed; plus a 2026-09-08 corrective
session from independent review findings.

---

## 3. Supersession and authority chain

Reading order for "what is true now" (later supersedes earlier where they conflict;
recency alone does not create authority — each later packet cites its evidence):

1. Packets #1–#2 (2026-08-04) — YKY-era baseline; their standing **rules** survive (one
   session owns the live DB; drift is captured, not hidden; R-01/R-04 decisions stand).
2. Packets #3–#6 (2026-08-09→14) — CQCX-era governance reconciliations; Grace and ICARE
   authority reconciliations remain the current governance records for those domains.
3. Packet #7 (audit) → executed by packet #8 (Gate 1 / PR #6). Together they define the
   canonical line as of 2026-08-21 and supersede main's earlier self-description
   (HANDOFF / STATE-OF-THE-SYSTEM, bannered).
4. Packets #9–#11 (2026-08-25→31) — post-consolidation operational reality: the pilot
   reclassification and the multi-repo state report supersede packet #7/#8's picture of
   deployment and user state. Within #10, the same-day correction supersedes its own
   original cohort numbers; `docs/operations/vrcc-production-readiness-2026-08-31.md`
   (same branches) is named authoritative for readiness.
5. Packet #12 (2026-09-07/08) — the most recent reconciliation evidence in any branch;
   its lineage measurements supersede #11's branch arithmetic.

**Standing invariants asserted by every applicable packet:** CQCX
(`cqcxvwoukyhxyokfwnjm`) is the canonical Supabase project; YKY is legacy — running,
frozen for new intentional data, never a migration target from `supabase/migrations/`
(YKY history — never apply); Grace generative provider stays OFF; drift is captured
verbatim under `supabase/live-drift/`, never silently absorbed; live mutations happen
only behind explicit authorization gates.

---

## 4. Consolidated open-items register

Items left open by the packets and not shown as closed by any later packet **in the
material reviewed**. Status is "as recorded at source date" — re-verify live before
acting; some may have been resolved in sessions whose records are not in these branches.

| Item                                                                                                                 | Source (packet, date)  | Recorded status                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Branch-only packets #9–#12 (and companions: readiness review, PSA v4.1, state report, infra report) are not on `main` | this consolidation      | main's docs stop at 2026-08-21; later reconciliation evidence lives on three unmerged session branches |
| `main` vs live application line: no shared git ancestor; PR #7 proposed the consolidation graph                      | #11, #12                | Measured; consolidation prepared behind gates (PR #7)                   |
| GitHub default branch is a four-file setup branch, not the canonical line                                            | #11, #12                | Naming hazard; unchanged in reviewed evidence                           |
| Archive tags from Gate 1 exist only in a session clone (tag push 403); SHA manifest is authoritative                 | #8                      | Maintainer with tag-push rights to run `git push origin --tags`         |
| Legacy YKY cohort (~26 real-domain accounts) distinct from the CQCX pilot; vrcc.app public state needed human check  | #11                     | UNKNOWN publicly at source date; human `dig NS` + browser check asked   |
| Migration 0122 (canonical public intake boundary) + `residence-intake` function: prepared, unapplied/undeployed      | #4, #7, #8              | Awaiting its Type-D gate; EJWRH convergence onto 0122 still recommended |
| EJWRH intake remains on `public.housing_applications` (hardened 0123) outside the canonical boundary                 | #5                      | Transitional drift remediation; convergence gated                       |
| Exact deployer/frontend of the EJWRH drift migrations                                                                | #5                      | UNKNOWN (tooling-blocked)                                               |
| `supabase/README.md` + `supabase/functions/README.md` still declare YKY live                                          | #8                      | DEFECT, deferred to repository-memory batch                             |
| Duplicate ADR numbering (two 0013s, two 0014s) on main                                                                | #7, #8                  | Deferred follow-up                                                      |
| Repository-memory suite (CANONICAL-ARCHITECTURE, DATA-AUTHORITY, DOMAIN-REGISTRY, CURRENT-STATE, RELEASE-GATES)     | #7                      | Planned, not created in reviewed evidence                               |
| Phase-storage duplication (residency phase history table vs current-phase column) — single read path                 | #2                      | Open since 2026-08-04                                                   |
| R-05: `RecoveryOS-Master-Spec.md` named as authority but never found                                                  | #1                      | Owner to supply or confirm supersession                                 |
| Privacy gate evidence (board adoption, credential inventory, production-data governance, sensitive-flow authority)   | #1                      | UNVERIFIED at source date; gate treated as CLOSED                       |
| ICARE open bindings (BARC-10 licensing, 47-item provenance, Hope Hub, Thrive Iowa)                                    | #6                      | OPEN, explicitly non-gating                                             |
| Pre-2026-08-08 staging registration check (possible vanished accounts in retired project)                            | #10                     | Closed if no pilot user reports one                                     |
| Prepared migration 0147 + public-intake hardening redeploys                                                          | #12                     | Behind approval gates, STOPPED                                          |
| Notify-fanout defect documented in captured legacy code (do-not-deploy warning)                                       | #8 addendum             | Documented; any future canonical delivery function must fix the claim lifecycle |

---

## 5. Recommendation (not authorization)

The single highest-leverage follow-up this consolidation surfaces: the four most recent
reconciliation packets (#9–#12) — including the record that real participants are on the
pilot surface — live only on unmerged session branches. Whoever executes the PR #7
consolidation graph should carry these documents onto the canonical line so the
reconciliation record stays in one lineage. This document records that gap; landing it
is a gated decision for the owner, not something this consolidation performs.
