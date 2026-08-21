-- LAUNCH 0122 — Public recovery-housing intake boundary (RecoveryOS-Launch / CQCX).
--
-- Converges three DISTINCT public recovery-housing entry flows onto ONE canonical
-- data authority (recoveryos schema) without collapsing them into one object:
--
--   FLOW 1  Directory listing submission   -> recoveryos.residence_listing_submissions
--           (an operator asks to be listed on recoveryresidence.org; moderated;
--            never auto-published as a live residence)
--   FLOW 2  Grace House public application  -> recoveryos.residence_application_intake
--           (a prospective resident applies BEFORE having an account; sensitive;
--            never auto-provisions auth users / people / residencies)
--   FLOW 3  Referral                        -> recoveryos.referrals  (UNCHANGED — 0016/0110)
--
-- Security posture (mirrors the canonical lead-intake boundary, 0102):
--   * Both new intake tables have RLS enabled and NO INSERT policy and NO anon
--     grant. The ONLY write path is a service-role server boundary (the
--     residence-intake Edge Function, or the recoveryos-api gateway) after
--     validation. Anonymous browsers cannot INSERT, SELECT, UPDATE or DELETE.
--   * Reads are staff-only through named SELECT policies. There is NO direct
--     UPDATE/DELETE path for any client role: lifecycle, reviewer, conversion,
--     and applicant fields change ONLY through the SECURITY DEFINER review
--     RPCs below, and every review decision is written to recoveryos.audit_log.
--     Table privileges are explicitly revoked so the schema-wide authenticated
--     grants from 0110 (including its default-privilege rule for new tables)
--     cannot reopen a PostgREST PATCH bypass.
--   * A separate anon-readable projection view (residence_directory_public)
--     exposes ONLY curated public columns for residences explicitly published to
--     the directory — the operational residences table stays auth-gated.
--
-- Additive and idempotent-safe: no table is dropped, no policy on an existing
-- table is altered except the additive is_public_directory column on residences.

begin;

set search_path = recoveryos, public;

-- ============================================================================
-- 0) residences: opt-in public-directory flag (nothing is exposed until a
--    platform admin publishes it). Defaults false so existing rows stay private.
-- ============================================================================
alter table recoveryos.residences
  add column if not exists is_public_directory boolean not null default false;

create index if not exists residences_public_directory_idx
  on recoveryos.residences (is_public_directory) where is_public_directory;

-- Anon-readable public projection: curated columns only, published rows only.
-- Intentionally a plain (owner-privileged) view — it is the sanctioned public
-- surface, so it bypasses the base-table RLS by design and is kept minimal.
-- No exact street address / postal code (city + state is enough for discovery).
create or replace view recoveryos.residence_directory_public as
  select
    r.id,
    r.name,
    r.address_city,
    r.address_state,
    r.phone,
    r.email,
    r.population_served,
    r.narr_level,
    r.narr_certification_status,
    r.narr_affiliate,
    r.level_of_support,
    r.accepts_mat,
    r.accepts_supervision,
    r.shared_room_fee_monthly,
    r.private_room_fee_monthly,
    r.public_description
  from recoveryos.residences r
  where r.is_active and r.is_public_directory;

comment on view recoveryos.residence_directory_public is
  'Anon-readable safe projection of published residences for recoveryresidence.org. '
  'Curated columns only; excludes exact address and all operational data.';

grant select on recoveryos.residence_directory_public to anon, authenticated;

