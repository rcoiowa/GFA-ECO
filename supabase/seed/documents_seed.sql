-- GENERATED FILE — do not edit.
-- Source: packages/residence-content (pnpm generate:residence-docs).
-- Idempotent: safe to re-run; re-publishing an existing version updates
-- its body only if the version string was bumped (bodies are immutable
-- per version by design — bump the version to change a document).
set search_path = recoveryos, public;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'resident_agreement', 'Resident Agreement', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Resident Agreement

**Grace For Addictions — Grace House**

Welcome home. This agreement explains what living at Grace House involves —
what you can count on from us, and what we ask of you. We go through it
together, out loud, before you sign. Nothing in it is meant to surprise you
later; if anything is unclear, ask, and keep asking until it is clear.

You are a person in recovery, not a case number. This is your home while you
live here, and this agreement exists to keep it safe, stable, and worth
coming home to — for you and for every housemate.

## 1. What you can count on from us

- A safe, substance-free home that meets NARR 3.0 standards and Iowa HHS
  recovery housing requirements.
- Your rights, in writing, honored every day (see the *Resident Rights &
  Responsibilities* statement, which is part of this agreement).
- Clear expectations with the reasons behind them — never rules for rules'
  sake.
- Staff and house leadership who are trained, supervised, accountable to a
  code of ethics, and required to treat you with dignity.
- Support for your recovery pathway, whatever it looks like — including
  prescribed medications for addiction treatment. You will never be turned
  away, judged, or treated differently here because your recovery includes
  medication.
- Due process: no one is asked to leave this residence without the steps
  described in the *Transition & Move-Out Policy*, except where immediate
  safety requires action first — and even then, we help you land somewhere
  safe.

## 2. What we ask of you

- **Live substance-free.** Grace House is an alcohol-free and
  illicit-drug-free home. This protects the recovery of every person who
  lives here, including you on your hardest day.
- **Participate in the screening program** described in the *Screening
  Policy* you sign with this agreement. Screening is a safety practice, not
  a suspicion practice — everyone participates, including on random
  schedules.
- **Be honest about a return to use.** Telling us is an act of courage, not
  a confession. Our response is described in the *Return-to-Use Support
  Policy*: safety first, support next, shame never.
- **Keep your commitments to the house**: your responsibilities (chores),
  curfew, house meetings, and the *House Guidelines*.
- **Pay your program fee** as described in the *Fee Schedule & Refund
  Policy*. If money gets hard, tell us early — we would always rather make
  a plan with you than a problem for you.
- **Work your recovery.** Within 30 days of move-in you and your recovery
  support person will build a person-centered recovery plan — your goals,
  your pathway, your pace — including, from the start, a picture of where
  you're headed after Grace House (your transition plan). The plan belongs
  to you.
- **Treat every person in this home with respect.** No violence, no threats,
  no intimidation, no harassment — ever.

## 3. Why the structure exists

Early recovery is a time when the brain is healing. Predictable routines,
real sleep, shared meals, and a home where you know what to expect are not
just "rules" — they are the conditions healing brains need. Cravings,
irritability, and hard days are expected parts of that healing, not
character flaws. The structure in this agreement exists to carry you through
those days, not to catch you failing.

## 4. When an agreement isn't kept

People are human. When a commitment in this agreement isn't kept, our
response follows the grace-based process in the *House Guidelines*: we start
with a conversation, we look for what's underneath, we agree on a
restorative step, and we write down what we agreed so it's fair. Immediate
safety issues (violence, threats, substances in the home) are handled under
the *Return-to-Use Support Policy* and *Transition & Move-Out Policy*, which
you receive with this agreement.

## 5. The documents that travel with this agreement

This agreement incorporates, and you receive copies of:

1. Resident Rights & Responsibilities
2. House Guidelines
3. Fee Schedule & Refund Policy
4. Screening Policy & Consent
5. Return-to-Use Support Policy
6. Medication Policy
7. Overdose Prevention & Naloxone Policy
8. Emergency Procedures
9. Guest & Visitor Policy
10. Good Neighbor Policy
11. Confidentiality & Privacy Policy
12. Personal Property & Move-In Inventory Policy
13. Transition & Move-Out Policy
14. Grievance Policy

## 6. Residence details

| | |
| --- | --- |
| Residence | Grace House, Des Moines, Iowa |
| Support level | NARR Level II (monitored) |
| House leadership | House manager and senior residents, supported by Grace For Addictions staff |
| Move-in date | ______________________ |
| Weekly program fee | $ ____________ (per the Fee Schedule you received before signing) |

## 7. Signatures

I received, reviewed, and had the chance to ask questions about this
agreement and every document listed in Section 5 — including the fee
schedule and refund policy — **before** signing.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Printed name | ______________________ |
| House manager / staff signature | ______________________ Date ________ |

*A signed copy is yours to keep. Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'resident_agreement'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'resident_rights', 'Resident Rights & Responsibilities', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Resident Rights & Responsibilities

**Grace For Addictions — Grace House**

These rights are yours from the day you move in. They are not earned, and
they cannot be taken away as a consequence. They are posted in the home,
included in your move-in packet, and honored by every member of staff and
house leadership.

## Your rights

1. **Dignity.** To be treated with respect and worth — always, by everyone,
   including on your hardest days.
2. **Person-first care.** To be spoken to and about as a person in recovery,
   never by a label. Language like "addict," "junkie," "clean," or "dirty"
   has no place here, in conversation or in your records.
3. **A safe home.** An alcohol-free, illicit-drug-free residence that meets
   safety codes, with working smoke and carbon monoxide detectors, fire
   extinguishers, clear exits, and naloxone on site.
