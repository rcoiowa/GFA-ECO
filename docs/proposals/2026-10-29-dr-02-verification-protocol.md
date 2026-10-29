# DR-02 — Reflection Privacy and Migration-State Verification Protocol

**Status: PROPOSED — NOT RATIFIED, NOT EXECUTED.**
This is a documentation-only draft.
- **Not authorized:** executing any stage, connecting to any database, authenticating a connector, running tests, deploying, or modifying anything in production.
- **SQL status:** every SQL block below is **unexecuted and unvalidated**. Its first execution must happen in the stage's own approved environment.
- **DR-02 remains Open — Contested.** This protocol establishes what can be verified safely. It does not prejudge Abstract, Unify, or Hybrid.

| | |
|---|---|
| **Drafted** | 2026-10-29, Claude Code cloud session, at the Executive Director's direction (documentation-only authorization) |
| **Branch** | `claude/dr-02-verification-protocol`, from `origin/main` at `3f710a3b32d79af527c1cf738e4b3ba08b480922` |
| **Source revision under test** | `95b3e6c17ab5ce6ed9431e7f2a5eb4a54c7eec8b`, the tip of `release/residence-ownership-20261024`. Served production assets reproduce from it byte for byte (Pass 1, F1.3); that does not establish the database state. |
| **Motivating findings** | Authorization Semantics Review (`claude/dr-02-authorization-semantics-review` @ `972502d`): §3.3 C1–C4 (reflection privacy) and §0 B1–B3 (migration state). These are source-level observations only. |
| **Related branches (unchanged)** | `claude/dr-02-evidence-portability-proposal` @ `787b1b6`; `claude/dr-02-runtime-verification-pass-1` @ `fb86f04` |

## 1. Questions under test

| ID | Question | Stage |
|---|---|---|
| Q1 | Does the **release's migration-defined schema** let a residence-staff identity read `check_ins.reflection`, `intention`, `carry_forward` or `prompt_response` directly from the base table, despite the staff view excluding them? | A |
| Q2 | Does the **deployed CQCX authorization** enforce that boundary? | B |
| Q3 | Which migrations are **actually applied** to CQCX? In particular: are prepared `0147`–`0151` applied, do `lead_contact_events` and `route_lead` exist, and what policies and column privileges exist on `check_ins`? | C |

**Stated expectation.** The documented intent is that reflection text is participant-private, so the expected outcome for staff direct reads is **DENY**:
- `L/0023:7-9`;
- `docs/architecture/recovery-pulse.md` §Privacy;
- ADR-0014 decision 3.

**Source-derived prediction.** The review predicts **ALLOW** at the source level (review C2). Each stage records which of the two occurred.

## 2. Stage overview and gates

| Stage | Purpose | Environment | Touches production? | Authorization |
|---|---|---|---|---|
| **A** — Local source verification | Rebuild the release schema; test Q1 using only synthetic records | Isolated local PostgreSQL container: no network, no production credentials, connection strings or data | No | **Draft only; execution not authorized** |
| **B** — Production behavioral verification | Test Q2 against deployed CQCX using synthetic identities confined to a synthetic residence | CQCX via PostgREST, plus service-role setup and cleanup | Yes: writes synthetic rows | **Not authorized** |
| **C** — Production migration-state inspection | Answer Q3 with read-only ledger and catalog queries | CQCX, read-only SQL | Reads catalog metadata only | **Not authorized** |

**Stage independence.**
- A, B and C are independently authorized. Approving one approves nothing else.
- **A passing (DENY) does not make B unnecessary.** It shows only that the rebuilt source enforces the restriction; production can still differ.
- Whether to run B is decided after A and C, on residual risk:
  - If C shows CQCX matches the source and A shows DENY, the residual risk is live drift outside migrations.
  - If A shows ALLOW, or C shows divergence, B is better justified.
- Recommended order: **A and C (independent of each other) → decision → B**.

