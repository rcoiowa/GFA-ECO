-- 0144_intake_conversion_lookup.sql — B5A: the one narrow backend addition.
--
-- Gap (B5A §8 backend-restraint report): convert_application_intake(p_intake_id,
-- p_person_id, …) needs a person id, but a freshly signed-up participant has no
-- residency/application yet, so residence staff cannot see them through any existing
-- RLS path — the client would have to work around it unsafely or not at all.
--
-- Narrow fix: a SECURITY DEFINER lookup that, for ONE intake row the caller is already
-- authorized to review, returns the accounts matching that intake's email (or an email
-- the applicant states in person). Minimum disclosure: person id + name + whether the
-- match came from the intake email; nothing else about the person. Read-only (stable);
-- the conversion itself (the consequential act) is audited by convert_application_intake.
--
-- ROLLBACK:
--   drop function recoveryos.find_person_for_intake_conversion(bigint, text);

set search_path = recoveryos, public;

create or replace function recoveryos.find_person_for_intake_conversion(
  p_intake_id bigint, p_email text default null
) returns jsonb language plpgsql stable security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_i recoveryos.residence_application_intake%rowtype;
  v_email text;
  v_candidates jsonb;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_i from recoveryos.residence_application_intake where id = p_intake_id;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_i.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_care_operations_staff()
     and not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;

  v_email := lower(nullif(trim(coalesce(p_email, v_i.applicant_email, '')), ''));
  if v_email is null then
    return jsonb_build_object('ok', false, 'code', 'no_email',
      'message', 'No email to match — ask the applicant which email they signed up with.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'person_id', p.id,
           'first_name', p.first_name,
           'last_name', p.last_name,
           'matched_intake_email', lower(coalesce(v_i.applicant_email, '')) = v_email)), '[]'::jsonb)
    into v_candidates
  from recoveryos.people p
  join auth.users u on u.id = p.auth_user_id
  where lower(u.email) = v_email;

  return jsonb_build_object('ok', true, 'candidates', v_candidates);
end $$;

revoke execute on function recoveryos.find_person_for_intake_conversion(bigint, text) from public, anon;
grant execute on function recoveryos.find_person_for_intake_conversion(bigint, text) to authenticated;

notify pgrst, 'reload schema';
