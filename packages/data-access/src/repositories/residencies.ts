import type { Residence, Residency } from '@recoveryos/domain';
import { getSupabase } from '../client';

/** The current person's active residency (if any), with residence details. */
export async function getMyActiveResidency(
  personId: number,
): Promise<(Residency & { residence: Residence }) | null> {
  const { data, error } = await getSupabase()
    .from('residencies')
    .select('*, residence:residences(*)')
    .eq('person_id', personId)
    .in('residency_status', ['active', 'on_pass', 'transitioning'])
    .maybeSingle();
  if (error) throw error;
  return data;
}