4. **Nondiscrimination.** To live here without discrimination based on
   race, color, religion, national origin, sex, sexual orientation, gender
   identity, age, disability, criminal-legal history, or the pathway of
   your recovery — explicitly including prescribed medication for opioid or
   alcohol use disorder.
5. **Your recovery pathway.** To pursue the recovery pathway that works for
   you: 12-step, faith-based, secular, medication-supported, or any
   combination. We support pathways; we don't rank them.
6. **Privacy.** Reasonable privacy in your living space, in your mail, and
   in your personal affairs. Any search or screening happens under written
   policy, with you present wherever possible, and never as theater.
7. **Confidentiality.** Your information is protected under our
   Confidentiality & Privacy Policy and applicable law. Who we can tell
   what — and when — is in writing, and sharing beyond that requires your
   written consent, which you may revoke.
8. **Your money and your benefits.** No one here will ever require you to
   sign over a paycheck, public benefit, or tax refund. Fees are disclosed
   in writing before you sign anything.
9. **Voice.** To raise concerns, propose changes at house meetings, and
   participate in how this home is run — and to file a grievance without
   any fear of retaliation, with a path that goes beyond this residence if
   you're not satisfied.
10. **Communication.** To reasonable access to your phone, your mail, your
    supports, your clergy, your attorney, and your treatment providers.
11. **Due process.** To know the house expectations in advance, to be heard
    before decisions are made about your residency, and to a transition
    process that never puts you on the street without a plan when it can
    possibly be avoided.
12. **Help in an emergency.** To immediate help — 911, the 988 Suicide &
    Crisis Lifeline, naloxone, staff support — without fear that asking for
    help in a crisis will itself be treated as a failure.

## Your responsibilities

Living in community means each of us holds up part of the roof:

1. Keep this home substance-free, and honor the Screening Policy.
2. Treat every housemate, staff member, guest, and neighbor with respect —
   no violence, threats, harassment, or intimidation.
3. Keep your commitments: chores, curfew, house meetings, and fees.
4. Respect your housemates' privacy, property, and recovery.
5. Be honest — especially when it's hard. This house runs on trust.
6. Speak up when something isn't safe. Silence protects no one.

## If a right isn't honored

Tell anyone you trust here: the house manager, any staff member, or through
the grievance process (in your packet and posted in the home). Filing a
grievance can never be held against you. If we don't make it right, the
grievance policy lists the outside bodies you can contact, including our
certifying affiliate and Iowa HHS.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Printed name | ______________________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'resident_rights'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'house_guidelines', 'House Guidelines', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# House Guidelines

**Grace For Addictions — Grace House**

These guidelines are how we live well together. Every one of them exists
for a reason, and the reason is written next to it — because expectations
you understand are expectations you can keep. Residents help shape these
guidelines at house meetings; this is your house too.

## The heart of it

One commitment sits under everything else: **we protect each other's
recovery.** A healing brain does best with routine, rest, honesty, and a
home where nothing dangerous is waiting in a drawer. Every guideline below
is that one commitment wearing work clothes.

## Daily life

- **Substance-free home.** No alcohol, illicit drugs, or misused
  medications anywhere on the property — bedrooms, vehicles, or grounds.
  This includes items that make the house unsafe for others: open
  containers, paraphernalia, and unsecured medications. *Why: one
  unprotected moment can cost a housemate everything.*
- **Prescribed medications** are yours to take as prescribed, stored per
  the Medication Policy (secured storage is provided). MAT/MOUD
  prescriptions are fully welcome here.
- **Chores.** Everyone carries a share of the housework, posted weekly on
  the chore schedule. Trade with a housemate when you need to — just make
  sure it's covered. *Why: shared work is shared ownership; this is a home,
  not a facility.*
- **Quiet hours** are 10:00 PM – 6:00 AM Sunday–Thursday, and
  11:00 PM – 7:00 AM Friday–Saturday. *Why: sleep is recovery
  infrastructure. Healing brains need it like lungs need air.*
- **Curfew** is posted for each day of the week in the house and in the
  app. Need an exception (work shift, family need, appointment)? Request a
  pass — the process is quick and requests are honored whenever safety
  allows. *Why: curfew isn't surveillance; it's how a house full of people
  who care about you knows you're safe.*
- **Overnights away** use the pass system with advance approval. *Why: an
  unexplained empty bed at 2 AM means housemates lie awake worrying, and
  it means we can't tell worry from emergency.*
- **Meals and kitchen.** The kitchen is yours. Clean as you go, label your
  food, and respect what isn't yours. Shared meals are encouraged —
  connection is protective.
- **Smoking/vaping** only in the designated outdoor area, never inside.
  Please be mindful of neighbors (see the Good Neighbor Policy).

## Weekly rhythm

- **House meeting** every week (day/time posted). Attendance is expected —
  this is where the house is actually run: schedules, concerns, proposals,
  and celebrating wins. Your voice matters here.
- **Recovery activity.** As a NARR Level II home, each resident maintains
  regular participation in the recovery supports in their plan — meetings,
  coaching, counseling, faith community, or another pathway. You choose
  the pathway; we help you protect the habit.

## Guests

Guests are welcome within the Guest & Visitor Policy: common areas only,
posted visiting hours, no overnight guests, and never anyone actively
using substances. You are the host and the responsible party for your
guest.

## When something slips

People slip on commitments — that's being human, not being bad. Our
process, every time:

1. **A conversation, not a citation.** The house manager (or a senior
   resident) talks with you privately: what happened, and what's
   underneath it? Tired? Overwhelmed? Something bigger?
2. **A restorative step, agreed together.** Make it right in a way that
   fits: cover the missed chore, adjust a schedule, add a support. The
   goal is repair, not penance.
