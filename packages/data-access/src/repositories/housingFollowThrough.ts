import { getSupabase } from '../client';
import { listLeadContacts, type LeadContactEvent } from './leadsQueue';

export interface HousingFollowThrough {
  intake_id: number;
  owner_person_id: number | null;
  proposed_cover_person_id: number | null;
  next_action: string | null;
  due_at: string | null;
  closed_at: string | null;
  bed_state: 'unverified' | 'available' | 'held' | 'assigned' | 'occupied';
  bed_reference: string | null;
  bed_evidence: string | null;
  bed_verified_at: string | null;
  bed_verified_by: number | null;
  version: number;
}
export interface HousingEvent {
  id: number;
  actor_person_id: number;
  occurred_at: string;
  action: string;
  detail: {
    input: Record<string, string>;
    before: HousingFollowThrough;
    after: HousingFollowThrough;
  };
}
export type HousingAction =
  | 'link_source'
  | 'claim'
  | 'propose_cover'
  | 'accept_cover'
  | 'cancel_cover'
  | 'next_action'
  | 'complete_action'
  | 'verify_bed'
  | 'contact'
  | 'close'
  | 'reopen';
export async function loadHousingFollowThrough(intakeId: number) {
  const db = getSupabase();
  const [state, events] = await Promise.all([
    db.from('housing_follow_through').select('*').eq('intake_id', intakeId).maybeSingle(),
    db.from('housing_follow_through_events').select('*').eq('intake_id', intakeId).order('id'),
  ]);
  if (state.error || events.error)
    throw new Error(
      'Housing follow-through is unavailable. Backend activation or access review is required.',
    );
  return {
    state: state.data as HousingFollowThrough | null,
    events: (events.data ?? []) as HousingEvent[],
  };
}
export async function actHousingFollowThrough(
  intakeId: number,
  version: number,
  action: HousingAction,
  detail: Record<string, string> = {},
) {
  const { data, error } = await getSupabase().rpc('act_housing_follow_through', {
    p_intake_id: intakeId,
    p_version: version,
    p_action: action,
    p_detail: detail,
  });
  if (error)
    throw new Error(
      'Action was not saved. Refresh to check ownership, access and remaining commitments.',
    );
  return data as HousingFollowThrough;
}
/** Retain original sources and their authorization; do not copy or broaden inquiry visibility. */
export async function loadLinkedHousingContacts(intakeId: number): Promise<LeadContactEvent[]> {
  const { data, error } = await getSupabase()
    .from('leads')
    .select('id')
    .eq('linked_intake_id', intakeId);
  if (error)
    throw new Error('Linked inquiry history unavailable; do not infer that no contact occurred.');
  const groups = await Promise.all((data ?? []).map((lead) => listLeadContacts(lead.id)));
  return groups.flat();
}
