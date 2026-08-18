-- P0 SECURITY HARDENING for the live Grace Coaching prototype layer.
-- Authored and applied by the grace-coaching audit session on 2026-08-07
-- (live migration name: `coaching_engine_p0_hardening`), committed here in the
-- same session per the rule in docs/migration/live-drift-reconciliation.md.
--
-- Closes four privilege/exposure holes found during the Phase 0 audit while
-- preserving every workflow exercised by the four live/deployed frontends
-- (MVP src/mvp, v3 Quantum Bridge worker, v2 PWA, `coaching` Edge Function UI):
--
--   H1. v2_profiles self-escalation: `authenticated` holds UPDATE on all
--       columns and the self-update RLS policy has no column guard, so any
--       signed-in user could set role='admin' or coach_id on their own row.
--       Fixed with BEFORE INSERT/UPDATE guard triggers (no grant changes, so
--       the coaching UI's self-insert of role='participant' keeps working).
--   H2. coach_meeting_rooms exposure: policy `cmr_read_authenticated` let any
--       signed-in user read every coach's permanent personal room URL.
--       Dropped; coaches (cmr_coach_own), admins (cmr_admin_all), the
--       create-meeting Edge Function (service role) and the v2 confirm
--       trigger (SECURITY DEFINER) all retain the access they use.
--   H3. meeting_url injection: participants could UPDATE meeting_url on their
--       own v2_session_requests rows (FOR ALL self policy) and hand their
--       coach a malicious "Join session" link. Guard trigger restricts
--       meeting_url changes to staff roles / service paths. Trigger name is
--       chosen to fire alphabetically BEFORE trg_v2_session_confirmed, which
--       legitimately sets NEW.meeting_url from the coach's registered room.
--   H4. participants claim escalation: legacy policy `participants_coach_update`
--       had no role gate — any authenticated participant could claim every
--       unassigned participants row (assigned_coach_email IS NULL branch) and
--       thereby satisfy the mvp_messages coach policies to read/post in other
--       participants' coach threads. Recreated with the same is_coach() gate
--       already used by participants_coach_claim, case-insensitive email
--       match, keeping the coach continuity-loop updates working.
--
-- ROLLBACK:
--   drop trigger trg_v2_profiles_guard_upd on v2_profiles;
--   drop trigger trg_v2_profiles_guard_ins on v2_profiles;
--   drop function v2_profiles_guard_upd(); drop function v2_profiles_guard_ins();
--   drop trigger trg_v2_a_meeting_url_guard on v2_session_requests;
--   drop function v2_meeting_url_guard();
--   create policy cmr_read_authenticated on coach_meeting_rooms
--     for select to authenticated using (is_active = true);
--   drop policy participants_coach_update on participants;
--   create policy participants_coach_update on participants for update to authenticated
--     using ((assigned_coach_email = (auth.jwt() ->> 'email')) or (assigned_coach_email is null))
--     with check (assigned_coach_email = (auth.jwt() ->> 'email'));

begin;

-- H1: v2_profiles guard -------------------------------------------------------
create or replace function public.v2_profiles_guard_upd()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for service-role and dashboard sessions; those bypass.
  if auth.uid() is not null then
    if new.role is distinct from old.role
       and coalesce(public.v2_my_role() = 'admin'::v2_role, false) is false then
      raise exception 'Role changes require an administrator';
    end if;
    if new.coach_id is distinct from old.coach_id
       and coalesce(public.v2_my_role() = any (array['coach','navigator','admin']::v2_role[]), false) is false then
      raise exception 'Coach assignment changes require staff';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.v2_profiles_guard_upd() from public, anon, authenticated;

drop trigger if exists trg_v2_profiles_guard_upd on public.v2_profiles;
create trigger trg_v2_profiles_guard_upd
  before update on public.v2_profiles
  for each row execute function public.v2_profiles_guard_upd();

create or replace function public.v2_profiles_guard_ins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Self-serve signups always start as participants; staff roles are granted
  -- by an admin or via service role. Coerce rather than reject so the
  -- coaching UI's explicit role:'participant' insert keeps working.
  if auth.uid() is not null
     and coalesce(public.v2_my_role() = 'admin'::v2_role, false) is false then
    new.role := 'participant'::v2_role;
    new.coach_id := null;
  end if;
  return new;
end $$;
revoke execute on function public.v2_profiles_guard_ins() from public, anon, authenticated;

drop trigger if exists trg_v2_profiles_guard_ins on public.v2_profiles;
create trigger trg_v2_profiles_guard_ins
  before insert on public.v2_profiles
  for each row execute function public.v2_profiles_guard_ins();

-- H2: coach_meeting_rooms exposure -------------------------------------------
drop policy if exists cmr_read_authenticated on public.coach_meeting_rooms;

-- H3: meeting_url guard on v2_session_requests --------------------------------
create or replace function public.v2_meeting_url_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null
     and new.meeting_url is distinct from old.meeting_url
     and coalesce(public.v2_my_role() = any (array['coach','navigator','admin']::v2_role[]), false) is false then
    raise exception 'Meeting links are set by your coach or the system';
  end if;
  return new;
end $$;
revoke execute on function public.v2_meeting_url_guard() from public, anon, authenticated;

-- Name sorts before trg_v2_session_confirmed so the guard sees only the
-- caller's own SET list; the confirm trigger may still attach the room after.
drop trigger if exists trg_v2_a_meeting_url_guard on public.v2_session_requests;
create trigger trg_v2_a_meeting_url_guard
  before update on public.v2_session_requests
  for each row execute function public.v2_meeting_url_guard();

-- H4: role-gate the legacy participants coach-update policy -------------------
drop policy if exists participants_coach_update on public.participants;
create policy participants_coach_update on public.participants
  for update to authenticated
  using (
    public.is_coach()
    and (assigned_coach_email is null
         or lower(assigned_coach_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  )
  with check (
    public.is_coach()
    and lower(assigned_coach_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

commit;
