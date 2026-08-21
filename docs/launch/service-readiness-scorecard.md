# RecoveryOS Service-Readiness Scorecard

**Date:** 2026-08-14 · **Branch HEAD:** `b1eb4ef` (on `claude/recoveryos-intake-audit-zouh7q`) ·
**Updated:** 2026-08-15 on `claude/public-support-onboarding-85u07i` — the two Type B repo
fast-follows from Execution Plan step 2 are **implemented and gate-verified**: `fix(safety):
expose GFA support path before authentication` and `feat(onboarding): add minimal consent and
support check`. Live (deployed) validation of both remains part of the Type D staging gate. ·
**Objective:** make RecoveryOS safely ready to serve real individuals — the smallest complete
service-delivery pathway.

**Evidence base:** repository code trace (READ) + live CQCX/Cloudflare evidence verified earlier
2026-08-14 (Supabase + Cloudflare MCP were **disconnected this turn**, so anything needing fresh live
confirmation is marked BLOCKED — re-verify at the deploy gate). Status vocabulary: READY /
PARTIALLY READY / BROKEN / NOT IMPLEMENTED / UNSAFE / BLOCKED.

**Headline:** the core human-service pathway — discover → request → account → connect with a
Coach/Navigator → service event → follow-up, plus Support Now, consent, and residence apply — is
**READY end-to-end with no misleading dead-ends.** Three service-blocking defects were found and
fixed this turn (commit `b1eb4ef`). The remaining items are additive fast-follows and gated
deploy steps.

---

## A. Service-Readiness Scorecard

