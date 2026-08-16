/**
 * The Support Now escalation ladder. Ordered from least to most urgent so the
 * person always sees self-regulation and human connection before crisis lines.
 *
 * GFA contacts verified from the canonical Grace House documents (they appear
 * in the contact block of every form): warmline 515-310-DIAL (3425), office
 * 515-220-8771. Never ship a placeholder number here — a person tapping one of
 * these is asking for help.
 */

export interface SupportOption {
  key: string;
  title: string;
  description: string;
  action:
    | { kind: 'route'; to: string } // relative to the hosting experience's base path
    | { kind: 'tel'; number: string; display: string }
    | { kind: 'sms'; number: string; body?: string; display: string };
}

/**
 * Canonical GFA human-contact points — INTERNAL, GFA-owned numbers (verified
 * from the canonical Grace House documents; they appear in the contact block
 * of every form). Every surface that shows a GFA phone number — the ladder,
 * public pages, footers — must read from here so a number correction lands
 * everywhere at once.
 */
export const GFA_CONTACTS = {
  warmline: { number: '+15153103425', display: '515-310-DIAL (3425)' },
  office: { number: '+15152208771', display: '515-220-8771' },
} as const;

/**
 * EXTERNALLY GOVERNED crisis/support contacts. GFA does not own these
 * numbers, so they can drift without any change in this repository: they
 * require periodic re-verification against their authoritative sources
 * (at minimum at every launch-readiness review). The unit tests that pin
 * these values prove only what we ship — never that the external number is
 * still current.
 *
 * Provenance:
 * - iowaWarmLine — source: Your Life Iowa (official Iowa crisis-services
 *   source), verified 2026-08-15: 844-775-9276, available 24/7, can connect
 *   callers with a Peer Support Specialist. (Replaced drifted 844-309-4304.)
 * - crisis988 — 988 Suicide & Crisis Lifeline (national).
 * - emergency — 911 (national).
 */
export const EXTERNAL_SUPPORT_CONTACTS = {
  iowaWarmLine: { number: '+18447759276', display: '844-775-9276' },
  crisis988: { number: '988', display: '988' },
  emergency: { number: '911', display: '911' },
} as const;

export const SUPPORT_LADDER: SupportOption[] = [
  {
    key: 'grounding',
    title: 'Take a grounding moment',
    description: 'A short breathing and grounding exercise you can do right now, wherever you are.',
    action: { kind: 'route', to: 'support/grounding' },
  },
  {
    key: 'gfa-warmline',
    title: 'Call the Grace warmline',
    description: 'A real person who understands recovery — no crisis required, just call.',
    action: {
      kind: 'tel',
      number: GFA_CONTACTS.warmline.number,
      display: `Call ${GFA_CONTACTS.warmline.display}`,
    },
  },
  {
    key: 'gfa-office',
    title: 'Reach the Grace For Addictions office',
    description: 'Talk with the team during office hours about services, housing, or next steps.',
    action: {
      kind: 'tel',
      number: GFA_CONTACTS.office.number,
      display: `Call ${GFA_CONTACTS.office.display}`,
    },
  },
  {
    key: 'my-team',
    title: 'Message your support team',
    description: 'Reach out to your coach, navigator, or a peer who knows you.',
    action: { kind: 'route', to: 'connect' },
  },
  {
    key: 'warmline',
    title: 'Iowa Warm Line',
    description:
      'Support is available 24/7. Warm Line staff can also connect you with a Peer Support Specialist.',
    action: {
      kind: 'tel',
      number: EXTERNAL_SUPPORT_CONTACTS.iowaWarmLine.number,
      display: `Call ${EXTERNAL_SUPPORT_CONTACTS.iowaWarmLine.display}`,
    },
  },
  {
    key: 'crisis-988',
    title: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential crisis support 24/7. Call or text 988.',
    action: {
      kind: 'tel',
      number: EXTERNAL_SUPPORT_CONTACTS.crisis988.number,
      display: 'Call or text 988',
    },
  },
  {
    key: 'emergency',
    title: 'Emergency services',
    description: 'If you or someone else is in immediate danger, call 911.',
    action: {
      kind: 'tel',
      number: EXTERNAL_SUPPORT_CONTACTS.emergency.number,
      display: 'Call 911',
    },
  },
];

/**
 * The anonymous/public Support Now hierarchy. Unlike the in-app ladder (a
 * coping ladder ordered least → most urgent), the public surface is a triage
 * page: the person answers "which of these am I?" from most to least acute —
 * emergency, then crisis, then connecting with GFA's human support. Every
 * option is a deterministic phone action reachable without an account, and
 * nothing here touches Grace AI or any backend.
 */
export interface PublicSupportGroup {
  key: 'emergency' | 'crisis' | 'gfa';
  title: string;
  lede: string;
  options: SupportOption[];
}

function ladderOption(key: string): SupportOption {
  const option = SUPPORT_LADDER.find((entry) => entry.key === key);
  if (!option) throw new Error(`Support ladder option missing: ${key}`);
  return option;
}

export const PUBLIC_SUPPORT_GROUPS: PublicSupportGroup[] = [
  {
    key: 'emergency',
    title: 'In immediate danger?',
    lede: 'Emergency services respond right now, day or night.',
    options: [ladderOption('emergency')],
  },
  {
    key: 'crisis',
    title: 'Need crisis support right now?',
    lede: 'Free, confidential crisis and peer lines — no account, no cost, no judgment.',
    options: [ladderOption('crisis-988'), ladderOption('warmline')],
  },
  {
    key: 'gfa',
    title: 'Want to connect with Grace For Addictions?',
    lede: 'Real people who understand recovery. Not an emergency or 24/7 crisis service — for that, use the options above.',
    options: [ladderOption('gfa-warmline'), ladderOption('gfa-office')],
  },
];
