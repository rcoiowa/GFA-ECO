import type { DeliveryContext, ServiceEvent } from '@recoveryos/domain';
import { getSupabase } from '../client';

/**
 * Service-event attribution (ADR-0005): every delivered service records a
 * service_events row. Reference IDs (organization, program, service types)
 * are cached per session — they're stable platform configuration.
 */

interface ServiceContextCache {
  organizationId: number;
  vrccProgramId: number | null;
  serviceTypeIdsByKey: Map<string, number>;
}

let cache: ServiceContextCache | null = null;

export async function getServiceContext(): Promise<ServiceContextCache> {
  if (cache) return cache;
  const supabase = getSupabase();
  const [orgRes, programRes, typesRes] = await Promise.all([
    supabase.from('organizations').select('id').eq('name', 'Grace For Addictions').single(),
    supabase.from('programs').select('id').eq('key', 'vrcc').maybeSingle(),
    supabase.from('service_types').select('id, key').eq('is_active', true),
  ]);
  if (orgRes.error) throw orgRes.error;
  if (typesRes.error) throw typesRes.error;
  cache = {
    organizationId: orgRes.data.id,
    vrccProgramId: programRes.data?.id ?? null,
    serviceTypeIdsByKey: new Map((typesRes.data ?? []).map((t) => [t.key as string, t.id as number])),
  };
  return cache;
}

/**
 * Record a self-directed service event (check-in, assessment, practice).
 * Attribution failures must never lose the underlying feature data — callers
 * write the feature row first and treat this as best-effort, surfacing errors
 * to telemetry rather than the person.
 */
export async function recordSelfServiceEvent(input: {
  personId: number;
  serviceTypeKey: string;
  deliveryContext: DeliveryContext;
  startedAt?: string;
  endedAt?: string | null;
}): Promise<ServiceEvent | null> {
  try {
    const ctx = await getServiceContext();
    const serviceTypeId = ctx.serviceTypeIdsByKey.get(input.serviceTypeKey);
    if (!serviceTypeId) return null;
    const { data, error } = await getSupabase()
      .from('service_events')
      .insert({
        person_id: input.personId,
        service_type_id: serviceTypeId,
        organization_id: ctx.organizationId,
        program_id: input.deliveryContext === 'vrcc' ? ctx.vrccProgramId : null,
        delivery_context: input.deliveryContext,
        modality: 'self_directed',
        started_at: input.startedAt ?? new Date().toISOString(),
        ended_at: input.endedAt ?? new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('service-event attribution failed', err);
    return null;
  }
}
