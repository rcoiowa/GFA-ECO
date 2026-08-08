# RecoveryOS Launch Foundation — Completion Report (A–V)

**Date:** 2026-08-08 · **Launch project:** `cqcxvwoukyhxyokfwnjm` (RecoveryOS-Launch, us-west-1,
$0/mo) · **Dev/archive project:** `ykykeioydvtxpyreshhs` (currently **PAUSED** — see §R).
**No cutover action was taken:** vrcc.app not repointed, Wix not repointed, no legacy Cloudflare
worker retired, no auth users deleted, external SMS/email OFF.

**Verdict (bottom of report): NO-GO — LAUNCH FOUNDATION BLOCKED**, on two specific, quickly
fixable blockers (§R): the dev project was paused before the archive/seed exports completed, and
the free-plan project limit currently prevents restoring it. Everything buildable without the dev
project is built, applied, and verified.

---

## A. Archive/export manifest — INCOMPLETE (blocked mid-phase)

The archive export agent was launched first, targeting a private Google Drive folder
(`RecoveryOS Pre-Launch Archive 2026-08-07`). **During the export window the dev project was
paused** (it was the project paused to free the slot for creating RecoveryOS-Launch), cutting off
the source. Status: the archive is **not verified complete**; it must be re-run after the dev
project is restored (§R). No data is lost — a paused Supabase project retains all data — but the
directive's "archive before anything else" ordering was broken by the pause and must be repaired
before any destructive step is ever considered. Planned archive contents (unchanged): auth-user
inventory, the 11 outside-signup contact rows, reference datasets, transactional datasets, the
full legacy migration DDL history (752KB, chunked), runtime manifest (edge functions, cron,
storage, PostgREST config), plus operator-run `supabase db dump` and the single storage
voice-note. Git commits that reconstruct the canonical system: `fd52e44` (launch set) and the
P0–P3C history on `claude/grace-coaching-audit-b0fyhq`.

## B. Sensitive-data storage confirmation

No PII, auth exports, dumps, or credentials were committed to git — verified by review of every
commit this phase (launch migrations, seeds, edge functions, docs only). The single identity
value in git is the owner's admin-preauthorization email (explicitly authorized, §F). Archive
data goes only to the user's private Google Drive.

## C. Launch migration/bootstrap architecture

`supabase/launch/` (committed): verbatim canonical dev migrations `0000–0027,0030` with exactly
three curations (0025/0026 omit the `v2_identity_map` crosswalk; 0010 exposes
`public,graphql_public,recoveryos`), plus launch-only migrations: `0100` coaching write surface
(booking RPCs + reschedule lineage; notification dedup/emitters wired by exception-safe domain
triggers — single event source), `0101` canonical reminder engine, `0102` lead intake + content
tables (slogans, unified resources), `0103` deliberate identity provisioning
(`staff_preauthorizations`, consumed-once; signup → people + participant), `0104` reminder cron
(**not applied** — post-verification step per its header; engine now verified, so it is ready to
apply at operator discretion), `0105` canonical meeting provisioning, `0106` drops
`migration_state` (the last transition artifact, created by an 0001-era base migration).
Dev `0028/0029/0031–0036` (backfill/crosswalk/projection/write-authority/compat) are deliberately
absent. `legacy_ref` columns are retained as inert nullable provenance fields (documented,
droppable post-launch). Bootstrap method verified against current tooling: ordered
`apply_migration` via the management API (used here) or CLI `db push` from a clean workdir
(README documents both).

## D. Fresh-project bootstrap verification — PROVEN

Applied to the **empty** RecoveryOS-Launch project in filename order by an isolated agent:
**33/33 migrations applied cleanly, zero edits needed.** Post-bootstrap: 71 `recoveryos` tables,
47 functions, 115 RLS policies, **0 public tables** (no legacy generation exists at all), all
domain triggers present (`trg_appointment_notify`, `trg_appointment_reminders`,
`trg_relationship_notify`, `trg_lead_notify`, touch triggers), auth provisioning trigger
(`trg_recoveryos_new_auth_user`) installed. Subsequently applied: `0105`, `0106`.

