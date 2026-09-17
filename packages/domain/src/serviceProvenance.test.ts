import { describe, expect, it } from 'vitest';
import {
  REPORTING_AUTHORITIES,
  SELF_RECORDABLE_SERVICE_TYPES,
  SERVICE_EVENT_SOURCES,
  reportingAuthorityForSource,
  reportingAuthorityLabel,
} from './serviceProvenance';

/**
 * P2 semantic pins (RATIFIED 2026-08-22 + Final Reconciliation). Governance tests:
 * the provenance vocabulary is closed at four values, `imported`/`unknown`/`unclassified`
 * do not exist, reporting authority is a separate layer with no "Class A/B/C" language,
 * partner confirmation never auto-becomes GFA delivery, and the participant
 * self-recordable list is exactly the three ratified types.
 */

describe('service-event provenance canon (ratified v1.0)', () => {
  it('carries exactly the four ratified sources — imported/unknown/unclassified absent', () => {
    expect([...SERVICE_EVENT_SOURCES]).toEqual([
      'participant_self_reported',
      'staff_attested',
      'partner_confirmed',
      'system_derived',
    ]);
    for (const banned of ['imported', 'unknown', 'unclassified']) {
      expect(SERVICE_EVENT_SOURCES).not.toContain(banned);
    }
  });

  it('maps sources to reporting authorities on the ratified translation', () => {
    expect(reportingAuthorityForSource('staff_attested')).toBe('organizationally_attested');
    expect(reportingAuthorityForSource('participant_self_reported')).toBe('participant_reported');
    expect(reportingAuthorityForSource('system_derived')).toBe('system_derived');
  });

  it('never auto-folds partner confirmation into organizational delivery', () => {
    expect(reportingAuthorityForSource('partner_confirmed')).toBeNull();
  });

  it('uses semantic authority names — no Institutional-Evidence-Ledger A/B/C collision', () => {
    expect(REPORTING_AUTHORITIES.map((a) => a.key)).toEqual([
      'organizationally_attested',
      'participant_reported',
      'system_derived',
    ]);
    for (const a of REPORTING_AUTHORITIES) {
      expect(a.label).not.toMatch(/\bclass\s+[abc]\b/i);
      expect(a.label).not.toMatch(/_/);
    }
    // Participant-reported metrics must say so, and never read as delivery.
    expect(reportingAuthorityLabel('participant_reported')).toBe(
      'Participant-reported engagement',
    );
    expect(reportingAuthorityLabel('organizationally_attested')).toBe(
      'Organizationally attested service activity',
    );
  });

  it('keeps the participant self-recordable list closed at the three ratified types', () => {
    expect([...SELF_RECORDABLE_SERVICE_TYPES]).toEqual([
      'daily_check_in',
      'recovery_capital_assessment',
      'recovery_practice',
    ]);
    // Delivery types never self-recordable; community participation deliberately excluded in P2.
    for (const banned of [
      'coaching_session',
      'resource_navigation',
      'residence_recovery_support',
      'peer_support',
      'community_event',
    ]) {
      expect(SELF_RECORDABLE_SERVICE_TYPES).not.toContain(banned);
    }
  });
});
