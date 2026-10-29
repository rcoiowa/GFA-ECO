# DR-02 Authorization Semantics — Repository Review (2026-10-29)

**Status: STATIC REVIEW — NO DISPOSITION, NO DEFECT DETERMINATIONS.**
DR-02 remains **open and contested**. Abstract, Unify, and Hybrid remain
unapproved possibilities. This review describes what the release source
*declares*; it does not establish what the live database enforces.

| | |
|---|---|
| **Authorization** | Executive Director (Thomas), 2026-10-29 — documentation and static analysis only. No production queries, protected-endpoint calls, synthetic accounts, role or policy changes, or configuration changes. |
| **Primary source revision** | `95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b`, the tip of `release/residence-ownership-20261024`. The served production assets reproduce from it byte for byte (Pass 1, F1.3). |
| **Method** | `git worktree --detach` at that revision. Read SQL migrations, Edge Functions, client packages and governance documents. Statically replayed `create policy`/`drop policy` statements in apply order. |
| **Prepared on** | Branch `claude/dr-02-authorization-semantics-review`, from `origin/main` at `3f710a3`. |
| **Evidence** | [`evidence/2026-10-29-dr-02-authz-review/`](evidence/2026-10-29-dr-02-authz-review/): `effective-policies-95b3e6c.json` (the replay output) and `policy_replay.py` (the script) |
| **Excluded** | The separately reported database observations (VRCC program record, 166 organization-wide role assignments, an unused program-scoping column) and the reported egress 403. They are Class D, attributed to another reviewing environment, and did **not** inform any conclusion here. They can be added later as a separately attributed evidence stream. |

All paths are relative to the repository root at `95b3e6c` unless noted.
Migration paths abbreviate `supabase/launch/migrations/` as `L/`.

## Labels

| Label | Meaning |
|---|---|
| **SRC** | Source-code fact at `95b3e6c`. What the code says, not what runs. |
| **DOC** | A documented design intention: an ADR, a decision record, or an in-code comment that states intent |
| **INF** | Architectural inference drawn from SRC and DOC |
| **RUN** | Requires runtime verification against the live database or a deployed build before it can be treated as fact |

---

## 0. Baseline caveat — which schema is "the release"?

| ID | Finding | Label |
|---|---|---|
| B1 | The canonical apply lineage at `95b3e6c` is `L/0000`–`L/0146` plus three timestamped Circle and intake migrations (`L/20261005*`). `supabase/launch/prepared/0147`–`0151` are each marked **"PREPARED ONLY. NOT APPLIED."** in their file headers. | SRC |
| B2 | **The release client depends on objects that exist only in prepared `0149`.** Six RPCs called from `packages/data-access` and the deployed bundle (`assign_lead`, `find_duplicate_leads`, `list_intake_assignees`, `record_lead_contact`, `route_lead`, `set_lead_status`) and one table (`lead_contact_events`) are defined only in `supabase/launch/prepared/0149_shared_intake_workflow.prepared.sql`. Each of the other 51 RPC names used in client source, and each of the other 47 tables queried in the deployed bundle, is defined in the apply lineage. | SRC |
| B3 | So at least one of these is true: (a) `0149` (and probably the `0147`/`0148` chain it builds on) was applied to CQCX outside the repository's apply lineage, or (b) the release's shared-intake workflow screens fail at runtime. The repository alone cannot tell which. The documented apply sequence is in `docs/operations/g11-operations-readiness-package-2026-09-15.md`. | INF → **RUN** |
| B4 | This review therefore analyses the apply lineage as the baseline. Where it matters, it notes how prepared `0147`–`0151` would change it. | — |

---

## 1. Role definitions

### 1.1 Vocabulary and scope columns

| ID | Finding | Reference | Label |
|---|---|---|---|
| R1 | `role_key` enum: `participant`, `resident`, `coach`, `navigator`, `residence_staff`, `residence_manager`, `program_manager`, `administrator`, `executive`, `system_administrator`. `program_coordinator` was added on 2026-10-05. Prepared `0149` would add `intake_coordinator` and `intake_worker`. | `L/0001_foundation.sql:7`; `L/20261005092358_circle_county_access_schedule.sql:3`; `prepared/0149…:57-58` | SRC |
| R2 | `role_assignments` carries three optional scope columns: `organization_id`, `program_id`, `residence_id`. The table comment says roles are "scoped assignments (org / program / residence)". | `L/0003_roles_participation.sql:1-17` | SRC + DOC |
| R3 | Programs seeded in the release: `vrcc` (Virtual Recovery Community Center) and `anchor` (ANCHOR), both under the Grace For Addictions organization. This is seed content, and it does **not** corroborate any reported live row. | `supabase/launch/seed/0200_seed_core_reference.sql:27-31` | SRC |

