import { getSupabase } from '../client';
import type { RpcEnvelope } from './coachWorkspace';

/**
 * Admin Command Center data access (P4G). Aggregation happens in PostgreSQL
 * (definer RPCs, platform-admin gated, fixture-aware); privileged mutations are
 * RPC-only with server-derived actors and audit rows. Nothing here reads
 * private conversation bodies or participant narrative — operations, access,
 * and aggregate evidence only.
 */

async function rpc(fn: string, args: Record<string, unknown> = {}): Promise<RpcEnvelope> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) return { ok: false, code: 'rpc_error' };
  return (data as RpcEnvelope) ?? { ok: false, code: 'empty' };
}

export type AdminSummary = Record<string, unknown> & { ok: boolean };

export async function getAdminOperationsSummary(): Promise<AdminSummary> {
  return (await rpc('admin_operations_summary')) as AdminSummary;
}

export async function getAdminEvidenceSummary(): Promise<AdminSummary> {
  return (await rpc('admin_evidence_summary')) as AdminSummary;
}

export interface AdminPersonRow {
  person_id: number;
  display_name: string;
  classification: string;
  roles: Array<{ assignment_id: number; role: string; residence_id: number | null }>;
  has_active_coaching: boolean;
  has_active_navigation: boolean;
  has_active_residency: boolean;
}

export async function adminListPeople(): Promise<AdminPersonRow[]> {
  const { data, error } = await getSupabase().rpc('admin_list_people');
  if (error) throw error;
  return (data as AdminPersonRow[]) ?? [];
}

export interface InvitationRow {
  id: number;
  email: string;
  role_keys: string[];
  purpose: string;
  residence_id: number | null;
  note: string | null;
  created_at: string;
  expires_at: string | null;
  consumed_at: string | null;
  revoked_at: string | null;
}

export async function listInvitations(): Promise<InvitationRow[]> {
  const { data, error } = await getSupabase()
    .from('staff_preauthorizations')
    .select('id, email, role_keys, purpose, residence_id, note, created_at, expires_at, consumed_at, revoked_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as InvitationRow[]) ?? [];
}

export function createStaffInvitation(input: {
  email: string;
  roleKeys: string[];
  purpose?: 'staff' | 'operator';
  residenceId?: number | null;
  note?: string;
}): Promise<RpcEnvelope> {
  return rpc('create_staff_invitation', {
    p_email: input.email,
    p_role_keys: input.roleKeys,
    p_purpose: input.purpose ?? 'staff',
    p_residence_id: input.residenceId ?? null,
    p_organization_id: null,
    p_expires_days: 30,
    p_note: input.note ?? null,
  });
}

export function revokeStaffInvitation(invitationId: number): Promise<RpcEnvelope> {
  return rpc('revoke_staff_invitation', { p_invitation_id: invitationId });
}

export function grantRoleAssignment(input: {
  personId: number;
  role: string;
  residenceId?: number | null;
}): Promise<RpcEnvelope> {
  return rpc('grant_role_assignment', {
    p_person_id: input.personId,
    p_role: input.role,
    p_organization_id: null,
    p_program_id: null,
    p_residence_id: input.residenceId ?? null,
  });
}

export function revokeRoleAssignment(assignmentId: number): Promise<RpcEnvelope> {
  return rpc('revoke_role_assignment', { p_assignment_id: assignmentId });
}

export interface AuditRow {
  id: number;
  actor_person_id: number | null;
  action: string;
  entity_table: string;
  entity_id: number | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export async function listAuditLog(limit = 100): Promise<AuditRow[]> {
  const { data, error } = await getSupabase()
    .from('audit_log')
    .select('id, actor_person_id, action, entity_table, entity_id, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as AuditRow[]) ?? [];
}

export interface AdminResidenceRow {
  id: number;
  name: string;
  capacity: number | null;
  population_served: string | null;
  level_of_support: string | null;
}

export async function adminListResidences(): Promise<AdminResidenceRow[]> {
  const { data, error } = await getSupabase()
    .from('residences')
    .select('id, name, capacity, population_served, level_of_support')
    .order('name');
  if (error) throw error;
  return (data as AdminResidenceRow[]) ?? [];
}
