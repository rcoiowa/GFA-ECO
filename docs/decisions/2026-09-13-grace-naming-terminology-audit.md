# Grace naming terminology audit — retired-label occurrence register (2026-09-13)

Companion record to `2026-09-13-grace-ai-support-navigator-naming.md`. Result of an
exhaustive case-insensitive repository scan (`rg -n -i 'companion'`, excluding
`pnpm-lock.yaml`) for the retired labels — "Grace Companion", "Grace AI Companion",
"Grace — Peer Companion", "peer companion", "AI peer companion", "AI peer-support
companion", "AI recovery companion" — after the rename landed. Every remaining
occurrence is classified below. Classes follow the naming decision:

- **REPLACE / REFINE** — none remain; all current participant-, partner-, staff-,
  prompt-, policy-, training-, and product-facing occurrences were updated in this
  change.
- **KEEP-HISTORICAL** — dated evidence preserved verbatim under a historical-
  terminology notice.
- **KEEP-COMPATIBILITY** — stable identifiers (routes, function slugs, database
  fields, migration history) that cannot safely change.
- **MIGRATE-LATER** — identifiers that could eventually change only under a
  separately approved compatibility plan.
- **NOT-A-LABEL** — ordinary English use of the word "companion" unrelated to
  Grace's product or role identity; not governed by the naming decision.

## KEEP-HISTORICAL (verbatim evidence under a notice)

| Location                                                                                                | Content                                                                                                                                          | Justification                                                                                                               |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `docs/product/grace-ai-source-audit.md` (all occurrences)                                               | quoted legacy UI copy ("Grace Companion", "Your 24/7 AI Recovery Companion"), legacy prompts, G0/G1-era decision rows, archived authority titles | Dated G0 evidence record; historical-terminology notice at top; decision record permits retained wording as quoted evidence |
| `docs/product/grace-ai-implementation-authority-v1.0.md`                                                | ratified V1.0 title and body ("Grace AI Peer Companion", "AI recovery companion")                                                                | Ratified governance artifact preserved verbatim; supersession notice at top points to Authority V1.1                        |
| `docs/product/grace-ai-authority-v1.0-reconciliation.md`                                                | "Companion/reflect/ground…" conformance row                                                                                                      | Dated reconciliation record; supersession notice at top                                                                     |
| `docs/product/grace-ai-canonical-implementation-report.md`                                              | historical V1.0 title, legacy slugs `grace-companion(-v6)`, legacy route `/vrcc/app/companion`                                                   | Dated G1–G8 report; historical-terminology notice at top                                                                    |
| `docs/launch/prelaunch-production-reset-audit.md`, `docs/launch/launch-foundation-completion-report.md` | "Grace Companion decision", "legacy AI companion iterations", `grace-companion(-v6)` slugs                                                       | Dated launch audits of the retired dev project; notice at top                                                               |
| `docs/discovery/reos-blueprint-review.md`                                                               | "nonclinical companion"                                                                                                                          | Dated review of the historical blueprint; notice at top                                                                     |
| `docs/discovery/p1-github-source-of-truth.md`, `docs/discovery/p1-completion-report.md`                 | `grace-companion`, `grace-companion-v6` Edge Function slugs                                                                                      | Dated discovery records listing legacy function identifiers (also KEEP-COMPATIBILITY as slugs)                              |
| `docs/source-inventory/route-registry-sources.md`, `component-preservation.md`, `feature-matrix.md`     | `GraceCompanion` component names from cloned legacy source                                                                                       | Inventory of recovered legacy code; component names are evidence identifiers; notice at top                                 |
| `docs/source-documents/recovering-the-mind/gfa_slogans_seed_viewer.html`                                | "Grace Companion-ready" inside a recovered HTML export                                                                                           | Verbatim source-intake artifact; never edited by policy                                                                     |
| `docs/decisions/2026-09-13-grace-ai-support-navigator-naming.md`, this file                             | the retired labels named as retired                                                                                                              | The decision record itself must name what it retires                                                                        |

## KEEP-COMPATIBILITY (stable identifiers — do not change)

| Location                                                | Identifier                                                                                                                                              | Justification                                                                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/README.md`                          | `grace-companion`, `grace-companion-v6`                                                                                                                 | Deployed legacy Edge Function slugs on the retired dev project; renaming deployed slugs is out of scope (descriptor text around them updated to mark the label historical) |
| `supabase/launch/migrations/0112_navigation_domain.sql` | comments "coach companion" (×2)                                                                                                                         | Applied migration history is immutable; also refers to the human coach session-completion attestation, not Grace                                                           |
| Legacy dev project (external)                           | `grace_ai_companion` consent key, `participant_profiles.grace_companion_opted_in` / `grace_companion_mode_default` columns, `/vrcc/app/companion` route | Documented in the audits above; live only on the retired `ykykeioydvtxpyreshhs` project, outside this repository's deployable surface                                      |

## MIGRATE-LATER

None required. The retired dev project's `grace-companion*` function slugs and
`grace_companion_*` columns are already scheduled for decommission under the
existing G8 / production-reset plans; if any is ever carried forward instead, it
needs a separately approved compatibility plan before renaming.

## NOT-A-LABEL (ordinary English "companion", unrelated to Grace)

| Location                                                                         | Content                                                         |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `scripts/check-no-retired-ref.mjs`                                               | "source-level companion to the dist-bundle grep"                |
| `supabase/live-drift/cqcx/0123_housing_applications_least_privilege.APPLIED.sql` | "see the companion block at the bottom"                         |
| `docs/product/recoveryos-icare-integration-authority-v1.0-reconciliation.md`     | "Companion to `recoveryos-icare-integration-authority-v1.0.md`" |
| `docs/discovery/grace-coaching-p0-remediation.md`                                | "Companion to `grace-coaching-audit.md`"                        |

## Verified clean (zero retired-label occurrences)

Participant UI (`apps/platform/src`), consent seed text, accessibility copy,
server-authoritative policy (`supabase/functions/grace/policy.ts`), the Grace and
grace-judge Edge Functions, tests, fixtures, eval scenarios and judge prompts,
`scripts/grace-eval.mjs`, `CLAUDE.md` and bootstrap docs, `workers/`, `sites/`,
`packages/`, and lock files. The participant-facing disclosure
(`GracePage.tsx`) and the server-authoritative disclosure (`policy.ts`) are
byte-identical to the canonical ratified disclosure.
