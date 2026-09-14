# ADR-0006: Row-level security is the authorization boundary

**Status:** Accepted · **Date:** 2026-07-29

Every table has RLS enabled. Frontend `RequireAuth` / `RequirePerson` / `RequireRole`
guards shape navigation only. Access rules: self-access for personal data; scoped staff
access via `staff_residence_ids()`; relationship-based access (coach/navigator) to be
added with Phases 5–6 and security-reviewed before those workspaces ship. Privileged
mutations use narrowly-scoped `security definer` functions (`ensure_person_for_current_user`)
with explicit grants. Residence compliance data is never readable by coaches merely
because a participant is also a resident.
