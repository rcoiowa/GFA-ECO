# INDEPENDENT REVIEW — Recovery Residence Operations Package (2026-09-20)

- **Review date:** 2026-09-21 · **Reviewer:** RecoveryOS (independent read-only pass) · **Package under review:** `operations-package-2026-09-20` (00–18)
- **Scope:** read-only. No RecoveryOS/Supabase/Cloudflare/Wix/GitHub/Workspace/DNS/identity/role/data change; nothing committed or published.
- **Verdict:** **READY WITH CORRECTIONS** — corrections from this review were applied to the uncommitted package on 2026-09-21 (see the end of this file and the exceptions summary in chat).

> **Evidence-provenance key (used throughout):**
> **[V]** independently verified during this review (2026-09-21, from repository or the package bytes);
> **[C/F]** carried forward from the 2026-09-20 work (prior-session live CQCX reads or earlier repo reads) — **not** re-verified today;
> **[R]** still requires live re-verification before any dependent operational or production action.

> **Addendum (2026-09-21, later same day — after this review):** the ED issued FINAL EXECUTIVE RATIFICATION. This **resolves** two items below: **PHONE-001** (finding 7 / §C.4) — 515-220-8771 ratified as the office/admin/**housing-intake**/referral number; 515-310-3425 is Warmline-only; and **NAME-001** (finding 8) — the GFA Founder & Executive Director is **Thomas DeGarmeaux**, and "Thomas Miller" is corrected at source. The findings below are preserved as the point-in-time review record; see files 10 and 15 for the ratified state and the gated downstream-propagation item (D28).

## A. Findings independently verified during this review — [V]
1. **Package integrity — PASS.** All 19 drafts (00–18) + 4 index files present; every content-file size and SHA-256 matches MANIFEST; the three index-file hashes match; no missing/duplicate/unlisted files; delivery copy byte-identical to the working tree. *(Recomputed 2026-09-21.)*
2. **`residence-intake` is the sole writer with server-side residence resolution.** `supabase/functions/residence-intake/handler.ts`: `residence_id` is required, resolved server-side, and rejected unless it is a real **active** canonical row (`is_active !== true` → reject); origin allowlist includes `recoveryresidence.org/.app`. *(Read 2026-09-21.)*
3. **EJWRH handbook absorbs the "missing" topics.** `docs/residences/ejwrh/resident-handbook.md` header + body confirm curfew (§1/§3), emergency response (§6), exit/transition (§9), good-neighbor & conduct (§4), employment expectation (§1–§2) — one acknowledgment by design. Corroborated by `participant-residency-agreement.md` (phase table; transition/exit-for-cause). *(Read 2026-09-21.)*
4. **PSA authority + execution-unknown status.** `docs/agreements/ejwrh-psa-v4.1.md`: Operator holds admission/fee authority (Art. 1/4/6); copy is "final for execution … NOT executed authority until signed." ED of record = Thomas DeGarmeaux. *(Read 2026-09-21.)*
5. **Grace House ROI is a draft, not active.** `docs/residence-documents/form_release_of_information.md` v2026.07, generated ("do not edit by hand"), 42 CFR Part 2 note, self-flags Iowa HHS 470-0025 → counsel. Not a CQCX edition. *(Read 2026-09-21.)*
6. **Privacy/secret scan — clean.** No secrets/keys/JWTs/service-role material; no participant identity; October-12 material de-identified; the only phone digits are the two governance numbers now confined to the PHONE-001 note. *(Scanned 2026-09-21.)*
7. **PHONE-001 (new finding).** Two numbers with **distinct roles** exist: office **515-220-8771** and Warmline **515-310-3425** ("515-310-DIAL", peer support, seeded `0202_seed_resources.sql`). `docs/discovery/wix-live-vs-dev-inventory-2026-09-15.md` shows the public "Contact phone" as **515-220-8771 (live) vs 515-310-3425 (dev)** — unreconciled. **No Thomas ratification of a canonical public/intake number found.** → DECISION REQUIRED. *(Read 2026-09-21.)*
8. **Incumbent-name discrepancy (new, minor).** `emergency_response_protocols` names ED "Thomas Miller"; PSA names "Thomas DeGarmeaux." Flagged for reconciliation (out of PHONE-001 scope). *(Read 2026-09-21.)*

