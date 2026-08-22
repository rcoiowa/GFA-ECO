import { BARC10_INSTRUMENT_KEY, type DeliveryContext } from '@recoveryos/domain';
import { getSupabase } from '../client';
import { recordSelfServiceEvent } from './serviceEvents';

export interface RecoveryCapitalAssessmentRow {
  id: number;
  person_id: number;
  instrument_key: string;
  responses: Record<string, number>;
  total_score: number;
  delivery_context: DeliveryContext;
  completed_at: string;
}

export async function getMyLatestBarc10(
  personId: number,
): Promise<RecoveryCapitalAssessmentRow | null> {
  const { data, error } = await getSupabase()
    .from('recovery_capital_assessments')
    .select('*')
    .eq('person_id', personId)
    .eq('instrument_key', BARC10_INSTRUMENT_KEY)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Save a completed BARC-10: the assessment row is the feature data; the
 * service event is the analytics attribution (best-effort, never blocks).
 */
export async function submitBarc10(input: {
  personId: number;
  answers: number[];
  totalScore: number;
  deliveryContext: DeliveryContext;
}): Promise<RecoveryCapitalAssessmentRow> {
  const responses = Object.fromEntries(input.answers.map((a, i) => [`q${i + 1}`, a]));
  const { data, error } = await getSupabase()
    .from('recovery_capital_assessments')
    .insert({
      person_id: input.personId,
      instrument_key: BARC10_INSTRUMENT_KEY,
      responses,
      total_score: input.totalScore,
      delivery_context: input.deliveryContext,
    })
    .select()
    .single();
  if (error) throw error;

  await recordSelfServiceEvent({
    personId: input.personId,
    serviceTypeKey: 'recovery_capital_assessment',
    deliveryContext: input.deliveryContext,
    featureRef: `barc10:${data.id}`,
  });

  return data;
}
