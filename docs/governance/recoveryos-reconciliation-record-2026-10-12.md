# RecoveryOS Living Reconciliation Record

- **Owner of record:** reconciliation lead (per Control Tower direction) · **Maintained by:** RecoveryOS Control Tower
- **Opened:** 2026-10-12 · **Evidence base commit:** `origin/main` @ `79172a47db0c851de4dde2df6b7cf249f6071172` (PR #34 merged)
- **Posture:** governance/reconciliation record only. **No production-change gate is opened by this document.** Prepared → separate-apply, Gate B (staging), and Gate C (publication) remain in force. Nothing here is a live-system audit or a deployment attestation.

## How to read this record

**Lifecycle status and verification evidence are orthogonal.** A `decided` item can be undeployed; an `implemented` item can be unverified. Never read a lifecycle label as proof the thing runs.

- **Lifecycle status** (what stage the item is at): `proposed` · `decided` · `implemented` · `deployed` · `superseded`.
- **Verification evidence** (how we know, and how current): `repo-verified` (a check performed against repository bytes at a named commit, in a Claude session — **not** a statement about any live system) · `live-verified` (checked against a running system, with a dated external source) · `unverified`.

Every claim below carries: **scope**, **lifecycle**, **verification** (label + date + method), **source path@commit** where available, **unresolved conflict**, and **next verification action**.

> **Session limitation (2026-10-12):** the Supabase connector is **unauthenticated in this Claude session**. This is a session-specific limitation; it does **not** establish that Supabase is unavailable elsewhere, nor that any environment is down. No claim in this record is `live-verified` by this session. Reported gate states and any prior "live" findings require a **dated source** before being treated as current.

> **Authorship note:** checks labelled `repo-verified` were performed by a Claude Code session via file reads/greps against the commit named in each row. They are evidence about the repository at that commit only.

---

## A. Preserved established architecture (carry-forward)

RecoveryOS is one platform with layered capabilities; the Control Tower governs and coordinates while operational work happens in the appropriate workspace. The drill-down principle holds: **Summary → Relationship → Authority → Evidence → Action.** "Full control" means finding the responsible system, understanding its state, delegating work, and performing authorized actions — with database/deployment changes running through controlled, audited, reversible backend procedures, never credentials exposed in a portal.

Carried-forward brand/surface distinctions (concepts kept separate — brand ≠ network ≠ organization ≠ tenant ≠ data boundary):
- **RecoveryOS** — shared infrastructure and operating platform.
- **RCO Iowa / public RCC experience** — public discovery and statewide connection.
- **Participant entrance** — personal support and services.
- **Residence experiences** — public housing information and authorized residence operations.
- **Control Tower** — governance, coordination, reporting, platform oversight.

---

## B. Claims ledger

> **Amended 2026-10-12** with live findings reported by the reconciliation lead (read-only; not independently verified by this Claude session). See **§E**. The amendments affect **B1, B3, B5, B6** and add **B11** (migration lineage) and **B12** (support-workflow tenant isolation). Where a §B line below is superseded by live evidence, §E names it.

### B1 — Canonical backend: CQCX; YKY retired
- **Scope:** data backend of record for RecoveryOS.
- **Lifecycle:** `decided` + `implemented` (CI guard enforces it in deployable source).
- **Verification:** `repo-verified` 2026-10-12 — grep/read of the guard and CLAUDE.md.
- **Source:** `scripts/check-no-retired-ref.mjs` (`CANONICAL_REF = cqcxvwoukyhxyokfwnjm`, `RETIRED_REF = ykykeioydvtxpyreshhs`); `CLAUDE.md` canonical-backend note — @ `79172a4`.
- **Unresolved conflict:** an external framing that `ykykeioydvtxpyreshhs` is current is **superseded**; do not carry it forward.
- **Next verification action:** confirm, against a dated source, which Supabase project the deployed application actually targets (requires connector auth / deploy evidence; session-limited).

### B2 — Control Tower
- **Scope:** governance/coordination surface.
- **Lifecycle:** `implemented` (prior architecture + read-only baseline work exists); **not** established as `deployed` or functioning.
- **Verification:** `repo-verified` 2026-10-12 — the baseline document exists and self-describes as a read-only baseline with all mutation/launch gates CLOSED ("nothing … deployed").
- **Source:** `docs/audits/2026-09-14-control-tower-implementation-baseline.md` @ `79172a4`.
- **Unresolved conflict:** documentation does **not** establish a functioning/deployed Control Tower. "Implemented" requires code evidence; "deployed" and "live-verified" require separate, dated evidence.
- **Next verification action:** identify the Control Tower code surface (components/routes) for an `implemented` code claim; obtain deploy + live evidence separately before any `deployed`/`live-verified` label.

### B3 — Participant entrance: recoverycommunity.app (vrcc.app reserved)
- **Scope:** participant-facing domain.
- **Lifecycle:** `decided` at planning level (recoverycommunity.app = participant entrance; vrcc.app reserved for future immersive experiences); **not** `implemented` in routing.
- **Verification:** `repo-verified` 2026-10-12 — README centers `vrcc.app` (ADR-0010; 3 refs); `recoverycommunity.app` appears **only in planning docs**, absent from code/config.
- **Source:** `README.md`; domain refs across `apps/`,`packages/`,`supabase/`; planning refs in `docs/architecture/domain-003-vrcc-dependency-register-2026-09-15.md`, `docs/content/dev-implementation-spec-2026-09-15.md` — @ `79172a4`.
- **Unresolved conflict:** README/code center `vrcc.app`; later decision designates `recoverycommunity.app`. Documentation-and-code vs decision gap — not proof of production routing either way.
- **Next verification action:** verify live DNS / Worker routing for both hosts (Cloudflare/deploy evidence; session-limited); then reconcile README/ADR-0010.

### B4 — RCO Iowa: brand/network/organization/tenant/data-boundary are distinct
- **Scope:** organizational + tenancy model.
- **Lifecycle:** `decided`/`implemented` as **back-office governance material**; a separate **tenant/data boundary** is `proposed`/unverified.
- **Verification:** `repo-verified` 2026-10-12 — PR #34 added `backoffice/rco-iowa/` (OPERATING-AGREEMENT, DOMAIN-CUTOVER, LAUNCH-BACKLOG, team.json) and `.github/agents/rco-iowa-*.agent.md`.
- **Source:** `backoffice/rco-iowa/*`, `.github/agents/rco-iowa-*.agent.md` @ `79172a4`.
- **Unresolved conflict:** RCO Iowa's presentation/back-office docs do **not** by themselves establish a separate legal operator or a data boundary. Brand ≠ network ≠ organization ≠ tenant ≠ data boundary.
- **Next verification action:** determine whether a separate legal operator and/or data boundary is defined (org records, `organization_relationships`, RLS tenant scoping) vs presentation-only; gate any tenant assertion on that.

### B5 — Multi-organization isolation is foundational
- **Scope:** platform authorization/tenancy.
- **Lifecycle:** `decided` (foundational requirement, even with gradual org onboarding); partial `implemented` substrate exists.
- **Verification:** `repo-verified` 2026-10-12 — RLS present platform-wide; P0 classification-authorization isolation prepared (0147); `current_person_id()` resolves to the caller's own person row.
- **Source:** `supabase/launch/migrations/0009_row_level_security.sql`; prepared `supabase/launch/prepared/0147_*`; `docs/decisions/2026-09-14-p0-classification-authorization-isolation.md` @ `79172a4`.
- **Unresolved conflict:** "organization administrator sees everything" is **not** established and should not be assumed; administrative authority ≠ blanket record access.
- **Next verification action:** define and test an explicit tenant/data-boundary model, including cross-organization **access-denial** tests; do not treat isolation as proven (see B6).

### B6 — document_assignments access control (corrected: not proven isolation)
- **Scope:** resident document assignment/acknowledgment surface.
- **Lifecycle:** `implemented` (RLS + definer RPC path).
- **Verification:** `repo-verified` 2026-10-12.
  - RLS **enabled** on `document_assignments`; policies are **SELECT self** (`document_assignments_select_self`, 0009) and **UPDATE-ack self** (`document_assignments_ack_self`, 0013); **no INSERT policy**.
  - `ensure_my_document_assignments()` is SECURITY DEFINER granted to `authenticated`; current live definition (0139) assigns the latest published version where `requires_signature OR requires_acknowledgment`, scoped to the caller via `current_person_id()` (`select id from people where auth_user_id = auth.uid()`, 0009) and the caller's own residency/approved application, joined `residence.organization_id = template.organization_id`.
  - The four Grace House docs are `requires_acknowledgment=true` (0139).
  - Immutability trigger `document_assignments_immutable` (0139).
- **Source:** `supabase/launch/migrations/0009`, `0013`, `0139` @ `79172a4`.
- **Unresolved conflict:** RLS-enabled + absent INSERT policy + use of a SECURITY DEFINER function do **not alone prove isolation**. Established so far: the ordinary **direct resident INSERT is blocked**, and this RPC path is person- and org-scoped. **Not yet examined:** service-role/table-owner paths (bypass RLS by design), `has_role()`-based policies elsewhere, and platform-wide read/write paths.
- **Next verification action:** examine the RPC's full authorization checks and every effective access path (service-role, owner, other definer functions, has_role policies, cross-org reads) before any "isolation proven" claim.

### B7 — Housing intake and peer-support connection are distinct workflows
- **Scope:** demonstration design + primary measure.
- **Lifecycle:** `implemented` (both workflows exist in schema).
- **Verification:** `repo-verified` 2026-10-12.
  - **Housing intake:** `residence_application_intake` / `residence_applications` / `residencies` — accountless housing intake + accountable follow-through.
  - **Peer-support connection:** `support_requests` (0025; status `submitted→open→claimed→assigned→contacted→scheduled→active→resolved→closed→cancelled`; `claimed_by_person_id`/`claimed_at`; claim/assign via definer RPCs per 0026) → `coaching_relationships` → `appointments`; `referrals` for handoff.
- **Source:** `supabase/launch/migrations/0025_coaching_domain_tables.sql`, `0026_coaching_domain_rls.sql`; residence tables in launch lineage; `supabase/launch/migrations/20261005093045_accountless_application_conversion.sql` @ `79172a4`.
- **Unresolved conflict:** an earlier summary (this assistant, prior turn) implied `residence-intake` could stand in for the peer-connection demonstration. **Corrected:** residence-intake demonstrates **housing** intake + follow-through, **not** a participant-authorized completed peer connection.
- **Next verification action:** build the peer-support completed-connection demonstration on the `support_requests → claim → coaching_relationship → appointment` chain. The primary measure (**participant-authorized completed peer connection**) rides that chain. **Housing → peer-support handoff must be an explicitly authorized, consent-bound handoff** (e.g., via `referrals`), never an implicit merge of the two workflows. A submitted form, assigned task, or attempted contact does not count as a completed connection.

### B8 — 42 CFR Part 2 "receive-only, with consent"
- **Scope:** data-sharing/compliance design.
- **Lifecycle:** `decided` as a **design requirement**; `proposed`/counsel-gated as a legal classification.
- **Verification:** `unverified` (legal) — design intent recorded; no legal determination made here.
- **Source:** design direction (this reconciliation thread); prior ROI/consent material under `docs/` (counsel-gated).
- **Unresolved conflict:** segmentation is a deliberate RecoveryOS safeguard, **not** presented as a universal legal mandate; Feb 16 2026 compliance date stands; recipient/redisclosure obligations depend on recipient status and disclosure basis; "non-clinical" does not self-determine obligations.
- **Next verification action:** counsel establishes applicable recipient obligations **before** the receive-with-consent capability is enabled.

### B9 — Market/integration claims (RDP, Unite Us; "nobody offers this")
- **Scope:** integrations + positioning.
- **Lifecycle:** `proposed` (candidates only).
- **Verification:** `unverified`.
- **Unresolved conflict:** "nobody offers this" is an unverified market claim; RDP and Unite Us are integration candidates, not confirmed integrations.
- **Next verification action:** obtain evidence of available interfaces, permitted data uses, partner terms, and operational value before promising any connection.

### B10 — Standing gates (prepared→apply, Gate B, Gate C)
- **Scope:** change-control.
- **Lifecycle:** `decided` (in force).
- **Verification:** carried-forward from prior records; **re-confirm with a dated source before treating any specific gate state as current.**
- **Unresolved conflict:** prior gate states are leads, not live facts, until dated.
- **Next verification action:** re-confirm each gate's current state with a dated source at the time of any action it governs.

---

## C. Implementation order (endorsed; read-only / prepared until each gate opens)

1. **Reconcile the actual baseline** — repository branches, deployed version, CQCX schema, domain routing, access policies, existing Control Tower work. (This record is the spine; live items await connector auth / dated sources.)
2. **Establish organization and authority boundaries** — distinguish platform operator, organization, network, program, residence, and individual assignment; define + test the tenant/data boundary (B4, B5, B6).
3. **Connect the portal to existing workflows** — shared navigation and work queues backed by canonical records.
4. **Prove the complete support-request journey** — accountless receipt → authorized ownership (claim) → recorded contact → completed connection → downstream scheduling/referrals, with **cross-organization access denial** demonstrated, on the peer-support chain (B7); housing via explicit authorized handoff.
5. **Expand integrations and back-office capabilities** — based on verified needs and supported interfaces (B9).

---

## D. Maintenance rule

Every new claim added here gets the full field set (scope, lifecycle, verification label + date + method, source path@commit, unresolved conflict, next verification action). When an item advances (e.g., `decided → implemented`, or `unverified → live-verified`), add a new dated verification line rather than overwriting the old one, and mark superseded claims `superseded` with a pointer. A confident summary — from any assistant or author — does not become authority until it is recorded here with evidence.

---

## E. Dated amendments — 2026-10-12 (live findings, reported by the reconciliation lead)

> **Evidence class for all of §E:** `live-verified (reported by reconciliation lead, 2026-10-12)` — a targeted read-only live inspection performed by the human lead and reported into this record. **Not independently verified by this Claude session** (the Supabase connector remains unauthenticated here). This is not a full isolation certification or a workflow acceptance test. Method as reported: GitHub read (CI #275 success on `fedae09`), Supabase live ledger read (CQCX = RecoveryOS-Launch, `ACTIVE_HEALTHY`), Cloudflare binding inspection, and read-only inspection of live function/policy/grant definitions (no user impersonation, no execution of `claim_support_request`).

### E1 — Migration lineage is live; 0147–0149 are applied, not merely prepared (amends B1; adds **B11**)
- **B11 scope:** CQCX migration lineage, live ledger.
- **Lifecycle:** `deployed` for the entries below.
- **Verification:** live-verified (reported, 2026-10-12). CQCX **RecoveryOS-Launch** reports `ACTIVE_HEALTHY`. Ledger-recorded application dates: **0147** (classification/authorization isolation) — Sep 17; **0148** (view/function exposure hardening) — Sep 17; **0149** (shared intake workflow) — Sep 17; **circle meeting logging** — Oct 5; **circle county/access/schedule** — Oct 5; **accountless application conversion** — Oct 5.
- **Supersedes:** any framing of **0147–0149 as "prepared only"** (including prior lines in this engagement). They are **applied**. Successful end-to-end behavior remains a separate question (not asserted here).
- **Unresolved conflict:** the DOC-INTEGRITY work and prior records referenced **numbered** `0150`/`0151` as the next prepared chain, and a numbered `0152` beyond them; the live ledger shows Sep-17 `0147–0149` then **Oct-5 timestamp-named** migrations and does **not** list numbered `0150`/`0151`/`0152`. The lineage convention appears to have shifted to timestamp names (e.g., `20261005093045_accountless_application_conversion`).
- **Next verification action:** map the prepared **numbered** chain (`0150`/`0151`/`0152`) against the **live ledger names** — determine whether each was applied under a timestamp name, superseded, or is still pending — before treating any numbered prepared artifact as the live next step.

### E2 — Participant domain is bound at Cloudflare (amends/supersedes B3 inference)
- **Lifecycle:** domain binding `deployed` (staging).
- **Verification:** live-verified (reported, 2026-10-12). Cloudflare bindings:

  | Domain | Binding |
  |---|---|
  | `recoverycommunity.app` | enabled custom domain on `recoveryos-staging` |
  | `recoverycommunity.center` | enabled custom domain on `recoveryos-staging` |
  | `vrcc.app`, `www.vrcc.app` | enabled custom domains on `recoveryos-staging` |
  | `rcoiowa.org`, `www.rcoiowa.org` | enabled custom domains on `rco-iowa-public` |
  | `recoveryresidence.org` / `.app` | no Worker bindings/routes or A/AAAA/CNAME in the inspected zones |

  Latest active deployments returned: `recoveryos-staging` Oct 6; `rco-iowa-public` Oct 7.
- **Supersedes:** the B3 **inference** that `recoverycommunity.app` is "not routed / not implemented in routing." It **is** bound at the Cloudflare layer. The underlying repo fact (B3 repo-verified: `recoverycommunity.app` absent from code/config at `79172a4`) remains true — routing is configured at Cloudflare, not in repo config.
- **Still unverified:** whether the bound domain **opens the intended participant experience** (HTTP/browser check). The web-retrieval tool could not load these sites; **that failure does not establish an outage.**
- **Next verification action:** HTTP/browser check of `recoverycommunity.app` (and `.center`) against the intended participant app; reconcile README/ADR-0010 (which still center `vrcc.app`) with the deployed bindings.

### E3 — Support-workflow tenant isolation: concrete live gaps (amends B5/B6; adds **B12**)
- **B12 scope:** organization/tenant isolation in the peer-support (coaching/navigation) workflow.
- **Lifecycle:** `decided` problem (substantive multi-org blocker); remediation `proposed`.
- **Verification:** live-verified (reported, 2026-10-12) — read-only inspection of live function definitions, policies, and grants. **Findings are authorization-*design* gaps, not evidence that any cross-organization record was accessed.**
  1. **Hardcoded organization:** `claim_support_request()` creates coaching and navigation relationships with `organization_id = 1`, although support requests carry their own organization field.
  2. **Role checks without org scope:** `has_role()` checks the caller's role, revocation, and test-fixture restriction, but does **not** constrain the role to the requested organization.
  3. **Broad support-request visibility:** the staff-pool `SELECT` policy lets qualifying support staff read open/submitted requests with **no organization predicate**.
  4. **Broad administrator visibility:** reviewed appointment and coaching-relationship policies permit reads via `is_admin_staff()` (administrator / system-administrator role checks).
  5. **Classification ≠ tenancy:** `same_world()` compares production-person classification, **not** organizations.
- **Protections that do exist (reported):** RLS enabled on the reviewed tables; residence staff access uses residence assignments; revoked roles excluded; the reviewed claim/document-assignment functions deny execution to `anon`.
- **Relationship to B6:** this supersedes B6's open "next action" for the support path — the examination has now been done at the live layer and found concrete gaps. B6's narrower conclusion (ordinary direct resident INSERT on `document_assignments` blocked; RPC path person/org-scoped via `current_person_id()`) stands; full platform isolation is **not** certified.
- **Next implementation priority (requires separate authorization + prepared→apply / Gate B / Gate C):** explicit **organization-scoped authorization** — replace the hardcoded `organization_id = 1`; constrain support-request visibility and claiming by organization; distinguish platform administration from participant-record access. Verification must demonstrate: permitted **same-organization** work; **denied cross-organization** access; **revoked-role** denial; and **explicitly authorized cross-organization handoffs**.

### E4 — Session-limitation note, updated
B-preamble still holds for **this Claude session** (Supabase unauthenticated here). §E items were live-verified by the **reconciliation lead**, not by this session; they are recorded with that attribution. All three connectors (GitHub, Supabase, Cloudflare) were reported working in the lead's environment on 2026-10-12 — confirming the earlier limitation was session-specific, not a platform outage.
