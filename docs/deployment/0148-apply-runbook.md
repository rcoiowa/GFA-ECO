# 0148 apply runbook — P0 classification authorization isolation (Decision 1 & 2 execution)

**Authority:** executive authorization recorded 2026-09-14 in
`docs/decisions/2026-09-14-p0-classification-authorization-isolation.md` §9.
**Scope:** exactly the two approved mutations below, nothing else. No 0147, no
R1, no PR #7 content, no domain/DNS/Wix/Worker/function changes, no unrelated
identity/role or data writes. **Stop and report on any failed step; do not
improvise around a failed gate.**

**Approved artifact identity (verify before applying):**

- Branch `claude/recoveryos-control-tower-implementation-2026-09-14`, commit `f4646ea23ac39a54dc1bd7fa1fcc69a32780b476`.
- `supabase/launch/prepared/0148_classification_authorization_isolation.prepared.sql`
  SHA-256 `277824917102dcb74427a66b413c9232f69a39fc169f2fa8404ce326c1d371f4`.
- If the checked-out file's hash differs, STOP — the artifact drifted from what
  was reviewed and approved.

**Environment prerequisite:** an authenticated path to CQCX
(`cqcxvwoukyhxyokfwnjm`) — the authorized Supabase connector (MCP
`list_migrations` / `apply_migration` / `execute_sql`) or an admin SQL
connection. The 2026-09-14 implementation session had none (recorded in the
decision record); execution waits for a session that does. Never target any
other project; never touch YKY.

## Step 1 — Pre-apply gate checks (read-only)

1. Confirm project ref is `cqcxvwoukyhxyokfwnjm`.
2. Ledger tail check — must return exactly `0146_ejwrh_document_activation`
   (version `20260831001422`); anything else → STOP:
   ```sql
   select version, name from supabase_migrations.schema_migrations
   order by version desc limit 1;
   ```
3. Confirm a usable restore point: verify PITR/daily-backup status in the
   Supabase dashboard (Project → Database → Backups) and record the latest
   restore point timestamp in the apply log. No confirmed restore point → STOP.
4. Verify the artifact hash (above).

## Step 2 — Apply

Apply the prepared file as migration `0148_classification_authorization_isolation`
through the migration-recording path (MCP `apply_migration` with that name, or
`supabase migration up` equivalent), so the ledger gains the 0148 row. Content
must be byte-identical to the approved file. Function DDL only — no
table-structure changes and no row-data mutations.

## Step 3 — Live read-back verification (required before anything else)

Run `supabase/launch/prepared/0148_live_readback_verification.sql` on an
admin SQL connection. It is transaction-wrapped, rolls back, prints aggregate
counts only, and raises on failure. Expected: guard checks pass; every
login-linked fixture actor holding an active privileged role shows
`still privileged=0`; production admins show `lost access=0`. Baseline
expectation: at least 2 fixture actors checked (the Sep-14 aggregates). Any
exception → STOP, report, and if the cause is the migration itself, roll back
using `0148_classification_authorization_isolation.rollback.sql` (same
authority; record the reason).

Rehearsal evidence (isolated replay, 2026-09-14): read-back passed with
`fixture checked=2, still privileged=0; production admins checked=1, lost=0`.

## Step 4 — Decision 2: revoke existing privileged fixture assignments

Only after Step 3 passes. Run
`supabase/launch/prepared/p0_fixture_role_revocation.gated.sql`:

1. Its **scope preview** (first statement) prints aggregate counts by role —
   show these to the decision owner and confirm they match the approved scope
   (expected shape per the Sep-14 baseline: one administrator and one navigator
   fixture actor; exact counts come from the live preview).
2. The revocation section refuses to run if 0148 is absent or if zero
   login-linked production platform administrators would remain. It sets
   `revoked_at` (never deletes), writes one `role.revoked` audit row per
   assignment citing this authorization, and aborts wholesale if its
   post-condition (zero active privileged fixture assignments) fails.

Rehearsal evidence (isolated replay, 2026-09-14): preview showed
administrator ×1 + navigator ×2; 3 revoked, 3 audit rows, post-condition pass.

## Step 5 — Decision 4: apply 0149 (G3 exposure hardening)

Authorized 2026-09-14 (decision record §9, decision 4), **sequenced after
Steps 2–3 pass**. Do not combine with anything else.

