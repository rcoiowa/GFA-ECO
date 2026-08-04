# Live database drift — reconciliation (2026-08-04)

Parallel Claude sessions worked on the same Supabase project
(`ykykeioydvtxpyreshhs`) and the same repository at the same time. This note
records what drifted, what was recovered, and the rule that prevents a repeat.

## What happened

1. **Three migrations were applied live that did not exist in this repo**, and
   their names reuse numbers this repo had already used for different work:

   | Applied live as (name / date)                           | Recovered into repo as                   |
   | ------------------------------------------------------- | ---------------------------------------- |
   | `recoveryos_0014_fix_document_policy_recursion` (Aug 2) | `0020_fix_document_policy_recursion.sql` |
   | `recoveryos_0015_appointment_request_self` (Aug 2)      | `0021_appointment_request_self.sql`      |
   | `recoveryos_0016_residency_phase` (Aug 3)               | `0022_residency_phase.sql`               |

   Their SQL was read back out of `supabase_migrations.schema_migrations` and
   committed verbatim, with a header recording the original applied name. The
   live database is unchanged by this recovery — it is a repo-side catch-up.

2. **A parallel feature branch existed**
   (`claude/residence-application-flow-jsesw6`, forked from `a3c95d3`) carrying
   the in-app residence directory, the online application flow, the applicant
   status page, the operator onboarding wizard, an expanded intake API, the
   `sites/gfa-vrcc-residence/` page, and migrations 0018–0019. It has been
   merged into `claude/recoveryos-greenfield-build-8pns7n` in full — two
   link-level conflicts (landing page, Grace House page) were resolved by
   keeping **both** sets of links.

3. **Migrations 0018 and 0019 had never been applied.** Both were applied live
   on 2026-08-04 under their canonical names (`recoveryos_0018_applicant_flow`,
   `recoveryos_0019_universal_residence_onboarding`) after verifying no policy
   or column collisions.

## Known overlap to resolve later (not a conflict today)

- **Phase storage is duplicated.** This repo's `0014` created
  `residency_phases` (phase _history_); the recovered `0022` added
  `residencies.phase` + `phase_started_at` (current phase) and
  `employment_curfew_exceptions`. Both are live and neither breaks the other:
  `getPhaseInfo()` derives phase from the admission date and treats the history
  table as the override source. A single read path should be chosen before
  staff begin setting phases by hand.
- **Two application intake paths exist.** `recoveryos.residence_applications`
  (canonical, used by the platform) and `gfa_residence.applications` (created
  live on 2026-07-30 by `public_applications`, used by the legacy Grace House
  site). The canonical path is the target; the legacy table stays until the
  legacy site is retired.
- **Two directories exist by design**: the in-app database-backed directory at
  `/recovery-residences`, and the static RecoveryResidence.org page mounted at
  `/residence/directory/`. Both are linked from the landing page.

## Round 2 (same day): two more branches found

A sweep of every remote branch found two more with unique work.

### `claude/recoveryos-greenfield-build-ka6992` — 14 commits, diverged at `e788f8d`

It built its **own** Phase 4 resident area in parallel with this branch's. Its
unique, non-duplicated work was cherry-picked in rather than merged wholesale,
because a full merge would have collided two independent implementations of the
same pages:

**Taken:**

- `packages/design-tokens/src/themes/visual.css` + `ThemeSwitcher` — seven
  visual themes (Default, Dark, Space starfield, Sky, Retro, GFA Brand, RCOIA),
  wired into `AppShell` with a no-flash pre-paint script in `index.html`.
- **Verified Support Now contacts** — this branch was shipping a placeholder
  phone number (`+1 515 000 0000`) on the crisis ladder. Replaced with the
  canonical GFA warmline 515-310-DIAL (3425) and office 515-220-8771. The Iowa
  Warm Line was kept as well (the other branch had dropped it).
- `.github/workflows/deploy-staging.yml` — auto-deploy to Cloudflare on push,
  retargeted to this branch and the root `wrangler.jsonc`.
- `packages/data-access/src/repositories/sessions.ts` — coaching-session
  requests, which pair with the already-applied `appointments_request_self`
  policy.
- Docs: `STATE-OF-THE-SYSTEM.md`, `content-intake/grace-house/INDEX.md`,
  `operations/email-deliverability.md`, ADR-0013, and its ADR-0012 renamed to
  **ADR-0014** (this repo's ADR-0012 is the document-library decision).

**Deliberately not taken** (duplicates of live-verified work on this branch,
which is aligned to the canonical v2 documents): its resident pages
(`PassesPage`, `ResidentDocumentsPage`, `ResidentSchedulePage`, its
`GrievancePage`/`MyResidencePage`/`ResidentTodayPage` variants),
`repositories/residenceOps.ts`, `domain/src/residence/phases.ts`, and
`0013_resident_operations_policies.sql` (superseded live by the recursion fix
recovered as `0020`). The branch is preserved — nothing is deleted.

### `claude/what-is-built-here-3co21c` — 2 commits

A standalone Cloudflare Worker (`grace-vrcc`) holding four VRCC tools as
base64-embedded HTML, with its own root `wrangler.toml`, `index.js`, and
`deploy.sh`. **Not merged**: it is a deployment artifact, not monorepo code,
and its root `wrangler.toml` would collide with this repo's `wrangler.jsonc`.
It stays on its branch as a preserved SOURCE artifact.

## Rule going forward

One session owns the live database at a time. Any session applying a migration
must (a) use the next unused number in `supabase/migrations/`, and (b) commit
the file to the repo in the same session it applies it. Before applying
anything, run `list_migrations` and compare against the repo — the drift above
was invisible until someone looked.
