-- LAUNCH 0107 — Participant "my support team" read (progressive disclosure).
--
-- P4B gap (documented per the frontend/backend boundary rule): recoveryos.people is readable
-- only by self and residence staff, so a participant could see that a coaching relationship
-- exists but not WHO is supporting them. Smallest safe capability: a SECURITY DEFINER function
-- that returns only the support person's appropriate public identity (first name + last
-- initial, role label) for the CALLER'S OWN active relationships. No table policy is widened;
-- staff private data stays private.

create or replace function recoveryos.get_my_support_team()
returns table (
  relationship_id bigint,
  support_person_id bigint,
  display_name text,
  role_label text,
  relationship_type text,
  is_primary boolean,
  started_at date
) language sql stable security definer set search_path = recoveryos, public as $$
  select
    cr.id,
    p.id,
    coalesce(
      nullif(trim(p.preferred_name), ''),
      trim(p.first_name || ' ' || left(coalesce(nullif(p.last_name, ''), ''), 1) ||
           case when coalesce(p.last_name, '') = '' then '' else '.' end)
    ) as display_name,
    case cr.relationship_type
      when 'coach' then 'Recovery Coach'
      when 'peer' then 'Peer Support'
      when 'mentor' then 'Mentor'
      else 'Support'
    end as role_label,
    cr.relationship_type,
    cr.is_primary,
    cr.started_at
  from recoveryos.coaching_relationships cr
  join recoveryos.people p on p.id = cr.coach_person_id
  where cr.participant_person_id = recoveryos.current_person_id()
    and cr.status = 'active'
  order by cr.is_primary desc, cr.started_at desc;
$$;
revoke execute on function recoveryos.get_my_support_team() from public, anon;
grant execute on function recoveryos.get_my_support_team() to authenticated;
