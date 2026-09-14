import { getSupabase } from '../client';
import { getServiceContext } from './serviceEvents';

/**
 * Session requests (participant side). A request is an appointments row with
 * status 'requested'; coaches schedule and complete it in their workspace
 * (Phase 7), which is when the service_event is recorded.
 */

export interface AppointmentRow {
  id: number;
  title: string;
  starts_at: string;
  status: string;
  location_note: string | null;
  created_at: string;
}

export async function listMyAppointments(personId: number): Promise<AppointmentRow[]> {
  const { data, error } = await getSupabase()
    .from('appointments')
    .select('id, title, starts_at, status, location_note, created_at')
    .eq('person_id', personId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function requestCoachingSession(input: {
  personId: number;
  preferredTimes: string;
  note?: string;
}): Promise<AppointmentRow> {
  const ctx = await getServiceContext();
  const { data, error } = await getSupabase()
    .from('appointments')
    .insert({
      person_id: input.personId,
      service_type_id: ctx.serviceTypeIdsByKey.get('coaching_session') ?? null,
      title: 'Coaching session request',
      // Placeholder until a coach schedules; preferred times live in the note.
      starts_at: new Date().toISOString(),
      status: 'requested',
      location_note: [input.preferredTimes, input.note].filter(Boolean).join(' — '),
    })
    .select('id, title, starts_at, status, location_note, created_at')
    .single();
  if (error) throw error;
  return data;
}
