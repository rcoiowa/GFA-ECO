import { getSupabase } from '../client';

/**
 * Shared six-stage inquiry queue (leads v2 — prepared migration 0147).
 *
 * Reads go through RLS (coordinators + admins see the queue; workers see only
 * their assigned inquiries). Every mutation is an audited SECURITY DEFINER RPC —
 * there is no client UPDATE path on leads, and the contact log is append-only.
 *
 * NOTE: these wrappers target the 0147 schema. Until that prepared migration is
 * applied (a gated activation act), the RPCs do not exist server-side and calls
 * return errors — the UI behind this module ships dark alongside the migration.
 */

export type LeadStatus =
  | 'new'
  | 'assigned'
  | 'contacted'
  | 'waiting'
  | 'scheduled'
  | 'closed'
  | 'converted';

export type ResidenceInterest = 'unspecified' | 'grace_house' | 'ejwrh' | 'confirm_route';

export type IntakeLead = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  interest: string | null;
  readiness: string | null;
  source: string;
  status: LeadStatus;
  assigned_to_person_id: number | null;
  organization_inquiry: boolean;
  residence_interest: ResidenceInterest;
  response_due_at: string | null;
  wix_submission_id: string | null;
  submitted_at: string | null;
  linked_intake_id: number | null;
  created_at: string;
  updated_at: string;
};

export type LeadContactEvent = {
  id: number;
  lead_id: number;
  responder_person_id: number;
  occurred_at: string;
  channel: 'phone' | 'text' | 'email' | 'in_person' | 'other';
  outcome: string;
  minutes_spent: number | null;
  next_follow_up_at: string | null;
  note: string | null;
};

export type LeadRpcResult = { ok: boolean; code: string; [k: string]: unknown };

/** Queue read (RLS-scoped): open inquiries first, ordered by response deadline. */
export async function listIntakeLeads(): Promise<IntakeLead[]> {
  const { data, error } = await getSupabase()
    .from('leads')
    .select('*')
    .order('response_due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as IntakeLead[];
}

/** Append-only contact history for one inquiry (RLS: coordinators + assignee). */
export async function listLeadContacts(leadId: number): Promise<LeadContactEvent[]> {
  const { data, error } = await getSupabase()
    .from('lead_contact_events')
    .select('*')
    .eq('lead_id', leadId)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadContactEvent[];
}

export async function assignLead(input: {
  leadId: number;
  assigneePersonId: number;
}): Promise<LeadRpcResult> {
  const { data, error } = await getSupabase().rpc('assign_lead', {
    p_lead_id: input.leadId,
    p_assignee_person_id: input.assigneePersonId,
  });
  if (error) throw error;
  return data as LeadRpcResult;
}

export async function recordLeadContact(input: {
  leadId: number;
  channel: LeadContactEvent['channel'];
  outcome: string;
  minutesSpent?: number;
  nextFollowUpAt?: string;
  note?: string;
}): Promise<LeadRpcResult> {
  const { data, error } = await getSupabase().rpc('record_lead_contact', {
    p_lead_id: input.leadId,
    p_channel: input.channel,
    p_outcome: input.outcome,
    p_minutes: input.minutesSpent ?? null,
    p_next_follow_up_at: input.nextFollowUpAt ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data as LeadRpcResult;
}

export async function setLeadStatus(input: {
  leadId: number;
  status: Exclude<LeadStatus, 'converted'>;
}): Promise<LeadRpcResult> {
  const { data, error } = await getSupabase().rpc('set_lead_status', {
    p_lead_id: input.leadId,
    p_status: input.status,
  });
  if (error) throw error;
  return data as LeadRpcResult;
}

export async function routeLead(input: {
  leadId: number;
  residenceInterest: ResidenceInterest;
  linkedIntakeId?: number;
}): Promise<LeadRpcResult> {
  const { data, error } = await getSupabase().rpc('route_lead', {
    p_lead_id: input.leadId,
    p_residence_interest: input.residenceInterest,
    p_linked_intake_id: input.linkedIntakeId ?? null,
  });
  if (error) throw error;
  return data as LeadRpcResult;
}

export async function findDuplicateLeads(leadId: number): Promise<LeadRpcResult> {
  const { data, error } = await getSupabase().rpc('find_duplicate_leads', {
    p_lead_id: leadId,
  });
  if (error) throw error;
  return data as LeadRpcResult;
}

export async function listIntakeAssignees(): Promise<LeadRpcResult> {
  const { data, error } = await getSupabase().rpc('list_intake_assignees');
  if (error) throw error;
  return data as LeadRpcResult;
}
