import type { Residence, ResidenceApplication, Residency } from '@recoveryos/domain';
import { getSupabase } from '../client';

/**
 * Applicant-side residence applications (RLS: a person may insert and read
 * only their own applications — migration 0018). Staff review lives in
 * staffOperations.ts.
 */

/** Look up an active residence by exact name (residences are auth-readable). */
export async function getResidenceByName(name: string): Promise<Residence | null> {
  const { data, error } = await getSupabase()
    .from('residences')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitResidenceApplication(input: {
  personId: number;
  residenceId: number;
  answers: Record<string, string>;
}): Promise<ResidenceApplication> {
  const { data, error } = await getSupabase()
    .from('residence_applications')
    .insert({
      person_id: input.personId,
      residence_id: input.residenceId,
      answers: input.answers,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type MyApplication = ResidenceApplication & { residence: Residence };

/** The person's most recent application, with the residence it targets. */
export async function getMyLatestApplication(personId: number): Promise<MyApplication | null> {
  const { data, error } = await getSupabase()
    .from('residence_applications')
    .select('*, residence:residences(*)')
    .eq('person_id', personId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** The person's residency at a residence (any status), for post-approval state. */
export async function getMyResidencyAt(input: {
  personId: number;
  residenceId: number;
}): Promise<Residency | null> {
  const { data, error } = await getSupabase()
    .from('residencies')
    .select('*')
    .eq('person_id', input.personId)
    .eq('residence_id', input.residenceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
