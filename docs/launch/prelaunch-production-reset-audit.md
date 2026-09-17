> **Historical terminology notice (2026-09-13):** "Companion"-based Grace labels and identifiers below are preserved as dated evidence. The current canonical identity is **Grace — AI Support Navigator** (`docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`).

# Pre-Launch Production Reset Audit (A–S) — GO/NO-GO

**Date:** 2026-08-07 · **Project:** `ykykeioydvtxpyreshhs` · **Method:** read-only inspection of
live Supabase (auth, all schemas, cron, storage, edge functions), GitHub source (both repos), the
P1 Cloudflare deployment map, and the P0–P3C-B4 record. **Nothing was deleted, no authority
changed, the inert canary remains deployed-disabled.**

**The question:** if development-era test users and transactions do not need to be preserved, what
is the cleanest Day-One RecoveryOS production architecture — and is a clean reset safe?

**The answer, up front: GO — clean production reset, executed as a *fresh launch project built
from source-controlled migrations + seeds* (Option B), with the current dev project frozen intact
as the archive.** Evidence below. The destructive plan is specified but **NOT executed**; it awaits
explicit authorization.

---

## A. Current-state inventory

- **Database:** 19 application schemas, ~470 tables across at least six generations:
  gravrcc gen-1 (59 tables in `public`), `mvp_*` (3), `v2_*` (13), `wix_*` (1), the `gfa_*` family
  (~230 tables across 15 schemas incl. a 66-table `gfa_ui`), sandboxes (`ztest` 80, `ds_sandbox` 2),
  and canonical `recoveryos` (69).
- **Actual data is tiny.** The two largest tables are telemetry (`gfa_ui.session_events` 1,544;
  `public.funnel_events` 232). All participant-generated data project-wide: 15 v2 check-ins,
  9 canonical check-ins, 4 canonical appointments, 4 mvp session requests, 2 mvp messages,
  2+2 BARC-10 rows, 1 v2 session request, 1 canonical support request, 18 consent grants,
  12 service events, 15 gen-1 profile rows. That is effectively the whole transactional universe.
- **Auth:** 27 users. **Cron:** 1 job (`vrcc-session-reminders`, */5). **Storage:** 1 object (one
  owner voice-note `.webm` in `voice-notes`). **Edge functions:** 11. **Cloudflare:** 10 workers
  (per P1 map).

## B. Real-user inventory (REAL / PRESERVE candidates)

Eleven outside signups exist. **Every one of them has exactly one auto-created gen-1
`public.participants` profile row and zero transactions** — no check-ins, sessions, messages,
assessments, consents, or service events in any generation:

`samadhist8@yahoo.com` (last sign-in Aug 5), `oryouwannagohome@gmail.com` (Aug 5),
`shawnabyers1979@gmail.com` (Jul 25), `pinklollipop1636@gmail.com` (Jul 26),
`sjfor0123@yahoo.com` (never signed in), `scardenasq3@gmail.com`, `lreed7950@gmail.com`,
`chinoli683@gmail.com`, `t.belz@gmail.com`, `t.belz422@icloud.com`, `a.ousley@icloud.com`.

**What recreating them loses:** one profile row each (name/contact/intake fields) — fully
preservable as a CSV export before reset, re-enterable at re-registration. **No recovery history is
lost because none exists.** The "one or two legitimate users" are in this list (the recently-active
ones — samadhist8, oryouwannagohome, shawnabyers1979 — are the likeliest); the owner should confirm
which to invite back. Classification: **REAL / RECREATE (with contact-export)**.

## C. Test/dev-user inventory

- **ADMIN / DEVELOPMENT (10):** `degarmeaux@icloud.com` (person 4 — owner), `thomas@graceforaddictions.org`
  (person 5), `thomasdegarmeaux@gmail.com` (8), `degarmeaux@rcoiowa.org` (9), `thomas@rcoiowa.org`,
  `vrcc@rcoiowa.org`, `connect@graceforaddictions.org`, `residents@graceforaddictions.com`,
  `davestout@graceforaddictions.org`, `davestout@live.com`. → **RECREATE** on the launch project
  (deliberate roles, one account per human, not five owner aliases).