| Capability                                                                        | Status                  | Evidence                                                                                                                                                                                                                                                                                                                                                                  | Blocker                                                                                                                       | Required fix                                          | Launch-critical?                              |
| --------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Public entry / CTAs (no dead-ends)                                                | READY                   | `LandingPage.tsx:52-63,120`; `GraceHousePage.tsx:84-95`; `ResidenceDirectoryPage.tsx:93-108`                                                                                                                                                                                                                                                                              | —                                                                                                                             | —                                                     | —                                             |
| Sign-up / sign-in / logout / session                                              | READY                   | `RegisterPage.tsx:37-60`; `SignInPage.tsx:32-44`; `AuthContext.tsx:66-85`                                                                                                                                                                                                                                                                                                 | —                                                                                                                             | —                                                     | YES (met)                                     |
| Email confirmation                                                                | PARTIALLY READY         | out-of-band only; no in-app `/auth/callback` (`RegisterPage.tsx:56-83`)                                                                                                                                                                                                                                                                                                   | provider-default confirm page                                                                                                 | acceptable for launch; optional in-app callback later | NO                                            |
| **Password reset (set new pw)**                                                   | **READY (fixed)**       | was BROKEN (link → `/sign-in`, `updatePassword` unmounted); fixed `ResetPasswordPage.tsx` + route + email repoint                                                                                                                                                                                                                                                         | —                                                                                                                             | ✅ done `b1eb4ef`                                     | YES (met)                                     |
| Onboarding — person creation                                                      | READY                   | `OnboardingPage.tsx:24-55` → `ensure_person_for_current_user` (`people.ts:50`)                                                                                                                                                                                                                                                                                            | —                                                                                                                             | —                                                     | YES (met)                                     |
| Onboarding — minimal consent + immediate-support step                             | **READY (repo, fixed)** | was NOT IMPLEMENTED; `OnboardingPage` now asks "Do you need support right now?" (yes → `/support`) then captures the required-for-service consents through the existing append-only path; `OnboardingConsentGate` bounds `/vrcc`; staff/residence/admin never captured (`participantOnboardingApplies`); "what brings you here" deliberately deferred (data minimization) | live journey re-verify at Type D gate                                                                                         | ✅ done (this branch)                                 | **YES (privacy/dignity)** (met in repo)       |
| Consent — server-enforced                                                         | READY                   | Grace fn re-checks `ai_features` server-side (`grace/index.ts:140-166`), caller-JWT scoped; append-only (`consents.ts:28-49`)                                                                                                                                                                                                                                             | —                                                                                                                             | —                                                     | YES (met)                                     |
| Human support request → staff → claim/own → response → service_event → follow-up  | READY                   | `ConnectPage.tsx:154`; `claim_support_request` (`0112:95`); `complete_session` (`0113:225`); `create_follow_up` (`0114:12`)                                                                                                                                                                                                                                               | —                                                                                                                             | —                                                     | YES (met)                                     |
| Navigation request spine                                                          | READY                   | `NavRequestsPage.tsx:27`; `NavPersonPage.tsx:96-196`                                                                                                                                                                                                                                                                                                                      | —                                                                                                                             | —                                                     | YES (met)                                     |
| Sessions (booking → proposal → appointment)                                       | READY                   | `SchedulingCard.tsx:150`; `accept_booking_proposal` (`0100:198`)                                                                                                                                                                                                                                                                                                          | no participant-initiated booking UI (coach-proposes model)                                                                    | none for launch; add self-request later               | NO                                            |
| Check-ins (daily pulse) + response                                                | READY                   | `CheckInPage.tsx:136`; `pulse.ts:137-172`                                                                                                                                                                                                                                                                                                                                 | elevated-risk pulse = self-directed phone (warmline/988), **no in-app staff escalation row** (by design — "no silent alerts") | none (doctrine-aligned); document it                  | NO                                            |
| Referral intake + staff triage                                                    | READY                   | anon insert (`0016:34-47`); `ApplicationsPage.tsx:53,161-176`; `triage_residence_referral`                                                                                                                                                                                                                                                                                | —                                                                                                                             | —                                                     | YES (met)                                     |
| ICARE                                                                             | READY (as scoped)       | governed by Authority; not persisted in canonical schema; no ICARE UI required for launch                                                                                                                                                                                                                                                                                 | —                                                                                                                             | —                                                     | NO (must not block)                           |
| Support Now — deterministic, Grace-independent                                    | READY                   | static ladder `ladder.ts:21`, `SupportNow.tsx:29-38`; surfaces on `consent_required`/`ai_unconfigured` (`grace/index.ts:163-232`)                                                                                                                                                                                                                                         | —                                                                                                                             | —                                                     | YES (met)                                     |
| Support Now — reachable without an account                                        | **READY (repo, fixed)** | was PARTIALLY READY (public pages had 988/911 only); public `/support` route now carries the deterministic emergency → crisis → GFA hierarchy (`PUBLIC_SUPPORT_GROUPS`, tel-only, Grace-independent); GFA warmline + office (`GFA_CONTACTS`) surfaced on landing, Grace House, and directory pages; a11y/mobile/e2e gated                                                 | live re-verify at deploy gate                                                                                                 | ✅ done (this branch)                                 | **YES (safety)** (met in repo)                |
| Grace AI                                                                          | READY (OFF)             | provider activation OFF (locked); not required for launch                                                                                                                                                                                                                                                                                                                 | —                                                                                                                             | keep OFF                                              | NO                                            |
| Grace House apply (in-app, authenticated)                                         | READY                   | `ResidenceApplyPage.tsx`; `residence_applications` (`applications.ts:22-38`)                                                                                                                                                                                                                                                                                              | requires account (no in-app pre-account path)                                                                                 | converge pre-account boundary (Phase 4)               | YES (met via account path)                    |
| Pre-account residence intake (Grace House + EJWRH)                                | PARTIALLY READY         | boundary exists (`residence_application_intake` 0122; `residence-intake` fn; `publicIntake.ts`) but **not applied to CQCX and not wired to any app page**; EJWRH uses separate live `public.housing_applications` (hardened)                                                                                                                                              | 0122 unapplied; no UI; two intake models                                                                                      | Phase 4 convergence (gated)                           | PARTIAL (account path covers Grace House now) |
| Staff usability (coach/navigator/residence/admin) via UI, no raw Supabase         | READY                   | coach/navigator/staff/admin loops all RPC-backed (`RequestsPage`, `NavPersonPage`, `ApplicationsPage:147-173`, `OperationsPage`, `AccessPage`)                                                                                                                                                                                                                            | —                                                                                                                             | —                                                     | YES (met)                                     |
| Staff review of `residence_applications` + status                                 | READY                   | `review_residence_application` + `admit_applicant` (`staffOperations.ts:147-173`)                                                                                                                                                                                                                                                                                         | —                                                                                                                             | —                                                     | YES (met)                                     |
| Staff grievance follow-through                                                    | **READY (repo, fixed)** | was PARTIALLY READY (no staff queue); `/staff/grievances` queue added (`GrievancesPage.tsx`) on the **already-applied** 0115 backend: manager-scoped `grievances_scoped_select` read (`listResidenceGrievances`) + `resolve_grievance` RPC (`resolveGrievance`) incl. conflict-of-interest refusal; unit-tested                                                           | live disposition re-verify at Type D gate                                                                                     | ✅ done (this branch)                                 | fast-follow met (repo)                        |
| Public-intake review queues (`residence_application_intake`, listing submissions) | NOT IMPLEMENTED         | `intakeReview.ts` functions have zero UI consumers                                                                                                                                                                                                                                                                                                                        | no admin/staff surface                                                                                                        | build a staff intake-review page at convergence       | at convergence                                |
| Staff sign-out on mobile                                                          | READY (fixed)           | was `hidden md:block` unreachable on phones; un-hidden (`StaffShell.tsx`)                                                                                                                                                                                                                                                                                                 | —                                                                                                                             | ✅ done `b1eb4ef`                                     | YES (met)                                     |
| Mobile — responsive shell                                                         | READY                   | `AppShell.tsx:43-167`; viewport `index.html:5`; public e2e `mobile.spec.ts:9-42`                                                                                                                                                                                                                                                                                          | authenticated-workspace mobile e2e coverage gap                                                                               | add a 390px auth-route e2e pass (fast-follow)         | NO                                            |
| Accessibility — service-critical paths                                            | READY                   | axe gate public + authenticated (`a11y.spec.ts`, `live/04-authenticated-a11y.spec.ts`); labeled fields (`Field.tsx`)                                                                                                                                                                                                                                                      | manual screen-reader pass owed (self-declared)                                                                                | schedule human SR pass                                | NO (automated met)                            |
| Copy — stigma-free, person-first                                                  | READY                   | no clinical terms in GFA voice; "return to use" honored (`ConnectionCards.tsx:14-15`)                                                                                                                                                                                                                                                                                     | —                                                                                                                             | —                                                     | YES (met)                                     |
| Canonical CQCX backend                                                            | READY                   | verified earlier: `cqcxvwoukyhxyokfwnjm` ACTIVE_HEALTHY, launch line 0000–0121+0104 applied                                                                                                                                                                                                                                                                               | live re-verify pending                                                                                                        | re-verify at deploy gate                              | YES                                           |
| Production build references no YKY                                                | READY                   | `check-no-retired-ref` + dist guard in CI; build clean                                                                                                                                                                                                                                                                                                                    | —                                                                                                                             | —                                                     | YES                                           |
| No anonymous read of sensitive intake                                             | READY                   | `residence_application_intake`/`listing_submissions` no anon grant (0122); `public.housing_applications` anon INSERT-only after hardening (commit 021e31b)                                                                                                                                                                                                                | live RLS re-verify pending                                                                                                    | re-verify at deploy gate                              | YES                                           |

