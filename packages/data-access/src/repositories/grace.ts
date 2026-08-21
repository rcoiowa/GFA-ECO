import { getSupabase } from '../client';

/**
 * Grace AI companion data-access (P4-Grace G1). The browser NEVER holds the
 * provider key, the model, the system prompt, or the safety policy — those are
 * server-authoritative in the `grace` Edge Function. This layer only:
 *   • reports whether the participant has an active `ai_features` consent grant
 *     (frontend gate; the Edge Function re-checks independently, §9);
 *   • invokes the Edge Function with the conversation turns.
 * No conversation body is persisted client-side beyond React/session state.
 */

export type GraceSafetyCategory =
  | 'ordinary'
  | 'ordinary_distress'
  | 'craving_urge'
  | 'return_to_use'
  | 'ambiguous_concerning'
  | 'self_harm_suicide'
  | 'overdose'
  | 'immediate_danger_violence'
  | 'medical_emergency';

export interface GraceResult {
  ok: boolean;
  /** ok | consent_required | ai_unconfigured | provider_error | empty | unauthenticated | … */
  code: string;
  content?: string;
  safety?: { category: GraceSafetyCategory; surface_support_now: boolean };
  retrieval?: { used: boolean; slogan_numbers: number[] };
  policy_version?: string;
  disclosure?: string;
}

export interface GraceTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** True iff the latest `ai_features` decision is an active (non-revoked,
 *  non-expired) grant. Mirrors the Edge Function's server-side recheck. */
export async function hasActiveAiConsent(personId: number): Promise<boolean> {
  const supabase = getSupabase();
  const { data: type } = await supabase
    .from('consent_types')
    .select('id')
    .eq('key', 'ai_features')
    .maybeSingle();
  if (!type) return false;
  const { data: grant } = await supabase
    .from('consent_grants')
    .select('status, revoked_at, expires_at')
    .eq('person_id', personId)
    .eq('consent_type_id', type.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (
    !!grant &&
    grant.status === 'granted' &&
    grant.revoked_at === null &&
    (grant.expires_at === null || new Date(grant.expires_at).getTime() > Date.now())
  );
}

/** Record an `ai_features` consent decision through the canonical append-only path. */
export async function setAiConsent(
  personId: number,
  status: 'granted' | 'revoked',
): Promise<void> {
  const supabase = getSupabase();
  const { data: type } = await supabase
    .from('consent_types')
    .select('id')
    .eq('key', 'ai_features')
    .maybeSingle();
  if (!type) throw new Error('ai_features consent type not found');
  const { error } = await supabase.from('consent_grants').insert({
    person_id: personId,
    consent_type_id: type.id,
    status,
    method: 'in_app',
    effective_at: new Date().toISOString(),
    revoked_at: status === 'revoked' ? new Date().toISOString() : null,
  });
  if (error) throw error;
}

/** Invoke the server-authoritative Grace Edge Function. */
export async function invokeGrace(messages: GraceTurn[]): Promise<GraceResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('grace', { body: { messages } });
  if (error) {
    // Network/transport failure — surface as provider_error so the UI can keep
    // Support Now reachable. No body is logged.
    return { ok: false, code: 'provider_error' };
  }
  return (data ?? { ok: false, code: 'provider_error' }) as GraceResult;
}
