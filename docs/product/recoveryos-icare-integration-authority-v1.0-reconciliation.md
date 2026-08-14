# ICARE Authority v1.0 — Reconciliation & Deliverables

**Date:** 2026-08-14 · Companion to `recoveryos-icare-integration-authority-v1.0.md`. Records the
governance-canonicalization outcome (directive: ICARE governance canonicalization, source-binding,
memory hygiene, implementation-lock).

## A. Authority status

**RATIFIED / CANONICAL.** The ICARE definition is owner-specified (ADR-0015) and corroborated by the
legacy `gfa_icare` schema; every locked rule is either SOURCE-CONFIRMED against current code or
GOVERNANCE-CORRECTED with the correction applied. No locked rule depends on unverified research.
Research-only questions (BARC-10 licensing, exact 47 provenance, Hope Hub, Thrive Iowa) are isolated
as **OPEN bindings** and explicitly do not gate the Authority — they cannot control implementation
regardless. (Had any locked rule required unverified research to stand, this would instead be
"CANONICAL WITH OPEN RESEARCH BINDINGS"; it does not.)

## B. Source-binding matrix

See Authority **Appendix B**. Summary: 9 requirements SOURCE-CONFIRMED (incl. absences confirmed),
2 GOVERNANCE-CORRECTED (ICARE-is-a-workflow; 47-not-a-clinical-threshold), Thrive crosswalk
UNSUPPORTED (not in repo), Hope Hub + BARC licensing UNRESOLVED.

## C. Document disposition matrix

See Authority **Appendix A**. No artifact met the Class 5 (REMOVE) narrow rule.

## D. Memory plan

- **Added** `CLAUDE.md` (root, new — none existed): a compact **pointer** to the Authority plus the
  non-negotiable ICARE/BARC/Grace locks, and pointers to the related lock files. It does **not**
  contain a copy of the Authority.
- **No other AI/project memory** was written. Durable project/team memory, if used, should store
  only this compact pointer + locks — nowhere else.
- Confirmed: memory is pointer + compact locks only.

## E. Files created / moved / edited

**Created:** `docs/product/recoveryos-icare-integration-authority-v1.0.md` ·
`docs/product/recoveryos-icare-integration-authority-v1.0-reconciliation.md` (this file) ·
`docs/research/icare/README.md` · `docs/research/icare/archive/README.md` · `CLAUDE.md` ·
`icare-implementation-lock.json` · `scripts/icare-lock-verify.mjs` ·
`scripts/check-icare-governance.mjs`.
**Edited:** `docs/decisions/adr-0015-icare-workflow.md` (forward-pointer to Authority; history
preserved) · `packages/domain/src/instruments/barc10.ts` (documentary comment correction on the 47
benchmark; **no behavior change**) · `.github/workflows/ci.yml` (two ICARE CI steps).
**Moved:** none.

## F. Files proposed for removal

**None.** No byte-identical/useless duplicate was found. Where uncertain, the rule is
ARCHIVE — DO NOT DELETE.

## G. Locks (every protected rule)

Protected by the **Authority** (all §1–10 locked rules); mirrored in **AI orientation** (`CLAUDE.md`
compact locks); pinned in **`icare-implementation-lock.json`**; verified by
**`scripts/icare-lock-verify.mjs`** (STATIC lock↔APPROVED, lock↔Authority agreement, BARC code
shape); and enforced against regressions by **`scripts/check-icare-governance.mjs`** — both wired
into `ci.yml`. Concretely locked: ICARE = Identify→Connect→Assess→Respond→Empower; ICARE is not an
assessment-domain set; Grace cannot assign/infer ICARE stage; Grace cannot create silent staff
alerts; passive emotion/risk inference prohibited; BARC total 10–60; no BARC subdomain scoring; ≤35
crisis logic prohibited; 47 cannot trigger automation; service-event reporting authority preserved;
canonical authority path + version.

## H. Governance drift

- **RESOLVED (documentary):** `barc10.ts` previously described 47 as a "published BARC-10 threshold,"
  overstating its status vs the Authority ("research-informed reference only"). Comment corrected;
  no behavior changed.
- **No active-code violations found.** BARC-10 is total-only (no subdomains, no ≤35); Grace never
  assigns ICARE stage (`icarePhase` read-only, null), never alerts staff, never scores risk; no
  passive emotion inference exists; service events are completion-based. The canonical implementation
  **conforms** to the Authority; this phase ratifies and locks existing safe behavior.

## I. Open bindings (require human decision / live verification — do not fabricate)

1. **BARC-10 licensing/permission** to use the instrument — not evidenced in-repo.
2. **Exact 47 benchmark provenance & population** — cited as research-informed; source not verified.
3. **Hope Hub** operator/ownership, SSO (OAuth vs SAML), account binding, FERPA/COPPA — not in repo.
4. **Thrive Iowa** crosswalk & workflow responsibilities — program not referenced in repo.
5. **External partnership / funding / geographic-rollout** assertions — unverified.
6. Anything requiring **live runtime verification** (Supabase MCP unauthenticated; no Cloudflare
   access this session).

## J. Implementation readiness

**Safe to proceed (under a separate implementation gate)** once desired: building ICARE-aware
features that respect the locks — e.g. a human-governed ICARE stage field with explicit provenance;
participant-led emotional-awareness reflection prompts; BARC-10 total display/history; Connect-stage
slogan surfacing. Each must map to the five stages and pass the CI guards.
**Blocked / not authorized here:** ICARE UI stepper, new emotion tables, BARC redesign or
subdomain/threshold logic, automated triage, Hope Hub SSO, automated nudges, Grace context
enrichment that derives stage/risk, geographic rollout, production migrations, new participant-facing
workflows. Governance first; implementation under a separate gate.