## B. Claims carried forward from 2026-09-20 — [C/F] (not re-verified today)
These rest on prior-session live CQCX reads or earlier repo reads and are labeled **VERIFIED LIVE (2026-09-20)** in the package:
1. Residence identities — Grace House residence_id 1 (women); EJWRH residence_id 2 (men).
2. Capacities — EJWRH `capacity` null; Grace House `capacity` 12 (configured values, not physical counts).
3. Bed inventory — 0 rows for both (RecoveryOS data gap).
4. Directory state — `is_public_directory=false` for both.
5. Document editions — EJWRH 6 published v1.0 / 0 assignments; Grace House 14 residence + 6 org, mostly assigned.
6. Intake rows — all `test_fixture` (EJWRH 1 `ejwrh-portal`; Grace House 2 `gracehouse4`); writer proven, no real applicant proven.
7. Operator/provider data model — only GFA org exists; `organization_relationships` empty; EJWRH residence under org 1.
8. Fees — EJWRH per PSA Art. 4 + DB; Grace House DB fees with move-in fee unknown.

## C. Matters still requiring live re-verification — [R]
Do not rely on any of the following for an operational/production action without a fresh check:
1. **Re-read live CQCX** (residences, capacities, bed tables, `is_public_directory`, document editions/assignments, intake fixtures, `organization_relationships`) — the Supabase MCP is **not authenticated in this session**, so no live read was possible on 2026-09-21.
2. **PSA v4.1 execution status + Operator incumbent** — verify signatures and current authorized incumbent.
3. **Physical bed count / capacity / occupancy** — authorized operator/manager attestation, then reconcile into RecoveryOS.
4. **PHONE-001** — Thomas's ratification of the canonical public/intake number.
5. **Cloudflare bindings** (DNS/route/cert) for `recoveryresidence.org/.app` — REQUIRES ACCESS.
6. **Grace House move-in fee**, **staff training completion**, **role incumbents** (Latisha/Yvette, intake owners, House Manager, Data Administrator).

## D. Authority, operational, and Latisha-request findings (summary)
- **Authority:** layers kept separate (org position · employment status · residence authority · operator authority · GFA program/support authority · admission authority · delegated authority · system role · individual capability · named incumbent). No authority inferred from email account or title. No conflicts; open incumbents correctly marked UNKNOWN — AUTHORIZATION REQUIRED.
- **Operational coverage:** the 21 dimensions are defined per residence. Gaps (all disclosed in-package): **response standards undefined** (D21); **recordkeeping/retention partial** ("to define"); **orientation owner unconfirmed**; **accommodation exact process UNKNOWN**; **Grace House move-in fee unknown**; bed/capacity data gaps.
- **Latisha requests:** all 18 mapped, both residences. Classifications accurate after the 2026-09-21 corrections to items 1 and 15.

## E. Corrections applied to the uncommitted package on 2026-09-21 (this review's outcome)
1. Every **VERIFIED LIVE** claim re-labeled **VERIFIED LIVE (2026-09-20)** + a re-verification caveat added (files 00, 01, 08, 12).
2. File 17 item 1 re-tagged: EJWRH digital route = **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED**; EJWRH printable/paper = **MISSING**; Grace House = **AVAILABLE AND CURRENT**.
3. File 17 item 15 re-tagged **AVAILABLE — CONTROLLED DISTRIBUTION REQUIRED**, stating the authority framework exists but executed PSA status and named incumbent are unverified.
4. **PHONE-001** documented (file 10) — DECISION REQUIRED; no number selected; existing occurrences flagged; neither number inserted into additional templates.
5. This review added as `INDEPENDENT_REVIEW_2026-09-21.md`.

## F. Recommendations (no decision made on anyone's behalf)
- **Repository preservation:** recommended once authorized — commit to a clearly-labeled prepared-docs branch, PREPARED / not effective, so the SHA-256 manifest is auditable. Not done without explicit authorization.
- **Gate B:** do not authorize yet — depends on Cloudflare read access, `TURNSTILE_SECRET`, and clean routes; sequence it after the pilot decision set and technical access.
- **Gate status:** Gate B **UNAUTHORIZED**; Gate C **CLOSED**.

No policy approved; no decision made for Thomas, EJWRH, L.L.C., Grace House leadership, or counsel.
