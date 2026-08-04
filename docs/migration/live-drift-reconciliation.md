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

## Rule going forward

One session owns the live database at a time. Any session applying a migration
must (a) use the next unused number in `supabase/migrations/`, and (b) commit
the file to the repo in the same session it applies it. Before applying
anything, run `list_migrations` and compare against the repo — the drift above
was invisible until someone looked.
