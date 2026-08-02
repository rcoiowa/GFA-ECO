-- Fix 42P17 infinite recursion in document RLS: the templates policy queried
-- versions whose policy queried assignments, chaining RLS evaluation. Replace
-- the chained policies with security-definer lookups (person-scoped, narrow).
set search_path = recoveryos, public;

create or replace function my_assigned_document_version_ids()
returns setof bigint
language sql stable security definer set search_path = recoveryos, public as $$
  select document_version_id from document_assignments
  where person_id = current_person_id();
$$;

create or replace function my_assigned_document_template_ids()
returns setof bigint
language sql stable security definer set search_path = recoveryos, public as $$
  select dv.template_id
  from document_versions dv
  join document_assignments da on da.document_version_id = dv.id
  where da.person_id = current_person_id();
$$;

drop policy if exists document_versions_read_assigned on document_versions;
create policy document_versions_read_assigned on document_versions
  for select using (id in (select my_assigned_document_version_ids()));

drop policy if exists document_templates_read_assigned on document_templates;
create policy document_templates_read_assigned on document_templates
  for select using (id in (select my_assigned_document_template_ids()));
