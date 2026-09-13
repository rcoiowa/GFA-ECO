> **Historical terminology notice (2026-09-13):** "Companion"-based Grace labels and identifiers below are preserved as dated evidence. The current canonical identity is **Grace — AI Support Navigator** (`docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`).

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

## A. Archive/export manifest — COMPLETE (verified after dev-project restore)

Private Google Drive folder **`RecoveryOS Pre-Launch Archive 2026-08-07`** (folder id
`1UlaQh1b6O8l1rKOXJCHJ9q5BcschLEsd`), 19 files, every upload byte-verified against the staged
export (the mid-phase pause, it turns out, happened **after** all uploads had landed — nothing
was lost; re-verified against the restored project):

- `auth_users_inventory_v2.json` (**authoritative**, Drive id `1tuiKQs0E75Dhj2pOEjrpMTrV-iQp5NBK`) —
  **27** auth users with full canonical/v2 correlation, fresh re-export, byte-verified.
  The original `auth_users_inventory.json` is retained for audit but **SUPERSEDED**.
  *Discrepancy resolution (acceptance-gate item):* the earlier manifest said "26 rows"; a
  re-export and bidirectional diff proved the original file always held all 27 rows with
  identical identity triples — the "26" was a manual tally error in the exporter's progress
  notes, not a dropped row. Live DB re-verified: 27 users, zero deleted. Final count **27/27**;
  no real or potentially-real identity is missing; the 11-contact outreach file was independently
  verified 11/11.
- `outside_signup_contacts.json` — all 11 outside-signup profile rows (the outreach dataset).
- `reference_data` (3 parts) — 17 tables incl. slogans 59, resources 34, crisis 8, v2 resources
  5, service_types 12, consent_types 8, NARR 82, Iowa 7, doc templates 20 + versions 21, org/
  programs/residences/curfew/chores.
- `transactional_data` (2 parts) — 36 tables, the complete transactional universe (check-ins,
  appointments, consents, service events, identity/role/crosswalk/migration-state records).
- `legacy_migration_ddl_history` (11 parts) — all **158** dev migrations with full SQL
  statements: the entire legacy DDL lineage (gravrcc/gfa/v2/grace_house/recoveryos) is preserved
  even though it never lived in git.
- `runtime_manifest.json` — cron (1 job), storage (voice-notes bucket, 1 object metadata),
  PostgREST schema exposure, telemetry counts (session_events 1548 / funnel_events 232 —
  deliberately counts-only).

Remaining operator steps (optional belt-and-braces): dashboard `supabase db dump` of the dev
project; download of the single voice-note object. Git commits that reconstruct the canonical
system: `fd52e44`/`5f34364` on `claude/grace-coaching-audit-b0fyhq`.

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

## E. Seed inventory and counts — COMPLETE (acceptance gate PASSED)

Seed package `supabase/launch/seed/0200–0203` committed and applied. **Three-way chain verified
for every dataset (dev source → committed seed → launch target), applied twice (idempotency
proof — identical counts, no duplicates, sequences aligned via `setval`, all 21 document bodies
md5-identical to source after both passes), zero orphans:**

| Dataset | source → seed → target |
| --- | --- |
| organizations / programs / residences | 1→1→1 · 2→2→2 · 2→2→2 |
| service_types / consent_types | 12→12→12 · 8→8→8 (were empty pre-seed — dev rows had been data-seeded outside the migration set; now seeded with dev ids preserved) |
| curfew / chores | 7→7→7 · 2→2→2 (residence FKs resolved by name, not id) |
| document templates / versions | 20→20→20 · 21→21→21 (bodies checksum-verified) |
| slogans | 59→59→59 (distinct slogan_text = 59) |
| unified resources | **47→47→46** — reconciliation decision: one exact lower(name) collision ("SAMHSA National Helpline", gen1 vs crisis) deduped in favor of gen1; the two differently-named 988 entries were deliberately both kept (exact-key policy, no fuzzy matching). Breakdown: gen1 34 + crisis 7 + v2 5; is_crisis=true 7 |
| NARR / Iowa checklist | 82 · 7 (from base migrations; matched source, not re-seeded) |
| staff_preauthorizations | 1 (owner admin) |

**Pinned identifiers verified verbatim (gate item 2):** org 1 = "Grace For Addictions"
(recovery_support) · program 1 = `vrcc` "Virtual Recovery Community Center" (program 2 =
`anchor`) · service_type 1 = `coaching_session` (full 12-key list recorded) · consent_types
1–8 = terms_of_use…analytics. Recorded as **technical debt** (not changed now): canonical RPCs
default to org 1 / program 1 / service_type 1 — parameterize post-launch rather than relying on
magic ids. Apply-detail note: the five largest document bodies (~80KB) exceeded a single
migration-call payload and were applied via `execute_sql` using the exact statements from the
committed file (checksummed); the committed file is the complete canonical seed.

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

## R. Blocker status — RESOLVED / CURRENT / PENDING

**RESOLVED (history preserved for the record):**
- ~~Dev project paused mid-phase~~ → owner restored it (2026-08-08); it is ACTIVE_HEALTHY, legacy
  surfaces (vrcc.app mvp, coaching SPA) are back online, and it remains the live archive source.
