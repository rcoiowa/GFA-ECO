# Migration & Cutover Strategy

Strangler-style. No destructive cutover: every legacy deployment stays live and
untouched until staging is validated and rollback documented.

## The database reality

The canonical Supabase project `ykykeioydvtxpyreshhs` is **not empty**: ~90 migrations
across `public`, `gfa_ui`, `gfa_core`, `gfa_residence` (see
`docs/source-inventory/data-source-registry.md`). Two other projects
(`kmvlkvfxrjqrfxsljvxl` — Grace House, `yqonwnzqtgmnoiymkefk` — GFA Connection) hold
additional data.

**Decision (EXECUTED 2026-07-29):** the canonical target schema in
`supabase/migrations/0000–0011` is deployed into the live project as the
**`recoveryos` schema** (verified live: all migrations applied, reference data
seeded, PostgREST exposure added to the existing `pgrst.db_schemas` list, RLS
verified end-to-end by a browser test that registered, provisioned, checked in,
consented, created a goal, and was correctly denied the resident area; test data
then removed). The legacy schemas were not touched. ETL mappings to run in Phase 8:

| Live source                                                                  | Canonical target                                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gfa_ui.participant_profiles` + `gfa_core.participants` + `public.app_users` | `people` / `person_profiles` / `role_assignments` (deduplicated, provenance columns) |
| `public.program_enrollments`, `public.programs`                              | `program_enrollments`, `programs`                                                    |
| `gfa_residence.residences/beds/waitlist/...`                                 | `residences`, `residence_beds`, `residencies`, operations tables                     |
| `gfa_ui.consent_records`                                                     | `consent_grants` (append-only history preserved verbatim)                            |
| `gfa_ui` check-ins / journey_events                                          | `check_ins` / `service_events`                                                       |
| `public` recovery capital, slogans, ICARE                                    | `recovery_capital_assessments`, content tables                                       |
| Grace House + GFA Connection projects                                        | person-matched imports with provenance                                               |

Rules: map old identifiers in `*_legacy_ref` columns; deduplicate people by verified
contact + human review queue, never by name alone; nothing is deleted at the source
until the canonical read path is validated.

## Sequence

1. **Now (done):** all five sources inventoried; registries written; canonical repo
   building; legacy deployments labeled SOURCE and left untouched.
2. **Staging:** deploy `apps/platform` to a staging Pages project
   (`staging-vrcc.pages.dev` or equivalent) against the canonical schema.
3. **Engines before data:** Phases 3–7 build canonical engines; new writes go to the
   canonical schema from day one of staging.
4. **Phase 8 data migration:** run the ETL mappings above; validate analytics
   (unique-people dedup, context attribution) against known legacy counts.
5. **Phase 9 cutover:** re-point `vrcc.app` custom domain from Worker
   `virtualrecovery` to the platform deployment; workers.dev URLs remain as read-only
   archives; rollback = re-point the domain back (DNS-level, minutes).

## Auth configuration (verified live)

- Email confirmation is **required** on signup; unconfirmed accounts cannot sign in.
- Default email rate limit (2/hour) applies — custom SMTP is a launch requirement.
- Undeliverable domains (e.g. example.com) are rejected with `email_address_invalid`.

## Satellite projects (verified via account listing)

The account's `GFAVRCC's Project` (`giloyvmjpyqrnbqbkxim`) and
`contact-connect-dashboard` (`vlsxjkqyaexcxwkbovlq`) are both INACTIVE. The project
refs found in the grace-harbor-16 and contact-connect-dashboard source code
(`kmvlkvfxrjqrfxsljvxl`, `yqonwnzqtgmnoiymkefk`) are not in this account — restore
the inactive projects and reconcile before assuming any satellite data must migrate.

## Remaining blockers

- Cloudflare Pages create/deploy access for the staging project.
- Custom SMTP + email templates before real registrations.