3. **Written and fair.** What we agreed is written down and shared with
   you, so nothing depends on memory or mood.
4. **A pattern gets a plan.** If the same commitment keeps slipping, we
   build a support plan together — because a repeating slip usually means
   something needs support, not louder consequences.

Safety issues — violence, threats, substances in the home — follow the
Return-to-Use Support Policy and Transition & Move-Out Policy instead,
because those exist to protect everyone, including you.

## Signature

I've reviewed these guidelines, had my questions answered, and I'm in.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions. Residents propose changes at any
house meeting; updates are re-signed by everyone.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'house_guidelines'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'fee_schedule_refund_policy', 'Fee Schedule & Refund Policy', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Fee Schedule & Refund Policy

**Grace For Addictions — Grace House**

Money stress is recovery stress, so we keep this simple and honest: every
cost is on this page, you see it **before** you sign anything, and there
are no fees that aren't written here.

## Fee schedule

| Item | Amount | When |
| --- | --- | --- |
| Program fee (covers your bed, utilities, and house supplies) | $ ________ / week | Due each ________ |
| Move-in deposit (refundable — see below) | $ ________ | At move-in |
| Late payment fee | None. We make payment plans, not penalties. | — |
| Application fee | None | — |
| Screening costs | Covered by the residence | — |

- Fees are payable by ____________________ (methods).
- Receipts are provided for every payment, every time, and your payment
  history is available to you on request and in the app.
- **We will never require you to sign over a paycheck, public benefit
  (SNAP, SSI, SSDI, FIP), or tax refund, or to surrender control of your
  money as a condition of living here.**

## If money gets hard

Tell the house manager **before** the due date if you can. Job loss, cut
hours, or a family emergency will be met with a payment plan conversation,
not a move-out notice. Nonpayment alone never results in a same-day exit,
and any residency decision related to fees follows the full due-process
steps in the Transition & Move-Out Policy.

## Refund policy

- **Move-in deposit:** refunded within 14 days of move-out, minus only
  documented costs for damage beyond normal wear (itemized in writing) or
  unpaid fees you've agreed are owed.
- **Program fees:** charged only for time in residence. If you move out
  mid-week — for any reason, including an involuntary transition — the
  unused portion of any fee paid in advance is refunded on a per-day
  basis within 14 days.
- If you disagree with any charge or withholding, the Grievance Policy
  applies, and disputed amounts are documented in writing.

## Our accounting commitments to you

- Your payments are recorded in the organization's accounting system the
  day they're received.
- Resident funds are never commingled with anyone's personal money.
- A full statement of your account is available to you at any time within
  two business days of asking.

## Acknowledgment

I received this fee schedule and refund policy, reviewed it, and had my
questions answered **before** signing my Resident Agreement.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'fee_schedule_refund_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'screening_policy', 'Screening Policy & Consent', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Screening Policy & Consent

**Grace For Addictions — Grace House**

Screening is how a substance-free house stays substance-free — it protects
your recovery from other people's hard days and their recovery from yours.
It is a safety practice that applies to everyone equally. It is never a
punishment, never a suspicion ritual, and never done to shame anyone.

## How screening works

- **Who:** every resident, without exception. House leadership in
  residence screen on the same basis as everyone else.
- **When:** on a random schedule (typically ___ times per month), at
  move-in, on return from an extended absence, and when there is a
  specific, articulable safety concern — which is explained to you at the
  time.
- **What:** urine screening and/or breath testing for alcohol. The current
  panel is listed on the posted screening schedule. Costs are covered by
  the residence.
- **How:** administered privately by trained staff of the same gender
  wherever possible, in a bathroom with the door closed except where
  observation is specifically required, and never in front of other
  residents. Results are recorded in your file, shared only per the
  Confidentiality & Privacy Policy.

We say "positive" and "negative" — not "dirty" or "clean." Language
matters here, including on paperwork.

## Prescribed medications

Tell us about prescriptions (including MAT/MOUD) at move-in and as they
change, so an expected result is never treated as an unexpected one.
A screening result consistent with your prescription is a **negative**
screen, full stop. See the Medication Policy.

## If a screen comes back positive

A positive screen starts the *Return-to-Use Support Policy* — a safety and
support process, not a court proceeding. In short:

1. You will be told the result privately, the same day it's known.
2. You may say the result is wrong. A confirmation retest (lab
   confirmation where available) is your right, at the residence's cost,
   and no residency decision is finalized while confirmation is pending —
   only interim safety steps.
3. If the result stands, we follow the Return-to-Use Support Policy:
   immediate safety for you and the house, a support conversation, and a
   plan — which may include re-engagement with treatment, a higher level
   of care, or, when the house's safety requires it, a supported
   transition under the Transition & Move-Out Policy.

Refusing a screen without a documented medical or trauma-related reason is
treated as a safety concern and handled through the same conversation-first
process. If a form of screening is hard for you for trauma-related
reasons, tell us — we will find an accommodation (different observer,
different method) that keeps both your dignity and the house's safety.

## Consent

I consent to the screening program described above as a condition of
living in this substance-free residence. I understand how results are
used, my right to confirmation testing, and how my information is
protected.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Prescriptions disclosed (or "none") | ______________________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'screening_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'grievance_policy', 'Grievance Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Grievance Policy

**Grace For Addictions — Grace House**

If something here isn't right — a rights concern, a safety issue, a
conflict with staff or a housemate, a billing dispute, anything — you are
entitled to raise it and to get a real answer. Raising a concern is a
contribution to this house, not a betrayal of it.

## The promise that makes this work