1. Re-check the ledger: expect exactly the post-0148 state (tail =
   `0148_classification_authorization_isolation`). Any unexpected migration or
   drift → STOP and report.
2. Confirm the restore point (as in Step 1.3).
3. Verify the artifact pin (below) — hash mismatch → STOP.
4. Apply `supabase/launch/prepared/0149_view_and_function_exposure_hardening.prepared.sql`
   as migration `0149_view_and_function_exposure_hardening` via the
   migration-recording path. Grants/ACL DDL only.
5. Run `supabase/launch/prepared/0149_live_readback_verification.sql`
   (conditions 6 + 7: view privileges, anon directory SELECT preserved,
   narr_auto_evidence locked to owner/trigger context, five helpers
   authenticated-only, no PUBLIC execute on the six functions, hardened global
   postgres default ACL, new-function probe). Any exception → STOP; if the
   cause is 0149 itself, roll back with its rollback file (same authority,
   reason recorded).
6. Re-run the P0 regression: `0148_live_readback_verification.sql` live
   (expect the Step-3 read-back results unchanged), and the full 36-assertion
   battery on the isolated replay/staging copy (rehearsed result: 36/36 after
   0149).

**0149 artifact pin:** see "Artifact pins" below.

Rehearsal evidence (isolated replay, 2026-09-14): applied clean; G3-F1/F3
exploits refuted; read-back 6a–6f, 7, 7b all pass; battery 36/36.

## Artifact pins

| Artifact | Commit | SHA-256 |
|---|---|---|
| `0148_...prepared.sql` | `f4646ea23ac39a54dc1bd7fa1fcc69a32780b476` | `277824917102dcb74427a66b413c9232f69a39fc169f2fa8404ce326c1d371f4` |
| `0149_...prepared.sql` | `2a1c2e5a57c5e9a766b6a8bc81502d9abbb3b71f` | `512f4624ee7c6e13b8fe08c5cc5b27d76b44f9b8e51d5bc017637db91edef174` |
| `0147_shared_intake_workflow.prepared.sql` (REVISED) | `da6ecb711f7e59cdb9b29f4daf943dbffb7c1c21` | `6af374bd597b58637159f1dfa623812a54c616d752a5f5d6c095336052b95e2c` |
| `0150_intake_consent_evidence.prepared.sql` (**APPLICATION HELD** — decision 7) | `2f1a3df5999e3f3090d1a885ce27cc4f8548f116` | `8bf8159f1d98e81adce9ab29c143350412172016427b135495dea72a2516ca6c` |
| `0151_strict_classification_semantics.prepared.sql` (APPROVED, sequenced behind held 0150) | `2f1a3df5999e3f3090d1a885ce27cc4f8548f116` | `6109e4658b43c67fd6a1bf3109e182b1934e137d86ac0c4685a23ea9180a442d` |

The 0149 pin above supersedes the interim `8e287b5…` reference in the
authorization message: condition 7 required amending the default-privilege
statement to the working global `FOR ROLE postgres` form, so the reviewed
artifact is the `2a1c2e5…` version (amendment rationale in the decision
record, decision 4). Applying the `8e287b5` version would harden nothing —
its schema-scoped statement is a no-op against built-in defaults.

## Step 6 — Decision 5: apply REVISED 0147 (shared intake workflow)

Authorized 2026-09-15 (decision record §9, decision 5), **strictly after Steps
2–5 all pass** (0148 + read-back, fixture revocation, 0149 + read-back). The
pre-revision PR #7 edition is REJECTED FOR ACTIVATION AS WRITTEN — never
substitute it.

1. Ledger re-check: expect exactly the post-0149 state (tail =
   `0149_view_and_function_exposure_hardening`). Any drift → STOP.
2. Confirm the restore/PITR point.
3. Verify the 0147R artifact pin (table above) — mismatch → STOP.
4. Apply `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`
   as migration `0147_shared_intake_workflow` via the migration-recording
   path. Apply it alone. (Ledger note: version timestamps order the ledger;
   the 0147 number is its design name, landing after 0148/0149 by design.)
5. Run `supabase/launch/prepared/0147_live_readback_verification.sql` —
   definitions carry the canonical boundary; every login-linked fixture actor
   holding a privileged role fails both intake predicates; production
   coordinators/platform admins pass. Any exception → STOP (rollback file
   available under the same authority; reason recorded).
