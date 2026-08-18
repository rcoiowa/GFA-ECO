import { describe, expect, it } from 'vitest';
import {
  EXTERNAL_SUPPORT_CONTACTS,
  GFA_CONTACTS,
  PUBLIC_SUPPORT_GROUPS,
  SUPPORT_LADDER,
} from '@recoveryos/safety';

/**
 * Safety-contact drift guard. These assertions pin the numbers we SHIP; they
 * cannot prove an externally governed number is still current — external
 * safety contacts (Iowa Warm Line, 988, 911) require periodic human
 * re-verification against their authoritative sources (see the provenance
 * notes in packages/safety/src/ladder.ts and
 * docs/product/support-contact-provenance.md).
 *
 * Iowa Warm Line: 844-775-9276 — source: Your Life Iowa, verified 2026-08-15.
 * The prior value 844-309-4304 was confirmed drift and must never return.
 */

const telNumbers = (options: { action: { kind: string; number?: string } }[]) =>
  options.map((o) => (o.action.kind === 'tel' ? o.action.number : null)).filter(Boolean);

describe('canonical support contacts', () => {
  it('Iowa Warm Line uses the verified Your Life Iowa number', () => {
    expect(EXTERNAL_SUPPORT_CONTACTS.iowaWarmLine).toEqual({
      number: '+18447759276',
      display: '844-775-9276',
    });
    const entry = SUPPORT_LADDER.find((o) => o.key === 'warmline')!;
    expect(entry.action).toEqual({
      kind: 'tel',
      number: '+18447759276',
      display: 'Call 844-775-9276',
    });
  });

  it('Iowa Warm Line copy claims only what the source supports (24/7, peer-specialist connection)', () => {
    const entry = SUPPORT_LADDER.find((o) => o.key === 'warmline')!;
    expect(entry.description).toBe(
      'Support is available 24/7. Warm Line staff can also connect you with a Peer Support Specialist.',
    );
  });

  it('the drifted 844-309-4304 number appears nowhere in the ladder or public groups', () => {
    const everything = JSON.stringify({ SUPPORT_LADDER, PUBLIC_SUPPORT_GROUPS, GFA_CONTACTS });
    expect(everything).not.toMatch(/8443094304|844-309-4304/);
  });

  it('988, 911, and the GFA-owned contacts are unchanged', () => {
    expect(EXTERNAL_SUPPORT_CONTACTS.crisis988.number).toBe('988');
    expect(EXTERNAL_SUPPORT_CONTACTS.emergency.number).toBe('911');
    expect(GFA_CONTACTS.warmline.number).toBe('+15153103425');
    expect(GFA_CONTACTS.office.number).toBe('+15152208771');
    const ladderTels = telNumbers(SUPPORT_LADDER);
    for (const number of ['988', '911', '+15153103425', '+15152208771', '+18447759276']) {
      expect(ladderTels).toContain(number);
    }
  });

  it('the public groups carry the corrected Iowa Warm Line in the crisis tier', () => {
    const crisis = PUBLIC_SUPPORT_GROUPS.find((g) => g.key === 'crisis')!;
    expect(telNumbers(crisis.options)).toEqual(['988', '+18447759276']);
  });
});
