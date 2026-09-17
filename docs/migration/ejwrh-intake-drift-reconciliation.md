# EJWRH Intake Drift — Provenance, Writer Trace & Hardening

**Date:** 2026-08-14 · **Classification:** TYPE A (read/audit) + TYPE B (repo docs/migration prep),
then a **TYPE D grants-only hardening APPLIED under authorization** (§7). Canonical project:
`cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch / CQCX). Sections 1–5 record the reconciliation as prepared;
§7 records the applied live change.

Live access this session (verified working): GitHub ✓ · Cloudflare ✓ (limited) · Supabase ✓.

---

## 1. What drifted

Two migrations exist on CQCX but **not** in the repo's `supabase/launch/migrations/` lineage, applied
2026-08-11:

| Version          | Name                                | Effect                                                                                                                                                                                              |
| ---------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260811232326` | `create_housing_applications_ejwrh` | Creates **`public.housing_applications`** (bespoke EJWRH online-application intake) + index + `public.set_updated_at()` + updated-at trigger + RLS + a constrained anon/authenticated INSERT policy |
| `20260811232342` | `harden_set_updated_at_search_path` | Pins `search_path=''` on `public.set_updated_at()`                                                                                                                                                  |

Captured verbatim (exact stored `statements[]`, not reconstructed) in
`supabase/live-drift/cqcx/*.captured.sql`. Both are in the **`public`** schema — **not** the
canonical `recoveryos` intake boundary.

## 2. Live-state snapshot — `public.housing_applications` (verified 2026-08-14)

- **Owner:** `postgres` · **RLS:** enabled (not forced) · **Rows:** **0** (no applications stored;
  no applicant PII at rest).
- **Columns (20):** `id uuid pk default gen_random_uuid()`, `house_code text not null default 'ejwrh'`,
  `applicant_name text`, `applicant_email text not null`, `applicant_phone text`, `county text`,
  `personal jsonb not null default '{}'`, `journey jsonb not null default '{}'`, `your_why text`,
  `consent_rules_reviewed bool`, `consent_share_with_house bool`, `consent_contact bool`,
  `status text not null default 'submitted'` (CHECK: submitted/under_review/intake_scheduled/accepted/
  waitlisted/declined/withdrawn), `source text default 'web'`, `submitted_at`, `intake_at`,
  `decided_at`, `decision_note`, `created_at`, `updated_at`.
- **Indexes:** `housing_applications_pkey (id)`; `housing_applications_house_status_idx (house_code, status, submitted_at desc)`.
- **Trigger:** `trg_housing_applications_updated_at BEFORE UPDATE → public.set_updated_at()`.
- **Sensitive fields:** `applicant_email/phone`, `county`, and free-form `personal` (demographics,
  situation, health/safety, references) + `journey` (recovery history, supervision/reentry, goals).
- **`public.set_updated_at()`:** `language plpgsql`, `SET search_path=''`, owner `postgres`
  (proconfig `search_path=""`). Distinct from `recoveryos.set_updated_at` (unaffected).

### RLS / policy matrix (current)

| Command | anon                                                                                                         | authenticated         | service_role      |
| ------- | ------------------------------------------------------------------------------------------------------------ | --------------------- | ----------------- |
| INSERT  | ✅ policy `housing_applications_public_insert` (`house_code='ejwrh'` ∧ email 3–320 ∧ `consent_contact=true`) | ✅ same policy        | ✅ (bypasses RLS) |
| SELECT  | ❌ no policy → denied                                                                                        | ❌ no policy → denied | ✅ (bypasses RLS) |
| UPDATE  | ❌ no policy → denied                                                                                        | ❌ no policy → denied | ✅                |
| DELETE  | ❌ no policy → denied                                                                                        | ❌ no policy → denied | ✅                |

### Grant matrix (current — from Supabase default public-schema grants)

| Role          | SELECT | INSERT | UPDATE | DELETE | TRUNCATE | REFERENCES | TRIGGER |
| ------------- | ------ | ------ | ------ | ------ | -------- | ---------- | ------- |
| anon          | ✅     | ✅     | ✅     | ✅     | ✅       | ✅         | ✅      |
| authenticated | ✅     | ✅     | ✅     | ✅     | ✅       | ✅         | ✅      |
| service_role  | ✅     | ✅     | ✅     | ✅     | ✅       | ✅         | ✅      |

