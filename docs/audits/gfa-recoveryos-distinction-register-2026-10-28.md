# GFA–RecoveryOS Distinction Register — Audit v1.0

**Authorized:** 2026-10-28 (executive direction supplied in audit session)  
**Scope:** WS-01 Public Entry Points + WS-02 Identity & Relationships, linked investigations  
**Status:** ACTIVE AUDIT / PROPOSED DISPOSITIONS — NO IMPLEMENTATION AUTHORIZATION  
**Records:** 12; 5 Preserve, 2 Unify, 1 Abstract, 3 Investigate, **1 unresolved disposition conflict** (DR-02). Counts describe active reconciled state, not prior source counts.  
**Repository:** rcoiowa/GFA-ECO  
**Decision authority:** Pending individual verification/approval; role labels below are proposed, not assignments.

## Governing rule

Preserve distinctions that protect people, clarify responsibility, or enable genuinely different services. Eliminate distinctions that merely reflect organizational history, technology choices, or development sequence. **No architectural distinction may be retired solely because it appears redundant in the UI.** Evaluate governance, operations, identity, data integrity, permissions, and dependencies first.

Three separate columns of truth must be maintained in every investigation: **observed current state**, **what evidence establishes**, and **recommended architecture**. Architectural documents, migrations and schema definitions do not establish live behavior. Do not combine an inquiry, application, enrollment or service completion into one event.

**Protected:** Grace House design stays preserved, implementation deferred; DEV rebuild remains baseline pending verification; parked domains remain inactive; no production routes, records, RLS policies, identity merges, domain changes or workflow migrations.

## Disposition definitions

- **Preserve:** necessary independent boundary.
- **Unify:** shared concept with contextual variations, retaining protective controls.
- **Abstract:** keep distinct internal authorization/process while simplifying the interface.
- **Retire:** only after verified redundant and formally approved; **no records currently assigned**.
- **Investigate:** insufficient evidence to decide.

## Register

| ID | Domain | Distinction | Proposed | Verification required | Proposed verification roles | Decision status |
|---|---|---|---|---|---|---|
| DR-01 | Governance | GFA vs RecoveryOS | Preserve | Legal ownership, branding, data stewardship | Executive + Technical | Pending verification |
| DR-02 | Experience | RecoveryOS vs VRCC | **CONFLICT: Abstract (v0.1) / Unify (Audit v1.0)** | Routes, role access, participant journeys, identity and visibility boundaries | Product + Technical | **UNRESOLVED — no approved disposition** |
| DR-03 | Functional | Grace vs Contact Connect | Preserve | AI boundary, human handoff, consent | Programs + Technical | Pending verification |
| DR-04 | Operational | Grace House vs EJWRH | Preserve | Policies, admissions, capacity, authorization | Housing + Quality | Pending verification |
| DR-05 | Consent | Housing inquiry vs application | Preserve | Forms, notices, workflow consequences | Housing + Quality | Pending verification |
| DR-06 | Lifecycle | Preapplication vs full application | Investigate | Stage transitions, reversibility, documents | Housing + Technical | Pending verification |
| DR-07 | Service | Live-Out vs residential | Preserve | Eligibility, service scope, reporting | Housing + Programs | Pending verification |
| DR-08 | Identity | Participant vs prospective resident | Unify | Person IDs, deduplication, relationships | Technical + Programs | Pending verification |
| DR-09 | Entry point | GFA website vs RecoveryOS public pages | Investigate | Route inventory, form destinations, content ownership | Digital + Technical | Pending verification |
| DR-10 | Infrastructure | Multiple domains and entrances | Investigate | DNS, redirects, deployments, owners | Technical | Pending verification |
| DR-11 | Authorization | Coach vs Navigator vs Residence UI | Abstract | RLS, actions, shared components | Operations + Technical | Pending verification |
| DR-12 | Taxonomy | Programs vs services vs resources | Unify | Definitions, database relationships, discovery | Programs + Quality | Pending verification |