---

## 3. Stage A — Local source verification

### 3.1 Environment requirements (all mandatory)

1. **Container.** Use a local Docker container started with `--network none`, data on `tmpfs`, and `listen_addresses=''` (Unix socket only). Use the pinned image already used by the repository's isolated-replay harness (`scripts/test-document-review.py` at `95b3e6c`):
   `postgres@sha256:b8faeff7712663c2773a190181e1246e37e364b887611c04658c28b44e2408fe`.
2. **Local socket only.** Accept only a local Unix Docker socket, mirroring that harness's `unix://` check. Refuse remote Docker hosts.
3. **No secrets in the environment.** No environment variable, file or argument may hold a Supabase URL, key, service-role secret, connection string or `DB_URL`. The runner aborts if any of `SUPABASE_*`, `DB_URL`, `DATABASE_URL`, `PG*` (other than `PGUSER=postgres`) or `SB*` is set.
4. **No launch seeds.** `supabase/launch/seed/*.sql` is **not** applied. At `95b3e6c`, `seed/0200_seed_core_reference.sql` contains 12 email-like strings. Excluding all seeds keeps real-world identifiers out of the test database. Every fixture is synthetic (§3.4).
5. **Container lifetime.** The container is destroyed after the run (`docker rm -f`), with no volume retained.

### 3.2 Schema reconstruction

**Synthetic platform shim.** This is applied before any migration and mirrors `scripts/test-document-review.py`:

```sql
create role anon; create role authenticated; create role service_role bypassrls; create role authenticator;
create schema auth;
create table auth.users(id uuid primary key, email text, deleted_at timestamptz,
  is_anonymous boolean default false, banned_until timestamptz, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
grant usage on schema auth to authenticated, anon;
create schema storage; create table storage.buckets(id text primary key, public boolean);
create schema extensions; create extension pgcrypto with schema extensions;
create table public.housing_applications(id bigint primary key);
alter table public.housing_applications enable row level security;
revoke all on public.housing_applications from public, anon, authenticated, service_role;
```

**Variant A1: release apply lineage.** Apply every file in `supabase/launch/migrations/` in filename order, at `95b3e6c`, with one exception:
- `0104_reminder_cron.sql` is excluded because it needs `pg_cron`. The precedent harness excludes it for the same reason.
- `0146_ejwrh_document_activation.sql` is **included**. The precedent harness skipped it for its own purpose. If it fails here, **STOP**, record the error, and ask the approver whether to exclude it. Do not skip it silently.

**Variant A2: lineage plus prepared chain.** Same as A1, plus the prepared files:
- Insert `prepared/0147`, `0148` and `0149` (`*.prepared.sql`), sorted, immediately before `20261005071446_circle_meeting_logging.sql`. That is exactly the precedent harness's insertion point.
- Whether to also include `0150` and `0151` is an **open approver decision** (§8, item 4). Default: excluded, matching the precedent.
- **Purpose:** to show whether the prepared chain changes Q1. This matters if Stage C finds those files applied live.

**Integrity check before apply.** Compute `sha256` for every file applied and compare it with `docs/proposals/dr-02-verification-protocol/release-95b3e6c-migration-inventory.sha256`. Any mismatch means **STOP**.

### 3.3 Battery guard

The battery refuses to run outside an empty isolated rebuild:

```sql
\set ON_ERROR_STOP on
do $$ begin
  if coalesce(current_setting('dr02.stage_a', true), '') <> 'on' then
    raise exception 'REFUSING: set dr02.stage_a = on only in the isolated Stage A container';
  end if;
  if inet_server_addr() is not null then
    raise exception 'REFUSING: TCP connection detected; Stage A requires a Unix-socket-only container';
  end if;
  if exists (select 1 from recoveryos.people) or exists (select 1 from auth.users) then
    raise exception 'REFUSING: database already contains people/auth rows; Stage A requires an empty rebuild';
  end if;
end $$;
```

