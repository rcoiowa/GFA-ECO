import { describe, expect, it } from 'vitest';
import { circleTimeToISO } from './circleTime';
describe('Circle timezone', () => {
  it('records September 29 in Chicago even on a UTC device', () => {
    expect(circleTimeToISO('2026-09-29', '18:30', 'America/Chicago')).toBe(
      '2026-09-29T23:30:00.000Z',
    );
    expect(circleTimeToISO('2026-09-29', '19:30', 'America/Chicago')).toBe(
      '2026-09-30T00:30:00.000Z',
    );
  });
  it('uses standard time in winter', () =>
    expect(circleTimeToISO('2026-12-01', '18:30', 'America/Chicago')).toBe(
      '2026-12-02T00:30:00.000Z',
    ));
  it('rejects a nonexistent DST time', () =>
    expect(() => circleTimeToISO('2026-03-08', '02:30', 'America/Chicago')).toThrow());
});
