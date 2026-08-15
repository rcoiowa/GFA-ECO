import type { ConsentGrant, ConsentType } from '@recoveryos/domain';
import { getSupabase } from '../client';

export async function listActiveConsentTypes(): Promise<ConsentType[]> {
  const { data, error } = await getSupabase()
    .from('consent_types')
    .select('*')
    .eq('is_active', true)
    .order('id');
  if (error) throw error;
  return data ?? [];
}

export async function listMyConsentGrants(personId: number): Promise<ConsentGrant[]> {
  const { data, error } = await getSupabase()
    .from('consent_grants')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Pure derivation: which active, required-for-service consent types lack a
 * currently-active grant? Mirrors the server-side active-grant semantics the
 * Grace Edge Function enforces (latest decision per type; must be `granted`,
 * unrevoked, unexpired). Exported separately so the rule is unit-testable
 * without a client.
 */
export function deriveMissingRequiredConsents(
  types: readonly ConsentType[],
  grants: readonly ConsentGrant[],
  now: Date = new Date(),
): ConsentType[] {
  // Latest decision per consent type (grants arrive newest-first).
  const latest = new Map<number, ConsentGrant>();
  for (const grant of grants) {
    if (!latest.has(grant.consent_type_id)) latest.set(grant.consent_type_id, grant);
  }
  return types.filter((type) => {
    if (!type.is_active || !type.is_required_for_service) return false;
    const current = latest.get(type.id);
    const active =
      !!current &&
      current.status === 'granted' &&
      current.revoked_at === null &&
      (current.expires_at === null || new Date(current.expires_at).getTime() > now.getTime());
    return !active;
  });
}

/**
 * The required-for-service consent types the person has not (currently)
 * granted. Empty means the minimal onboarding consent boundary is satisfied.
 * This is a UX read — server-side enforcement (e.g. the Grace function's own
 * consent gate, RLS) remains the authority and cannot be bypassed by
 * client-side state.
 */
export async function listMissingRequiredConsents(personId: number): Promise<ConsentType[]> {
  const [types, grants] = await Promise.all([
    listActiveConsentTypes(),
    listMyConsentGrants(personId),
  ]);
  return deriveMissingRequiredConsents(types, grants);
}

/**
 * Record a consent decision. Consent history is append-only: a new decision
 * supersedes the prior one for the same consent type; nothing is deleted.
 */
export async function recordConsentDecision(input: {
  personId: number;
  consentTypeId: number;
  status: 'granted' | 'declined' | 'revoked';
  documentVersion?: string | null;
}): Promise<ConsentGrant> {
  const { data, error } = await getSupabase()
    .from('consent_grants')
    .insert({
      person_id: input.personId,
      consent_type_id: input.consentTypeId,
      status: input.status,
      method: 'in_app',
      document_version: input.documentVersion ?? null,
      effective_at: new Date().toISOString(),
      revoked_at: input.status === 'revoked' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