### 3.4 Synthetic fixtures

All synthetic data uses the `DR02A` namespace and the `@dr02a.invalid` domain. The `.invalid` TLD is reserved and cannot route. Sentinel strings make any leak unambiguous.

| Actor key | `auth.users.id` | Role assignments | Residency | Purpose |
|---|---|---|---|---|
| `res_r1` | `…-0000000000a1` | `participant`, `resident` @ R1 | R1, `active` | Subject; self-read control |
| `res_r1_exited` | `…-0000000000a2` | `participant` | R1, `exited` | Status-filter control |
| `res_r2` | `…-0000000000a3` | `participant`, `resident` @ R2 | R2, `active` | Cross-residence control |
| `staff_r1` | `…-0000000000b1` | `residence_staff` @ R1 | — | **Primary actor** |
| `mgr_r1` | `…-0000000000b2` | `residence_manager` @ R1 | — | Manager variant |
| `staff_r2` | `…-0000000000b3` | `residence_staff` @ R2 | — | Wrong-residence control |
| `coach` | `…-0000000000c1` | `coach` (organization-wide) | — | No relationship |
| `navigator` | `…-0000000000c2` | `navigator` | — | No relationship |
| `pm` | `…-0000000000c3` | `program_manager` | — | Care-operations role |
| `admin` | `…-0000000000c4` | `administrator` | — | Platform admin |
| `dual` | `…-0000000000d1` | `coach` + `residence_staff` @ R1 | — | Dual-role case |
| `other` | `…-0000000000e1` | `participant` | — | Unrelated participant |

UUID prefix: `00000000-0000-4000-8000-` followed by the suffix shown.

**Classification.** All synthetic people stay **production-classified**, which is the default when no `person_classifications` row exists. In A2, `0147` denies privileged predicates to `test_fixture` actors. Classifying them as fixtures would produce a false DENY for the wrong reason. This is safe only because the database is disposable and contains nothing else.

