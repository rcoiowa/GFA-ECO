# vrcc.app Production Readiness Review (2026-08-31) — AUTHORITATIVE

Final pilot-to-production readiness determination for making `vrcc.app` the canonical
public front door, per the executive readiness-review directive of 2026-08-31. Baseline
facts (per that directive): `recoveryos-staging` is ACTIVE PILOT; pilot identities/records
are in canonical CQCX (`cqcxvwoukyhxyokfwnjm`); both Workers share that layer; existing
users need no migration; the production candidate (`gfa-eco-recovery-residence-os`) is the
cutover source. **No cutover, retirement, or destructive action was performed by this
review.** Architecture preserved: GFA-ECO canonical repo → `recoveryos-staging` (pilot) →
`gfa-eco-recovery-residence-os` (candidate) → `vrcc.app`. No new deployment surface was or
will be created.

## DECISION: **CONDITIONAL GO**

Cutover is safe once three conditions close (none requires code beyond what this review
prepared):

1. **C1 — Supabase Auth URL configuration verified/updated in the dashboard** (Site URL +
   redirect allowlist; §3). Tools available to this review cannot read Auth settings, so
   current state is unverified.
2. **C2 — Candidate smoke test: SUBSTANTIALLY CLOSED (2026-08-31).** Human-observed on the
   production candidate: successful login with correct credentials — **PASS**
   (`thomas@graceforaddictions.org`); correct role routing (participant landing) — **PASS**.
   The `degarmeaux@icloud.com` episode was user-entry error (see the closed C2 addendum);
   its investigation affirmatively confirmed account health, CQCX identity continuity,
   intact admin/executive roles, and no staging/candidate Auth divergence. **Remaining C2
   item: one Support Now render check on the candidate URL** (open Support Now as a
   signed-in user; confirm the governance-canon contacts render). Optional corroboration:
   one login with the address bar verified on the candidate hostname, so auth logs also
   carry the candidate origin.
3. **C3 — Redeploy `residence-intake` with the vrcc.app origins** (prepared in-repo by
   this review; a runbook step, or the in-app public referral/listing forms fail from
   vrcc.app after cutover).

---

## 1. Pilot-cohort reconciliation against the Gate B intake architecture

### Who actually exists (verified live 2026-08-31, read-only)

Of 66 CQCX accounts, **60 are `@fixtures.recoveryos.test` live-suite fixtures** (machine-
cadence creation bursts 08-08→08-10; the live suite writes to CQCX directly, not through
the staging front end). The **real human cohort is 6**:

| Person | Created | Roles | What they already have |
|---|---|---|---|
| 202 (staff domain) | 08-09 | participant | account + profile only |
| 234 (staff domain) | 08-11 | all staff/exec roles (note: several duplicate active role rows — harmless to RLS, tidy later) | 1 coaching link; signs in through 08-31 |
| 235 | 08-31 | participant | 2 consents, 1 coaching link, 1 check-in |
| 236 | 08-31 | participant | 2 consents |
| 237 | 08-31 | participant | 2 consents, 1 check-in |
| 238 | 08-31 | participant + coach | account + roles |

The real residents/coaches began onboarding **the same day** the Gate B intake experience
and the EJWRH edition went live — there is no legacy cohort that predates the current
architecture in any meaningful way. **Nothing any real user has done needs to be redone.**

### Gate B requirement classification (per readiness class, applied to real users)

Governing principle applied: never repeat what RecoveryOS already possesses unless a
current legal/policy/consent/signature/evidentiary requirement demands a fresh affirmative
act.

