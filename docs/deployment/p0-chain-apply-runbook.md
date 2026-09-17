# P0 chain apply runbook — classification authorization isolation and sequels

> **REVISION 2 (2026-09-16) — EXECUTION GATED ON THE REV-2 APPROVAL PACKET.**
> Per executive direction (2026-09-14 independent verification + returned
> corrections), the prepared chain was renumbered to match the ratified apply
> order — P0 isolation is now **0147**, exposure hardening **0148**, revised
> shared intake **0149** — and revised (grant_role_assignment anti-disclosure
> ordering; 22-identity revocation scope gate; battery expanded to all eight
> privileged role keys). Every pre-revision artifact pin (f4646ea / 2a1c2e5 /
> da6ecb7 / 2f1a3df) is **SUPERSEDED — never apply those artifacts.** Nothing
> in this runbook executes until the rev-2 packet
> (`docs/decisions/2026-09-16-p0-approval-packet-rev2.md`) is approved and its
> pins confirmed. The ledger sequence is now strictly monotonic:
> 0146 (live tail) → 0147 → 0148 → 0149 → (later, together, under the
> receiver-activation program) 0150 → 0151.

**Authority:** executive authorization recorded 2026-09-14/15 in
`docs/decisions/2026-09-14-p0-classification-authorization-isolation.md` §9,
carried forward onto the renumbered/revised artifacts ONLY once the rev-2
packet's decisions are approved.
**Scope:** exactly the approved mutations below, nothing else. No R1
implementation, no PR #7 content, no domain/DNS/Wix/Worker/function changes,
no unrelated identity/role or data writes. **Stop and report on any failed
step; do not improvise around a failed gate.**

**Approved artifact identity (verify before applying):** see the
**Artifact pins** table below — every artifact is pinned by path + SHA-256 at
the rev-2 commit. If the checked-out file's hash differs, STOP — the artifact
drifted from what was reviewed and approved.

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

Apply the prepared file as migration `0147_classification_authorization_isolation`
through the migration-recording path (MCP `apply_migration` with that name, or
`supabase migration up` equivalent), so the ledger gains the 0147 row. Content
must be byte-identical to the approved file. Function DDL only — no
table-structure changes and no row-data mutations.

## Step 3 — Live read-back verification (required before anything else)

Run `supabase/launch/prepared/0147_live_readback_verification.sql` on an
admin SQL connection. It is transaction-wrapped, rolls back, prints aggregate
counts only, and raises on failure. Expected: guard checks pass; every
login-linked fixture actor holding an active privileged role shows
`still privileged=0`; production admins show `lost access=0`. Baseline
expectation: **22 fixture actors checked** (the 2026-09-14 independent
verification: 22 distinct login-linked fixture actors, 22 active privileged
assignments — 17 coach, 1 administrator, 1 executive, 1 navigator,
1 residence_manager, 1 residence_staff); the script warns on any other count —
reconcile before Step 4. Any exception → STOP, report, and if the cause is the
migration itself, roll back using
`0147_classification_authorization_isolation.rollback.sql` (same authority;
record the reason).

Rehearsal evidence (isolated replay, 2026-09-16, rev-2 artifacts): read-back
passed with `fixture checked=22, still privileged=0; production admins
checked=1, lost=0` on the 22-identity rehearsal dataset.

## Step 4 — Decision 2: revoke existing privileged fixture assignments

Only after Step 3 passes. Run
`supabase/launch/prepared/p0_fixture_role_revocation.gated.sql`:

1. Its **scope preview** (first statement) prints aggregate counts by role —
   show these to the decision owner and confirm they match the **approved
   scope from the 2026-09-14 independent verification: 22 distinct
   login-linked fixture actors, 22 active privileged assignments — coach 17,
   administrator 1, executive 1, navigator 1, residence_manager 1,
   residence_staff 1.**
2. The revocation section refuses to run if 0147 is absent, if zero
   login-linked production platform administrators would remain, or (rev 2)
   **if the live scope differs in any way from the approved 22/22 per-role
   aggregates** — drift means reconcile and obtain a fresh scope approval,
   never improvise. It sets `revoked_at` (never deletes), writes one
   `role.revoked` audit row per assignment citing this authorization, and
   aborts wholesale if its post-condition (zero active privileged fixture
   assignments) fails.

Rehearsal evidence (isolated replay, 2026-09-16, rev-2 artifacts): on the
22-identity rehearsal dataset the preview showed the exact approved
aggregates; scope gate passed; 22 revoked, 22 audit rows, post-condition
pass; an immediate re-run correctly REFUSED at the scope gate (0 ≠ 22).

## Step 5 — Decision 4: apply 0148 (G3 exposure hardening)

Authorized 2026-09-14 (decision record §9, decision 4), **sequenced after
Steps 2–3 pass**. Do not combine with anything else.

1. Re-check the ledger: expect exactly the post-0147 state (tail =
   `0147_classification_authorization_isolation`). Any unexpected migration or
   drift → STOP and report.
2. Confirm the restore point (as in Step 1.3).
3. Verify the artifact pin (below) — hash mismatch → STOP.
4. Apply `supabase/launch/prepared/0148_view_and_function_exposure_hardening.prepared.sql`
   as migration `0148_view_and_function_exposure_hardening` via the
   migration-recording path. Grants/ACL DDL only.