```sql
begin;
insert into recoveryos.organizations (name, organization_type)
values ('DR02A Synthetic Org', 'recovery_support');
insert into recoveryos.residences (organization_id, name, address_city, address_state, is_active)
select o.id, r.name, 'Nowhere', 'IA', true
from recoveryos.organizations o, (values ('DR02A Residence R1'), ('DR02A Residence R2')) r(name)
where o.name = 'DR02A Synthetic Org';

insert into auth.users (id, email) values
 ('00000000-0000-4000-8000-0000000000a1','res-r1@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000a2','res-r1-exited@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000a3','res-r2@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000b1','staff-r1@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000b2','mgr-r1@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000b3','staff-r2@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000c1','coach@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000c2','navigator@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000c3','pm@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000c4','admin@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000d1','dual@dr02a.invalid'),
 ('00000000-0000-4000-8000-0000000000e1','other@dr02a.invalid');

insert into recoveryos.people (auth_user_id, first_name, last_name)
select u.id, 'DR02A', split_part(u.email, '@', 1) from auth.users u;

-- Helper: person id for an actor's email local-part.
create function pg_temp.pid(k text) returns bigint language sql stable as
 $$ select id from recoveryos.people where last_name = k $$;
create function pg_temp.rid(n text) returns bigint language sql stable as
 $$ select id from recoveryos.residences where name = n $$;
grant execute on function pg_temp.pid(text), pg_temp.rid(text) to public;

insert into recoveryos.role_assignments (person_id, role_key, organization_id, residence_id) values
 (pg_temp.pid('res-r1'),'participant',null,null),
 (pg_temp.pid('res-r1'),'resident',null,pg_temp.rid('DR02A Residence R1')),
 (pg_temp.pid('res-r1-exited'),'participant',null,null),
 (pg_temp.pid('res-r2'),'participant',null,null),
 (pg_temp.pid('res-r2'),'resident',null,pg_temp.rid('DR02A Residence R2')),
 (pg_temp.pid('staff-r1'),'residence_staff',null,pg_temp.rid('DR02A Residence R1')),
 (pg_temp.pid('mgr-r1'),'residence_manager',null,pg_temp.rid('DR02A Residence R1')),
 (pg_temp.pid('staff-r2'),'residence_staff',null,pg_temp.rid('DR02A Residence R2')),
 (pg_temp.pid('coach'),'coach',null,null),
 (pg_temp.pid('navigator'),'navigator',null,null),
 (pg_temp.pid('pm'),'program_manager',null,null),
 (pg_temp.pid('admin'),'administrator',null,null),
 (pg_temp.pid('dual'),'coach',null,null),
 (pg_temp.pid('dual'),'residence_staff',null,pg_temp.rid('DR02A Residence R1')),
 (pg_temp.pid('other'),'participant',null,null);

insert into recoveryos.residencies (person_id, residence_id, residency_status) values
 (pg_temp.pid('res-r1'),        pg_temp.rid('DR02A Residence R1'), 'active'),
 (pg_temp.pid('res-r1-exited'), pg_temp.rid('DR02A Residence R1'), 'exited'),
 (pg_temp.pid('res-r2'),        pg_temp.rid('DR02A Residence R2'), 'active');

insert into recoveryos.check_ins
 (person_id, period, local_date, mood_rating, craving_rating, hope_rating,
  intention, reflection, carry_forward, prompt_response)
select pg_temp.pid(k), 'evening', date '2026-10-29', 3, 2, 4,
       'DR02A-SENTINEL-INTENTION-' || k, 'DR02A-SENTINEL-REFLECTION-' || k,
       'DR02A-SENTINEL-CARRY-' || k, 'DR02A-SENTINEL-PROMPT-' || k
from unnest(array['res-r1','res-r1-exited','res-r2']) k;

-- Capture subject ids as psql variables WHILE STILL SUPERUSER. The pg_temp
-- helpers above are only for arrange: under `authenticated` they would read
-- recoveryos.people through RLS and could return NULL, producing false DENYs.
select pg_temp.pid('res-r1') as subj_r1, pg_temp.pid('res-r1-exited') as subj_r1_exited,
       pg_temp.pid('res-r2') as subj_r2 \gset
```

### 3.5 Test procedure

**Per actor:**
1. Run `reset role; set local role authenticated; select set_config('test.uid', '<uuid>', true);`.
2. Run the query.
3. Record the row count, and whether any `DR02A-SENTINEL-REFLECTION-*` value was returned.

All tests run inside the single transaction opened in §3.4, which ends with `ROLLBACK`. The container is then destroyed.

**Primary query template (direct base-table read).** `:subj` is one of the psql variables captured in §3.4: `:subj_r1`, `:subj_r1_exited`, or `:subj_r2`.
```sql
select person_id, reflection, intention, carry_forward, prompt_response
from recoveryos.check_ins
where person_id = :subj;
```

**View query template:**
```sql
select * from recoveryos.check_ins_staff_view where person_id = :subj;
```

**Actor keys and fixture names.** Actor keys in the table below map to the
UUIDs in §3.4. Subjects are written by their email local-part (`res-r1` means
`:subj_r1`).

