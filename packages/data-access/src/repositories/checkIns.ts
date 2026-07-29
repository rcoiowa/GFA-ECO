import type { CheckIn, DeliveryContext } from '@recoveryos/domain';
import { getSupabase } from '../client';

export async function listMyRecentCheckIns(personId: number, limit = 14): Promise<CheckIn[]> {
  const { data, error } = await getSupabase()
    .from('check_ins')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createCheckIn(input: {
  personId: number;
  moodRating: number | null;
  cravingRating: number | null;
  note?: string;
  deliveryContext: DeliveryContext;
}): Promise<CheckIn> {
  const { data, error } = await getSupabase()
    .from('check_ins')
    .insert({
      person_id: input.personId,
      mood_rating: input.moodRating,
      craving_rating: input.cravingRating,
      note: input.note ?? null,
      delivery_context: input.deliveryContext,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
