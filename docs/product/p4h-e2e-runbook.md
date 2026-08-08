# P4H Live HTTP/E2E Gate — Runbook

The browser harness lives in `apps/platform/e2e/`. The `local` project runs anywhere
(accessibility, PWA, mobile — no backend egress needed). The `live` project is the
P4G §AN / P4H §13 gate items 1–30 against RecoveryOS-Launch and **requires real egress**.

## Why the gate did not run in the P4H automation environment

The execution container's organizational egress policy answers **403 to CONNECT** for
`cqcxvwoukyhxyokfwnjm.supabase.co:443` (verified 2026-08-08; the proxy status endpoint records
`connect_rejected` for that host). Per policy guidance this is reported, not routed around.
**Remedy — either:**
1. run the suite from a machine/CI with ordinary internet egress (a developer laptop works), or
2. recreate the remote environment with a network policy that allows `*.supabase.co`.

## Prerequisites

1. **Egress** to `*.supabase.co` (REST, Auth, and Realtime websocket).
2. **Fixture identities seeded and classified** (below). Never run against real participants.
3. Environment variables:
   - `RECOVERYOS_E2E_LIVE=1` (opt-in; without it every live spec self-skips)
   - `P4H_E2E_PASSWORD=<one strong shared fixture password>`
   - `P4H_E2E_EMAIL_DOMAIN=fixtures.recoveryos.test` (default)
   - optionally `PLAYWRIGHT_CHROMIUM_PATH` if not using the preinstalled browser.

## Fixture seeding (run once, as a platform admin / SQL editor)

The stable identities sign up through the REAL flows the first time the gate runs
(registration is itself gate item 1); invitations created by `p4h-admin` grant the staff
roles through the real invite→signup path (items 24–25). Seed only the two bootstraps the
flows cannot create for themselves, then classify everything:

```sql
-- 1) Pre-authorize the admin fixture (the one bootstrap grant), using the
--    real invitation machinery so signup provisions it:
select recoveryos.create_staff_invitation(
  'p4h-admin@fixtures.recoveryos.test',
  array['administrator']::recoveryos.role_key[], 'staff', null, null, 30,
  'P4H live-gate fixture');
-- (run as an existing platform admin; the very first admin on a fresh
--  project is provisioned via the documented SQL-editor bootstrap instead)

-- 2) After each fixture signs up, classify it OUT of production evidence:
insert into recoveryos.person_classification (person_id, classification)
select p.id, 'test_fixture'
from recoveryos.people p
join auth.users u on u.id = p.auth_user_id
where u.email like 'p4h-%@fixtures.recoveryos.test'
on conflict (person_id) do update set classification = 'test_fixture';
```

Repeat step 2 after runs that mint fresh `p4h-*-<timestamp>@…` identities
(invitation/signup tests). A cleanup pass may also revoke roles granted to timestamped
identities. Fixture classification is what keeps every gate run out of
`admin_evidence_summary` — verify with the §27 evidence-reconciliation snapshot
(compare summary values before/after a run; production counters must not move).

## Running

```bash
cd apps/platform
pnpm build
RECOVERYOS_E2E_LIVE=1 P4H_E2E_PASSWORD=… pnpm exec playwright test --project=live
pnpm exec playwright test --project=local     # a11y/PWA/mobile, no egress needed
```

Traces and screenshots are retained on failure (`test-results/`). Expect the first live run
to need selector adjustments — the specs were authored against the current UI without a
reachable backend, and Playwright's failure traces make drift quick to fix. That is normal
harness bring-up, not architectural failure.

## Item → spec map

| Items | Spec |
|---|---|
| 1–3 auth, bootstrap, role routing | `live/01-auth-connection.spec.ts` |
| 4–10 connection/coaching, realtime, completion | `live/01-auth-connection.spec.ts` |
| 11–16 navigation loop | `live/02-navigation-residence.spec.ts` |
| 17–23 residence | `live/02-navigation-residence.spec.ts` |
| 24–30 governance + denials + triage | `live/03-governance.spec.ts` |
| 31 final contract | not a browser test — rerun `supabase/launch/preflight/launch_contract_check.sql` **and** both Supabase advisors after all fixes land |

## After the gate passes

Only then, in order (each separately evidenced):
1. **Polling retirement** (§16): with item 9 green, remove/loosen the 15–20 s messaging and
   notification polls, keeping reconnect/tab-focus refetch; verify socket, reconnect, focus,
   sleep/wake, and network-transition behavior before merging.
2. **Reminder cron 0104 activation** (§17): prerequisites are items 1, 7, 8, 9 green. Activate,
   observe one full cycle on fixture appointments (seed → due-selection → exactly one
   notification → idempotent second run; reschedule cancels/reseeds; cancellation suppresses).
   Any defect → disable immediately, fix, repeat. Record scheduler config + run evidence.
3. Evidence reconciliation snapshot (§27) and the soft-launch observation plan.