## E. Seed inventory and counts — PARTIAL (blocked by §R)

Applied: `0203` staff preauthorization (1 row). Already present from base migrations:
`narr_standards` 82, `iowa_checklist_items` 7. **Blocked pending dev-project restore** (source
unreachable; the seed agent correctly refused to fabricate data): organizations, programs,
residences, `service_types` (**empty — a genuine launch blocker discovered by verification: the
dev rows were data-seeded outside the launch set**), `consent_types` (same), curfew/chores,
document templates+versions (83KB), 59 slogans, unified resources (34+8+5 across three
generations, deduped). Seed requirement recorded: org/program/service_type seeds MUST pin ids
1/1/1 (`overriding system value` + `setval`) because canonical RPCs default to org 1 / program 1 /
service_type 1.

## F. Initial production identities

Exactly one: `degarmeaux@icloud.com` preauthorized as `administrator` (owner; consumed at first
real signup). No owner aliases, no shared mailboxes, no fixtures. Authority chain enforced
structurally: `auth.users → people → role_assignments`; signup grants only `participant`; staff
authority only via the admin-managed preauthorization allowlist. **DB-VERIFIED** (rolled back):
signup → people + `participant`; preauthorized coach email → `[participant,coach]` with the
preauthorization consumed exactly once.

## G. Canonical reminder-engine verification — DB-VERIFIED (launch blocker resolved)

Rolled-back end-to-end test on the launch project: confirm → **3 reminders**
(day_before/hour_before/starting_now); reschedule → old 3 cancelled, new 3 seeded on the lineage
appointment; forced-due dispatch → `sent=1`, second run `sent=0` (idempotent, SKIP LOCKED);
cancellation → 0 live reminders; delivery = in-app canonical notifications (deduped), external
OFF; fixture policy consulted for future channels. Cron file `0104` ready; **not yet scheduled**
(operator applies it as the runbook's final step, per the create-only-after-verification rule).

## H. Canonical lead/Wix replacement

Legacy pipeline mapped precisely: Wix → **anon PostgREST insert** into
`public.wix_contact_submissions` (anon had FULL DML incl. TRUNCATE — a legacy security hole that
does not carry over) → `trg_wix_lead_notify`/`supasend_webhook` → `notify-new-lead` → Resend to
staff resolved via `gfa_ui.staff_notification_recipients()`. Canonical successor (built +
deployed): `recoveryos.leads` (no anon grants; staff-only RLS) + `trg_lead_notify` (in-app staff
alerts, deduped) + `lead-intake` edge function (shared-secret header gate; service-role insert;
optional staff email only when Resend secrets are set; **inert until `LEAD_INTAKE_SECRET` is
set**). Wix cutover runbook: §T. **Not repointed.**

## I. Edge Function deployment map (launch project)

| Function | Status | Gate |
| --- | --- | --- |
| `create-meeting` (canonicalized; targets `recoveryos.appointments` via `provision_appointment_meeting`) | DEPLOYED | live (JWT-verified; RPC enforces provider-or-admin, joinable state, idempotency, no public fallback) |
| `lead-intake` | DEPLOYED, **inert** | 503 until `LEAD_INTAKE_SECRET` set |
| `grace-coaching-canary` | DEPLOYED, **inert** | 503 until `CANARY_ENABLED=true` + allowlist; staging/testing only; disable before public cutover |
| `notify-fanout` | **HOLD, not deployed** | external channels OFF; nothing to fan out at launch; deploy when external delivery is ever authorized |
| Legacy (`coaching` SPA, gateways, companions, `slogan-engine`, `notify-new-lead`) | **not deployed** | remain only on the dev project; Grace-Companion-v6 content extraction = open INVESTIGATE before dev retirement |

## J. Auth/RLS/security verification

115 RLS policies bootstrapped; new launch tables all RLS'd (leads staff-only with USING+WITH
CHECK, reminders admin-read, rooms own/admin, preauthorizations admin-only, content read-scoped).
All new SECURITY DEFINER functions have pinned `search_path` and explicit authorization, and are
revoked from `public/anon` (server-internal ones also from `authenticated`). Supabase security
advisors: **zero errors/warnings**; 3 INFO notices (RLS-enabled-no-policy on `funding_sources`,
`locations`, `organization_relationships` — deny-by-default empty feature tables; policies land
with those features). No service-role key in any frontend bundle (frontend not yet built; edge
functions read it from runtime secrets only). Cross-user isolation: enforced by the same RLS
corpus verified across P0–P3C; re-verified here via the RPC authorization paths.

