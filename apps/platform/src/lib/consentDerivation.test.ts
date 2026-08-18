import { describe, expect, it } from 'vitest';
import { deriveMissingRequiredConsents } from '@recoveryos/data-access';
import type { ConsentGrant, ConsentType } from '@recoveryos/domain';

/**
 * The onboarding boundary reuses the existing consent authority: only
 * active, required-for-service types count, and "satisfied" mirrors the
 * server-side active-grant semantics (latest decision; granted, unrevoked,
 * unexpired). Optional consents must never be pulled into the boundary.
 */

const type = (partial: Partial<ConsentType> & { id: number; key: string }): ConsentType => ({
  category: 'account_identity' as ConsentType['category'],
  name: partial.key,
  description: null,
  is_required_for_service: false,
  is_active: true,
  ...partial,
});

const grant = (
  partial: Partial<ConsentGrant> & { consent_type_id: number; created_at: string },
): ConsentGrant => ({
  id: Math.floor(Math.random() * 100000),
  person_id: 1,
  status: 'granted',
  scope: {},
  method: 'in_app',
  document_version: null,
  effective_at: partial.created_at,
  expires_at: null,
  revoked_at: null,
  created_by_person_id: null,
  ...partial,
});

const TYPES: ConsentType[] = [
  type({ id: 1, key: 'terms_of_use', is_required_for_service: true }),
  type({ id: 2, key: 'service_participation', is_required_for_service: true }),
  type({ id: 7, key: 'ai_features', is_required_for_service: false }),
  type({ id: 9, key: 'retired_required', is_required_for_service: true, is_active: false }),
];

describe('deriveMissingRequiredConsents', () => {
  it('reports every active required type missing for a brand-new person', () => {
    expect(deriveMissingRequiredConsents(TYPES, []).map((t) => t.key)).toEqual([
      'terms_of_use',
      'service_participation',
    ]);
  });

  it('never includes optional or inactive types (no bundling)', () => {
    const keys = deriveMissingRequiredConsents(TYPES, []).map((t) => t.key);
    expect(keys).not.toContain('ai_features');
    expect(keys).not.toContain('retired_required');
  });

  it('is satisfied by active grants for each required type', () => {
    const grants = [
      grant({ consent_type_id: 1, created_at: '2026-08-01T00:00:00Z' }),
      grant({ consent_type_id: 2, created_at: '2026-08-01T00:00:00Z' }),
    ];
    expect(deriveMissingRequiredConsents(TYPES, grants)).toEqual([]);
  });

  it('honors the latest decision per type (append-only history, newest first)', () => {
    const grants = [
      grant({ consent_type_id: 1, status: 'revoked', revoked_at: '2026-08-10T00:00:00Z', created_at: '2026-08-10T00:00:00Z' }),
      grant({ consent_type_id: 1, created_at: '2026-08-01T00:00:00Z' }),
      grant({ consent_type_id: 2, created_at: '2026-08-01T00:00:00Z' }),
    ];
    expect(deriveMissingRequiredConsents(TYPES, grants).map((t) => t.key)).toEqual([
      'terms_of_use',
    ]);
  });

  it('treats an expired grant as missing', () => {
    const grants = [
      grant({ consent_type_id: 1, expires_at: '2026-01-01T00:00:00Z', created_at: '2025-12-01T00:00:00Z' }),
      grant({ consent_type_id: 2, created_at: '2026-08-01T00:00:00Z' }),
    ];
    expect(
      deriveMissingRequiredConsents(TYPES, grants, new Date('2026-08-15T00:00:00Z')).map(
        (t) => t.key,
      ),
    ).toEqual(['terms_of_use']);
  });

  it('treats a declined decision as missing', () => {
    const grants = [
      grant({ consent_type_id: 1, status: 'declined', created_at: '2026-08-01T00:00:00Z' }),
      grant({ consent_type_id: 2, created_at: '2026-08-01T00:00:00Z' }),
    ];
    expect(deriveMissingRequiredConsents(TYPES, grants).map((t) => t.key)).toEqual([
      'terms_of_use',
    ]);
  });
});
