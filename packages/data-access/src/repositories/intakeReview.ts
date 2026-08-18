import { getSupabase } from '../client';

/**
 * Staff-side review of the two moderated public-intake queues. Reads go through
 * RLS (platform-admin for listing submissions; residence-staff / care-ops for
 * application intake). Status transitions go through the audited SECURITY
 * DEFINER RPCs from migration 0122 — the sanctioned write path.
 */

export interface ResidenceListingSubmission {
  id: number;
  residence_name: string;
  organization_name: string | null;
  address_city: string | null;
  address_state: string | null;
  address_county: string | null;
  population_served: string | null;
  residence_type: string | null;
  support_level: string | null;
  narr_certified: boolean | null;
  certification_details: string | null;
  capacity: number | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: 'submitted' | 'under_review' | 'approved' | 'published' | 'rejected';
  reviewed_at: string | null;
  reviewed_by_person_id: number | null;
  review_notes: string | null;
  published_residence_id: number | null;
  source: string;
  test_fixture: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResidenceApplicationIntake {
  id: number;
  residence_id: number;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  preferred_contact: string | null;
  referral_source: string | null;
  answers: Record<string, string>;
  consent_to_contact: boolean;
  status:
    | 'received'
    | 'contacted'
    | 'account_offered'
    | 'converted'
    | 'waitlisted'
    | 'declined'
    | 'closed';
  reviewed_at: string | null;
  reviewed_by_person_id: number | null;
  review_notes: string | null;
  converted_person_id: number | null;
  converted_application_id: number | null;
  source: string;
  test_fixture: boolean;
  created_at: string;
  updated_at: string;
}

interface RpcEnvelope {
  ok: boolean;
  code?: string;
  residence_id?: number;
}

function unwrap(data: unknown): RpcEnvelope {
  const envelope = data as RpcEnvelope | null;
  if (!envelope?.ok) throw new Error(envelope?.code ?? 'rpc_failed');
  return envelope;
}

// ---- Flow 1: directory listing submissions (platform admin) ----------------

export async function listListingSubmissions(
  status?: ResidenceListingSubmission['status'],
): Promise<ResidenceListingSubmission[]> {
  let query = getSupabase()
    .from('residence_listing_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ResidenceListingSubmission[];
}

export async function reviewListingSubmission(input: {
  submissionId: number;
  status: 'under_review' | 'approved' | 'rejected';
  notes?: string;
}): Promise<void> {
  const { data, error } = await getSupabase().rpc('review_residence_listing_submission', {
    p_submission_id: input.submissionId,
    p_status: input.status,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  unwrap(data);
}

/** Deliberately create the canonical, publicly-listed residence from an approved submission. */
export async function publishListingSubmission(input: {
  submissionId: number;
  organizationId: number;
}): Promise<{ residenceId: number }> {
  const { data, error } = await getSupabase().rpc('publish_residence_listing_submission', {
    p_submission_id: input.submissionId,
    p_organization_id: input.organizationId,
  });
  if (error) throw error;
  const envelope = unwrap(data);
  return { residenceId: envelope.residence_id! };
}

// ---- Flow 2: Grace House application intake (residence staff / care-ops) ----

export async function listApplicationIntake(input?: {
  residenceId?: number;
  status?: ResidenceApplicationIntake['status'];
}): Promise<ResidenceApplicationIntake[]> {
  let query = getSupabase()
    .from('residence_application_intake')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (input?.residenceId) query = query.eq('residence_id', input.residenceId);
  if (input?.status) query = query.eq('status', input.status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ResidenceApplicationIntake[];
}

export async function reviewApplicationIntake(input: {
  intakeId: number;
  status: Exclude<ResidenceApplicationIntake['status'], 'received'>;
  notes?: string;
}): Promise<void> {
  const { data, error } = await getSupabase().rpc('review_residence_application_intake', {
    p_intake_id: input.intakeId,
    p_status: input.status,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  unwrap(data);
}
