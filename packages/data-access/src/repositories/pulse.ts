import {
  participantLocalDate,
  routePulse,
  type ConnectionAnswer,
  type PulseQuadrant,
  type PulseReadings,
  type PulseRouting,
} from '@recoveryos/domain';
import { getSupabase } from '../client';
import { recordSelfServiceEvent } from './serviceEvents';

/**
 * Recovery Pulse persistence (ADR-0015 Layer 1). Reflection text is
 * participant-private: it is written here and read back only by the person who
 * wrote it. Staff read `check_ins_staff_view`, which excludes free text.
 */

export interface PulseCheckIn {
  id: number;
  person_id: number;
  period: 'morning' | 'evening' | null;
  local_date: string | null;
  mood_rating: number | null;
  craving_rating: number | null;
  hope_rating: number | null;
  confidence_rating: number | null;
  purpose_rating: number | null;
  connection_level: ConnectionAnswer | null;
  intention: string | null;
  reflection: string | null;
  carry_forward: string | null;
  challenge_tags: string[];
  prompt_quadrant: PulseQuadrant | null;
  prompt_response: string | null;
  prompt_skips: number;
  paired_check_in_id: number | null;
  response_rule_ids: string[];
  /** The slogan surfaced at Connect/Respond, if any. */
  slogan_number: number | null;
  note: string | null;
  created_at: string;
}

const COLUMNS =
  'id, person_id, period, local_date, mood_rating, craving_rating, hope_rating, ' +
  'confidence_rating, purpose_rating, connection_level, intention, reflection, ' +
  'carry_forward, challenge_tags, prompt_quadrant, prompt_response, prompt_skips, ' +
  'paired_check_in_id, response_rule_ids, slogan_number, note, created_at';

export interface PulseDayState {
  routing: PulseRouting;
  /** This participant-day's morning entry, if any — the evening pairs to it. */
  morning: PulseCheckIn | null;
  evening: PulseCheckIn | null;
  /** Most recent entry before today, for the adaptive rules. */
  previous: PulseCheckIn | null;
  previousConnection: ConnectionAnswer | null;
  /** Slogans seen recently — feeds the chain's repeat penalty. */
  recentSloganNumbers: number[];
}

/** Everything the check-in screen needs to decide what to ask. */
export async function getPulseDayState(
  personId: number,
  now = new Date(),
  eveningHour?: number,
): Promise<PulseDayState> {
  const localDate = participantLocalDate(now);
  const { data, error } = await getSupabase()
    .from('check_ins')
    .select(COLUMNS)
    .eq('person_id', personId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;

  const rows = (data ?? []) as unknown as PulseCheckIn[];
  const today = rows.filter((r) => r.local_date === localDate);
  const morning = today.find((r) => r.period === 'morning') ?? null;
  const evening = today.find((r) => r.period === 'evening') ?? null;
  const previous = rows.find((r) => r.local_date !== localDate) ?? null;
  const previousConnection =
    rows.find((r) => r.local_date !== localDate && r.connection_level != null)?.connection_level ??
    null;

  return {
    routing: routePulse({
      now,
      today: { hasMorning: morning != null, hasEvening: evening != null },
      eveningHour,
    }),
    morning,
    evening,
    previous,
    previousConnection,
    recentSloganNumbers: rows
      .map((r) => r.slogan_number)
      .filter((n): n is number => typeof n === 'number'),
  };
}

/** Readings from a stored row, for the deterministic rules. */
export function readingsOf(row: PulseCheckIn | null): PulseReadings | null {
  if (!row) return null;
  return {
    mood: row.mood_rating,
    craving: row.craving_rating,
    hope: row.hope_rating,
    confidence: row.confidence_rating,
    purpose: row.purpose_rating,
    connection: row.connection_level,
  };
}

export interface SubmitPulseInput {
  personId: number;
  period: 'morning' | 'evening';
  localDate: string;
  moodRating: number | null;
  cravingRating: number | null;
  hopeRating?: number | null;
  confidenceRating?: number | null;
  purposeRating?: number | null;
  connectionLevel?: ConnectionAnswer | null;
  intention?: string | null;
  reflection?: string | null;
  carryForward?: string | null;
  challengeTags?: string[];
  promptQuadrant?: PulseQuadrant | null;
  promptResponse?: string | null;
  promptSkips?: number;
  pairedCheckInId?: number | null;
  responseRuleIds?: string[];
  sloganNumber?: number | null;
}

export async function submitPulseCheckIn(input: SubmitPulseInput): Promise<PulseCheckIn> {
  const { data, error } = await getSupabase()
    .from('check_ins')
    .insert({
      person_id: input.personId,
      period: input.period,
      local_date: input.localDate,
      mood_rating: input.moodRating,
      craving_rating: input.cravingRating,
      hope_rating: input.hopeRating ?? null,
      confidence_rating: input.confidenceRating ?? null,
      purpose_rating: input.purposeRating ?? null,
      connection_level: input.connectionLevel ?? null,
      intention: emptyToNull(input.intention),
      reflection: emptyToNull(input.reflection),
      carry_forward: emptyToNull(input.carryForward),
      challenge_tags: input.challengeTags ?? [],
      prompt_quadrant: input.promptQuadrant ?? null,
      prompt_response: emptyToNull(input.promptResponse),
      prompt_skips: input.promptSkips ?? 0,
      paired_check_in_id: input.pairedCheckInId ?? null,
      response_rule_ids: input.responseRuleIds ?? [],
      slogan_number: input.sloganNumber ?? null,
      delivery_context: 'vrcc',
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;

  await recordSelfServiceEvent({
    personId: input.personId,
    serviceTypeKey: 'daily_check_in',
    deliveryContext: 'vrcc',
  });

  return data as unknown as PulseCheckIn;
}

function emptyToNull(v: string | null | undefined): string | null {
  const t = (v ?? '').trim();
  return t.length > 0 ? t : null;
}

/** Recent entries for the participant's own trend view (their data only). */
export async function listMyPulseHistory(personId: number, limit = 14): Promise<PulseCheckIn[]> {
  const { data, error } = await getSupabase()
    .from('check_ins')
    .select(COLUMNS)
    .eq('person_id', personId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as PulseCheckIn[];
}