---

## B. Top launch blockers (ranked: safety → service interruption → privacy/security → staff follow-through → technical)

1. **Support Now full ladder is account-gated (participant safety).** **REPO IMPLEMENTATION
   COMPLETE** (this branch): public `/support` route with the deterministic emergency → crisis →
   GFA hierarchy, GFA warmline + office as `tel:` links on landing / Grace House / directory pages,
   no account required, Grace-independent, a11y + mobile + e2e gated. _Live validation of the
   deployed public path is still pending_ (Type D/E deploy gates).
2. **Password-reset completion was broken (service interruption).** **FIXED** (`b1eb4ef`) —
   **re-verified on this branch** (email repoint → `/reset-password` → recovery handler →
   `updatePassword`, expired-link path included) and **regression-protected**: the fix had shipped
   with zero tests, so the original failure mode (recovery arrival with no mounted handler) was
   invisible to every gate. Added unit suites for both pages, a route-mount guard
   (`App.test.tsx`), and `/reset-password` to the a11y + mobile gates. _Live email-delivery
   round-trip remains a Type D item (existing SMTP-posture finding applies to reset mail too)._
3. **No onboarding intake / consent capture at entry (privacy/dignity).** **REPO IMPLEMENTATION
   COMPLETE** (this branch): minimal onboarding boundary after person provisioning — immediate-
   support question first (yes → `/support`, before any consent), then granular affirmative capture
   of the required-for-service consent types through the existing append-only write path;
   participant-scope only; no new data collection; completed users and staff pass through.
   _Live validation of the signup → onboarding → consent journey is still pending_ (Type D gate —
   the live e2e helpers were updated to complete the new step)._