- **TEST FIXTURE (4):** the `@vrcc-v2.test` demo accounts (persons 10/15/16/17). → **RECREATE
  as staging-only fixtures if desired; never in production.**
- **Named demo (2):** `participant.demo@vrcc.app` (6), `resident.demo@vrcc.app` (7) — classified
  `production` in `person_classification` but demo by name and content. → **DO NOT carry.**
- **SYSTEM / SERVICE:** none found (no service-role auth users).
- **UNKNOWN / INVESTIGATE:** none remaining — all 27 are accounted for above and in B.

## D. Transactional-data inventory (who owns it)

Every transactional row belongs to owner/demo/fixture identities: all mvp sessions+messages →
owner accounts; all 15 v2 check-ins and the 1 v2 session request → `demo-participant@vrcc-v2.test`;
all canonical check-ins/appointments/consents → owner + demo accounts. The 4 pre-existing canonical
appointments (persons 4/5/6) are owner/demo data. **Nothing transactional needs migration.**
Classification: **DELETE AFTER VERIFIED BACKUP** (the backup being the frozen dev project + dump).

## E. Reference/configuration inventory (must survive → SEED)

| Data | Where | Rows | Disposition |
| --- | --- | --- | --- |
| Recovery slogans | `public.recovery_slogans` | 59 | **SEED** (export → git seed; `packages/recovery-content` may already hold source — reconcile) |
| Resources / crisis resources | `public.resources` / `crisis_resources` / `v2_resources` | 34 / 8 / 5 | **SEED** (merge into one canonical resource set) |
| NARR standards | `recoveryos.narr_standards` | 82 | **SEED** |
| Document templates + versions | `recoveryos.document_templates/_versions` | 20/21 | **SEED** |
| Service types / consent types | `recoveryos.service_types/consent_types` | 12/8 | **SEED** (already in migrations — verify parity) |
| Org / programs / residences / curfew / chores / Iowa checklist | `recoveryos.*` | 1/2/2/7/2/7 | **SEED** |
| Wix lead intake (`wix_contact_submissions`, funnel) | `public` | rows small | **RECREATE** as a canonical leads table + repoint the Wix automation (INVESTIGATE which automation posts) |
| `gfa_lookup` | 24 tables | 0 live rows | nothing to carry |
| Owner voice-note | storage `voice-notes` | 1 | export to archive |

## F. Canonical infrastructure to preserve (KEEP — this is the product)

The entire `recoveryos` domain built in P0–P3C **minus migration scaffolding**: identity
(`people`, `role_assignments`, `person_profiles`, **`person_classification`** — genuinely useful in
production, keep), organizations/programs/enrollments, residences + residence operations +
documents + compliance, service_events spine, consent (append-only), coaching domain
(relationships, support_requests, booking_requests/proposals, appointments, conversations/messages,
notifications with dedup, follow-ups), all SECURITY-DEFINER RPCs (`assign_participant_coach`,
`claim_support_request`, `create_booking_request`, `propose/counter/accept/cancel/reschedule`,
`emit_notification`, `notify_*`), all RLS, the typed service layer (`coachingReads.ts` /
`coachingWrites.ts`), `apps/platform` + the 8 packages, and the canary+harness as a **staging
verification tool**. This is *architecture we need*.

## G. Legacy infrastructure classification

| Generation | Live consumer today | Launch need | Disposition |
| --- | --- | --- | --- |
| gravrcc gen-1 (`public`, 59 tbl) | `virtualrecovery` worker (vrcc.app mvp) reads it | No | **ARCHIVE** (frozen project) → retire with frontend replacement |
| `mvp_*` | same mvp app | No | **ARCHIVE → RETIRE** |
| `v2_*` | `coaching` edge-fn SPA + v2 reminder cron | No (clean launch) | **ARCHIVE → RETIRE** |
| `gfa_*` (15 schemas) | telemetry only (`session_events`); the P8 unidentified drift client targeted this era | No | **ARCHIVE → RETIRE** |
| `ztest`, `ds_sandbox`, `gfa_residence_deprecated` | none | No | **ARCHIVE → RETIRE** |
| `wix_*` | Wix marketing-site automation (likely live) | Equivalent needed | **RECREATE** canonically + repoint |

