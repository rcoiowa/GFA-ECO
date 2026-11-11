import { getSupabase } from '../client';
export interface CircleSeries {
  id: number;
  name: string;
  location_name: string;
  location_kind: string;
  timezone: string;
  county: string | null;
  address: string | null;
  room: string | null;
  participation_access: 'public' | 'closed_cbh_clients' | 'unspecified';
  schedule_frequency: 'weekly' | 'selected_tuesdays' | null;
  schedule_weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  schedule_note: string | null;
  facilitators: { person_id: number; name: string }[];
}
export interface CircleMeeting {
  id: number;
  series_id: number;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  county: string | null;
  participation_access: 'public' | 'closed_cbh_clients' | 'unspecified' | null;
  occurrence_status: 'held' | 'cancelled' | 'scheduled';
  participant_count: number | null;
  facilitator_names: string[] | null;
  total_attendance: number | null;
  topic_title: string | null;
  topic_category: string | null;
  programming_icare_phase: string | null;
  programming_domain: string | null;
  first_time_participant_count?: number | null;
  facilitator_notes?: string | null;
  recorded_at: string;
}
export interface CircleWorkspace {
  capabilities?: { circle_documentation_v2?: boolean };
  series: CircleSeries[];
  readOnlySeries?: CircleSeries[];
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
  documentationV2?: boolean;
  firstTimeParticipants?: number | null;
  facilitatorNotes?: string;
}
export async function recordCircleMeeting(
  input: CircleInput,
): Promise<{ ok: boolean; code: string; meeting_id: number }> {
  const notes = input.facilitatorNotes?.trim() || null;
  if (
    !input.documentationV2 &&
    (input.firstTimeParticipants !== undefined || input.facilitatorNotes !== undefined)
  ) {
    throw new Error('This server does not support extended Circle documentation.');
  }
  if (notes && Array.from(notes).length > 2000) {
    throw new Error('Facilitator notes must be 2000 characters or fewer.');
  }
  if (
    input.firstTimeParticipants != null &&
    (!Number.isInteger(input.firstTimeParticipants) ||
      input.firstTimeParticipants < 0 ||
      input.status !== 'held' ||
      input.participants == null ||
      input.firstTimeParticipants > input.participants)
  ) {
    throw new Error(
      'First-time participants must be a whole number within total participants for a held meeting.',
    );
  }
  const { data, error } = await getSupabase().rpc(
    input.documentationV2 ? 'record_circle_meeting_v2' : 'record_circle_meeting',
    {
      ...(input.documentationV2
        ? {
            p_first_time_participant_count:
              input.status === 'held' ? (input.firstTimeParticipants ?? null) : null,
            p_facilitator_notes: notes,
          }
        : {}),
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
    },
  );
  if (error) throw error;
  return data;
}
