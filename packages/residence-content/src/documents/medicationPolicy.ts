import type { ResidenceDocument } from '../types';

export const medicationPolicy: ResidenceDocument = {
  key: 'medication_policy',
  name: 'Medication Policy',
  category: 'policy',
  version: '2026.07',
  summary:
    'Safe storage and full support for prescribed medications — including explicit, unconditional welcome for MAT/MOUD.',
  requiresSignature: false,
  narrReferences: [
    '1.B.6 — nondiscrimination including medication-assisted treatment',
    '2.F.16 — safe and healthy physical environment',
  ],
  iowaChecklist: ['Medication storage policy', 'MOUD nondiscrimination'],
  body: `# Medication Policy

**Grace For Addictions — Grace House**

Medication prescribed to you is part of your healthcare, and healthcare is
part of recovery. This policy keeps medications safe in a shared home
without ever making anyone feel policed for taking care of themselves.

## Medications for addiction treatment (MAT / MOUD)

Let's say this in its own section, plainly: **methadone, buprenorphine
(Suboxone, Sublocade), naltrexone (Vivitrol), acamprosate, and every other
medication lawfully prescribed for substance use disorder are fully
welcome at Grace House.** Taking them:

- is *recovery*, not a substitute for it;
- never affects admission, residency, privileges, house standing, or how
  anyone here may speak to you;
- is treated on screening exactly like any other prescription — an
  expected result is a negative screen.

Anti-medication talk ("you're not really sober," "trading one drug for
another") is stigma, it is false, and staff will interrupt it — the same
way we'd interrupt any other disrespect of a housemate's pathway.

## Storage

- Every resident receives a **personal locking storage box** (or locker)
  for medications. Controlled substances and any medication with misuse
  potential must be stored in it. Refrigerated medications go in a
  labeled lockbox in the fridge.
- You keep your key/code. Staff hold a sealed emergency backup, used only
  with you or in a genuine emergency, and logged when used.
- Medications are never left in common areas, cars, or unlocked bags.
- Sharing, selling, or holding anyone else's medication is a serious
  safety issue handled under the safety provisions of the House
  Guidelines.

## Disclosure

At move-in (and as prescriptions change) you disclose your medications to
the house manager on the Medication Disclosure Form — names, prescriber,
and dosing schedule. Why: so screening results are interpreted fairly, so
emergency responders can be told what you take if you can't tell them
yourself, and so storage needs are met. Your medication information is
confidential per the Confidentiality & Privacy Policy.

## Self-administration

Residents administer their own medications. Staff do not dispense, adjust,
or withhold anyone's medication — we are a home, not a clinic. If you
want support remembering doses, we're glad to help you build the routine
(boxes, phone reminders, pairing with meals).

## Disposal

Expired or discontinued medications go to a pharmacy take-back — the house
manager keeps the current list of take-back locations and disposal
pouches. Nothing gets flushed, trashed loose, or left behind at move-out.

*Version 2026.07 — Grace For Addictions.*
`,
};
