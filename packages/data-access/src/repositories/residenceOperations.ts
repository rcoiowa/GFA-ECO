import type {
  ChoreAssignment,
  CurfewSchedule,
  Grievance,
  Meeting,
  Pass,
  ResidenceChore,
} from '@recoveryos/domain';
import { getSupabase } from '../client';

export type ChoreAssignmentWithChore = ChoreAssignment & { chore: ResidenceChore };

/** The residency's chore assignments for a date window (RLS: own residency only). */
export async function listMyChoreAssignments(
  residencyId: number,
  fromDate: string,
  toDate: string,
): Promise<ChoreAssignmentWithChore[]> {
  const { data, error } = await getSupabase()
    .from('chore_assignments')
    .select('*, chore:residence_chores(*)')
    .eq('residency_id', residencyId)
    .gte('due_on', fromDate)
    .lte('due_on', toDate)
    .order('due_on');
  if (error) throw error;
  return data ?? [];
}

/** The residence's weekly curfew schedule, ordered Sunday..Saturday. */
export async function getCurfewSchedule(residenceId: number): Promise<CurfewSchedule[]> {
  const { data, error } = await getSupabase()
    .from('curfew_schedules')
    .select('*')
    .eq('residence_id', residenceId)
    .order('day_of_week');
  if (error) throw error;
  return data ?? [];
}

/** The residency's passes, newest first. */
export async function listMyPasses(residencyId: number): Promise<Pass[]> {
  const { data, error } = await getSupabase()
    .from('passes')
    .select('*')
    .eq('residency_id', residencyId)
    .order('starts_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

/** Request a pass (RLS allows inserting only 'requested' rows on own residency). */
export async function requestPass(input: {
  residencyId: number;
  startsAt: string;
  endsAt: string;
  destination: string | null;
}): Promise<Pass> {
  const { data, error } = await getSupabase()
    .from('passes')
    .insert({
      residency_id: input.residencyId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      destination: input.destination,
      status: 'requested',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Upcoming meetings visible to the person (org-wide + their residence). */
export async function listUpcomingMeetings(): Promise<Meeting[]> {
  const { data, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

// ---- P0.5-C: meetings, attendance, chores become recordable (RPCs, 0128) ----

async function opRpc(fn: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'rpc_failed'));
  return result as Record<string, unknown>;
}

/** Staff records a house/program meeting (RPC `record_meeting`). */
export async function recordMeeting(input: {
  residenceId: number;
  title: string;
  startsAt: string;
  isRequired?: boolean;
  description?: string;
}): Promise<void> {
  await opRpc('record_meeting', {
    p_residence_id: input.residenceId,
    p_title: input.title,
    p_starts_at: input.startsAt,
    p_is_required: input.isRequired ?? false,
    p_description: input.description ?? null,
  });
}

/** Staff records who was at a meeting (RPC `record_meeting_attendance`; upsert per person). */
export async function recordMeetingAttendance(input: {
  meetingId: number;
  personId: number;
  status: 'expected' | 'present' | 'absent' | 'excused';
}): Promise<void> {
  await opRpc('record_meeting_attendance', {
    p_meeting_id: input.meetingId,
    p_person_id: input.personId,
    p_status: input.status,
  });
}

/** Staff assigns a chore to a residency for a date (RPC `assign_chore`; idempotent per day). */
export async function assignChore(input: {
  choreId: number;
  residencyId: number;
  dueOn: string;
}): Promise<void> {
  await opRpc('assign_chore', {
    p_chore_id: input.choreId,
    p_residency_id: input.residencyId,
    p_due_on: input.dueOn,
  });
}

/** Staff marks a chore assignment complete/verified (RPC `complete_chore_assignment`). */
export async function completeChoreAssignment(assignmentId: number): Promise<void> {
  await opRpc('complete_chore_assignment', { p_assignment_id: assignmentId });
}

/** The residence's meetings around now (staff read via RLS), newest first. */
export async function listResidenceMeetings(residenceId: number): Promise<Meeting[]> {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('residence_id', residenceId)
    .gte('starts_at', since)
    .order('starts_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

/** The residence's active chore catalog. */
export async function listResidenceChores(residenceId: number): Promise<ResidenceChore[]> {
  const { data, error } = await getSupabase()
    .from('residence_chores')
    .select('*')
    .eq('residence_id', residenceId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

/** Chore assignments for a residence-day window (staff read via RLS). */
export async function listChoreAssignmentsForResidence(
  residenceId: number,
  fromDate: string,
  toDate: string,
): Promise<(ChoreAssignment & { chore: ResidenceChore })[]> {
  const { data, error } = await getSupabase()
    .from('chore_assignments')
    .select('*, chore:residence_chores!inner(*)')
    .eq('chore.residence_id', residenceId)
    .gte('due_on', fromDate)
    .lte('due_on', toDate)
    .order('due_on');
  if (error) throw error;
  return data ?? [];
}

/** File a grievance (RLS: only as yourself). */
export async function fileGrievance(input: {
  residenceId: number;
  personId: number;
  summary: string;
}): Promise<Grievance> {
  const { data, error } = await getSupabase()
    .from('grievances')
    .insert({
      residence_id: input.residenceId,
      filed_by_person_id: input.personId,
      summary: input.summary,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** The person's own filed grievances, newest first. */
export async function listMyGrievances(personId: number): Promise<Grievance[]> {
  const { data, error } = await getSupabase()
    .from('grievances')
    .select('*')
    .eq('filed_by_person_id', personId)
    .order('filed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * The residence's grievance queue, open first then newest. Visibility is
 * deliberately narrow (0115 `grievances_scoped_select`): residence managers
 * of this residence and platform admins see the residence's grievances;
 * anyone else gets only their own filings back. RLS filters — it never
 * errors — so an empty list can mean "none filed" or "not yours to see".
 */
export async function listResidenceGrievances(residenceId: number): Promise<Grievance[]> {
  const { data, error } = await getSupabase()
    .from('grievances')
    .select('*')
    .eq('residence_id', residenceId)
    .order('filed_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Move a grievance through its disposition (0115 `resolve_grievance` RPC):
 * manager/admin only, and never by the person who filed it — the server
 * returns `conflict_of_interest` with a human message we surface verbatim.
 */
export async function resolveGrievance(
  grievanceId: number,
  status: 'in_review' | 'resolved' | 'closed',
): Promise<void> {
  const { data, error } = await getSupabase().rpc('resolve_grievance', {
    p_grievance_id: grievanceId,
    p_status: status,
  });
  if (error) throw error;
  const result = data as { ok?: boolean; code?: string; message?: string } | null;
  if (!result?.ok) throw new Error(result?.message ?? String(result?.code ?? 'resolve_failed'));
}
