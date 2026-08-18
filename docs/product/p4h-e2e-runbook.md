# P4H Live HTTP/E2E Gate — Runbook

The browser harness lives in `apps/platform/e2e/`. The `local` project runs anywhere
(accessibility, PWA, mobile — no backend egress needed). The `live` project is the
P4G §AN / P4H §13 gate items 1–30 against RecoveryOS-Launch and **requires real egress**.

## Running via GitHub Actions (P4H-G1 — preferred path)

The **Live HTTP gate** workflow (`.github/workflows/live-gate.yml`) runs the whole procedure
below automatically on an egress-capable runner: it seeds/refreshes the fixtures server-side,
builds against RecoveryOS-Launch, and runs the live suite (MODE A: runner-local build;
MODE B: pass `base_url` = the staging URL). Trigger it from the Actions tab (Run workflow on
the build branch) or by pushing a `live-gate/<n>` branch. **Requires the repository secret
`SUPABASE_SERVICE_ROLE_KEY`** (fixture seeding only — never in the browser); optional
`P4H_E2E_PASSWORD` (else a per-run random password is generated and masked). Repository
variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` may override the canonical fallbacks.
With CI seeding in place, the manual SQL seeding section below is only needed for laptop runs
without the service key. Staging deploys go to the non-production `recoveryos-staging` Worker
(`wrangler.staging.jsonc`) — never the production-candidate Worker, never vrcc.app.

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

## G1 execution record (2026-08-09)

The gate is proven end-to-end from GitHub Actions. Working procedure: Actions → "Live HTTP
gate" → Run workflow on `claude/grace-coaching-audit-b0fyhq` (MODE A default; set `base_url`
to the staging Worker URL for MODE B). The job binds the `p4h-live-gate` environment for
`SUPABASE_SERVICE_ROLE_KEY`.

| Run | Commit | Mode | Result |
|---|---|---|---|
| 31286505439 | 0edbca8 | A | selector bring-up (claims/links fixed) |
| 31286713291 | a37744d | A | realtime instrumented; found email 400 + disabled-submit |
| 31286984456 | fbf1fde | A | **items 3–30 green** (18 passed / 1 BLOCKED) |
| 31287126835 | fbf1fde | B (staging) | **deployed artifact green** (18 passed / 1 BLOCKED) |
| 31287322800 | 3c2436b | A | found booking-RPC 42501 (→0121) + ink-faint contrast |
| 31287634194 | 7eada32 | A | found thread keyboard-scroll; post-accept copy fixed |
| 31287827636 | 7d0b9de | A | **FULL GREEN: 26 passed / 1 BLOCKED** (items 3–30 + scheduling 8/10 + §14 a11y ×7 roles) |

Suite now also includes `live/04-authenticated-a11y.spec.ts` (§14: axe WCAG 2.x A/AA across
all seven role workspaces; serious/critical fail the gate) and a dedicated scheduling test in
`live/01-auth-connection.spec.ts` (items 8/10 — offer → choose → completion, ~90 s deliberate
wait for the start instant).

Item 1–2 (real signup) reports BLOCKED until the email posture is fixed (production SMTP or
confirmations off): default SMTP rate limit `over_email_send_rate_limit` and GoTrue
deliverability rejection `email_address_invalid` were both observed live.

Platform defects fixed from gate evidence: 0120/0120b classification symmetry,
0121 booking-RPC grants (preflight now guards the whole client RPC surface),
ink-faint contrast token, keyboard-focusable message log. Details in
`p4h-production-hardening-soft-launch-report.md` (G1 section).
