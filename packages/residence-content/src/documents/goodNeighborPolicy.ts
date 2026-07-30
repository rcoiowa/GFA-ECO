import type { ResidenceDocument } from '../types';

export const goodNeighborPolicy: ResidenceDocument = {
  key: 'good_neighbor_policy',
  name: 'Good Neighbor Policy',
  category: 'policy',
  version: '2026.07',
  summary:
    'How this house shows up on its street: courtesy, a real point of contact for neighbors, and quick responses to concerns.',
  requiresSignature: false,
  narrReferences: [
    '4.J.30 — responsive neighbor relations and contact person',
    '4.J.31 — courtesy rules: parking, noise, smoking, outdoor areas',
  ],
  iowaChecklist: ['Good neighbor policy in writing'],
  body: `# Good Neighbor Policy

**Grace For Addictions — Grace House**

Every recovery residence carries a quiet extra job: showing this
neighborhood, and every neighborhood, what recovery actually looks like —
people working, mowing the lawn, waving hello. We take that job seriously,
and it starts with being genuinely good to live next to.

## Our commitments to our neighbors

- **A real person to call.** The house manager's contact information is
  provided to adjacent neighbors, who are invited to reach out with any
  concern. Concerns get a same-week response and are logged, along with
  what we did about them.
- **Property upkeep.** Lawn, snow (this is Iowa), porch, and yard are
  maintained on the house schedule — the property should be among the
  best-kept on the block, and that's residents' pride, not just policy.
- **Introductions, not surprises.** We engage with neighbors openly as
  the recovery residence we are, within residents' confidentiality — no
  one's presence here is ever confirmed to a caller or visitor.

## Everyday courtesy (residents and guests)

- **Parking:** in the driveway and directly in front of the house only —
  never blocking driveways, hydrants, or the neighbors' frontage.
  Guests park in front of the house.
- **Noise:** conversation-level outdoors after 9:00 PM; car stereos low
  on the block; house quiet hours per the House Guidelines.
- **Smoking/vaping:** designated outdoor area only, butts in the
  receptacle — never the sidewalk, never a neighbor's sightline on the
  front porch if it can be helped.
- **Gatherings:** house events keep to the yard and posted hours, and the
  house manager gives adjacent neighbors a heads-up for anything larger
  than a cookout.
- **No loitering** out front or in vehicles; waiting for rides happens
  on the porch or inside.

## When a concern comes in

1. House manager acknowledges to the neighbor within two business days
   (same day when reachable).
2. The concern is raised at the next house meeting without blame theater —
   "here's how our street experiences us."
3. What we changed gets communicated back to the neighbor.
4. Patterns go to Grace For Addictions leadership as part of quality
   review.

Being a good neighbor is not a public-relations exercise — it's practice
for the neighborly life recovery is building in each of us.

*Version 2026.07 — Grace For Addictions.*
`,
};