**No retaliation. Ever.** Filing a grievance — or helping a housemate file
one — can never affect your residency, your fees, your privileges, your
screening schedule, or how any person here treats you. Retaliation by
staff or leadership is grounds for their discipline or removal.

## How to raise a concern

**Step 0 — Just talk to us (optional).** Most things resolve with a direct
conversation with the house manager. This step is always optional — you
may go straight to a formal grievance, especially if your concern *is*
the house manager.

**Step 1 — File the grievance.** Any of these ways:

- The grievance form (paper copies posted in the house, or the Documents
  area of the app),
- A written note handed to any staff member, or
- Spoken to any staff member, who must write it down with you and give
  you a copy.

If your concern involves the house manager, file directly with the Grace
For Addictions program director at ______________________.

**Step 2 — Acknowledgment within 2 days.** You receive written
confirmation of who is handling your grievance within two business days.

**Step 3 — Response within 7 days.** The responsible person meets with
you, looks into the concern, and gives you a written decision within
seven business days. You may bring a support person to any meeting.

**Step 4 — Appeal within 7 more days.** Not satisfied? Appeal in writing
to the Grace For Addictions executive director, who responds in writing
within seven business days of receiving the appeal.

## If we still get it wrong

You always have the right to take a concern outside this organization:

- **Iowa Alliance of Recovery Residences / NARR affiliate** (our
  certifying body): contact information posted in the house.
- **Iowa Department of Health and Human Services** — Recovery Housing
  program: hhs.iowa.gov.
- Concerns about discrimination may also go to the **Iowa Civil Rights
  Commission** or **HUD** (housing discrimination), and nothing in this
  policy limits any legal right you have.

## Recordkeeping

Every grievance and its resolution is logged (kept confidential, separate
from your resident file where possible) and reviewed quarterly by
leadership as part of continuous quality improvement — because a pattern
of grievances is data about us, not about you.

*Version 2026.07 — Grace For Addictions. Posted in the home and provided
at move-in.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'grievance_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'return_to_use_policy', 'Return-to-Use Support Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Return-to-Use Support Policy

**Grace For Addictions — Grace House**

A return to use is a medical and human event in a chronic condition — the
brain's old survival pathway firing under load. It is dangerous, it is
serious, and it is *never* treated here as a moral failure or met with
humiliation. This policy exists so that on the worst day, everyone —
including you — already knows what happens next: safety, honesty, support,
and a plan.

## If you tell us yourself

Coming forward is the single most courageous, most protective thing you
can do, and this house will treat it that way.

1. **Safety first.** Are you medically at risk right now? Opioid use after
   a period of abstinence carries a high overdose risk because tolerance
   drops fast. We will get medical help when needed — naloxone is on site
   and calling 911 is never the wrong call.
2. **Stabilize.** You won't sleep unmonitored in a room alone on night
   one if there's any medical concern. We arrange the safe place —
   whether that's here with supports, with family, or at a higher level
   of care — *with* you.
3. **Support conversation, within 24–48 hours.** What happened, what was
   underneath it, and what needs to change in the plan: treatment
   re-engagement, medication evaluation (including starting or adjusting
   MAT), meeting schedule, coaching, stress or grief support.
4. **Residency decision, made honestly.** Many residents continue living
   here after a return to use, with an updated plan. When the safety of
   the house requires time away (for example, ongoing active use), the
   Transition & Move-Out Policy applies — with its guarantee that we do
   not discharge a person to the street, and its explicit welcome-back
   pathway.

## If the house learns another way

