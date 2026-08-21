import { describe, expect, it } from 'vitest';
import { formatAppointmentTime, formatElapsed } from './time';

describe('formatAppointmentTime', () => {
  it('renders in the appointment timezone, never assuming UTC', () => {
    // 2026-08-10T15:00Z is 10:00 AM Central.
    const { day, time } = formatAppointmentTime('2026-08-10T15:00:00Z', 'America/Chicago');
    expect(day).toContain('Aug 10');
    expect(time).toBe('10:00 AM');
  });
  it('falls back to Central when the timezone is missing', () => {
    const { time } = formatAppointmentTime('2026-08-10T15:00:00Z', null);
    expect(time).toBe('10:00 AM');
  });
});

describe('formatElapsed', () => {
  const now = new Date('2026-08-08T12:00:00Z');
  it('speaks calmly at each scale', () => {
    expect(formatElapsed('2026-08-08T11:59:40Z', now)).toBe('just now');
    expect(formatElapsed('2026-08-08T11:45:00Z', now)).toBe('15 minutes ago');
    expect(formatElapsed('2026-08-08T09:00:00Z', now)).toBe('3 hours ago');
    expect(formatElapsed('2026-08-06T12:00:00Z', now)).toBe('2 days ago');
  });
});
