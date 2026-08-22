/**
 * Service-event provenance & reporting authority — the TypeScript mirror of the RATIFIED
 * canon (docs/architecture/service-event-provenance-v1.0.md, ratified 2026-08-22).
 *
 * `source` describes how ONE ROW entered institutional record; reporting authority describes
 * what an AGGREGATE over such rows may claim. They are related but distinct layers, and both
 * are distinct from the GFA Institutional Evidence Ledger's A–F classification — no "Class
 * A/B/C" language exists in RecoveryOS reporting. `scripts/verify-service-provenance.mjs`
 * (CI) pins this file against the architecture doc and the 0133/0134 migrations.
 *
 * The vocabulary is CLOSED at four values. `imported` is deliberately absent: ingestion/
 * transport is not attestation authority. There is no `unknown`/`unclassified` value.
 */

export const SERVICE_EVENT_SOURCES = [
  'participant_self_reported',
  'staff_attested',
  'partner_confirmed',
  'system_derived',
] as const;

export type ServiceEventSource = (typeof SERVICE_EVENT_SOURCES)[number];

export interface ReportingAuthorityDef {
  key: 'organizationally_attested' | 'participant_reported' | 'system_derived';
  /** Display label — used verbatim on reporting surfaces. */
  label: string;
  /** Evidence-ladder rung an aggregate of this authority evidences. */
  rung: 'activity' | 'engagement';
}

export const REPORTING_AUTHORITIES: readonly ReportingAuthorityDef[] = [
  {
    key: 'organizationally_attested',
    label: 'Organizationally attested service activity',
    rung: 'activity',
  },
  {
    key: 'participant_reported',
    label: 'Participant-reported engagement',
    rung: 'engagement',
  },
  {
    // System derivation does NOT independently establish external authority: external claims
    // require an authoritative generating fact, deterministic traceable derivation, and an
    // operational definition permitting the use (canon §3).
    key: 'system_derived',
    label: 'System-derived activity',
    rung: 'activity',
  },
] as const;

export type ReportingAuthorityKey = ReportingAuthorityDef['key'];

/**
 * Canonical source → reporting-authority translation. `partner_confirmed` returns null:
 * its authority is defined by the future governed partner workflow according to the
 * underlying evidence — it is never automatically GFA-delivered service.
 */
export function reportingAuthorityForSource(
  source: ServiceEventSource | string,
): ReportingAuthorityKey | null {
  switch (source) {
    case 'staff_attested':
      return 'organizationally_attested';
    case 'participant_self_reported':
      return 'participant_reported';
    case 'system_derived':
      return 'system_derived';
    default:
      return null;
  }
}

const authorityByKey = new Map(REPORTING_AUTHORITIES.map((a) => [a.key, a]));

/** Display label for an authority key; empty string for unknown/null. */
export function reportingAuthorityLabel(key: string | null | undefined): string {
  if (!key) return '';
  return authorityByKey.get(key as ReportingAuthorityKey)?.label ?? key.replace(/_/g, ' ');
}

/**
 * The CLOSED list of service types a participant may self-record (RATIFIED — the
 * participant records what THEY did; it never becomes "GFA delivered this service").
 */
export const SELF_RECORDABLE_SERVICE_TYPES = [
  'daily_check_in',
  'recovery_capital_assessment',
  'recovery_practice',
] as const;

export type SelfRecordableServiceType = (typeof SELF_RECORDABLE_SERVICE_TYPES)[number];
