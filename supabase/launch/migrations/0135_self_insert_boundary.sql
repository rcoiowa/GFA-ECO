-- 0135_self_insert_boundary.sql — P2.5: participant self-insert boundary + provider self-read.
--
-- Staged cutover step 3 (ratification §20 order is binding): record_my_activity (0134) is
-- live and the frontend routes W1 through it BEFORE this applies. This migration does NOT
-- remove the participant direct-insert path — it NARROWS it to the ratified boundary as a
-- compatibility belt for older app versions, closing the forged-attribution hole (the 0012
-- policy allowed ANY service type and ANY residence/program/org attribution):
--   person = self AND provider NULL AND service type in the closed 3-key whitelist AND
--   residence/residency NULL AND funding NULL AND modality self_directed.
-- Retirement (policy drop + trigger tightening) is 0137, gated on the 14-consecutive-day
-- zero-direct-insert telemetry window. No participant dead end at any step.
--
-- Also ships the RATIFIED provider self-read (P2 ratification §7, approved narrowly):
-- a provider reads exactly the events they personally attested — actor identity, never
-- "role = coach therefore read participant history". Relationship-wide visibility remains
-- a later explicit design decision.
--
-- ROLLBACK: drop policy service_events_provider_read on recoveryos.service_events;
--           drop policy service_events_insert_self on recoveryos.service_events;
--           create policy service_events_insert_self on recoveryos.service_events
--             for insert with check (
--               person_id = recoveryos.current_person_id()
--               and (provider_person_id is null
--                    or provider_person_id = recoveryos.current_person_id()));

set search_path = recoveryos, public;

drop policy if exists service_events_insert_self on recoveryos.service_events;
create policy service_events_insert_self on recoveryos.service_events
  for insert with check (
    person_id = recoveryos.current_person_id()
    and provider_person_id is null
    and residence_id is null
    and residency_id is null
    and funding_source_id is null
    and modality = 'self_directed'
    and service_type_id in (select id from recoveryos.service_types
                            where key in ('daily_check_in','recovery_capital_assessment',
                                          'recovery_practice'))
  );

create policy service_events_provider_read on recoveryos.service_events
  for select to authenticated
  using (provider_person_id = recoveryos.current_person_id());

notify pgrst, 'reload schema';
