import { getSupabase } from '../client';
import type { RpcEnvelope } from './coachWorkspace';
import type {
  NavRosterEntry,
  NavigationNeedRow,
  NavigationReferralRow,
} from '@recoveryos/domain';
export type { NavRosterEntry, NavigationNeedRow, NavigationReferralRow } from '@recoveryos/domain';

/**
 * Navigation data access (P4E). Reads are relationship-scoped by RLS
 * (participant-own / navigator's active participants / platform admin);
 * every lifecycle transition is a SECURITY DEFINER RPC. Navigators are a
 * separate relationship domain — nothing here touches coaching_relationships.
 */

async function rpc(fn: string, args: Record<string, unknown>): Promise<RpcEnvelope> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) return { ok: false, code: 'rpc_error' };
  return (data as RpcEnvelope) ?? { ok: false, code: 'empty' };
}

/** The navigator's active participants with relationship-scoped identity (RPC, 0112). */
export async function getMyNavigationParticipants(): Promise<NavRosterEntry[]> {
  const { data, error } = await getSupabase().rpc('get_my_navigation_participants');
  if (error) throw error;
  return (data as NavRosterEntry[]) ?? [];
}

/** Needs visible to the caller (RLS-scoped). Optionally narrowed to one person. */
export async function getNavigationNeeds(personId?: number): Promise<NavigationNeedRow[]> {
  let query = getSupabase()
    .from('navigation_needs')
    .select('id, person_id, navigation_relationship_id, need_category, status, identified_at, resolved_at, note')
    .order('identified_at', { ascending: false })
    .limit(200);
  if (personId !== undefined) query = query.eq('person_id', personId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as NavigationNeedRow[]) ?? [];
}

/** Referrals/connections visible to the caller (RLS-scoped). */
export async function getNavigationReferrals(personId?: number): Promise<NavigationReferralRow[]> {
  let query = getSupabase()
    .from('navigation_referrals')
    .select(
      'id, person_id, navigation_need_id, resource_id, organization_id, destination_name, referral_type, status, connection_evidence, attempted_at, connected_at, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (personId !== undefined) query = query.eq('person_id', personId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as NavigationReferralRow[]) ?? [];
}

export function identifyNavigationNeed(input: {
  personId: number;
  category: string;
  note?: string;
}): Promise<RpcEnvelope> {
  return rpc('identify_navigation_need', {
    p_person_id: input.personId,
    p_need_category: input.category,
    p_note: input.note ?? null,
    p_support_request_id: null,
  });
}

export function updateNavigationNeedStatus(needId: number, status: string): Promise<RpcEnvelope> {
  return rpc('update_navigation_need_status', { p_need_id: needId, p_status: status });
}

export function createNavigationReferral(input: {
  personId: number;
  referralType: 'information' | 'referral' | 'warm_handoff';
  needId?: number | null;
  destinationName?: string;
  note?: string;
}): Promise<RpcEnvelope> {
  return rpc('create_navigation_referral', {
    p_person_id: input.personId,
    p_referral_type: input.referralType,
    p_need_id: input.needId ?? null,
    p_resource_id: null,
    p_organization_id: null,
    p_destination_name: input.destinationName ?? null,
    p_note: input.note ?? null,
  });
}

export function recordReferralOutcome(input: {
  referralId: number;
  status: string;
  evidence?: string;
}): Promise<RpcEnvelope> {
  return rpc('record_referral_outcome', {
    p_referral_id: input.referralId,
    p_status: input.status,
    p_evidence: input.evidence ?? null,
  });
}

/** Participant loop-closure voice: "Were you able to connect?" */
export function confirmMyConnection(referralId: number, response: string): Promise<RpcEnvelope> {
  return rpc('confirm_my_connection', { p_referral_id: referralId, p_response: response });
}

/** Navigator attests actual navigation support delivered (never inferred). */
export function recordNavigationServiceEvent(input: {
  personId: number;
  modality?: string;
  startedAt?: string;
  durationMinutes?: number;
  referralId?: number | null;
}): Promise<RpcEnvelope> {
  return rpc('record_navigation_service_event', {
    p_person_id: input.personId,
    p_modality: input.modality ?? 'phone',
    p_delivery_context: 'vrcc',
    p_started_at: input.startedAt ?? new Date().toISOString(),
    p_duration_minutes: input.durationMinutes ?? null,
    p_referral_id: input.referralId ?? null,
  });
}

/** Coach attests a confirmed session actually happened (T4b evidence, 0112). */
export function completeSession(appointmentId: number, durationMinutes?: number): Promise<RpcEnvelope> {
  return rpc('complete_session', {
    p_appointment_id: appointmentId,
    p_duration_minutes: durationMinutes ?? null,
  });
}
