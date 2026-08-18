-- 0118_performance_hardening.sql — P4H remainder §20 (performance advisor).
--
-- Two advisor-driven corrections, applied selectively (correctness and
-- security posture unchanged; no policy widens or narrows — quals are
-- semantically identical):
--
-- 1) auth_rls_initplan: the ten policies calling auth.uid() per-row are
--    rewritten with the (select auth.uid()) initplan pattern so the value is
--    computed once per statement.
-- 2) unindexed_foreign_keys: covering indexes for the foreign keys that sit
--    on real query paths of the hot tables (messaging, scheduling,
--    navigation, service evidence). Cold audit-style FKs (created_by,
--    organization defaults, etc.) are deliberately left unindexed — indexes
--    have write cost, and the advisor's remaining INFO entries are accepted.
--
-- multiple_permissive_policies (WARN ×94) is ACCEPTED for launch scale: the
-- layered per-domain policies are the security design; consolidation is a
-- post-soft-launch optimization to be done policy-family by policy-family
-- with verification, not as a sweep. unused_index (INFO ×37) is expected on
-- a pre-traffic database.

-- ---------------------------------------------------------------------------
-- 1) initplan-safe policy rewrites (same semantics, one evaluation)
-- ---------------------------------------------------------------------------
drop policy if exists people_select_self on recoveryos.people;
create policy people_select_self on recoveryos.people
  for select using (auth_user_id = (select auth.uid()));

drop policy if exists people_update_self on recoveryos.people;
create policy people_update_self on recoveryos.people
  for update using (auth_user_id = (select auth.uid()));

drop policy if exists service_types_read on recoveryos.service_types;
create policy service_types_read on recoveryos.service_types
  for select using ((select auth.uid()) is not null);

drop policy if exists consent_types_read on recoveryos.consent_types;
create policy consent_types_read on recoveryos.consent_types
  for select using ((select auth.uid()) is not null);

drop policy if exists programs_read on recoveryos.programs;
create policy programs_read on recoveryos.programs
  for select using ((select auth.uid()) is not null);

drop policy if exists organizations_read on recoveryos.organizations;
create policy organizations_read on recoveryos.organizations
  for select using ((select auth.uid()) is not null);

drop policy if exists residences_read on recoveryos.residences;
create policy residences_read on recoveryos.residences
  for select using ((select auth.uid()) is not null);

drop policy if exists document_templates_read on recoveryos.document_templates;
create policy document_templates_read on recoveryos.document_templates
  for select using ((select auth.uid()) is not null and is_active);

drop policy if exists narr_standards_read on recoveryos.narr_standards;
create policy narr_standards_read on recoveryos.narr_standards
  for select using ((select auth.uid()) is not null);

drop policy if exists iowa_checklist_items_read on recoveryos.iowa_checklist_items;
create policy iowa_checklist_items_read on recoveryos.iowa_checklist_items
  for select using ((select auth.uid()) is not null);

-- ---------------------------------------------------------------------------
-- 2) covering indexes on hot-path foreign keys
-- ---------------------------------------------------------------------------
create index if not exists appointments_coaching_rel_idx on recoveryos.appointments (coaching_relationship_id);
create index if not exists appointments_support_request_idx on recoveryos.appointments (support_request_id);
create index if not exists appointments_booking_request_idx on recoveryos.appointments (booking_request_id);
create index if not exists booking_requests_coaching_rel_idx on recoveryos.booking_requests (coaching_relationship_id);
create index if not exists booking_requests_support_request_idx on recoveryos.booking_requests (support_request_id);
create index if not exists conversations_coach_person_idx on recoveryos.conversations (coach_person_id);
create index if not exists conversations_coaching_rel_idx on recoveryos.conversations (coaching_relationship_id);
create index if not exists conversations_navigation_rel_idx on recoveryos.conversations (navigation_relationship_id);
create index if not exists follow_ups_appointment_idx on recoveryos.follow_ups (appointment_id);
create index if not exists messages_sender_person_idx on recoveryos.messages (sender_person_id);
create index if not exists navigation_needs_support_request_idx on recoveryos.navigation_needs (support_request_id);
create index if not exists navigation_referrals_navigation_rel_idx on recoveryos.navigation_referrals (navigation_relationship_id);
create index if not exists service_events_coaching_rel_idx on recoveryos.service_events (coaching_relationship_id);
create index if not exists service_events_navigation_rel_idx on recoveryos.service_events (navigation_relationship_id);
create index if not exists service_events_residency_idx on recoveryos.service_events (residency_id);
create index if not exists service_events_service_type_idx on recoveryos.service_events (service_type_id);
create index if not exists support_requests_coaching_rel_idx on recoveryos.support_requests (coaching_relationship_id);
create index if not exists support_requests_navigation_rel_idx on recoveryos.support_requests (navigation_relationship_id);
