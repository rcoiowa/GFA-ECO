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

## Step 5 — Close out

- Re-run Step 3's script once more (fixture loop will now check 0 actors —
  its warning at that point is expected and correct).
- Record in the decision record: apply timestamp, ledger version, read-back
  counts, revocation counts, operator.
- Update gate G2: FAIL → PASS pending the full G3 audit (G2's negative-test
  live evidence = Step 3 output; the exhaustive surface audit remains G3).