## H. Compatibility infrastructure classification (scaffolding we needed to get here)

| Component | Clean-launch disposition |
| --- | --- |
| `write_authority` + `set_write_authority` / `set_scheduling_write_authority` | **RETIRE BEFORE LAUNCH** — with no v2, there is one writer by construction |
| `migration_state` | **ARCHIVE** (historical record in the frozen project + docs) |
| v2→canonical projections (0031/0032 guards) | **RETIRE** — nothing to project from |
| canonical→v2 compat (relationships, support, scheduling, notifications) | **RETIRE** — nothing to project to |
| `legacy_projection_outbox` + processor | **RETIRE** — it existed to protect a legacy UI that won't exist. (The *pattern* is documented; resurrect only if a future external sync needs it.) |
| `v2_identity_map`, `person_for_v2`/`v2_for_person`, backfill fns, `backfill_log` | **RETIRE** (archive holds the history) |
| `person_classification`, `is_test_fixture`/`is_production_person` | **KEEP IN PRODUCTION** |
| Canary + harness | **STAGING/TESTING ONLY** — repurpose to HTTP-verify canonical RPCs on the launch project pre-go-live (simpler now: no authority flips needed) |

**Answer to Q12: yes.** A clean launch eliminates essentially all compatibility architecture. The
only migration-era artifacts worth keeping are person_classification and the canary/harness.

## I. Edge Function / runtime classification

| Function | Class | Launch disposition |
| --- | --- | --- |
| `create-meeting`, `notify-fanout` | canonical (P1-hardened) | **KEEP** — redeploy on launch project, pointed at canonical tables only |
| `grace-coaching-canary` | test/canary | **STAGING ONLY** (currently inert; leave as-is until reset) |
| `coaching` (v2 SPA) | legacy consumer | **RETIRE at launch** (superseded by apps/platform) |
| `Grace`, `grace-companion`, `grace-companion-v6` | legacy AI companion iterations | **INVESTIGATE → likely RETIRE** (v6 may hold prompt/content worth extracting) |
| `vrcc-api-gateway`, `vrcc-api-gateway-v6` | legacy gateways | **RETIRE at launch** |
| `slogan-engine` | legacy content engine | **RETIRE** (slogans move to seed + platform) |
| `notify-new-lead` | Wix lead intake | **RECREATE** against canonical leads table |

**Cloudflare (P1 map):** KEEP `gfa-eco-recovery-residence-os` (canonical platform) +
`recoveryos-staging`; `virtualrecovery` (vrcc.app) survives only until repoint, then retire;
`vrcc-app` + 5 `vite-react-template*` + stale `recovery-residence-os` → **RETIRE**. `vrcc.app` DNS
repoints to the canonical platform worker at launch.

## J. GitHub / source-control status

- **Reconstructable from git:** the full canonical stack — `recoveryos` migrations `0000–0036`
  (37 files, verified equal to what was applied), `apps/platform`, 8 packages, hardened edge
  functions (incl. canary + harness), all docs/ADRs. RecoveryResidenceOS repo holds the legacy
  residence app (migration source only).
- **NOT in git:** the ~110 legacy-era migrations (gravrcc v6, gfa_*, v2_foundation, grace_house…)
  — they exist only in the live DB's migration history. **This is fine under Option B** (we aren't
  rebuilding legacy anywhere) and is one more reason not to try to reproduce the dev environment.
- **Gap to fix before reset:** (1) reference data in E exists only in the DB → must be exported to
  git seed files; (2) migrations `0031–0036` reference `public.v2_*` and would **fail on a v2-free
  fresh project** → author a consolidated launch baseline (see O).

## K. Current vs proposed architecture

**Current:** six generations side-by-side; three deployed frontend generations (mvp on vrcc.app, v2
SPA edge function, canonical platform worker); write authority mid-transition; compatibility
triggers, crosswalks, outbox; 27 mixed-purpose auth users; an unidentified drift client (P8).

**Proposed Day-One:**

