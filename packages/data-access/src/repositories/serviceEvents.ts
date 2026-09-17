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
    serviceTypeIdsByKey: new Map(
      (typesRes.data ?? []).map((t) => [t.key as string, t.id as number]),
    ),
  };
  return cache;
}

/**
 * Deterministic idempotency key from a feature-row reference (P2.5): one check-in /
 * assessment row → one service event, even across retries. FNV-1a folded into UUID shape —
 * collision-safe enough for per-person idempotency, not cryptographic.
 */
export function deterministicDedupeKey(featureRef: string): string {
  const hex: string[] = [];
  for (let seed = 0; seed < 4; seed++) {
    let h = (0x811c9dc5 ^ (seed * 0x9e3779b9)) >>> 0;
    for (let i = 0; i < featureRef.length; i++) {
      h = Math.imul(h ^ featureRef.charCodeAt(i), 0x01000193) >>> 0;
    }
    hex.push(h.toString(16).padStart(8, '0'));
  }
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-4${s.slice(13, 16)}-8${s.slice(17, 20)}-${s.slice(20, 32)}`;
}

/**
 * Record a participant self activity (check-in, assessment, practice) through the
 * canonical `record_my_activity` RPC (P2.5 — the direct table insert is retired; the RPC
 * enforces the ratified self whitelist and stamps source=participant_self_reported).
 * Attribution failures must never lose the underlying feature data — callers write the
 * feature row first and treat this as best-effort, surfacing errors to telemetry rather
 * than the person. Pass `featureRef` (e.g. "check_in:123") so one feature row can never
 * produce two events.
 */
export async function recordSelfServiceEvent(input: {
  personId: number;
  serviceTypeKey: string;
  deliveryContext: DeliveryContext;
  startedAt?: string;
  endedAt?: string | null;
  featureRef?: string;
}): Promise<ServiceEvent | null> {
  try {
    const { data, error } = await getSupabase().rpc('record_my_activity', {
      p_service_type_key: input.serviceTypeKey,
      p_delivery_context: input.deliveryContext,
      p_started_at: input.startedAt ?? new Date().toISOString(),
      p_dedupe_key: input.featureRef ? deterministicDedupeKey(input.featureRef) : null,
    });
    if (error) throw error;
    const envelope = data as { ok: boolean; code?: string } | null;
    if (!envelope?.ok) throw new Error(`record_my_activity: ${envelope?.code ?? 'empty'}`);
    return null;
  } catch (err) {
    console.error('service-event attribution failed', err);
    return null;
  }
}
