import { getSupabase } from '../client';

/**
 * Public recovery-housing intake adapters (account-less flows).
 *
 * These write through the canonical service-role boundary (the `residence-intake`
 * Edge Function), NOT by inserting into intake tables directly — those tables
 * have no anon grant on purpose. Referrals (Flow 3) keep their own constrained
 * anon insert in referrals.ts and are unchanged.
 *
 * Reads for the public national directory use the anon-readable projection view
 * `residence_directory_public`; the operational `residences` table stays
 * auth-gated.
 */

export interface DirectoryListing {
  id: number;
  name: string;
  address_city: string | null;
  address_state: string | null;
  phone: string | null;
  email: string | null;
  population_served: string | null;
  narr_level: string | null;
  narr_certification_status: string | null;
  narr_affiliate: string | null;
  level_of_support: string | null;
  accepts_mat: boolean | null;
  accepts_supervision: boolean | null;
  shared_room_fee_monthly: number | null;
  private_room_fee_monthly: number | null;
  public_description: string | null;
}

/** Public directory search (no account required). Reads the curated view only. */
export async function searchPublicDirectory(filters?: {
  state?: string;
  narrLevel?: string;
  limit?: number;
}): Promise<DirectoryListing[]> {
  let query = getSupabase()
    .from('residence_directory_public')
    .select('*')
    .order('name', { ascending: true })
    .limit(filters?.limit ?? 100);
  if (filters?.state) query = query.eq('address_state', filters.state);
  if (filters?.narrLevel) query = query.eq('narr_level', filters.narrLevel);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DirectoryListing[];
}

export interface ListingSubmissionInput {
  residenceName: string;
  organizationName?: string;
  addressCity?: string;
  addressState?: string;
  addressCounty?: string;
  populationServed?: string;
  residenceType?: string;
  supportLevel?: string;
  narrCertified?: boolean;
  certificationDetails?: string;
  capacity?: number;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  /** Cloudflare Turnstile token when the challenge is enabled server-side. */
  turnstileToken?: string;
}

/**
 * Flow 1 — submit a residence for directory listing consideration. Moderated;
 * never auto-published. Returns the intake submission id.
 */
export async function submitResidenceListing(
  input: ListingSubmissionInput,
): Promise<{ submissionId: number }> {
  const { data, error } = await getSupabase().functions.invoke('residence-intake', {
    body: {
      kind: 'listing',
      residence_name: input.residenceName,
      organization_name: input.organizationName,
      address_city: input.addressCity,
      address_state: input.addressState,
      address_county: input.addressCounty,
      population_served: input.populationServed,
      residence_type: input.residenceType,
      support_level: input.supportLevel,
      narr_certified: input.narrCertified,
      certification_details: input.certificationDetails,
      capacity: input.capacity,
      website: input.website,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      contact_phone: input.contactPhone,
      notes: input.notes,
      turnstile_token: input.turnstileToken,
    },
  });
  if (error) throw error;
  const out = data as { ok: boolean; code?: string; submission_id?: number };
  if (!out?.ok) throw new Error(out?.code ?? 'listing_submit_failed');
  return { submissionId: out.submission_id! };
}

export interface GraceHouseApplicationInput {
  residenceId: number;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  preferredContact?: string;
  referralSource?: string;
  /** Minimum-necessary intake answers; never SSN / clinical detail. */
  answers?: Record<string, string>;
  consentToContact?: boolean;
  turnstileToken?: string;
}

/**
 * Flow 2 — submit a Grace House application BEFORE having an account. Writes to
 * the sensitive pre-account intake table via the service-role boundary. No
 * account, person, or residency is created. Returns only an opaque intake id
 * (the row is never read back by the browser).
 */
export async function submitGraceHouseApplication(
  input: GraceHouseApplicationInput,
): Promise<{ intakeId: number }> {
  const { data, error } = await getSupabase().functions.invoke('residence-intake', {
    body: {
      kind: 'grace_house_application',
      residence_id: input.residenceId,
      applicant_name: input.applicantName,
      applicant_email: input.applicantEmail,
      applicant_phone: input.applicantPhone,
      preferred_contact: input.preferredContact,
      referral_source: input.referralSource,
      answers: input.answers ?? {},
      consent_to_contact: input.consentToContact ?? false,
      turnstile_token: input.turnstileToken,
    },
  });
  if (error) throw error;
  const out = data as { ok: boolean; code?: string; intake_id?: number };
  if (!out?.ok) throw new Error(out?.code ?? 'application_submit_failed');
  return { intakeId: out.intake_id! };
}