```
Cloudflare (vrcc.app + staging)
  └─ apps/platform (one React SPA)
       /vrcc  /coach  /navigator  /residences  /admin
            └─ packages/{auth,ui,domain,data-access}   ← ONE service layer
                  └─ Supabase (fresh launch project)
                       ├─ auth  (deliberate users only)
                       ├─ recoveryos.*  (the ONLY app schema)
                       ├─ RPCs + RLS  (canonical authority, one writer by construction)
                       ├─ edge: create-meeting, notify-fanout, lead-intake
                       └─ cron: canonical reminder engine (see Q)
```

No `mvp_*`, no `v2_*`, no `gfa_*`, no projections, no write_authority, no crosswalk. The frontend
never knows migration concepts existed.

## L. Reset current project vs fresh launch project

| Criterion | A: reset in place | B: fresh project |
| --- | --- | --- |
| Cleanliness guarantee | Drop ~400 tables/18 schemas + hidden auth triggers (e.g. gen-1 `auto_create_participant` on signup), hundreds of legacy functions — any miss lurks in prod | **Guaranteed** — only what git creates exists |
| P8 unidentified drift client | Retains project URL/keys → can still write | **Dissolved** — new URL/keys strand it naturally |
| Archive/rollback | Backup files only; the environment itself is destroyed | **Dev project frozen intact** = perfect archive + rollback |
| Source-of-truth discipline | DB remains ahead of git | Git migrations become the actual bootstrap (forcing function) |
| Effort | Careful destructive surgery + verification of every drop | New ref, secrets, redeploys, DNS repoint (all needed at launch anyway) |
| Cost | none | one additional Supabase project (dev project can be paused after archive window) |
| Risk to real users | deletes in the same DB they signed into | zero interaction with dev data |

**Recommendation: B.** In-place surgery on 470 tables to save a project ref is exactly the
technical debt this reset is meant to end.

## M. Backup / archive / restore plan (BEFORE any deletion)

1. **Full logical dump** of the dev project (operator: `supabase db dump` / pg_dump for all
   schemas incl. auth; store in private archive storage, not the repo).
2. **CSV exports** committed-adjacent (private storage): `public.participants` (the 11 real-user
   contact rows + all profiles), auth user list with emails/roles, reference tables in E.
3. **Storage export:** the one voice-note object.
4. **Freeze, don't delete:** pause the dev project (it remains restorable indefinitely); do NOT
   delete it until the launch project has run clean for an agreed observation window (≥30 days).
5. **Restore path:** unpause dev project (instant rollback of "where was that data?") or restore
   the dump into any project.

## N. Exact reset dependency graph (Option B order — nothing destructive until step 7)

```
1 export seeds (E) → git         4 create fresh project          7 pause dev project (archive)
2 author launch baseline (O)  →  5 apply baseline + seeds    →   8 repoint vrcc.app DNS
3 verify M backups complete      6 deploy edge fns + cron,       9 retire legacy CF workers
                                   create identities (P),      10 (≥30d later, on sign-off)
                                   run canary harness (HTTP)       delete dev project
```

Steps 1–6 are non-destructive and reversible. The first destructive act (7) happens only after the
launch project is verified. Step 10 is a separate, later authorization.

## O. Canonical seed plan

1. **Launch baseline migrations:** keep `0000–0030` as-is; author **`0037_launch_baseline`** that
   re-creates the *keeper* parts of `0031–0036` without any `public.v2_*` reference — booking RPCs +
   reschedule lineage (0033 §3–5), notification dedup + emitters (0036 minus v2 compat), and
  `person_classification` (0030 stands alone already). Mark `0031/0032/0034/0035` and the compat
   sections as migration-history-only (skipped on fresh projects via a guard or a curated launch
   migration set).
2. **Seed files** (`supabase/seed/`): org, programs, residences, service_types, consent_types,
   NARR standards, Iowa checklist, document templates+versions, curfew/chores, slogans (reconciled
   with `packages/recovery-content`), unified resources, role_key enums sanity.
3. **Verification:** after `db reset` locally / fresh-project apply, run the existing DB test
   corpus (RPC invariants) + canary harness over HTTP.

## P. Initial production identity plan (minimum)

- 1 owner/admin: `degarmeaux@icloud.com` → person + `administrator` (+ `coach` if operating).
- 1–2 staff: Thomas (grace org address, one account only) / Dave Stout as needed → controlled role
  grant via the 0029-style provisioning path.