4. **Grievance dead-end (staff follow-through).** Copy **FIXED** to the reliable path (`b1eb4ef`);
   the durable fix is now **REPO IMPLEMENTATION COMPLETE** (this branch): a `/staff/grievances`
   queue consuming the already-applied 0115 backend — manager-scoped RLS read + `resolve_grievance`
   RPC (server-enforced conflict-of-interest: the filer never disposes of their own grievance) —
   with open/settled separation, policy-timeline framing, and an honest manager-scoped empty
   state. No schema/RLS change was needed; 0115 had prepared both and nothing consumed them.
   _Live disposition round-trip re-verifies at the Type D gate._
5. **Residence pre-account intake not converged (service completeness).** Grace House is served by
   the authenticated in-app apply today; the pre-account boundary (0122) is unapplied and unwired,
   and EJWRH uses a separate `public.housing_applications`. _Fix:_ Phase 4 convergence — gated.
6. **Live verification + production cutover (technical).** RLS live tests, production Cloudflare
   routing, and vrcc.app cutover are Type D/E gates; live MCP was down this turn — BLOCKED until
   re-connected.

---

## C. Minimum Service-Ready Release

**IN (MUST before serving real people):**

- CQCX canonical backend; production build YKY-free (met).
- Auth: sign-up / sign-in / logout / session / **password reset** (met, reset fixed).
- Person provisioning at onboarding (met) **+ a minimal consent-acknowledgment + immediate-support
  step** (met — this branch).
- Consent server-enforcement (met).
- Support Now deterministic (met) **+ GFA warmline surfaced on public pages** (met — this branch).
- Human support request → staff → claim → relationship → messaging/scheduling → service_event →
  follow-up (met).
- Referral intake + staff triage (met).
- Grace House apply (authenticated in-app path, met) — pre-account convergence may follow.
- Staff UIs for coach/navigator/residence-staff/admin (met) **+ staff mobile sign-out** (met, fixed).
- Mobile responsive + a11y automated gate (met).
- No anonymous read of sensitive intake (met).
- Rollback plan + synthetic staging + production smoke (gated).

**OUT (MAY follow after service launch):**

- Grace AI provider activation (stays OFF).
- ICARE UI stepper / advanced ICARE; recovery-capital visualization; advanced dashboards/analytics.
- White-label; statewide scaling; recoveryresidence.org / .app domain binding.
- Participant-initiated session booking UI.
- EJWRH self-apply form; public-intake review UI. (The staff grievance queue fast-follow is now
  done — this branch.)
- Leads admin queue; nonessential animations; authenticated-workspace mobile e2e coverage.

---

## D. Phase 4 — Residence-intake convergence: field-fit matrix (data-minimized)

Comparing Grace House (`residence_applications.answers`, in-app authenticated), EJWRH
(`public.housing_applications`, live anon), and the prepared canonical
`recoveryos.residence_application_intake` (0122). Classification:
COMMON REQUIRED / COMMON OPTIONAL / RESIDENCE-SPECIFIC / STAFF FOLLOW-UP ONLY / REMOVE FROM PUBLIC.