| Requirement (current architecture) | Classification | Basis |
|---|---|---|
| Account + identity (auth user, person row) | **SATISFIED BY EXISTING RECORD** | All 6 exist, confirmed, 1:1 joined |
| Profile name/email into intake conversion | **PREPOPULATE / CONFIRM** | 0144 lookup + "This is them" staff confirm is the designed path; name/email prefill from the account |
| Roles (participant/coach/staff) | **SATISFIED BY EXISTING RECORD** | Active role_assignments present |
| Consents already granted in-app (terms/service-participation/AI, 2026-08-31) | **SATISFIED BY EXISTING RECORD** | Granted through the live 0140 machinery with full provenance — already current-architecture records |
| Coaching relationships, check-ins, conversations/messages, appointments, support requests | **SATISFIED BY EXISTING RECORD** | Preserved as-is; not intake requirements |
| Residence application (for anyone moving into GH/EJWRH) | **NEW USER ACTION REQUIRED** | No real user has one (the 2 applications in CQCX are fixtures); this is a genuinely new, forward-only step |
| Screening consent (required_before_admission) | **NEW SIGNATURE / CONSENT REQUIRED** | Affirmative consent grant is the evidentiary basis for screening — never inferred |
| Electronic-records consent (before any e-signature) | **NEW SIGNATURE / CONSENT REQUIRED** | Legal-review requirement (0145); one tap at first signing; paper path exists with parity |
| Residence document signatures (GH: 8 docs; EJWRH: 1) | **NEW SIGNATURE / CONSENT REQUIRED** | Signatures cannot be inherited or prepopulated; electronic or witnessed paper (identical hash evidence) |
| Residence document acknowledgments (GH: 5; EJWRH: 5) | **NEW USER ACTION REQUIRED** | Same provenance rule; one-tap each in Getting Settled |
| Emergency contact | **NEW USER ACTION REQUIRED** (staff-recorded) | None on file for real users; safety-class item |
| Medication reconciliation (three-state incl. reviewed-none) | **NEW USER ACTION REQUIRED** (staff one-tap for "none") | Evidence of the review conversation, not of medications |
| Supervision coordination | **NOT APPLICABLE** unless flagged | Conditional class; consent-anchored when it applies |
| Accommodation review | **NOT APPLICABLE** unless flagged | Conditional class; honest interim behavior until the evidence loop ships |
| Recovery-support activity history predating RecoveryOS | **NOT APPLICABLE** | Never backfilled; Activity → Engagement chain starts from real recorded events |
| Anything in the retired backend | **UNRESOLVED** (bounded — §2) | Not accessed; no evidence any real-user record exists there |

**Role-specific paths:** participants/coaches not living in a residence need nothing —
they are fully onboarded now. Coaches need no intake at all (coaching surfaces are
role-gated, already working). Residents (current and future, both houses) go through the
standard staff-driven intake checklist; for people already living in a house this is a
staff-scheduled paperwork session (sign + acknowledge + consent + emergency contact +
medication review), then `admit_applicant` records the residency — the same flow proven
end-to-end in the rolled-back live E2E, with identity prepopulated at every step. No
duplicate data entry exists in the flow.

## 2. Pre-August-8 uncertainty — bounded

- **Checked:** CQCX `auth.users` full census with per-account cadence and domain analysis;
  CQCX auth audit log (empty); git history of `deploy-staging.yml` (retired backend baked
  2026-08-04 → fixed 2026-08-08 23:44 UTC, commit `c10b965`); Worker creation dates;
  fixture-vs-real domain split.
- **Known:** every real human account was created **2026-08-09 or later** — after the fix.
  The 08-08 accounts are all fixtures created by the test suite (which never used the
  staging front end). The broad resident/coach onboarding happened 2026-08-31.
- **Unknown:** whether any person *attempted* registration on the staging URL during
  2026-08-04 → 2026-08-08 23:44 and gave up. Such an attempt would have landed in the
  retired project; the retired project was not accessed (standing prohibition).
- **Practical risk: LOW.** The invitation to real users demonstrably post-dates the fix by
  three weeks.
- **User-facing action warranted:** none proactively. If any person ever reports "I made
  an account but can't sign in," have them register fresh — their attempt predated the
  canonical backend and nothing of theirs exists in CQCX to collide with.

## 3. Auth and origin configuration readiness

Supabase Auth settings are **not readable with the tools available to this review**
(dashboard/management-API surface); "CURRENT STATE: UNVERIFIED" below is that limitation,
not a defect finding. App code facts (source-verified): password reset →
`resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`;
signup → `auth.signUp` with **no** `emailRedirectTo`; **no magic-link and no invitation
flows exist in the app** (no `signInWithOtp`, no admin invites) — both NOT APPLICABLE.

