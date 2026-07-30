-- GENERATED FILE — do not edit.
-- Source: packages/residence-content (pnpm generate:residence-docs).
-- Idempotent: safe to re-run; re-publishing an existing version updates
-- its body only if the version string was bumped (bodies are immutable
-- per version by design — bump the version to change a document).
set search_path = recoveryos, public;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'participant_agreement', 'Participant Agreement', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Grace House Participant Agreement

This is a program participation agreement, not a residential lease.

Grace For Addictions · 1311 9th Street, Des Moines, Iowa 50314 Office: 515-220-8771 · gracehouse@graceforaddictions.org

Version 2.0. Print-ready and fillable — complete on paper or type directly into this document.

Grace House Participant Agreement

> About This Agreement
> This Agreement is between you and Grace House, operated by Grace For Addictions.
> It outlines the terms and expectations of your residency.
> Please read it carefully. Ask questions about anything that is unclear before signing.
> Signing this agreement is a mutual commitment — we commit to you as you commit to us.
> This agreement does not waive any of your rights as a resident.

RESIDENT NAME: ____________________________________

DATE OF BIRTH: ____________________________________

ADMISSION DATE: ____________________________________

ASSIGNED ROOM/BED: ____________________________________

Part 1: Program Fees and Financial Agreement

Fee schedule per Policy GH-FEES-001 (current).

| Room type | Weekly rate | Monthly prepay (due at start of month) |
| --- | --- | --- |
| Shared (double) room | $175 / week | $650 / month |
| Single (private) room | $200 / week | $700 / month |

My room type: ____________ My rate: $_______ (__ weekly / __ monthly prepay), due every _____________ (day of week, or first of month for monthly prepay).

Payment Methods Accepted:

[ ] Cash

[ ] Money order

[ ] Electronic transfer (details provided by House Manager)

I understand and agree that:

- Program fees are due on the agreed day each week. Late fees or payment plans must be arranged in advance with the House Manager.

- Non-payment of fees for more than 7 days, without an approved payment plan, may result in an administrative discharge process.

- Program fees are non-refundable for the current period, except in cases of emergency or administrative error.

- Grace House does not manage, hold, or control my personal finances.

- I am responsible for maintaining my own financial accounts and obligations.

Part 2: Recovery Participation Agreement

I agree to actively engage in my recovery while living at Grace House. I understand this means:

- Completing an Individual Recovery Plan within 72 hours of intake.

- Reviewing my IRP with the House Manager or peer mentor at 30, 60, and 90 days, and every 90 days thereafter.

- Participating in the required number of recovery support activities each week for my current phase: 4 per week in Phase 1, 3 per week in Phase 2, and 2 per week in Phase 3. Qualifying activities include 12-step meetings, SMART Recovery, Celebrate Recovery, individual therapy, sessions with my life or recovery coach, church or worship services, Bible study, the Tuesday GFA Recovery Community (GFARC) gathering, and other community-based recovery activities. I understand the weekly house meeting does not count toward this total.

- Selecting a life coach or recovery coach at intake, completing daily check-ins through the VRCC app in every phase, and attending coaching sessions weekly in Phase 1, biweekly in Phase 2, and monthly in Phase 3.

- Attending the weekly Grace House community meeting.

- Engaging in employment, education, job training, volunteering, or caregiving at least 30 hours per week by Day 30 (Policy GH-ACTIVITY-001). Exceptions may be approved by the House Manager for medical or other documented reasons.

Part 3: Substance-Free Agreement

I understand that Grace House is a substance-free environment. I agree:

- I will not use alcohol or illegal substances while living at Grace House, whether on or off the property.

- I will not bring alcohol, illegal substances, or non-prescribed medications onto the Grace House property at any time.

- I will submit to drug testing according to the house testing schedule, including random tests.

- I understand that refusing a drug test is treated the same as a positive result.

- I understand that my use of prescribed MAT medications (buprenorphine, methadone, naltrexone, etc.) does not constitute a violation of this policy.

Part 4: Community Expectations Agreement

I agree to contribute to a safe, healthy, and respectful household. Specifically, I agree to:

- Treat all residents, staff, guests, and neighbors with dignity and respect at all times.

- Complete my assigned household chores as scheduled.

- Maintain my personal space in a clean and orderly condition.

- Respect the privacy of all other residents.

- Honor quiet hours as posted.

- Follow the visitors policy, including visitor hours and the prohibition on overnight guests in bedrooms.

- Follow the curfew schedule for my current phase of residency.

- Report any safety concerns to the House Manager promptly.

Part 5: Medication Agreement

I understand and agree that:

- All prescription medications must be disclosed to the House Manager at intake and whenever new prescriptions are obtained.

- All medications will be stored in my personal lockbox or the house medication safe.

- I will not share my medications with any other resident.

- I will provide documentation from my prescribing provider for all controlled substances.

Part 6: Confidentiality Agreement

I understand that the privacy of every person in this household is sacred. I agree:

- I will not share personal information about other residents outside the house.

- I will not post photos or identifying information about other residents on social media.

- I will honor the confidentiality of what is shared in house meetings and peer conversations.

Part 7: Departure Agreement

I agree to provide a minimum of 14 days' written notice before voluntarily departing Grace House. I understand that:

- If I choose to leave without notice, I forfeit any claim to a refund for the current payment period.

- My personal belongings must be removed within 24 hours of my departure.

- I am welcome to return to Grace House community events and support as an alum.

- If I depart for a higher level of care, I am encouraged to apply for readmission when ready.

Part 8: Grievance Rights Acknowledgment

I understand that I have the right to file a formal grievance if I believe my rights have been violated or a policy has been applied unfairly. I understand:

- The grievance process is described in the Resident Handbook.

- I will not face retaliation for filing a grievance in good faith.

- I may also access external agencies including the Iowa Civil Rights Commission and HUD.

Part 9: Resident Rights Acknowledgment

I acknowledge that I have received, reviewed, and understand my Resident Rights as described in the Grace House Resident Handbook. I understand that these rights cannot be waived or removed as a condition of residency.

Part 10: Emergency and Safety Acknowledgment

I acknowledge that:

- Grace House has naloxone (Narcan) available and I have received or will receive training in its use within 7 days of intake.

- Iowa's Good Samaritan law protects me from prosecution if I call for help during an overdose emergency.

- Emergency numbers are posted in the common areas of the house.

- I will call 911 in any situation that involves a medical emergency, fire, or imminent safety threat.

Part 11: Mutual Commitment

By signing this agreement, Grace For Addictions commits to:

- Treating you with dignity, respect, and compassion at every stage of your recovery.

- Providing a safe, clean, and supportive home environment.

- Supporting your chosen recovery pathway without judgment or coercion.

- Being transparent about policies, decisions, and any changes that affect your residency.

- Responding to your needs, concerns, and grievances in a timely and fair manner.

- Celebrating your growth and walking with you through the hard days as well as the victories.

SIGNATURES

By signing below, I certify that I have read, understand, and agree to all provisions of this Participant Agreement. I have had the opportunity to ask questions and have received answers that satisfy me. I enter into this agreement freely and voluntarily.

| Resident Signature | Date |
| --- | --- |

| Resident Printed Name | Admission Date |
| --- | --- |

| House Manager Signature | Date |
| --- | --- |

| House Manager Printed Name | Title |
| --- | --- |

On behalf of Grace For Addictions, 1311 9th Street, Des Moines, Iowa 50314

thomas@graceforaddictions.org | 515-336-0006

> A Note From Thomas DeGarmeaux, Executive Director
> This agreement is not a contract of compliance — it is a covenant of community.
> Every policy in it was written with your dignity in mind.
> We believe in you. We are honored you chose Grace House.
> When this season of your life is over, we hope you will look back and say that this place helped you become more fully yourself.
> Our door is always open.
> — Thomas DeGarmeaux, Founder & Executive Director, Grace For Addictions
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'participant_agreement'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'code_of_conduct', 'Code of Conduct', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', $docbody$# GRACE FOR ADDICTIONS

## Grace House Code of Conduct

Effective Date: February 3, 2026  
Version: 1.0

## OUR FOUNDATION

Grace House is built on principles of grace, dignity, community, hope, and multiple pathways to recovery. This Code of Conduct guides our shared life together and ensures a safe, supportive environment where everyone can thrive in their recovery journey.

Our Commitment: - We treat each person with respect and honor - We believe in accountability with compassion - We support each other’s recovery - We maintain a safe, sober, and peaceful home

## CORE VALUES IN ACTION

### GRACE

We believe in second chances and new beginnings. Mistakes are opportunities for growth, not reasons for shame.

### DIGNITY

Every person deserves to be treated with respect, regardless of their past or their struggles.

### COMMUNITY

Recovery happens in relationship. We support each other, celebrate victories together, and walk through challenges side-by-side.

### HOPE

Lasting change is possible. We believe in each person’s capacity for transformation.

### MULTIPLE PATHWAYS

We honor each person’s unique recovery journey and respect diverse approaches to wellness.

## NON-NEGOTIABLE SAFETY STANDARDS

The following behaviors create immediate danger and may result in immediate removal from Grace House:

### ❌ VIOLENCE & THREATS

- Physical violence or assault toward any person

- Threats of violence or intimidation

- Weapons of any kind on property (guns, knives, dangerous objects)

### ❌ SUBSTANCES & PROPERTY VIOLATIONS

- Bringing alcohol or illicit substances onto the property

- Possession of drug paraphernalia

- Selling, sharing, or distributing substances to others

- Theft or deliberate destruction of property

### ❌ SEXUAL MISCONDUCT & HARASSMENT

- Sexual harassment, assault, or coercive behavior

- Non-consensual physical contact

- Creating a sexually hostile environment

### ❌ ENDANGERMENT

- Behaviors that create serious, ongoing risk to self or others

- Refusing to follow safety protocols during emergencies

- Intentionally putting others at risk

These are non-negotiable because they compromise the safety of our community.

## SOBRIETY & RECOVERY EXPECTATIONS

### ✅ SUBSTANCE-FREE LIVING

- Grace House is an alcohol-free and illicit substance-free environment

- All residents commit to abstaining from alcohol and non-prescribed substances

- If you experience a return to use, tell someone immediately — we will support you, not shame you

### ✅ MEDICATIONS ARE SUPPORTED

- All FDA-approved medications are permitted and encouraged

- This includes Medication for Opioid Use Disorder (MOUD): methadone, buprenorphine (Suboxone), naltrexone (Vivitrol)

- Mental health medications are fully supported

- Medications must be prescribed by a licensed provider

- Follow medication storage guidelines (see House Manager)

### ✅ ACTIVE RECOVERY ENGAGEMENT

- Participate in at least 3 recovery support activities per week

- Peer support groups

- Mutual aid meetings (AA, NA, SMART Recovery, etc.)

- Individual counseling/therapy

- Faith-based recovery (if chosen)

- Other recovery activities approved by staff

- Attend required house meetings (weekly — Thursdays at 7:00 PM)

- Meet regularly with your peer coach (frequency varies by program phase)

### ✅ TREATMENT CHOICE IS YOURS

- You may seek clinical treatment from any provider you choose

- You are not required to use a specific treatment program or counselor

- We will support you in accessing the care you need

## DAILY LIVING EXPECTATIONS

### 🏠 HOUSE CARE & RESPONSIBILITIES

Personal Space: - Keep your bedroom clean and organized - Respect roommate’s space and belongings (if shared room) - No eating or storing open food in bedrooms (to prevent pests) - Do laundry regularly and put away clean clothes

Shared Spaces: - Clean up after yourself immediately in kitchen, bathrooms, and common areas - Complete your assigned chores on schedule - Return shared items to their proper place - Report maintenance issues to House Manager

Your Assigned Chores: Assigned at move-in and rotated monthly

Chore Schedule: Posted in the kitchen common area and updated each rotation

### 🕐 SCHEDULE & ATTENDANCE

Curfew: - Weeknight curfew: 10:00 PM (Sunday–Thursday) - Weekend curfew: 11:00 PM (Friday–Saturday) - Curfew extensions for work, medical appointments, or recovery activities: request from the House Manager with at least 24 hours’ notice - Overnight passes: available after 60 days of residency in good standing; submit a written request 48 hours in advance including location and host name - More than three curfew violations in a 30-day period results in a community accountability conversation and a possible curfew reset — restorative, not punitive

House Meetings: - Mandatory attendance: Thursdays at 7:00 PM - If you must miss, notify House Manager in advance

Sign-In/Sign-Out: - Use the sign-out sheet by the front door when leaving the property - Include: time left, destination, expected return

Notify Staff If: - You’ll be late for curfew - You need to miss a house meeting - Your schedule changes - You’ll be away overnight (requires advance approval)

### 👥 VISITORS & GUESTS

Visitor Rules: - All visitors must be pre-approved by House Manager - No visitors who are actively using substances - Visitor hours: Monday–Thursday 10:00 AM–9:00 PM; Friday–Saturday 10:00 AM–10:00 PM; Sunday 12:00 PM–8:00 PM - Visitors must remain in common areas (living room, kitchen) - No visitors in bedrooms at any time - No overnight guests without advance approval

Your responsibility: Ensure your visitors respect house rules and other residents

### 💼 EMPLOYMENT, EDUCATION, VOLUNTEER WORK

Phase 2 and 3 Residents: - Expected to be engaged in employment, education, or volunteer work - Actively engaged weekdays 9:00 AM–4:00 PM in employment, education, job training, volunteering, or scheduled appointments (exceptions require House Manager approval) - If unemployed, actively seeking work (documented job applications) - Keep House Manager informed of work schedule

Exceptions may be made for: - Intensive outpatient treatment - Medical conditions (with documentation) - Short-term transition periods (discussed with House Manager)

### 💰 FINANCIAL RESPONSIBILITIES

Weekly Program Fee: - Amount: $________ per week - Due: Every Friday - Payment methods: Cash, money order, or electronic transfer - Late arrangement: Speak with the House Manager BEFORE the due date if you need a payment plan. Fees unpaid more than 7 days without an approved plan begin an administrative review.

What to do if you can’t pay: - Talk to House Manager immediately — before you fall behind - We will work with you on payment plan or hardship accommodation - Do not avoid staff or hide financial difficulty

## COMMUNICATION & RESPECT

### ✅ RESPECTFUL COMMUNICATION

- Use kind, respectful language with all residents and staff

- No yelling, name-calling, or verbal abuse

- Address conflicts directly and calmly (ask staff for support if needed)

- Practice active listening

### ✅ CONFIDENTIALITY

- What you hear here, stays here; what you see here, stays here

- Do not share other residents’ personal information, stories, or struggles outside Grace House

- Do not post about others on social media without their consent

- Respect others’ privacy

### ✅ BOUNDARIES

- Knock before entering others’ rooms

- Ask permission before borrowing items

- Respect “no” — if someone sets a boundary, honor it

- No romantic or sexual relationships between residents

- Report boundary violations to staff

### ✅ INCLUSIVE COMMUNITY

- Welcome and respect people of all backgrounds

- No discrimination based on race, ethnicity, religion, gender identity, sexual orientation, age, or disability

- Challenge your own biases; be willing to learn and grow

- Create a culture where everyone feels they belong

## HEALTH, SAFETY & SELF-CARE

### 🩺 PERSONAL HEALTH & HYGIENE

- Shower/bathe daily

- Wash hands before meals and after using bathroom

- Do laundry weekly (clean clothes and bedding)

- Keep personal space clean to prevent illness

- If you’re sick, take precautions to avoid spreading illness

### 🚨 EMERGENCY PROTOCOLS

- Know where fire exits are located (see posted map)

- Know where naloxone (Narcan) is stored

- Know how to call for help (see posted emergency numbers)

- Participate in fire drills and safety training

- Follow staff instructions during emergencies

### 🧘 SELF-CARE & WELLNESS

- Attend medical and mental health appointments

- Take medications as prescribed

- Get adequate sleep (quiet hours: 10:00 PM to 7:00 AM (11:00 PM to 7:00 AM on weekends))

- Eat nutritious meals

- Engage in healthy activities (exercise, hobbies, social connection)

## TECHNOLOGY & MEDIA USE

### 📱 GUIDELINES

- Use headphones when listening to music, videos, or games

- No loud phone conversations during quiet hours

- Charge devices in your own space (do not monopolize common area outlets)

- No inappropriate content (pornography, glorifying substance use, violent content)

### 📷 PHOTOGRAPHY & SOCIAL MEDIA

- Do not photograph or record others without their consent

- Do not share photos/videos of Grace House or other residents publicly without permission

- Be mindful of your social media use — avoid content that undermines your recovery

- No live streaming from Grace House

## ACCOUNTABILITY & PROGRESSIVE DISCIPLINE

Our approach is grace-centered and focused on growth, not punishment.

### HOW ACCOUNTABILITY WORKS

Level 1: Verbal Conversation - Informal, supportive discussion about concern - Understanding what happened - Agreement on plan moving forward - Documentation in your file

Level 2: Written Warning - Formal written notice - Specific expectation that needs to be met - Timeline for improvement - Increased check-ins - Copy provided to you

Level 3: Accountability Meeting - Meeting with House Manager and peer coach - Review of concerns - Development of accountability plan - May include: - Temporary restrictions (e.g., earlier curfew, increased check-ins) - Return to Phase 1 support structure - Additional recovery support requirements - Increased supervision

Level 4: Housing Review - Care team meeting (you’re invited to participate) - Discussion of whether Grace House is still the right fit - Options may include: - Continued residence with maximum support - Transition to higher level of care (treatment, clinical program) - Voluntary exit with warm handoff to alternative housing - Involuntary discharge (only if safety concern persists)

## RELAPSE RESPONSE POLICY

Return to use is not automatic grounds for discharge. We work WITH you, not against you.

### IF YOU USE SUBSTANCES:

- Tell someone immediately — your safety is our priority

- We will assess your medical needs (may call 911 if necessary)

- Together, we’ll determine next steps:

- Stay with increased support

- Temporary return to treatment/detox with plan to return

- Adjust your recovery plan

- Additional resources and connection

### YOU WILL NOT BE AUTOMATICALLY KICKED OUT

Discharge for return to use is considered only if: - You refuse to engage with support after return to use - You repeatedly bring substances onto property - Your use creates imminent danger to community - You’re unable to maintain sobriety despite all available support

Grace means second chances. And third. And fourth.

## YOUR RIGHTS

### AS A GRACE HOUSE RESIDENT, YOU HAVE THE RIGHT TO:

- ✅ Be treated with dignity and respect

- ✅ Privacy in your personal space

- ✅ Choose your own treatment providers

- ✅ Take all prescribed medications (including MOUD)

- ✅ Practice your spiritual/religious beliefs

- ✅ File a grievance if you feel mistreated

- ✅ Leave the program voluntarily at any time

- ✅ Be free from discrimination

- ✅ Access your own file (with 48-hour notice)

- ✅ Have your personal information kept confidential (within legal limits)

## GRIEVANCE PROCESS

If you have a concern or feel this Code of Conduct has been violated:

- Talk to staff first — most issues can be resolved through conversation

- File written grievance — submit Grievance Form to Executive Director (available from any staff)

- Receive response — within 5 business days

- Appeal if needed — to Board of Directors within 10 days

- External resources — if unresolved, contact Iowa HHS Recovery Housing

You will not face retaliation for filing a grievance.

## VOLUNTARY EXIT & DISCHARGE

### YOU MAY LEAVE AT ANY TIME

If you choose to leave Grace House: - Give 7 days’ notice if possible - Complete exit interview - Return keys and borrowed items - Allow us to help plan your next steps

### DISCHARGE MAY OCCUR IF:

- You violate non-negotiable safety standards

- You refuse support after multiple interventions

- Your behavior creates ongoing risk to community

- You stop paying fees and refuse to create a plan

Even in discharge, we provide referrals, support, and a warm transition when possible.

## OUR SHARED COMMITMENT

By living at Grace House, I commit to: - Maintaining a sober, safe environment - Treating others with respect - Taking responsibility for my recovery - Engaging with the community - Following house expectations - Asking for help when I need it - Celebrating progress with my housemates - Honoring the trust placed in me

Grace House commits to: - Treating you with dignity always - Supporting your recovery journey - Providing a safe, clean home - Holding you accountable with compassion - Working with you through challenges - Respecting your autonomy and choices - Connecting you with resources you need

## ACKNOWLEDGMENT

I have read (or had read to me) the Grace House Code of Conduct. I understand the expectations and my responsibilities. I commit to upholding this Code and contributing to a safe, supportive community.

Resident Signature: ______________________________

Date: _________________________

Staff Witness: ____________________________________

Date: _________________________

This Code of Conduct is reviewed with all residents during orientation and is posted in Grace House common areas for ongoing reference.

Questions? Concerns? Always talk to your peer coach or House Manager.

Grace For Addictions | Grace House  
1311 9th Street, Des Moines, Iowa  
Code of Conduct — Version 1.0 | Effective: February 3, 2026
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'code_of_conduct'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'resident_handbook', 'Resident Handbook', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Grace House Resident Handbook

Grace For Addictions · 1311 9th Street, Des Moines, Iowa 50314 Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Version 2.0 — Canonical Policy Alignment. Print-ready; may also be completed and acknowledged electronically.

Welcome to Grace House

To every woman who walks through this door:

You are not defined by what you have been through. You are not the worst thing that has ever happened to you. You are not your struggles, your history, or your hardest seasons.

You are someone who chose to take a step — and that step matters. It is courageous, even when it doesn't feel that way.

Grace House exists because we believe every person in recovery deserves more than survival. You deserve a home — a real one. A place where you are known by name, not by case number. A place where you are seen, not surveilled. A place where you belong.

This is a peer community. Everyone here — including the people who help facilitate it — has walked a road that includes struggle and healing. There is no hierarchy of worthiness here. There is only a shared commitment to show up for ourselves and for one another.

This handbook is your guide to life at Grace House. It explains how our community works, what you can expect from us, and what we ask of you in return. Please read it carefully, ask questions when something is unclear, and refer back to it whenever you need to.

Most of all, know this: you belong here. We are glad you are here. And we are committed to walking this season of life with you.

With hope and respect,

The Grace House Community

Operated by Grace For Addictions Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · Toll Free: (877) 295-2535 gracehouse@graceforaddictions.org

Program Philosophy

Our Foundation

Grace House is built on a simple but powerful belief: people in recovery are capable, whole, and worthy of dignity at every stage of the journey. We do not treat recovery as a problem to be managed. We treat it as a life to be lived — fully, freely, and with community support.

Multiple Pathways, One Community

We honor the reality that recovery looks different for every person. There is no single right way to heal. At Grace House, all evidence-based recovery pathways are welcomed and respected, including:

- 12-Step programs (Alcoholics Anonymous, Narcotics Anonymous, Celebrate Recovery, and others)

- SMART Recovery and other secular, science-based approaches

- Medication-Assisted Treatment (MAT) — including methadone, buprenorphine/naloxone (Suboxone), and naltrexone — prescribed and monitored by licensed medical providers

- Faith-based recovery frameworks

- Trauma-informed therapy and counseling

- Wellness practices including mindfulness, exercise, nutrition, and creative expression

- Harm reduction-informed approaches

You will never be required to identify with any particular recovery identity or program. What you will be asked to do is engage — with your own growth, with this community, and with the commitments you make here.

Who Grace House Serves (Eligibility)

Grace House serves adult women who are building a life in recovery. There are two pathways to eligibility:

- Recovery pathway: a personal history of substance use or misuse and a commitment to living substance-free while in residence.

- Family pathway: a parent, partner, or child with a history of substance use disorder or mental-health-related trauma, where stable, structured, recovery-supportive housing supports the family’s healing.

Both pathways carry the same expectations, the same dignity, and the same community membership. Admission decisions are made without regard to race, color, religion, national origin, disability, or any other protected status, and in full compliance with the Fair Housing Act.

Removal from the Program

Grace House does not use punitive legalistic frameworks in its intake materials. Participants may be removed immediately upon violation of program rules or upon conduct that endangers another resident’s life or recovery. Removal decisions are documented, reviewable through the grievance process, and carried out with dignity.

Change Course Leaders (Partner Program)

Change Course is an independent, outside program — it is not a Grace House or GFA program. Change Course has Leaders only — there are no Change Course “participants.”

- Qualification and acceptance as a Change Course Leader is determined solely by Change Course. Grace House plays no role in selecting, qualifying, or approving Change Course Leaders.

- Change Course Leaders take part in extensive Change Course programming Monday through Thursday. Because of this substantial structured engagement, Grace House requires Change Course Leaders to add only two (2) additional supportive activities per week — in place of the standard phase-based recovery activity requirement.

- Change Course Leaders are expected to remain in full compliance with all Change Course program requirements, which are set and administered by Change Course, not by Grace House.

- All other Grace House expectations (house meeting, curfew, coaching and daily check-ins, fees, community standards) apply to Change Course Leaders exactly as they do to every participant.

Trauma-Informed Care

Grace House operates within a trauma-informed framework, which means we understand that many of the behaviors, struggles, and patterns we see in ourselves and each other are often rooted in experiences of pain, loss, and trauma — not in moral failure or personal weakness.

Our five core trauma-informed principles guide everything we do:

> Five Core Principles
> SAFETY — You have the right to feel physically and emotionally safe at Grace House. We create and maintain that safety together.
> TRUST — We are transparent in how decisions are made, and we do what we say we will do.
> CHOICE — You retain agency over your own life and recovery decisions whenever possible.
> COLLABORATION — Decisions that affect residents are made with resident input, not just for residents.
> EMPOWERMENT — Our goal is to build your capacity, not your dependence. Every policy is designed to help you grow stronger, not keep you compliant.

Grace-Based Accountability

We believe that accountability without compassion produces shame, and shame is one of the greatest barriers to sustained recovery. At Grace House, accountability is not punitive — it is restorative.

When someone falls short of a commitment, our first question is not 'what is the consequence?' but 'what happened, and how do we move forward together?' This does not mean there are no expectations or no consequences — it means that consequences are always proportionate, transparent, and aimed at restoration rather than punishment.

Peer-Led Community Model

Grace House is a peer-led recovery residence. This means the culture, care, and community of this home is built by the people who live in it. Experienced residents mentor newer ones. Everyone shares household responsibilities. Leadership within the house is earned through character and consistency, not assigned by credential.

This model is intentional. Research consistently shows that peer support is one of the most powerful catalysts for sustained recovery. You are not just receiving help here — you are also giving it, and that matters deeply.

Resident Rights

As a resident of Grace House, you have the following rights. These rights are non-negotiable and may not be waived, modified, or removed as a condition of residency.

Rights Regarding Dignity and Person

- You have the right to be treated with dignity, respect, and compassion at all times.

- You have the right to be addressed by your preferred name and pronouns.

- You have the right to privacy in your personal communications, including phone calls, letters, and electronic messaging.

- You have the right to manage your own finances, employment, and personal affairs without interference.

- You have the right to keep and access your own identification documents (ID, Social Security card, birth certificate, etc.) at all times.

- You have the right to receive and send personal mail without interception or inspection.

Rights Regarding Recovery

- You have the right to pursue the recovery pathway of your choice, including Medication-Assisted Treatment (MAT), without discrimination or penalty.

- You have the right to choose your own healthcare providers, counselors, and support services in the community.

- You have the right to be free from pressure to affiliate with any specific religious, spiritual, or recovery ideology.

- You have the right to receive medication prescribed by a licensed provider, subject to the house medication policy.

Rights Regarding Residence

- You have the right to a clean, safe, and habitable living environment.

- You have the right to understand all house policies before agreeing to them.

- You have the right to receive advance written notice before any change in your residency status, except in cases of immediate safety concerns.

- You have the right to a fair and transparent grievance process if you believe your rights have been violated or a policy has been applied unfairly.

- You have the right to be free from unlawful searches of your personal belongings.

- You have the right to reasonable accommodations for disability-related needs.

Rights Regarding Confidentiality