| Field                                                                 | Grace House         | EJWRH                                | 0122 intake                                           | Classification                                                                                        |
| --------------------------------------------------------------------- | ------------------- | ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| residence_id / house_code                                             | (by name)           | `house_code`                         | `residence_id`                                        | **COMMON REQUIRED**                                                                                   |
| applicant name                                                        | firstName+lastName  | `applicant_name`                     | `applicant_name`                                      | **COMMON REQUIRED**                                                                                   |
| email                                                                 | (from account)      | `applicant_email`                    | `applicant_email`                                     | **COMMON REQUIRED** (≥1 of email/phone)                                                               |
| phone                                                                 | `phone`             | `applicant_phone`                    | `applicant_phone`                                     | **COMMON REQUIRED** (≥1 of email/phone)                                                               |
| preferred contact                                                     | —                   | —                                    | `preferred_contact`                                   | COMMON OPTIONAL                                                                                       |
| consent to contact                                                    | (implicit)          | `consent_contact`                    | `consent_to_contact`                                  | **COMMON REQUIRED**                                                                                   |
| rules reviewed attestation                                            | `agreeDocuments`    | `consent_rules_reviewed`             | _(→ answers; recommend first-class `rules_reviewed`)_ | **COMMON REQUIRED**                                                                                   |
| truthful attestation                                                  | `attestTruthful`    | —                                    | _(→ answers; recommend first-class `truth_attested`)_ | **COMMON REQUIRED**                                                                                   |
| location (city/county)                                                | `currentCity`       | `county`                             | _(→ answers or add `city`/`county`)_                  | COMMON OPTIONAL                                                                                       |
| current situation                                                     | `currentSituation`  | `personal.situation`                 | `answers`                                             | COMMON OPTIONAL                                                                                       |
| recovery context / pathway                                            | `recoveryPathway`   | `journey`                            | `answers`                                             | COMMON OPTIONAL (pathway honored)                                                                     |
| your why / notes                                                      | `anythingElse`      | `your_why`                           | `answers`                                             | COMMON OPTIONAL                                                                                       |
| referral source                                                       | —                   | —                                    | `referral_source`                                     | COMMON OPTIONAL                                                                                       |
| share-with-house consent                                              | —                   | `consent_share_with_house`           | _(recommend add)_                                     | RESIDENCE-SPECIFIC (optional)                                                                         |
| MAT/MOUD status                                                       | `matStatus`         | (health in `personal`)               | —                                                     | **STAFF FOLLOW-UP ONLY** (sensitive health; discuss in the human conversation, not required publicly) |
| legal/justice status                                                  | `legalStatus`       | `journey` supervision/reentry        | —                                                     | **RESIDENCE-SPECIFIC** (EJWRH reentry) — keep optional, non-screening; minimize                       |
| date of birth                                                         | `dateOfBirth`       | (in `personal`)                      | —                                                     | **REMOVE FROM PUBLIC / STAFF FOLLOW-UP** (prefer an 18+ affirmation; collect DOB at intake)           |
| emergency contact name/phone                                          | `emergencyContact*` | (references)                         | —                                                     | **STAFF FOLLOW-UP ONLY** (third-party PII; collect at move-in)                                        |
| health/safety detail, references                                      | —                   | `personal` health/safety, references | —                                                     | **STAFF FOLLOW-UP ONLY** (sensitive; not public)                                                      |
| status / reviewed_* / converted_* / decided_* / source / test_fixture | staff/system        | staff/system                         | staff/system                                          | STAFF / SYSTEM (never public input)                                                                   |

**Verdict:** `recoveryos.residence_application_intake` (0122) is a **good fit** for the canonical
multi-residence model (`residence_id` + common fields + a constrained `answers` jsonb for
residence-specific extras) and satisfies "no table per residence." Recommended refinements at the
convergence gate (additive, small): promote `rules_reviewed` + `truth_attested` (and optional
`share_with_house`) to first-class booleans; keep MAT/health/DOB/emergency-contact/references **out
of public intake** (staff follow-up) per data minimization. EJWRH's `public.housing_applications`
converges into this table; the bespoke table is retired after migration.

---

## E. Execution plan (shortest safe path from HEAD to serving real individuals)

