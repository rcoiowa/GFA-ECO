# Superseded prepared migration: former 0147 shared intake workflow

**Status:** SUPERSEDED — DO NOT APPLY.

This file records the retirement of the PR #7 prepared migration formerly located at:

`supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`

Source lineage: PR #7 head `825bb5c1ef80e3723725ff1a520208fff3188be7`.

The former artifact was rejected for activation because its intake-role helpers read `role_assignments` directly and bypassed the classification-aware authorization boundary. Its corrected design was carried forward into the rev-2 monotonic chain as:

`supabase/launch/prepared/0149_shared_intake_workflow.prepared.sql`

Rev-2 artifact commit: `e651dead3ba3d642e2b392084041d5f2657d4bd5`.

The original SQL remains permanently recoverable from Git history at the PR #7 commit above. It is intentionally removed from the active `supabase/launch/prepared/` directory so no operator or automation can mistake it for an apply candidate.

Do not restore the former artifact to an active migration/prepared path. Historical references in decision and audit documents remain evidence and are not rewritten.
