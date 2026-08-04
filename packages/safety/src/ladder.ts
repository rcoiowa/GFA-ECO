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
    action: { kind: 'tel', number: '+15153103425', display: 'Call 515-310-DIAL (3425)' },
  },
  {
    key: 'gfa-office',
    title: 'Reach the Grace For Addictions office',
    description: 'Talk with the team during office hours about services, housing, or next steps.',
    action: { kind: 'tel', number: '+15152208771', display: 'Call 515-220-8771' },
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
    description: 'Free, confidential peer support by phone, any day of the week.',
    action: { kind: 'tel', number: '+18443094304', display: 'Call 844-309-4304' },
  },
  {
    key: 'crisis-988',
    title: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential crisis support 24/7. Call or text 988.',
    action: { kind: 'tel', number: '988', display: 'Call or text 988' },
  },
  {
    key: 'emergency',
    title: 'Emergency services',
    description: 'If you or someone else is in immediate danger, call 911.',
    action: { kind: 'tel', number: '911', display: 'Call 911' },
  },
];
