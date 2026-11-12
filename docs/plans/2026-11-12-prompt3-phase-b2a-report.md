# Prompt 3, Phase B2-A — Frontend-Isolated Acceptance Report (2026-11-12)

**Authorization:** Executive authorization "Phase B2-A" of 2026-11-12 (proposal #1 only).
**Restrictions honored:** no write, synthetic submission, sign-in, or account creation
against production Supabase (verified — the browser run's complete non-GET request log
contains only the Turnstile widget's own telemetry to `challenges.cloudflare.com`; zero
requests of any method to `*.supabase.co` beyond the page's ordinary GETs); no change to
production Workers, domains, DNS, Wix, Edge Functions, database, or permissions; PR #52 not
merged; Grace 1.2.1 not promoted; DR-02 untouched. **This is read-only browser acceptance on
an isolated frontend — it is not, and is not claimed as, full end-to-end acceptance.**

## 1. Pre-deployment gate checks (all passed before dispatch)

1. **Isolation reconfirmed (2026-11-12 04:11 UTC), content-divergence method:** the
   candidate hostname served release `61a39346` while all seven production surfaces
   (`vrcc.app`, `www.vrcc.app`, `recoverycommunity.center`, `recoverycommunity.app`,
   `recoveryresidence.org`, `recoveryresidence.app`, the staging hostname) served
   `4990829e` — a public surface bound to the candidate Worker would have served the
   candidate's content, so none is. *Limit:* Cloudflare binding configuration itself is not
   exposed to the available read tool; the method covers the known production surfaces and
   was re-proven post-deploy (§3). Corroborating record: the authorized 2026-10-23
   Cloudflare read (`PRODUCTION-IMPACT.md`) showing `vrcc.app` attached to
   `recoveryos-staging`.
2. **Workflow verified:** `deploy-production-candidate.yml` at the integration commit is
   byte-identical to `main`'s; it deploys only via root `wrangler.jsonc` (Worker name
   `gfa-eco-recovery-residence-os`, no routes/custom-domain keys), requires green CI on the
   exact SHA, runs typecheck/tests/build inline, gates on typed `DEPLOY_CANDIDATE`, and
   performs no domain or DNS action (its own summary records "Domain/DNS cutover: NOT
   PERFORMED").
3. **Branch and CI:** `integration/reconcile-2026-11` confirmed at
   `3761d6444e0a2f9046543cfac5202ae6ebdc8e99`; hosted CI success on that exact head
   (run 43124838514) and on the prior head `1bd8a834` (run 43123129669).
4. **Recovery captured:** candidate Worker id `ec9064a9d2d645538395aa53d8cb0c39`,
   pre-deploy release `61a39346` (commit reachable in-repo; its green CI recorded in
   PR #37: run 38445495577; its deployment: run 38445699347). **Rollback = re-dispatch the
   same workflow with `release_ref=61a39346abf5c752260f054961ae5bcad9b4dd70`** — affects
   only the candidate hostname.

## 2. Deployment

Dispatched `deploy-production-candidate.yml` (ref `integration/reconcile-2026-11`,
`release_ref=3761d644…`, confirmation `DEPLOY_CANDIDATE`). **Run 43153190849: SUCCESS**
(including its internal typecheck, full test suite, build, Turnstile-config and
retired-backend-ref gates).

## 3. Deployed-target and unchanged-production verification (04:13 UTC)

| Surface | `release.json` |
| --- | --- |
| **Candidate** `gfa-eco-recovery-residence-os.thomas-499.workers.dev` | **`3761d644…` (the exact integration commit)**, backend CQCX |
| All six public domains + staging hostname | **unchanged: `4990829e…`**, backend CQCX |

The post-deploy divergence is itself a second isolation proof: the candidate now serves
different content than every production surface.

## 4. Read-only browser acceptance — 21/21 PASS (Chromium/Playwright)

- **Public navigation:** landing (HTTP 200, main landmark, correct title); Community
  Center page and journey; resources page (27 external resource links); residence
  directory listing both Grace House and EJWRH.
- **Application forms render without submission:** Grace House and EJWRH apply pages each
  render 15 form fields, consent checkboxes, and a submit control. **Nothing was filled or
  submitted.**
- **Sign-in gates (no authentication attempted):** `/sign-in` renders email+password;
  `/my-housing`, `/vrcc/resources`, `/coach` (the Circle entry shell), and
  `/staff/document-review` each redirect to `/sign-in` **carrying the correct `next=`
  return path** — the Circle/GFARC return-path behavior verifiable without auth.
- **Accessibility:** 8-stop keyboard pass on the Community Center with every stop visible
  and accessibly named; lobby loads under `prefers-reduced-motion`; 200% text size keeps
  all sign-in controls rendered; mobile 375px shows zero horizontal overflow on landing,
  Community Center, the Grace House application, and sign-in.
- Screenshots retained in session records (landing, community center, directory, both
  apply pages, reduced-motion lobby, mobile, 200% zoom).

**Observations (not failures):** the Turnstile widget emits its own telemetry POSTs and
console noise; this sandbox's egress proxy blocked one Turnstile subdomain, so the
**fully rendered challenge widget was not verifiable from this environment** — its
container and the form render correctly; widget completion is a human-browser check.

## 5. Tests blocked because the candidate frontend connects to production Supabase
(documented, not bypassed)

Authenticated journeys (sign-in, registration, password reset); document attestation
end-to-end with receipts; consent read/write/revocation display against live data
(including verifying the expired/revoked fix with a real grant); Circle/GFARC workspace
content, drafts, and note scoping; application submission and staff queue delivery;
`/my-housing` content for a linked applicant; role-gated staff/coach/navigator/admin
screens; the manual screen-reader pass. All require either the Issue #35 DEV-target
decision or an explicitly authorized production test method with consented accounts or
fixtures.

## 6. Rollback readiness

Production: untouched; nothing to roll back. Candidate: one workflow dispatch restores
`61a39346` (§1.4). The integration branch and both CI-green heads are preserved.

## 7. Recommended next executive decisions

1. **Human look at the candidate** (optional but cheap): open
   `https://gfa-eco-recovery-residence-os.thomas-499.workers.dev` yourself — including the
   Turnstile widget this environment couldn't fully load — before anything further.
2. **Merge PR #52** (separate approval; merging deploys nothing) so `main` becomes the
   reconciled line.
3. **Decide the acceptance path for the blocked tests (§5):** the Issue #35 DEV-target
   decision, or an authorized production test method.
4. Then, separately: production deploy of the same SHA (rollback remains one redeploy of
   `4990829e`), and the carried repo-only items (housing follow-through SQL adoption,
   attestation authorization disposition, cleanup batch).

**Stopped per the authorization. No further deployment or merge will occur without your
review.**
