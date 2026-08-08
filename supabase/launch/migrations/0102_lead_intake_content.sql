-- LAUNCH 0102 — Canonical lead intake + canonical content tables (slogans, resources).
--
-- Lead intake replaces the legacy pipeline (Wix -> anon PostgREST insert into
-- public.wix_contact_submissions -> trigger -> notify-new-lead). The legacy table granted
-- anon FULL DML (incl. DELETE/TRUNCATE) — the successor accepts leads ONLY through the
-- lead-intake Edge Function (service-role insert after validation); no anon table grants.
-- Staff are notified in-app via canonical notifications; staff email goes through the
-- Edge Function's Resend integration only when its secrets are configured.
--
-- Content tables carry the curated program content identified in the reset audit
-- (59 Recovering-the-Mind slogans; unified Iowa resource directory incl. crisis lines),
-- preserving the meaningful dev columns and dropping sync/multi-tenant cruft.

begin;

-- ---- leads -----------------------------------------------------------------------
create table recoveryos.leads (
  id            bigint generated always as identity primary key,
  first_name    text,
  last_name     text,
  email         text,
  phone         text,
  message       text,
  interest      text,               -- pathway_interest in the legacy form
  readiness     text,
  source        text not null default 'website',
  status        text not null default 'new' check (status in ('new','contacted','converted','closed')),
  assigned_to_person_id bigint references recoveryos.people(id),
  converted_person_id   bigint references recoveryos.people(id),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table recoveryos.leads enable row level security;
create policy leads_staff_select on recoveryos.leads for select to authenticated
  using (recoveryos.is_support_staff() or recoveryos.is_admin_staff());
create policy leads_staff_update on recoveryos.leads for update to authenticated
  using (recoveryos.is_support_staff() or recoveryos.is_admin_staff())
  with check (recoveryos.is_support_staff() or recoveryos.is_admin_staff());
-- No INSERT policy: inserts come only from the lead-intake Edge Function (service role).

-- In-app staff alert on new lead (single event source; exception-safe).
create or replace function recoveryos.trg_lead_notify()
returns trigger language plpgsql security definer set search_path = recoveryos, public as $$
declare r record; v_name text;
begin
  begin
    v_name := coalesce(nullif(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')), ''), NEW.email, 'Someone');
    for r in
      select distinct ra.person_id from recoveryos.role_assignments ra
      where ra.revoked_at is null and ra.role_key::text in ('administrator','coach','navigator')
    loop
      perform recoveryos.emit_notification(r.person_id, 'general', 'New website lead',
        v_name || ' reached out through the website.', '/admin/leads',
        'lead:' || NEW.id || ':' || r.person_id);
    end loop;
  exception when others then
    insert into recoveryos.audit_log(actor_person_id, action, entity_table, entity_id, detail)
    values (null, 'lead_notify_failed', 'leads', NEW.id, jsonb_build_object('sqlerrm', sqlerrm));
  end;
  return NEW;
end $$;
revoke execute on function recoveryos.trg_lead_notify() from public, anon, authenticated;
create trigger trg_lead_notify after insert on recoveryos.leads
  for each row execute function recoveryos.trg_lead_notify();

-- ---- slogans ---------------------------------------------------------------------
create table recoveryos.slogans (
  id               bigint generated always as identity primary key,
  slogan_text      text not null unique,
  slogan_short     text,
  author_credit    text,
  category         text,
  tags             text[],
  hope_factor          int, action_factor        int, community_factor int,
  resilience_factor    int, identity_factor      int, grace_factor     int,
  neuroplasticity_factor int,
  composite_score  numeric,
  applicable_enneagram_types text[],
  applicable_true_colors     text[],
  applicable_stages          text[],
  is_grace_centered boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);
alter table recoveryos.slogans enable row level security;
create policy slogans_read on recoveryos.slogans for select to authenticated using (is_active);
create policy slogans_admin on recoveryos.slogans for all to authenticated
  using (recoveryos.is_admin_staff()) with check (recoveryos.is_admin_staff());

-- ---- unified resources (directory + crisis lines in one canonical set) ------------
create table recoveryos.resources (
  id             bigint generated always as identity primary key,
  name           text not null,
  resource_type  text,
  category       text,
  description    text,
  is_crisis      boolean not null default false,
  crisis_types   text[],
  phone          text,
  phone_secondary text,
  text_number    text,
  chat_url       text,
  email          text,
  website        text,
  address_line1  text, address_line2 text, city text, state text, zip_code text, county text,
  counties       text[],
  is_statewide   boolean,
  is_virtual     boolean,
  hours          text,
  is_24_7        boolean,
  languages      text[],
  walk_in_accepted boolean,
  appointment_required boolean,
  is_free        boolean,
  sliding_scale  boolean,
  medicaid_accepted boolean,
  recovery_friendly boolean, mat_friendly boolean, justice_involved boolean,
  peer_led boolean, faith_based boolean, trauma_informed boolean,
  is_gfa_partner boolean,
  referral_process text,
  display_order  int,
  is_active      boolean not null default true,
  notes          text,
  source_generation text,             -- provenance: gen1 | crisis | v2 (reconciliation audit)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index resources_name_idx on recoveryos.resources (lower(name));
alter table recoveryos.resources enable row level security;
create policy resources_read on recoveryos.resources for select to authenticated using (is_active);
create policy resources_admin on recoveryos.resources for all to authenticated
  using (recoveryos.is_admin_staff()) with check (recoveryos.is_admin_staff());

commit;