### 1.2 How assignments are created, and what scope they receive

| Path | Scope written | Reference | Label |
|---|---|---|---|
| Self-provisioning at sign-up (`participant`) | `organization_id = 1`; no program; no residence | `L/0117_access_governance.sql:281`; older forms at `L/0009:65`, `L/0103:47` | SRC |
| Staff invitation consumed at sign-up | `organization_id = coalesce(invite.organization_id, 1)`, plus `invite.residence_id`. **Invitations have no program field.** | `L/0117:296-297` | SRC |
| Residence self-provisioning (`residence_manager`) | Organization + residence | `L/0115:118`, `L/0117:390` | SRC |
| Application approval (`resident`) | Residence | `L/0115:277` | SRC |
| Admin grant RPC `grant_role_assignment` | Accepts `p_program_id` and stores it. Organization defaults to `1`. Residence scope is **required** only for `residence_staff`, `residence_manager` and `resident`; **no role requires program scope.** | `L/0117:403-455` | SRC |
| Admin UI call to that RPC | Always sends `p_organization_id: null` and `p_program_id: null`. Only residence is user-selectable. | `packages/data-access/src/repositories/admin.ts:89-101` | SRC |
| Client role model | Collapses assignments to a set of role keys; scope is discarded client-side | `packages/auth/src/AuthContext.tsx:92` | SRC |

**INF:** under the release source, every non-residence role created through a
supported path is organization-wide, with no program scope. That is a
predictable result of the code paths above. The reported live observation
("all active assignments organization-wide") is *consistent with* this source,
but this review does not verify it.

---

## 2. Authorization functions

### 2.1 Identity resolution

| ID | Finding | Reference | Label |
|---|---|---|---|
| F1 | `current_person_id()` maps `auth.uid()` to exactly one `people.id` through `people.auth_user_id`. It is `security definer`, `stable`, with a pinned `search_path`. | `L/0009:13-17` | SRC |
| F2 | One `people` row per human is a stated schema rule. Auth accounts, roles, enrollments and residencies all reference `person_id`. | `supabase/README.md` (schema rules §1); `L/0003` comment | DOC |

### 2.2 Permission predicates

| Function | Decides on | Scope consulted | Reference | Label |
|---|---|---|---|---|
| `has_role(role)` | Any unrevoked assignment of that role key | **None.** Organization, program and residence are all ignored. | `L/0009:19-27` | SRC |
| `is_platform_admin()` | `administrator` or `system_administrator` | None | `L/0113:14-17` | SRC |
| `is_admin_staff()` | Redefined as an alias of `is_platform_admin()`; marked deprecated | None | `L/0117:133` (the rationale is in the `L/0117` header, items 1–20) | SRC + DOC |
| `is_support_staff()` | coach, navigator, program_manager, administrator or system_administrator | None | `L/0026:15-20` | SRC |
| `is_coach_staff()` / `is_navigator_staff()` | coach (or navigator) or a platform admin | None | `L/0112:29-38` | SRC |
| `is_care_operations_staff()` | navigator, program_manager, or a platform admin | None | `L/0117:51-55` | SRC |
| `staff_residence_ids()` | The `residence_id`s of unrevoked `residence_staff` / `residence_manager` assignments | **Residence** | `L/0009:32-40` | SRC |
| `is_residence_manager_of(r)` | A `residence_manager` assignment for that specific residence | **Residence** | `L/0115:32-40` | SRC |
| `my_active_participant_ids()` / `my_navigation_participant_ids()` | The participants in the caller's *active* coaching or navigation relationships | **Relationship** | `L/0026`; `L/0112` | SRC |
| `recoveryos_circle_private.can_record(series)` | A role from a per-series list, **or** a confirmed `@graceforaddictions.org` email (closed CBH circles), **or** an explicit facilitator assignment | Organization, program and residence. Program is checked only to belong to the **same organization** as the series, not to a specific program. | `L/20261005092358…:31-55` | SRC |

### 2.3 Answer to the program-scope question

