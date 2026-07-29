# Data Source Registry

| Build | Supabase Project | Schemas / usage | Authentication | Storage | External APIs |
| --- | --- | --- | --- | --- | --- |
| vrcc.app (`vrcc-current`) | `ykykeioydvtxpyreshhs` (mvp module) | mvp: gate_19b migrations against live project | Supabase Auth (mvp) + Base44 SDK auth (legacy pages) | UNVERIFIED | Base44 SDK (`@base44/sdk`) |
| Recovery Residence OS | `ykykeioydvtxpyreshhs` | `gfa_residence` (extends), `gfa_ui` identity spine; PostgREST-exposed | Supabase Auth | Supabase Storage (documents) | none observed |
| Grace House (`grace-harbor-16`) | `kmvlkvfxrjqrfxsljvxl` | Lovable-managed | Supabase Auth | UNVERIFIED | Lovable |
| GFA Connection (`contact-connect-dashboard`) | `yqonwnzqtgmnoiymkefk` | Base44-style api client | Supabase Auth | UNVERIFIED | none observed |
| Canonical RecoveryOS | `ykykeioydvtxpyreshhs` (target) | `supabase/migrations/0001–0009` define the target model | Supabase Auth | Supabase Storage | Cloudflare Worker gateway |

## Critical finding: the live canonical database is not empty

Per `RecoveryResidenceOS/docs/GRACE_HOUSE_AUDIT_AND_INTEGRATION_PLAN.md` (verified
against that repo, dated 2026-07-21), project `ykykeioydvtxpyreshhs` ("Grace For
Addictions", us-west-2, Postgres 17) already carries **~90 applied migrations** in four
application schemas:

| Schema | Contents (as documented there) |
| --- | --- |
| `public` | participants, coaching, assessments, recovery capital, **59 slogans**, ICARE plans, resources/referrals, organizations, programs, program_enrollments, `app_users` RBAC |
| `gfa_ui` | `participant_profiles` (canonical identity spine), consent_records (insert-only 42 CFR-style), privacy_preferences, security_audit_log, check-ins, journey_events, invites |
| `gfa_core` | participants, coaches, navigators, volunteers, lookups |
| `gfa_residence` | providers, residences, beds, waitlist, drug_tests, house_meetings, chores, incidents (levels 1–4), phase_history, discharges, fee_ledger, supervision_reports, NARR compliance, Iowa HHS checklist |

**Consequence:** the canonical migrations in this repo are the *target* model. They must
NOT be blindly applied to the live project. See `docs/migration/README.md` for the
reconciliation strategy. This registry entry is UNVERIFIED against the live database
itself (Supabase access not yet authorized in this session) — verified only against the
Residence OS repository's audit document and migration files.

## Consolidation direction

Three Supabase projects → one (`ykykeioydvtxpyreshhs`). The Grace House and GFA
Connection projects (`kmvlkvfxrjqrfxsljvxl`, `yqonwnzqtgmnoiymkefk`) are Phase 8 data
migration sources, then archived. Base44 SDK dependence is retired with the legacy
vrcc.app page set.
