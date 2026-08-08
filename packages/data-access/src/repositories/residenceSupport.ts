import { getSupabase } from '../client';
import type { RpcEnvelope } from './coachWorkspace';

/**
 * Residence support seam (P4F). The designated residence-support person — an
 * intentional, manager-made designation, never the whole staff roster — is the
 * third My Support context and backs messaging context='residence'.
 */

async function rpc(fn: string, args: Record<string, unknown>): Promise<RpcEnvelope> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) return { ok: false, code: 'rpc_error' };
  return (data as RpcEnvelope) ?? { ok: false, code: 'empty' };
}

/** Residence manager designates one staff member as a resident's support person. */
export function designateResidenceSupport(personId: number, staffPersonId: number): Promise<RpcEnvelope> {
  return rpc('designate_residence_support', {
    p_person_id: personId,
    p_staff_person_id: staffPersonId,
  });
}

export function endResidenceSupport(personId: number): Promise<RpcEnvelope> {
  return rpc('end_residence_support', { p_person_id: personId });
}

/** Staff attests actual residence recovery support delivered (never inferred from operations). */
export function recordResidenceSupportServiceEvent(input: {
  personId: number;
  modality?: string;
  startedAt?: string;
  durationMinutes?: number;
}): Promise<RpcEnvelope> {
  return rpc('record_residence_support_service_event', {
    p_person_id: input.personId,
    p_modality: input.modality ?? 'in_person',
    p_started_at: input.startedAt ?? new Date().toISOString(),
    p_duration_minutes: input.durationMinutes ?? null,
  });
}