| Question | Answer | Label |
|---|---|---|
| Is program-level authorization represented in the release source? | **The data model represents it** (`role_assignments.program_id`; the grant RPC accepts it). **No RLS policy references `program_id`** (static replay, see the evidence file). The only predicate that reads it is Circle `can_record`, and there it only confirms the program's *organization*. | SRC |
| Is its use mandatory or optional? | **Optional, and unused on every supported write path.** No role requires it, staff invitations cannot carry it, and the admin UI always sends `null`. | SRC |
| Are organization-wide permissions intentional for particular roles? | **For platform administrators, yes, explicitly.** `L/0117` tightens nearly all broad access to `is_platform_admin()` by design. **For coach, navigator and program_manager**, the role is organization-wide, but most participant-data access is narrowed by *relationship* predicates (§3). The documented intention for the care-operations reach is stated in-code for housing intake (`L/0122:210-215`). **No document found at this revision states whether program-scoped roles were ever intended to be enforced.** The scope column's comment (`L/0003:1-3`) implies they were envisioned. | SRC + DOC; intent for program scope **unresolved** |

**INF:** in this source, the effective authorization axes are **role key,
residence, and relationship**. Program is a data attribute, not a permission
boundary. Whether that is deliberate (a small organization with one
organization-wide team) or incomplete is a governance question. The code does
not decide it.

---

## 3. RLS boundaries (apply lineage, static replay)

**Method and limitation.** `policy_replay.py` replays the 164 `create policy`
and 38 `drop policy` statements in `L/*.sql`, in filename order, leaving 131
effective policies. All 86 tables created in the lineage have RLS enabled.

The earlier G3 catalog-replay audit
(`docs/audits/2026-09-14-g3-database-authorization-audit.md`) reported **230**
policies across `recoveryos` and `public`. That gap is **unexplained** by this
static method. I cross-checked the policy names on the key tables below against
the raw text. A full catalog replay is still required before relying on this
map for completeness. **RUN.**

Base privileges: `authenticated` holds `SELECT, INSERT, UPDATE` on **all**
`recoveryos` tables (`L/0110_table_grants.sql:17`). RLS is the only row gate,
by design (ADR-0006).

**DELETE:**
- No `FOR DELETE` policy exists.
- 25 policies are `FOR ALL`, which would cover DELETE. Examples:
  `goals_self`, `person_profiles_self`, `contact_methods_self`,
  `fee_ledger_staff`, `meetings_staff`.
- No `GRANT … DELETE` to `authenticated` or `anon` appears in the lineage, so
  client deletes appear blocked at the privilege layer (SRC).
- Platform-level default privileges on the `recoveryos` schema are not visible in
  the repository (**RUN**).

### 3.1 Read boundaries by role (participant data)

| Data | Self | Coach | Navigator | Residence staff / manager | Program manager | Platform admin | Reference |
|---|---|---|---|---|---|---|---|
| `people` | own row | — | — | people with a residency or application at *their* residence | — | — | `L/0118:25`; `L/0014:256` |
| `person_profiles`, `contact_methods`, `goals`, `program_enrollments` | own | — | — | — | — | — | `L/0009` |
| `recovery_capital_assessments` (BARC-10) | own | — | — | — | — | — | `L/0009` |
| `check_ins` | own | — | — | **all columns of base rows** for *active* residents of their residence (see 3.3) | — | — | `L/0023:80-88` |
| `coaching_relationships` | involved | involved | — | — | — | all | `L/0009:183`; `L/0026:53` |
| `navigation_relationships`, `navigation_needs`, `navigation_referrals` | own / involved | — | active relationship | — | — | all | `L/0113:22-32` |
| `conversations` / `messages` | member | member | member | member | member | conversations: all; messages: member only | `L/0026`; `L/0109` |
| `appointments` | own | as provider | as provider | — | — | all | `L/0026` |
| `support_requests` | own | **open pool, all participants** + claimed | **open pool** + claimed | — | **open pool** | all | `L/0026:73` |
| `leads` (public inquiries) | — | **all** | **all** | — | **all** | all | `L/0102:35-39` |
| `residence_application_intake` | — | — | **all residences** | their residence | **all residences** | all | `L/0122:216-218` |
| `residence_applications`, `residencies`, `screenings`, `incidents`, `passes`, `fee_ledger` | own (where applicable) | — | — | their residence | — | — (grievances: admin) | `L/0009`; `L/0014`; `L/0115` |
| `grievances` | filed by self | — | — | **manager** of that residence only | — | all | `L/0115:485` |
| `service_events` | own | as provider | as provider | their residence | — | — | `L/0009`; `L/0015`; `L/0135` |
| `consent_grants` | own | — | — | residence-related consent types only (§4) | — | — | `L/0009`; `L/0140:31` |
| `audit_log` | — | — | — | — | — | all | `L/0117` |