**Risk:** sensitive rows are protected today **only** by the absence of SELECT/UPDATE/DELETE
_policies_. The broad grants mean one accidental permissive policy or an RLS toggle would expose PII.
TRUNCATE/UPDATE/DELETE grants to anon/authenticated are latent over-privilege (not reachable via
PostgREST today, but violate least privilege).

## 3. Writer trace

- **In-repo:** no writer. `rcoiowa/GFA-ECO` contains **no** reference to `housing_applications`. The
  in-repo directory site's EJWRH page (`sites/recoveryresidence-directory/index.html`) routes to
  email/phone contact + the `referrals` table — **not** `housing_applications`.
- **Pathway — CONFIRMED:** anonymous browser → **Supabase PostgREST anon INSERT** with the
  publishable/anon key. Evidence: the only write policy targets `anon, authenticated` for INSERT; a
  service-role/Edge-Function writer would not need it. `source` defaults to `'web'`. The `public`
  schema is PostgREST-exposed (launch `0010`). **Not** a service-role Edge Function; **not**
  authenticated-user-scoped.
- **Exact deployment — UNKNOWN / BLOCKED via available tooling.** The Cloudflare MCP available this
  session lists Workers only (`workers_list`), `workers_get_worker` returns no routes, and
  `workers_get_worker_code` errors (response-serialization bug); **Cloudflare Pages projects are not
  enumerable** with these tools. No Worker is EJWRH-named, and the canonical/staging/legacy Workers
  serve the platform/directory on the `recoveryos` schema, not `public.housing_applications`. The
  EJWRH online form is therefore a **separate out-of-repo deployment** (most plausibly a Cloudflare
  Pages site or an external no-code build). **Recommend:** the ED identifies the EJWRH application
  form URL/deployment, or grants Pages read, to close this to CONFIRMED.

## 4. Data classification (CQCX) — counts only, no PII

| Signal                                                                           | Count                      |
| -------------------------------------------------------------------------------- | -------------------------- |
| `people` total                                                                   | 62                         |
| `person_classification` = **test_fixture**                                       | **59**                     |
| `person_classification` = **production**                                         | **3**                      |
| auth users — fixture-like email (`fixture`/`example`/`*test*`/`recoveryos.test`) | 60                         |
| auth users — `@rcoiowa.org` / GFA                                                | 1                          |
| auth users — other                                                               | 1                          |
| role_assignments — test_fixture / production                                     | 98 / 5                     |
| consent_grants — test_fixture / production                                       | 60 / 0                     |
| booking_requests / messages / conversations                                      | 5 / 33 / 13 (fixture-tied) |
| `public.housing_applications` rows                                               | **0**                      |