- ~~Free-plan limit blocking restore~~ → mooted by the restore.
- ~~Archive incomplete~~ → verified complete, 20 files incl. authoritative
  `auth_users_inventory_v2.json` 27/27 (§A).
- ~~Reference seeds blocked~~ → complete and acceptance-verified (§E).
- ~~Auth 27-vs-26 discrepancy~~ → tally error in exporter notes; no row was ever missing (§A).
- ~~Wix repoint~~ → not a dependency; native Wix form + its multi-email notifications stay (§T).

**CURRENT (accurate as of this verdict):** launch backend seeded + acceptance-passed; dev
project ACTIVE as the pre-launch archive and legacy runtime; no cutover action taken.

**PENDING — these gate SOFT LAUNCH / PUBLIC CUTOVER (not P4 development):**
1. HTTP harness green against the launch project (K) — DB-VERIFIED is sufficient to build;
   HTTP-VERIFIED is required before cutover.
2. Reminder cron activation (`0104`) — ENGINE VERIFIED · CRON READY, NOT YET ACTIVATED
   (deliberately held for the deployment/HTTP-validation gate).
3. apps/platform built + staged (P4 outcome).
4. vrcc.app repoint (S) — explicit authorization required.
5. Deliberate dev-project freeze at cutover (U) and legacy-worker retirement after the
   observation window (V) — explicit authorization required.

## S. vrcc.app cutover runbook (DO NOT EXECUTE without authorization)

1. Preconditions green: §E seeds, §K harness, 0104 applied, apps/platform built + staged on
   `recoveryos-staging`, canary disabled. 2. Deploy apps/platform production build to the
   `gfa-eco-recovery-residence-os` worker (or dedicated worker) with launch-project env.
3. Repoint `vrcc.app` DNS/route to that worker. 4. Smoke: register → onboard → request support →
   book → confirm → reminders → meeting → notifications, as the owner + one controlled account.
5. Leave legacy workers up but unrouted for the observation window; then retire (§V).

## T. Wix continuity — REVISED per owner input (no longer a cutover blocker)

Owner clarification (2026-08-08): the Supabase-posting form was **never actually embedded** in
the Wix site — the live inquiry flow is the **native Wix form**, whose notifications already go
to multiple staff emails, and the org also runs a **Wix members app** with an existing member
base. Decisions that follow:

1. **Keep the native Wix form as-is.** Its multi-email staff notifications continue working with
   zero dependency on either Supabase project. The "Wix repoint" item is therefore REMOVED from
   the cutover blockers — nothing breaks at cutover.
2. **Optional enhancement (any time, not launch-gated):** add a Wix Automation "send via
   webhook" step so submissions are ALSO posted to
   `https://cqcxvwoukyhxyokfwnjm.functions.supabase.co/lead-intake` (header
   `x-lead-secret: <secret>`; legacy field `pathway_interest` accepted). That lands each inquiry
   in `recoveryos.leads` + in-app staff queue **alongside** the existing emails — additive, not a
   replacement. Requires setting `LEAD_INTAKE_SECRET` first; test with one submission.
3. **Wix app as "front door": yes for community, no for care.** Recommended split — Wix remains
   the public front door (marketing, inquiry form, community/member engagement for the existing
   Wix member base), with prominent links into the RecoveryOS platform (vrcc.app) where
   participants register/sign in for the actual recovery workflows. Wix membership must NOT
   become the identity system for recovery data: check-ins, coaching, consents, and residence
   records need the `auth.users → people → role_assignments` chain, RLS, and consent boundaries
   that a marketing platform cannot provide. Wix members who become participants simply register
   in RecoveryOS (one extra sign-up); no SSO bridge is warranted at this stage.

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

# VERDICT: **GO — READY TO BUILD/FINISH APPS/PLATFORM**

The Launch Foundation Acceptance Gate passed in full on 2026-08-08:
bootstrap proven **33/33 from an empty database**; seeds complete with **three-way chain
verification, double-apply idempotency, checksummed document bodies, zero orphans**; pinned
identifiers proven verbatim (org 1 / vrcc program 1 / coaching_session 1); launch project
re-verified **fully legacy-free** (0 public tables, 0 scaffolding, 0 legacy schemas/functions/
triggers); archive complete + authoritative (27/27); the **full rolled-back acceptance chain**
passed against the seeded project (auth → person → role → support request claim → one active
primary relationship → booking → proposal → one appointment with idempotent double-accept →
reminder seeding/reschedule/suppression → deduped notifications → cancellation) with **zero
residue**; security advisors clean; one deliberate admin identity.

**This verdict authorizes exactly one thing: P4 product development** — building the unified
`apps/platform` experience (/vrcc /coach /navigator /residences /admin) against the
RecoveryOS-Launch backend, canonical services only.

**It does NOT authorize:** public cutover · vrcc.app DNS repoint · pausing/deleting the
archive/dev project · retiring legacy workers · reminder-cron activation · treating HTTP
verification as complete (it is the soft-launch gate, §R-PENDING). The backend-migration track
STOPS here; the next directive is P4 — RECOVERYOS PRODUCTION EXPERIENCE.