"—" means no RLS policy grants that role read access; SECURITY DEFINER RPCs may
still return derived data (§3.2). All entries are **SRC**; enforcement on CQCX is
**RUN**.

### 3.2 Definer RPCs that bypass RLS (selected; each checks the caller itself)

| RPC | Internal gate | Label |
|---|---|---|
| `admin_list_people` | `is_platform_admin()` | SRC |
| `list_open_support_requests` | `is_support_staff()`, so organization-wide | SRC |
| `get_my_participants` / `get_my_navigation_participants` / `get_my_support_team` | active relationship to the caller | SRC |
| `residence_service_lenses(r)` | `r` in `staff_residence_ids()`, or platform admin | SRC |
| `admin_evidence_summary` | platform admin **or `executive`**; aggregate-only by stated design | SRC + DOC (`L/0117` header) |
| `review_residence_application_intake`, `convert_application_intake`, `find_person_for_intake_conversion` | staff of the residence **or** `is_care_operations_staff()` (or platform admin) | SRC |
| `grace` Edge Function | re-checks `ai_features` consent server-side | SRC (`supabase/functions/grace/index.ts:7-8, 138-146`) |

### 3.3 Check-in reflection privacy: documented intention and source differ

| ID | Finding | Label |
|---|---|---|
| C1 | **Intention:** "reflection text is participant-private"; staff see completion and ratings only, through `check_ins_staff_view`, which excludes `intention`, `reflection`, `carry_forward`, `prompt_response`. "Staff tooling must read the view." | DOC (`L/0023:7-9`; `docs/architecture/recovery-pulse.md` §Privacy; ADR-0014 decision 3) |
| C2 | **Source:** the view is `security_invoker`, so a base-table policy (`check_ins_staff_ratings`) admits residence staff to the underlying `check_ins` **rows**. `authenticated` also holds table-level `SELECT` on `check_ins` (`L/0110:17`), and no column-level revoke was found in the apply lineage or prepared `0147`–`0151`. A residence-staff account could therefore query `check_ins` directly, through PostgREST, and receive the free-text columns for active residents of its residence. | SRC |
| C3 | Privacy therefore depends on client discipline (reading the view), not on the database boundary that ADR-0006 names as authoritative. | INF |
| C4 | Whether CQCX has a column grant, view-only exposure, or another out-of-band control that closes this is unknown. It was **not** covered by the G3 findings (G3-F2 concerns write grants on the view). | **RUN**: a synthetic residence-staff account selecting `check_ins` columns directly. This needs separate authorization. |

This is recorded as a **documentation-versus-source discrepancy requiring runtime
verification**, not a confirmed exposure.

---

## 4. Consent boundaries

| ID | Finding | Reference | Label |
|---|---|---|---|
| K1 | Consent types are seeded per purpose: `terms_of_use`, `service_participation`, `coaching`, `resource_navigation`, `recovery_assessments`, `communications`, `ai_features`, `analytics`. Later additions: `residence_screening`, `information_disclosure`, `supervision_coordination`, `electronic_records`. | `seed/0200:122-131`; `L/0140:40-48`; `L/0145:42-46` | SRC |
| K2 | **Where consent gates access in the database:** (a) `supervision_coordination_records`, readable by residence staff only while the linked grant is `granted`, unrevoked and unexpired; (b) residence-staff reads of `consent_grants`, limited to the three residence consent types; (c) consent-dependent RPCs: `record_consent_disclosure`, `record_supervision_coordination`, `application_intake_readiness`, `record_referral_outcome`, `acknowledge_document`; (d) Grace AI, server-side in the Edge Function. | `L/0141:224-235`; `L/0140:31`; static scan of function bodies | SRC |
| K3 | **Where it does not:** coach and navigator access to participant data is gated by an *active relationship*, not by the `coaching` or `resource_navigation` consent types. No RLS predicate references those consent types. | static replay | SRC |
| K4 | Consent is documented as append-only, with revocation as "a first-class recorded event" and "nothing is updated or deleted". The source's `revoke_consent_grant` **updates** `revoked_at` on the existing row in place. History is preserved because the row persists, but the mechanism differs from the ADR text. | ADR-0009 vs. `L/0140:165` | DOC vs. SRC |
| K5 | Whether relationship-gated access *without* a consent check is intended, with consent captured at relationship formation or in the UI, is not stated in the documents reviewed. | **Unresolved**: governance question |