- You have the right to confidentiality of your participation in Grace House, subject only to mandatory reporting obligations under Iowa law.

- You have the right to know what information about you is shared, with whom, and why.

- You have the right to provide or withhold consent for release of your information to outside parties.

Rights Regarding Fair Treatment

- You have the right to be free from discrimination based on race, color, national origin, religion, sex, disability, familial status, or any other protected characteristic.

- You have the right to be free from harassment, intimidation, or retaliation from staff or other residents.

- You have the right to access community resources, legal counsel, or outside advocacy without interference.

> If You Believe Your Rights Have Been Violated
> You may file a grievance using the Grace House Grievance Procedure (see page XX).
> You may contact the Iowa Civil Rights Commission: 1-800-457-4416
> You may contact the Iowa Protection & Advocacy Services: 1-800-779-2502
> You may contact the U.S. HUD Office of Fair Housing: 1-800-669-9777
> No retaliation will be taken against any resident for asserting their rights or filing a complaint.

Resident Responsibilities

Living in community means contributing to it. The following responsibilities are what we ask of every resident — not to control you, but because a healthy household requires everyone to show up.

Financial Responsibilities

- Pay your weekly program fee on time. If you are experiencing financial difficulty, speak with the House Manager before your payment is due — not after.

- Maintain your own financial accounts. Grace House does not control, hold, or manage residents' money.

- Contribute to shared household expenses as outlined in your Participant Agreement.

Household Responsibilities

- Complete your weekly chore assignment thoroughly and on time.

- Keep your personal space (bedroom, bathroom area) clean and organized.

- Clean up after yourself in all shared spaces, including the kitchen, living room, and laundry area.

- Respect all common areas as shared space — not personal space.

- Report maintenance issues or safety concerns to the House Manager promptly.

Community Responsibilities

- Treat every resident, guest, and community member with respect and dignity.

- Maintain a substance-free environment. Do not bring alcohol, illegal substances, or non-prescribed medications into the house or onto the property.

- Do not engage in physical, verbal, or emotional intimidation, harassment, or violence of any kind.

- Honor the privacy of other residents. Do not share personal information about another resident outside the house.

- Honor quiet hours to support everyone's sleep and wellbeing.

Recovery Responsibilities

- Engage in your personal recovery plan. This does not prescribe a specific program, but it does require active engagement with your own growth.

- Attend required house meetings and community gatherings.

- Comply with drug testing requirements as outlined in the Participant Agreement.

- Notify the House Manager if you are struggling or feel at risk. You will not be punished for being honest.

Behavioral Responsibilities

- Honor your curfew unless prior approval has been granted.

- Follow the visitors policy.

- Comply with the medication policy.

- Do not engage in illegal activity inside or outside the home.

- Do not remove other residents' belongings without permission.

House Expectations

These expectations exist to make Grace House a safe, functional, and healing environment for everyone. They are not designed to restrict your freedom — they are designed to protect the community we are building together.

Substance-Free Environment

Grace House is an alcohol- and drug-free home. This commitment protects every person in this community.

- No alcohol, illegal drugs, or non-prescribed medications may be brought onto the property at any time.

- Residents may not use substances while living at Grace House, whether on or off the property.

- Residents on Medication-Assisted Treatment (MAT) are fully supported and may continue their prescribed medications under the house medication policy.

- Random drug screens may be requested at any time. Refusal to test is treated the same as a positive result.

- If you are struggling with cravings or feel at risk, please talk to someone. This is not a violation — this is using your recovery community exactly as it was designed.

Quiet Hours and Community Rhythm

Consistent sleep and shared routines support recovery. We ask all residents to honor the following schedule:

| Time | Expectation |
| --- | --- |
| 10:00 PM – 7:00 AM (Sun–Thu) | Quiet hours. Keep voices, music, and devices at low volume. Phone calls in private spaces. |
| 11:00 PM – 7:00 AM (Fri–Sat) | Quiet hours on weekends. |
| 7:00 AM daily | Common areas are open. Morning routines begin. |
| 12:00 PM daily | Bedrooms should be tidied. Daytime activities and obligations underway. |

Common Areas

- Common areas are for everyone. Clean up after every use.

- Kitchen: wash your dishes within 2 hours of using them. Do not leave food on counters.

- Living room: return furniture to its original position after use. No shoes on furniture.

- Laundry: complete your laundry in one session. Do not leave laundry in machines for more than 30 minutes after it is finished.

- Bathrooms: wipe down surfaces after use. Dispose of personal hygiene products properly.

Personal Space

- Your bedroom is your private space. Treat it with care.

- Residents may decorate their rooms in personal ways that do not damage walls or fixtures.

- Bedrooms may not be locked while other residents are home during nighttime hours, in order to maintain the open household environment.

- You are responsible for keeping your bedroom clean. Rooms are subject to wellness checks with 24-hour notice (except in emergencies).

Electronics and Technology

- Personal phones and devices are allowed. Please honor quiet hours and common-area courtesy.

- Social media use that compromises the privacy or reputation of other residents is a serious violation of community trust.

- House WiFi is provided for resident use. Illegal activity conducted via the house network is prohibited.

Pets

- Pets are not permitted at Grace House unless approved in advance by the House Manager as a disability-related accommodation.

- Approved emotional support animals must have current vaccination records on file.

Smoking

- Smoking and vaping are permitted only in designated outdoor areas.

- Do not smoke within 20 feet of any entrance or window.

- Please dispose of cigarette waste responsibly.

Recovery Participation Expectations

Grace House is a recovery-focused community. Living here means actively engaging in your own recovery journey — not performing recovery for someone else, but genuinely investing in your own healing and growth.

What Active Recovery Engagement Looks Like

Policy ID GH-RECOVERY-001 v2.0 — phase-based requirement; supersedes the flat two-per-week standard.

Recovery Activity Requirements by Phase

| Phase | Recovery activities per week |
| --- | --- |
| Phase 1 (Days 1–30) | 4 |
| Phase 2 (Days 31–90) | 3 |
| Phase 3 (Days 91+) | 2 |

What counts as a recovery activity: 12-step meetings (AA/NA), SMART Recovery, Celebrate Recovery, individual therapy or counseling, sessions with your life coach or recovery coach, church or worship services, Bible study, the Tuesday GFA Recovery Community (GFARC) gathering, and other structured community-based recovery activities.

What does not count: the weekly Grace House community meeting. House meeting attendance is a separate, mandatory expectation and may not be counted toward your weekly recovery activity total.

Life Coach / Recovery Coach (required for all participants):

- Every participant selects a life coach or recovery coach at intake.

- Daily check-ins through the VRCC app are required in every phase.

- Coaching sessions: weekly in Phase 1, biweekly in Phase 2, monthly in Phase 3. Coaching sessions count toward your weekly recovery activity total.

- Completing community service, employment, job training, education, or caregiving obligations.

- Engaging in your individual recovery plan with honesty and intention.

House Meetings

Grace House holds a mandatory community meeting once per week. This meeting is the heartbeat of the household. It is where we share, resolve conflicts, make decisions together, celebrate milestones, and maintain our sense of shared life.

- All residents are expected to attend unless prior approval has been granted.

- Meetings are facilitated by rotation among residents.

- All voices are welcome. All perspectives are respected.

- What is shared in house meeting stays in house meeting.

Individual Recovery Planning

Within 72 hours of intake, each resident will complete an Individual Recovery Plan with support from the House Manager or a peer mentor. This plan identifies:

- Your personal recovery goals

- Your chosen recovery pathway and support structure

- Your employment, education, or community service commitments

- Identified strengths, supports, and areas of growth

- Short-term milestones and how success will be measured

Recovery plans are reviewed and updated monthly. They belong to you — not to the house — and are written in your voice.

No Coerced Affiliation

You will never be required to attend a specific recovery program, claim a particular recovery identity, pray in a specific way, or align with any ideology as a condition of living at Grace House. Multiple recovery pathways are honored equally here.

Curfew and Daily Structure

Curfew

Curfew is a structure designed to protect your sleep, your safety, and the community's sense of stability — not to restrict your life.

Policy ID GH-CURFEW-001 v3.0 — supersedes all prior curfew tables.

| Phase | Weeknight (Sun–Thu) | Weekend (Fri–Sat) |
| --- | --- | --- |
| Phase 1 (Days 1–30) | 9:00 PM | 10:00 PM |
| Phase 2 (Days 31–90) | 10:00 PM | 11:00 PM |
| Phase 3 (Days 91+) | 11:00 PM | Midnight |

Hard ceiling: No curfew at Grace House extends past midnight in any phase, for any reason other than verified current employment.

The only curfew exception is current employment. A participant whose verified work schedule conflicts with curfew may be granted an employment-based adjustment covering scheduled shifts plus reasonable travel time. A copy of the work schedule must be on file with the House Manager. No other exceptions (social, family, recreational, or recovery-activity) extend curfew.

Curfew Extensions and Overnight Passes

- Curfew adjustments are granted only for verified current employment. Submit your work schedule to the House Manager; the adjustment covers scheduled shifts plus reasonable travel time.

- Overnight passes may be granted after 60 days of residency to residents in good standing.

- Overnight passes require a written request submitted 48 hours in advance, including the location and host name.

- More than three curfew violations in a 30-day period will result in a community accountability conversation and potential curfew reset.

Morning Routine

A consistent morning routine is one of the most powerful recovery tools available. Residents are encouraged to establish a morning routine that includes:

- Rising at a consistent time (no later than 10:00 AM on days without obligations)

- Personal hygiene and room tidying

- Breakfast and/or connection with housemates

- Engagement with daily obligations (work, school, appointments, volunteer activities)

Daytime Expectations

Grace House is not a daytime respite program. Residents are expected to be actively engaged in employment, education, job training, volunteering, or scheduled appointments during weekday daytime hours (9:00 AM – 4:00 PM). Exceptions require prior approval from the House Manager.

Medication and Appointments

Residents are responsible for scheduling and attending all medical, counseling, and recovery-related appointments. The house schedule and curfew framework are designed to accommodate these commitments. If a conflict exists, bring it to the House Manager immediately.

Visitors Policy

Grace House is a private home. Our visitors policy protects the safety, comfort, and recovery environment of every resident.

General Visitor Guidelines

- Visitors are welcome in common areas only. Guests may not enter any resident's bedroom.

- All visitors must be introduced to and acknowledged by the House Manager or on-call peer leader.

- Residents are responsible for the behavior of their guests.

- Visitors who behave inappropriately, appear intoxicated, or make other residents uncomfortable may be asked to leave immediately.

- Visitors may not stay overnight unless prior approval has been granted through the extended guest process.

Visitor Hours

| Day | Visitor Hours |
| --- | --- |
| Monday – Thursday | 10:00 AM – 9:00 PM |
| Friday – Saturday | 10:00 AM – 10:00 PM |
| Sunday | 12:00 PM – 8:00 PM |

Prohibited Visitors

- No visitors who are currently using substances or appear intoxicated.

- No visitors who pose a documented safety concern to any current resident.

- No male visitors in bedroom areas. Male visitors are welcome in common areas during visitor hours.