| Test | Actor | Subject | Query | Expected by documented intent | Source-derived prediction | Kind |
|---|---|---|---|---|---|---|
| A-01 | `res_r1` | `res-r1` | direct | ALLOW, own row with sentinels | ALLOW | Control (must pass) |
| A-02 | `staff_r1` | `res-r1` | view | ALLOW: ratings visible; the view has **no** free-text columns | ALLOW | Control |
| **A-03** | `staff_r1` | `res-r1` | **direct** | **DENY**: 0 rows, or permission error | **ALLOW** | **Primary (Q1)** |
| A-04 | `mgr_r1` | `res-r1` | direct | DENY | ALLOW | Primary variant |
| A-05 | `dual` | `res-r1` | direct | DENY | ALLOW | Dual-role variant |
| A-06 | `staff_r2` | `res-r1` | direct | DENY (0 rows) | DENY | Control: residence scope |
| A-07 | `staff_r1` | `res-r1-exited` | direct | DENY (0 rows) | DENY | Control: status filter |
| A-08 | `staff_r1` | `res-r2` | direct | DENY (0 rows) | DENY | Control: cross-residence |
| A-09 | `coach` | `res-r1` | direct | DENY | DENY | Control: no relationship |
| A-10 | `navigator` | `res-r1` | direct | DENY | DENY | Control |
| A-11 | `pm` | `res-r1` | direct | DENY | DENY | Control: care operations does not extend to check-ins |
| A-12 | `admin` | `res-r1` | direct | DENY | DENY (no admin policy on `check_ins`) | Control |
| A-13 | `other` | `res-r1` | direct | DENY | DENY | Control |
| A-14 | role `anon`, no uid | `res-r1` | direct | DENY (permission error) | DENY | Control (run in a `DO` block with an `insufficient_privilege` handler, so the transaction continues) |

**Catalog assertions** (run as superuser; recorded, not pass/fail):
```sql
select has_table_privilege('authenticated','recoveryos.check_ins','SELECT') as tbl_select,
       has_column_privilege('authenticated','recoveryos.check_ins','reflection','SELECT') as col_reflection,
       has_column_privilege('authenticated','recoveryos.check_ins','intention','SELECT') as col_intention;
select policyname, cmd, roles, qual from pg_policies
 where schemaname='recoveryos' and tablename='check_ins' order by policyname;
select column_name from information_schema.columns
 where table_schema='recoveryos' and table_name='check_ins_staff_view' order by ordinal_position;
```

**Stop conditions:**
- Any control fails (A-01, A-02, A-06 to A-14): STOP. Record the output and mark the run **invalid**. Do not interpret A-03 to A-05.
- Any migration fails to apply, or a file hash mismatches: STOP.
- Any guard in §3.3 trips: STOP.

**Cleanup.** End with `ROLLBACK`, then `docker rm -f <container>`. Verify with `docker ps -a` that no container remains. No volume exists to remove.

### 3.6 Interpreting results

| Outcome | Meaning | It does **not** mean |
|---|---|---|
| A-03 to A-05 DENY in A1 | The release lineage enforces the boundary. The review prediction (C2) was wrong; record why. | That production enforces it (Stage B) |
| A-03 to A-05 ALLOW in A1 | **The release migration-defined policies let residence staff read free-text reflection via the base table.** | That production exposes it: live column grants, drift or other controls may differ. Not a confirmed incident. |
| A1 ALLOW but A2 DENY | The prepared chain changes the result. The live answer depends on Stage C. | — |
| A-06 to A-14 unexpectedly ALLOW | A wider scoping problem than Q1. STOP, and escalate as a separate finding. | — |
| A-01 or A-02 fail | The harness or fixtures are wrong. The run is invalid. | Any security conclusion |

### 3.7 Stage A evidence record

Use the Pass 1 portability fields:
- reviewing environment: host OS, Docker version, image digest;
- source revision `95b3e6c…`, plus the variant (A1 or A2) and the exact file list applied, with sha256 values;
- the sha256 of the battery SQL as executed;
- start and end timestamps (UTC);
- raw `psql` output, which contains only synthetic data;
- a results table (test ID, actor, rows, sentinel returned yes/no);
- catalog assertion output;
- limitations;
- this reviewer's evidence class (Class B for **source-reconstruction behavior only**, never production).

Location: `docs/audits/evidence/<date>-dr-02-stage-a/` on a new documentation branch.

---

## 4. Stage B — Production behavioral verification (NOT AUTHORIZED)