---

## 5. Experience separation versus backend authority

| ID | Finding | Reference | Label |
|---|---|---|---|
| E1 | Experience shells (`/vrcc`, `/residence`, `/staff`, `/coach`, `/navigator`, `/admin`, `/my-housing`) are lazy-loaded route subtrees of one app. Except for the intake queue, they are not wrapped in `RequireRole` at the router. | `apps/platform/src/App.tsx:95-163` | SRC |
| E2 | The intake queue route is role-gated to "exactly the set the RLS read policy grants": residence staff and manager, program manager, navigator, and admins | `App.tsx:165-187` | SRC + DOC |
| E3 | Frontend guards are navigation only; RLS is the boundary | ADR-0006; ADR-0010 | DOC |
| E4 | The documented architecture is one shared backend with separate experience shells. ADR-0001 is titled **"Hybrid architecture — shared foundation, separate experience shells."** ADR-0010 (one platform, route-separated shells) and ADR-0014 (one platform, domain-scoped front doors; "boundary discipline is kept in software, not infrastructure") build on it. | `docs/decisions/adr-0001`, `adr-0010`, `adr-0014` | DOC |
| E5 | The backend authority model matches E4 in shape: one identity spine, with experience boundaries implemented as residence and relationship predicates rather than separate data stores. | INF |

**Note for DR-02.** E4 is a *documented historical decision* using the word
"Hybrid". It is recorded here as evidence of prior intent. It is **not** a
disposition of DR-02, which remains contested.

---

## 6. Shared identity versus permission to see individual services

**Proposed acceptance principle under evaluation, not a finding:**
*"A person participating in multiple services should not automatically make
information from every service accessible to every staff member."*

| Cross-service path | Source behavior | Documented intent | Assessment |
|---|---|---|---|
| Coach → the participant's residence records | Not granted. Residence tables require `staff_residence_ids()`. | ADR-0006: "Residence compliance data is never readable by coaches merely because a participant is also a resident." | **Consistent** (SRC + DOC). RUN to confirm live. |
| Residence staff → coaching, navigation, BARC-10, goals | Not granted by RLS | ADR-0014: "coaching notes, BARC-10, and journals never render in residence-staff surfaces" | **Consistent**, **except** check-in free text (§3.3). |
| Residence staff → check-in reflection text | Possible through a direct base-table read (§3.3) | Participant-private | **Discrepancy**: RUN |
| Navigator / program manager → housing intake for **all** residences | Granted (`is_care_operations_staff()`) | In-code intent: care operations reads the intake queue (`L/0122:210-215`) | Intended in source. **Boundary question:** this includes residences that GFA does not operate (e.g. EJWRH). Whether that matches EJWRH–GFA agreements is a governance and records question. |
| Coach / navigator / program manager → **all** public inquiries (`leads`) | Granted (`is_support_staff()`) | Shared intake workflow docs (`docs/plans/intake-activation-plan-2026-09-01.md`) | Organization-wide by design for triage. Prepared `0149` would introduce intake-specific roles. Whether coaches need *all* inquiries is a governance question. |
| Coach / navigator → the open support-request pool (all participants) | Granted, for discovery and claiming | `L/0026` comment: "staff: open pool (discovery)" | Intended; organization-wide by design |
| Staff holding **two** roles (e.g. coach + residence_staff) | Union of both role reaches | Not addressed | **Unresolved**: no source mechanism separates the two hats |
| Platform admin → nearly everything | Granted | Explicit (`L/0117`) | Intended |

**INF:**
- Shared identity (one `people` row) does **not**, in this source, grant service
  visibility by itself.
- Visibility comes from role plus residence or relationship.
- The principle is largely reflected for coach↔residence separation.
- It is **not** reflected along three axes, which are left to role breadth:
  program-to-program (no program scope), cross-residence intake (care
  operations), and dual-role staff.
- Whether those are acceptable is the governance decision this review was asked
  to frame, not make.

---

## 7. Release source compared with documented requirements

