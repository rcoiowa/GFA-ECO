# Housing and private Admin Collaboration database activation

Applied successfully to **RecoveryOS-Launch** (`cqcxvwoukyhxyokfwnjm`) on 2026-10-20.

- Ledger version: `20261020010443`
- Migration name: `housing_follow_through_private_admin_collaboration`
- Exact submitted SQL: [activation.sql](activation.sql)
- SHA-256: `7bd747920dd2ffe4a997fab0a7f043c4d23f7807e54b7dd5ddcbe3d3a1804439`
- Reviewed source: PR #41 `443ac219c083d27f11bacf9ba5aa1a5dff2d3059`,
  `schema.sql` and `collaboration-schema.sql`.

The approved migration combines those two proposals in one transaction with bounded
lock/statement timeouts and a PostgREST schema reload notification. Production default
ACLs granted `service_role` access automatically; the activation explicitly revokes that
inherited access on only the five new tables and new identity sequence. It changes no
existing authorization helper, role assignment, intake/conversion routine or existing record.

## Verified results

- All five intended tables exist and have RLS enabled.
- `authenticated` has SELECT only on housing state/events; no direct INSERT/UPDATE/DELETE.
- Source references and both private admin tables have no direct anon/authenticated/service_role rights.
- Exactly the three approved scoped RPCs grant authenticated EXECUTE; anon and service_role are denied.
- Housing SELECT policies retain the canonical intake's existing RLS. Admin RPCs derive the owner
  from the canonical current person and require current platform-admin/production authorization.
- A read-only production transaction using an unmapped synthetic subject confirmed denial of
  housing mutation and admin read/save, denial of direct admin-table access, and anonymous
  table/RPC denial. It wrote no records and was rolled back.
- All five new tables contained zero rows after activation and verification.
- Before/after fingerprints match for current_person_id, has_role, staff_residence_ids,
  is_platform_admin and is_care_operations_staff.
- Bridge schema absent; bridge role count zero; purge function absent.
- The exact activation SQL passed isolated application-schema replay and existing full housing/admin
  contracts, including positive access, cross-owner/residence restrictions and conversion continuity.
  Positive-user tests were local/synthetic; no real account was impersonated in production.

Security advisors report informational RLS-with-no-policy findings for the three intentionally
RPC-only new tables; they have no direct client grants. This is the deny-by-default design,
not permission to add permissive policies. Existing unrelated advisor warnings were left unchanged.
[Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Explicit exclusions and remaining setup

No bridge credentials, OAuth clients/grants, token hooks, retention/purge functions, deletion
schedule, app deployment or feature-flag activation occurred. Database activation alone does
not mean the app or bridge is live. PR40 and unrelated release work remain untouched.

The native Mac custom MCP dialog is confirmed available, but no endpoint or grant has been
entered. The smallest next setup step is read-only inspection of RecoveryOS-Launch's
Authentication → OAuth Server (enabled state/authorization path/registration settings) and
Authentication → Hooks → Custom Access Token (enabled state/type/function identifier).
Do not collect secret values. Available connector tools do not expose these settings.

Then present the exact bridge client, resource/audience, hook composition and restricted
worker credential/key custody for separate approval. Verify managed public DNS/TLS delivery
and a synthetic authenticated dot round trip before claiming Connected. See the
[current bridge activation instructions](../../../workers/collaboration-proposal/README.md).
