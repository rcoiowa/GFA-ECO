# Staging Pilot Reconciliation (2026-08-31)

> **CORRECTION (2026-08-31, readiness review):** deeper cohort analysis shows **60 of the
> 66 accounts are `@fixtures.recoveryos.test` live-suite fixtures** (created in machine-
> cadence bursts 08-08→08-10 by the P4H live suite, which writes to CQCX directly — not
> through the staging front end). The **real human cohort is 6 accounts**: 2 staff
> (2026-08-09 / 08-11) and 4 participants/coaches created 2026-08-31. Every continuity
> conclusion below stands (all real accounts are canonical CQCX, email+password, 1:1
> person join, confirmed); the "66 pilot users" phrasing overstated the human population.
> The unconfirmed account and the zero-consent observations belong to fixtures, not real
> users. Authoritative going forward:
> `docs/operations/vrcc-production-readiness-2026-08-31.md`.

**Operational fact (executive notice, 2026-08-31):** `recoveryos-staging.thomas-499.workers.dev`
was given to real residents and coaches, who created accounts and completed onboarding
activity there. Effective immediately, `recoveryos-staging` is classified as an
**ACTIVE PILOT / PRE-PRODUCTION surface containing real participant data — not disposable
staging.** No deletion, reset, purge, migration, or recreation was performed or is needed.

## Primary answer

**Yes — the pilot residents and coaches are already on the same canonical identity and data
layer as the production candidate.** Both `recoveryos-staging` and
`gfa-eco-recovery-residence-os` run the identical commit and bake the identical Supabase
backend (`cqcxvwoukyhxyokfwnjm`) and publishable key. Moving users to the canonical URL is a
**front-end URL transition only** — no account migration, no data migration, no re-signup.
Users will need one fresh sign-in on the new origin (browser sessions are stored per-origin);
their credentials, roles, profiles, consents, and workspaces are identical because they live
in the shared project, keyed to the auth identity, not to the front-end hostname.

## Evidence (verified live, 2026-08-31, read-only)

### 1. Backend used by the deployed `recoveryos-staging` bundle

- **Empirical proof it is CQCX `cqcxvwoukyhxyokfwnjm`:** after today's staging redeploy
  (run 71, 00:28 UTC), a new account was created in CQCX at **01:36 UTC** and a sign-in
  recorded at **01:38 UTC** — registrations and logins through the currently deployed
  staging bundle land in the canonical project.
- **History:** `deploy-staging.yml` baked the retired project (`ykykeioydvtxpyreshhs`) from
  its creation on 2026-08-04 until commit `c10b965` on **2026-08-08** switched it to
  vars-or-CQCX-fallback. The app source itself also falls back to CQCX
  (`apps/platform/src/main.tsx`).
- **Pilot signup dates in CQCX:** 2026-08-08 (11), 08-09 (36), 08-10 (14), 08-11 (1),
  08-31 (4) — the cohort registered starting exactly the day of the backend fix.
  **Open confirmation for the Executive Director:** if anyone attempted registration on the
  staging URL *before* 2026-08-08, that attempt would have landed in the retired project
  and would not exist in CQCX. No evidence of that exists in CQCX (no orphan artifacts),
  and the retired project was not queried (standing do-not-touch rule). If no pilot user
  reports a "vanished" account from before Aug 8, this is closed.

### 2. Are the staging-created records in canonical CQCX? — YES, all of them

- **66 auth users = 66 people**, a perfect 1:1 join in both directions (zero auth users
  without a profile; zero profiles without an auth user).
- **Active roles:** 66 participant, 19 coach, 3 resident, 3 residence_manager,
  3 residence_staff, 2 executive, 2 navigator, 2 administrator, 1 program_manager.
- **Activity:** 60 active consent grants, 19 service events (latest 01:14 UTC today),
  13 conversations; latest sign-in 01:38 UTC today.
- **Providers:** 66/66 email+password (project-scoped credentials — they work from any
  front-end origin pointed at this project). 65/66 email-confirmed; **1 account is
  unconfirmed** (flag: that person may need a resent confirmation — no action taken).
- Note on record shapes: the formal intake artifacts (residence applications, document
  signatures, residency rows) currently in CQCX are the known synthetic test fixtures
  (person 144 et al.). The real pilot cohort's footprint is accounts, profiles, roles,
  consents, conversations, and service events — they have not yet been taken through the
  formal application → readiness → admission flow that went live with Gate B/0146.