6. Regression: re-run `0148_live_readback_verification.sql` and, on the
   isolated replay/staging copy, BOTH suites —
   `p0_classification_isolation_negative_tests.sql` (36 assertions) and
   `p0_intake_classification_negative_tests.sql` (25 assertions).
   Rehearsed results: 36/36 and 25/25.
7. NOT covered by this step: any Edge Function redeploy (lead-intake's
   updated receiver waits on its own deployment gate + SUPA-FN-001), PR
   merges, R1, Cloudflare/DNS/Wix, identity/role or data changes.

**Standing static-review control (post-0149):** every client-callable function
in 0147+ migrations carries an intentional `GRANT EXECUTE`; trigger/internal
functions carry none. `scripts/verify-0147-prepared.mjs` enforces this
generically for 0147R; keep the same sweep in every future prepared-migration
guard.

## Steps 7–8 — 0150 (HELD) and 0151 (approved, sequenced): NOT part of the
## immediately executable sequence

**The immediately executable live sequence ends at Step 6.** Decision 7 holds
0150's application until the hardened-receiver conditions are met (see the
decision record — SUPA-FN-001-proven receiver, fail-closed consent, no
uncontrolled null-evidence window), and 0151 — although APPROVED — follows
0150 in the ratified lineage and is not applied ahead of it without a
separate sequencing/renumbering decision.

When the receiver-activation program later reaches these steps:

**Step 7 — 0150** (only under its reconsideration approval): ledger re-check;
restore point; hash pin (table above); apply alone; verify all pre-existing
rows still carry NULL evidence columns (LEGACY-UNKNOWN — expected live
baseline: 3 rows, consent_to_contact true, evidence NULL); then the hardened
receiver activates with the accepting gate closed, and HTTP/E2E proves
consent enforcement + atomic evidence stamping.

**Step 8 — 0151** (decision 7 conditions):
1. Zero-missing checks — BOTH must return 0, else STOP AND INVESTIGATE
   (never backfill/classify to make the migration pass):
   ```sql
   select count(*) from recoveryos.people p
    where p.auth_user_id is not null
      and not exists (select 1 from recoveryos.person_classification pc
                      where pc.person_id = p.id);
   select count(distinct p.id) from recoveryos.people p
     join recoveryos.role_assignments ra
       on ra.person_id = p.id and ra.revoked_at is null
    where p.auth_user_id is not null
      and recoveryos.is_privileged_role(ra.role_key)
      and not exists (select 1 from recoveryos.person_classification pc
                      where pc.person_id = p.id);
   ```
2. Signup provisioning still classifies:
   ```sql
   select position('person_classification' in
     pg_get_functiondef('recoveryos.handle_new_auth_user()'::regprocedure)) > 0;
   ```
3. same_world consumer audit — re-run LIVE; every row must pair with an
   independent production-privileged predicate/self-scope (prepared-lineage
   result, 2026-09-15: exactly `list_open_support_requests` [is_support_staff]
   and `claim_support_request` [is_coach_staff / is_navigator_staff]; no
   policies). Any unguarded cross-person path → STOP:
   ```sql
   select n.nspname||'.'||p.proname
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('recoveryos','public') and p.prokind = 'f'
     and p.proname <> 'same_world'
     and pg_get_functiondef(p.oid) like '%same_world%'
   union all
   select schemaname||'.'||tablename||' policy '||policyname
   from pg_policies
   where coalesce(qual,'') like '%same_world%'
      or coalesce(with_check,'') like '%same_world%';
   ```
4. Apply 0151 alone (hash pin above); then the 17-assertion strict battery +
   P0 36/36 + intake 25/25 on the isolated copy; verify production staff
   access, unclassified fail-closed, no unclassified fan-out, participant
   plane intact. STOP on any failure. Rollback:
   `0151_strict_classification_semantics.rollback.sql` (restores lenient
   semantics — record the reason).

## Step 9 — Close out

- Re-run Step 3's script once more (fixture loop will now check 0 actors —
  its warning at that point is expected and correct).
- Record in the decision record: apply timestamp, ledger version, read-back
  counts, revocation counts, operator.
- Update gate G2: FAIL → PASS pending the full G3 audit (G2's negative-test
  live evidence = Step 3 output; the exhaustive surface audit remains G3).