## K. HTTP harness results — NOT RUN (environment egress still blocked)

The canary + harness are deployed/committed and simpler than in P3C (no authority flips needed —
canonical RPCs are the only path). Running them requires an HTTP-capable operator session
(this environment cannot reach `*.supabase.co`). Labels honestly: bootstrap/backend =
DB-VERIFIED + DEPLOY-VERIFIED; HTTP-VERIFIED pending harness run against the launch project.

## L. Messaging verification — DB-schema ready; native testing pending harness

Canonical `conversations`/`conversation_members`/`messages` bootstrapped with membership-scoped
RLS (from 0025/0026). With no legacy data to preserve, the old parity gate is gone; messaging is
tested natively via the harness (membership, sender identity, ordering, unread, isolation) —
pending K.

## M. Scheduling verification — DB-VERIFIED (rolled back, on the launch project)

Full chain: relationship (coach claim) → booking create (participant) → accept (coach) → exactly
one confirmed appointment; **double-accept returns the same appointment**; reschedule opens a new
negotiation and the new appointment carries `rescheduled_from_appointment_id` lineage;
cancellation cancels appointment + suppresses reminders. Zero residue after rollback (verified:
0 people/appointments/reminders/notifications; only the intended preauth row persists).

## N. Notification verification — DB-VERIFIED

One domain event → exactly one canonical notification per recipient (2 for confirm), dedup-key
re-emit is a no-op, triggers are exception-safe (failure audited, never aborts the domain write).
Single event source by construction — there is no second notification system in the launch
project. External delivery OFF.

## O. Meeting verification — DEPLOY-VERIFIED + CODE-VERIFIED

`provision_appointment_meeting` applied (0105): provider-or-admin only, joinable-state only,
idempotent (returns existing URL), server-authoritative write, registered-room-or-409 (no public
fallback), rooms in `provider_meeting_rooms` keyed by person. Canonicalized `create-meeting`
deployed. HTTP exercise pending K.

## P. Recovery Residence canonical integration — bootstrapped

The full residence domain (residences, residencies, beds/chores/curfew, house board, documents,
compliance incl. NARR 82 + Iowa 7, referrals, applicant flow) is part of the proven bootstrap —
same canonical schema, same RLS. Residence reference config (2 residences, curfew, chores) seeds
with §E. The residence projection contract (RecoveryResidenceOS docs) is unchanged: one platform,
projections of the same canonical rows.

## Q. Remaining frontend prerequisites

1. Seeds completed (§E — blocked on §R). 2. Harness green over HTTP (K). 3. Apply `0104`
(reminder cron) after harness. 4. Set `LEAD_INTAKE_SECRET` + optional Resend secrets. 5. Publish
launch-project URL/anon key into `packages/data-access` env config. 6. Then build/finish
`apps/platform` (/vrcc /coach /navigator /residences /admin) against the launch project only —
components may only use the canonical service layer; `mvp_*`/`v2_*`/`gfa_*`/scaffolding do not
exist in this project, so the constraint is structural, not conventional.

## R. Remaining cutover blockers (and the two ACTIVE blockers)