| Item | Current state | Required production state | Change required | Security effect | Rollback | Verification test | Mutation auth needed? |
|---|---|---|---|---|---|---|---|
| Auth Site URL | UNVERIFIED (dashboard) | `https://vrcc.app` at cutover (until then: staging URL acceptable) | Set at cutover | Confirmation links land on canonical origin | Set back to prior value | Trigger a signup confirmation; link lands on vrcc.app | **YES** (dashboard change) |
| Redirect allowlist | UNVERIFIED (dashboard) | Contains `https://recoveryos-staging.thomas-499.workers.dev/**`, `https://gfa-eco-recovery-residence-os.thomas-499.workers.dev/**`, `https://vrcc.app/**` | Add any missing entries | Additive; allowlists are origin-restrictive by nature — adding our own origins widens nothing beyond us | Remove entries | Password reset requested from each origin returns to that origin's `/reset-password` | **YES** (dashboard change; additive entries are safe to do now) |
| Email confirmation redirect | Follows Site URL (no `emailRedirectTo` in code) | Site URL = vrcc.app at cutover | Covered by Site URL row | Same | Same | New signup on vrcc.app; confirm link returns there | YES (same change) |
| Password-reset redirect | Origin-relative in code; honored only if origin allowlisted | All three origins allowlisted | Covered by allowlist row | Same | Same | Reset from vrcc.app lands on vrcc.app/reset-password | YES (same change) |
| Magic links / invitations | Not used by the app | — | None | — | — | — | NOT APPLICABLE |
| `residence-intake` origin allowlist | Live function: recoveryresidence.org/.app (+www) only — **excludes vrcc.app and both workers.dev origins** (identical effect on staging and candidate today: in-app public referral/listing forms are origin-rejected on both) | Includes `https://vrcc.app`, `https://www.vrcc.app` | **PREPARED IN-REPO this review** (`supabase/functions/residence-intake/index.ts`); takes effect on function redeploy | Additive origin for our own domain; Turnstile/honeypot posture unchanged | Redeploy prior function version | From vrcc.app, submit the in-app referral form; expect `201 received` | **YES** for the redeploy (runbook step 5) |
| `grace`, `create-meeting` functions | CORS `*` (source + deployed behavior consistent with pilot usage) | Unchanged | None | — | — | Coaching chat + meeting creation from vrcc.app | NO |
| PostgREST / Auth endpoints | No origin binding (publishable key + RLS) | Unchanged | None | — | — | Covered by smoke test | NO |

Nothing in this table was mutated: the allowlist edit is repo-only (PREPARED / READY FOR
AUTHORIZATION); no standing authority covers dashboard Auth changes or function redeploys,
so both stop at prepared.

## 4. Production-candidate equivalence & release integrity

| Item | Verdict | Evidence level |
|---|---|---|
| Deployed commit `ec36922` on both Workers | Confirmed (runs 71 + candidate run 1; Worker modified timestamps 00:28Z / 00:31Z) | **DEPLOYMENT VERIFIED** |
| Canonical CQCX backend in candidate assets | Confirmed — in-workflow guard grepped built assets: canonical ref present, retired ref absent | **DEPLOYMENT VERIFIED** |
| Canonical backend behind staging bundle | Confirmed — post-redeploy real signup (01:36Z) + sign-in (01:38Z) landed in CQCX | **LIVE FUNCTION VERIFIED** |
| Auth continuity (same project, email+password, JWT→person→role resolution) | Confirmed for a real coach + real resident via simulated-JWT reads (rolled back) | **LIVE FUNCTION VERIFIED** (server side) |
| Intake/application/readiness/admission chain | Confirmed — 17-step synthetic E2E green against live CQCX (rolled back); preflight contract check PASS post-0146 | **LIVE FUNCTION VERIFIED** (server side) |
| Consent enforcement (e-consent gate, self-only, screening grant) | Confirmed live (refusal then success in E2E) | **LIVE FUNCTION VERIFIED** (server side) |
| Role routing (participant/resident/coach/navigator/staff/admin areas), Support Now, residence workflows UI | Present in `ec36922`; 260 tests + typecheck green in CI and in the candidate deploy run | **SOURCE VERIFIED** |
| Hostname-sensitive behavior | Only `/` landing remap for named public domains; all routes reachable on all hosts | **SOURCE VERIFIED** |
| Service worker | App-shell/static only, same-origin, never intercepts Supabase | **SOURCE VERIFIED** |
| Edge function dependencies (`grace`, `create-meeting`, `residence-intake`, `ejwrh`, `notify-fanout`) | All ACTIVE per platform API | **DEPLOYMENT VERIFIED** |
| In-browser behavior on the candidate URL (page load, sign-in, role landing, Support Now render) | No direct evidence — this environment cannot reach workers.dev (egress-blocked) | **NOT YET VERIFIED → condition C2** |

