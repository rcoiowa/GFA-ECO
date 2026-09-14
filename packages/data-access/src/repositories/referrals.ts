import { getSupabase } from '../client';

export interface Referral {
  id: number;
  residence_id: number;
  referrer_name: string;
  referrer_organization: string | null;
  referrer_role: string | null;
  referrer_email: string | null;
  referrer_phone: string | null;
  participant_name: string;
  participant_phone: string | null;
  participant_location: string | null;
  notes: string | null;
  consent_attested: boolean;
  status: 'received' | 'contacted' | 'converted' | 'closed';
  handled_by_person_id: number | null;
  handled_at: string | null;
  created_at: string;
}

/** Referral queue for the residence (staff RLS). */
export async function listReferrals(residenceId: number): Promise<Referral[]> {
  const { data, error } = await getSupabase()
    .from('referrals')
    .select('*')
    .eq('residence_id', residenceId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function updateReferralStatus(input: {
  referralId: number;
  status: Referral['status'];
  handledByPersonId: number;
}): Promise<void> {
  const { error } = await getSupabase()
    .from('referrals')
    .update({
      status: input.status,
      handled_by_person_id: input.handledByPersonId,
      handled_at: new Date().toISOString(),
    })
    .eq('id', input.referralId);
  if (error) throw error;
}
