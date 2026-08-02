import { getSupabase } from '../client';

/** Resident-facing residence operations (Phase 4). Staff-side ops land in Phase 5. */

export interface ChoreAssignmentRow {
  id: number;
  due_on: string;
  completed_at: string | null;
  chore: { name: string; description: string | null };
}

export async function listMyChoresDue(residencyId: number, onOrBefore: string) {
  const { data, error } = await getSupabase()
    .from('chore_assignments')
    .select('id, due_on, completed_at, chore:residence_chores(name, description)')
    .eq('residency_id', residencyId)
    .lte('due_on', onOrBefore)
    .order('due_on');
  if (error) throw error;
  return (data ?? []) as unknown as ChoreAssignmentRow[];
}

export async function completeChore(assignmentId: number): Promise<void> {
  const { error } = await getSupabase()
    .from('chore_assignments')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', assignmentId);
  if (error) throw error;
}

export interface CurfewRow {
  day_of_week: number;
  curfew_time: string;
}

export async function getCurfewSchedule(residenceId: number): Promise<CurfewRow[]> {
  const { data, error } = await getSupabase()
    .from('curfew_schedules')
    .select('day_of_week, curfew_time')
    .eq('residence_id', residenceId);
  if (error) throw error;
  return data ?? [];
}

export interface MeetingRow {
  id: number;
  title: string;
  description: string | null;
  starts_at: string;
  is_required_for_residents: boolean;
}

export async function listUpcomingResidenceMeetings(
  residenceId: number,
  limit = 10,
): Promise<MeetingRow[]> {
  const { data, error } = await getSupabase()
    .from('meetings')
    .select('id, title, description, starts_at, is_required_for_residents')
    .eq('residence_id', residenceId)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export interface DocumentAssignmentRow {
  id: number;
  assigned_at: string;
  acknowledged_at: string | null;
  signature_name: string | null;
  version: {
    id: number;
    version: string;
    body_markdown: string;
    template: { name: string };
  };
}

export async function listMyDocuments(personId: number): Promise<DocumentAssignmentRow[]> {
  const { data, error } = await getSupabase()
    .from('document_assignments')
    .select(
      'id, assigned_at, acknowledged_at, signature_name, version:document_versions(id, version, body_markdown, template:document_templates(name))',
    )
    .eq('person_id', personId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentAssignmentRow[];
}

export async function acknowledgeDocument(
  assignmentId: number,
  signatureName: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('document_assignments')
    .update({ acknowledged_at: new Date().toISOString(), signature_name: signatureName })
    .eq('id', assignmentId);
  if (error) throw error;
}

export interface PassRow {
  id: number;
  starts_at: string;
  ends_at: string;
  destination: string | null;
  status: string;
  created_at: string;
}

export async function listMyPasses(residencyId: number): Promise<PassRow[]> {
  const { data, error } = await getSupabase()
    .from('passes')
    .select('id, starts_at, ends_at, destination, status, created_at')
    .eq('residency_id', residencyId)
    .order('starts_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function requestPass(input: {
  residencyId: number;
  startsAt: string;
  endsAt: string;
  destination: string;
}): Promise<PassRow> {
  const { data, error } = await getSupabase()
    .from('passes')
    .insert({
      residency_id: input.residencyId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      destination: input.destination,
      status: 'requested',
    })
    .select('id, starts_at, ends_at, destination, status, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function fileGrievance(input: {
  residenceId: number;
  personId: number;
  summary: string;
}): Promise<void> {
  const { error } = await getSupabase().from('grievances').insert({
    residence_id: input.residenceId,
    filed_by_person_id: input.personId,
    summary: input.summary,
  });
  if (error) throw error;
}