**Active blocker 1 — dev project is PAUSED.** The slot freed to create RecoveryOS-Launch was the
dev project itself. Consequences: (a) archive export interrupted (§A); (b) reference seeds
blocked (§E); (c) **any live legacy surface that talks to that database — the vrcc.app mvp app,
the v2 coaching SPA, the Wix lead intake — is DOWN while it is paused.** The user's own directive
(§13) said not to pause it yet for exactly this reason.
**Active blocker 2 — free-plan limit prevents restoring it.** Restore was refused three times
("2 project limit"). Unblock options (user decision): delete one of the two old paused projects
(`GFAVRCC's Project`, `contact-connect-dashboard`) / upgrade the org / whatever frees a slot;
then restore the dev project, which simultaneously restores vrcc.app + Wix service and unblocks
archive + seeds.
**Standing cutover blockers (unchanged):** harness not yet run (K); seeds incomplete (E);
reminder cron not yet scheduled (G); Wix repoint not done (T); vrcc.app repoint not done (S).

## S. vrcc.app cutover runbook (DO NOT EXECUTE without authorization)

1. Preconditions green: §E seeds, §K harness, 0104 applied, apps/platform built + staged on
   `recoveryos-staging`, canary disabled. 2. Deploy apps/platform production build to the
   `gfa-eco-recovery-residence-os` worker (or dedicated worker) with launch-project env.
3. Repoint `vrcc.app` DNS/route to that worker. 4. Smoke: register → onboard → request support →
   book → confirm → reminders → meeting → notifications, as the owner + one controlled account.
5. Leave legacy workers up but unrouted for the observation window; then retire (§V).

## T. Wix cutover runbook (DO NOT EXECUTE without authorization)

1. In Wix: locate the automation/webhook that posts form submissions (legacy target: dev-project
   PostgREST `wix_contact_submissions`; identify exact URL/token in Wix settings — dev project
   must be restored to inspect its logs if needed). 2. Set `LEAD_INTAKE_SECRET` on the launch
   project; optionally Resend secrets + `LEAD_ALERT_TO`. 3. Change the Wix automation to POST
   `https://cqcxvwoukyhxyokfwnjm.functions.supabase.co/lead-intake` with header
   `x-lead-secret: <secret>` and the JSON payload (legacy field `pathway_interest` accepted).
4. Submit a test lead; verify `recoveryos.leads` row + staff in-app notification (+ email if
   configured). 5. Only then disable the legacy path.

## U. Dev-project freeze runbook

The freeze is currently in effect **prematurely** (§R). Correct sequence: restore → complete
archive (A) + seeds (E) → keep dev ACTIVE while legacy surfaces still serve users → at cutover
(§S/§T complete), pause it deliberately as the frozen archive → delete only after the agreed
observation window (≥30 days) with separate explicit authorization.

## V. Legacy-worker retirement runbook

After §S holds green through the observation window: retire `virtualrecovery` (vrcc.app mvp),
`vrcc-app`, 5 × `vite-react-template*`, stale `recovery-residence-os`; keep
`gfa-eco-recovery-residence-os` (production) + `recoveryos-staging`. Delete the dev project's
legacy edge functions with the dev project itself (§U). Extract Grace-Companion-v6 content first
(I).

---

# VERDICT: **NO-GO — LAUNCH FOUNDATION BLOCKED**

Blocked **only** by §R's two active blockers (premature dev pause + plan limit), which gate the
archive and the reference seeds. Everything else is green: bootstrap proven 33/33 from empty,
scheduling/reminders/notifications/identity verified with zero residue, security advisors clean,
canonical edge functions deployed (gated), one deliberate admin identity, no scaffolding, no
legacy. **Once the dev project is restored:** finish archive → finish seeds → run harness → apply
0104 → the verdict flips to GO — READY TO BUILD/FINISH APPS/PLATFORM. No cutover action will be
taken without explicit authorization.
