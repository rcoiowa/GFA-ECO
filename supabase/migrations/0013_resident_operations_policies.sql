-- Resident-facing operations policies (Phase 4): documents, chores, and the
-- chore-definition directory. Staff-side write policies land in Phase 5.
set search_path = recoveryos, public;

-- Residents read the content of documents assigned to them.
create policy document_versions_read_assigned on document_versions
  for select using (
    exists (select 1 from document_assignments da
            where da.document_version_id = document_versions.id
              and da.person_id = current_person_id())
  );

create policy document_templates_read_assigned on document_templates
  for select using (
    exists (select 1 from document_versions dv
            join document_assignments da on da.document_version_id = dv.id
            where dv.template_id = document_templates.id
              and da.person_id = current_person_id())
  );

-- Acknowledge own assigned documents (only while unacknowledged).
create policy document_assignments_ack_self on document_assignments
  for update using (person_id = current_person_id() and acknowledged_at is null)
  with check (person_id = current_person_id());

-- Mark own chores complete.
create policy chore_assignments_complete_self on chore_assignments
  for update using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );

-- Read chore definitions for one's own residence (or staffed residences).
create policy residence_chores_read on residence_chores
  for select using (
    residence_id in (select residence_id from residencies
                     where person_id = current_person_id()
                       and residency_status in ('active','on_pass','transitioning'))
    or residence_id in (select staff_residence_ids())
  );