### 4.1 Separate approval must cover all of the following

1. **Synthetic accounts.** The number of accounts, their emails (`@dr02b.invalid` is unroutable, so sign-up must be done by service-role provisioning, not email confirmation), who creates them, and how they are classified (see 4.2).
2. **Data isolation.** A **new synthetic residence** (`DR02B Synthetic Residence`, `is_active = false` unless a test requires active) under a **synthetic organization**. Staff synthetic accounts are scoped **only** to that residence. A synthetic account is insufficient by itself: its permissions must make real records **unreachable**, not merely unqueried.
3. **Permitted queries.** The exact PostgREST requests in §4.4, and nothing else. **Every query is filtered to a synthetic `person_id`.** Unfiltered reads are forbidden.
4. **Side effects.** The approval must confirm that creating the synthetic residence, roles and residency does not trigger real-staff notifications, public directory listing, evidence aggregates or reports. This must be checked against the CQCX trigger catalog first, read-only, using Stage C methods.
5. **Cleanup and audit residue.** Rows to delete, roles to revoke, auth users to delete. Note that `audit_log` is append-only, so residue is expected and must be recorded.
6. **Operator and window.** A named operator, time window, and abort contact.

### 4.2 Classification conflict (approver decision required)

| Classification | If `0147` is applied live | Consequence |
|---|---|---|
| `test_fixture` | Staff predicates are denied by `0147` | A-03-style DENY would be **for the wrong reason**, so the test is invalid |
| `production` | Staff predicates work | Synthetic people may enter production aggregates; they must be excluded or annotated and removed |

Stage C (C-03) determines which case applies. Stage B must not begin until this is decided.

### 4.3 Fixtures (minimal)

| Actor | Role | Notes |
|---|---|---|
| `b_staff` | `residence_staff` @ DR02B residence **only** | Primary actor |
| `b_resident` | `resident` @ DR02B residence; residency `active` | One check-in with `DR02B-SENTINEL-*` free text |
| `b_control` | `participant` only | Negative control |

These are created by service role. No real person is linked, related, or placed in the synthetic residence.

### 4.4 Permitted requests

Each request uses the synthetic user's JWT, with `Accept-Profile: recoveryos`.

| Test | Actor | Request | Expected (intent) |
|---|---|---|---|
| B-01 | `b_resident` | `GET /rest/v1/check_ins?select=id,reflection&person_id=eq.<b_resident>` | ALLOW (self) |
| B-02 | `b_staff` | `GET /rest/v1/check_ins_staff_view?select=*&person_id=eq.<b_resident>` | ALLOW, ratings only |
| **B-03** | `b_staff` | `GET /rest/v1/check_ins?select=id,reflection,intention,carry_forward,prompt_response&person_id=eq.<b_resident>` | **DENY** (0 rows or 401/403) |
| B-04 | `b_control` | same as B-03 | DENY |

**Stop conditions:**
- Any response contains a `person_id` outside the synthetic set, or any non-`DR02B` free text: **STOP immediately**. Do not store the body; record only the status and the fact of a breach; notify the approver.
- Any setup step triggers a notification to a real person: STOP and clean up.
- Any request is rejected for a reason other than authorization: STOP.

**Cleanup.** Run as service role, in dependency order:
1. delete `check_ins` → `residencies` → `role_assignments`, then `people` (synthetic IDs only, each `delete … where id = any(<recorded ids>)`);
2. delete the residence, then the organization;
3. delete the auth users.

Verify zero synthetic rows remain, and record the `audit_log` residue IDs.

### 4.5 Evidence

Same fields as §3.7, plus:
- the CQCX project reference;
- request/response status and headers, sanitized as in Pass 1;
- response bodies **only if** they contain exclusively `DR02B` sentinels;
- cleanup verification counts.

---

## 5. Stage C — Production migration-state inspection (NOT AUTHORIZED)

