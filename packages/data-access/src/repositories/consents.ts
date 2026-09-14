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
