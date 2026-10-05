import { getSupabase } from '../client';
export interface CircleSeries {
  id: number;
  name: string;
  location_name: string;
  location_kind: string;
  timezone: string;
  facilitators: { person_id: number; name: string }[];
}
export interface CircleMeeting {
  id: number;
  series_id: number;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  occurrence_status: 'held' | 'cancelled' | 'scheduled';
  participant_count: number | null;
  facilitator_names: string[] | null;
  total_attendance: number | null;
  topic_title: string | null;
  topic_category: string | null;
  programming_icare_phase: string | null;
  programming_domain: string | null;
  recorded_at: string;
}
export interface CircleWorkspace {
  series: CircleSeries[];
  meetings: CircleMeeting[];
}
export async function getMyCircleWorkspace(): Promise<CircleWorkspace> {
  const { data, error } = await getSupabase().rpc('get_my_circle_workspace');
  if (error) throw error;
  return data as CircleWorkspace;
}
export interface CircleInput {
  seriesId: number;
  startsAt: string;
  endsAt: string | null;
  status: 'held' | 'cancelled';
  participants: number | null;
  facilitators: string[];
  topic?: string;
  theme?: string;
  icarePhase?: string;
  domain?: string;
}
export async function recordCircleMeeting(
  input: CircleInput,
): Promise<{ ok: boolean; code: string; meeting_id: number }> {
  const { data, error } = await getSupabase().rpc('record_circle_meeting', {
    p_series_id: input.seriesId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_status: input.status,
    p_participant_count: input.participants,
    p_facilitator_names: input.facilitators,
    p_topic_title: input.topic || null,
    p_topic_category: input.theme || null,
    p_icare_phase: input.icarePhase || null,
    p_domain: input.domain || null,
  });
  if (error) throw error;
  return data;
}
