/**
 * One shared date/time formatter for appointments and connection events.
 * Canonical appointments carry their own IANA timezone — always honor it and
 * show the zone label when the viewer might be elsewhere. Never assume UTC.
 */

const ZONE_LABELS: Record<string, string> = {
  'America/Chicago': 'Central',
  'America/New_York': 'Eastern',
  'America/Denver': 'Mountain',
  'America/Los_Angeles': 'Pacific',
};

export function formatAppointmentTime(
  startsAtIso: string,
  timezone: string | null | undefined,
): { day: string; time: string; zone: string } {
  const tz = timezone || 'America/Chicago';
  const date = new Date(startsAtIso);
  const day = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz,
  }).format(date);
  const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zone = viewerZone === tz ? '' : (ZONE_LABELS[tz] ?? tz.split('/').pop()?.replace('_', ' ') ?? tz);
  return { day, time, zone };
}

/** "3 minutes ago" / "2 hours ago" / "Aug 8" — calm, no countdown pressure. */
export function formatElapsed(sinceIso: string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(sinceIso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(sinceIso),
  );
}