**Classification verdict:** CQCX is **overwhelmingly synthetic/test-fixture** (59/62 people, 98/103
role assignments, all consent grants). The **3 production-classified** persons carry internal markers
(an `@rcoiowa.org` address and the launch report's single deliberate admin identity) and read as
**internal staff/owner accounts, not external participants**. **No external participant records are
evident.** Definitive "is any single production record a real external participant?" is best confirmed
by staff, but every available marker indicates internal-only. Crucially, the drifted intake table
holds **zero rows**, so no applicant PII is at rest.

## 5. Hardening plan — `0123_housing_applications_least_privilege.APPLIED.sql`

> Applied 2026-08-14 under an authorized gate — see the live execution record in §7. The plan below
> is retained as the design rationale and matrices.

### Proposed migration SQL

```sql
begin;
revoke select, update, delete, truncate, references, trigger
  on public.housing_applications from anon;      -- keep anon INSERT only
revoke all
  on public.housing_applications from authenticated;  -- unused; staff use service_role
commit;
```

### Rollback SQL

```sql
begin;
grant select, insert, update, delete, truncate, references, trigger on public.housing_applications to anon;
grant select, insert, update, delete, truncate, references, trigger on public.housing_applications to authenticated;
commit;
```

### Before / after privilege matrix

| Role          | Privilege                                                  | Before                        | After          |
| ------------- | ---------------------------------------------------------- | ----------------------------- | -------------- |
| anon          | INSERT                                                     | ✅                            | ✅ (unchanged) |
| anon          | SELECT / UPDATE / DELETE / TRUNCATE / REFERENCES / TRIGGER | ✅ (RLS-denied for DML reads) | ❌ revoked     |
| authenticated | ALL (incl. INSERT)                                         | ✅                            | ❌ revoked     |
| service_role  | ALL                                                        | ✅                            | ✅ (unchanged) |

### RLS / policy matrix — unchanged by this migration

RLS stays enabled; the single INSERT policy `housing_applications_public_insert` is unchanged (the
optional policy-narrowing to `anon`-only is left commented). Reads/updates/deletes remain policy-denied
for anon/authenticated; service_role continues to bypass RLS for the staff admin path.

### Expected behavioral impact

- **anon submit form:** no change — INSERT preserved and still RLS-constrained.
- **anon SELECT/UPDATE/DELETE:** already RLS-denied → no observable change; the revoke only removes
  latent exposure (defense in depth).
- **authenticated INSERT:** removed — no authenticated writer was found, so no expected impact.
- **staff admin (service_role):** no change.

### Blast radius

Single table `public.housing_applications` on CQCX; **grants only** — no schema, data, RLS, policy,
function, or trigger change; 0 rows. Nothing in the `recoveryos` schema is touched.

### Rollback trigger

Apply the rollback if, after hardening, the EJWRH form's submissions begin failing with a
permission/`42501` error, **or** a legitimate authenticated (logged-in) insert path is discovered.

### Is the change safe with the current frontend?

**Yes** — the verified writer is anon INSERT, which is preserved.

### Is `authenticated` INSERT actually needed?

**No** — the traced writer is anonymous; staff create/read via service_role. Revoking authenticated
grants is safe on current evidence (flagged as the single item with residual uncertainty until the
exact deployment is identified per §3).

### Should this converge into `recoveryos.residence_application_intake`?

**Yes — recommended end state.** `public.housing_applications` and the prepared
`recoveryos.residence_application_intake` (0122) are the same concept (moderated, account-less,
sensitive housing intake). The canonical boundary is stronger: `recoveryos` schema, **no anon grants
at all** (service-role Edge Function writer), staff RLS read policies, notification triggers, and an
audit trail — versus the current anon-INSERT-into-`public` pattern. Convergence (map
`house_code`/`personal`/`journey`/`consent_*` → the intake table's fields; unify Grace House + EJWRH)
should be executed under a **separate implementation gate**; this hardening is the interim step.

## 6. Verdict

Provenance captured, writer pathway confirmed (deployment identity blocked by tool limits), data
classified as synthetic-plus-internal-staff with zero applicant rows at risk, and a safe,
behavior-preserving least-privilege migration + rollback prepared with full matrices.

**EJWRH INTAKE DRIFT RECONCILIATION: READY FOR HARDENING → HARDENING APPLIED (see §7).**

Residual open item (does not block hardening): identify the exact EJWRH form deployment (Cloudflare
Pages not enumerable via available MCP). The hardening is safe regardless because it preserves the
confirmed anon-INSERT pathway.

## 7. Live execution record — hardening APPLIED

- **Timestamp:** 2026-08-14T09:29:28Z · **Project:** `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch / CQCX)
- **Classification:** TYPE D — live configuration, scoped strictly to table grants on
  `public.housing_applications`. Executed under explicit authorization.
- **Migration file:** `supabase/live-drift/cqcx/0123_housing_applications_least_privilege.APPLIED.sql`
  (renamed from `.PREPARED.sql`; the `.captured.sql` provenance files are unchanged and are **not**
  canonical `recoveryos` migrations).

**Exact live SQL executed** (via authorized gate; the commented optional policy rewrite was **not**
run):

```sql
begin;
revoke select, update, delete, truncate, references, trigger
  on public.housing_applications from anon;
revoke all
  on public.housing_applications from authenticated;
commit;
```

**Preflight (before) — verified:** table exists; RLS enabled; 0 rows; policy
`housing_applications_public_insert` unchanged; anon = SELECT/INSERT/UPDATE/DELETE/TRUNCATE/
REFERENCES/TRIGGER; authenticated = same broad 7; service_role = broad 7; no new policy/trigger/
writer drift; project ref exact. No precondition drift.

**Before → after grant matrix**

| Role          | Before                                                        | After             |
| ------------- | ------------------------------------------------------------- | ----------------- |
| anon          | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER | **INSERT only**   |
| authenticated | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER | **(none)**        |
| service_role  | SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER | unchanged (all 7) |

**Post-change verification (live):**

- RLS: **enabled** (unchanged). Row count: **0** (unchanged).
- Policy `housing_applications_public_insert`: **unchanged** (INSERT; roles `anon,authenticated`; same
  check `house_code='ejwrh' ∧ email 3–320 ∧ consent_contact=true`). No SELECT/UPDATE/DELETE policy exists.
- Authorization proof (`has_table_privilege`, write-free): anon INSERT **available**; anon SELECT/
  UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER **denied**; authenticated **no privilege**; service_role **full**.

**Synthetic test:** none created. Authorization was proven by privilege + policy introspection (the
smallest safe check), so **no fixture row was inserted and no cleanup was required**. No real EJWRH
application was submitted.

**Behavioral outcome:** unauthorized read/update/delete remain denied (anon lacks the grant;
authenticated lacks all grants; no permissive policies); the intended anonymous INSERT path retains
database authorization (INSERT grant + unchanged INSERT policy). **Frontend submit path preserved.**

**Rollback:** **NOT used** (not needed). Documented rollback remains available in the APPLIED file.

**Status:** `0123` recorded as **APPLIED LIVE HARDENING — transitional drift remediation.** The
longer-term recommendation stands: converge EJWRH (and Grace House) intake onto the canonical
`recoveryos.residence_application_intake` boundary (`0122`) under a separate implementation gate.

## 8. Gate A containment & convergence — EXECUTED (2026-08-23)

Authorized by the EJWRH Gate A remediation directive following the predeployment audit
(`docs/audits/ejwrh-predeployment-audit-2026-08-23.md`, HOLD confirmed). Executed this session:

- **§3 residual closed:** the out-of-repo EJWRH deployment was identified — the `ejwrh` Edge
  Function (v1) serving `sites/ejwrh/index.html` from public Storage, with a form writing
  directly to `public.housing_applications` via anon PostgREST. Deployed 2026-08-23 via three
  ledger migrations now captured verbatim in this directory
  (`20260823212156/215058/215255 *.captured.sql`) — including a temporary anon-writable
  Storage window, a pattern retired by this gate.
- **Convergence executed at the write path:** the portal was rebuilt as a self-contained,
  version-controlled Edge Function (`supabase/functions/ejwrh/index.ts`, v2) — a
  data-minimized APPLICATION-stage page whose only submission path is the canonical
  `residence-intake` boundary → `recoveryos.residence_application_intake` (EJWRH =
  residence_id 2). No direct PostgREST write remains on the page.
- **Containment applied (`0138_ejwrh_containment`):** `housing_applications_public_insert`
  policy dropped; anon INSERT grant revoked (no client role now holds any privilege on the
  table); table comment marks it DEPRECATED — **no remaining canonical role**, superseded by
  the 0122 boundary; retained (0 rows, evidence + rollback) pending a future cleanup gate.
  The `sites` bucket was made private: the v1 mojibake page with unverified public claims is
  no longer publicly readable; the objects are preserved as evidence via service role.
- **Cloudflare:** production route PREPARED ONLY (`sites/ejwrh/worker.prepared.js` +
  README) — **PUBLIC DEPLOYMENT REMAINS CLOSED.**

**Status: EJWRH DRIFT — CONTAINED & CONVERGED AT THE BOUNDARY (Gate A). Gate B (intake
documents/consent/signature) and public activation remain separate executive gates.**