## 5. The transition as a real pilot user experiences it

`recoveryos-staging` → `vrcc.app`, same person:

| Aspect | What happens |
|---|---|
| Email + password | Identical — credentials live in the shared Auth project, not the URL |
| Browser session | Not carried across origins → **one fresh sign-in** on vrcc.app (the single thing users notice) |
| Profile, role, intake state, consents, recovery data, resident data, coach relationships, messages, scheduled sessions | Identical rows, same database — appear immediately after sign-in |
| Uploaded documents | No user-uploaded files exist yet (storage is not part of current flows) — nothing to move |
| Bookmarks to staging | Keep working — staging keeps serving the same app on the same data (§6) |
| In-flight reset/confirmation links | Keep working — they point wherever they pointed when issued; new ones follow the new config |
| Notifications | In-app reads from the same tables; no hardcoded-origin links found in app source |
| Installed staging PWA | Keeps working against the staging origin as long as staging serves; vrcc.app installs as its own PWA when the user is ready |

Outcome: **same account + same data + same role + same state + one clean URL + one
re-login.** Not a migration experience. Given only ~6 real users, a one-sentence heads-up
("same login, new address, sign in once") delivered by staff/coaches is sufficient
communication — no formal campaign warranted.

## 6. `recoveryos-staging` lifecycle protection

- **After cutover:** keep serving the identical app unchanged for **at least 30–60 days**
  (same backend, same commit lineage) — zero-risk coexistence since both URLs are one app
  on one data layer.
- **Then:** switch to a **302** redirect to `https://vrcc.app` first (reversible,
  uncached); promote to **301** only after ≥30 further days of quiet. Redirects preserve
  bookmarks; installed PWAs keep functioning until their users adopt vrcc.app (the SW
  serves the cached shell; navigations then redirect — degraded but never data-broken).
- **Never:** delete the Worker while any pilot bookmark/PWA may exist. There is no data in
  the Worker itself — all data is CQCX — but the URL is a promise to real people.
- **Guardrails added this review (repo, CI-enforced):** `deploy-staging.yml` now runs the
  same canonical-backend bundle guard as the production workflow — a staging deploy that
  bakes a retired/noncanonical backend fails before upload. The deployment registry
  carries the ACTIVE PILOT classification; fixture accounts are structurally
  distinguishable (`@fixtures.recoveryos.test`), so real-user data can never be
  "cleaned up" by pattern-matching test data — any future cleanup must key on that domain
  and nothing else, under separate authorization.

## 7. Domain scores

| Domain | Score | Non-green blocker → minimum action |
|---|---|---|
| Identity continuity | **GREEN** | |
| Data continuity | **GREEN** | |
| Authentication | **YELLOW** | Auth URL config unverified → C1 dashboard check (15 min) |
| Intake/onboarding reconciliation | **GREEN** | |
| Consent/signatures | **GREEN** | |
| Participant experience | **GREEN** (2026-08-31: candidate login + participant routing human-observed) | |
| Coach experience | **GREEN** (candidate surface proven; coach chains live-verified server-side) | |
| Resident/residence workflows | **GREEN** (candidate surface proven; full intake chain live-verified server-side) | |
| Navigator/staff/admin workflows | **GREEN** (candidate surface proven; role resolution live-verified server-side) | |
| Safety/escalation (Support Now) | **YELLOW** | One Support Now render check on the candidate URL (last open C2 item) |
| Auth/domain configuration | **YELLOW** | C1 + the cutover DNS/domain step itself |
| Edge Function/API origins | **YELLOW** | C3 — redeploy `residence-intake` (change already in repo) |
| PWA/session continuity | **GREEN** | |
| Operational support | **GREEN** | Runbook + coexistence plan below |
| Rollback readiness | **GREEN** | Legacy Worker untouched; DNS repoint is the whole rollback |

