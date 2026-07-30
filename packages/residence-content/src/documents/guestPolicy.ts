import type { ResidenceDocument } from '../types';

export const guestPolicy: ResidenceDocument = {
  key: 'guest_policy',
  name: 'Guest & Visitor Policy',
  category: 'policy',
  version: '2026.07',
  summary:
    'Family and supporters are part of recovery — here is how visits work so they lift the house instead of unsettling it.',
  requiresSignature: false,
  narrReferences: [
    '3.I.28 — community norms that protect the recovery environment',
    '4.J.31 — courtesy toward neighbors',
  ],
  iowaChecklist: ['Written visitor policy'],
  body: `# Guest & Visitor Policy

**Grace For Addictions — Grace House**

Reconnection with family and healthy friendships is recovery capital —
we want your people here. These guidelines keep visits good for you, your
guest, your housemates, and the neighborhood.

## Visiting basics

- **Hours:** ____________ to ____________ daily (posted in the house).
- **Where:** common areas (living room, kitchen, porch, yard). Bedrooms
  are housemates' private space — no guests in sleeping areas.
- **Overnight guests:** not permitted at the residence. (Your overnights
  elsewhere use the pass system.)
- **You are the host.** Stay with your guest, and walk them out. You're
  responsible for their conduct while they're here.
- **Children** are welcome during visiting hours with their parent or
  guardian present at all times. Supporting parents in recovery matters
  to us — talk to the house manager about family visit planning,
  including quieter time slots.

## The one hard line

No guest may bring alcohol, illicit drugs, or paraphernalia onto the
property, or visit while visibly under the influence. Staff will end such
a visit politely and privately — and that's about protecting twelve
people's recovery, not about judging your guest. A guest who repeatedly
creates safety concerns may be asked not to return for a period; you'll
always be told why, and the Grievance Policy applies if you disagree.

## Privacy of housemates

Guests are entering other people's home and recovery. Introduce guests by
first name only unless a housemate offers more; what guests see or hear
about residents stays here. Photos in the house require the okay of
anyone who'd be in them.

## Professional visitors

Peer supporters, coaches, clergy, case workers, and treatment providers
may visit outside standard hours when needed — arrange with the house
manager. Landlord/maintenance visits are scheduled with notice per Iowa
landlord-tenant practice except in emergencies.

## Neighbors

Ask guests to park in front of the house (not blocking driveways), keep
porch and yard conversation at a considerate volume — especially near
quiet hours — and take smoking to the designated area. See the Good
Neighbor Policy; guests are part of how this house is known on this
street.

*Version 2026.07 — Grace For Addictions.*
`,
};
