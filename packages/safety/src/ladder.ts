/**
 * The Support Now escalation ladder. Ordered from least to most urgent so the
 * person always sees self-regulation and human connection before crisis lines.
 * Phone numbers and org contacts are configuration, not policy — final contact
 * details require authorized review before launch (see ADR-0007).
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
    key: 'gfa-support',
    title: 'Reach Grace For Addictions support',
    description: 'Connect with the Grace For Addictions team during support hours.',
    action: { kind: 'tel', number: '+15150000000', display: 'Call Grace For Addictions' },
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
