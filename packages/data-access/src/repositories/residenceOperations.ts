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