5. Run `supabase/launch/prepared/0148_live_readback_verification.sql`
   (conditions 6 + 7: view privileges, anon directory SELECT preserved,
   narr_auto_evidence locked to owner/trigger context, five helpers
   authenticated-only, no PUBLIC execute on the six functions, hardened global
   postgres default ACL, new-function probe). Any exception → STOP; if the
   cause is 0148 itself, roll back with its rollback file (same authority,
   reason recorded).
6. Re-run the P0 regression: `0147_live_readback_verification.sql` live
   (expect the Step-3 read-back results unchanged), and the full 64-assertion
   battery on the isolated replay/staging copy (rehearsed result: 64/64 after
   0148).

**0148 artifact pin:** see "Artifact pins" below.

Rehearsal evidence (isolated replay, 2026-09-16, rev-2 artifacts): applied
clean; read-back 6a–6f, 7, 7b all pass; battery 64/64 after 0148. (The
2026-09-14 rehearsal additionally refuted the G3-F1/F3 exploits on the
pre-renumbering, content-identical hardening statements.)

## Artifact pins (REV 2 — pending rev-2 packet approval)

Content SHA-256 of each prepared file at the rev-2 commit (the rev-2 packet
records the exact commit; verify both before applying). **All pre-revision
pins (f4646ea / 2a1c2e5 / da6ecb7 / 2f1a3df) are SUPERSEDED.**

| Artifact                                                                         | SHA-256 (rev 2)                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `0147_classification_authorization_isolation.prepared.sql`                       | `2913d1446d37fddd32d7a9400aff0b28b79d6f6251cc8cfa3a4a3e1e07636182` |
| `0148_view_and_function_exposure_hardening.prepared.sql`                         | `ce763899ed3c47a87d1fd62dc35c05f362bb2cf8f19832c47635482c8e4a8093` |
| `0149_shared_intake_workflow.prepared.sql` (revised edition, formerly 0147R)     | `f701f2714e0ebc6c70ab111d486c48559edc65d6e0965170b2243f75467def27` |
| `0150_intake_consent_evidence.prepared.sql` (**APPLICATION HELD** — decision 7)  | `0579a59611234fa26a9f05aa8698cbbb08e24b4faeca25d87f42e9482f0d6619` |
| `0151_strict_classification_semantics.prepared.sql` (sequenced behind held 0150) | `a6f119f25adc03fae7ed086cd43ef884d73f40c985d3a98272c685731e44af33` |

Renumbering provenance: 0147 (P0 isolation) was prepared as 0148 @ f4646ea;
0148 (exposure hardening) was prepared as 0149 @ 2a1c2e5 — that artifact
already carried the condition-7 global `FOR ROLE postgres` default-privilege
amendment, and the earlier `8e287b5` schema-scoped version remains a no-op
that must never be applied; 0149 (shared intake) was prepared as revised 0147
@ da6ecb7. Contents are unchanged apart from the renumbering sweep, the
revision-2 grant_role_assignment ordering (0147 and 0151), and the
revision-2 revocation scope gate.

## Step 6 — Decision 5: apply REVISED 0149 (shared intake workflow)

Authorized 2026-09-15 (decision record §9, decision 5), **strictly after Steps
2–5 all pass** (0147 + read-back, fixture revocation, 0148 + read-back). The
pre-revision PR #7 edition is REJECTED FOR ACTIVATION AS WRITTEN — never
substitute it.

1. Ledger re-check: expect exactly the post-0148 state (tail =
   `0148_view_and_function_exposure_hardening`). Any drift → STOP.
2. Confirm the restore/PITR point.
3. Verify the 0149R artifact pin (table above) — mismatch → STOP.
4. Apply `supabase/launch/prepared/0149_shared_intake_workflow.prepared.sql`
   as migration `0149_shared_intake_workflow` via the migration-recording
   path. Apply it alone. (Rev 2: numbering now matches the apply order —
   0147 → 0148 → 0149 — so the ledger stays strictly monotonic with no
   out-of-order insertion.)
5. Run `supabase/launch/prepared/0149_live_readback_verification.sql` —
   definitions carry the canonical boundary; every login-linked fixture actor
   holding a privileged role fails both intake predicates; production
   coordinators/platform admins pass. Any exception → STOP (rollback file
   available under the same authority; reason recorded).
6. Regression: re-run `0147_live_readback_verification.sql` and, on the
   isolated replay/staging copy, BOTH suites —
   `p0_classification_isolation_negative_tests.sql` (64 assertions, rev 2) and
   `p0_intake_classification_negative_tests.sql` (25 assertions).
   Rehearsed results (2026-09-16): 64/64 and 25/25.
7. NOT covered by this step: any Edge Function redeploy (lead-intake's
   updated receiver waits on its own deployment gate + SUPA-FN-001), PR
   merges, R1, Cloudflare/DNS/Wix, identity/role or data changes.

**Standing static-review control (post-0148):** every client-callable function
in 0149+ migrations carries an intentional `GRANT EXECUTE`; trigger/internal
functions carry none. `scripts/verify-0149-prepared.mjs` enforces this
generically for 0149R; keep the same sweep in every future prepared-migration
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
   P0 64/64 + intake 25/25 on the isolated copy; verify production staff
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