### 5.1 Constraints

- This authorization does **not** include authenticating the Supabase connector or opening any connection.
- When approved, run as **one read-only transaction** (`begin transaction read only; … rollback;`) on a service/admin SQL connection, or through the equivalent read-only MCP tools (`list_migrations`, `execute_sql` with these exact statements).
- **Catalog and ledger metadata only.** No query reads participant tables, except the optional aggregate C-08, which needs its own approval.
- Existing post-apply read-back scripts (`prepared/0147_live_readback_verification.sql` and others) contain per-actor checks that touch person records. **Only their catalog-text checks (section A) are reused here.**

### 5.2 Queries

```sql
begin transaction read only;

-- C-01 Migration ledger (Supabase-managed history).
select version, name from supabase_migrations.schema_migrations order by version;

-- C-02 Objects that exist only in prepared 0149 at 95b3e6c.
select to_regclass('recoveryos.lead_contact_events') as lead_contact_events;
select p.proname, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef,
       md5(pg_get_functiondef(p.oid)) as def_md5
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'recoveryos'
  and p.proname in ('route_lead','set_lead_status','record_lead_contact','assign_lead',
                    'find_duplicate_leads','list_intake_assignees','can_work_lead',
                    'is_intake_coordinator','is_intake_worker','lead_contact_events_immutable')
order by 1, 2;
select unnest(enum_range(null::recoveryos.role_key))::text as role_key;

-- C-03 0147 guard presence (catalog-text checks reused from 0147_live_readback_verification.sql §A).
select to_regprocedure('recoveryos.is_privileged_role(recoveryos.role_key)') is not null as has_is_privileged_role,
       position('is_privileged_role' in pg_get_functiondef('recoveryos.has_role(recoveryos.role_key)'::regprocedure)) > 0 as has_role_guarded,
       position('is_test_fixture' in pg_get_functiondef('recoveryos.staff_residence_ids()'::regprocedure)) > 0 as staff_residence_ids_guarded,
       position('is_test_fixture' in pg_get_functiondef('recoveryos.is_residence_manager_of(bigint)'::regprocedure)) > 0 as residence_manager_guarded,
       to_regprocedure('recoveryos.is_production_actor()') is not null as has_is_production_actor;

-- C-04 Definition fingerprints of core authorization helpers (compare with 95b3e6c text).
select p.proname, pg_get_function_identity_arguments(p.oid) as args, md5(pg_get_functiondef(p.oid)) as def_md5
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'recoveryos'
  and p.proname in ('current_person_id','has_role','staff_residence_ids','is_residence_manager_of',
                    'is_platform_admin','is_admin_staff','is_support_staff','is_care_operations_staff',
                    'is_coach_staff','is_navigator_staff','grant_role_assignment','revoke_consent_grant')
order by 1, 2;

-- C-05 Reflection boundary metadata.
select policyname, cmd, roles, qual, with_check from pg_policies
 where schemaname = 'recoveryos' and tablename = 'check_ins' order by policyname;
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'recoveryos' and table_name = 'check_ins' order by 1, 2;
select grantee, column_name, privilege_type from information_schema.column_privileges
 where table_schema = 'recoveryos' and table_name = 'check_ins'
   and column_name in ('reflection','intention','carry_forward','prompt_response') order by 1, 2;
select has_column_privilege('authenticated','recoveryos.check_ins','reflection','SELECT') as auth_reflection;

-- C-06 Policy-count reconciliation (review §3: 131 static vs 230 catalog replay).
select schemaname, count(*) from pg_policies group by 1 order by 1;
select tablename, count(*) from pg_policies where schemaname = 'recoveryos' group by 1 order by 1;

-- C-07 Program-scope enforcement surface.
select count(*) as policies_referencing_program_id from pg_policies
 where schemaname = 'recoveryos' and (qual ilike '%program_id%' or with_check ilike '%program_id%');

rollback;
```