No RED. No UNKNOWN. Every YELLOW closes with C1 + C2 + C3 plus the cutover act itself.

## 8. Cutover runbook (PREPARED — not executed)

Legend: **[RO]** read-only · **[RC]** reversible configuration · **[PM]** production
mutation (separate authorization required) · **[DR]** destructive/retirement (separate
authorization required; none scheduled).

1. **[RO] Pre-cutover verification:** CI green on the cutover commit; preflight
   `launch_contract_check.sql` PASS on CQCX; `workers_list` shows candidate Worker at the
   intended deploy; this document's C1–C3 status reviewed.
2. **[RO] Rollback reference:** record current vrcc.app DNS/route target (legacy Worker
   `virtualrecovery`) and the candidate Worker version id; CQCX needs no snapshot (no
   schema change in cutover; Supabase PITR remains the data safety net).
3. **[RC] Auth allowlist (may precede cutover day):** add the three origins to the
   Supabase Auth redirect allowlist (C1). Additive, reversible.
4. **[RC] Auth Site URL:** set to `https://vrcc.app`. Reversible in one field.
5. **[PM] Redeploy `residence-intake`** from the repo (picks up vrcc.app origins — C3).
6. **[PM] Bind `vrcc.app` to `gfa-eco-recovery-residence-os`** (Cloudflare custom
   domain/route change; simultaneously detaches it from the legacy Worker).
7. **[RO] Smoke tests on `https://vrcc.app`:** page load; `/residence/directory/` static
   asset; landing renders; no console errors on the shell.
8. **[RO] Real-account continuity test:** sign in with a staff account and one 08-31
   participant account; profile, role, coaching/check-in state all present.
9. **[RO] Role-routing test:** participant → participant area; coach → coach area; staff →
   staff area incl. Intake Checklist; admin area reachable for admins.
10. **[RO] Password-reset test:** request from vrcc.app; email link returns to
    `vrcc.app/reset-password`; complete a reset on a staff-owned test identity only.
11. **[PM-lite] Intake/form submission test:** submit the in-app referral form from
    vrcc.app (expect 201); staff see it in the queue; review/close the row as a
    documented test entry.
12. **[RO] Safety/Support Now test:** open Support Now as a participant; verify the
    governance-canon contacts render.
13. **[RO] Rollback criteria:** any of — sign-in failures for real accounts; role routing
    broken; blank shell/asset 404s; reset links not returning to vrcc.app; error rate on
    Supabase logs materially above baseline in the first hour.
14. **[RC] Rollback procedure:** re-point vrcc.app to the legacy `virtualrecovery` Worker
    (step 2 reference); revert Auth Site URL; both are single-field reversions —
    candidate and staging Workers keep serving their workers.dev URLs throughout, so
    pilot users are unaffected by a rollback.
15. **[RC] Staging coexistence:** leave `recoveryos-staging` exactly as-is (§6); no
    redirect yet.
16. **[RO] Post-cutover monitoring:** first 24–48h — Supabase auth/API error logs, edge
    function logs, and a daily sign-in spot check; keep the legacy Worker untouched for
    at least the coexistence window.
17. **[RC] User communication (needed, but tiny):** one message to the ~6 pilot users +
    house staff: "Same login, new address: vrcc.app — sign in once." Nothing else.

## 9. Architecture hygiene

Unchanged and converging: **GFA-ECO canonical repo → `recoveryos-staging` (active pilot) →
`gfa-eco-recovery-residence-os` (production candidate) → `vrcc.app`.** This review created
no deployment, no backend, no frontend, no branch beyond the existing working branch, and
no architecture. The legacy Workers remain the rollback substrate until after cutover
stabilizes; their retirement is a future [DR] decision, not part of this plan.