(A positive screen, staff observation, or a housemate's report.) The same
four steps apply. The conversation begins with what we know and gives you
the full chance to respond. Honesty at that point still counts — it is
never "too late" to be honest here.

## What this policy promises every resident

- **No street discharges.** If a transition is needed, we work the safe
  landing first: a treatment bed, a detox admission, family, another
  residence, or shelter coordination — documented every time.
- **Belongings and money are protected** per the Personal Property Policy
  and Fee Schedule & Refund Policy (unused prepaid fees are refunded).
- **The door stays open.** A return to use is not a lifetime ban. A
  resident who transitions out for safety reasons is told, in writing,
  what re-application looks like — typically re-stabilization plus a
  conversation, not a waiting list of shame.
- **The house heals too.** A return to use in the home shakes everyone.
  The next house meeting makes space for it (without details that belong
  to the person), and any resident can ask for extra support that week.

## Housemates' part

If you believe a housemate has returned to use, telling the house manager
is protection, not betrayal — overdose deaths happen in silence. You will
never be asked to screen, search, or police another resident; that is
staff's job, done under policy.

*Version 2026.07 — Grace For Addictions. Provided at move-in and reviewed
at least annually with residents.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'return_to_use_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'medication_policy', 'Medication Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Medication Policy

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
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'medication_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'overdose_prevention_policy', 'Overdose Prevention & Naloxone Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Overdose Prevention & Naloxone Policy

**Grace For Addictions — Grace House**

Overdose is the emergency this house is most determined never to lose
anyone to. Tolerance drops quickly during abstinence, and the current drug
supply is contaminated with fentanyl — which means a return to use, for
anyone, anywhere, carries real overdose risk. We prepare for it the way
homes prepare for fire: openly, with equipment and practice, hoping never
to need either.

## Naloxone (Narcan)

- Naloxone is stored at these locations, marked with signage:
  **kitchen first-aid station** and **upstairs hallway station**
  (locations posted on the emergency map by the main exit).
- It is checked monthly (expiration and stock) by the house manager;
  checks are logged.
- Every staff member and house leader is trained in overdose recognition
  and naloxone administration. Every resident is offered the same
  training within two weeks of move-in — take it; the life you save will
  be someone you know.
- Iowa's naloxone standing order allows anyone to carry naloxone.
  Residents are encouraged to keep their own kit; we'll help you get one
  at no cost through state programs.

## Recognizing an opioid overdose

Unresponsive or hard to wake • slow, shallow, or stopped breathing •
blue/gray lips or fingertips • gurgling or snoring sounds • pinpoint
pupils. **When unsure, treat it as an overdose. Naloxone cannot harm
someone who isn't overdosing.**

## Response — in order

1. **Call 911.** Say "suspected overdose, not breathing" and the address.
2. **Give naloxone.** One spray in one nostril. No response after 2–3
   minutes? Give a second dose.
3. **Rescue breathing / CPR** as trained, until breathing returns or help
   arrives.
4. **Recovery position** (on their side) if they're breathing.
5. **Stay.** Naloxone wears off before many opioids do — the person must
   go with EMS or be monitored.
6. **Afterwards:** staff complete an incident report, and everyone
   involved — including the person who overdosed — is offered support,
   not scrutiny. Witnessing an overdose is traumatic; debriefs happen
   within 48 hours.

## The promise

**No one at Grace House will ever face a house consequence for calling
911, giving naloxone, or reporting an overdose — including a resident who
was using at the time they saved someone.** Iowa's Good Samaritan
overdose law provides related legal protections; this house's protection
is broader and unconditional. Any return-to-use concern for a helper is
handled afterward, separately, under the Return-to-Use Support Policy —
which starts with gratitude for the life they helped save.

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'overdose_prevention_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'emergency_procedures', 'Emergency Procedures', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Emergency Procedures

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
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'emergency_procedures'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'guest_policy', 'Guest & Visitor Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Guest & Visitor Policy

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
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'guest_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'good_neighbor_policy', 'Good Neighbor Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Good Neighbor Policy

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
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'good_neighbor_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'confidentiality_policy', 'Confidentiality & Privacy Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Confidentiality & Privacy Policy

**Grace For Addictions — Grace House**

Trust is load-bearing in this house. You cannot heal in a place where you
have to guard your own story, so this policy makes the walls around your
information explicit — including exactly where the doors are.

## The default: your story is yours

- Your presence here is confidential. Callers and visitors are told
  "I can't confirm whether anyone by that name lives here" — including
  family, employers, and officials without legal process.
- Your records (residency, screening results, medications, grievances,
  recovery plan) are kept in RecoveryOS with access limited to staff who
  need them for their role. Every access is logged and auditable.
- Substance use disorder records receive the heightened protection of
  42 CFR Part 2 where it applies: they may not be shared — even with
  other health providers — without your specific written consent, and
  redisclosure without consent is prohibited.
- Housemates' obligation: what you see and hear in this house about
  another resident's recovery stays here. Breaking a housemate's
  confidence is a serious community harm, handled as such.

## Sharing with your consent

Any sharing beyond house operations happens through a signed **Release of
Information** — specific about *who*, *what*, and *until when*. You can
revoke any release at any time, in writing, with effect going forward.
Declining a release never affects your residency or services. Common
examples: coordination with your treatment provider, updates to a family
member, verification for probation/parole, referrals.

## The exceptions — all of them

We share the minimum necessary information without consent only when:

1. **Someone is in immediate danger** — medical emergencies (responders
   are told what they need, e.g., medications), or a credible threat of
   serious harm to you or another person.
2. **The law requires it** — mandatory reports of child or dependent
   adult abuse (Iowa Code chs. 232 & 235B), a valid court order (for
   Part 2 records, only a compliant order), or public-health reporting.
3. **De-identified program data** — counts and outcomes with identity
   removed, used for program improvement and funder reporting. Your
   consent choices in the app control anything beyond that.

If an exception is ever used, you are told what was shared, with whom,
and why — as soon as safety allows.

## Your access

You may read your own file and receive a copy within five business days
of asking. If something in it is wrong, you may correct it or attach a
statement of disagreement. Records are retained per organizational
policy and destroyed securely.

## If privacy is breached

Report it through the Grievance Policy — or straight to the program
director. Breaches by staff are discipline matters; we tell you what
happened, what we did, and what changes.

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'confidentiality_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'property_policy', 'Personal Property & Move-In Inventory Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Personal Property & Move-In Inventory Policy

**Grace For Addictions — Grace House**

For many people arriving in recovery housing, what fits in two bags is
everything they own. This house treats your property with the respect
that fact deserves.

## At move-in

- You and a staff member complete the **Move-In Inventory Form** together:
  significant belongings, condition of your room and furnishings, and
  anything valuable you want documented. You both sign; you keep a copy.
- Valuables can be listed for extra documentation (photos welcome). The
  residence provides your locking medication box; a small lockable space
  for personal valuables is available on request.
- The residence furnishes your bed, mattress, and dresser — their
  condition is on the form so move-out is fair in both directions.

## While you live here

- Housemates' property is off-limits without their explicit okay —
  borrowing without asking is taking, and it breaks trust the house
  cannot spare.
- The residence is not liable for loss of unlisted valuables; renter's
  insurance is inexpensive, and staff can help you set it up.
- **Room entry:** staff enter your room only (1) with you, (2) with your
  advance knowledge for scheduled maintenance/inspection (posted 24
  hours ahead), or (3) for a genuine, articulable safety emergency —
  which is documented and explained to you afterward. Searches follow
  the Screening Policy's dignity commitments: with you present wherever
  possible, never as spectacle.

## At move-out

- The inventory is walked again together; the deposit disposition follows
  the Fee Schedule & Refund Policy (itemized, in writing, within 14
  days).

## If you leave suddenly

Recovery housing sees sudden departures — a crisis, a return to use, a
transition that happened fast. Here is our promise about what you left
behind:

- Belongings are **packed respectfully by two people together**,
  inventoried, and stored securely for **at least 60 days**.
- We contact you (and your emergency contact if we can't reach you) with
  how to retrieve them — no gauntlet, no conditions, no "come to a
  meeting first." Retrieval can be by a person you authorize in writing.
- Prescription medications left behind are stored securely and released
  to you or your pharmacy; abandoned controlled substances past the
  holding period go to pharmacy take-back, documented.
- After 60 days and documented contact attempts, unclaimed items may be
  donated; anything of obvious personal significance (IDs, documents,
  photos, keepsakes) is held longer — we do not throw away someone's
  photographs of their kids.

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'property_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'transition_policy', 'Transition & Move-Out Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Transition & Move-Out Policy

**Grace For Addictions — Grace House**

Everyone who moves in will someday move out — the whole point of this
house is a life that outgrows it. This policy covers every way that
happens, because how a residency ends shapes how the next chapter starts.

## Planned transition (the goal)

From your first month, your recovery plan includes a transition picture:
where you're headed, what income/housing/support it takes, and roughly
when. As it approaches:

- 60 days out: transition planning intensifies — housing search, budget,
  supports in the new neighborhood, and what your ongoing connection to
  Grace For Addictions looks like (VRCC participation continues after
  residency ends, always).
- Your deposit and any prepaid fees are settled per the Fee Schedule &
  Refund Policy; the inventory walk happens per the Property Policy.
- The house marks it. Graduating this house is an achievement, and we
  celebrate it — Walls of Honor exist for a reason.

## Resident-initiated move-out

You may end your residency at any time — this is your home, not a
commitment you're locked into. We ask for 14 days' notice when possible
(it helps us and the housemate who needs your bed next), but notice is a
courtesy, never a condition of your rights. Refunds, deposit, and
belongings follow the written policies regardless of notice.

## Safety-required transition (involuntary)

Sometimes the house's safety requires a residency to end: ongoing active
use, violence or credible threats, or serious repeated agreement breaches
that a support plan hasn't resolved. Our commitments:

**Due process, every time.**
1. You're told, in a private conversation and in writing, what the
   concern is — specifically.
2. You have the chance to respond, with a support person present if you
   want one, before any final decision (except interim safety steps
   during an immediate danger).
3. The decision is made by the house manager **and** a Grace For
   Addictions program leader together — never one person alone, never in
   anger, never the same hour as the incident unless safety demands it.
4. The decision, its reasons, and your re-application pathway are given
   to you in writing. The Grievance Policy applies to transition
   decisions, and an appeal pauses a non-emergency transition.

**No street discharges.**
Before you leave, staff work the landing with you: a treatment or detox
bed if that's what's needed, another residence, family, or shelter
coordination with a named contact — documented in every case. In
immediate-safety situations where you must leave the property that day,
the safe-landing work happens that day.

**Dignity in the details.**
Belongings per the Property Policy (packed respectfully, held 60+ days),
refunds per the Fee Schedule (unused prepaid fees returned), your mail
forwarded, and your VRCC participation — coaching, community, tools —
continues if you want it. Leaving the house never means leaving the
organization's care.

**The door stays open.**
Your written transition notice includes what returning would look like.
For most safety transitions that means renewed stability plus a
conversation — not a ban. People come back to this house and graduate
from it; that story is common here, and we intend to keep it common.

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'transition_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'code_of_ethics', 'Staff & Leadership Code of Ethics', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Staff & Leadership Code of Ethics

**Grace For Addictions — Grace House**

Every employee, house manager, senior resident in a leadership role, and
volunteer signs this code before serving, and annually after. It is
aligned with the NARR Code of Ethics and posted in the home — residents
are entitled to know exactly what they can hold us to.

## As a person serving this house, I commit to:

1. **Serve the resident's recovery, not my convenience.** Assess honestly
   whether our level of support fits each person's needs, and help them
   find the right fit — inside this residence or beyond it.
2. **Value every pathway.** Honor each resident's chosen recovery
   pathway, including medication for addiction treatment, without
   ranking, pressure, or proselytizing — of any kind, in any direction.
3. **Person-first, grace-based language,** in conversation, in records,
   and when residents can't hear me. How we speak about people when
   they're absent is who we are.
4. **Maintain the alcohol-free, illicit-drug-free home,** and model the
   prosocial, honest, conflict-capable behavior the Social Model runs on.
5. **No exploitation — none.**
   - Never a romantic or sexual relationship with any current resident,
     or with a former resident within 2 years of their residency.
   - Never borrowing, lending, buying, selling, or accepting gifts of
     more than token value with residents.
   - Never using residents for personal labor or benefit.
   - Never requiring a resident to attend my faith community, sign over
     benefits, or serve my interests as a condition of anything.
6. **Protect confidentiality** per the Confidentiality & Privacy Policy —
   including from my own family and friends. Resident stories are not
   anecdotes.
7. **Uphold rights and due process** — the Resident Rights statement
   binds me personally; I follow the written policies even when a
   shortcut would be easier, because residents can only trust rules that
   bind both directions.
8. **Stay within my competence and role.** I am not a clinician (unless
   licensed and acting as one); I refer rather than diagnose, and I
   pursue the training my role requires.
9. **Report honestly** — incidents, medication concerns, grievances, my
   own mistakes. A house that hides small failures grows large ones.
10. **Care for my own recovery and wellness.** If I am in recovery, I
    protect it with the same seriousness I ask of residents; if my
    capacity to serve safely is compromised, I say so and step back.

## Accountability

Concerns about staff conduct go to the program director (or executive
director, if the concern involves the program director) and may be raised
by any resident through the Grievance Policy with full protection from
retaliation. Violations result in corrective action up to removal, and
background checks are completed for all staff and volunteers before
service per organizational policy.

| | |
| --- | --- |
| Name / role | ______________________ |
| Signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions. Aligned with the NARR Code of Ethics.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'code_of_ethics'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_intake_application', 'Residency Application & Intake Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Residency Application & Intake Form

**Grace For Addictions — Grace House**

Thank you for considering Grace House as your next home. This form helps
us make one honest decision together: whether the support this house
offers fits the support you need right now. There are no automatic
disqualifiers on this page — criminal-legal history, medication, past
residencies, and past returns to use are all things we talk about, not
things we screen out.

## About you

| | |
| --- | --- |
| Name | ______________________ |
| Preferred name / pronouns (optional) | ______________________ |
| Date of birth | ______________________ |
| Phone / email | ______________________ |
| Current living situation | ______________________ |
| Earliest possible move-in date | ______________________ |

## Your recovery

*These questions have no wrong answers. They help us support you, not
grade you.*

- What does your recovery look like right now (pathway, supports,
  treatment, meetings, medication — whatever applies)?
  ________________________________________________________________
- Recovery date or current stability, as you'd describe it:
  ________________________________________________________________
- Are you currently prescribed any medications, including MAT/MOUD
  (methadone, buprenorphine, naltrexone)? *Medication never affects
  admission — we ask so we can support storage and fair screening.*
  ________________________________________________________________
- What kind of support helps you most when things get hard?
  ________________________________________________________________

## Practical picture

- Employment / income / benefits situation (fees are on the attached Fee
  Schedule — we plan together if income is a work in progress):
  ________________________________________________________________
- Legal obligations we should plan around (probation/parole check-ins,
  court dates, treatment orders)? ______________________________
- Health or accessibility needs the house should accommodate:
  ________________________________________________________________

## Safety questions

*Asked of every applicant, answered without judgment.*

- Any history we should plan supports around — violence, fire-setting, or
  sexual offenses requiring registry compliance? (Registry obligations
  affect siting rules, so we must ask.) ______________________________
- Anything else you want us to know before we talk?
  ________________________________________________________________

## What happens next

1. We confirm receipt within 2 business days and schedule a conversation
   (in person or video) — you're welcome to bring a support person.
2. You tour the house and meet residents when possible.
3. We decide together. If Grace House isn't the right fit, we tell you
   honestly why and help you find what is — referral is a service here,
   not a rejection letter.
4. Before anything is signed you receive the full move-in packet: Resident
   Agreement, Rights, House Guidelines, Fee Schedule, and every policy.

| | |
| --- | --- |
| Applicant signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_intake_application'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_emergency_contact', 'Emergency Contact & Health Information Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Emergency Contact & Health Information Form

**Grace For Addictions — Grace House**

Completed at move-in, updated any time. This information is sealed in
your file and used **only** in a genuine emergency — it is not shared for
any other purpose without your consent (see Confidentiality & Privacy
Policy).

## Emergency contacts

| | Contact 1 | Contact 2 |
| --- | --- | --- |
| Name | ____________ | ____________ |
| Relationship | ____________ | ____________ |
| Phone | ____________ | ____________ |
| Okay to tell them you live here? | yes / no | yes / no |
| Okay to contact if we can't reach you (see Property Policy)? | yes / no | yes / no |

## For emergency responders

| | |
| --- | --- |
| Allergies (medications, foods, other) | ______________________ |
| Current medications (or "see sealed medication disclosure") | ______________________ |
| Medical conditions responders should know (seizures, diabetes, heart, etc.) | ______________________ |
| Primary care / clinic | ______________________ |
| Treatment provider (optional) | ______________________ |
| Health coverage (optional) | ______________________ |

## Advance wishes (optional)

If I am in a mental-health or overdose crisis, what helps me most / what
makes things worse (e.g., "call my sister first," "don't touch my
shoulders," "tell me what's happening step by step"):

________________________________________________________________

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_emergency_contact'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_release_of_information', 'Release of Information (ROI) Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Release of Information

**Grace For Addictions — Grace House**

One form per recipient. Nothing is shared until this is signed; declining
never affects your residency or services; you may revoke at any time.

| | |
| --- | --- |
| Resident name | ______________________ |
| I authorize Grace For Addictions to share with (person/organization) | ______________________ |
| Contact details of recipient | ______________________ |

**What may be shared** (check only what you intend):

- [ ] Confirmation that I live at / am in the program
- [ ] Attendance and participation summary
- [ ] Screening results
- [ ] Recovery plan / progress updates
- [ ] Medication information
- [ ] Fees and account status
- [ ] Other (specific): ______________________

**Purpose:** ______________________ (e.g., treatment coordination,
probation reporting, family updates)

**Direction:** [ ] release to them  [ ] receive from them  [ ] both

**Expires:** ______________ (date or event; maximum one year unless
renewed). I may revoke earlier, in writing, with effect going forward.

**Your rights under 42 CFR Part 2 (where applicable):** records protected
by federal confidentiality rules cannot be redisclosed by the recipient
without your further written consent; a general medical release does not
substitute for this form.

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff witness | ______________________ Date ________ |
| Revoked (if applicable): date + resident initials | ______________________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_release_of_information'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_medication_disclosure', 'Medication Disclosure Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Medication Disclosure

**Grace For Addictions — Grace House** *(completed at move-in; update any
time a prescription starts, stops, or changes — updates take two
minutes and keep screening fair)*

Kept confidential per the Confidentiality & Privacy Policy. Disclosing
MAT/MOUD affects nothing about your standing here — see the Medication
Policy's plain-language guarantee.

| | |
| --- | --- |
| Resident | ______________________ |
| Date | ______________________ |

| Medication | Prescriber | Dose / schedule | Requires refrigeration? | Controlled substance? |
| --- | --- | --- | --- | --- |
| ____________ | ____________ | ____________ | yes / no | yes / no |
| ____________ | ____________ | ____________ | yes / no | yes / no |
| ____________ | ____________ | ____________ | yes / no | yes / no |
| ____________ | ____________ | ____________ | yes / no | yes / no |

- [ ] I currently take no prescription medications.
- [ ] I received my locking medication storage box.
- [ ] Emergency responders may be told my medications in a medical
      emergency (recommended — see Emergency Contact & Health Form).

Pharmacy used (optional, helps with refill support): ______________________

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff signature | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_medication_disclosure'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_move_in_inventory', 'Move-In Inventory Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Move-In Inventory

**Grace For Addictions — Grace House** *(completed together at move-in;
both keep a copy; walked again at move-out — see the Personal Property &
Move-In Inventory Policy)*

| | |
| --- | --- |
| Resident | ______________________ |
| Room | ______________________ |
| Move-in date | ______________________ |

## Room & furnishings condition

| Item | Condition at move-in | Notes |
| --- | --- | --- |
| Bed frame & mattress | good / fair / worn | ________ |
| Dresser / storage | good / fair / worn | ________ |
| Walls / floor / window | good / fair / worn | ________ |
| Lock & keys issued | yes / no | ________ |
| Medication lockbox issued | yes / no | ________ |

## Resident belongings

*List significant items; photos of valuables welcome and attached: ___*

1. ______________________
2. ______________________
3. ______________________
4. ______________________
5. ______________________
(continue on back)

## Documents & valuables noted for safekeeping (optional)

________________________________________________________________

| | |
| --- | --- |
| Resident signature | ______________________ Date ________ |
| Staff signature | ______________________ Date ________ |
| Move-out walk completed (both initial) | ______________________ Date ________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_move_in_inventory'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_overnight_pass', 'Overnight Pass Request Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Overnight Pass Request

**Grace For Addictions — Grace House**

*Passes exist so the house knows you're safe — not to control your life.
Requests are honored whenever safety allows. This form also lives in the
app (Schedule → Request a pass), which is faster.*

| | |
| --- | --- |
| Resident name | ______________________ |
| Leaving (date/time) | ______________________ |
| Returning (date/time) | ______________________ |
| Where I'll be (city / general location is enough) | ______________________ |
| Reachable at | ______________________ |
| Support plan while away (meetings, sober contact, medication plan — whatever applies) | ______________________ |

Submit at least 48 hours ahead when possible — same-day requests for
work, family, or emergencies are always considered.

| Staff use | |
| --- | --- |
| Decision | approved / not approved (reason given in person + below) |
| Reason if not approved | ______________________ |
| Decided by / date | ______________________ |

An unapproved absence is treated first as a *safety concern* (are you
okay?) and second as an agreement conversation per the House Guidelines.

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_overnight_pass'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_grievance', 'Grievance Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Grievance Form

**Grace For Addictions — Grace House**

*Use this for any concern: rights, safety, staff conduct, billing,
conflict, anything. Filing can never be held against you — see the
Grievance Policy for the full process, timelines, and outside contacts.
Also available in the app (Documents → File a grievance).*

| | |
| --- | --- |
| Your name | ______________________ |
| Date | ______________________ |
| I'd like my grievance handled by (optional — e.g., "someone other than the house manager") | ______________________ |

**What happened?** (What, when, who was involved — attach pages as
needed)

________________________________________________________________
________________________________________________________________
________________________________________________________________

**What would make this right, from your perspective?**

________________________________________________________________
________________________________________________________________

**Have you talked with anyone here about it yet?** (Optional — a prior
conversation is never required.)

________________________________________________________________

| Office use | |
| --- | --- |
| Received by / date | ______________________ |
| Acknowledged to resident (within 2 business days) | ______________________ |
| Written decision provided (within 7 business days) | ______________________ |
| Appeal filed / decided | ______________________ |

*Version 2026.07 — Grace For Addictions.*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_grievance'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_incident_report', 'Incident Report Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2026.07', $docbody$# Incident Report

**Grace For Addictions — Grace House** *(completed by staff within 24
hours of any safety event: medical emergency, overdose, fire, injury,
violence/threat, property damage, missing resident, privacy breach)*

| | |
| --- | --- |
| Date/time of incident | ______________________ |
| Location | ______________________ |
| Category | medical / overdose / fire / injury / violence or threat / property / missing person / privacy / other: ________ |
| Reported by | ______________________ |

**What happened — facts only.** *Write what you observed, in person-first
language. "Resident J. was unresponsive in the kitchen at 21:40" — not
interpretations, diagnoses, or character commentary. Residents involved
are identified by initials in this narrative; full names live only in the
secure record.*

________________________________________________________________
________________________________________________________________
________________________________________________________________

**Immediate response taken** (911? naloxone — how many doses? first aid?
who was notified?):

________________________________________________________________

**People involved / witnesses:** ______________________

**Follow-up needed** (support offered to those involved and those who
witnessed, repairs, policy questions raised):

________________________________________________________________

| Review | |
| --- | --- |
| House manager review / date | ______________________ |
| Program leadership review / date | ______________________ |
| Discussed in quality review (quarterly) | ______________________ |

*Version 2026.07 — Grace For Addictions. Incident data is reviewed
quarterly for patterns — the question is always "what does the house need
to change," before "what did a person do wrong."*
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_incident_report'
on conflict (template_id, version) do nothing;

notify pgrst, 'reload schema';
