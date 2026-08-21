-- Residence document library: signing flow + read access.
-- The canonical document bodies live in packages/residence-content and are
-- seeded into document_templates/document_versions by the generated
-- supabase/seed/documents_seed.sql. This migration adds what the resident
-- signing flow needs.

set search_path = recoveryos, public;

-- Which templates require a resident signature at move-in (the content
-- package is the source of truth; the seed keeps this column in sync).
alter table document_templates
  add column if not exists requires_signature boolean not null default false;

-- Policies and agreements are house documents: readable by any signed-in
-- user. Signature records stay per-person under existing policies.
create policy document_templates_read on document_templates
  for select using (auth.uid() is not null and is_active);

create policy document_versions_read on document_versions
  for select using (
    published_at is not null
    and exists (
      select 1 from document_templates t
      where t.id = template_id and t.is_active
    )
  );

-- Residents acknowledge/sign their own pending assignments (append-style:
-- only the acknowledgment fields of an unacknowledged row may change).
create policy document_assignments_ack_self on document_assignments
  for update
  using (person_id = current_person_id() and acknowledged_at is null)
  with check (person_id = current_person_id());

-- Assign every required, published document to the current person's active
-- residency (idempotent). Called by the app when a resident opens the
-- Documents area, so new document versions reach existing residents too.
create or replace function ensure_my_document_assignments()
returns setof document_assignments
language plpgsql security definer set search_path = recoveryos, public as $$
declare
  v_person_id bigint := current_person_id();
  v_residency residencies%rowtype;
begin
  if v_person_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_residency
  from residencies
  where person_id = v_person_id
    and residency_status in ('active', 'on_pass', 'transitioning')
  order by created_at desc
  limit 1;

  if found then
    insert into document_assignments (document_version_id, person_id, residency_id)
    select dv.id, v_person_id, v_residency.id
    from document_templates t
    join residences r on r.id = v_residency.residence_id
      and r.organization_id = t.organization_id
    join lateral (
      select id from document_versions
      where template_id = t.id and published_at is not null
      order by published_at desc
      limit 1
    ) dv on true
    where t.is_active
      and t.requires_signature
      and not exists (
        select 1 from document_assignments a
        where a.person_id = v_person_id and a.document_version_id = dv.id
      );
  end if;

  return query
  select * from document_assignments where person_id = v_person_id;
end;
$$;

revoke all on function ensure_my_document_assignments() from public;
grant execute on function ensure_my_document_assignments() to authenticated;

notify pgrst, 'reload schema';