- 0 fixtures in production (fixtures live in staging only).
- The 1–2 legitimate participants: **invited to re-register**; their exported contact rows guide
  outreach. Roles: `participant` only, self-service.
- No shared org mailbox logins (`connect@`, `vrcc@`, `residents@`) unless given a real operational
  role deliberately.

## Q. Frontend launch prerequisites (before/while building apps/platform P4)

1. Launch baseline + seeds exist and bootstrap a clean project (O).
2. **Canonical reminder engine** — the one genuine feature gap a clean launch exposes: the v2
   pg_cron reminder engine dies with v2. Implement `recoveryos` reminders (3 kinds, reschedule-safe,
   cancellation suppression, idempotent, SKIP LOCKED, fixture-excluded — design already written in
   P3C-B §O) + one cron job. **Blocker for scheduling features at launch.**
3. Messaging: canonical conversations/messages ship directly — the old "real-message parity" gate
   existed only to protect legacy data and **dissolves** (there is none to preserve).
4. Lead intake: canonical leads table + repointed Wix automation + `notify-new-lead` successor.
5. Canary harness green over HTTP against the launch project (auth, relationships, support,
   scheduling invariant, notifications).
6. Grace Companion decision: extract worth-keeping prompts/content from `grace-companion-v6`
   before retiring, or defer the companion feature.

## R. Risks and blockers

- **Real-user confirmation (low):** owner must confirm none of the 11 outside signups has data
  outside this project's tables (e.g., paper/coach notes keyed to their account). Mitigated by CSV
  export + frozen archive.
- **Wix/lead pipeline continuity (medium):** the live marketing intake must be repointed at
  cutover or leads drop. Investigate which automation posts before step 8.
- **Reminder engine (medium):** scheduled-session reminders don't exist until Q2 is built.
- **Migration-set hygiene (low):** 0031–0036 v2 references must be resolved (O1) or a fresh apply
  fails — known, mechanical.
- **DNS/secrets cutover (low):** standard launch mechanics; staging worker already exists.
- **Cost (low):** two projects during the overlap window; pause dev after archive.

## S. Exact recommended sequence (today → clean launch)

1. **Authorize this plan** (owner) — including which real users to invite back.
2. Export seeds + CSVs + dump + voice-note (M1–M3). Commit seeds; archive the rest privately.
3. Author `0037_launch_baseline` + curated launch migration set + seed files; verify on a local
   `supabase db reset` (or a temporary branch project).
4. Create the fresh launch project; apply baseline + seeds; create P identities; deploy
   `create-meeting`/`notify-fanout`/lead-intake; deploy canary (staging-gated); run harness →
   HTTP-VERIFIED canonical writes with **no compat machinery at all**.
5. Build the canonical reminder engine (Q2).
6. Build/finish apps/platform P4 against the launch project (staging worker), fixtures in staging.
7. Cut over: repoint `vrcc.app` → canonical platform; repoint Wix intake; freeze (pause) the dev
   project; retire legacy Cloudflare workers.
8. Observation window; then (separate authorization) delete the dev project and its edge functions.

---

# RECOMMENDATION

## **GO — CLEAN PRODUCTION RESET RECOMMENDED** (Option B: fresh launch project; dev project frozen as archive)

**Why:** the entire preservation case for migration collapses on the evidence — all transactional
data belongs to owner/demo/fixture accounts; the 11 real outside users own one contact row each and
nothing else; the reference data worth keeping is ~250 rows, trivially seedable; the legacy estate
is ~400 near-empty tables plus three legacy frontends and an unidentified drift client that a fresh
project strands automatically. P0–P3C's value survives fully — the canonical domain, security
model, RPCs, RLS, scheduling architecture, and service layer ARE the launch architecture; only the
transition scaffolding (projections, write_authority, outbox, crosswalk) retires, which is exactly
what scaffolding is for.

**The destructive plan is §M–§S and is NOT executed.** Nothing has been deleted, no authority
changed, the canary remains inert. Awaiting explicit authorization for: seed/CSV/dump export
commit (step 2), fresh-project creation (step 4), dev-project freeze (step 7), vrcc.app repoint
(step 7), and — much later and separately — dev-project deletion (step 8).
