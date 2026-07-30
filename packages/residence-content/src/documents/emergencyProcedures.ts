import type { ResidenceDocument } from '../types';

export const emergencyProcedures: ResidenceDocument = {
  key: 'emergency_procedures',
  name: 'Emergency Procedures',
  category: 'policy',
  version: '2026.07',
  summary:
    'Fire, medical, weather, and mental-health emergencies: what to do, posted where everyone can see it.',
  requiresSignature: false,
  narrReferences: [
    '2.F.17 — smoke/CO detectors, extinguishers, egress',
    '2.F.18 — written emergency procedures',
  ],
  iowaChecklist: [
    'Fire safety: detectors, extinguishers, evacuation plan, drills',
    'Emergency numbers posted',
    'Severe weather plan',
  ],
  body: `# Emergency Procedures

**Grace For Addictions — Grace House**

Posted by the main exit, in the kitchen, and on each floor. Reviewed at a
house meeting each quarter, with a walk-through for every new resident
during move-in week — before you need it, never after.

## Every emergency

- **Call 911 first** for fire, medical emergencies, overdose, violence, or
  any immediate danger. Address: ______________________________.
- Then notify the house manager: ______________ (phone posted).
- No resident is ever penalized for calling 911. Ever.

## Fire

- Smoke detectors are in every bedroom and each level; carbon monoxide
  detectors on each level. **Tested monthly** by the house manager
  (logged). Report a chirping or damaged detector same-day.
- Fire extinguishers: kitchen and each floor (locations on the posted
  map). Use only if the fire is small and you're trained — otherwise
  **get out and stay out**.
- Evacuation: two ways out of every floor are marked on the posted map.
  Meeting point: ______________________________ (front sidewalk across
  the street unless posted otherwise). The house manager accounts for
  everyone using the resident list.
- Fire drills are held at least twice a year and logged.
- No candles, incense, or space heaters in bedrooms; smoking is outdoor
  only, in the designated area with the provided receptacle.

## Medical & overdose

Follow the Overdose Prevention & Naloxone Policy (naloxone locations on
the posted map). For other medical emergencies: 911, then first aid as
trained. First-aid kits: kitchen and upstairs bath.

## Mental-health crisis

- If you or a housemate is in crisis: stay with the person if it's safe,
  and get help — **988** (call/text, Suicide & Crisis Lifeline),
  **Your Life Iowa** (855-581-8111, text 855-895-8398), or 911 if there is
  immediate danger.
- The app's **Support Now** button reaches these same lines and the house
  support ladder from any screen.
- Asking for help in a crisis is treated exactly like reporting chest
  pain: a health event, never a rule event.

## Severe weather (Iowa)

- **Tornado warning:** everyone to ______________________ (lowest level,
  interior room away from windows). The house manager brings the weather
  radio and resident list.
- **Winter storm:** stay in; the house maintains 3 days of shelf-stable
  food and water, flashlights, and blankets (checked each October).

## Utilities

Gas smell: everyone out, no switches or flames, call MidAmerican
(800-595-5325) and 911 from outside. Water/electrical failures: house
manager, same day.

## After any emergency

Staff complete an incident report within 24 hours. The house debriefs at
the next meeting — what happened, what worked, what we change. Anyone
shaken by the event is offered support; that offer stays open, because
reactions to frightening events don't keep office hours.

*Version 2026.07 — Grace For Addictions.*
`,
};