**Historical source counts:** Audit v1.0 originally listed **5 Preserve, 3 Unify, 1 Abstract, 3 Investigate**; an earlier supplied aggregate read 4/3/1/4 and did not match its row detail. Baseline v0.1 lists DR-02 as **Abstract** instead of **Unify**, giving **5 Preserve, 2 Unify, 2 Abstract, 3 Investigate**. Reconciled counts exclude DR-02 from either disposition until resolved. No source's historical classification is overwritten.

For each record, add as verified: current-state observation + date, source link and authority class, human/governance/operational necessity, historical origin, dependencies, privacy and safety risks, test references (synthetic only), recommended target, named verification owner if assigned, explicit decision-maker and decision date, and implementation status. No proposed disposition is an approved implementation.

## WS-01 — Public Entry Points

**Inventory scope:** GFA Wix; Grace For Addictions organizational site; RecoveryOS public pages; recoverycommunity.center; recoverycommunity.app; VRCC; Grace; Contact Connect; Grace House/EJWRH public and application routes; Live-Out; parked domains.

| Entry | Actual URL/route | Public action verified | Authentication | Deployment and data destination | Owner | Status |
|---|---|---|---|---|---|---|
| New GFA Wix headless prototype | https://headless-qjmpklebwdh-recoveryos-140a.wix-site-host.com | Three pages published via Wix connector; live form completion NOT independently tested | Public pages; form auth behavior needs test | Wix Forms form ID `6d71b22b-67d6-40d0-841c-3c0d29e840e3`; no verified RecoveryOS connection | Unassigned | Partially verified |
| Official GFA site | https://www.graceforaddictions.org/ | Not verified in this audit | Unknown | Unknown | Unassigned | Investigate |
| RecoveryOS, VRCC and residence routes | Inventory pending | Not verified | Unknown | Unknown | Unassigned | Investigate |

**Next tests:** Record exact resolved URL, redirects, supported action, network/API destination, login requirement, observed success and failure, consent notice, human ownership, domain/deployment source, and date. Do not treat a link, static page or claimed action as completed service.

## WS-02 — Identity & Relationships

**Primary trace:** Contact Connect submission → lead → staff-verified person → residence application → program enrollment, including accountless applications and submissions assisted by helpers.