**C-08 (optional; separate approval; aggregate only, no identifiers).** This would let the separately reported role-assignment observations be checked with a recorded source:
```sql
select role_key::text, (organization_id is null) as org_null, (program_id is null) as program_null,
       (residence_id is null) as residence_null, count(*)
from recoveryos.role_assignments where revoked_at is null group by 1, 2, 3, 4 order by 1;
```

### 5.3 Interpretation

| Observation | Meaning |
|---|---|
| Ledger lacks `0147`–`0151`, **and** C-02 finds no `lead_contact_events` or `route_lead` | The release client's shared-intake calls fail live (review B3a ruled out) |
| Ledger lacks them, **but** C-02 finds the objects | Applied out-of-band. Compare `def_md5` with the prepared text to establish **which** version is live |
| Ledger includes them | Repository lineage lags production. Record it for reconciliation |
| C-05 shows a column-level revoke or no table `SELECT` for `authenticated` | Production likely closes C2 regardless of Stage A, but Stage B still confirms behavior |
| C-06 counts ≠ static replay | Reconcile, per table, against the review's evidence file |

### 5.4 Evidence

Use the Pass 1 portability fields:
- the project reference;
- the connection method (MCP tool name or `psql` with role name; never credentials);
- per-query UTC timestamps;
- the full result sets, which are catalog metadata only;
- the sha256 of the query file as executed;
- reviewer classification and limitations.

---

## 6. Authorization gates (checklist before any execution)

| Gate | A | B | C |
|---|---|---|---|
| Written approval naming the stage, operator and window | ☐ | ☐ | ☐ |
| Environment confirmed (local isolated / CQCX) | ☐ | ☐ | ☐ |
| Approver decisions in §8 resolved | items 1–4 | items 5–7 | item 8 |
| Connector authentication approved | n/a | ☐ | ☐ |
| Prior stage results reviewed | — | A **and** C | — |
| Stop conditions and abort contact acknowledged | ☐ | ☐ | ☐ |
| Evidence destination branch named | ☐ | ☐ | ☐ |

## 7. Evidence-portability fields (all stages)

Every stage records:
- originating session and reviewing environment;
- tool or connector;
- UTC timestamps;
- source revision `95b3e6c…` and the exact file hashes applied or compared;
- retrieval or execution method;
- artifact identifiers (container image digest, request IDs, query-file sha256);
- verification status assigned by this reviewer;
- limitations;
- unresolved discrepancies.

Provenance is immutable; other reviewers assign their own classifications.

## 8. Open decisions for the approver

1. **Stage A runtime.** Is a local Docker daemon available for the operator? The drafting session has not verified this, and no container has been started.
2. **Stage A `0146`.** If it fails to apply, should it be excluded (precedent) or should the run stop?
3. **Stage A seeds.** Confirm that launch seeds stay excluded.
4. **Stage A2 scope.** Include prepared `0150`/`0151`, or follow the precedent (`0147`–`0149` only)?
5. **Stage B classification** (§4.2).
6. **Stage B residence state.** Can the synthetic residence stay `is_active = false` without invalidating the staff policy path? This needs C-04 definitions.
7. **Stage B audit residue.** Is residue in `audit_log` acceptable?
8. **Stage C scope.** Include C-08?

## 9. Limitations of this draft

- **No SQL here has been executed or syntax-checked.** Column and enum names come from reading `95b3e6c` (`L/0002`, `L/0004`, `L/0023`, `L/0030`) and may need correction on first run in the approved environment.
- The Stage A shim reproduces Supabase only as far as the precedent harness does. PostgREST, JWT parsing and Supabase default privileges are not modeled, which is one reason Stage B exists.
- Stage B request shapes assume PostgREST conventions observed in the release client. They have not been sent.
- The source-derived predictions are the review's static reading. They may be wrong. That is what Stage A tests.
