import type { Residence } from '@recoveryos/domain';
import { getSupabase } from '../client';

/**
 * Self-serve residence onboarding (migration 0019): any operator creates
 * their organization + residence and becomes its residence_manager in one
 * transaction, then lands in the /staff operations workspace.
 */
export async function createMyResidence(input: {
  orgName: string;
  orgStructure: 'nonprofit_501c3' | 'llc_private' | 'faith_based' | 'government' | 'other';
  orgPhone?: string;
  orgEmail?: string;
  residenceName: string;
  populationServed?: string;
  capacity: number;
  weeklyFee?: number;
  levelOfSupport?: 'I' | 'II' | 'III' | 'IV';
  city?: string;
  state?: string;
  commitments: string[];
  curfewWeeknight?: string;
}): Promise<Residence> {
  const { data, error } = await getSupabase().rpc('create_residence_for_current_user', {
    p_org_name: input.orgName,
    p_org_structure: input.orgStructure,
    p_org_phone: input.orgPhone ?? null,
    p_org_email: input.orgEmail ?? null,
    p_residence_name: input.residenceName,
    p_population_served: input.populationServed ?? null,
    p_capacity: input.capacity,
    p_weekly_fee: input.weeklyFee ?? null,
    p_level_of_support: input.levelOfSupport ?? null,
    p_city: input.city ?? null,
    p_state: input.state ?? null,
    p_commitments: input.commitments,
    p_curfew_weeknight: input.curfewWeeknight ?? null,
  });
  if (error) throw error;
  return data as Residence;
}