**Connector-verified environment (2026-10-28):** RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`) `ACTIVE_HEALTHY`; Grace For Addictions (`ykykeioydvtxpyreshhs`) `INACTIVE`; contact-connect-dashboard (`vlsxjkqyaexcxwkbovlq`) `INACTIVE`. Project availability is **not** proof of deployed application routing. Read-only `information_schema.columns` confirms the selected fields: `people.id/auth_user_id`; `leads.id/converted_person_id/linked_intake_id`; `residence_application_intake.id/residence_id/converted_person_id`; `residence_applications.person_id/residence_id`; `residencies.person_id/residence_id`; `program_enrollments.person_id`; `consent_grants.person_id`; `support_requests.person_id`. This confirms structure, not deduplication, RLS behavior, or end-to-end identity enforcement. Database availability does NOT prove any public/DEV route uses CQCX. Canonical backend reference in repository CLAUDE.md: `cqcxvwoukyhxyokfwnjm`, schema `recoveryos`.

**User-supplied initial schema evidence, not yet reverified:** `people`, `person_profiles`, `consent_grants`, `leads`, `support_requests`, `residence_application_intake`, `residence_applications`, `residencies`, `program_enrollments`, organizational relationship structures; `people.auth_user_id`, `leads.converted_person_id`, `leads.linked_intake_id`.

**Design evidence:** [P4F residence consolidation report](../product/p4f-recovery-residence-consolidation-report.md) discusses residence-specific authorization and same-person service contexts (dated 2026-08-08; historical). The 2026-09-25 housing pathway decision cited in executive audit input should be located and linked before claiming its exact text is repository-verified.

**Verification matrix:**
1. Anonymous Contact Connect submission creates lead/support request without implied verified identity.
2. Staff confirmation maps to existing person or creates one under authorization, with auditable provenance.
3. Email, phone, or application reference alone cannot auto-establish identity.
4. Helper data cannot become the applicant's identity.
5. Accountless residence inquiry/application remains possible under approved notices.
6. Residence approval and admission are separately authorized and residence-scoped.
7. VRCC and residence consents remain independent, revocable and purpose-limited.
8. Application, residency and program enrollment reference appropriate person relationships without duplicate service counts.
9. Reversible stages do not erase audit evidence or grant unauthorized access.
10. RLS denial cases validated with synthetic fixtures; no real participant data necessary for first pass.

**Method:** read-only metadata, code and migrations first; controlled synthetic test records only in approved isolated environment; aggregate duplicate/foreign-key checks; do not retrieve identifiable participant rows by default.

## Evidence log

| Evidence | Type | Establishes | Does not establish |
|---|---|---|---|
| [Repository orientation](../../CLAUDE.md) | Codebase governance pointer | Canonical project references and lock pointers | Deployed routes, fresh database state |
| [P4F report](../product/p4f-recovery-residence-consolidation-report.md) | Historical engineering report | Earlier residence architecture and scope boundaries | Current end-to-end behavior |
| [GFA authority protocol](../governance/gfa-project-knowledge-authority-protocol-v1.0.md) | Ratified governance | Evidence precedence and conflict process | Status of a given route |
| Executive-supplied Audit v1.0, Oct. 28 | Authorized audit direction | Scope, protections and proposed classifications | Runtime verification |

## Change control and next checkpoint

No runtime or data mutation is permitted by this audit authorization. Proposed recommendation → evidence review → named owner verification → decision authority approval → separately authorized implementation → tested deployment. **Next checkpoint:** complete the WS-01 inventory and WS-02 boundary mapping with concrete URLs, repository paths, read-only database metadata, synthetic test plan and unresolved conflicts.

## Baseline alignment — D-02 / DR-02 first reconciliation case

**Baseline source:** Executive-supplied *GFA–RecoveryOS Distinction Register, Working v0.1*, October 28, 2026, reproduced in the audit conversation. The independent linked Claude artifact has **not** been fetched or authenticated, so this comparison is to the supplied text, not a verified external artifact version.

**Active audit source:** this committed GitHub Audit v1.0 register, fetched and compared against the supplied baseline.

**Stable IDs:** `DR-01` through `DR-12` are canonical tracker IDs; `D-01` through `D-12` are immutable aliases to their number-matched records. Aliases preserve source provenance, not duplicate entities.

| Canonical ID | Baseline alias | Baseline proposal | Audit v1.0 proposal | Reconciled disposition status |
|---|---|---|---|---|
| DR-01 | D-01 | Preserve | Preserve | Proposed — agreement |
| DR-02 | D-02 | **Abstract** | **Unify** | **UNRESOLVED — competing proposals** |
| DR-03 | D-03 | Preserve | Preserve | Proposed — agreement |
| DR-04 | D-04 | Preserve | Preserve | Proposed — agreement |
| DR-05 | D-05 | Preserve | Preserve | Proposed — agreement |
| DR-06 | D-06 | Investigate | Investigate | Proposed — agreement |
| DR-07 | D-07 | Preserve | Preserve | Proposed — agreement |
| DR-08 | D-08 | Unify | Unify | Proposed — agreement |
| DR-09 | D-09 | Investigate | Investigate | Proposed — agreement |
| DR-10 | D-10 | Investigate | Investigate | Proposed — agreement |
| DR-11 | D-11 | Abstract | Abstract | Proposed — agreement |
| DR-12 | D-12 | Unify | Unify | Proposed — agreement |

**D-02/DR-02 comparison:** Baseline v0.1 describes *RecoveryOS / VRCC* as “Platform versus participant experience,” proposing **Abstract**. Audit v1.0 proposes **Unify**, describing one shared concept with contextual variation. These are not equivalent: Abstract could preserve a separately governed experience contract beneath a unified navigation surface; Unify could consolidate experience constructs. Neither establishes the deployed role, session, identity, or data boundary. **Decision: hold both proposals.** Determine actual routes, account requirements, role access, participant journey, identity binding, consent, data destinations, and deployment wiring before recommending a choice. A hybrid may emerge, but is not approved.

### Governing gate and acceptance criteria

1. Verify actual current state using named GitHub paths, deployed route evidence, Supabase metadata and read-only operational validation.
2. Preserve necessary legal/organizational separation of GFA and RecoveryOS; do not merge participant identity with service records or Contact Connect inquiries with residence applications.
3. Preserve Grace House/EJWRH staff and admission authority, Live-Out/residential boundaries, and Grace AI's non-decision role.
4. Ensure each register item distinguishes observation, evidence-backed finding, recommendation, explicit approval (approver/date), and implementation.
5. Before a change: document dependencies, denial/consent tests, functional participant journey acceptance tests, rollback plan, and **separate implementation authorization**.
6. Until that gate is met, no route, domain, identity, RLS, workflow or production deployment change.

**North Star:** One coherent experience. Distinct responsibilities. Connected services. No unnecessary complexity.

“Connection Prevents Crisis” guides the experience as organizational doctrine and a testable hypothesis, not proof of causal prevention.

**Initial reconciliation disposition:** 11 aligned proposed classifications; one unresolved conflict (DR-02). No disposition approved, no implementation authorized.

## DR-02 evidence checkpoint — 2026-10-28 (read-only; no disposition)

**Documentary evidence (repository inspected):**
- [Route registry](../architecture/route-registry.md) lists a shared `apps/platform` deployment and public, participant, resident and future staff route subtrees. The route registry retains some historical `/app` wording; it is **not** proof of what a user currently reaches.
- [Recoverycommunity domain map](../architecture/recoverycommunity-domain-map-2026-09-24.md) specifies `recoverycommunity.center` as public wayfinding, `recoverycommunity.app` as guarded `/vrcc/today`, and `vrcc.app` as a separate legacy entrance pending a distinct cutover. The domain map explicitly says Cloudflare bindings and runtime version require live verification.
- [Application source](../../apps/platform/src/App.tsx) contains host-specific mapping for the two `recoverycommunity.*` addresses. Code presence is not proof of deployment.
- [Historical HANDOFF](../HANDOFF.md) explicitly marks prelaunch YKY instructions superseded; do not treat its old production claims as current.

**Read-only CQCX metadata evidence:** `pg_policies` confirms named SELECT/INSERT/UPDATE policies for `people`, `person_profiles`, `consent_grants`, `leads`, `support_requests`, `residence_application_intake`, `residence_applications`, `residencies`, and `program_enrollments`. This establishes policy definitions exist, **not** that role boundaries hold under tested identities. No participant rows were queried.

| Gate | What is established | Outstanding runtime verification |
|---|---|---|
| Routes / deployments | One canonical platform with host-specific mappings in source; legacy VRCC references exist | Live DNS/Cloudflare bindings, current deployed build and actual root redirects |
| Authentication / identity | Canonical CQCX person and relationship schema documented and previously inspected | Same auth instance and person ID across sign-in, VRCC, residence, accountless applicant conversion |
| Authorization | Named policies and separate role-related route trees exist | Synthetic role/tenant-denial tests against deployed build and RLS |
| Consent / data | Consent and service-relationship structures exist | Actual browser-to-API tracing, privacy notices, consent grants and data destination on each entrance |
| Architecture | Shared frontend source plus intentionally distinct public and participant experiences | Whether legacy `vrcc.app` still runs separately and whether any user journey fragments identity |

**Disposition remains contested:** baseline **Abstract** versus Audit v1.0 **Unify**. A **Hybrid** option is worth testing because a shared backend and differentiated experiences can coexist, but it is **not** selected or approved. No evidence in this checkpoint authorizes cutover, domain assignment, identity merge, schema change or production deployment.