-- ============================================================================
-- FLOW 1) recoveryos.residence_listing_submissions — moderated directory intake
-- ============================================================================
create table if not exists recoveryos.residence_listing_submissions (
  id bigint generated always as identity primary key,
  -- What is being submitted (business/operator listing data — low sensitivity).
  residence_name text not null,
  organization_name text,
  address_city text,
  address_state text,
  address_county text,
  population_served text,
  residence_type text,
  support_level text,               -- claimed NARR level of support (I–IV)
  narr_certified boolean,
  certification_details text,
  capacity int,
  website text,
  -- Who to contact about the listing.
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  -- Moderation lifecycle: submitted -> under_review -> approved -> published,
  -- or submitted -> rejected. Publication is a DELIBERATE staff action that
  -- creates the canonical residence; a submission never auto-becomes a listing.
  status text not null default 'submitted'
    check (status in ('submitted','under_review','approved','published','rejected')),
  reviewed_at timestamptz,
  reviewed_by_person_id bigint references recoveryos.people (id),
  review_notes text,
  published_residence_id bigint references recoveryos.residences (id),
  -- Provenance + fixture marker (staging fixtures set this true; launch stays clean).
  source text not null default 'recoveryresidence.org',
  test_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists residence_listing_submissions_status_idx
  on recoveryos.residence_listing_submissions (status, created_at desc);

create trigger residence_listing_submissions_set_updated_at
  before update on recoveryos.residence_listing_submissions
  for each row execute function recoveryos.set_updated_at();

alter table recoveryos.residence_listing_submissions enable row level security;

-- NO insert policy and NO anon grant: inserts come only from the service-role
-- intake boundary. Reads are platform-admin only (national directory
-- moderation is a platform function, not a per-residence one). There is NO
-- UPDATE policy: lifecycle changes go only through the audited review/publish
-- RPCs — a direct PostgREST PATCH must fail even for platform admins.
create policy residence_listing_submissions_admin_select
  on recoveryos.residence_listing_submissions for select to authenticated
  using (recoveryos.is_platform_admin());
-- Belt and braces: neutralize 0110's schema-wide + default-privilege grants so
-- no client role holds INSERT/UPDATE/DELETE privilege on this table at all.
revoke insert, update, delete on recoveryos.residence_listing_submissions
  from anon, authenticated;

-- In-app staff alert on new listing submission (single event source; exception-safe).
create or replace function recoveryos.trg_listing_submission_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare r record;
begin
  begin
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null
        and ra.role_key::text in ('administrator','system_administrator')
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New residence listing submission',
        coalesce(NEW.residence_name,'A residence') || ' asked to be listed in the directory.',
        '/admin/directory/submissions', 'listing:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'listing_notify_failed', 'residence_listing_submissions', NEW.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_listing_submission_notify() from public, anon, authenticated;
create trigger trg_listing_submission_notify
  after insert on recoveryos.residence_listing_submissions
  for each row execute function recoveryos.trg_listing_submission_notify();

-- ============================================================================
-- FLOW 2) recoveryos.residence_application_intake — pre-account Grace House apply
-- ============================================================================
-- Sensitive: a prospective resident who has NO account yet. Minimum-necessary
-- collection; strict staff-only access; no public read-back; no auto-provisioning.
create table if not exists recoveryos.residence_application_intake (
  id bigint generated always as identity primary key,
  -- Which residence the person is applying to (e.g. Grace House). Required so
  -- the row lands with the right residence's staff, but the applicant is NOT a
  -- person yet — there is deliberately no person_id FK here.
  residence_id bigint not null references recoveryos.residences (id),
  applicant_name text not null,
  applicant_email text,
  applicant_phone text,
  preferred_contact text,           -- 'phone' | 'email' | 'text' (free text; not enum-locked)
  referral_source text,
  -- Structured, reviewable answers payload (form questions). Minimum necessary:
  -- do NOT collect SSN, clinical records, or diagnosis free-text here.
  answers jsonb not null default '{}'::jsonb,
  consent_to_contact boolean not null default false,
  -- Lifecycle: received -> contacted -> account_offered -> converted, or
  -- waitlisted / declined / closed. Conversion (creating a person + canonical
  -- residence_application) is a DELIBERATE staff action, never automatic.
  status text not null default 'received'
    check (status in ('received','contacted','account_offered','converted','waitlisted','declined','closed')),
  reviewed_at timestamptz,
  reviewed_by_person_id bigint references recoveryos.people (id),
  review_notes text,
  -- Set only when staff deliberately convert the intake into canonical records.
  converted_person_id bigint references recoveryos.people (id),
  converted_application_id bigint references recoveryos.residence_applications (id),
  source text not null default 'gracehouse4',
  test_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists residence_application_intake_residence_idx
  on recoveryos.residence_application_intake (residence_id, status, created_at desc);

create trigger residence_application_intake_set_updated_at
  before update on recoveryos.residence_application_intake
  for each row execute function recoveryos.set_updated_at();

alter table recoveryos.residence_application_intake enable row level security;

-- NO insert policy and NO anon grant: inserts come only from the service-role
-- intake boundary. Reads are limited to staff of the target residence OR
-- care-operations staff — never "any authenticated user", never anon. There is
-- NO UPDATE policy: applicant PII/answers and the status/reviewer/conversion
-- lifecycle change ONLY through review_residence_application_intake (audited,
-- lifecycle-guarded) — a direct PostgREST PATCH must fail even for staff.
create policy residence_application_intake_staff_select
  on recoveryos.residence_application_intake for select to authenticated
  using (residence_id in (select recoveryos.staff_residence_ids())
         or recoveryos.is_care_operations_staff());
-- Belt and braces: neutralize 0110's schema-wide + default-privilege grants so
-- no client role holds INSERT/UPDATE/DELETE privilege on this table at all.
revoke insert, update, delete on recoveryos.residence_application_intake
  from anon, authenticated;

-- In-app staff alert on new application intake (exception-safe). Notifies staff
-- assigned to the residence plus care-operations roles; body is intentionally
-- generic (no sensitive detail in the notification text).
create or replace function recoveryos.trg_application_intake_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare r record; v_residence text;
begin
  begin
    select name into v_residence from recoveryos.residences where id = NEW.residence_id;
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null
        and (ra.residence_id = NEW.residence_id
             or ra.role_key::text in ('navigator','program_manager','administrator','system_administrator'))
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New housing application',
        'A new application came in for ' || coalesce(v_residence,'a residence') || '.',
        '/residences/applications/intake', 'appintake:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'application_intake_notify_failed', 'residence_application_intake', NEW.id,
            jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_application_intake_notify() from public, anon, authenticated;
create trigger trg_application_intake_notify
  after insert on recoveryos.residence_application_intake
  for each row execute function recoveryos.trg_application_intake_notify();

-- ============================================================================
-- Staff review RPCs (SECURITY DEFINER; authenticated; audited). These are the
-- ONLY write path for intake rows — there is no direct UPDATE policy and table
-- DML privileges are revoked from client roles above. The RPCs stamp the
-- reviewer, guard the lifecycle, and write the audit row; running as the table
-- owner, they are unaffected by the client-role revokes.
-- ============================================================================

-- FLOW 1 review: platform-admin moves a submission through the lifecycle.
create or replace function recoveryos.review_residence_listing_submission(
  p_submission_id bigint, p_status text, p_notes text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_row recoveryos.residence_listing_submissions%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_status not in ('under_review','approved','rejected') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  select * into v_row from recoveryos.residence_listing_submissions
    where id = p_submission_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_row.status = 'published' then
    return jsonb_build_object('ok', false, 'code', 'already_published');
  end if;
  update recoveryos.residence_listing_submissions
     set status = p_status,
         reviewed_by_person_id = v_me,
         reviewed_at = now(),
         review_notes = coalesce(p_notes, review_notes)
   where id = p_submission_id;
  insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'listing_submission_reviewed', 'residence_listing_submissions', p_submission_id,
          jsonb_build_object('status', p_status));
  return jsonb_build_object('ok', true, 'code', p_status);
end $$;

-- FLOW 1 publish: DELIBERATE creation of the canonical residence from an
-- approved submission. Idempotent (returns the existing residence if already
-- published). Requires an organization to attach the residence to.
create or replace function recoveryos.publish_residence_listing_submission(
  p_submission_id bigint, p_organization_id bigint
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_row recoveryos.residence_listing_submissions%rowtype;
  v_residence_id bigint;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  if not recoveryos.is_platform_admin() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  select * into v_row from recoveryos.residence_listing_submissions
    where id = p_submission_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_row.published_residence_id is not null then
    return jsonb_build_object('ok', true, 'code', 'already_published',
      'residence_id', v_row.published_residence_id);
  end if;
  if v_row.status <> 'approved' then
    return jsonb_build_object('ok', false, 'code', 'not_approved');
  end if;
  if not exists (select 1 from recoveryos.organizations where id = p_organization_id) then
    return jsonb_build_object('ok', false, 'code', 'unknown_organization');
  end if;
  insert into recoveryos.residences
    (organization_id, name, address_city, address_state, population_served,
     phone, email, public_description, is_active, is_public_directory)
  values
    (p_organization_id, v_row.residence_name, v_row.address_city, v_row.address_state,
     v_row.population_served, v_row.contact_phone, v_row.contact_email, v_row.notes,
     true, true)
  returning id into v_residence_id;
  update recoveryos.residence_listing_submissions
     set status = 'published',
         published_residence_id = v_residence_id,
         reviewed_by_person_id = v_me,
         reviewed_at = now()
   where id = p_submission_id;
  insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'listing_submission_published', 'residence_listing_submissions', p_submission_id,
          jsonb_build_object('residence_id', v_residence_id));
  return jsonb_build_object('ok', true, 'code', 'published', 'residence_id', v_residence_id);
end $$;

-- FLOW 2 review: residence staff / care-ops move an application intake through
-- its lifecycle. Conversion to canonical records stays a separate deliberate act
-- (this RPC never creates auth users, people, or residence_applications).
create or replace function recoveryos.review_residence_application_intake(
  p_intake_id bigint, p_status text, p_notes text default null
) returns jsonb language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_me bigint := recoveryos.current_person_id();
  v_row recoveryos.residence_application_intake%rowtype;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'code', 'unauthenticated'); end if;
  select * into v_row from recoveryos.residence_application_intake
    where id = p_intake_id for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'not_found'); end if;
  if v_row.residence_id not in (select recoveryos.staff_residence_ids())
     and not recoveryos.is_care_operations_staff() then
    return jsonb_build_object('ok', false, 'code', 'not_authorized');
  end if;
  if p_status not in ('contacted','account_offered','converted','waitlisted','declined','closed') then
    return jsonb_build_object('ok', false, 'code', 'invalid_status');
  end if;
  update recoveryos.residence_application_intake
     set status = p_status,
         reviewed_by_person_id = v_me,
         reviewed_at = now(),
         review_notes = coalesce(p_notes, review_notes)
   where id = p_intake_id;
  insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
  values (v_me, 'application_intake_reviewed', 'residence_application_intake', p_intake_id,
          jsonb_build_object('status', p_status));
  return jsonb_build_object('ok', true, 'code', p_status);
end $$;

-- Review/publish RPCs are for signed-in staff only.
revoke execute on function
  recoveryos.review_residence_listing_submission(bigint,text,text),
  recoveryos.publish_residence_listing_submission(bigint,bigint),
  recoveryos.review_residence_application_intake(bigint,text,text)
  from public, anon;
grant execute on function
  recoveryos.review_residence_listing_submission(bigint,text,text),
  recoveryos.publish_residence_listing_submission(bigint,bigint),
  recoveryos.review_residence_application_intake(bigint,text,text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