| Requirement (source) | Release source | Status |
|---|---|---|
| RLS is the authorization boundary; frontend guards are navigation only (ADR-0006, ADR-0010) | RLS on all 86 lineage tables; broad table grants; guards cosmetic | Consistent (SRC). Live coverage: RUN. |
| Self-access for personal data (ADR-0006) | Self policies on profile, contacts, goals, BARC, check-ins and enrollments | Consistent |
| Scoped staff access through `staff_residence_ids()` (ADR-0006, ADR-0014 §3) | Residence tables gated by residence | Consistent |
| Relationship-based coach/navigator access (ADR-0006) | Active-relationship predicates and definer RPCs | Consistent |
| Coaches never see residence compliance data merely because the participant is a resident (ADR-0006) | No coach path to residence tables | Consistent |
| Coaching notes, BARC-10 and journals never in residence-staff surfaces (ADR-0014) | BARC and goals self-only; **check-in reflection reachable on the base table** | **Discrepancy (C2)**: RUN |
| Reflection text participant-private (recovery-pulse doc; `L/0023`) | View excludes free text; base table does not | **Discrepancy (C2)**: RUN |
| Roles are scoped assignments: org / program / residence (`L/0003` comment) | Residence scope enforced; organization scope stored but ignored by `has_role`; **program scope stored but never enforced** | **Partially implemented** (SRC); intent unresolved |
| Consent append-only; revocation is a recorded event (ADR-0009) | Revocation updates `revoked_at` in place | **Mechanism differs**; history preserved |
| Declining optional consent never gates unrelated services (ADR-0009) | Only Grace AI and residence-specific flows check consent | Consistent with the text |
| Staff invitations yield correctly scoped roles (`L/0117` header item 2) | Residence scope carried; program scope cannot be expressed | Consistent for residence; silent on program |
| Test-fixture accounts cannot satisfy privileged predicates (P0-INV, prepared `0147`) | **Not in the apply lineage** at this revision | **RUN**: depends on the B3 apply state |

---

## 8. Unresolved questions

**For governance (decisions, not tests):**
1. **Program scope.** Should any role be program-scoped (e.g. ANCHOR versus VRCC
   staff)? If yes, `has_role` and the relevant policies need a scope-aware form.
   If no, the unused column and the "scoped assignments" comment should be
   reconciled with that decision.
2. **Care-operations reach across residences**, especially residences that GFA
   does not operate (EJWRH). Is cross-residence intake visibility for navigators
   and program managers intended and covered by agreements?
3. **Organization-wide `leads` visibility** for every coach.
4. **Dual-role staff.** Is a union of reaches acceptable, or should an active
   "hat" or context constrain access?
5. **Consent as an access gate.** Should coaching and navigation access require
   an active `coaching` / `resource_navigation` grant, or is relationship
   formation the consent event?
6. **ADR-0009 wording versus the in-place `revoked_at` update.** Amend the ADR,
   or change the mechanism.
7. **CBH circle authorization by email domain** (`@graceforaddictions.org`). This
   is a deliberate 2026-10-05 decision (`docs/decisions/2026-10-05-circle-county-access-schedule.md`);
   note that it grants a capability without a role assignment.

**For runtime verification (needs separate authorization):**
1. **B3:** the CQCX migration ledger and whether `0147`–`0151` are applied.
2. A full catalog replay or live catalog diff, to reconcile the 131-versus-230
   policy count.
3. **C2:** a synthetic residence-staff direct `SELECT` on `check_ins` free-text
   columns.
4. A synthetic role-matrix negative test of the §3.1 table, including dual-role
   accounts.
5. Live `role_assignments` scope distribution. If the reported database findings
   become verifiable, they can be attached here as a separately attributed
   evidence stream.

## 9. Limitations

- Static analysis of one revision. Nothing here establishes live behavior; every
  SRC row is "as written in `95b3e6c`".
- The policy map is a text replay, not a catalog replay. It may miss dynamically
  created policies, policies outside `L/`, or policies in other schemas (see the
  §3 count gap).
- RPC review covered the authorization gates of selected functions, not every
  code path in all definer functions.
- Client analysis covered route guards and the role-grant path. It did not cover
  every query a screen issues.
- Documented intentions were taken from ADRs, decision records and in-code
  comments at `95b3e6c`. Other governance sources (Notion, Drive, board records)
  were not consulted.

## 10. Disposition

**DR-02: Open — contested.** The release source implements one shared identity
and authorization backbone. Experience boundaries are expressed through residence
and relationship predicates, which matches the documented "shared foundation,
separate experience shells" intent. Program-level separation is modeled but not
enforced, and at least one documented privacy boundary (check-in reflection text)
depends on client behavior in source.

These facts inform, but do not select among, Abstract, Unify, and Hybrid. No
architecture is approved, no defect is declared, and no change is authorized.
