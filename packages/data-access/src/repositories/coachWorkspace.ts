import { getSupabase } from '../client';
import type { CoachRosterEntry, FollowUpRow } from '@recoveryos/domain';
export type { CoachRosterEntry, FollowUpRow } from '@recoveryos/domain';

/**
 * Coach Workspace data access (P4C). Reads are relationship-scoped via RPCs /
 * RLS; every lifecycle transition goes through a SECURITY DEFINER RPC —
 * components never mutate canonical tables directly.
 */

/** The coach's active participants with relationship-scoped identity (RPC, 0108). */
export async function getMyParticipantsRoster(): Promise<CoachRosterEntry[]> {
  const { data, error } = await getSupabase().rpc('get_my_participants');
  if (error) throw error;
  return (data as CoachRosterEntry[]) ?? [];
}

/** Follow-ups assigned to the caller (RLS: assignee/subject/admin read). */
export async function getMyAssignedFollowUps(personId: number): Promise<FollowUpRow[]> {
  const { data, error } = await getSupabase()
    .from('follow_ups')
    .select('id, person_id, assigned_person_id, appointment_id, follow_up_type, due_at, status, note, completed_at, created_at')
    .eq('assigned_person_id', personId)
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw error;
  return (data as FollowUpRow[]) ?? [];
}

export interface RpcEnvelope {
  ok: boolean;
  code: string;
  message?: string;
  [k: string]: unknown;
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<RpcEnvelope> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) return { ok: false, code: 'rpc_error' };
  return (data as RpcEnvelope) ?? { ok: false, code: 'empty' };
}

/** Coach creates an intentional follow-up for one of their own active participants (RPC, 0108). */
export function createFollowUp(input: {
  personId: number;
  dueAt: string;
  followUpType?: string;
  note?: string;
  appointmentId?: number | null;
}): Promise<RpcEnvelope> {
  return rpc('create_follow_up', {
    p_person_id: input.personId,
    p_due_at: input.dueAt,
    p_follow_up_type: input.followUpType ?? 'check_in',
    p_note: input.note ?? null,
    p_appointment_id: input.appointmentId ?? null,
  });
}

/** Assignee (or admin) completes a follow-up; idempotent (RPC, 0108). */
export function completeFollowUp(followUpId: number): Promise<RpcEnvelope> {
  return rpc('complete_follow_up', { p_follow_up_id: followUpId });
}
