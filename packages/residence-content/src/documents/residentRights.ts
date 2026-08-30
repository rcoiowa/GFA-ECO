import type { ResidenceDocument } from '../types';

/**
 * IMPORTED VERBATIM from the published RecoveryOS document library row
 * (recoveryos.document_versions: resident_rights v2.0, published 2026-08-03)
 * so the app-rendered body matches the recorded version byte-for-byte.
 * Authoritative source: Grace House Complete Operational System v2
 * (docs/source-documents/grace-house/). Do not hand-edit the body; a content
 * change means a new version.
 */
export const residentRights: ResidenceDocument = {
  key: 'resident_rights',
  name: 'Resident Rights & Responsibilities',
  category: 'agreement',
  version: '2.0',
  summary:
    'Your rights as a resident — non-negotiable, never waivable as a condition of residency — and the responsibilities of living in community.',
  requiresSignature: true,
  narrReferences: [
    '1.C.7.c — rights posted and provided',
    '1.A.2.d — non-discrimination statement',
    '1.B.6.b — 42 CFR Part 2-aligned confidentiality',
  ],
  iowaChecklist: [
    'Item 4 — provider of choice',
    'Item 5 — faith elements by choice, never mandated',
    'Item 6 — all FDA-approved medications allowed',
  ],
  body: `GRACE HOUSE — RESIDENT RIGHTS & RESPONSIBILITIES

Grace House · Grace For Addictions · 1311 9th Street, Des Moines, Iowa 50314

Office: 515-220-8771 · Warmline: 515-310-DIAL (3425)

Source: Grace House Complete Operational System v2 (canonical).

———————————————————————————

YOUR RIGHTS

———————————————————————————

RIGHTS REGARDING DIGNITY AND PERSON

You have the right to be treated with dignity, respect, and compassion at all times.

You have the right to be addressed by your preferred name and pronouns.

You have the right to privacy in your personal communications, including phone calls, letters, and electronic messaging.

You have the right to manage your own finances, employment, and personal affairs without interference.

You have the right to keep and access your own identification documents (ID, Social Security card, birth certificate, etc.) at all times.

You have the right to receive and send personal mail without interception or inspection.

RIGHTS REGARDING RECOVERY

You have the right to pursue the recovery pathway of your choice, including Medication-Assisted Treatment (MAT), without discrimination or penalty.

You have the right to choose your own healthcare providers, counselors, and support services in the community.

You have the right to be free from pressure to affiliate with any specific religious, spiritual, or recovery ideology.

You have the right to receive medication prescribed by a licensed provider, subject to the house medication policy.

RIGHTS REGARDING RESIDENCE

You have the right to a clean, safe, and habitable living environment.

You have the right to understand all house policies before agreeing to them.

You have the right to receive advance written notice before any change in your residency status, except in cases of immediate safety concerns.

You have the right to a fair and transparent grievance process if you believe your rights have been violated or a policy has been applied unfairly.

You have the right to be free from unlawful searches of your personal belongings.

You have the right to reasonable accommodations for disability-related needs.

RIGHTS REGARDING CONFIDENTIALITY

You have the right to confidentiality of your participation in Grace House, subject only to mandatory reporting obligations under Iowa law.

You have the right to know what information about you is shared, with whom, and why.

You have the right to provide or withhold consent for release of your information to outside parties.

RIGHTS REGARDING FAIR TREATMENT

You have the right to be free from discrimination based on race, color, national origin, religion, sex, disability, familial status, or any other protected characteristic.

You have the right to be free from harassment, intimidation, or retaliation from staff or other residents.

You have the right to access community resources, legal counsel, or outside advocacy without interference.

IF YOU BELIEVE YOUR RIGHTS HAVE BEEN VIOLATED

You may file a grievance using the Grace House Grievance Procedure.

You may contact the Iowa Civil Rights Commission: 1-800-457-4416

You may contact the Iowa Protection & Advocacy Services: 1-800-779-2502

You may contact the U.S. HUD Office of Fair Housing: 1-800-669-9777

No retaliation will be taken against any resident for asserting their rights or filing a complaint.

———————————————————————————

YOUR RESPONSIBILITIES

———————————————————————————

Living in community means contributing to it. The following responsibilities are what we ask of every resident — not to control you, but because a healthy household requires everyone to show up.

FINANCIAL

Pay your weekly program fee on time. If you are experiencing financial difficulty, speak with the House Manager before your payment is due — not after.

Maintain your own financial accounts. Grace House does not control, hold, or manage residents' money.

Contribute to shared household expenses as outlined in your Participant Agreement.

HOUSEHOLD

Complete your weekly chore assignment thoroughly and on time.

Respect all common areas as shared space — not personal space.

Report maintenance issues or safety concerns to the House Manager promptly.

COMMUNITY

Treat every resident, guest, and community member with respect and dignity.

Maintain a substance-free environment. Do not bring alcohol, illegal substances, or non-prescribed medications into the house or onto the property.

Do not engage in physical, verbal, or emotional intimidation, harassment, or violence of any kind.

Honor the privacy of other residents. Do not share personal information about another resident outside the house.

Honor quiet hours to support everyone's sleep and wellbeing.

RECOVERY

Engage in your personal recovery plan. This does not prescribe a specific program, but it does require active engagement with your own growth.

Attend required house meetings and community gatherings.

Comply with drug testing requirements as outlined in the Participant Agreement.

Notify the House Manager if you are struggling or feel at risk. You will not be punished for being honest.

BEHAVIORAL

Honor your curfew unless prior approval has been granted.

Follow the visitors policy. Comply with the medication policy.

Do not engage in illegal activity inside or outside the home.

Do not remove other residents' belongings without permission.`,
};
