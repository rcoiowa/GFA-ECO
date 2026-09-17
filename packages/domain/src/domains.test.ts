import { describe, expect, it } from 'vitest';
import {
  DOMAINS,
  SUBCATEGORY_DOMAIN,
  domainForSubcategory,
  domainParticipantLabel,
  domainStaffLabel,
} from './domains';
import { NEED_CATEGORIES } from './navigation';

/**
 * P1 semantic pins (RATIFIED 2026-08-21). These tests are governance, not just
 * correctness: the canon's machine keys are permanent, Recovery and Community
 * are separate, Safety/Trauma are absent, and every live need_category key maps.
 */

describe('canonical domains (ratified v1.0)', () => {
  it('carries exactly the eleven ratified keys, in ratified order', () => {
    expect(DOMAINS.map((d) => d.key)).toEqual([
      'recovery',
      'community',
      'housing',
      'employment_purpose',
      'health',
      'family',
      'transportation',
      'education',
      'financial_stability',
      'justice',
      'other',
    ]);
  });

  it('keeps Recovery and Community as separate domains with distinct labels', () => {
    expect(domainParticipantLabel('recovery')).toBe('My recovery');
    expect(domainParticipantLabel('community')).toBe('My community');
    expect(domainStaffLabel('recovery')).toBe('Recovery');
    expect(domainStaffLabel('community')).toBe('Community');
    // The prohibited fused domain must never exist.
    expect(DOMAINS.some((d) => /recovery[_ ]?community/i.test(d.key))).toBe(false);
  });

  it('has no Safety and no Trauma domain (cross-cutting / prohibited by ratification)', () => {
    expect(DOMAINS.some((d) => d.key === 'safety' || d.key === 'trauma')).toBe(false);
  });

  it('maps every live need_category key, byte-identically, with one cross-cutting entry', () => {
    for (const c of NEED_CATEGORIES) {
      expect(SUBCATEGORY_DOMAIN).toHaveProperty(c.key);
    }
    expect(Object.keys(SUBCATEGORY_DOMAIN)).toHaveLength(NEED_CATEGORIES.length);
    expect(domainForSubcategory('identification_documents')).toBeNull();
    expect(domainForSubcategory('social_connection')).toBe('community');
    expect(domainForSubcategory('recovery_support')).toBe('recovery');
    expect(domainForSubcategory('food_basic_needs')).toBe('financial_stability');
  });

  it('label helpers never leak raw snake_case to people', () => {
    expect(domainParticipantLabel('financial_stability')).toBe('Money & basics');
    expect(domainParticipantLabel('unknown_key')).toBe('unknown key');
    expect(domainParticipantLabel(null)).toBe('');
  });
});
