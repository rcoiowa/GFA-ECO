-- LAUNCH 0121 — Restore EXECUTE for `authenticated` on the client-facing
-- booking/negotiation RPCs (P4H-G1 live-gate finding, run 31287322800).
--
-- 0100's hardening pattern (`revoke execute ... from public, anon`) removed
-- the PUBLIC default grant these functions relied on, and no explicit grant
-- to `authenticated` followed — so the entire booking negotiation surface
-- (open/propose/counter/cancel/reschedule, plus cancel_support_request from
-- 0108) returned 42501 through PostgREST. accept_booking_proposal and
-- complete_session had kept their grants, which is why acceptance worked in
-- unit-level tests while the opening move never could. Every function below
-- is SECURITY DEFINER with its own identity/authorization guard
-- (current_person_id + participant/provider/admin checks), so EXECUTE for
-- authenticated is the intended posture. anon and public stay revoked.

grant execute on function recoveryos.create_booking_request(bigint,bigint,bigint,bigint,text,int,text,timestamptz[]) to authenticated;
grant execute on function recoveryos.propose_booking_times(bigint,timestamptz[]) to authenticated;
grant execute on function recoveryos.counter_propose_booking_times(bigint,timestamptz[]) to authenticated;
grant execute on function recoveryos.cancel_booking(bigint,text) to authenticated;
grant execute on function recoveryos.reschedule_booking(bigint,timestamptz[]) to authenticated;
grant execute on function recoveryos.cancel_support_request(bigint) to authenticated;