## C2 addendum (2026-08-31, auth-log investigation) — CLOSED AS FALSE ALARM

> **EXECUTIVE CORRECTION (2026-08-31):** the `degarmeaux@icloud.com` sign-in failures were
> **user-entry error** (wrong login information typed), not an account, Auth, staging, or
> production-candidate defect. This matches the server-side evidence below exactly (the
> stored password succeeded four times the same night; failures were `invalid_credentials`
> on the submitted value). **This account is NOT an authentication blocker of any kind.**
> The investigation is retained below because it affirmatively confirmed: account health;
> canonical CQCX identity continuity; intact administrator/executive roles; and no
> staging/candidate Auth divergence. The credential question is closed and is not to be
> reopened absent new contradicting evidence.

Human-observed updates accepted: candidate login surface PASS; real participant
authentication PASS (`thomas@graceforaddictions.org`); participant role routing PASS;
deployment-wide auth continuity — no failure demonstrated.

**`degarmeaux@icloud.com` — ACCOUNT-SPECIFIC CREDENTIAL-ENTRY ISSUE, account healthy.**
Read-only findings (auth.users + auth service logs):

- Single auth user `0a1449f5-340f-49a5-80d9-570e9920cb99`; email/password signup
  2026-08-11 14:17:39Z; confirmed 76 s later via the emailed link; sole `email` identity;
  not banned/disabled/deleted/SSO; bcrypt hash present; never had a password reset
  (`recovery_sent_at` null). Maps to exactly one person (234) — no duplicate users,
  identities, or profile mappings. Active roles: participant, resident, coach, navigator,
  residence_staff, residence_manager, program_manager, administrator, executive (several
  duplicate role rows — harmless to RLS; tidy under a future hygiene pass).
- **The stored password WORKS.** Four successful password grants on 2026-08-31 alone
  (01:16:13, 01:21:24, 03:20:42, 03:32:36 UTC), interleaved with ~17 failures between
  03:06 and 03:33 whose exact server-side error is `400 invalid_credentials — "Invalid
  login credentials"` (wrong password submitted; not a ban, confirmation, or rate-limit
  error). Successes and failures alternate from the same device/IP — the signature of
  typo/autofill/variant entry, not of a broken account. Failed attempts do not log the
  email, so some 400s in that window may target either tested account; both tested
  accounts have same-day successful password grants.
- **Not a staging/candidate divergence:** the backend accepts the account's password;
  origin plays no role in password verification. Log caveat: **no auth request carrying
  the candidate origin appears in the last 24 h** — every recorded login (including the
  successful thomas@ logins) shows the staging referer. The human-observed candidate PASS
  stands, but one more candidate-URL login with the address bar verified
  (`gfa-eco-recovery-residence-os.thomas-499.workers.dev`) would let server logs
  corroborate it.
- **Discovered in passing:** email confirmation IS enforced (new residents hit
  `email_not_confirmed` until clicking their link, then succeed) — so confirmation email
  delivery and redirect are proven working for the staging origin, and C1's remaining work
  is exactly the candidate + vrcc.app entries.
- **Remediation:** normal self-service password reset ("Forgot password" on staging, whose
  email-link path is proven) — safe and appropriate; or simply retype carefully, since the
  current password verifiably works. A reset updates only the password hash **on the same
  auth user row**: same auth user id, same person 234, all role assignments (including
  admin/executive), and all data/relationships preserved; no new identity is or can be
  created by the reset flow. Other active sessions for the account are signed out on
  reset — the only side effect.
- **Cutover impact: none.** This is not a blocker for vrcc.app cutover.

## Evidence limitations (explicit)

1. Supabase Auth URL configuration is not readable with available tools → C1.
2. In-browser behavior on workers.dev origins is unreachable from this environment → C2.
3. The retired backend was not accessed (standing prohibition) → pre-Aug-8 uncertainty is
   bounded (§2), not eliminated.
4. "Real vs fixture" classification rests on the `@fixtures.recoveryos.test` domain
   convention plus cadence analysis — deliberate and reliable, but staff should confirm no
   real person was ever given a fixture-domain account.
