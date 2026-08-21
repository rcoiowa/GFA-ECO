-- 0125_analytics_view_security.sql — close the owner-privileged analytics-view exposure (P0-1).
--
-- DEFECT (Relational Operations audit, 2026-08-21): the four 0008 analytics views are plain
-- (owner-privileged) views. 0110_table_grants.sql's blanket
--   `grant select, insert, update on all tables in schema recoveryos to authenticated`
-- includes views, so any authenticated user could read all-person service_events rows and
-- residency classification through them via PostgREST, bypassing RLS (a view executes with its
-- owner's privileges unless security_invoker is set). No app or package code consumes these
-- views (verified: zero readers in apps/ and packages/), so revoking client access changes no
-- product behavior.
--
-- FIX (belt and braces):
--   1. security_invoker = true — even where a privilege survives, RLS of the CALLER applies.
--   2. revoke client-role privileges — the views become service-role/owner analytics surfaces.
--
-- STANDING RULE (enforced by scripts/verify-view-privileges.mjs and launch_contract_check.sql
-- step 9): every future recoveryos view must either set security_invoker = true or explicitly
-- revoke anon/authenticated privileges in its own migration, because 0110's
-- `alter default privileges` rule also captures future views. Deliberate exceptions are
-- allowlisted in both guards with justification (currently: residence_directory_public — the
-- curated anon directory projection, documented in 0122).
--
-- ROLLBACK (restores the pre-0125 state exactly):
--   alter view recoveryos.analytics_people_served reset (security_invoker);
--   alter view recoveryos.analytics_participation_classification reset (security_invoker);
--   alter view recoveryos.analytics_service_events reset (security_invoker);
--   alter view recoveryos.analytics_residence_occupancy reset (security_invoker);
--   grant select, insert, update on recoveryos.analytics_people_served,
--     recoveryos.analytics_participation_classification,
--     recoveryos.analytics_service_events,
--     recoveryos.analytics_residence_occupancy to authenticated;

set search_path = recoveryos, public;

alter view recoveryos.analytics_people_served set (security_invoker = true);
alter view recoveryos.analytics_participation_classification set (security_invoker = true);
alter view recoveryos.analytics_service_events set (security_invoker = true);
alter view recoveryos.analytics_residence_occupancy set (security_invoker = true);

revoke all on recoveryos.analytics_people_served from anon, authenticated;
revoke all on recoveryos.analytics_participation_classification from anon, authenticated;
revoke all on recoveryos.analytics_service_events from anon, authenticated;
revoke all on recoveryos.analytics_residence_occupancy from anon, authenticated;

notify pgrst, 'reload schema';
