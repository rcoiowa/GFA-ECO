# GFA–RecoveryOS Distinction Register — Audit v1.0

**Authorized:** 2026-10-28 (executive direction supplied in audit session)  
**Scope:** WS-01 Public Entry Points + WS-02 Identity & Relationships, linked investigations  
**Status:** ACTIVE AUDIT / PROPOSED DISPOSITIONS — NO IMPLEMENTATION AUTHORIZATION  
**Records:** 12; Preserve 5, Unify 3, Abstract 1, Investigate 3  
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
| DR-02 | Experience | RecoveryOS vs VRCC | Unify | Routes, role access, participant journeys | Product + Technical | Pending verification |
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

**Classification correction:** The authorized 12 row-by-row dispositions above total **5 Preserve, 3 Unify, 1 Abstract and 3 Investigate**; the previously supplied aggregate count (4/3/1/4) does not match the listed rows. Preserve the original aggregate as a source inconsistency rather than silently changing any individual row.

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