- No visitors under the age of 12 without specific approval (to protect all residents' privacy and comfort).

Overnight Guests

Overnight guests are a privilege extended to residents in Phase 2 and Phase 3 who are in good standing.

- A written overnight guest request must be submitted to the House Manager 48 hours in advance.

- Approved guests must sleep in common area (living room) only — never in bedrooms.

- A maximum of one overnight guest per resident is permitted.

- Overnight guests may not remain in the home during daytime obligation hours (9:00 AM – 4:00 PM weekdays).

Medication Policy

Grace House is fully supportive of Medication-Assisted Treatment (MAT) and all prescription medications. We recognize that medication is healthcare — not a compromise of recovery.

Medication-Assisted Treatment (MAT)

Residents taking MAT medications — including methadone, buprenorphine (Suboxone), naltrexone (Vivitrol), or any other FDA-approved medication for opioid or alcohol use disorder — are fully welcome at Grace House. Their use of prescribed medication is private health information and will never be used to stigmatize, limit, or dismiss their recovery.

Medication Storage and Administration

- All prescription medications must be disclosed to the House Manager upon intake.

- Medications must be stored in a secure, designated personal lockbox.

- Controlled substances (including MAT medications) must be stored in a house-provided locked medication safe if a personal lockbox is not available.

- Medications may not be shared with any other resident under any circumstances.

- Residents are responsible for taking their own medications independently. Grace House staff do not administer medications.

New Prescriptions

- Any new prescription obtained while living at Grace House must be reported to the House Manager within 24 hours.

- Residents must provide written documentation from their prescribing provider for any controlled substance.

- Over-the-counter medications with potential for misuse (certain cough syrups, antihistamines, etc.) should be disclosed and stored appropriately.

Medical Privacy

Your medical information — including what medications you take — is private. Grace House staff will not disclose your medication information to other residents, family members, or outside parties without your written consent, except as required by law.

> MAT-Affirming Statement
> Grace House explicitly affirms that Medication-Assisted Treatment is an evidence-based, medically appropriate approach to recovery.
> No resident will be asked to discontinue MAT as a condition of residency.
> No resident will face stigma, reduced privileges, or negative consequences for taking prescribed MAT medications.
> Residents taking MAT are full and equal members of this recovery community.

Confidentiality Policy

What happens at Grace House stays at Grace House. Confidentiality is one of the foundations of our community trust.

What We Protect

- The identity of anyone participating in Grace House.

- Personal information shared in house meetings, peer conversations, or with staff.

- Your recovery history, medical information, and legal history.

- Your current address and contact information.

- Any information that could identify you as a person in recovery.

What You Must Protect

Every resident has the same confidentiality obligations to their housemates. This means:

- Do not share another resident's personal information outside the house.

- Do not post photos, videos, or identifying information about other residents on social media.

- Do not disclose who lives here to people who don't need to know.

- Honor the trust placed in you when other residents share in meetings or conversations.

Required Disclosures

There are limited situations in which Grace House is required by law to disclose information, even without your consent. These include:

- Imminent risk of harm to yourself or another specific person (duty to warn under Iowa law).

- Suspected abuse or neglect of a child or vulnerable adult (mandatory reporting under Iowa Code Chapter 232).

- Court order requiring disclosure.

In all other cases, your information will not be disclosed without your written, signed consent.

HIPAA and 42 CFR Part 2

Substance use disorder treatment information is protected by federal law under 42 CFR Part 2, which provides stronger protections than standard HIPAA. While Grace House is a peer-led residence (not a clinical treatment provider), we align our confidentiality practices with the highest standard of protection.

Grievance Procedure

If you believe you have been treated unfairly, your rights have been violated, or a policy has been applied inconsistently, you have the right to file a grievance. This process is taken seriously, and no retaliation will occur for using it.

Grievance Process — Step by Step

> Step 1 — Informal Resolution (Within 3 Days)
> If you are comfortable doing so, speak directly with the person involved.
> Be specific about what occurred, how it affected you, and what resolution you are seeking.
> If the concern involves a housemate, a peer mediator can be requested.
> Many concerns can be resolved quickly through honest conversation.

> Step 2 — Formal Written Grievance (Within 10 Days of Incident)
> Complete a Grace House Grievance Form (available from the House Manager or in the resident binder).
> Submit the completed form to the House Manager.
> You will receive a written acknowledgment within 24 hours confirming receipt.
> Your grievance will be reviewed within 5 business days.

> Step 3 — House Manager Response (Within 5 Business Days)
> The House Manager will investigate the grievance by reviewing the facts and speaking with relevant parties.
> A written response will be provided to you within 5 business days of receiving your form.
> The response will include findings, any action taken, and the reasoning behind the decision.

> Step 4 — Appeal (Within 5 Days of House Manager Response)
> If you are not satisfied with the House Manager's response, you may appeal to Grace For Addictions leadership.
> Submit a written appeal to thomas@graceforaddictions.org with a copy of your original grievance and the response received.
> A final decision will be provided within 10 business days.

> Step 5 — External Resources
> At any point in this process, you may also contact external agencies.
> Iowa Civil Rights Commission: 1-800-457-4416
> Iowa Protection & Advocacy Services: 1-800-779-2502
> HUD Fair Housing: 1-800-669-9777
> Iowa Department of Health and Human Services: 1-800-362-2178

Anti-Retaliation

No resident will face any negative consequences — including threats, changes in privileges, or pressure toward discharge — for filing a grievance in good faith. Retaliation is itself a serious violation and will be addressed through the same process.

Safety Expectations

Safety is not just a rule — it is a value. Every person in this home deserves to feel safe: physically, emotionally, and relationally. These expectations exist to protect that safety.

Physical Safety

- Violence of any kind — physical assault, threats of violence, destruction of property — will result in immediate safety intervention and may result in emergency discharge.

- Weapons of any kind are strictly prohibited on the property.

- Emergency contact numbers are posted in the kitchen, bathroom, and entryway.

- In an emergency, always call 911 first.

- Grace House has a safety plan and fire escape route posted in each common area and near each exit.

- Tampering with smoke detectors, fire extinguishers, or safety equipment is strictly prohibited.

Emotional and Relational Safety

- Verbal aggression, intimidation, threatening language, or emotional manipulation are not tolerated.

- Bullying, gossip campaigns, exclusion, and other forms of social aggression are violations of community standards.

- Each resident has a right to their emotional experience without being dismissed, mocked, or pressured.

- Romantic or sexual relationships between residents are strongly discouraged during early recovery and may be addressed in accountability conversations if they become disruptive to the community.

Crisis Safety Protocol

If you or another resident is in crisis:

- Call 911 if there is immediate danger to life.

- Contact the House Manager or on-call peer leader immediately.

- Call Iowa Substance Use Crisis Line: 1-844-775-5837 (24/7)

- Call National Crisis Lifeline: 988 (call or text, 24/7)

- Do not leave a person in crisis alone.

- Document the situation and notify Grace House leadership as soon as possible.

Mandatory Reporting

Grace House staff and peer leaders are required by Iowa law to report suspected child abuse or neglect, and suspected abuse or neglect of a dependent adult, to the Iowa Department of Health and Human Services. This is not optional. If you are concerned about a child or vulnerable adult in your life, please speak with the House Manager confidentially.

Discharge Policies

Leaving Grace House — whether planned or unplanned — is handled with dignity and care. Our goal is always to support successful transitions, not punitive exits.

Planned (Voluntary) Discharge

When a resident is ready to move to the next chapter — independent housing, transitional housing, reconnection with family — we celebrate that step.

- Please provide at least 14 days' written notice to the House Manager.

- Your final day and departure plan will be documented.

- A transition planning meeting will be offered to help you connect to ongoing recovery support, housing resources, and community services.

- You are always welcome to return to Grace House events and community as an alum.

Administrative Discharge

Situations may arise that require the house to initiate a discharge. These decisions are made with care and are never taken lightly.

Grounds for Administrative Discharge

- Non-payment of program fees (after documented attempts at payment planning).

- Sustained, documented refusal to engage in recovery participation requirements.

- Behaviors that pose a documented, ongoing safety risk to other residents.

- Court-ordered removal from the residence.

Discharge Process

- The House Manager will document the specific concern with dates, descriptions, and prior interventions.

- A conversation will be held with the resident before a discharge decision is made, whenever safety permits.

- A written notice of discharge will be provided with a minimum of 7 days' notice, except in emergency situations.

- A transition planning meeting will be offered within 24 hours of notice.

- Resources for alternative housing, crisis support, and recovery services will be provided in writing.

Emergency Discharge

In situations involving immediate safety, emergency discharge may occur without advance notice. Emergency discharge may be initiated when:

- A resident has engaged in physical violence or credible threats of violence against another resident or staff.

- A resident has introduced illegal substances into the home in a way that poses immediate risk to others.

- A resident's behavior creates an immediate and documented safety emergency that cannot be otherwise managed.

Even in emergency discharge situations, the resident will receive written documentation of the reason, a referral to emergency housing resources, and information about the grievance process.

Discharge Resource Support

Regardless of the type of discharge, every departing resident will receive:

- Written referral list for housing resources in the Des Moines area

- Contact information for Iowa 211 (housing, crisis, and basic needs navigation)

- Recovery support referrals

- Written documentation of their stay at Grace House for use in housing applications

Return-to-Use Response Framework

We reject the word 'relapse' as a moral verdict. A return to use is a medical and behavioral event — not a character failure, not an identity statement, and not the end of someone's recovery story.

Grace House's response to return-to-use events is grounded in science, compassion, and a genuine commitment to the person's recovery — not compliance theater.

Guiding Principles

> What We Believe About Return-to-Use
> Return to use is a common, documented part of the recovery process for many people — not a sign of failure.
> The response to return-to-use shapes whether a person survives and stays engaged with recovery, or disengages out of shame.
> Our goal is always to keep the person connected to support, even if circumstances require a temporary change in housing.
> Disclosure of a return-to-use event, or help-seeking behavior, is never punished — it is encouraged and supported.
> We apply harm reduction principles at all times to reduce the risk of overdose and serious harm.

Immediate Response Protocol

When a return-to-use event is identified:

- Ensure immediate safety. If the resident is in medical distress, call 911 immediately. Naloxone (Narcan) is available in the house medicine cabinet.

- Contact the House Manager or on-call peer leader.

- Reduce judgment and increase connection. Meet the resident where they are with compassion.

- Conduct a substance-free verification before the resident re-enters shared spaces.

- Schedule a care conversation within 24 hours to assess needs, risks, and next steps.

Care Conversation Framework

Within 24–48 hours of a confirmed return-to-use event, the House Manager or senior peer mentor will conduct a care conversation with the resident. This conversation is not a disciplinary hearing — it is a recovery conversation.

The conversation will explore:

- What happened, and what circumstances surrounded it?

- Is the resident safe? Are there immediate medical concerns?

- What does the resident need right now to get stable?

- What do they want their next step to be?

- What changes to the resident's recovery plan might help?

- Is a higher level of care (detox, residential treatment) needed?

Housing Determination

A return-to-use event does not automatically result in discharge. The following framework guides the decision:

| Situation | Likely Response |
| --- | --- |
| First event, resident discloses voluntarily, no safety risk, seeking help | Remain in house. Intensified recovery support. Possible clinical referral. |
| First event, discovered rather than disclosed, resident engaged and remorseful | Remain in house with enhanced accountability plan and weekly check-ins. |
| Event involves substances brought into house (risk to others) | Temporary housing pause while safety plan is developed. Return possible with agreement. |
| Repeated events with escalating risk, limited engagement | Care referral for higher level of care. Support transition to appropriate setting. Door remains open. |
| Overdose or medical emergency | Immediate medical response. 72-hour stabilization support. Care conference to determine next steps. |

Return After Treatment

Any resident who departs for a higher level of care (detox, residential treatment, stabilization center) is welcome to return to Grace House upon completing that level of care, subject to bed availability. Prior residency at Grace House is considered a strong positive factor in any return application.

> Naloxone (Narcan) Policy
> Naloxone is available in the Grace House medication cabinet and near the front door.
> All residents will receive naloxone training within 7 days of intake.
> Good Samaritan protection applies under Iowa law — you will not face legal consequences for calling for help during an overdose.
> Administering naloxone to someone in need is never a violation of house policy.
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'resident_handbook'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'fee_schedule_financial_agreement', 'Fee Schedule & Financial Agreement', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Fee Schedule & Financial Agreement

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Current Fee Schedule (Policy GH-FEES-001)

| Room type | Weekly rate | Monthly prepay (due at start of month) |
| --- | --- | --- |
| Shared (double) room | $175 / week | $650 / month |
| Single (private) room | $200 / week | $700 / month |

Program fees cover housing, utilities, household supplies, and program participation. Grace House is a program participation fee model — not a landlord-tenant lease.

## My Agreement

My room type: [ ] Shared — $175/wk or $650/mo prepay [ ] Single — $200/wk or $700/mo prepay

Payment cadence: [ ] Weekly, due each ______________ (day) [ ] Monthly prepay, due the 1st

Payment methods: [ ] Cash [ ] Money order [ ] Electronic transfer (details from House Manager)

I understand and agree:

- Fees are due on the agreed day. If I anticipate difficulty, I will speak with the House Manager before the due date — hardship payment plans are always available and never punitive.

- Non-payment for more than 7 days without an approved plan may begin an administrative review.

- Fees are non-refundable for the current period except in emergency or administrative error.

- Grace House never manages, holds, or controls my personal finances.

- My fee continues during an approved furlough (my bed is held).

## Payment Record

| Date | Amount | Method | Period covered | Receipt # | Staff initials |
| --- | --- | --- | --- | --- | --- |
| ______ | $______ | ________ | ____________ | ________ | ______ |
| ______ | $______ | ________ | ____________ | ________ | ______ |
| ______ | $______ | ________ | ____________ | ________ | ______ |

Participant signature: ______________________________ Date: ____/____/______

House Manager signature: ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'fee_schedule_financial_agreement'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'screening_policy_consent', 'Drug & Alcohol Screening Policy & Consent', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Drug & Alcohol Screening Policy & Consent

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Purpose

Screening protects the substance-free environment every resident depends on. It is a community-safety tool, not a surveillance or punishment tool.

## Schedule

- Phase 1 (Days 1–30): upon intake, then randomly up to twice weekly.

- Phase 2 (Days 31–90): once weekly (random day).

- Phase 3 (Days 91+): randomly, minimum once monthly.

- For cause: at any time based on observable, documented indicators.

- Return-to-use follow-up: per the individualized support plan.

## Standards

- Same-gender observation only where observation is used; dignity preserved at every step.

- Prescribed MAT/MOUD and disclosed prescriptions are recorded as prescription-consistent — never as violations (see Medication Policy).

- A refused screen is treated as a positive result.

- A positive result triggers the Return-to-Use Response Policy — a support conversation and safety assessment, not automatic discharge.

- Results are confidential: House Manager and Executive Director access only; stored in the locked/encrypted resident file; retained per records policy.

## Screening Log Entry (per event)

Resident: ______________ Date: ______ Time: ______ Type: [ ] scheduled [ ] random [ ] for cause [ ] follow-up

Method: [ ] urine dipstick [ ] lab [ ] oral swab [ ] breathalyzer Result: [ ] negative [ ] prescription-consistent [ ] positive [ ] refused [ ] invalid

Substances (if any): ______________ Resident acknowledgment: __________ Staff: __________

## Consent

I consent to drug and alcohol screening according to this policy. I understand refusal is treated as a positive result, that my prescribed medications are protected, and that a positive result initiates a supportive response process.

Participant signature: ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'screening_policy_consent'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'medication_mat_moud_policy', 'Medication & MAT/MOUD Policy', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Medication & MAT/MOUD Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Policy Statement

Grace House affirms and supports all FDA-approved medications for substance use disorders and mental health conditions, including methadone, buprenorphine/naloxone (Suboxone), naltrexone (Vivitrol), and all prescribed psychiatric medications. Taking prescribed medication as directed is never a program violation, never grounds for exclusion, and never treated as “not really being in recovery.” (Iowa HHS Checklist Item 6; NARR Standard: multiple pathways.)

## Participant Responsibilities

- Disclose all prescription medications to the House Manager at intake and whenever prescriptions change.

- Store all medications in your personal lockbox or the house medication safe. Controlled medications must be stored in the house safe with a logged count.

- Take medications only as prescribed; never share medication with any other resident — sharing is an immediate-removal safety violation.

- Dispose of expired/discontinued medication through the House Manager (take-back protocol).

## Medication Disclosure Log

| Medication | Dosage | Prescriber | Pharmacy | Storage (lockbox/safe) |
| --- | --- | --- | --- | --- |
| ____________ | ________ | ____________ | ____________ | ________ |
| ____________ | ________ | ____________ | ____________ | ________ |
| ____________ | ________ | ____________ | ____________ | ________ |
| ____________ | ________ | ____________ | ____________ | ________ |

## Controlled Medication Count Log (house safe)

| Date | Medication | Count in | Count verified | Resident initials | Staff initials |
| --- | --- | --- | --- | --- | --- |
| ______ | ____________ | ______ | ______ | ______ | ______ |
| ______ | ____________ | ______ | ______ | ______ | ______ |

## Drug Screening Interaction

Prescribed MAT/MOUD medications that appear on a drug screen are recorded as prescription-consistent results, not positives. Verification is by prescriber confirmation on file.

Participant signature: ______________________________ Date: ____/____/______

House Manager signature: ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'medication_mat_moud_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'curfew_pass_policy', 'Curfew & Pass Policy + Request Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Curfew & Pass Policy + Overnight Pass / Furlough Request Form

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Curfew Policy (GH-CURFEW-001 v3.0 — supersedes all prior versions)

| Phase | Weeknight (Sun–Thu) | Weekend (Fri–Sat) |
| --- | --- | --- |
| Phase 1 (Days 1–30) | 9:00 PM | 10:00 PM |
| Phase 2 (Days 31–90) | 10:00 PM | 11:00 PM |
| Phase 3 (Days 91+) | 11:00 PM | Midnight |

- Hard ceiling: no curfew extends past midnight in any phase.

- The only exception is current employment. A verified work schedule on file with the House Manager adjusts curfew for scheduled shifts plus reasonable travel time. No other exceptions.

- More than three curfew violations in 30 days results in a community accountability conversation and possible phase-curfew reset.

## Overnight Pass / Furlough

- Available after 60 days of residency, in good standing.

- Written request 48 hours in advance; bed is held; weekly fee continues.

- Check-in expectations during leave are set at approval.

## Request Form

Resident: ______________________________ Phase: ____ Days in residence: ______

Type: [ ] Employment curfew adjustment (attach schedule) [ ] Overnight pass [ ] Furlough (multi-night)

Dates: from ____/____/______ to ____/____/______

Destination & host: ______________________________________________

Contact number during leave: ______________________

Reason: [ ] Family visit [ ] Family emergency [ ] Medical [ ] Court [ ] Employment [ ] Other: __________

Support plan while away (meetings, coach contact, medication plan):

Resident signature: ______________________ Date: ______

Decision: [ ] Approved [ ] Approved with conditions: ______________ [ ] Not approved — reason: ______________

House Manager: ______________________ Date: ______ Return confirmed: ______ (date/initials)
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'curfew_pass_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'return_to_use_response_policy', 'Return-to-Use Response Policy', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Return-to-Use Response Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Principle

A return to use is a medical and recovery event — not a moral failure and not automatic discharge. Grace House responds with safety first, dignity always, and an individualized plan.

## Immediate Response

- Safety assessment: Is the participant medically stable? If in doubt, call 911. Naloxone locations are posted; any suspected overdose follows the Emergency Response Protocols.

- Substance removal: any substances on the property are removed and disposed of.

- Private conversation: one-on-one, non-judgmental. “What do you need right now?”

- Community protection: other residents’ safety and recovery are assessed and protected.

## Individualized Support Pathways (chosen by assessment, not formula)

- Remain in residence with an intensified support plan (increased coach contact, added recovery activities, follow-up screening).

- Brief clinical stabilization (detox/withdrawal management) with the bed held where possible and a warm handoff both directions.

- Transition to a higher level of care with a documented re-entry pathway.

## Considerations for Removal

Removal is considered only when a participant refuses to engage with support after a return to use, continues active use, brings substances into the residence, or endangers another resident’s life or recovery. Any removal follows the canonical removal standard and is documented, reviewable through the grievance process, and carried out with dignity — including connection to alternative housing or care whenever possible.

## Documentation

Date/discovery method · participant’s account and stated needs · safety assessment · support plan and referrals · follow-up timeline. Confidential file; incident report if safety events occurred.

Acknowledged (participant): ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'return_to_use_response_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'grievance_policy_form', 'Grievance Procedure & Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', $docbody$# GRACE FOR ADDICTIONS

## Grace House Grievance Procedure

Effective Date: February 3, 2026  
Version: 1.0  
Review Date: February 3, 2027

## PURPOSE

Grace For Addictions is committed to treating all participants with dignity, respect, and fairness. This Grievance Procedure provides a formal process for participants to raise concerns, file complaints, and seek resolution when they believe they have been treated unfairly or when house policies have been violated.

You have the right to file a grievance without fear of retaliation.

## CORE PRINCIPLES

### ✅ YOUR RIGHTS:

- Right to be heard: Your concerns matter and will be taken seriously

- Right to fairness: You will receive an impartial review

- Right to appeal: If you disagree with the resolution, you can appeal

- Right to support: You may have someone support you through the process

- Right to protection: You will not face retaliation for filing a grievance

### ✅ OUR COMMITMENT:

- We will listen with openness and respect

- We will investigate thoroughly and fairly

- We will respond in a timely manner

- We will maintain confidentiality (within legal limits)

- We will use grievances to improve our program

## WHAT IS A GRIEVANCE?

### A GRIEVANCE IS A FORMAL COMPLAINT ABOUT:

Treatment by Staff: - Disrespectful or discriminatory treatment - Staff not following program policies - Violation of your rights - Unfair discipline or consequences - Confidentiality breach

Program Policies or Procedures: - Unclear or unfair house rules - Inconsistent enforcement of policies - Accommodation requests denied - Discharge decisions - Financial issues (fees, payment disputes)

Living Conditions: - Safety concerns not addressed - Maintenance or cleanliness issues - Roommate conflicts not resolved - Inadequate food or supplies - Access to services or resources

Conflicts with Other Participants: - Harassment or bullying - Violation of your personal boundaries - Theft of your property - Behavior affecting your recovery

Medication or Treatment Issues: - Medication access denied (including MOUD) - Treatment choice restrictions - Medical needs not accommodated

Discrimination: - Treatment based on race, color, religion, sex, gender identity, sexual orientation, national origin, age, or disability

## WHAT IS NOT APPROPRIATE FOR GRIEVANCE PROCEDURE?

These issues should be addressed through other processes:

- Emergency safety concerns → Report immediately to staff, call 911 if needed

- Minor day-to-day issues → Talk directly with peer coach or House Manager first

- Disagreement with policies you understood and agreed to → Discuss with staff, but policies apply to all participants equally

- Criminal activity → Report to police

- Abuse of a child or vulnerable adult → Report to Iowa DHS Abuse Hotline: 1-800-362-2178

However, if you tried these other processes and the issue is still not resolved, you may file a grievance.

## INFORMAL RESOLUTION (Always Try This First)

Before filing a formal grievance, we encourage you to:

### STEP 1: Talk to Staff Directly

If your concern involves a specific staff member or situation: - Request a private conversation with your peer coach or House Manager - Explain your concern clearly and calmly - Listen to their perspective - Work together to find a solution

Most concerns can be resolved through direct conversation.

### STEP 2: Request a Meeting

If talking informally doesn’t resolve the issue: - Request a formal meeting with House Manager - Bring a support person if you wish (another participant, friend, family member) - Clearly state your concern and what resolution you’re seeking - Allow House Manager time to investigate and respond

Timeline: House Manager should respond within 3 business days of your meeting

### STEP 3: Request Mediation

If you and staff can’t agree on resolution: - Request a mediation meeting with Executive Director present - Bring a support person if you wish - Aim for mutual understanding and compromise

Timeline: Mediation should occur within 5 business days

## FORMAL GRIEVANCE PROCESS (If Informal Resolution Fails)

### WHEN TO FILE A FORMAL GRIEVANCE:

- You’ve tried informal resolution and it didn’t work

- The concern is serious enough to require formal investigation

- You’re not comfortable addressing the issue informally

- Your concern involves the House Manager (file directly with Executive Director)

- You want a written record and response

## STEP 1: FILE YOUR GRIEVANCE (In Writing)

### HOW TO FILE:

Option A: Complete Grievance Form - Grievance Forms are available from any staff member, posted in common area, or from Executive Director - You may complete the form yourself or ask staff to help you write it - Staff who help you write it will not read it unless you give permission

Option B: Write a Letter - If you prefer, you can write your grievance in a letter instead of using the form - Include all information listed on the form (see below)

Option C: Anonymous Grievance - You may file anonymously by placing your written grievance in the locked suggestion box - Note: Anonymous grievances are harder to investigate and we cannot respond directly to you

### WHAT TO INCLUDE IN YOUR GRIEVANCE:

Required Information: 1. Your name (unless filing anonymously) 2. Date you’re filing 3. Description of what happened (who, what, when, where) 4. Why you believe this is unfair or violates policy 5. What resolution you’re seeking (what would fix this?) 6. Any attempts you made to resolve informally 7. Names of witnesses (if any) 8. Your signature (unless anonymous)

Be as specific as possible. The more detail you provide, the better we can investigate.

### WHERE TO SUBMIT:

If your grievance involves any staff EXCEPT the Executive Director: - Submit to: Executive Director - Place in sealed envelope marked “Confidential Grievance” - Hand deliver to Executive Director’s office or mail to: Grace For Addictions  
Attn: Executive Director - Grievance  
1311 9th Street  
Des Moines, Iowa 50309

If your grievance involves the Executive Director: - Submit to: Board Chair - Place in sealed envelope marked “Confidential Grievance — Board Chair” - Mail to: Grace For Addictions — Attn: Board Chair, 1311 9th Street, Des Moines, Iowa 50314 (marked “Confidential”)

## STEP 2: ACKNOWLEDGMENT (Within 2 Business Days)

What happens when you file:

- Executive Director (or Board Chair) will acknowledge receipt of your grievance in writing

- You’ll be informed of the expected timeline for investigation

- You may be asked to provide additional information or clarification

- You’ll be told who is investigating (will be someone impartial)

If you need accommodation (language interpretation, disability accommodation, etc.) to participate in the grievance process, let us know immediately. We will provide it.

## STEP 3: INVESTIGATION (Within 5-10 Business Days)

The investigator will:

- Review your written grievance

- Interview you (you may bring a support person)

- Interview any witnesses you named

- Interview staff involved

- Review relevant documents (participant file, incident reports, policies)

- Examine physical evidence if applicable (room conditions, etc.)

- Consider all perspectives fairly

During the investigation: - You may be asked for additional information - You will not face retaliation for filing - You should continue following house rules and expectations - Separate you from the person involved if needed for safety/comfort

Confidentiality: The investigation will be kept as confidential as possible, but some information may need to be shared to conduct a fair investigation.

## STEP 4: DECISION & WRITTEN RESPONSE (Within 5 Business Days After Investigation)

You will receive a written decision that includes:

### FINDINGS:

- Summary of your grievance

- Summary of investigation

- Determination: ☐ Grievance is UPHELD (you were right) ☐ Grievance is PARTIALLY UPHELD (you were partially right) ☐ Grievance is NOT UPHELD (concern not substantiated)

### REASONING:

- Explanation of why this decision was made

- Which policies or facts support the decision

### RESOLUTION/ACTION TAKEN:

- If upheld: What will be done to address your concern?

- Policy change

- Staff discipline/retraining

- Accommodation provided

- Apology

- Corrective action

- If not upheld: Explanation of why current situation is appropriate

### YOUR RIGHT TO APPEAL:

- You will be informed of your right to appeal if you disagree

- Instructions for how to file an appeal

- Deadline for filing appeal (10 business days)

## STEP 5: APPEAL (If You Disagree with the Decision)

### YOU HAVE THE RIGHT TO APPEAL IF:

- You believe the investigation was incomplete or unfair

- You have new information that wasn’t considered

- You believe the decision was wrong

- You disagree with the resolution

### HOW TO FILE AN APPEAL:

Timeline: You must file your appeal within 10 business days of receiving the written decision

Submit to: - If original decision was by Executive Director → Appeal to Board of Directors - If original decision was by Board Chair → Appeal to Full Board of Directors

What to include in your appeal: 1. Copy of original grievance 2. Copy of decision you’re appealing 3. Why you disagree with the decision 4. What new information you have (if any) 5. What resolution you’re still seeking 6. Your signature and date

Where to submit: - Mail to: Grace For Addictions Board of Directors  
Attn: Grievance Appeal  
1311 9th Street  
Des Moines, Iowa 50309 - Or hand-deliver in sealed envelope marked “Confidential Appeal”

## STEP 6: BOARD REVIEW (Within 15 Business Days)

The Board of Directors will:

- Review all documentation (original grievance, investigation notes, decision, your appeal)

- May request additional information from you or staff

- May conduct additional investigation if needed

- Meet to discuss and vote on final decision

You may be invited to present your case in person to the Board (you may bring a support person)

The Board’s decision is FINAL. There is no further appeal within Grace For Addictions.

## STEP 7: FINAL DECISION (Written Response Within 5 Days of Board Meeting)

You will receive a written final decision that includes:

- Summary of your appeal

- Board’s findings

- Final decision: ☐ Appeal GRANTED (original decision overturned) ☐ Appeal DENIED (original decision stands) ☐ Modified decision (partial change)

- Reasoning for decision

- Actions to be taken (if any)

This is the end of Grace For Addictions’ internal grievance process.

## IF YOU’RE STILL NOT SATISFIED: EXTERNAL RESOURCES

If you have exhausted the internal grievance process and remain unsatisfied, you have the right to file complaints with external agencies:

### IOWA HHS RECOVERY HOUSING:

For concerns about certification standards or program operations: - Email: recoveryhousing@hhs.iowa.gov - Phone: Office 515-220-8771 · Toll-Free (877) 295-2535 - Mailing Address: Iowa Department of Health and Human Services  
Recovery Housing Program  
1311 9th Street, Des Moines, Iowa 50314

### NARR/MCRSP (CERTIFICATION BODY):

For concerns about recovery housing standards: - Missouri Coalition of Recovery Support Providers (MCRSP) - Office 515-220-8771 · thomas@graceforaddictions.org

### IOWA CIVIL RIGHTS COMMISSION:

For discrimination complaints: - Phone: 515-281-4121 or 1-800-457-4416 - Online: https://icrc.iowa.gov/file-complaint - Address: Iowa Civil Rights Commission  
400 E 14th St  
Des Moines, IA 50319

### DISABILITY RIGHTS IOWA:

For disability discrimination or accommodation issues: - Phone: 515-278-2502 or 1-800-779-2502 - Online: https://disabilityrightsiowa.org - Address: Disability Rights Iowa  
400 E Court Ave, Suite 300  
Des Moines, IA 50309

### LEGAL AID:

For free legal assistance if you believe your rights have been violated: - Iowa Legal Aid: 1-800-532-1275 - Online: https://www.iowalegalaid.org

## PROTECTION FROM RETALIATION

### YOU WILL NOT BE PUNISHED FOR FILING A GRIEVANCE

Retaliation includes: - Immediate discharge after filing grievance (unless safety issue unrelated to grievance) - Increased discipline or scrutiny - Harassment or intimidation - Denial of services or privileges - Negative comments or gossip about you filing - Pressure to withdraw your grievance

If you experience retaliation: - Document what happened - Report immediately to Executive Director (or Board Chair if ED is involved) - File a separate grievance about retaliation

Retaliation is a serious policy violation and will result in staff discipline up to and including termination.

## GRIEVANCE TRACKING & CONFIDENTIALITY

### CONFIDENTIALITY:

Who has access to grievance records: - Executive Director - Investigator assigned to grievance - Board members (if appealed to Board) - Staff directly involved in the grievance - Legal counsel (if needed)

Your grievance will NOT be: - Discussed with other participants - Posted publicly - Shared with people not involved in investigation - Used against you in your participant file (unless relevant to discharge for cause)

### DOCUMENTATION:

All grievances are documented and tracked for: - Ensuring timely response - Identifying patterns or systemic issues - Program improvement - Accountability

Records are kept for: 7 years in secure, confidential files

## SPECIAL SITUATIONS

### IF YOU’RE DISCHARGED BEFORE GRIEVANCE IS RESOLVED:

- Your grievance will still be investigated

- You will still receive a written response

- If upheld, you may be offered opportunity to return to Grace House (if space available)

### IF YOU LEAVE VOLUNTARILY BEFORE GRIEVANCE IS RESOLVED:

- You may continue the grievance process

- You will receive written responses at your forwarding address

- If you have no forwarding address, responses will be held for 30 days

### IF YOUR GRIEVANCE INVOLVES MULTIPLE PEOPLE:

- You may file together (class grievance) or separately

- Each person’s concerns will be addressed

- Resolution may be different for each person depending on individual circumstances

### IF YOU NEED HELP FILING:

- Any staff member can provide a blank form

- Family member or friend can help you write it

- You can ask for assistance from peer coach (they won’t read it without your permission)

- Iowa Legal Aid may provide assistance: 1-800-532-1275

## GRIEVANCE FORM

Complete this form to file a formal grievance.

### YOUR INFORMATION:

Your Name: ____________________________________________  
(Leave blank if filing anonymously)

Date: _________________________________________________

Room Number: _________________________________________

Best way to contact you with updates:  
☐ In-person meeting  
☐ Phone: _______________________________________________  
☐ Email: _______________________________________________  
☐ Written note delivered to me

### YOUR CONCERN:

1. What is your grievance about? (Check all that apply)

☐ Treatment by staff (disrespectful, unfair, discriminatory)  
☐ Program policy or procedure (unfair rule, inconsistent enforcement)  
☐ Living conditions (safety, maintenance, cleanliness)  
☐ Conflict with another participant  
☐ Medication or treatment access  
☐ Discrimination (race, gender, religion, disability, sexual orientation, etc.)  
☐ Financial issue (fees, payment)  
☐ Discharge decision  
☐ Privacy/confidentiality violation  
☐ Other: ______________________________________________

2. Describe what happened. Be as specific as possible.  
(Who was involved? What happened? When did it happen? Where did it happen?)

3. Why do you believe this was unfair or wrong?  
(Which policy was violated? Why was this treatment inappropriate?)

4. Have you tried to resolve this informally? ☐ Yes ☐ No

If yes, what did you try?

☐ Talked to peer coach  
☐ Talked to House Manager  
☐ Requested meeting with Executive Director  
☐ Other: ______________________________________________

What was the result of these attempts?

5. Were there any witnesses? ☐ Yes ☐ No

If yes, please list their names:

6. What would resolve this concern for you?  
(What specific action do you want taken?)

☐ Apology  
☐ Policy change  
☐ Staff discipline  
☐ Change in my consequences/discipline  
☐ Accommodation for my needs  
☐ Financial adjustment  
☐ Other: ______________________________________________

Explain:

7. Is there anything else we should know?

### SIGNATURE:

I certify that the information I have provided is true and accurate to the best of my knowledge.

Signature: ___________________________________________  
(Leave blank if filing anonymously)

Date: _______________________________________________

### FOR OFFICE USE ONLY:

Date Received: __________________________________________

Received By: ___________________________________________

Assigned To: ___________________________________________

Acknowledgment Sent: ☐ Yes — Date: ___________________

Investigation Complete: ☐ Yes — Date: __________________

Decision Sent: ☐ Yes — Date: _________________________

Appeal Filed: ☐ Yes ☐ No

Final Resolution Date: ____________________________________

## GRIEVANCE FORM SUBMISSION

Submit completed form to:

Executive Director  
Grace For Addictions  
1311 9th Street  
Des Moines, Iowa 50309

Or hand-deliver in sealed envelope marked “Confidential Grievance”

Questions about the grievance process?  
Ask any staff member or contact the Executive Director

## PROGRAM IMPROVEMENT

Your feedback makes us better.

All grievances are reviewed regularly to identify: - Training needs for staff - Policy clarifications or changes needed - Communication improvements - Service gaps - Systemic issues

Even if your individual grievance is not upheld, your feedback helps us improve for everyone.

Approved By:

_____________________________ Date: ___________  
Executive Director

_____________________________ Date: ___________  
Board Chair

Grace For Addictions | Grace House  
Grievance Procedure — Version 1.0  
Effective: February 3, 2026

Your voice matters. Your rights matter. We are committed to listening and responding with fairness and respect.
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'grievance_policy_form'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'incident_report_system', 'Incident Report System', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', $docbody$# GRACE FOR ADDICTIONS

## Grace House Incident Report System

Effective Date: February 3, 2026  
Version: 1.0  
Review Date: August 3, 2026

## PURPOSE

This Incident Report System ensures that all significant events, safety concerns, and emergencies at Grace House are properly documented, reviewed, and addressed. Comprehensive documentation protects participants, staff, and the organization, and provides opportunities for learning and continuous improvement.

Key Principles: - Safety First: Immediate response takes priority over documentation - Thorough Documentation: Capture facts accurately and completely - Timely Reporting: Document incidents as soon as safely possible - Confidentiality: Incident reports are confidential and stored securely - Learning Culture: Reports are used for improvement, not punishment - Legal Protection: Proper documentation protects all parties

## WHAT IS AN INCIDENT?

### INCIDENTS THAT MUST BE REPORTED:

Medical Emergencies: - Overdose or suspected overdose - Naloxone (Narcan) administration - 911 calls for medical reasons - Transport to emergency room - Serious injury (requiring medical attention) - Hospitalization (psychiatric or medical) - Death (call Executive Director immediately)

Safety Incidents: - Violence or physical altercation - Threats of violence - Weapons on property - Police involvement - Fire or property damage - Missing participant (gone longer than expected without contact)

Behavioral/Clinical Incidents: - Suicide threat or attempt - Self-harm - Return to use/substance use - Severe mental health crisis - Medication error (wrong dose, wrong person, etc.)

Policy Violations: - Bringing substances onto property - Violation of non-negotiable house rules - Sexual misconduct or harassment - Theft - Immediate discharge

Other Reportable Events: - Allegation of abuse or neglect (by staff or participant) - Participant injury (even if no medical treatment sought) - Significant conflict between participants - Environmental hazard (gas leak, flooding, etc.) - Any event that could result in insurance claim - Media inquiry or attention

## REPORTING TIMELINE

### IMMEDIATE (During or Immediately After Incident):

- Focus on safety and emergency response FIRST

- Call 911 if needed

- Follow emergency protocols

- Secure the environment

- Brief documentation of key facts (who, what, when, where)

### WITHIN 2-4 HOURS:

- Complete full Incident Report Form

- Notify House Manager and/or Executive Director (see notification requirements)

- Provide copy to relevant staff

### WITHIN 24 HOURS:

- Follow-up documentation (participant check-in, medical updates, etc.)

- File incident report in secure location

- Ensure all required notifications completed

- Begin action plan or corrective measures if needed

### WITHIN 1 WEEK:

- Leadership review of incident

- Debrief with staff involved

- Lessons learned discussion

- Policy/protocol adjustments if needed

- Follow-up with participant(s) involved

## NOTIFICATION REQUIREMENTS

### IMMEDIATE NOTIFICATION (Call Immediately):

Executive Director must be notified immediately for: - Death - Serious injury requiring hospitalization - Suicide attempt - Police involvement - Weapons on property - Significant violence - Allegation of abuse/neglect by staff - Media inquiry - Any incident with potential legal ramifications

House Manager must be notified immediately for: - All incidents requiring 911 - Any emergency protocol activation - Naloxone administration - Missing participant - Immediate discharge situation - Significant property damage

### WITHIN 24 HOURS NOTIFICATION:

Insurance Provider (if applicable): - Injury to participant or visitor - Property damage - Any incident that could result in claim - (Follow your insurance policy’s specific requirements)

Iowa HHS Recovery Housing (if required): - Death - Serious injury - Abuse/neglect allegations - Loss of certification status - (Confirm specific reporting requirements with Iowa HHS)

Participant’s Emergency Contact (with participant’s consent): - Hospitalization - Serious safety concern - Discharge - At participant’s request

## INCIDENT REPORT FORM

Instructions: Complete this form as soon as possible after ensuring immediate safety. Be factual, objective, and thorough. Do not include speculation or opinions—only observable facts.

### SECTION 1: BASIC INFORMATION

Report Date & Time: ______________________________________

Incident Date & Time: _____________________________________

Location: ☐ Grace House ☐ Off-site (specify): ______________

Type of Incident: (Check all that apply) ☐ Medical Emergency ☐ Overdose/Naloxone Administration ☐ Suicide Threat/Attempt ☐ Violence/Physical Altercation ☐ Return to use/Substance Use ☐ Missing Participant ☐ Police Involvement ☐ Policy Violation ☐ Property Damage ☐ Medication Error ☐ Injury (no medical transport) ☐ Other: __________________________________________________

Severity Level: ☐ Critical (life-threatening, requires immediate executive notification) ☐ High (serious safety concern, 911 called, hospitalization) ☐ Moderate (managed on-site, requires follow-up) ☐ Low (minor, resolved, documentation for records)

### SECTION 2: PARTICIPANT(S) INVOLVED

Primary Participant:

Name: ____________________________________________________ Date of Birth: ______________________________________________ Room Number: _____________________________________________

Other Participant(s) Involved:

Name: ____________________________________________________ Name: ____________________________________________________ Name: ____________________________________________________

Were other residents present/witnesses? ☐ Yes — Names: ___________________________________________ ☐ No

### SECTION 3: DETAILED DESCRIPTION

What happened? (Describe the incident in detail. Include who, what, when, where, how. Be specific and factual.)

What led up to the incident? (Context, triggers, warning signs if any)

Who was present during the incident?

Who discovered or reported the incident?

Name: ____________________________________________________ Role: ☐ Staff ☐ Participant ☐ Visitor ☐ Other: _____________

### SECTION 4: IMMEDIATE RESPONSE

Actions taken by staff: (Check all that apply and describe)

☐ Called 911 Time called: ____________________________________________ Reason: ________________________________________________

☐ Administered Naloxone (Narcan) Time administered: ______________________________________ Dose: __________________________________________________ Response: ______________________________________________ Second dose needed? ☐ Yes ☐ No

☐ Provided first aid Type: __________________________________________________

☐ Separated participants involved in conflict Where separated to: ______________________________________

☐ Secured substances/paraphernalia Description: ____________________________________________

☐ Evacuated building Reason: ________________________________________________

☐ Contacted supervisor/on-call staff Who: ___________________ Time: _______________________

☐ De-escalation techniques used Describe: _______________________________________________

☐ Participant safety plan activated Details: ________________________________________________

☐ Other actions: ___________________________________________ _______________________________________________________

### SECTION 5: EMERGENCY SERVICES RESPONSE

Was 911 called? ☐ Yes ☐ No

If yes:

EMS (Paramedics): ☐ Arrived — Time: ________________________________________ ☐ Assessment provided on-scene ☐ Transported to hospital

Hospital Name: __________________________________________

Estimated time of arrival: _________________________________

Paramedic assessment/findings: _________________________________________________________ _________________________________________________________

Police: ☐ Arrived — Time: ________________________________________ ☐ Report filed — Report #: _________________________________ ☐ Officer name: ___________________________________________ ☐ Action taken: ___________________________________________ _______________________________________________________

Fire Department: ☐ Arrived — Time: ________________________________________ ☐ Reason: ________________________________________________ ☐ Action taken: ___________________________________________

### SECTION 6: INJURIES

Was anyone injured? ☐ Yes ☐ No

If yes:

Injured Person: __________________________________________

Type of Injury: (Check all that apply) ☐ Bruise/Contusion ☐ Cut/Laceration ☐ Burn ☐ Fracture/Broken Bone ☐ Head Injury ☐ Overdose ☐ Self-Inflicted Injury ☐ Other: __________________________________________________

Location of Injury on Body: ________________________________

Description: ____________________________________________ _________________________________________________________

Treatment Provided: ☐ First aid on-site ☐ EMS assessment ☐ Emergency room visit ☐ Hospitalization ☐ No treatment needed/refused

Medical Follow-up Needed? ☐ Yes ☐ No

### SECTION 7: SUBSTANCE USE (If Applicable)

Was substance use involved? ☐ Yes ☐ No ☐ Suspected ☐ Unknown

If yes:

Substance(s) Used: ______________________________________

Method of Use: ☐ Oral ☐ Smoking ☐ Snorting ☐ Injection ☐ Unknown

Where did use occur? ☐ On Grace House property ☐ Off property (participant returned under influence) ☐ Unknown

Were substances found on property? ☐ Yes ☐ No

If yes, were substances secured/disposed of? ☐ Yes ☐ No

Participant’s Account: (If they’re willing to share) _________________________________________________________ _________________________________________________________

### SECTION 8: NOTIFICATIONS MADE

Who was notified about this incident? (Check all that apply and include time)

☐ House Manager Name: ________________________ Time: __________________

☐ Executive Director Time: __________________________________________________

☐ Participant’s Emergency Contact Name: ________________________ Time: __________________ Method: ☐ Phone ☐ Text ☐ Email Consent obtained? ☐ Yes ☐ No (emergency)

☐ Participant’s Treatment Provider Name: ________________________ Time: __________________

☐ Probation/Parole Officer Name: ________________________ Time: __________________

☐ Insurance Provider Time: __________________________________________________

☐ Iowa HHS Recovery Housing Time: __________________________________________________

☐ Other: __________________________________________________

### SECTION 9: PARTICIPANT STATEMENTS

Did the participant(s) provide a statement about what happened? ☐ Yes ☐ No ☐ Participant unable/unwilling

If yes, participant’s account in their own words:

Participant emotional state during/after incident: ☐ Calm ☐ Upset ☐ Angry ☐ Anxious ☐ Fearful ☐ Remorseful ☐ In pain ☐ Altered consciousness ☐ Other: _______________

### SECTION 10: WITNESS STATEMENTS

Were there witnesses? ☐ Yes ☐ No

Witness #1:

Name: ____________________________________________________ Role: ☐ Participant ☐ Staff ☐ Visitor ☐ Other: ____________

What did witness observe? _________________________________________________________ _________________________________________________________ _________________________________________________________

Witness Signature: _______________________________________

Witness #2:

Name: ____________________________________________________ Role: ☐ Participant ☐ Staff ☐ Visitor ☐ Other: ____________

What did witness observe? _________________________________________________________ _________________________________________________________

Witness Signature: _______________________________________

### SECTION 11: IMMEDIATE OUTCOME & FOLLOW-UP

Immediate outcome for participant(s):

☐ Remained at Grace House with increased support ☐ Transported to hospital (expected to return) ☐ Transported to hospital (admission expected) ☐ Voluntarily left Grace House ☐ Immediately discharged for safety reasons ☐ Police custody ☐ Other: __________________________________________________

Follow-up actions planned:

☐ Medical follow-up appointment scheduled for: _______________ ☐ Mental health assessment scheduled ☐ Care team meeting scheduled for: _________________________ ☐ Accountability meeting with participant ☐ Increased peer coaching frequency ☐ Return to Phase 1 support level ☐ Safety plan revision ☐ Temporary restrictions: ___________________________________ ☐ Other: __________________________________________________

Who is responsible for follow-up?

Name: ___________________ Role: __________________________

Follow-up date: __________________________________________

### SECTION 12: ENVIRONMENTAL FACTORS

Did any of the following contribute to this incident?

☐ Inadequate supervision ☐ Policy not clear ☐ Safety equipment not available (e.g., Narcan, first aid) ☐ Staff training gap ☐ Physical environment issue (lighting, safety hazard, etc.) ☐ Lack of communication ☐ Other participants’ behavior ☐ External stressor (family, legal, etc.) ☐ None — incident was not preventable ☐ Other: __________________________________________________

Describe: _________________________________________________________ _________________________________________________________

### SECTION 13: PREVENTION & LESSONS LEARNED

Could this incident have been prevented? ☐ Yes ☐ No ☐ Uncertain

If yes, what could have been done differently?

Do any policies or procedures need to be reviewed or changed? ☐ Yes — Specify: __________________________________________ ☐ No

Does any staff member need additional training? ☐ Yes — Topic: ____________________________________________ ☐ No

Other recommendations:

### SECTION 14: REPORTING STAFF INFORMATION

Report Completed By:

Name: ____________________________________________________

Title/Role: _________________________________________________

Phone: ____________________________________________________

Were you present during the incident? ☐ Yes ☐ No

If no, how did you learn about it?

Staff Signature: ___________________________________________

Date & Time Report Completed: _____________________________

### SECTION 15: SUPERVISORY REVIEW

Reviewed By:

Name: ____________________________________________________

Title: _____________________________________________________

Date Reviewed: __________________________________________

Assessment of Response: ☐ Appropriate and complete ☐ Concerns/gaps noted (see below)

Comments: _________________________________________________________ _________________________________________________________

Additional Actions Required: ☐ None ☐ Follow-up investigation needed ☐ Policy review required ☐ Staff debriefing scheduled ☐ Additional training indicated ☐ Insurance claim filed ☐ Legal consultation recommended ☐ Other: __________________________________________________

Supervisor Signature: _____________________________________

Date: ___________________________________________________

## INCIDENT REPORT FILING PROTOCOL

### CONFIDENTIAL STORAGE:

Physical Reports: - Store in locked filing cabinet in House Manager office - Label: “Confidential Incident Reports — Grace House” - Organize chronologically by incident date - Access restricted to: Executive Director, House Manager, Board Chair (if needed)

Digital Copies (if maintained): - Store in password-protected, encrypted file - File name format: YYYYMMDD_IncidentType_ParticipantInitials.pdf - Access restricted to authorized personnel only - Backup regularly to secure cloud storage

### RETENTION POLICY:

- Retain incident reports for: Minimum 7 years from date of incident

- Longer retention required for:

- Reports involving minors (retain until age 25)

- Reports with legal implications (consult attorney)

- Reports involving death or serious injury (retain permanently)

- Destruction: After retention period, shred physical reports and permanently delete digital files

### ACCESS RESTRICTIONS:

Who Can Access Incident Reports: - Executive Director (all reports) - House Manager (all reports) - Staff involved in incident (their own report only) - Board Chair (upon request for serious incidents) - Insurance investigator (with proper authorization) - Legal counsel (when needed) - Accreditation/licensing inspector (when required by law)

Participant access to their own reports: - Participant may request copy of incident report involving them - Provide redacted copy (remove other participants’ names/info if included) - Response time: Within 5 business days

## INCIDENT REVIEW PROCESS

### INDIVIDUAL INCIDENT REVIEW (Within 24-48 Hours):

Led by: House Manager or Executive Director

Participants: - Staff involved in incident - Clinical Advisor (if applicable) - Other relevant personnel

Purpose: - Debrief on response - Ensure follow-up actions are clear - Support staff emotional processing - Identify any immediate corrective actions

### MONTHLY INCIDENT SUMMARY REVIEW:

Led by: Executive Director

Review: - All incidents from previous month - Trends or patterns - Policy/procedure effectiveness - Training needs - Safety improvements needed

Action: Document findings and create action plan for improvements

### QUARTERLY BOARD REPORT:

Summary Report to Board of Directors: - Number and types of incidents (de-identified) - Serious incidents (with details) - Trends or concerns - Actions taken - Policy or program changes implemented

## STAFF SUPPORT AFTER INCIDENTS

Recognizing that responding to serious incidents is emotionally difficult:

- Immediate debrief: Within 24 hours of serious incident

- Check-in: House Manager checks in with staff within 1 week

- Critical Incident Stress Debriefing (CISD): Available for traumatic incidents (death, serious injury, violence)

- Employee Assistance Program (EAP): Staff may access counseling if available

- Peer support: Encourage staff to talk with trusted colleagues

Staff are never blamed for incidents that occur despite following protocols.

## SPECIAL REPORTING: MANDATORY REPORTER OBLIGATIONS

Iowa law requires certain individuals to report suspected abuse or neglect of vulnerable adults or children.

### IF YOU SUSPECT ABUSE/NEGLECT:

Of a Participant (Vulnerable Adult): - Report to Iowa Department of Human Services (DHS) - Adult Abuse Hotline: 1-800-362-2178 - Report within 24 hours - Also complete internal incident report

Of a Child: - Report to Iowa DHS - Child Abuse Hotline: 1-800-362-2178 - Report immediately (within 24 hours) - Also complete internal incident report

By a Staff Member: - Report immediately to Executive Director - Executive Director determines reporting to authorities - Staff member suspended pending investigation - Document thoroughly

## INCIDENT REPORT FORMS QUICK ACCESS

All staff should know where blank Incident Report Forms are located:

- Physical forms: [LOCATION, e.g., House Manager office, locked file drawer]

- Digital forms: [LOCATION, e.g., shared drive, email attachment available from House Manager]

After-hours: On-call staff can email completed report to House Manager and Executive Director by morning.

## TRAINING REQUIREMENTS

All staff must be trained on: - ✅ What constitutes a reportable incident - ✅ How to complete an Incident Report Form - ✅ Notification requirements and timelines - ✅ Confidentiality and secure storage - ✅ Mandatory reporting obligations - ✅ How to access support after traumatic incidents

Training occurs: - During new staff orientation - Annually for all staff (refresher) - After any significant incident (lessons learned review)

## CONTINUOUS IMPROVEMENT

The Incident Report System will be reviewed and updated: - Annually - After any serious incident - When regulations or best practices change - Based on staff feedback

Next Review Date: February 3, 2027

Questions about incident reporting?  
Contact: House Manager or Executive Director

Approved By:

_____________________________ Date: ___________  
Executive Director

_____________________________ Date: ___________  
House Manager

Grace For Addictions | Grace House  
Incident Report System — Version 1.0  
Effective: February 3, 2026
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'incident_report_system'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'emergency_response_protocols', 'Emergency Response Protocols', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', $docbody$# GRACE FOR ADDICTIONS

## Grace House Emergency Response Protocols

Effective Date: February 3, 2026  
Version: 1.0  
Review Date: August 3, 2026 (6-month review)

## PURPOSE

These protocols provide clear, step-by-step guidance for staff and residents responding to emergency situations at Grace House. All responses prioritize safety, dignity, and compassionate care while ensuring appropriate documentation and follow-up.

Core Principles: - Safety first — for the individual and the community - Dignity always — trauma-informed, person-first response - No automatic expulsion — support pathways, not punishment - Documentation — every incident documented for learning and accountability - Follow-up care — connection to ongoing support

## PROTOCOL 1: OVERDOSE RESPONSE

### IMMEDIATE ACTION (First 3 Minutes)

CALL 911 IMMEDIATELY if: - Person is unresponsive - Person is not breathing or breathing abnormally - Person’s lips or fingernails are blue/purple - You suspect opioid overdose

While waiting for 911:

- Check Responsiveness

- Shout the person’s name

- Rub knuckles firmly on sternum (center of chest)

- If no response → ADMINISTER NALOXONE

- Administer Naloxone (Narcan)

- Locations: Kitchen — marked drawer nearest the refrigerator; Upstairs hallway — marked cabinet

- Nasal spray: Insert tip into nostril, press plunger firmly

- Injectable: Follow instructions on packaging

- Dose: Administer 1 dose immediately

- Wait 2-3 minutes — if no response, give second dose

- Document: Time administered, dose, who administered

- Position Person Safely

- If breathing: Place in recovery position (on side)

- If not breathing: Begin rescue breathing/CPR if trained

- Stay with person until EMS arrives

- Clear Area

- Ask other residents to give space

- Secure any substances or paraphernalia (for EMS)

- Designate one staff member to meet paramedics at door

### WHEN EMS ARRIVES

- Provide clear information:

- “We administered naloxone at [state the time]”

- “First dose at [state the time]; second dose at [state the time] if applicable”

- Any known substances used (if available)

- Person’s name and emergency contact

### IMMEDIATELY AFTER

- Do NOT discharge the person for overdosing

- Once medically stable, offer:

- Peer support connection

- Treatment resource navigation

- Crisis stabilization planning

- Family/support person notification (with consent)

### DOCUMENTATION (Within 2 Hours)

Complete Incident Report including: - Time of discovery - Condition of person when found - Naloxone administration details - EMS arrival and departure times - Hospital transport (if applicable) - Notifications made (family, emergency contacts) - Follow-up plan

### FOLLOW-UP (Within 24 Hours)

- Wellness check with person (if returned to residence)

- Care team meeting to assess support needs

- Adjust care plan if needed

- Offer increased peer coaching frequency

- Review triggers and protective factors

## PROTOCOL 2: SUICIDE THREAT OR ATTEMPT

### IMMEDIATE ASSESSMENT

IF IMMEDIATE DANGER (person has means/plan/intent):

- CALL 911 IMMEDIATELY

- State clearly: “We have a mental health emergency”

- Provide address: 1311 9th Street, Des Moines, Iowa 50314

- Stay on line until help arrives

- While Waiting for 911:

- Stay with person — do not leave them alone

- Remove any means (pills, sharp objects, etc.) if safely possible

- Speak calmly and reassuringly

- Listen without judgment: “I’m here with you. You’re not alone.”

- If Person is Injured:

- Provide first aid while waiting for EMS

- Control bleeding, stabilize injuries

- Do not move person unless necessary for safety

IF PERSON EXPRESSES SUICIDAL THOUGHTS (no immediate plan/means):

- Take It Seriously — Listen

- Find private space to talk

- Use open-ended questions: “Tell me what’s happening for you right now.”

- Validate feelings: “It sounds like you’re in a lot of pain.”

- Ask directly: “Are you thinking about ending your life?”

- Assess Risk Level

- Do you have a plan? (How specific?)

- Do you have means? (Access to method?)

- Do you intend to act on it? (Timeline?)

- Have you attempted before?

- Create Safety Plan

- High Risk (yes to above): Transport to emergency room or call 988 Suicide & Crisis Lifeline together

- Moderate Risk:

- Call 988 together with person

- Connect with mental health provider (same day if possible)

- Increase supervision/check-ins

- Remove potential means

- Lower Risk:

- Safety planning with person (coping strategies, who to call)

- Schedule mental health appointment within 48 hours

- Daily check-ins with peer coach

### RESOURCES TO PROVIDE

- 988 Suicide & Crisis Lifeline: Call or text 988 (24/7)

- Your Life Iowa: 1-855-581-8111 (call or text, 24/7)

- Crisis Text Line: Text TALK to 741741

- Local Crisis Support: Your Life Iowa 1-855-581-8111 (call/text 24/7) · Broadlawns Crisis Team 515-282-5752

### DOCUMENTATION (Immediately)

Complete Incident Report including: - What person said/did - Risk assessment (plan, means, intent) - Actions taken (911, 988, safety plan) - Who was notified (emergency contact, mental health provider) - Follow-up plan

### FOLLOW-UP (Next 7 Days)

- Daily wellness checks

- Ensure mental health appointment attended

- Care team meeting to review support plan

- Consider temporary increase in support level

- Document ongoing stability

## PROTOCOL 3: VIOLENCE OR PHYSICAL ALTERCATION

### IMMEDIATE RESPONSE

PRIORITY: Stop violence, ensure safety

- Verbally Intervene First

- Use calm, firm voice

- “Stop. Everyone take a step back.”

- “This is not safe. We need to separate right now.”

- Separate Individuals

- Ask individuals to go to separate rooms

- Assign staff to stay with each person

- Do not physically restrain unless immediate threat of serious harm

- CALL 911 IF:

- Weapons are present

- Serious injury has occurred

- Violence continues despite verbal intervention

- You feel unsafe

- Secure the Environment

- Ask other residents to move to safe space

- Lock weapons/dangerous items if accessible

- Document who witnessed incident

### AFTER SEPARATION

De-escalation (with each person separately): - Allow cool-down period (15-30 minutes) - Offer water, tissues, calming space - Use calm voice, non-threatening body language - Listen to their perspective without judgment - Ask: “What do you need right now to feel safe?”

Medical Assessment: - Check both individuals for injuries - Provide first aid if needed - Call 911 for serious injuries - Offer medical care even if injuries seem minor

### IMMEDIATE CONSEQUENCE

Violence is a non-negotiable safety violation.

- Both individuals involved will be separated (different areas of house)

- Leadership will determine:

- Whether continued housing is safe for all

- Whether immediate voluntary exit is required

- Whether accountability plan is possible

If immediate exit required: - Provide referral to other housing options - Offer to contact emergency contact/family - Assist with packing belongings - Provide resource list - Do not abandon person — ensure safe transport

### DOCUMENTATION (Within 4 Hours)

Complete Incident Report including: - Description of what happened (who, what, when, where) - Witness statements (if any) - Injuries sustained - Medical care provided/refused - Police involvement (if any) - Resolution/consequences - Notifications made (family, emergency contacts, insurance)

### FOLLOW-UP (Within 24 Hours)

- Care team meeting to review incident

- Individual meetings with those involved

- Community meeting (if appropriate) to process and reinforce safety

- Review safety protocols with all residents

- Determine if policy/protocol adjustments needed

## PROTOCOL 4: Return to Substance Use

### IMPORTANT PRINCIPLE

Return to use is a medical event, not a moral failure. It is not an automatic reason for discharge.

### IMMEDIATE RESPONSE

IF PERSON IS ACTIVELY USING OR RECENTLY USED:

- Assess Medical Safety

- Is person coherent and responsive?

- Are vital signs stable?

- Is person at risk of overdose? (If yes → Overdose Protocol)

- Does person need medical attention? (If yes → call 911 or transport to ER)

- Ensure Environment Safety

- Ask person to surrender any remaining substances

- Check for paraphernalia on property

- Secure substances for disposal (do not handle directly — use gloves, bag)

- Provide Compassionate Support

- Use non-judgmental language:

- “I’m glad you’re safe right now.”

- “Thank you for being honest.”

- “Let’s figure out the next best step together.”

- Avoid shaming language:

- ❌ “You’ve ruined everything”

- ❌ “I’m disappointed in you”

- ❌ “You’ll never change”

### RESPONSE PATHWAY

Within 4 Hours: - Private conversation with peer coach or house manager - Understand what happened: - What triggered the return to use? - What was the substance? - How much was used? - Where/how was it obtained? - Assess person’s immediate needs: - Medical? - Detox support? - Increased counseling? - Medication evaluation?

Within 24 Hours: - Care team meeting (staff + person, if they wish to participate) - Options discussed: 1. Stay with increased support: - Daily check-ins - Increased peer coaching - Treatment intensification referral - Temporary restrictions (if needed for safety) 2. Higher level of care: - Referral back to treatment - Medical detox (if needed) - Intensive outpatient program - Plan to return to Grace House after stabilization 3. Voluntary transition: - Different recovery housing setting - Family support - Assisted transition with warm handoff

Decision Factors: - Person’s willingness to engage in recovery plan - Safety risk to person or community - Availability of support resources - Person’s recent stability/engagement

### WHEN DISCHARGE MAY BE REQUIRED

Return to use alone is not grounds for discharge. Discharge is considered if: - Person refuses to engage with support - Person brings substances onto property repeatedly - Person’s use creates imminent safety risk to others - Person is unable to maintain sobriety despite maximal support

Even in discharge: - Provide warm handoff to next level of care - Offer continued peer coaching (virtual) - Leave door open for return when ready - Provide resource list - Do not shame or blame

### DOCUMENTATION (Within 24 Hours)

Complete Incident Report including: - Date/time of return to use - Substance used (if known) - Medical assessment - Person’s account of what happened - Support plan developed - Referrals made - Whether person remains in housing

### FOLLOW-UP (Ongoing)

- Weekly check-ins for next 30 days

- Re-assess care plan every 2 weeks

- Celebrate progress (days substance-free)

- Adjust support as needed

## PROTOCOL 5: MEDICAL EMERGENCY (Non-Overdose)

### CALL 911 IF:

- Chest pain

- Difficulty breathing

- Severe bleeding

- Loss of consciousness

- Seizure

- Severe allergic reaction

- Broken bones

- High fever with confusion

- Any situation where you think “This needs a doctor NOW”

### WHILE WAITING FOR 911:

- Stay with person

- Provide basic first aid (if trained)

- Keep person calm and comfortable

- Gather information for EMS:

- Person’s name

- Current medications

- Allergies

- Medical conditions

- What happened

### AFTER EMS ARRIVES:

- Provide all information to paramedics

- Ask which hospital person is being transported to

- Notify emergency contact (with person’s consent if conscious)

- Assign staff member to follow up with hospital

### DOCUMENTATION (Within 4 Hours):

Complete Incident Report including: - Nature of medical emergency - Time 911 called - EMS arrival/departure - Hospital transported to - Notifications made - Follow-up plan

## PROTOCOL 6: MISSING RESIDENT

### TIMELINE FOR ACTION

If resident is not where expected and cannot be reached:

FIRST 2 HOURS: 1. Attempt to contact resident (call, text) 2. Check common areas of house 3. Ask other residents if they know whereabouts 4. Check sign-out sheet (if applicable) 5. Document: Last seen, by whom, what they were wearing

2-4 HOURS: 1. Call emergency contact/family (with consent on file) 2. Check known locations (work, appointments, friend’s house) 3. Review recent behavior for concerns (suicidal ideation, conflict, return to use risk)

4-8 HOURS: 1. Decision point: Is this a wellness concern or safety emergency? 2. If safety emergency (suicidal, recent return to use, mental health crisis): - Call 911 to request welfare check - Provide description, last known location, concerns 3. If wellness concern but not emergency: - Continue attempts to reach - Coordinate with emergency contact/family

8+ HOURS: 1. File missing person report with police 2. Provide photo, description, last known location 3. Notify insurance (if required by policy)

WHEN RESIDENT RETURNS: - Express relief, not anger: “I’m glad you’re safe” - Understand what happened - Review expectations about communication - Assess if additional support needed - Document return and any follow-up plan

## GENERAL EMERGENCY PROCEDURES

### STAFF ROLES IN EMERGENCY

On-Duty Staff: - Primary responder - Calls 911 if needed - Provides immediate care - Begins documentation

House Manager (notify immediately): - Coordinates overall response - Makes decisions about notifications - Contacts insurance/legal if needed - Ensures follow-up care

Executive Director (notify within 1 hour of serious incident): - Major medical emergencies - Police involvement - Hospitalizations - Deaths - Media inquiries

### EMERGENCY CONTACT INFORMATION

EMERGENCY SERVICES: - 911 (Police, Fire, EMS) - Non-Emergency Police (Des Moines): (515) 283-4811

CRISIS RESOURCES: - 988 Suicide & Crisis Lifeline: Call or text 988 - Your Life Iowa: 1-855-581-8111 (call or text) - Crisis Text Line: Text TALK to 741741 - National Domestic Violence Hotline: 1-800-799-7233

LOCAL RESOURCES: - Nearest ER: MercyOne Des Moines Medical Center, 1111 6th Ave, Des Moines, IA 50314 - Your Life Iowa: 1-855-581-8111 · 988 Suicide & Crisis Lifeline: 988 - Poison Control: 1-800-222-1222

INTERNAL CONTACTS: - House Manager: On-site — Residents Warmline 515-310-DIAL (3425) - Executive Director: Thomas Miller — Office 515-220-8771 - GFA President: Dave Stout — via Office 515-220-8771 - Board Chair: via Office 515-220-8771 or Toll-Free (877) 295-2535

### AFTER ANY EMERGENCY

WITHIN 24 HOURS: - Complete Incident Report - Notify insurance if required - Debrief with staff involved - Check in with other residents

WITHIN 1 WEEK: - Care team meeting to review response - Identify lessons learned - Adjust protocols if needed - Provide staff support/debriefing - Follow up with person involved

## TRAUMA-INFORMED RESPONSE PRINCIPLES

### ALWAYS:

- ✅ Remain calm and reassuring

- ✅ Use person-first, non-stigmatizing language

- ✅ Respect dignity and privacy

- ✅ Ask “What do you need?” not “What’s wrong with you?”

- ✅ Offer choices when possible

- ✅ Follow up with compassionate care

### NEVER:

- ❌ Shame, blame, or punish for crisis

- ❌ Use language like “addict,” “junkie,” “dirty,” “clean”

- ❌ Make assumptions about what happened

- ❌ Respond with anger or frustration

- ❌ Abandon person in crisis

- ❌ Discuss person’s crisis publicly without consent

## STAFF TRAINING REQUIREMENTS

All staff must be trained in: - ✅ Naloxone (Narcan) administration - ✅ Suicide risk assessment and response - ✅ De-escalation techniques - ✅ Trauma-informed care principles - ✅ Documentation requirements - ✅ Mandatory reporting (if applicable) - ✅ Emergency protocol review (every 6 months)

Training Documentation: - Staff name and signature - Date training completed - Topics covered - Trainer name

## PROTOCOL REVIEW & UPDATES

This document will be reviewed: - Every 6 months - After any serious incident - When regulations change - Based on lessons learned

Next Review Date: August 3, 2026

Approved By:

___________________________ Date: ___________  
Executive Director

___________________________ Date: ___________  
Clinical Advisor

___________________________ Date: ___________  
House Manager

## QUICK REFERENCE CARD (Post in Common Areas)

### EMERGENCY: WHEN TO CALL 911

✅ Overdose (unresponsive, not breathing)  
✅ Suicide attempt or imminent threat  
✅ Violence with weapons or serious injury  
✅ Medical emergency (chest pain, seizure, severe bleeding)  
✅ Any life-threatening situation

### NALOXONE LOCATIONS: Kitchen drawer (by refrigerator) · Upstairs hallway cabinet

### CRISIS RESOURCES:

988 Suicide & Crisis Lifeline: Call or text 988  
Your Life Iowa: 1-855-581-8111

### STAFF ON-CALL: Residents Warmline 515-310-DIAL (3425) · Office 515-220-8771

Grace For Addictions | Grace House  
Emergency Response Protocols — Version 1.0  
Effective: February 3, 2026
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'emergency_response_protocols'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'good_neighbor_policy', 'Good Neighbor Policy', true
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Good Neighbor Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Our Commitment

Grace House succeeds when our neighborhood trusts us. We commit to being among the best-kept, quietest, most considerate homes on the block. (NARR Standard: good neighbor practices.)

## Standards

- Property appearance: lawn, porch, and walkways maintained weekly; trash and bins managed on schedule; the house looks like every other well-kept home on the street.

- Noise: quiet hours 10:00 PM–7:00 AM daily; outdoor conversations moved inside after dark; no amplified sound outdoors.

- Parking: residents and guests park considerately — never blocking driveways, sidewalks, or accumulating vehicles.

- Smoking: designated rear area only; never on the front porch or sidewalk; containers emptied daily.

- Guests: visitor policy applies; gatherings stay indoors and within noise standards.

- Neighbor concerns: any neighbor may contact the House Manager (515-220-8771). Concerns are acknowledged within 24 hours, addressed promptly, and logged.

## Neighbor Concern Log

| Date | Concern | Received by | Action taken | Resolved (date) |
| --- | --- | --- | --- | --- |
| ______ | ____________________ | __________ | ____________________ | ______ |
| ______ | ____________________ | __________ | ____________________ | ______ |

Resident acknowledgment: ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'good_neighbor_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'exit_transition_policy', 'Exit & Transition Policy', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Exit & Transition Policy

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Types of Exit

- Completion / graduation — planned transition to independent living, celebrated by the community.

- Voluntary exit — a resident may leave at any time; we assist with a safe transition plan regardless of circumstances.

- Administrative removal — participants may be removed immediately upon violation of program rules or upon conduct that endangers another resident’s life or recovery. Removal is documented, reviewable through the grievance process, and carried out with dignity.

## Transition Planning (all exits)

- Housing destination identified and, where possible, verified.

- Medication transfer plan (nothing left behind, prescriptions bridged).

- Warm handoff to treatment/coaching supports; ROI-covered notifications.

- Personal property inventory and return (30-day storage for property left behind).

- Fee account settled or plan documented.

- Door-stays-open statement: eligibility for future readmission is preserved except where safety prohibits.

## Exit Record

Resident: ______________________ Exit date: ______ Type: [ ] Completion [ ] Voluntary [ ] Administrative

Destination: ______________________________ Verified: [ ] Yes [ ] No

Medications transferred: [ ] Yes [ ] N/A Property returned: [ ] Yes [ ] Stored (date: ______)

Supports notified (with ROI): ______________________________

Follow-up contact scheduled (30 days): ______ Staff: __________ ED review: __________
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'exit_transition_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'code_of_ethics', 'Code of Ethics — Staff, House Leads, Peer Mentors & Volunteers', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Code of Ethics — Staff, House Leads, Peer Mentors & Volunteers

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

Required of every person serving Grace House in any capacity. (NARR core requirement.)

I commit to:

- Primacy of residents’ interests. Every decision serves residents’ recovery, safety, and dignity first.

- Scope of role. I provide peer and operational support only. I do not diagnose, prescribe, counsel clinically, or give legal or medical advice. I connect residents to qualified providers of their choice.

- No exploitation. I will never exploit residents financially, sexually, emotionally, or for labor. I will not lend to, borrow from, sell to, or buy from residents, nor accept gifts beyond token value.

- Boundaries. No romantic or sexual relationships with residents. No dual relationships that compromise judgment. If a prior relationship exists, I disclose it immediately.

- Confidentiality. Resident information is shared only with signed consent or as required by law (mandatory reporting, imminent danger, court order). Residency itself is confidential.

- Medication respect. I affirm all FDA-approved medications and every legitimate recovery pathway. I never disparage MAT/MOUD or any resident’s chosen path.

- Honesty in records. I document truthfully, completely, and on time. I never falsify, backdate, or omit.

- Cultural humility & fair housing. I serve without discrimination and honor each person’s culture, faith, identity, and story.

- My own wellness. If I am in recovery, I maintain my own program. I model what I ask of others.

- Accountability. I report ethical concerns — including my own mistakes — promptly to the Executive Director. Retaliation for good-faith reports is itself an ethics violation.

Name: ______________________________ Role: ______________________

Signature: ______________________________ Date: ____/____/______

Executive Director: ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'code_of_ethics'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'change_course_leaders_policy', 'Change Course Leaders Policy (Partner Program)', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.2', $docbody$# Change Course Leaders Policy (Partner Program)

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.2.

## Relationship

Change Course is an independent, outside program operated separately from Grace House and Grace For Addictions. Grace House does not set, administer, or modify Change Course requirements.

## Structure and Qualification

Change Course has Leaders only — there is no “participant” tier. Qualification and acceptance as a Change Course Leader is determined solely by Change Course. Grace House plays no role in selecting, qualifying, or approving Leaders.

## Grace House Expectations for Change Course Leaders

- Change Course compliance: Leaders are expected to comply with all Change Course program requirements, including the program’s extensive Monday–Thursday participation. Those requirements belong to Change Course; questions about them go to Change Course program staff.

- Adjusted Grace House activity requirement: because Monday–Thursday Change Course programming is substantial structured recovery engagement, Grace House requires Change Course Leaders to complete only two (2) additional supportive activities per week, in place of the standard phase-based requirement (4/3/2). Qualifying activities follow the standard Grace House list; the weekly house meeting does not count.

- Everything else unchanged: house meeting attendance, curfew for current phase, coach selection with daily VRCC check-ins and phase-cadence sessions, fees, and all community standards apply to Change Course Leaders exactly as to every Grace House participant.

- Status changes: if a Leader exits or pauses Change Course, the standard phase-based activity requirement resumes the following week.

## Acknowledgment

Leader name: ______________________________ Change Course start date: ____/____/______

I understand my Grace House activity requirement is two additional supportive activities per week while I remain in active compliance with all Change Course requirements, and that my standing as a Change Course Leader is determined by Change Course.

Leader signature: ______________________________ Date: ____/____/______

House Manager: ______________________________ Date: ____/____/______
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'change_course_leaders_policy'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'narr_ii_self_assessment', 'NARR Level II Self-Assessment & Iowa HHS Alignment', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# NARR Level II Self-Assessment & Iowa HHS Checklist Alignment

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

Status: Grace House is preparing for NARR Level II certification through Iowa HHS (temporary certification via MCRSP, Missouri’s NARR affiliate). This is an internal readiness self-assessment, not a claim of current certification. Contact: recoveryhousing@hhs.iowa.gov.

## Iowa HHS Recovery Housing Eligibility Checklist (Form 470-0025) Alignment

| # | Checklist item | Grace House answer | Evidence |
| --- | --- | --- | --- |
| 1 | In operation as a recovery house ≥ 3 months | Yes / In progress toward | Operations log, resident census |
| 2 | Family-like shared living centered on peer support & service connection | Yes | Handbook Program Philosophy; house design |
| 3 | Different address/location than clinical SUD/MH treatment provider | Yes | 1311 9th Street — no co-located clinical services |
| 4 | Residents seek clinical treatment from provider of their choice | Yes | Handbook “No Coerced Affiliation”; Participant Agreement |
| 5 | Faith-based elements allow services of choice in lieu | Yes | Multiple-pathways policy; church/Bible study count as chosen activities, never mandated |
| 6 | All FDA-approved medications for SUD & MH allowed | Yes | Medication & MAT/MOUD Policy |
| 7 | Eligible residents have history of substance misuse | Yes (recovery pathway) with documented family pathway addendum | Application Part B |

## NARR Level II (Monitored) Readiness Snapshot

| Domain | Standard summary | Status | Source document |
| --- | --- | --- | --- |
| Administrative | Legal business entity; policies & procedures; ethics code | Ready | 501(c)(3); Ops Manual; Code of Ethics |
| Fiscal | Transparent fee schedule; resident receipts; no financial control of residents | Ready | Fee Schedule & Financial Agreement |
| Operations | Staffing/House Lead structure; drug screening; medication protocol | Ready | Staff Ops Manual; Screening Policy; Medication Policy |
| Recovery support | Peer support; recovery plans; activity requirements; community meetings | Ready | Handbook; IRP forms; GH-RECOVERY-001 v2.0 |
| Property | Safe/healthy residence; good neighbor policy; safety inspections | Ready | Good Neighbor Policy; Emergency Protocols; inspection log |
| Resident rights | Grievance process; rights statement; no retaliation | Ready | Grievance Policy; Handbook rights section |
| Documentation | Intake packet; incident reports; records retention | Ready | Intake Forms Package; Incident Report System |

## Pre-Certification Punch List

[ ] 3-month operations evidence assembled [ ] Certificate of insurance current [ ] Executed lease/authority documents in GFA’s name [ ] Fire/safety inspection dated within 12 months [ ] Naloxone + first aid stocked and logged [ ] Staff ethics signatures on file [ ] MCRSP application submitted via recoveryhousing@hhs.iowa.gov

Completed by: ______________________ Date: ______ ED review: ______________________
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'narr_ii_self_assessment'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'form_application_prescreening', 'Application & Pre-Screening Form', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$# Grace House Application & Pre-Screening Form

Grace House · Grace For Addictions 1311 9th Street, Des Moines, Iowa 50314 · Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · gracehouse@graceforaddictions.org

Print-ready and fillable: complete on paper or type directly into this document. Version 2.0.

## Part A — Applicant Information

Full legal name: ______________________________ Preferred name: ______________

Date of birth: ____/____/______ Phone: ______________________

Email: ______________________________ Today’s date: ____/____/______

Current living situation: [ ] Own/rent [ ] Family/friends [ ] Shelter [ ] Treatment facility [ ] Correctional facility [ ] Unhoused [ ] Other: __________

How did you hear about Grace House? [ ] Treatment provider [ ] Friend/person in recovery [ ] Court/probation [ ] 211 [ ] Website/social media [ ] Other: __________

## Part B — Eligibility Pathway (check one)

[ ] Recovery pathway — I have a personal history of substance use or misuse and I am committed to living substance-free while in residence.

[ ] Family pathway — I have a parent, partner, or child with a history of substance use disorder or mental-health-related trauma, and structured recovery-supportive housing supports our family’s healing.

## Part C — Recovery & Support (recovery pathway applicants)

Substances used (past or present): ______________________________________

Date of last use (approximate): ____/____/______

Are you currently prescribed MAT/MOUD (methadone, buprenorphine, naltrexone, etc.)? [ ] Yes [ ] No If yes, prescriber: ______________________________ (MAT/MOUD is fully supported at Grace House and never a barrier to admission.)

Are you currently connected to treatment or counseling? [ ] Yes [ ] No — Provider (your choice of provider is always honored): ______________________________

## Part D — Safety Screening

Do you have any current medical needs requiring immediate attention? [ ] Yes [ ] No — If yes: ______________________________

Do you have any history that could affect the safety of a shared household (e.g., recent violence)? [ ] Yes [ ] No — If yes, please explain (this does not automatically disqualify you): ______________________________

## Part E — Goals

In your own words, why Grace House, and why now?

## Part F — Certification

I certify the information above is true to the best of my knowledge. I understand that Grace House may be able to serve me now, place me on a waitlist, or refer me to a better-fit resource, and that all decisions comply with the Fair Housing Act.

Applicant signature: ______________________________ Date: ____/____/______

Office use: Received by: __________ Date: ______ Interview scheduled: ______ Decision: [ ] Admit [ ] Waitlist (#____) [ ] Refer
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'form_application_prescreening'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'intake_forms_package', 'Intake Forms Package', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.0', $docbody$# GRACE FOR ADDICTIONS

## Grace House Intake Forms Package

Organization: Grace For Addictions (501(c)(3))  
Program: Grace House — A JUST GRACE Initiative  
Version: 1.0 | Effective: February 3, 2026

## TABLE OF CONTENTS

This intake package includes:

- Initial Inquiry & Screening Form

- Eligibility Checklist

- Comprehensive Assessment Form

- Consent for Release of Information (ROI)

- Emergency Contact & Medical Consent Form

- Communication Preferences Form

- Photo/Testimonial Consent (Optional)

- Program Policies Acknowledgment

- Orientation Checklist

- Participant Agreement (Signature Page Reference)

All forms must be completed during intake process before move-in.

# FORM 1: INITIAL INQUIRY & SCREENING

Date of Inquiry: ___________________________________________

How did you hear about Grace House? ☐ Referral from treatment program: ___________________________ ☐ Referral from court/probation/parole ☐ Referral from community organization: _______________________ ☐ Friend/family member ☐ Online search ☐ Other: ___________________________________________________

## CONTACT INFORMATION

Full Legal Name: __________________________________________

Preferred Name (if different): _______________________________

Date of Birth: _____________________________________________

Phone Number: ____________________________________________

Email: ___________________________________________________

Current Address/Location: ___________________________________

## BASIC ELIGIBILITY QUESTIONS

1. Do you have a history of substance use? ☐ Yes ☐ No

2. Are you currently seeking recovery from substance use? ☐ Yes ☐ No

3. Are you willing to live in a substance-free environment? ☐ Yes ☐ No

4. Are you willing to participate in peer support and community living? ☐ Yes ☐ No

5. Are you currently experiencing active suicidal ideation or plans? ☐ Yes ☐ No

6. Are you currently experiencing violence/harm in your living situation? ☐ Yes (Crisis response needed) ☐ No

## IMMEDIATE NEEDS ASSESSMENT

Current Housing Status: ☐ Homeless/shelter ☐ Exiting treatment facility (name: ___________________________) ☐ Exiting incarceration (release date: ________________________) ☐ Unsafe/unstable housing ☐ Other: __________________________________________________

How urgent is your need for housing? ☐ Immediate (within 1-7 days) ☐ Soon (within 1-2 weeks) ☐ Planning ahead (2+ weeks)

Do you have income? ☐ Yes — Source: __________________________________________ ☐ No — Seeking employment ☐ Pending (SSI, SSDI, unemployment, etc.)

Can you afford weekly program fee of $______? ☐ Yes ☐ No, but willing to explore payment plan or scholarship ☐ Uncertain, need to discuss

## PRELIMINARY INFORMATION

Are you currently taking any prescribed medications? ☐ Yes ☐ No

If yes, please list: _________________________________________________________ _________________________________________________________

Are you taking Medication for Opioid Use Disorder (MOUD)? ☐ Yes — Type: ☐ Methadone ☐ Buprenorphine/Suboxone ☐ Naltrexone/Vivitrol ☐ No ☐ Interested in learning about MOUD

Are you currently in treatment or counseling? ☐ Yes — Provider: _________________________________________ ☐ No ☐ Planning to start

Are you on probation/parole or involved with the justice system? ☐ Yes — Officer name/contact: _______________________________ ☐ No

## NEXT STEPS

Screening Staff Name: _____________________________________

Date Screened: ___________________________________________

Outcome: ☐ Proceed to full assessment (schedule date: ___________________) ☐ Waitlist (estimated wait time: ______________________________) ☐ Referred to alternative resource: ____________________________ ☐ Not appropriate fit — Reason: _______________________________

Follow-up plan: __________________________________________ _________________________________________________________

# FORM 2: ELIGIBILITY CHECKLIST

Instructions: Staff use only. Check all boxes that apply to confirm eligibility.

☐ Substance Use History: Individual has confirmed history of substance use/substance use disorder

☐ Recovery Seeking: Individual expresses commitment to seeking recovery

☐ Sobriety Willing: Individual willing to maintain substance-free environment

☐ Community Ready: Individual willing to participate in peer support and shared living

☐ Safety Assessed: No immediate safety concerns that would require higher level of care: - ☐ No active, imminent suicidal plan requiring hospitalization - ☐ No active psychosis requiring psychiatric stabilization - ☐ No medical condition requiring 24/7 medical monitoring - ☐ No active violence risk requiring secure placement

☐ Separated from Treatment: Individual understands Grace House is not co-located with clinical treatment

☐ Treatment Choice: Individual understands they may seek treatment from provider of their choice

☐ MOUD Policy: Individual informed that all FDA-approved medications are permitted

☐ Age Requirement: Individual is 18 years of age or older

☐ Capacity to Consent: Individual demonstrates capacity to understand and consent to program participation

ELIGIBILITY DETERMINATION:

☐ ELIGIBLE — Proceed with comprehensive assessment

☐ NOT CURRENTLY ELIGIBLE — Reason: ______________________ Referral provided to: _____________________________________

☐ WAITLIST — Estimated placement date: ___________________

Assessed By: ____________________________________________

Title: ___________________________________________________

Date: ___________________________________________________

# FORM 3: COMPREHENSIVE ASSESSMENT FORM

Assessment Date: _________________________________________

Assessed By: ____________________________________________

## SECTION A: DEMOGRAPHIC INFORMATION

Full Legal Name: __________________________________________

Preferred Name/Nickname: __________________________________

Date of Birth: _________________ Age: __________________

Social Security Number (optional): ___________________________

Gender Identity: ☐ Male ☐ Female ☐ Non-binary ☐ Prefer to self-describe: _______________

Pronouns: ☐ He/Him ☐ She/Her ☐ They/Them ☐ Other: ______

Race/Ethnicity (optional, for demographics only): ☐ American Indian/Alaska Native ☐ Asian ☐ Black/African American ☐ Hispanic/Latino ☐ Native Hawaiian/Pacific Islander ☐ White ☐ Two or more races ☐ Prefer not to answer

Primary Language: _________________________________________

Do you need interpreter services? ☐ Yes — Language: _________ ☐ No

## SECTION B: CONTACT & EMERGENCY INFORMATION

Current Phone: ____________________________________________

Email: ___________________________________________________

Emergency Contact #1:

Name: ____________________________________________________ Relationship: _______________________________________________ Phone: ____________________________________________________ Address: __________________________________________________ May we contact in emergency? ☐ Yes ☐ No

Emergency Contact #2:

Name: ____________________________________________________ Relationship: _______________________________________________ Phone: ____________________________________________________ May we contact in emergency? ☐ Yes ☐ No

## SECTION C: SUBSTANCE USE HISTORY

1. What substances have you used in your lifetime? (Check all that apply)

☐ Alcohol ☐ Cannabis/Marijuana ☐ Cocaine/Crack ☐ Methamphetamine ☐ Heroin ☐ Prescription Opioids (OxyContin, Percocet, Vicodin, etc.) ☐ Fentanyl ☐ Benzodiazepines (Xanax, Valium, Klonopin, etc.) ☐ Prescription Stimulants (Adderall, Ritalin, etc.) ☐ Hallucinogens (LSD, mushrooms, etc.) ☐ Other: __________________________________________________

2. What is your primary substance of concern?

3. When did you first use substances? Age: _________________

4. When did substance use become a problem for you? Age: ______

5. When did you last use any substance (other than prescribed medications)?

Date: _______________ Substance: ___________________________

6. Have you ever experienced an overdose? ☐ Yes — How many times? _____ Most recent: ________________ ☐ No

7. Have you ever been administered naloxone (Narcan)? ☐ Yes ☐ No ☐ Unsure

8. Method of use: (Check all that apply) ☐ Oral ☐ Smoking ☐ Snorting ☐ Injection ☐ Other: __________

## SECTION D: TREATMENT HISTORY

1. Have you ever been in treatment for substance use? ☐ Yes ☐ No

If yes, please describe:

| Treatment Program/Provider | Dates (approx.) | Type (inpatient, outpatient, detox, etc.) | Completed? |
| --- | --- | --- | --- |
|  |  |  | ☐ Yes ☐ No |
|  |  |  | ☐ Yes ☐ No |
|  |  |  | ☐ Yes ☐ No |

2. Are you currently in treatment or counseling? ☐ Yes ☐ No

If yes: Provider Name: _____________________________________________ Phone: ____________________________________________________ Type of treatment: __________________________________________ Frequency: _________________________________________________

3. What has been most helpful in your recovery journey?

4. What has been most challenging?

## SECTION E: MEDICATION HISTORY

1. Are you currently taking Medication for Opioid Use Disorder (MOUD)? ☐ Yes ☐ No

If yes: Medication: ☐ Methadone ☐ Buprenorphine/Suboxone ☐ Naltrexone/Vivitrol Dose: _____________________________________________________ Prescribing Provider: ________________________________________ Phone: ____________________________________________________ Pharmacy: _________________________________________________

2. Are you currently taking psychiatric medications? ☐ Yes ☐ No

If yes, please list:

| Medication Name | Dose | Frequency | Prescribing Provider |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

3. Do you have any medication allergies? ☐ Yes — Please list: _______________________________________ ☐ No

## SECTION F: MENTAL HEALTH HISTORY

1. Have you ever been diagnosed with a mental health condition? ☐ Yes ☐ No ☐ Unsure

If yes, please check all that apply: ☐ Depression ☐ Anxiety ☐ PTSD (Post-Traumatic Stress Disorder) ☐ Bipolar Disorder ☐ Schizophrenia or other psychotic disorder ☐ ADHD ☐ Eating Disorder ☐ Other: __________________________________________________

2. Have you ever been hospitalized for mental health reasons? ☐ Yes — When (approximately): _____________________________ ☐ No

3. Are you currently in mental health treatment/counseling? ☐ Yes ☐ No

If yes: Provider Name: _____________________________________________ Phone: ____________________________________________________ Frequency: _________________________________________________

4. Have you ever experienced thoughts of suicide? ☐ Yes ☐ No

5. Have you ever attempted suicide? ☐ Yes — Most recent: ____________________________________ ☐ No

6. Are you currently having thoughts of harming yourself? ☐ Yes (IMMEDIATE SAFETY ASSESSMENT REQUIRED) ☐ No

If yes: Have you developed a safety plan with a provider? ☐ Yes ☐ No

## SECTION G: MEDICAL HISTORY

1. Do you have any chronic medical conditions? (Check all that apply) ☐ Diabetes ☐ High Blood Pressure ☐ Heart Disease ☐ Asthma/COPD/Lung Disease ☐ Hepatitis B or C ☐ HIV/AIDS ☐ Seizure Disorder ☐ Chronic Pain ☐ Other: __________________________________________________ ☐ None

2. Do you have a primary care physician? ☐ Yes — Name: __________________ Phone: __________________ ☐ No

3. When was your last medical checkup? _________________________________________________________

4. Are there any medical issues we should be aware of? _________________________________________________________

5. Do you have any physical disabilities or limitations? ☐ Yes — Please describe: ___________________________________ ☐ No

6. Do you need any accommodations for your disability? _________________________________________________________

## SECTION H: HOUSING HISTORY

1. Where have you been living for the past 30 days? ☐ Own apartment/house ☐ Family member’s home ☐ Friend’s home ☐ Treatment facility/halfway house ☐ Homeless shelter ☐ Unsheltered (street, car, abandoned building) ☐ Jail/prison ☐ Other: __________________________________________________

2. How many times have you been homeless in the past 3 years? ☐ Never ☐ 1 time ☐ 2-3 times ☐ 4 or more times

3. Have you ever lived in recovery housing before? ☐ Yes — Where: ___________________________________________ Experience (positive/negative): _____________________ ☐ No

4. Have you ever been evicted from housing? ☐ Yes — Reason: __________________________________________ ☐ No

## SECTION I: EMPLOYMENT & EDUCATION

1. Current Employment Status: ☐ Employed full-time ☐ Employed part-time ☐ Unemployed, actively seeking ☐ Unemployed, not currently seeking ☐ Disability (SSDI/SSI) ☐ Student ☐ Retired ☐ Other: __________________________________________________

If employed: Employer: _________________________________________________ Position: __________________________________________________ Hours per week: ___________________________________________ Start date: ________________________________________________

2. Source of Income: (Check all that apply) ☐ Employment ☐ SSI/SSDI ☐ Unemployment ☐ Family support ☐ Other: ____________________ ☐ Currently no income

3. Approximate monthly income: $_________________________

4. Highest level of education completed: ☐ Less than high school ☐ High school diploma/GED ☐ Some college ☐ Associate’s degree ☐ Bachelor’s degree ☐ Graduate/Professional degree

5. Are you interested in employment assistance? ☐ Yes ☐ No ☐ Already employed

## SECTION J: JUSTICE INVOLVEMENT

1. Have you ever been arrested? ☐ Yes ☐ No

2. Have you ever been incarcerated? ☐ Yes ☐ No

If yes: Most recent incarceration: ____________________________________ Length of stay: _____________________________________________ Release date: ______________________________________________

3. Are you currently on probation or parole? ☐ Yes ☐ No

If yes: Officer Name: ______________________________________________ Phone: ____________________________________________________ Reporting requirements: _____________________________________ Conditions: ________________________________________________

4. Do you have any pending legal matters? ☐ Yes — Please describe: ___________________________________ ☐ No

5. Are you interested in reentry support services? ☐ Yes ☐ No ☐ Not applicable

## SECTION K: FAMILY & SOCIAL SUPPORT

1. Marital/Relationship Status: ☐ Single ☐ Married ☐ Partnered ☐ Separated ☐ Divorced ☐ Widowed

2. Do you have children? ☐ Yes — Number of children: ______ ☐ No

If yes: Ages of children: ___________________________________________ Do you have custody/visitation? ☐ Yes ☐ No ☐ Pending Where are children currently living? __________________________

3. Family involvement in your recovery: ☐ Very supportive ☐ Somewhat supportive ☐ Neutral ☐ Not supportive ☐ No family contact

4. Who do you consider your primary support system? _________________________________________________________

5. Are you involved in any support groups or recovery communities? ☐ Yes — Which ones: _______________________________________ ☐ No, but interested ☐ No

## SECTION L: RECOVERY GOALS & STRENGTHS

1. What are your primary goals for your time at Grace House?

☐ Maintain sobriety ☐ Find employment ☐ Rebuild family relationships ☐ Complete probation/parole successfully ☐ Save money for independent housing ☐ Improve physical health ☐ Improve mental health ☐ Build recovery skills ☐ Connect with recovery community ☐ Other: __________________________________________________

2. What are your strengths? (What are you good at? What has helped you in the past?)

3. What kind of support do you think you’ll need at Grace House?

4. Is there anything else you want us to know about you or your recovery journey?

## SECTION M: ASSESSMENT SUMMARY (Staff Use Only)

Primary Substance(s) of Concern: ___________________________

Co-occurring Mental Health Concerns: ☐ Yes ☐ No

Current Stability Level: ☐ High ☐ Moderate ☐ Low

Immediate Safety Concerns: ☐ None ☐ See notes

Recommended Program Phase at Entry: ☐ Phase 1 (Stabilization — highest support) ☐ Phase 2 (Integration — moderate support) ☐ Phase 3 (Preparation — lower support)

Recommended Frequency of Peer Coaching: ☐ Daily ☐ 3x/week ☐ 2x/week ☐ Weekly

Referrals Needed: ☐ Primary care physician ☐ Mental health counseling ☐ Substance use treatment ☐ MOUD provider ☐ Employment services ☐ Legal services ☐ Other: __________________________________________________

Notes/Comments: _________________________________________________________ _________________________________________________________ _________________________________________________________

Assessed By: ____________________________________________

Title: ___________________________________________________

Date: ___________________________________________________

# FORM 4: CONSENT FOR RELEASE OF INFORMATION (ROI)

I, __________________________________ (Participant Name), authorize Grace For Addictions to:

## PART A: OBTAIN INFORMATION FROM:

☐ Treatment Provider(s):

Name: ____________________________________________________ Agency: ___________________________________________________ Phone: ____________________________________________________ Fax: ______________________________________________________

☐ Probation/Parole Officer:

Name: ____________________________________________________ Agency: ___________________________________________________ Phone: ____________________________________________________

☐ Medical Provider(s):

Name: ____________________________________________________ Agency: ___________________________________________________ Phone: ____________________________________________________

☐ Other: ________________________________________________

## PART B: SHARE INFORMATION WITH:

☐ Emergency Contact/Family:

Name: ____________________________________________________ Relationship: _______________________________________________

☐ Treatment Provider(s):

Name: ____________________________________________________ Agency: ___________________________________________________

☐ Probation/Parole Officer:

Name: ____________________________________________________ Agency: ___________________________________________________

☐ Other: ________________________________________________

## PART C: INFORMATION TO BE SHARED:

☐ Participation status (enrolled, attendance, compliance) ☐ Progress in recovery ☐ Substance use/return to use incidents ☐ Mental health concerns/incidents ☐ Safety concerns ☐ Housing status ☐ Medical information (specify): _______________________________ ☐ All information related to my care

## PURPOSE OF DISCLOSURE:

☐ Coordination of care ☐ Treatment planning ☐ Probation/parole compliance ☐ Family support ☐ Other: __________________________________________________

## I UNDERSTAND THAT:

- This consent is voluntary and I may revoke it at any time by providing written notice to Grace For Addictions

- Revoking consent will not affect services already provided

- Information disclosed may no longer be protected by federal confidentiality rules (42 CFR Part 2) and may be re-disclosed by the recipient

- I have the right to receive a copy of this consent

- This consent expires on: _________________ (date, or “upon discharge”)

Participant Signature: ______________________________

Date: _________________________

Witness: ________________________________________

Date: _________________________

# FORM 5: EMERGENCY CONTACT & MEDICAL CONSENT

## EMERGENCY CONTACTS

Primary Emergency Contact:

Name: ____________________________________________________ Relationship: _______________________________________________ Phone: ____________________________________________________ Address: __________________________________________________ May we contact for non-emergencies? ☐ Yes ☐ No

Secondary Emergency Contact:

Name: ____________________________________________________ Relationship: _______________________________________________ Phone: ____________________________________________________

## MEDICAL INFORMATION

Primary Care Physician:

Name: ____________________________________________________ Phone: ____________________________________________________

Known Medical Conditions: ________________________________ _________________________________________________________

Current Medications: ______________________________________ _________________________________________________________

Medication Allergies: ______________________________________

Pharmacy Name & Phone: __________________________________

## EMERGENCY MEDICAL CONSENT

I understand and consent to the following:

- In case of medical emergency, staff will call 911 immediately

- Staff may administer naloxone (Narcan) if I experience a suspected opioid overdose

- Staff will make reasonable efforts to contact my emergency contact, but my immediate safety is the priority

- I will be responsible for any medical expenses incurred

Participant Signature: ______________________________

Date: _________________________

# FORM 6: COMMUNICATION PREFERENCES

How would you like us to communicate with you?

Appointment Reminders: ☐ Phone call ☐ Text message ☐ Email

General Updates: ☐ Phone call ☐ Text message ☐ Email

Emergency Contact: ☐ Phone call only

Best time to reach you: ☐ Morning ☐ Afternoon ☐ Evening

Preferred phone number: ___________________________________

Preferred email: __________________________________________

Communication with Family/Emergency Contact:

☐ You may contact my emergency contact for any reason ☐ You may contact my emergency contact only in emergencies ☐ You may contact my emergency contact only with my permission each time

# FORM 7: PHOTO & TESTIMONIAL CONSENT (OPTIONAL)

This is completely voluntary and will not affect your participation in Grace House.

I, __________________________________ (Participant Name), give permission for Grace For Addictions to:

☐ YES ☐ NO — Use my photograph for program promotion, website, social media, or fundraising

☐ YES ☐ NO — Use my first name with photo

☐ YES ☐ NO — Use my recovery story/testimonial (anonymously or with first name)

☐ YES ☐ NO — Contact me for permission before using any photo or story

I understand: - I may revoke this consent at any time in writing - Photos/stories already published may not be removed from past materials - My story/photo will never be used in a way that violates my dignity

Participant Signature: ______________________________

Date: _________________________

# FORM 8: PROGRAM POLICIES ACKNOWLEDGMENT

I, __________________________________ (Participant Name), acknowledge that I have received, read (or had read to me), and understand the following Grace House program documents:

☐ Participant Agreement — Including all expectations, rights, and responsibilities

☐ Code of Conduct — Including non-negotiable safety standards and accountability process

☐ Emergency Response Protocols — Including overdose, suicide, violence, and return to use response

☐ Grievance Procedure — Including how to file concerns and appeal

I specifically understand and agree to:

☐ Sobriety Requirement: Grace House is a substance-free environment

☐ MOUD Support: All FDA-approved medications are permitted

☐ Return to use Policy: Return to use is not automatic grounds for discharge; we will work with me

☐ Treatment Choice: I may seek clinical services from any provider I choose

☐ Progressive Discipline: Accountability follows a progressive process with opportunities for correction

☐ Immediate Removal Criteria: Violence, weapons, bringing substances, sexual misconduct, or endangerment may result in immediate discharge

☐ Financial Responsibility: I agree to pay weekly program fee of $______ or work with staff on payment plan

☐ This is Not a Lease: I am a program participant, not a tenant; I do not have landlord-tenant legal protections

☐ Voluntary Participation: I may leave at any time, and Grace House may discharge me if I violate safety standards or refuse support

I have had the opportunity to ask questions and receive clarification.

Participant Signature: ______________________________

Date: _________________________

Staff Witness: ____________________________________

Date: _________________________

# FORM 9: ORIENTATION CHECKLIST

Participant Name: _________________________________________

Orientation Date: __________________________________________

Conducted By: ____________________________________________

## ✅ ORIENTATION TOPICS COVERED:

### Program Overview

☐ Mission and values of Grace For Addictions ☐ Grace-based recovery philosophy ☐ Program phases (stabilization, integration, preparation) ☐ Length of stay expectations ☐ Staff roles (peer coaches, house manager, etc.)

### House Tour & Logistics

☐ Bedroom assignment and roommate introduction (if applicable) ☐ Common areas (kitchen, living room, bathrooms) ☐ Laundry facilities ☐ Storage areas ☐ Outdoor spaces/smoking area (if applicable) ☐ Parking (if applicable)

### Safety & Emergency

☐ Fire exits and escape routes ☐ Fire extinguisher and smoke detector locations ☐ Naloxone (Narcan) storage location ☐ First aid kit location ☐ Emergency contact numbers posted ☐ How to call for help (911, staff on-call) ☐ Overdose response protocol ☐ Suicide risk protocol ☐ Return to use response protocol

### Daily Living Expectations

☐ Curfew times (weeknight and weekend) ☐ Sign-in/sign-out procedure (if required) ☐ Quiet hours ☐ Chore assignments and schedule ☐ House meeting schedule ☐ Visitor policies ☐ Food/meal arrangements ☐ Personal hygiene expectations

### Recovery Support

☐ Peer coaching schedule (frequency based on phase) ☐ Required recovery activities (# per week) ☐ House meetings ☐ Connection to treatment providers (if applicable) ☐ Virtual Recovery Community Center (VRCC) access ☐ Recovery resources available

### Rules & Accountability

☐ Non-negotiable safety standards ☐ Substance-free environment ☐ MOUD and medication support ☐ Progressive discipline process ☐ What happens if you return to use ☐ Immediate removal criteria ☐ How to file a grievance

### Financial

☐ Weekly program fee amount and due date ☐ Payment methods ☐ What to do if can’t pay ☐ What’s included/not included in fee

### Communication

☐ How to reach staff (phone, in-person, scheduled meetings) ☐ Staff on-call number ☐ How staff will communicate with you ☐ Emergency contact notification process

### Your Rights

☐ Treatment choice freedom ☐ MOUD access ☐ Privacy and confidentiality (and limits) ☐ Grievance process ☐ Right to leave voluntarily ☐ Protection from discrimination

### Questions & Concerns

☐ Opportunity provided to ask questions ☐ Questions answered to participant’s satisfaction

## MOVE-IN CHECKLIST:

☐ Keys issued (# of keys: ) ☐ Bedroom condition documented ☐ Personal belongings stored ☐ Welcome packet provided ☐ Emergency contact numbers provided ☐ Peer coach introduction completed ☐ First house meeting date scheduled: ____________________ ☐ First peer coaching session scheduled: _____________________

## FORMS COMPLETED & SIGNED:

☐ Comprehensive Assessment ☐ Consent for Release of Information (if applicable) ☐ Emergency Contact & Medical Consent ☐ Communication Preferences ☐ Photo/Testimonial Consent (optional) ☐ Program Policies Acknowledgment ☐ Participant Agreement

All orientation topics covered and questions answered.

Participant Signature: ______________________________

Date: _________________________

Staff Signature: ____________________________________

Date: _________________________

## WELCOME TO GRACE HOUSE!

Your Peer Coach: _________________________________________

Phone: __________________________________________________

House Manager: __________________________________________

Phone: __________________________________________________

Staff On-Call (Emergencies): ________________________________

Next House Meeting: ______________________________________

Next Peer Coaching Session: ________________________________

# FORM 10: REFERENCE TO PARTICIPANT AGREEMENT

The complete Participant Agreement has been provided separately and must be signed before move-in.

The Participant Agreement includes detailed information on: - Program philosophy and approach - Eligibility and expectations - Length of stay and program phases - Financial participation - House expectations and community standards - Accountability and progressive discipline - Return to use response policy - Participant rights - Grievance procedure - Voluntary exit and discharge - All consents and releases

Participant Agreement Signature Date: ____________________

Copy provided to participant: ☐ Yes

INTAKE COMPLETE

All forms reviewed, signed, and filed.  
Participant is ready for move-in on: ____________________________

Completed By: ___________________________________________

Title: ___________________________________________________

Date: ___________________________________________________

Grace For Addictions | Grace House  
Intake Forms Package — Version 1.0  
Effective: February 3, 2026
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'intake_forms_package'
on conflict (template_id, version) do nothing;

insert into document_templates (organization_id, key, name, requires_signature)
select o.id, 'complete_operational_system', 'Complete Operational System (Staff Manual)', false
from organizations o
where o.name = 'Grace For Addictions'
on conflict (organization_id, key) do update
  set name = excluded.name,
      requires_signature = excluded.requires_signature,
      is_active = true;

insert into document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.0', $docbody$GRACE HOUSE

Recovery Residence

COMPLETE OPERATIONAL SYSTEM

NARR Level II Aligned | Trauma-Informed | Peer-Led

1311 9th Street · Des Moines, Iowa 50314

Grace For Addictions · thomas@graceforaddictions.org · 515-336-0006

Effective: 2026 | Reviewed Annually

Table of Contents

| Section | Document | Page |
| --- | --- | --- |
| SECTION 1 | Resident Handbook | 3 |
| SECTION 2 | Staff Operations Manual | 28 |
| SECTION 3 | Full Resident Form Packet | 52 |
| SECTION 4 | VRCC + Staff Portal Integration Architecture | 80 |
| SECTION 5 | Google Form / Fillable PDF Field Structures | 92 |
| SECTION 6 | NARR Level II Compliance Crosswalk | 100 |
| SECTION 7 | Grace House Participant Agreement | 108 |

> Document Version 2.0 — Canonical Policy Alignment Update upersedes v1.0. Incorporates GH-CURFEW-001 v3.0, GH-RECOVERY-001 v2.0 hase-based), GH-FEES-001 (current rates), GH-ACTIVITY-001 v1.1 (30 s/week), universal coaching requirement, Change Course Leaders policy, mily eligibility pathway, canonical removal language, and NARR rtification-in-preparation framing.*

SECTION 1 · RESIDENT HANDBOOK

Welcome to Grace House

To every woman who walks through this door:

You are not defined by what you have been through. You are not the worst thing that has ever happened to you. You are not your struggles, your history, or your hardest seasons.

You are someone who chose to take a step — and that step matters. It is courageous, even when it doesn't feel that way.

Grace House exists because we believe every person in recovery deserves more than survival. You deserve a home — a real one. A place where you are known by name, not by case number. A place where you are seen, not surveilled. A place where you belong.

This is a peer community. Everyone here — including the people who help facilitate it — has walked a road that includes struggle and healing. There is no hierarchy of worthiness here. There is only a shared commitment to show up for ourselves and for one another.

This handbook is your guide to life at Grace House. It explains how our community works, what you can expect from us, and what we ask of you in return. Please read it carefully, ask questions when something is unclear, and refer back to it whenever you need to.

Most of all, know this: you belong here. We are glad you are here. And we are committed to walking this season of life with you.

With hope and respect,

The Grace House Community

Operated by Grace For Addictions Office: 515-220-8771 · Warmline: 515-310-DIAL (3425) · Toll Free: (877) 295-2535 gracehouse@graceforaddictions.org

Program Philosophy

Our Foundation

Grace House is built on a simple but powerful belief: people in recovery are capable, whole, and worthy of dignity at every stage of the journey. We do not treat recovery as a problem to be managed. We treat it as a life to be lived — fully, freely, and with community support.

Multiple Pathways, One Community

We honor the reality that recovery looks different for every person. There is no single right way to heal. At Grace House, all evidence-based recovery pathways are welcomed and respected, including:

- 12-Step programs (Alcoholics Anonymous, Narcotics Anonymous, Celebrate Recovery, and others)

- SMART Recovery and other secular, science-based approaches

- Medication-Assisted Treatment (MAT) — including methadone, buprenorphine/naloxone (Suboxone), and naltrexone — prescribed and monitored by licensed medical providers

- Faith-based recovery frameworks

- Trauma-informed therapy and counseling

- Wellness practices including mindfulness, exercise, nutrition, and creative expression

- Harm reduction-informed approaches

You will never be required to identify with any particular recovery identity or program. What you will be asked to do is engage — with your own growth, with this community, and with the commitments you make here.

Who Grace House Serves (Eligibility)

Grace House serves adult women who are building a life in recovery. There are two pathways to eligibility:

- Recovery pathway: a personal history of substance use or misuse and a commitment to living substance-free while in residence.

- Family pathway: a parent, partner, or child with a history of substance use disorder or mental-health-related trauma, where stable, structured, recovery-supportive housing supports the family’s healing.

Both pathways carry the same expectations, the same dignity, and the same community membership. Admission decisions are made without regard to race, color, religion, national origin, disability, or any other protected status, and in full compliance with the Fair Housing Act.

Removal from the Program

Grace House does not use punitive legalistic frameworks in its intake materials. Participants may be removed immediately upon violation of program rules or upon conduct that endangers another resident’s life or recovery. Removal decisions are documented, reviewable through the grievance process, and carried out with dignity.

Change Course Leaders (Partner Program)

Change Course is an independent, outside program — it is not a Grace House or GFA program. Change Course has Leaders only — there are no Change Course “participants.”

- Qualification and acceptance as a Change Course Leader is determined solely by Change Course. Grace House plays no role in selecting, qualifying, or approving Change Course Leaders.

- Change Course Leaders take part in extensive Change Course programming Monday through Thursday. Because of this substantial structured engagement, Grace House requires Change Course Leaders to add only two (2) additional supportive activities per week — in place of the standard phase-based recovery activity requirement.

- Change Course Leaders are expected to remain in full compliance with all Change Course program requirements, which are set and administered by Change Course, not by Grace House.

- All other Grace House expectations (house meeting, curfew, coaching and daily check-ins, fees, community standards) apply to Change Course Leaders exactly as they do to every participant.

Trauma-Informed Care

Grace House operates within a trauma-informed framework, which means we understand that many of the behaviors, struggles, and patterns we see in ourselves and each other are often rooted in experiences of pain, loss, and trauma — not in moral failure or personal weakness.

Our five core trauma-informed principles guide everything we do:

> Five Core Principles
> SAFETY — You have the right to feel physically and emotionally safe at Grace House. We create and maintain that safety together.
> TRUST — We are transparent in how decisions are made, and we do what we say we will do.
> CHOICE — You retain agency over your own life and recovery decisions whenever possible.
> COLLABORATION — Decisions that affect residents are made with resident input, not just for residents.
> EMPOWERMENT — Our goal is to build your capacity, not your dependence. Every policy is designed to help you grow stronger, not keep you compliant.

Grace-Based Accountability

We believe that accountability without compassion produces shame, and shame is one of the greatest barriers to sustained recovery. At Grace House, accountability is not punitive — it is restorative.

When someone falls short of a commitment, our first question is not 'what is the consequence?' but 'what happened, and how do we move forward together?' This does not mean there are no expectations or no consequences — it means that consequences are always proportionate, transparent, and aimed at restoration rather than punishment.

Peer-Led Community Model

Grace House is a peer-led recovery residence. This means the culture, care, and community of this home is built by the people who live in it. Experienced residents mentor newer ones. Everyone shares household responsibilities. Leadership within the house is earned through character and consistency, not assigned by credential.

This model is intentional. Research consistently shows that peer support is one of the most powerful catalysts for sustained recovery. You are not just receiving help here — you are also giving it, and that matters deeply.

Resident Rights

As a resident of Grace House, you have the following rights. These rights are non-negotiable and may not be waived, modified, or removed as a condition of residency.

Rights Regarding Dignity and Person

- You have the right to be treated with dignity, respect, and compassion at all times.

- You have the right to be addressed by your preferred name and pronouns.

- You have the right to privacy in your personal communications, including phone calls, letters, and electronic messaging.

- You have the right to manage your own finances, employment, and personal affairs without interference.

- You have the right to keep and access your own identification documents (ID, Social Security card, birth certificate, etc.) at all times.

- You have the right to receive and send personal mail without interception or inspection.

Rights Regarding Recovery

- You have the right to pursue the recovery pathway of your choice, including Medication-Assisted Treatment (MAT), without discrimination or penalty.

- You have the right to choose your own healthcare providers, counselors, and support services in the community.

- You have the right to be free from pressure to affiliate with any specific religious, spiritual, or recovery ideology.

- You have the right to receive medication prescribed by a licensed provider, subject to the house medication policy.

Rights Regarding Residence

- You have the right to a clean, safe, and habitable living environment.

- You have the right to understand all house policies before agreeing to them.

- You have the right to receive advance written notice before any change in your residency status, except in cases of immediate safety concerns.

- You have the right to a fair and transparent grievance process if you believe your rights have been violated or a policy has been applied unfairly.

- You have the right to be free from unlawful searches of your personal belongings.

- You have the right to reasonable accommodations for disability-related needs.

Rights Regarding Confidentiality

- You have the right to confidentiality of your participation in Grace House, subject only to mandatory reporting obligations under Iowa law.

- You have the right to know what information about you is shared, with whom, and why.

- You have the right to provide or withhold consent for release of your information to outside parties.

Rights Regarding Fair Treatment

- You have the right to be free from discrimination based on race, color, national origin, religion, sex, disability, familial status, or any other protected characteristic.

- You have the right to be free from harassment, intimidation, or retaliation from staff or other residents.

- You have the right to access community resources, legal counsel, or outside advocacy without interference.

> If You Believe Your Rights Have Been Violated
> You may file a grievance using the Grace House Grievance Procedure (see page XX).
> You may contact the Iowa Civil Rights Commission: 1-800-457-4416
> You may contact the Iowa Protection & Advocacy Services: 1-800-779-2502
> You may contact the U.S. HUD Office of Fair Housing: 1-800-669-9777
> No retaliation will be taken against any resident for asserting their rights or filing a complaint.

Resident Responsibilities

Living in community means contributing to it. The following responsibilities are what we ask of every resident — not to control you, but because a healthy household requires everyone to show up.

Financial Responsibilities

- Pay your weekly program fee on time. If you are experiencing financial difficulty, speak with the House Manager before your payment is due — not after.

- Maintain your own financial accounts. Grace House does not control, hold, or manage residents' money.

- Contribute to shared household expenses as outlined in your Participant Agreement.

Household Responsibilities

- Complete your weekly chore assignment thoroughly and on time.

- Keep your personal space (bedroom, bathroom area) clean and organized.

- Clean up after yourself in all shared spaces, including the kitchen, living room, and laundry area.

- Respect all common areas as shared space — not personal space.

- Report maintenance issues or safety concerns to the House Manager promptly.

Community Responsibilities

- Treat every resident, guest, and community member with respect and dignity.

- Maintain a substance-free environment. Do not bring alcohol, illegal substances, or non-prescribed medications into the house or onto the property.

- Do not engage in physical, verbal, or emotional intimidation, harassment, or violence of any kind.

- Honor the privacy of other residents. Do not share personal information about another resident outside the house.

- Honor quiet hours to support everyone's sleep and wellbeing.

Recovery Responsibilities

- Engage in your personal recovery plan. This does not prescribe a specific program, but it does require active engagement with your own growth.

- Attend required house meetings and community gatherings.

- Comply with drug testing requirements as outlined in the Participant Agreement.

- Notify the House Manager if you are struggling or feel at risk. You will not be punished for being honest.

Behavioral Responsibilities

- Honor your curfew unless prior approval has been granted.

- Follow the visitors policy.

- Comply with the medication policy.

- Do not engage in illegal activity inside or outside the home.

- Do not remove other residents' belongings without permission.

House Expectations

These expectations exist to make Grace House a safe, functional, and healing environment for everyone. They are not designed to restrict your freedom — they are designed to protect the community we are building together.

Substance-Free Environment

Grace House is an alcohol- and drug-free home. This commitment protects every person in this community.

- No alcohol, illegal drugs, or non-prescribed medications may be brought onto the property at any time.

- Residents may not use substances while living at Grace House, whether on or off the property.

- Residents on Medication-Assisted Treatment (MAT) are fully supported and may continue their prescribed medications under the house medication policy.

- Random drug screens may be requested at any time. Refusal to test is treated the same as a positive result.

- If you are struggling with cravings or feel at risk, please talk to someone. This is not a violation — this is using your recovery community exactly as it was designed.

Quiet Hours and Community Rhythm

Consistent sleep and shared routines support recovery. We ask all residents to honor the following schedule:

| Time | Expectation |
| --- | --- |
| 10:00 PM – 7:00 AM (Sun–Thu) | Quiet hours. Keep voices, music, and devices at low volume. Phone calls in private spaces. |
| 11:00 PM – 7:00 AM (Fri–Sat) | Quiet hours on weekends. |
| 7:00 AM daily | Common areas are open. Morning routines begin. |
| 12:00 PM daily | Bedrooms should be tidied. Daytime activities and obligations underway. |

Common Areas

- Common areas are for everyone. Clean up after every use.

- Kitchen: wash your dishes within 2 hours of using them. Do not leave food on counters.

- Living room: return furniture to its original position after use. No shoes on furniture.

- Laundry: complete your laundry in one session. Do not leave laundry in machines for more than 30 minutes after it is finished.

- Bathrooms: wipe down surfaces after use. Dispose of personal hygiene products properly.

Personal Space

- Your bedroom is your private space. Treat it with care.

- Residents may decorate their rooms in personal ways that do not damage walls or fixtures.

- Bedrooms may not be locked while other residents are home during nighttime hours, in order to maintain the open household environment.

- You are responsible for keeping your bedroom clean. Rooms are subject to wellness checks with 24-hour notice (except in emergencies).

Electronics and Technology

- Personal phones and devices are allowed. Please honor quiet hours and common-area courtesy.

- Social media use that compromises the privacy or reputation of other residents is a serious violation of community trust.

- House WiFi is provided for resident use. Illegal activity conducted via the house network is prohibited.

Pets

- Pets are not permitted at Grace House unless approved in advance by the House Manager as a disability-related accommodation.

- Approved emotional support animals must have current vaccination records on file.

Smoking

- Smoking and vaping are permitted only in designated outdoor areas.

- Do not smoke within 20 feet of any entrance or window.

- Please dispose of cigarette waste responsibly.

Recovery Participation Expectations

Grace House is a recovery-focused community. Living here means actively engaging in your own recovery journey — not performing recovery for someone else, but genuinely investing in your own healing and growth.

What Active Recovery Engagement Looks Like

Policy ID GH-RECOVERY-001 v2.0 — phase-based requirement; supersedes the flat two-per-week standard.

Recovery Activity Requirements by Phase

| Phase | Recovery activities per week |
| --- | --- |
| Phase 1 (Days 1–30) | 4 |
| Phase 2 (Days 31–90) | 3 |
| Phase 3 (Days 91+) | 2 |

What counts as a recovery activity: 12-step meetings (AA/NA), SMART Recovery, Celebrate Recovery, individual therapy or counseling, sessions with your life coach or recovery coach, church or worship services, Bible study, the Tuesday GFA Recovery Community (GFARC) gathering, and other structured community-based recovery activities.

What does not count: the weekly Grace House community meeting. House meeting attendance is a separate, mandatory expectation and may not be counted toward your weekly recovery activity total.

Life Coach / Recovery Coach (required for all participants):

- Every participant selects a life coach or recovery coach at intake.

- Daily check-ins through the VRCC app are required in every phase.

- Coaching sessions: weekly in Phase 1, biweekly in Phase 2, monthly in Phase 3. Coaching sessions count toward your weekly recovery activity total.

- Completing community service, employment, job training, education, or caregiving obligations.

- Engaging in your individual recovery plan with honesty and intention.

House Meetings

Grace House holds a mandatory community meeting once per week. This meeting is the heartbeat of the household. It is where we share, resolve conflicts, make decisions together, celebrate milestones, and maintain our sense of shared life.

- All residents are expected to attend unless prior approval has been granted.

- Meetings are facilitated by rotation among residents.

- All voices are welcome. All perspectives are respected.

- What is shared in house meeting stays in house meeting.

Individual Recovery Planning

Within 72 hours of intake, each resident will complete an Individual Recovery Plan with support from the House Manager or a peer mentor. This plan identifies:

- Your personal recovery goals

- Your chosen recovery pathway and support structure

- Your employment, education, or community service commitments

- Identified strengths, supports, and areas of growth

- Short-term milestones and how success will be measured

Recovery plans are reviewed and updated monthly. They belong to you — not to the house — and are written in your voice.

No Coerced Affiliation

You will never be required to attend a specific recovery program, claim a particular recovery identity, pray in a specific way, or align with any ideology as a condition of living at Grace House. Multiple recovery pathways are honored equally here.

Curfew and Daily Structure

Curfew

Curfew is a structure designed to protect your sleep, your safety, and the community's sense of stability — not to restrict your life.

Policy ID GH-CURFEW-001 v3.0 — supersedes all prior curfew tables.

| Phase | Weeknight (Sun–Thu) | Weekend (Fri–Sat) |
| --- | --- | --- |
| Phase 1 (Days 1–30) | 9:00 PM | 10:00 PM |
| Phase 2 (Days 31–90) | 10:00 PM | 11:00 PM |
| Phase 3 (Days 91+) | 11:00 PM | Midnight |

Hard ceiling: No curfew at Grace House extends past midnight in any phase, for any reason other than verified current employment.

The only curfew exception is current employment. A participant whose verified work schedule conflicts with curfew may be granted an employment-based adjustment covering scheduled shifts plus reasonable travel time. A copy of the work schedule must be on file with the House Manager. No other exceptions (social, family, recreational, or recovery-activity) extend curfew.

Curfew Extensions and Overnight Passes

- Curfew adjustments are granted only for verified current employment. Submit your work schedule to the House Manager; the adjustment covers scheduled shifts plus reasonable travel time.

- Overnight passes may be granted after 60 days of residency to residents in good standing.

- Overnight passes require a written request submitted 48 hours in advance, including the location and host name.

- More than three curfew violations in a 30-day period will result in a community accountability conversation and potential curfew reset.

Morning Routine

A consistent morning routine is one of the most powerful recovery tools available. Residents are encouraged to establish a morning routine that includes:

- Rising at a consistent time (no later than 10:00 AM on days without obligations)

- Personal hygiene and room tidying

- Breakfast and/or connection with housemates

- Engagement with daily obligations (work, school, appointments, volunteer activities)

Daytime Expectations

Grace House is not a daytime respite program. Residents are expected to be actively engaged in employment, education, job training, volunteering, or scheduled appointments during weekday daytime hours (9:00 AM – 4:00 PM). Exceptions require prior approval from the House Manager.

Medication and Appointments

Residents are responsible for scheduling and attending all medical, counseling, and recovery-related appointments. The house schedule and curfew framework are designed to accommodate these commitments. If a conflict exists, bring it to the House Manager immediately.

Visitors Policy

Grace House is a private home. Our visitors policy protects the safety, comfort, and recovery environment of every resident.

General Visitor Guidelines

- Visitors are welcome in common areas only. Guests may not enter any resident's bedroom.

- All visitors must be introduced to and acknowledged by the House Manager or on-call peer leader.

- Residents are responsible for the behavior of their guests.

- Visitors who behave inappropriately, appear intoxicated, or make other residents uncomfortable may be asked to leave immediately.

- Visitors may not stay overnight unless prior approval has been granted through the extended guest process.

Visitor Hours

| Day | Visitor Hours |
| --- | --- |
| Monday – Thursday | 10:00 AM – 9:00 PM |
| Friday – Saturday | 10:00 AM – 10:00 PM |
| Sunday | 12:00 PM – 8:00 PM |

Prohibited Visitors

- No visitors who are currently using substances or appear intoxicated.

- No visitors who pose a documented safety concern to any current resident.

- No male visitors in bedroom areas. Male visitors are welcome in common areas during visitor hours.

- No visitors under the age of 12 without specific approval (to protect all residents' privacy and comfort).

Overnight Guests

Overnight guests are a privilege extended to residents in Phase 2 and Phase 3 who are in good standing.

- A written overnight guest request must be submitted to the House Manager 48 hours in advance.

- Approved guests must sleep in common area (living room) only — never in bedrooms.

- A maximum of one overnight guest per resident is permitted.

- Overnight guests may not remain in the home during daytime obligation hours (9:00 AM – 4:00 PM weekdays).

Medication Policy

Grace House is fully supportive of Medication-Assisted Treatment (MAT) and all prescription medications. We recognize that medication is healthcare — not a compromise of recovery.

Medication-Assisted Treatment (MAT)

Residents taking MAT medications — including methadone, buprenorphine (Suboxone), naltrexone (Vivitrol), or any other FDA-approved medication for opioid or alcohol use disorder — are fully welcome at Grace House. Their use of prescribed medication is private health information and will never be used to stigmatize, limit, or dismiss their recovery.

Medication Storage and Administration

- All prescription medications must be disclosed to the House Manager upon intake.

- Medications must be stored in a secure, designated personal lockbox.

- Controlled substances (including MAT medications) must be stored in a house-provided locked medication safe if a personal lockbox is not available.

- Medications may not be shared with any other resident under any circumstances.

- Residents are responsible for taking their own medications independently. Grace House staff do not administer medications.

New Prescriptions

- Any new prescription obtained while living at Grace House must be reported to the House Manager within 24 hours.

- Residents must provide written documentation from their prescribing provider for any controlled substance.

- Over-the-counter medications with potential for misuse (certain cough syrups, antihistamines, etc.) should be disclosed and stored appropriately.

Medical Privacy

Your medical information — including what medications you take — is private. Grace House staff will not disclose your medication information to other residents, family members, or outside parties without your written consent, except as required by law.

> MAT-Affirming Statement
> Grace House explicitly affirms that Medication-Assisted Treatment is an evidence-based, medically appropriate approach to recovery.
> No resident will be asked to discontinue MAT as a condition of residency.
> No resident will face stigma, reduced privileges, or negative consequences for taking prescribed MAT medications.
> Residents taking MAT are full and equal members of this recovery community.

Confidentiality Policy

What happens at Grace House stays at Grace House. Confidentiality is one of the foundations of our community trust.

What We Protect

- The identity of anyone participating in Grace House.

- Personal information shared in house meetings, peer conversations, or with staff.

- Your recovery history, medical information, and legal history.

- Your current address and contact information.

- Any information that could identify you as a person in recovery.

What You Must Protect

Every resident has the same confidentiality obligations to their housemates. This means:

- Do not share another resident's personal information outside the house.

- Do not post photos, videos, or identifying information about other residents on social media.

- Do not disclose who lives here to people who don't need to know.

- Honor the trust placed in you when other residents share in meetings or conversations.

Required Disclosures

There are limited situations in which Grace House is required by law to disclose information, even without your consent. These include:

- Imminent risk of harm to yourself or another specific person (duty to warn under Iowa law).

- Suspected abuse or neglect of a child or vulnerable adult (mandatory reporting under Iowa Code Chapter 232).

- Court order requiring disclosure.

In all other cases, your information will not be disclosed without your written, signed consent.

HIPAA and 42 CFR Part 2

Substance use disorder treatment information is protected by federal law under 42 CFR Part 2, which provides stronger protections than standard HIPAA. While Grace House is a peer-led residence (not a clinical treatment provider), we align our confidentiality practices with the highest standard of protection.

Grievance Procedure

If you believe you have been treated unfairly, your rights have been violated, or a policy has been applied inconsistently, you have the right to file a grievance. This process is taken seriously, and no retaliation will occur for using it.

Grievance Process — Step by Step

> Step 1 — Informal Resolution (Within 3 Days)
> If you are comfortable doing so, speak directly with the person involved.
> Be specific about what occurred, how it affected you, and what resolution you are seeking.
> If the concern involves a housemate, a peer mediator can be requested.
> Many concerns can be resolved quickly through honest conversation.

> Step 2 — Formal Written Grievance (Within 10 Days of Incident)
> Complete a Grace House Grievance Form (available from the House Manager or in the resident binder).
> Submit the completed form to the House Manager.
> You will receive a written acknowledgment within 24 hours confirming receipt.
> Your grievance will be reviewed within 5 business days.

> Step 3 — House Manager Response (Within 5 Business Days)
> The House Manager will investigate the grievance by reviewing the facts and speaking with relevant parties.
> A written response will be provided to you within 5 business days of receiving your form.
> The response will include findings, any action taken, and the reasoning behind the decision.

> Step 4 — Appeal (Within 5 Days of House Manager Response)
> If you are not satisfied with the House Manager's response, you may appeal to Grace For Addictions leadership.
> Submit a written appeal to thomas@graceforaddictions.org with a copy of your original grievance and the response received.
> A final decision will be provided within 10 business days.

> Step 5 — External Resources
> At any point in this process, you may also contact external agencies.
> Iowa Civil Rights Commission: 1-800-457-4416
> Iowa Protection & Advocacy Services: 1-800-779-2502
> HUD Fair Housing: 1-800-669-9777
> Iowa Department of Health and Human Services: 1-800-362-2178

Anti-Retaliation

No resident will face any negative consequences — including threats, changes in privileges, or pressure toward discharge — for filing a grievance in good faith. Retaliation is itself a serious violation and will be addressed through the same process.

Safety Expectations

Safety is not just a rule — it is a value. Every person in this home deserves to feel safe: physically, emotionally, and relationally. These expectations exist to protect that safety.

Physical Safety

- Violence of any kind — physical assault, threats of violence, destruction of property — will result in immediate safety intervention and may result in emergency discharge.

- Weapons of any kind are strictly prohibited on the property.

- Emergency contact numbers are posted in the kitchen, bathroom, and entryway.

- In an emergency, always call 911 first.

- Grace House has a safety plan and fire escape route posted in each common area and near each exit.

- Tampering with smoke detectors, fire extinguishers, or safety equipment is strictly prohibited.

Emotional and Relational Safety

- Verbal aggression, intimidation, threatening language, or emotional manipulation are not tolerated.

- Bullying, gossip campaigns, exclusion, and other forms of social aggression are violations of community standards.

- Each resident has a right to their emotional experience without being dismissed, mocked, or pressured.

- Romantic or sexual relationships between residents are strongly discouraged during early recovery and may be addressed in accountability conversations if they become disruptive to the community.

Crisis Safety Protocol

If you or another resident is in crisis:

- Call 911 if there is immediate danger to life.

- Contact the House Manager or on-call peer leader immediately.

- Call Iowa Substance Use Crisis Line: 1-844-775-5837 (24/7)

- Call National Crisis Lifeline: 988 (call or text, 24/7)

- Do not leave a person in crisis alone.

- Document the situation and notify Grace House leadership as soon as possible.

Mandatory Reporting

Grace House staff and peer leaders are required by Iowa law to report suspected child abuse or neglect, and suspected abuse or neglect of a dependent adult, to the Iowa Department of Health and Human Services. This is not optional. If you are concerned about a child or vulnerable adult in your life, please speak with the House Manager confidentially.

Discharge Policies

Leaving Grace House — whether planned or unplanned — is handled with dignity and care. Our goal is always to support successful transitions, not punitive exits.

Planned (Voluntary) Discharge

When a resident is ready to move to the next chapter — independent housing, transitional housing, reconnection with family — we celebrate that step.

- Please provide at least 14 days' written notice to the House Manager.

- Your final day and departure plan will be documented.

- A transition planning meeting will be offered to help you connect to ongoing recovery support, housing resources, and community services.

- You are always welcome to return to Grace House events and community as an alum.

Administrative Discharge

Situations may arise that require the house to initiate a discharge. These decisions are made with care and are never taken lightly.

Grounds for Administrative Discharge

- Non-payment of program fees (after documented attempts at payment planning).

- Sustained, documented refusal to engage in recovery participation requirements.

- Behaviors that pose a documented, ongoing safety risk to other residents.

- Court-ordered removal from the residence.

Discharge Process

- The House Manager will document the specific concern with dates, descriptions, and prior interventions.

- A conversation will be held with the resident before a discharge decision is made, whenever safety permits.

- A written notice of discharge will be provided with a minimum of 7 days' notice, except in emergency situations.

- A transition planning meeting will be offered within 24 hours of notice.

- Resources for alternative housing, crisis support, and recovery services will be provided in writing.

Emergency Discharge

In situations involving immediate safety, emergency discharge may occur without advance notice. Emergency discharge may be initiated when:

- A resident has engaged in physical violence or credible threats of violence against another resident or staff.

- A resident has introduced illegal substances into the home in a way that poses immediate risk to others.

- A resident's behavior creates an immediate and documented safety emergency that cannot be otherwise managed.

Even in emergency discharge situations, the resident will receive written documentation of the reason, a referral to emergency housing resources, and information about the grievance process.

Discharge Resource Support

Regardless of the type of discharge, every departing resident will receive:

- Written referral list for housing resources in the Des Moines area

- Contact information for Iowa 211 (housing, crisis, and basic needs navigation)

- Recovery support referrals

- Written documentation of their stay at Grace House for use in housing applications

Return-to-Use Response Framework

We reject the word 'relapse' as a moral verdict. A return to use is a medical and behavioral event — not a character failure, not an identity statement, and not the end of someone's recovery story.

Grace House's response to return-to-use events is grounded in science, compassion, and a genuine commitment to the person's recovery — not compliance theater.

Guiding Principles

> What We Believe About Return-to-Use
> Return to use is a common, documented part of the recovery process for many people — not a sign of failure.
> The response to return-to-use shapes whether a person survives and stays engaged with recovery, or disengages out of shame.
> Our goal is always to keep the person connected to support, even if circumstances require a temporary change in housing.
> Disclosure of a return-to-use event, or help-seeking behavior, is never punished — it is encouraged and supported.
> We apply harm reduction principles at all times to reduce the risk of overdose and serious harm.

Immediate Response Protocol

When a return-to-use event is identified:

- Ensure immediate safety. If the resident is in medical distress, call 911 immediately. Naloxone (Narcan) is available in the house medicine cabinet.

- Contact the House Manager or on-call peer leader.

- Reduce judgment and increase connection. Meet the resident where they are with compassion.

- Conduct a substance-free verification before the resident re-enters shared spaces.

- Schedule a care conversation within 24 hours to assess needs, risks, and next steps.

Care Conversation Framework

Within 24–48 hours of a confirmed return-to-use event, the House Manager or senior peer mentor will conduct a care conversation with the resident. This conversation is not a disciplinary hearing — it is a recovery conversation.

The conversation will explore:

- What happened, and what circumstances surrounded it?

- Is the resident safe? Are there immediate medical concerns?

- What does the resident need right now to get stable?

- What do they want their next step to be?

- What changes to the resident's recovery plan might help?

- Is a higher level of care (detox, residential treatment) needed?

Housing Determination

A return-to-use event does not automatically result in discharge. The following framework guides the decision:

| Situation | Likely Response |
| --- | --- |
| First event, resident discloses voluntarily, no safety risk, seeking help | Remain in house. Intensified recovery support. Possible clinical referral. |
| First event, discovered rather than disclosed, resident engaged and remorseful | Remain in house with enhanced accountability plan and weekly check-ins. |
| Event involves substances brought into house (risk to others) | Temporary housing pause while safety plan is developed. Return possible with agreement. |
| Repeated events with escalating risk, limited engagement | Care referral for higher level of care. Support transition to appropriate setting. Door remains open. |
| Overdose or medical emergency | Immediate medical response. 72-hour stabilization support. Care conference to determine next steps. |

Return After Treatment

Any resident who departs for a higher level of care (detox, residential treatment, stabilization center) is welcome to return to Grace House upon completing that level of care, subject to bed availability. Prior residency at Grace House is considered a strong positive factor in any return application.

> Naloxone (Narcan) Policy
> Naloxone is available in the Grace House medication cabinet and near the front door.
> All residents will receive naloxone training within 7 days of intake.
> Good Samaritan protection applies under Iowa law — you will not face legal consequences for calling for help during an overdose.
> Administering naloxone to someone in need is never a violation of house policy.

> SECTION 2 · STAFF OPERATIONS MANUAL

Staff Operations Manual

This manual provides operational guidance for Grace House staff, peer mentors, and volunteer leaders. It is a living document, reviewed annually and updated as needed.

Grace House is a peer-led recovery residence. 'Staff' at Grace House includes the House Manager, peer mentors, volunteer recovery coaches, and Grace For Addictions leadership. Everyone in a leadership role at Grace House carries both responsibility and the weight of example.

Roles and Responsibilities

Executive Director (Grace For Addictions)

- Oversees all programmatic and organizational functions of Grace House.

- Responsible for strategic direction, fiscal management, policy decisions, and compliance.

- Final authority on discharge decisions, policy appeals, and NARR compliance.

- Contact: Thomas DeGarmeaux | thomas@graceforaddictions.org | 515-336-0006

House Manager

- Primary point of contact for all day-to-day resident matters.

- Conducts intake assessments and orientation for all new residents.

- Facilitates weekly house meetings.

- Administers drug testing and documents results.

- Manages bed assignments, waitlist, and chore schedules.

- Responds to grievances and incident reports.

- Maintains resident files and operational documentation.

- Conducts wellness checks with appropriate notice.

- Coordinates with community service providers, counselors, and partner agencies.

- Reports to Executive Director weekly via written summary.

Peer Mentor / Recovery Coach

- Provides informal peer support to residents through shared lived experience.

- Mentors newer residents through orientation and early recovery milestones.

- Co-facilitates house meetings on rotating basis.

- Serves as on-call support during off-hours on assigned shifts.

- Maintains appropriate peer boundaries (no dual relationships, no romantic relationships with residents).

- Participates in monthly peer mentor training and supervision.

Volunteer Recovery Coach

- Provides scheduled one-on-one coaching sessions with assigned residents.

- Supports residents in developing and maintaining Individual Recovery Plans.

- Uses Ooma platform for virtual coaching sessions when meeting in person is not possible.

- Maintains weekly contact log submitted to House Manager.

- Completes required volunteer training and background check before engaging with residents.

Intake Procedures

Pre-Intake Screening

Before a prospective resident is admitted to Grace House, a pre-intake screening is conducted to assess fit, identify needs, and ensure safety for the community.

- Initial inquiry received via Grace House intake form (VRCC portal or paper).

- Phone or video screening call conducted by House Manager within 48 hours.

- Screening assesses: current substance-free status, commitment to recovery, basic needs, risk factors, and community compatibility.

- Screening is not a clinical assessment. It is a relational conversation.

- A written summary of the screening is documented in the resident file.

Intake Day Protocol

- Welcome and tour of the house.

- Completion of all required intake forms (see Section 3).

- Review of Resident Handbook and Participant Agreement (signed by resident and House Manager).

- Drug screen administered and documented.

- Medication disclosure and lockbox setup.

- Introduction to housemates.

- Assignment of peer mentor.

- Naloxone training.

- Individual Recovery Plan initial session scheduled within 72 hours.

- Emergency contacts collected and filed.

Documentation Requirements

Accurate documentation is essential for the safety of residents, compliance with NARR standards, and the integrity of the organization. All documentation is maintained in the resident's digital or physical file.

Required Documentation Per Resident

- Signed Participant Agreement

- Intake Assessment form

- Photo ID copy

- Emergency Contact form

- Medication Disclosure form

- Drug screen results (dated and signed)

- Individual Recovery Plan (initial and updates)

- Weekly check-in logs

- Any grievance forms or incident reports

- Discharge documentation and transition plan

Documentation Standards

- All entries must be dated, timed, and signed or initialed by the person completing them.

- Use person-first, non-stigmatizing language in all documentation.

- Do not record conclusions — record observable behaviors and direct quotes.

- Correct errors with a single line through the error, initials, and correct information. Do not erase or white out.

- Digital records are maintained in the Grace House Staff Portal (VRCC).

Drug Testing Protocol

Testing Schedule

Drug testing is a safety measure — not a surveillance tool. It is conducted in a consistent, transparent manner.

- All new residents are tested upon intake (Day 1).

- Residents in Phase 1 (Days 1–30) are tested a minimum of twice per week.

- Residents in Phase 2 (Days 31–90) are tested once per week.

- Residents in Phase 3 (Days 91+) are tested a minimum of twice per month.

- Random tests may be administered at any time with no advance notice.

Positive Test Response

- Document the result (date, time, substances detected, resident present).

- Notify Executive Director within 24 hours.

- Schedule care conversation with the resident within 24 hours.

- Follow the Return-to-Use Response Framework (Section 1, Page XX).

- Update the resident's Individual Recovery Plan accordingly.

Testing Dignity Standards

- Testing is conducted in private, with dignity.

- Residents are not watched while producing samples except when direct observation is documented as medically necessary.

- Test results are confidential and never shared in house meetings or with other residents.

- MAT medications (buprenorphine, methadone, naltrexone) are noted in the resident's medication file and do not constitute a positive result.

House Meeting Facilitation Guide

The weekly house meeting is the operational and relational heartbeat of Grace House. It is where community is built, conflicts are resolved, decisions are made together, and milestones are celebrated.

Standard Meeting Agenda (60–90 minutes)

| Segment | Description |
| --- | --- |
| Opening (5 min) | Check-in round — one word describing how you're feeling today. |
| Celebrations (10 min) | Recovery milestones, personal wins, community appreciation. |
| Community Business (20 min) | Chore assignments, household decisions, upcoming events. |
| Recovery Focus (20 min) | Topic discussion, guest speaker, or resident-led sharing. |
| Concerns & Conflict Resolution (15 min) | Structured space for community concerns with ground rules. |
| Closing (10 min) | Affirmation round and serenity/closing of choice. |

Meeting Ground Rules

- One person speaks at a time.

- What is shared in this room stays in this room.

- No cross-talk or advice-giving unless invited.

- Challenge ideas, not people.

- You have the right to pass.

Incident Response Procedures

Incident Classification

| Level | Description & Response |
| --- | --- |
| Level 1 — Minor | Curfew violation, chore dispute, noise complaint. Address in next available conversation. Document in resident log. |
| Level 2 — Moderate | Positive drug screen, visitor policy violation, missing required meeting. Care conversation within 24 hours. Document and notify ED. |
| Level 3 — Serious | Physical altercation, bringing substances into house, harassment. Immediate response. Safety assessment. Notify ED immediately. Document. |
| Level 4 — Emergency | Overdose, medical emergency, imminent violence. Call 911. Administer Narcan if overdose. Notify ED immediately. File incident report within 2 hours. |

Incident Report Requirements

Any Level 2 or higher incident requires a written Incident Report completed within 24 hours (Level 3 and 4: within 2 hours). The report must include:

- Date, time, and location of incident

- Names of people involved (resident names are confidential — use file numbers in shared documents)

- Description of what occurred (observable facts, not interpretations)

- Immediate actions taken

- Follow-up plan

- Reporter's name and signature

NARR Level II Compliance Responsibilities

Grace House maintains NARR Level II certification. Staff are responsible for ensuring ongoing compliance in their areas of responsibility.

Annual Compliance Activities

- NARR self-assessment review (annually in January).

- Resident rights posting audit (verify postings are current and visible).

- Policy review and update by Executive Director.

- Staff and peer mentor training log verification.

- Drug testing documentation audit.

- Fire safety inspection and drill.

- Emergency contact list update.

Ongoing Compliance Monitoring

- House Manager submits weekly operational summary to Executive Director.

- Drug testing logs are reviewed monthly.

- Resident satisfaction surveys conducted quarterly.

- Grievance log is reviewed and trends addressed quarterly.

- All policy changes are documented and dated.

> SECTION 3 · FULL RESIDENT FORM PACKET

Resident Form Packet

All forms in this packet are completed upon intake and maintained in the resident's confidential file. Digital versions are available in the VRCC Resident Portal.

> FORM 1: Grace House Intake Application

CONFIDENTIAL — This form is used to evaluate fit and prepare for your intake appointment. Honest answers help us serve you well.

APPLICANT INFORMATION

Full Legal Name: ____________________________________________________________

Preferred Name / Nickname: ____________________________________________________________

Date of Birth: ____________________________________________________________

Phone Number: ____________________________________________________________

Email Address: ____________________________________________________________

Current Address or Situation (if unhoused, note shelter/location): ____________________________________________________________

How did you hear about Grace House?: ____________________________________________________________

RECOVERY HISTORY

What substance(s) have you used? (Be as specific as you are comfortable.): ____________________________________________________________

How long have you been in recovery from each substance?: ____________________________________________________________

Have you ever attended residential treatment? If yes, when and where?: ____________________________________________________________

Are you currently enrolled in any treatment program? If yes, which one?: ____________________________________________________________

Are you currently taking medication for opioid or alcohol use disorder (MAT)?

[ ] Yes — please describe below

[ ] No

If yes, which medication and who prescribes it?: ____________________________________________________________

CURRENT SITUATION

What brings you to Grace House at this time?

:

What are your recovery goals for the next 6 months?: ____________________________________________________________

What does your support system look like right now?: ____________________________________________________________

Are you currently working, in school, or engaged in job training?: ____________________________________________________________

Do you have any legal obligations (probation, parole, court dates)? Please describe.: ____________________________________________________________

HEALTH AND SAFETY

Do you have any medical conditions that would affect your ability to live in shared housing?

[ ] Yes — please describe below

[ ] No

If yes, please describe:: ____________________________________________________________

Do you have any history of violent behavior toward others?

[ ] Yes — please describe below

[ ] No

Do you require any disability-related accommodations?: ____________________________________________________________

REFERENCES (Two required — not family members)

Reference 1 Name and Relationship: ____________________________________________________________

Reference 1 Phone: ____________________________________________________________

Reference 2 Name and Relationship: ____________________________________________________________

Reference 2 Phone: ____________________________________________________________

CERTIFICATION

I certify that all information provided on this application is true and accurate to the best of my knowledge. I understand that providing false information may result in denial or termination of my application.

| Applicant Signature | Date |
| --- | --- |

FOR STAFF USE ONLY

Intake Interview Completed By: ____________________________________________________________

Date of Interview: ____________________________________________________________

| Outcome | Notes |
| --- | --- |
| Admitted |  |
| Waitlisted |  |
| Not Admitted (reason on file) |  |

> FORM 2: Intake Assessment

Completed by House Manager at intake. This is a wellness and planning tool — not a clinical assessment.

RESIDENT INFORMATION

Resident Name: ____________________________________________________________

Intake Date: ____________________________________________________________

Assigned Bed/Room: ____________________________________________________________

Phase of Residency at Intake: ____________________________________________________________

PHYSICAL HEALTH

Current primary care provider (name and contact):: ____________________________________________________________

Prescribing provider for MAT or psychiatric medications (if applicable):: ____________________________________________________________

Current medications (list all):: ____________________________________________________________

Any known allergies?

[ ] None known

[ ] Yes — listed below

Allergies:: ____________________________________________________________

Are you currently experiencing any health issues that require immediate attention?

[ ] No

[ ] Yes — describe below and notify medical contacts

Description:: ____________________________________________________________

RECOVERY STATUS

Days of sobriety/recovery at intake:: ____________________________________________________________

Primary recovery pathway (check all that apply):

[ ] 12-Step (AA, NA, CA, other)

[ ] SMART Recovery

[ ] Celebrate Recovery

[ ] Faith-based (specify):

[ ] Medication-Assisted Treatment (MAT)

[ ] Individual therapy / counseling

[ ] Peer support / recovery coaching

[ ] Other (specify):

[ ] Currently exploring — no specific pathway yet

SOCIAL AND PRACTICAL NEEDS

Which of the following does the resident need support with? (Check all that apply)

[ ] Employment / job search

[ ] Education / GED / job training

[ ] Transportation

[ ] Childcare

[ ] Legal needs (probation, expungement, court)

[ ] Benefits enrollment (Medicaid, food assistance, etc.)

[ ] Family reconnection

[ ] Dental / vision / medical care

[ ] Mental health services

[ ] Financial literacy / banking

[ ] None identified at this time

SAFETY SCREENING

Are there any safety concerns for this resident that the house should be aware of?

[ ] No known concerns

[ ] Yes — documented in confidential safety file

Is there a protection order or safety plan in place?

[ ] No

[ ] Yes — copy on file

History of trauma that may affect housing (does not need to be specified in detail)?

[ ] Resident prefers not to say

[ ] Resident acknowledges trauma history — no details needed

[ ] Resident wishes to discuss — schedule trauma-informed support conversation

ORIENTATION CHECKLIST (Staff initials required)

| Item | Staff Initials & Date |
| --- | --- |
| House tour completed |  |
| Resident Handbook reviewed |  |
| Participant Agreement signed |  |
| Drug screen administered |  |
| Medication lockbox assigned |  |
| Naloxone training completed |  |
| Emergency contacts collected |  |
| Peer mentor assigned |  |
| IRP session scheduled (within 72 hours) |  |
| VRCC portal account created |  |

| House Manager Signature | Date |
| --- | --- |

> FORM 3: Emergency Contact Form

RESIDENT NAME: ____________________________________ DATE: ______________________

PRIMARY EMERGENCY CONTACT

Full Name: ____________________________________________________________

Relationship to Resident: ____________________________________________________________

Phone (Primary): ____________________________________________________________

Phone (Alternate): ____________________________________________________________

Email Address: ____________________________________________________________

Address: ____________________________________________________________

May Grace House staff contact this person in case of emergency?

[ ] Yes

[ ] No

May Grace House release information about my recovery status to this person?

[ ] Yes

[ ] No

SECONDARY EMERGENCY CONTACT

Full Name: ____________________________________________________________

Relationship to Resident: ____________________________________________________________

Phone (Primary): ____________________________________________________________

Phone (Alternate): ____________________________________________________________

May Grace House staff contact this person in case of emergency?

[ ] Yes

[ ] No

MEDICAL EMERGENCY AUTHORIZATION

In the event I am unable to communicate or make decisions due to a medical emergency, I authorize Grace House to:

[ ] Contact my emergency contacts listed above

[ ] Call 911 immediately

[ ] Administer naloxone (Narcan) if overdose is suspected

[ ] Provide my emergency contacts with my location and general medical status

HEALTHCARE PROVIDERS

Primary Care Provider Name and Phone: ____________________________________________________________

Mental Health Provider Name and Phone: ____________________________________________________________

MAT/Prescribing Provider Name and Phone (if applicable): ____________________________________________________________

Pharmacy Name and Phone: ____________________________________________________________

| Resident Signature | Date |
| --- | --- |

> FORM 4: Medication Disclosure Form

CONFIDENTIAL — This form is required for all residents. Medication information is kept strictly confidential and is never shared with other residents.

RESIDENT NAME: ____________________________________ DATE: ______________________

CURRENT MEDICATIONS

Please list all medications you are currently taking, including prescriptions, over-the-counter medications, supplements, and MAT medications.

| Medication Name | Dose / Frequency / Prescriber |
| --- | --- |
| 1. |  |
| 2. |  |
| 3. |  |
| 4. |  |
| 5. |  |
| 6. |  |

MEDICATION-ASSISTED TREATMENT

Are you currently taking any of the following MAT medications?

[ ] Buprenorphine (Suboxone, Subutex, Zubsolv, Sublocade)

[ ] Methadone (from a licensed OTP/clinic)

[ ] Naltrexone (Vivitrol injection or oral tablet)

[ ] Acamprosate (Campral)

[ ] Disulfiram (Antabuse)

[ ] Other prescribed medication for SUD:

[ ] I am not currently on MAT medications

MEDICATION STORAGE AGREEMENT

I understand and agree to the following:

[ ] All prescription medications will be stored in my assigned lockbox or the house medication safe.

[ ] I will not share my medications with any other resident.

[ ] I will report any new prescriptions to the House Manager within 24 hours.

[ ] I understand that my medication information is confidential.

[ ] I will bring documentation from my prescriber for all controlled substances.

| Resident Signature | Date |
| --- | --- |

| House Manager Signature | Date |
| --- | --- |

> FORM 5: Authorization for Release of Information

CONFIDENTIAL — This form authorizes Grace House to share your information with specific individuals or organizations you identify. Your signature is required for each release.

RESIDENT NAME: ____________________________________ DATE: ______________________

DATE OF BIRTH: ____________________________________

I, the above-named individual, authorize Grace House / Grace For Addictions to:

[ ] RELEASE information to (provide information TO the party listed below)

[ ] RECEIVE information from (receive information FROM the party listed below)

[ ] BOTH release and receive information with the party listed below

AUTHORIZED PARTY INFORMATION

Name of Organization or Individual: ____________________________________________________________

Contact Person (if applicable): ____________________________________________________________

Address: ____________________________________________________________

Phone: ____________________________________________________________

Email: ____________________________________________________________

INFORMATION TO BE RELEASED OR RECEIVED

Please check the types of information covered by this release:

[ ] General participation in Grace House (dates of residency)

[ ] Recovery status and progress

[ ] Mental health information

[ ] Substance use history

[ ] Medical information (specify):

[ ] Legal history

[ ] Employment or education status

[ ] Other (specify):

PURPOSE OF RELEASE

[ ] Coordinating care with treatment providers

[ ] Legal or court purposes

[ ] Employment verification

[ ] Housing assistance

[ ] Benefits eligibility

[ ] Family communication (at my request)

[ ] Other (specify):

DURATION

This authorization is valid:

[ ] Until I revoke it in writing

[ ] For the following time period: ____________________________________

RIGHT TO REVOKE

I understand that I may revoke this authorization at any time by submitting a written request to Grace House. Revocation does not apply to information already released in good faith before the revocation was received.

| Resident Signature | Date |
| --- | --- |

> FORM 6: Individual Recovery Plan (IRP)

This plan belongs to you. It is written in your voice, reviewed with your input, and updated as you grow. It is not a clinical document — it is your roadmap.

RESIDENT NAME: ____________________________________ PLAN DATE: ______________________

REVIEW DATE: ____________________________________ PEER MENTOR: ______________________

Part 1: Where I Am Now

In a few sentences, describe where you are in your recovery right now — your strengths, challenges, and what matters most to you in this season.

:

What I am most proud of so far:

:

What I am working to change or grow:

:

Part 2: My Recovery Goals (Next 90 Days)

| Area of Life | My Goal for This Season |
| --- | --- |
| Recovery & Sobriety |  |
| Health & Wellness |  |
| Employment / Education |  |
| Housing |  |
| Family / Relationships |  |
| Finances |  |
| Legal |  |
| Spiritual / Personal Growth |  |

Part 3: My Recovery Support Plan

My primary recovery pathway:

: ____________________________________________________________

My sponsor, mentor, or primary support person:

: ____________________________________________________________

Recovery meetings or programs I attend:

: ____________________________________________________________

My counselor or therapist (if applicable):

: ____________________________________________________________

Other recovery activities (exercise, faith community, creative practice, etc.):

: ____________________________________________________________

Part 4: My Strengths and Support Network

Three strengths I bring to my recovery:

1.: ____________________________________________________________

2.: ____________________________________________________________

3.: ____________________________________________________________

People in my life who support my recovery:

:

Part 5: Warning Signs and Safety Plan

When I am struggling, I tend to:

:

Early warning signs that I may need more support:

:

When I notice these signs, my plan is:

:

People I will contact when I am struggling:

1. Name and phone:: ____________________________________________________________

2. Name and phone:: ____________________________________________________________

Part 6: Signatures

This plan was created collaboratively and reflects my own goals and voice.

| Resident Signature | Date |
| --- | --- |

| House Manager / Peer Mentor Signature | Date |
| --- | --- |

PLAN REVIEW LOG

| Review Date | Summary of Changes / Notes / Signatures |
| --- | --- |
| 30-Day Review: |  |
| 60-Day Review: |  |
| 90-Day Review: |  |
| 6-Month Review: |  |

> FORM 7: Drug Screen Documentation Log

CONFIDENTIAL — All drug screen documentation is kept in the resident's confidential file.

RESIDENT NAME: ____________________________________

| Date | Time \| Screen Type \| Substances Tested \| Result \| Administered By \| Notes |
| --- | --- |

Result Key: NEG = Negative | POS = Positive (substance indicated in Notes) | REF = Refused | INV = Invalid sample

Note: Positive results for prescribed MAT medications (buprenorphine, methadone, naltrexone) are documented separately in the medication file and do not constitute a policy violation.

> FORM 8: Grievance Form

You have the right to file a grievance without fear of retaliation. All grievances are reviewed seriously and responded to in writing.

COMPLAINANT INFORMATION

Name (or File # if you prefer anonymity): ____________________________________________________________

Date of This Form: ____________________________________________________________

Date of Incident or Concern: ____________________________________________________________

DESCRIPTION OF CONCERN

Please describe what happened in as much detail as possible. Include dates, times, locations, and names of people involved.

:

How did this situation affect you?

:

What resolution are you seeking?

:

PRIOR ATTEMPTS TO RESOLVE

Have you attempted to resolve this informally?

[ ] Yes — describe below

[ ] No — I did not feel safe doing so or preferred formal process

If yes, describe:: ____________________________________________________________

WITNESSES (if applicable)

Name(s) of witness(es) who may have relevant information:: ____________________________________________________________

| Resident / Complainant Signature | Date |
| --- | --- |

FOR STAFF USE ONLY

Date Received: ____________________________________________________________

Received By: ____________________________________________________________

Acknowledgment Provided to Complainant (Date): ____________________________________________________________

Investigation Completed (Date): ____________________________________________________________

Response Provided (Date): ____________________________________________________________

Outcome Summary: ____________________________________________________________

| House Manager Signature | Date |
| --- | --- |

> SECTION 4 · VRCC + STAFF PORTAL INTEGRATION ARCHITECTURE

Virtual Recovery Community Center (VRCC)

The VRCC is the digital infrastructure for Grace House — a unified platform housing the resident experience, staff operations, coaching relationships, and community connection in a single, integrated environment.

Platform Architecture Overview

> Core Design Principles
> PRIVACY FIRST — No personally identifiable information in URLs or public-facing elements.
> MOBILE FIRST — All interfaces optimized for smartphone use (WCAG 2.1 AA).
> PEER-LED FEEL — Design language reflects community, not clinical or institutional aesthetics.
> INTEGRATED — Resident portal, staff portal, and community center share data but maintain role-based access boundaries.
> OFFLINE-CAPABLE — Core features function in low-connectivity environments.

Platform Rooms (Modules)

| Room / Module | Function & Access Level |
| --- | --- |
| Intake & Onboarding Room | Pre-admission screening, application submission, waitlist management. Access: Applicants (public), Staff (admin). |
| Resident Dashboard | Personal check-ins, IRP progress, community chat, financial tracking, alerts. Access: Individual residents + assigned staff. |
| Community Room | Shared announcements, house meeting notes, house-wide communications, milestone celebrations. Access: All active residents + staff. |
| Staff Portal | Bed management, resident oversight, documentation, drug screen logs, incident reports, coach dashboards, alerts. Access: Staff only. |
| Recovery Coach Room | Scheduled coaching sessions (Ooma integration), session notes, goal tracking. Access: Coaches + their assigned residents. |
| Resource Library | Community services, housing guides, recovery meeting schedules, crisis resources. Access: All residents + alumni. |
| Alumni Room | Peer mentorship connections, alumni events, community engagement. Access: Graduated residents. |

Technology Stack

Frontend

- React (component-based, mobile-first)

- Design system: DM Serif Display (headings) + Plus Jakarta Sans (body)

- Color palette: Deep plum (#5B2C6F), dark navy (#1B2A4A), warm amber (#D4A017)

- WCAG 2.1 AA accessibility compliance

- Progressive Web App (PWA) capabilities for offline use

Video Coaching Integration

- Platform: Ooma

- Scheduled via VRCC calendar module

- Session links generated automatically and delivered to resident and coach

- Session notes captured in Recovery Coach Room post-session

Data and Security

- Role-based access control (RBAC): Resident, Peer Mentor, Coach, House Manager, Executive Director

- Data encrypted at rest and in transit

- No PHI stored in unencrypted format

- Automatic session timeout after 15 minutes of inactivity

- Audit log maintained for all staff access to resident records

Resident Portal — Feature Detail

Daily Check-In

Residents complete a brief daily check-in (60–90 seconds) that captures:

- Mood rating (1–5 scale with emoji options)

- Recovery focus for today (text entry, optional)

- Cravings or challenges (yes/no with optional detail)

- Gratitude entry (optional)

- Alert flag for staff if indicated (auto-triggered by concerning patterns)

IRP Progress Tracker

- Visual goal tracking board organized by life domain

- Milestone celebration prompts at 30, 60, 90 days and 6 months

- Private journal linked to IRP goals

- Shareable progress summary for recovery coach sessions

Financial Tracking

- Program fee payment tracking and receipt

- Savings goal tracker (private to resident)

- Community resource links for financial assistance

Staff Portal — Feature Detail

Bed and Waitlist Management

- Real-time bed availability dashboard

- Waitlist with priority queue management

- Intake appointment scheduling

- Bed assignment and room tracking

Resident Oversight Dashboard

- At-a-glance resident status board (active, good standing, concern flagged)

- Daily check-in trend visualization per resident

- Drug screen schedule and results log

- Curfew compliance tracking

- IRP review alerts (upcoming 30/60/90-day reviews)

Alert System

- Auto-generated alerts for: missed check-ins (48+ hours), concerning check-in patterns, overdue drug screens, curfew violations, upcoming IRP reviews

- Alert delivered to House Manager dashboard and (if Level 3+) to Executive Director

- Alert log maintained for all triggered alerts with staff response documented

Documentation Module

- Digital resident files with version history

- Incident report submission and tracking

- Grievance tracking with response deadlines

- Weekly operational summary template and submission

- NARR compliance checklist (annual review)

> SECTION 5 · GOOGLE FORM / FILLABLE PDF FIELD STRUCTURES

Digital Form Field Structures

This section specifies the exact field structure for each Grace House digital form — suitable for implementation in Google Forms, Jotform, Typeform, or as fillable PDF fields.

Intake Application — Field Structure

| Field Name | Field Type / Options / Validation |
| --- | --- |
| full_legal_name | Short text \| Required \| Min 2 chars |
| preferred_name | Short text \| Optional |
| date_of_birth | Date \| Required \| Must be 18+ at submission |
| phone_number | Phone \| Required \| Format: (000) 000-0000 |
| email_address | Email \| Optional \| Format validation |
| current_address | Long text \| Required \| Note: 'unhoused' accepted |
| referral_source | Dropdown: Grace For Addictions website / Referral from treatment provider / Referral from person in recovery / Social media / 211 / Court/probation referral / Other |
| substances_used | Checkboxes: Alcohol / Opioids / Stimulants / Cannabis / Benzodiazepines / Other — plus text entry |
| time_in_recovery | Short text per substance \| Optional |
| prior_treatment | Yes/No radio + conditional text |
| current_treatment | Yes/No radio + conditional text |
| currently_on_mat | Yes/No radio + conditional: medication name and prescriber |
| reason_for_applying | Long text \| Required \| Min 50 chars |
| recovery_goals | Long text \| Required |
| support_system | Long text \| Optional |
| employment_status | Dropdown: Employed full-time / Employed part-time / Seeking employment / In school or training / Disability / Caregiving / Other |
| legal_obligations | Yes/No radio + conditional text |
| medical_conditions | Yes/No radio + conditional text |
| history_of_violence | Yes/No radio + conditional text \| Sensitive field — plain language explanation |
| disability_accommodations | Short text \| Optional |
| reference_1_name | Short text \| Required |
| reference_1_relationship | Short text \| Required |
| reference_1_phone | Phone \| Required |
| reference_2_name | Short text \| Required |
| reference_2_relationship | Short text \| Required |
| reference_2_phone | Phone \| Required |
| certification_checkbox | Checkbox: 'I certify this information is accurate' \| Required |
| electronic_signature | Short text: 'Type your full name as your signature' \| Required |
| signature_date | Date \| Required \| Auto-fill current date option |

Daily Check-In — Field Structure

| Field Name | Field Type / Options / Validation |
| --- | --- |
| resident_id | Hidden field (auto-populated from login) |
| check_in_date | Date \| Auto-populated \| Required |
| check_in_time | Time \| Auto-populated |
| mood_rating | Scale: 1 (Really struggling) to 5 (Doing great) \| Emoji display |
| mood_description | Short text \| Optional \| 'Anything you want to add?' |
| recovery_focus_today | Short text \| Optional \| 'What's your recovery focus today?' |
| experiencing_cravings | Yes/No/Somewhat radio |
| craving_detail | Conditional long text \| 'It's OK — what's going on?' |
| support_needed | Yes/No radio \| 'Do you want to talk to someone today?' |
| gratitude_entry | Short text \| Optional \| 'Something I'm grateful for:' |
| flag_for_staff | Hidden \| Auto-set to True if mood 1 or support_needed = Yes |

Grievance Form — Field Structure

| Field Name | Field Type / Options / Validation |
| --- | --- |
| complainant_name_or_id | Short text \| Required \| Note: Anonymous option noted |
| prefer_anonymous | Yes/No \| Conditional: if Yes, name field accepts 'Anonymous' |
| form_date | Date \| Auto-populated \| Required |
| incident_date | Date \| Required |
| incident_description | Long text \| Required \| Min 50 chars |
| impact_description | Long text \| Required |
| desired_resolution | Long text \| Required |
| prior_informal_attempt | Yes/No radio |
| informal_attempt_detail | Conditional long text |
| witness_names | Short text \| Optional |
| electronic_signature | Short text \| Required |
| signature_date | Date \| Auto-populated |

Individual Recovery Plan — Digital Field Structure

| Field Name | Field Type / Options / Validation |
| --- | --- |
| resident_id | Hidden (from login) |
| plan_date | Date \| Required |
| plan_type | Radio: Initial Plan / 30-Day Review / 60-Day Review / 90-Day Review / 6-Month Review |
| current_status_narrative | Long text \| Required \| Prompt: 'In your own words, where are you in your recovery?' |
| proud_of | Long text \| Required |
| working_to_change | Long text \| Required |
| goal_recovery_sobriety | Long text \| Required |
| goal_health_wellness | Long text \| Optional |
| goal_employment_education | Long text \| Optional |
| goal_housing | Long text \| Optional |
| goal_family_relationships | Long text \| Optional |
| goal_finances | Long text \| Optional |
| goal_legal | Long text \| Optional |
| goal_spiritual_growth | Long text \| Optional |
| primary_recovery_pathway | Short text \| Required |
| sponsor_or_mentor | Short text \| Optional |
| recovery_meetings | Short text \| Optional |
| counselor_therapist | Short text \| Optional |
| other_recovery_activities | Long text \| Optional |
| strength_1 | Short text \| Required |
| strength_2 | Short text \| Required |
| strength_3 | Short text \| Required |
| support_network | Long text \| Optional |
| warning_signs_behavior | Long text \| Required |
| warning_signs_internal | Long text \| Required |
| safety_plan | Long text \| Required |
| crisis_contact_1_name_phone | Short text \| Required |
| crisis_contact_2_name_phone | Short text \| Optional |
| resident_signature | Short text signature \| Required |

| SECTION 6 · NARR LEVEL II SELF-ASSESSMENT CROSSWALK (Certification In Preparation) |
| --- |
| tatus note: Grace House is preparing for NARR Level II rtification through the Iowa HHS process (temporary certification a MCRSP, Missouri’s NARR affiliate). This crosswalk is an internal lf-assessment demonstrating readiness. It is not a claim of current rtification. Contact: recoveryhousing@hhs.iowa.gov.* |

NARR Level II Compliance Crosswalk

This crosswalk maps Grace House policies and operational practices against NARR Standard 3.0 Level II requirements. NARR Level II defines a peer-supported recovery residence with a structured recovery environment, written expectations, and some staff involvement.

NARR Level II — Core Domain Requirements

| NARR Standard | Grace House Implementation | Status | Document Reference |
| --- | --- | --- | --- |
| 1.1 Safe and healthy physical environment | 1311 9th Street meets all Iowa residential housing codes. Annual safety inspections documented. | ✓ Met | Property Documentation |
| 1.2 Adequate sleeping space per resident | Historic Victorian home with private and semi-private rooms for up to 10 residents. Minimum 70 sq ft per bed. | ✓ Met | Property Documentation |
| 1.3 Adequate bathroom facilities | Multiple bathrooms serving resident population at required ratios. | ✓ Met | Property Documentation |
| 1.4 Smoke-free interior | Smoking permitted in designated outdoor areas only. Interior 100% smoke-free. | ✓ Met | Resident Handbook p. XX |
| 1.5 Accessible to persons with disabilities (to extent practicable) | Reasonable accommodations provided per FHA. Accommodation process documented. | ✓ Met | Participant Agreement |
| 2.1 Written policies that support recovery | Full Resident Handbook and Staff Operations Manual in place. | ✓ Met | This Document |
| 2.2 Residents understand and acknowledge house expectations | Signed Participant Agreement required at intake. | ✓ Met | Section 7 |
| 2.3 Recovery-supportive environment maintained | Substance-free policy enforced. Drug testing program in place. Recovery participation required. | ✓ Met | Handbook p. XX |
| 2.4 Resident rights posted and explained | Resident rights included in Handbook. Posted in common areas. | ✓ Met | Handbook p. XX |
| 2.5 Non-discrimination policy in place | Written non-discrimination policy. No exclusion based on recovery pathway including MAT. | ✓ Met | Handbook p. XX |
| 2.6 Grievance procedure in place | Step-by-step grievance procedure with external escalation options. | ✓ Met | Handbook p. XX |
| 3.1 All residents have an individualized recovery plan or equivalent | Individual Recovery Plan (IRP) completed within 72 hours. Reviewed at 30/60/90 days. | ✓ Met | Form 6 |
| 3.2 Residents encouraged to participate in recovery support activities | Minimum 2 recovery activities per week required. Multiple pathways supported. | ✓ Met | Handbook p. XX |
| 3.3 Recovery support resources made available to residents | Resource Library in VRCC. Written referral list at intake. Community resource board. | ✓ Met | Section 4 |
| 3.4 Peer support provided | Peer mentor assigned at intake. House Manager is peer. Peer-led house meetings. | ✓ Met | Staff Manual p. XX |
| 4.1 Written operational policies and procedures | Staff Operations Manual complete and reviewed annually. | ✓ Met | Section 2 |
| 4.2 Drug and alcohol testing conducted | Phased testing schedule. Results documented. Positive result protocol in place. | ✓ Met | Staff Manual p. XX |
| 4.3 MAT-affirming policy in place | Explicit MAT-affirming policy. No exclusion or stigma for MAT medications. | ✓ Met | Handbook p. XX |
| 4.4 Medication storage policy | Secure lockbox required. Controlled substances in house medication safe. | ✓ Met | Form 4 |
| 4.5 Emergency procedures in place | Crisis protocol posted. Emergency contacts on file. Narcan available and training provided. | ✓ Met | Handbook p. XX |
| 4.6 Residents free to access outside services | Residents choose own providers. No in-house clinical services required. | ✓ Met | Handbook p. XX |
| 4.7 Confidentiality policy in place | Written confidentiality policy aligned with 42 CFR Part 2 standards. | ✓ Met | Handbook p. XX |
| 5.1 Designated house manager or equivalent | House Manager role defined with documented responsibilities. | ✓ Met | Staff Manual p. XX |
| 5.2 Staff/leader training documented | Annual training requirements. Training log maintained. | ✓ Met | Staff Manual p. XX |
| 5.3 Background checks for staff | Required for all staff and volunteers prior to resident contact. | ✓ Met | Staff Manual p. XX |
| 5.4 Resident involvement in house operations | Rotating house meeting facilitation. Peer mentor opportunities. Community governance model. | ✓ Met | Handbook p. XX |
| 5.5 Written discharge policy | Planned, administrative, and emergency discharge procedures documented. | ✓ Met | Handbook p. XX |

Return-to-Use / Relapse Policy Compliance

NARR Level II requires a written policy on how return-to-use events are handled. Key compliance elements:

- Grace House has a documented Return-to-Use Response Framework (Handbook, p. XX).

- Policy explicitly rejects automatic discharge for first return-to-use events.

- Care conversation protocol within 24–48 hours is documented.

- Housing continuation framework with graduated responses is documented.

- Naloxone availability and training is documented.

- Iowa Good Samaritan protections are communicated to all residents at intake.

MAT Compliance Requirements

NARR Standard 3.0 explicitly requires that Level II residences have a written policy affirming support for persons on Medication-Assisted Treatment. Grace House compliance:

- Written MAT-Affirming Statement in Resident Handbook (p. XX).

- MAT medications not counted as positive drug screens.

- No resident may be excluded from Grace House on the basis of MAT participation.

- Medication storage accommodates MAT medications including liquid methadone (when prescribed in take-home form).

NARR Level I vs. Level II Distinction

Grace House is certified at NARR Level II, which is distinguished from Level I as follows:

| Characteristic | Grace House / Level II |
| --- | --- |
| Written policies required | Yes — comprehensive Handbook and Operations Manual |
| Recovery support participation required | Yes — minimum 2 activities/week |
| Drug testing required | Yes — phased schedule per resident |
| Staff/house manager required | Yes — House Manager role defined |
| Individual recovery plans required | Yes — IRP completed within 72 hours |
| Peer support provided | Yes — peer mentors assigned at intake |
| Clinical services provided on-site | No — Level II does not include on-site clinical services |

> SECTION 7 · GRACE HOUSE PARTICIPANT AGREEMENT

Grace House Participant Agreement

> About This Agreement
> This Agreement is between you and Grace House, operated by Grace For Addictions.
> It outlines the terms and expectations of your residency.
> Please read it carefully. Ask questions about anything that is unclear before signing.
> Signing this agreement is a mutual commitment — we commit to you as you commit to us.
> This agreement does not waive any of your rights as a resident.

RESIDENT NAME: ____________________________________

DATE OF BIRTH: ____________________________________

ADMISSION DATE: ____________________________________

ASSIGNED ROOM/BED: ____________________________________

Part 1: Program Fees and Financial Agreement

Fee schedule per Policy GH-FEES-001 (current).

| Room type | Weekly rate | Monthly prepay (due at start of month) |
| --- | --- | --- |
| Shared (double) room | $175 / week | $650 / month |
| Single (private) room | $200 / week | $700 / month |

My room type: ____________ My rate: $_______ (__ weekly / __ monthly prepay), due every _____________ (day of week, or first of month for monthly prepay).

Payment Methods Accepted:

[ ] Cash

[ ] Money order

[ ] Electronic transfer (details provided by House Manager)

I understand and agree that:

- Program fees are due on the agreed day each week. Late fees or payment plans must be arranged in advance with the House Manager.

- Non-payment of fees for more than 7 days, without an approved payment plan, may result in an administrative discharge process.

- Program fees are non-refundable for the current period, except in cases of emergency or administrative error.

- Grace House does not manage, hold, or control my personal finances.

- I am responsible for maintaining my own financial accounts and obligations.

Part 2: Recovery Participation Agreement

I agree to actively engage in my recovery while living at Grace House. I understand this means:

- Completing an Individual Recovery Plan within 72 hours of intake.

- Reviewing my IRP with the House Manager or peer mentor at 30, 60, and 90 days, and every 90 days thereafter.

- Participating in the required number of recovery support activities each week for my current phase: 4 per week in Phase 1, 3 per week in Phase 2, and 2 per week in Phase 3. Qualifying activities include 12-step meetings, SMART Recovery, Celebrate Recovery, individual therapy, sessions with my life or recovery coach, church or worship services, Bible study, the Tuesday GFA Recovery Community (GFARC) gathering, and other community-based recovery activities. I understand the weekly house meeting does not count toward this total.

- Selecting a life coach or recovery coach at intake, completing daily check-ins through the VRCC app in every phase, and attending coaching sessions weekly in Phase 1, biweekly in Phase 2, and monthly in Phase 3.

- Attending the weekly Grace House community meeting.

- Engaging in employment, education, job training, volunteering, or caregiving at least 30 hours per week by Day 30 (Policy GH-ACTIVITY-001). Exceptions may be approved by the House Manager for medical or other documented reasons.

Part 3: Substance-Free Agreement

I understand that Grace House is a substance-free environment. I agree:

- I will not use alcohol or illegal substances while living at Grace House, whether on or off the property.

- I will not bring alcohol, illegal substances, or non-prescribed medications onto the Grace House property at any time.

- I will submit to drug testing according to the house testing schedule, including random tests.

- I understand that refusing a drug test is treated the same as a positive result.

- I understand that my use of prescribed MAT medications (buprenorphine, methadone, naltrexone, etc.) does not constitute a violation of this policy.

Part 4: Community Expectations Agreement

I agree to contribute to a safe, healthy, and respectful household. Specifically, I agree to:

- Treat all residents, staff, guests, and neighbors with dignity and respect at all times.

- Complete my assigned household chores as scheduled.

- Maintain my personal space in a clean and orderly condition.

- Respect the privacy of all other residents.

- Honor quiet hours as posted.

- Follow the visitors policy, including visitor hours and the prohibition on overnight guests in bedrooms.

- Follow the curfew schedule for my current phase of residency.

- Report any safety concerns to the House Manager promptly.

Part 5: Medication Agreement

I understand and agree that:

- All prescription medications must be disclosed to the House Manager at intake and whenever new prescriptions are obtained.

- All medications will be stored in my personal lockbox or the house medication safe.

- I will not share my medications with any other resident.

- I will provide documentation from my prescribing provider for all controlled substances.

Part 6: Confidentiality Agreement

I understand that the privacy of every person in this household is sacred. I agree:

- I will not share personal information about other residents outside the house.

- I will not post photos or identifying information about other residents on social media.

- I will honor the confidentiality of what is shared in house meetings and peer conversations.

Part 7: Departure Agreement

I agree to provide a minimum of 14 days' written notice before voluntarily departing Grace House. I understand that:

- If I choose to leave without notice, I forfeit any claim to a refund for the current payment period.

- My personal belongings must be removed within 24 hours of my departure.

- I am welcome to return to Grace House community events and support as an alum.

- If I depart for a higher level of care, I am encouraged to apply for readmission when ready.

Part 8: Grievance Rights Acknowledgment

I understand that I have the right to file a formal grievance if I believe my rights have been violated or a policy has been applied unfairly. I understand:

- The grievance process is described in the Resident Handbook.

- I will not face retaliation for filing a grievance in good faith.

- I may also access external agencies including the Iowa Civil Rights Commission and HUD.

Part 9: Resident Rights Acknowledgment

I acknowledge that I have received, reviewed, and understand my Resident Rights as described in the Grace House Resident Handbook. I understand that these rights cannot be waived or removed as a condition of residency.

Part 10: Emergency and Safety Acknowledgment

I acknowledge that:

- Grace House has naloxone (Narcan) available and I have received or will receive training in its use within 7 days of intake.

- Iowa's Good Samaritan law protects me from prosecution if I call for help during an overdose emergency.

- Emergency numbers are posted in the common areas of the house.

- I will call 911 in any situation that involves a medical emergency, fire, or imminent safety threat.

Part 11: Mutual Commitment

By signing this agreement, Grace For Addictions commits to:

- Treating you with dignity, respect, and compassion at every stage of your recovery.

- Providing a safe, clean, and supportive home environment.

- Supporting your chosen recovery pathway without judgment or coercion.

- Being transparent about policies, decisions, and any changes that affect your residency.

- Responding to your needs, concerns, and grievances in a timely and fair manner.

- Celebrating your growth and walking with you through the hard days as well as the victories.

SIGNATURES

By signing below, I certify that I have read, understand, and agree to all provisions of this Participant Agreement. I have had the opportunity to ask questions and have received answers that satisfy me. I enter into this agreement freely and voluntarily.

| Resident Signature | Date |
| --- | --- |

| Resident Printed Name | Admission Date |
| --- | --- |

| House Manager Signature | Date |
| --- | --- |

| House Manager Printed Name | Title |
| --- | --- |

On behalf of Grace For Addictions, 1311 9th Street, Des Moines, Iowa 50314

thomas@graceforaddictions.org | 515-336-0006

> A Note From Thomas DeGarmeaux, Executive Director
> This agreement is not a contract of compliance — it is a covenant of community.
> Every policy in it was written with your dignity in mind.
> We believe in you. We are honored you chose Grace House.
> When this season of your life is over, we hope you will look back and say that this place helped you become more fully yourself.
> Our door is always open.
> — Thomas DeGarmeaux, Founder & Executive Director, Grace For Addictions
$docbody$, now()
from document_templates t
join organizations o on o.id = t.organization_id and o.name = 'Grace For Addictions'
where t.key = 'complete_operational_system'
on conflict (template_id, version) do nothing;

notify pgrst, 'reload schema';