1. **(Type B — done this turn)** Fix service-blocking repo defects: password reset, staff mobile
   sign-out, grievance dead-end copy (`b1eb4ef`). ✅
2. **(Type B — done 2026-08-15, `claude/public-support-onboarding-85u07i`)** (a) GFA warmline +
   office on public pages + public `/support` hierarchy (deterministic `tel:`); (b) minimal
   onboarding step (immediate-support prompt + required-consent acknowledgment) reusing the
   existing consent write + `ensureMyPerson`; "what brings you here" deferred under data
   minimization. Typecheck/test/build/a11y/governance gates green. ✅
3. **(Type A/B)** Finalize Phase 4 convergence in repo: refine 0122 per the field-fit matrix, wire a
   pre-account apply page (→ `residence-intake` fn) and a staff intake-review page (→ `intakeReview.ts`).
   Prepare only; do not apply/deploy.
4. **(Type D gate — needs live MCP + authorization)** Apply 0122 to a disposable **staging** CQCX
   clone; deploy `residence-intake` Edge Function + refactored `workers/api` to staging; run **Phase 5
   synthetic journeys** (support participant; Grace House; EJWRH; Support Now; authorization-abuse);
   RLS live tests; clean up fixtures.
5. **(Type D gate)** Apply 0122 to CQCX launch; deploy Edge Function + gateway to production routes;
   re-point the EJWRH form to the canonical boundary; retire `public.housing_applications` after
   migration.
6. **(Type E gate)** Verify production Cloudflare routing; vrcc.app cutover (separate authorization);
   synthetic production smoke; observation window; retire legacy.

---

## F. Phase 6 — Production-readiness gate (status)

| Gate item                                     | Status                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Canonical CQCX backend                        | READY (re-verify live at gate)                                                              |
| Production build references no YKY runtime    | READY (CI-guarded)                                                                          |
| Authentication works                          | READY (reset fixed)                                                                         |
| Onboarding works                              | READY in repo (person-creation + minimal consent/support step; live journey at Type D gate) |
| Consent works                                 | READY (server-enforced; onboarding capture added)                                           |
| Support Now works                             | READY (public `/support` + warmline surfaced; live re-verify at deploy gate)                |
| Human support request works                   | READY                                                                                       |
| Staff can see and act on the request          | READY                                                                                       |
| Service event can be documented               | READY                                                                                       |
| Referral workflow sufficient for live service | READY                                                                                       |
| Grace House intake works                      | READY (authenticated in-app; pre-account convergence pending)                               |
| EJWRH intake works or explicitly held out     | HELD (contact + hardened table; convergence pending)                                        |
| No anonymous read of sensitive intake         | READY (re-verify live at gate)                                                              |
| RLS live tests pass                           | BLOCKED (needs live MCP + staging)                                                          |
| Mobile critical path passes                   | READY (staff mobile sign-out fixed)                                                         |
| Accessibility critical path passes            | READY (automated; manual SR owed)                                                           |
| Production Cloudflare routing verified        | BLOCKED (Type E gate)                                                                       |
| Rollback plan exists                          | READY (per-change; documented)                                                              |
| Synthetic production smoke passes             | BLOCKED (Type E gate)                                                                       |

---

## Verdict

The core human-service pathway is functional and safe, three service-blocking defects are fixed, and
the remaining work is well-defined additive fast-follows plus gated deploy steps. Nothing found is a
design dead-end; no button implies a human is contacted when none is.

**RECOVERYOS SERVICE READINESS: READY FOR IMPLEMENTATION**

**Next single controlled gate:** the **staging validation gate** (Type D) — with live Supabase +
Cloudflare access restored and explicit authorization: apply `0122` to a disposable staging CQCX
clone, deploy the `residence-intake` Edge Function to staging, and run the Phase 5 synthetic journeys

- RLS abuse tests (fixtures only, cleaned up). The two repo fast-follows in Execution Plan step 2
  (public warmline + minimal onboarding/consent step) are **done** (2026-08-15, this branch) under
  existing Type B authority; their live behavior is verified as part of the same staging gate.
