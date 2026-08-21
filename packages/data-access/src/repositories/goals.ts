import type { Goal } from '@recoveryos/domain';
import { getSupabase } from '../client';

export async function listMyGoals(personId: number): Promise<Goal[]> {
  const { data, error } = await getSupabase()
    .from('goals')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(input: {
  personId: number;
  title: string;
  detail?: string;
  targetDate?: string | null;
  domainKey?: string | null;
}): Promise<Goal> {
  const { data, error } = await getSupabase()
    .from('goals')
    .insert({
      person_id: input.personId,
      title: input.title,
      detail: input.detail ?? null,
      target_date: input.targetDate ?? null,
      domain_key: input.domainKey ?? null,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoalStatus(goalId: number, status: Goal['status']): Promise<void> {
  const { error } = await getSupabase().from('goals').update({ status }).eq('id', goalId);
  if (error) throw error;
}

export async function updateGoalDomain(goalId: number, domainKey: string | null): Promise<void> {
  const { error } = await getSupabase()
    .from('goals')
    .update({ domain_key: domainKey })
    .eq('id', goalId);
  if (error) throw error;
}