### 3. Backend used by `gfa-eco-recovery-residence-os` — identical

Same commit (`ec36922`) deployed 2026-08-31; `deploy-production-candidate.yml` hardcodes
`VITE_SUPABASE_URL=https://cqcxvwoukyhxyokfwnjm.supabase.co`, and its in-workflow bundle
guard grep-verified the built assets contain the canonical ref and no retired ref before
upload. There is no backend divergence between the two Workers.

### 4. Can a staging-created resident and coach authenticate on the candidate with the same credentials and state? — Yes

- Credentials: Supabase Auth is project-scoped; both bundles use the same project + same
  publishable key; auth endpoints are not origin-restricted. The same email/password works
  on either URL. (Browser sessions do not carry across origins — one fresh sign-in on the
  new URL, nothing else.)
- State: verified read-only with simulated JWTs for one real coach and one real resident
  account (rolled back, counts only): `current_person_id()` resolves each auth identity to
  the correct person; the coach's active role and participant visibility and the resident's
  own-record scoping resolve identically — the resolution path depends only on the JWT
  subject, never on the front-end hostname. A live sign-in probe from this container was
  not possible (egress-blocked, and real credentials are neither held nor resettable under
  the no-user-impact rule); the structural + simulated verification above is the basis.

### 5. Environment-specific behavior audit (URL-transition blockers)

| Surface | Finding | Transition impact |
|---|---|---|
| Supabase Auth URL config (Site URL, redirect allowlist) | **Not readable with available tools — verify in dashboard.** Password reset uses `window.location.origin + '/reset-password'`; GoTrue honors it only if allowlisted. Signup-confirmation links go to the configured Site URL. | **Action before/at cutover:** ensure the allowlist contains `https://recoveryos-staging.thomas-499.workers.dev`, `https://gfa-eco-recovery-residence-os.thomas-499.workers.dev`, and `https://vrcc.app`; move Site URL to the canonical production URL at cutover. |
| `residence-intake` edge function | Origin allowlist = recoveryresidence.org/.app (+www). Both workers.dev origins AND `vrcc.app` are origin-rejected for the in-app public referral/listing submissions (`publicIntake.ts`). Identical on staging and candidate today — no divergence. | **Action at cutover:** add `https://vrcc.app` to `ALLOWED_ORIGINS` and redeploy the function, or those public forms fail from vrcc.app. |
| `grace`, `create-meeting` edge functions | CORS `*` | None. |
| PostgREST / RPCs | Publishable key + RLS; no origin binding | None. |
| Host-specific routing (`App.tsx HOST_HOMES`) | Only remaps `/` on named public domains; workers.dev and vrcc.app fall through to the standard landing; every route reachable on every host | None. |
| Service worker (`sw.js`) | App-shell cache only, same-origin static assets only | None — each origin caches its own shell. |

### 6–7. Preservation & classification

Nothing was deleted, reset, migrated, or recreated; all verification queries were read-only
(identity simulations inside rolled-back transactions). `recoveryos-staging` is
**ACTIVE PILOT** — it must not be treated as disposable, redeployed with a different
backend, or torn down while pilot users depend on it. Its deploys must keep
`VITE_SUPABASE_URL` on CQCX (the workflow fallback already guarantees this when the repo
variable is unset).

## 8. Recommended safest transition path (no action taken — for executive decision)

1. **Now (config, no user impact):** verify/add the three origins in Supabase Auth URL
   configuration; add `vrcc.app` to the `residence-intake` allowlist (code + function
   redeploy); resend confirmation for the 1 unconfirmed account if that person is active.
2. **Cutover (separately authorized):** point `vrcc.app` DNS at
   `gfa-eco-recovery-residence-os`; set Auth Site URL to `https://vrcc.app`. Users sign in
   at vrcc.app with existing credentials; everything is already there.
3. **Transition period:** keep `recoveryos-staging` serving unchanged (same backend, same
   commit) so bookmarks keep working — both URLs are the same app on the same data.
4. **Wind-down (later, separately authorized):** replace the staging Worker with a 301
   redirect to the canonical URL. Never delete it while pilot bookmarks may exist; there is
   no data in the Worker itself — all data is in CQCX.
5. **Deploy discipline going forward:** every deploy to either Worker ships from the same
   commit lineage with CQCX baked; the production-candidate workflow's bundle guard already
   enforces this — mirror that guard into `deploy-staging.yml` (small follow-up).
