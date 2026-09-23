-- 0152_grace_house_document_integrity.prepared.sql
-- CONSOLIDATED Grace House document-body & acknowledgment integrity correction.
--
-- STATUS: PREPARED ONLY — APPLICATION IS NOT AUTHORIZED. Sequenced AFTER live
-- 0150_intake_consent_evidence and 0151_strict_classification_semantics
-- (Path 1, ratified 2026-09-23). This artifact lives outside supabase/launch/
-- prepared/ (the Gate-A hash-pinned manifest for the 0147-0151 chain) and
-- outside supabase/launch/migrations/ (auto-applied lineage). It is promoted to
-- launch/migrations/ as 0152 ONLY after 0150 and 0151 are applied and under a
-- separate explicit apply authorization.
--
-- WHAT / WHY: CQCX holds ~420-char PLACEHOLDER bodies for four resident-facing
-- acknowledge documents; each already carries one resident acknowledgment
-- against the placeholder. document_versions bodies are IMMUTABLE per
-- (template_id, version) and content_hash is DB-computed (0139). We therefore
-- SUPERSEDE each placeholder with a new full edition (never UPDATE/DELETE the
-- stub). The active edition is the latest published_at
-- (ensure_my_document_assignments), so the full edition becomes current while
-- the placeholder and its acknowledgment are preserved as historical evidence.
--
-- ACKNOWLEDGMENT NOTE (non-negotiable): acknowledgment of a placeholder edition
-- DOES NOT prove acknowledgment of the complete policy. This migration performs
-- NO resident re-acknowledgment and alters NO assignment/acknowledgment row.
-- Re-acknowledgment wording, notice, timing and evidentiary treatment await
-- counsel (DOC-INTEGRITY-001 governance questions).
--
-- ASSIGNMENT-SURFACE CORRECTION (verified read-only 2026-09-23 against the live
-- 0139 definition): the four docs are requires_signature=false BUT
-- requires_acknowledgment=true (set in 0139). The CURRENT live
-- ensure_my_document_assignments() assigns the latest published version of every
-- active template where (requires_signature OR requires_acknowledgment) — NOT
-- signature-only (that was the retired 0013 behavior). Therefore APPLY 1 is NOT
-- acknowledgment-neutral: once these full editions are published, the next time a
-- resident with an active residency (or approved application) opens the Documents
-- area, that SECURITY DEFINER RPC will create a NEW assignment for the new full
-- edition and surface a re-acknowledgment. No signature is compelled, but a
-- re-acknowledgment IS surfaced through the ordinary resident path. For that
-- reason APPLYING this migration is itself counsel-gated (DOC-INTEGRITY-001):
-- publish only once counsel has answered the re-acknowledgment questions. This
-- migration still writes NO assignment/acknowledgment row directly.
--
-- AUDIENCE (ratified 2026-09-23): staff/governance/certification templates are
-- WITHDRAWN from the resident-readable surface (is_active=false) WITHOUT
-- deleting history; intake-workflow templates are likewise withdrawn from the
-- resident document-acknowledgment surface (DA to confirm no intake-flow
-- dependency before apply).
--
-- INCLUDES the ratified NAME-001 correction (Thomas DeGarmeaux, Founder &
-- Executive Director) inside the complete Emergency Response Protocols edition.
--
-- EXPECTED HASHES (body_markdown sha256):
--   emergency_response_protocols: live placeholder v1.0=bd3010c48bc3d809695b96b5a28fd18678a0ba5fb2289f2f8ff8a873c5576a34  ->  new full v1.1=192952fedf022700f4a1a17a64498c3b8744815d5585c4219f988f95f67bf7f6
--   curfew_pass_policy: live placeholder v2.0=142fc1e5e53e97c7440ac8519a4d4a42eaf19671654a677de1cf13af2e417bfe  ->  new full v2.1=ee19a60d856b0da155561eeecc69c45a6e2106379d7e62ebb35719c25752758f
--   exit_transition_policy: live placeholder v2.0=8e7c46d1866a82c37abfa6e0e37d2b9789b63cdce389da86a4033d10bb88f328  ->  new full v2.1=48f3d09c3d8cf198cd69ee76d22ceb04dfb949ccfe69a3e151791b2c1b59f874
--   grievance_policy_form: live placeholder v1.0=a56c94ceb2afe712ba9c3c64070c9f8b73300333fb7739439473a24843cb0666  ->  new full v1.1=a41046d4e868488f1cb099a4f29818df21fba7e7992dafcd6cfa692e2d8e5757
--
-- STOP CONDITIONS (self-aborting): any of the four live placeholder hashes not
-- matching; any target new version already present; any postcheck mismatch.
--
-- ROLLBACK: 0152_grace_house_document_integrity.rollback.sql (unpublish/remove
-- the new versions only while unassigned; re-activate withdrawn templates;
-- placeholders and acknowledgments never touched).

set search_path = recoveryos, public;

-- ============================ PRECHECKS ============================
do $$
declare v_tpl bigint; v_hash text; v_new int; r record;
begin
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
    where t.key='emergency_response_protocols';
  if v_tpl is null then raise exception 'D0152 PRECHECK: template emergency_response_protocols not found'; end if;
  select content_hash into v_hash from recoveryos.document_versions where template_id=v_tpl and version='1.0';
  if v_hash is distinct from 'bd3010c48bc3d809695b96b5a28fd18678a0ba5fb2289f2f8ff8a873c5576a34' then raise exception 'D0152 PRECHECK: emergency_response_protocols v1.0 live hash % != expected placeholder bd3010c48bc3d809695b96b5a28fd18678a0ba5fb2289f2f8ff8a873c5576a34', v_hash; end if;
  select count(*) into v_new from recoveryos.document_versions where template_id=v_tpl and version='1.1';
  if v_new <> 0 then raise exception 'D0152 PRECHECK: emergency_response_protocols v1.1 already exists', v_new; end if;
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
    where t.key='curfew_pass_policy';
  if v_tpl is null then raise exception 'D0152 PRECHECK: template curfew_pass_policy not found'; end if;
  select content_hash into v_hash from recoveryos.document_versions where template_id=v_tpl and version='2.0';
  if v_hash is distinct from '142fc1e5e53e97c7440ac8519a4d4a42eaf19671654a677de1cf13af2e417bfe' then raise exception 'D0152 PRECHECK: curfew_pass_policy v2.0 live hash % != expected placeholder 142fc1e5e53e97c7440ac8519a4d4a42eaf19671654a677de1cf13af2e417bfe', v_hash; end if;
  select count(*) into v_new from recoveryos.document_versions where template_id=v_tpl and version='2.1';
  if v_new <> 0 then raise exception 'D0152 PRECHECK: curfew_pass_policy v2.1 already exists', v_new; end if;
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
    where t.key='exit_transition_policy';
  if v_tpl is null then raise exception 'D0152 PRECHECK: template exit_transition_policy not found'; end if;
  select content_hash into v_hash from recoveryos.document_versions where template_id=v_tpl and version='2.0';
  if v_hash is distinct from '8e7c46d1866a82c37abfa6e0e37d2b9789b63cdce389da86a4033d10bb88f328' then raise exception 'D0152 PRECHECK: exit_transition_policy v2.0 live hash % != expected placeholder 8e7c46d1866a82c37abfa6e0e37d2b9789b63cdce389da86a4033d10bb88f328', v_hash; end if;
  select count(*) into v_new from recoveryos.document_versions where template_id=v_tpl and version='2.1';
  if v_new <> 0 then raise exception 'D0152 PRECHECK: exit_transition_policy v2.1 already exists', v_new; end if;
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
    where t.key='grievance_policy_form';
  if v_tpl is null then raise exception 'D0152 PRECHECK: template grievance_policy_form not found'; end if;
  select content_hash into v_hash from recoveryos.document_versions where template_id=v_tpl and version='1.0';
  if v_hash is distinct from 'a56c94ceb2afe712ba9c3c64070c9f8b73300333fb7739439473a24843cb0666' then raise exception 'D0152 PRECHECK: grievance_policy_form v1.0 live hash % != expected placeholder a56c94ceb2afe712ba9c3c64070c9f8b73300333fb7739439473a24843cb0666', v_hash; end if;
  select count(*) into v_new from recoveryos.document_versions where template_id=v_tpl and version='1.1';
  if v_new <> 0 then raise exception 'D0152 PRECHECK: grievance_policy_form v1.1 already exists', v_new; end if;
  raise notice 'D0152 prechecks passed.';
end $$;

-- ==================== APPLY 1: supersede 4 resident-facing docs ====================
insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.1', $b_emergency_response_protocols$# GRACE FOR ADDICTIONS

## Grace House Emergency Response Protocols

Effective Date: February 3, 2026  
Version: 1.1  
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

INTERNAL CONTACTS: - House Manager: On-site — Residents Warmline 515-310-DIAL (3425) - Founder & Executive Director: Thomas DeGarmeaux — Office 515-220-8771 - GFA President: Dave Stout — via Office 515-220-8771 - Board Chair: via Office 515-220-8771 or Toll-Free (877) 295-2535

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
Emergency Response Protocols — Version 1.1  
Effective: February 3, 2026 · Revised: September 21, 2026
$b_emergency_response_protocols$, now()
from recoveryos.document_templates t
join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
where t.key='emergency_response_protocols'
on conflict (template_id, version) do nothing;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.1', $b_curfew_pass_policy$# Curfew & Pass Policy + Overnight Pass / Furlough Request Form

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
$b_curfew_pass_policy$, now()
from recoveryos.document_templates t
join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
where t.key='curfew_pass_policy'
on conflict (template_id, version) do nothing;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '2.1', $b_exit_transition_policy$# Exit & Transition Policy

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
$b_exit_transition_policy$, now()
from recoveryos.document_templates t
join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
where t.key='exit_transition_policy'
on conflict (template_id, version) do nothing;

insert into recoveryos.document_versions (template_id, version, body_markdown, published_at)
select t.id, '1.1', $b_grievance_policy_form$# GRACE FOR ADDICTIONS

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
$b_grievance_policy_form$, now()
from recoveryos.document_templates t
join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
where t.key='grievance_policy_form'
on conflict (template_id, version) do nothing;

-- ==================== APPLY 2: withdraw staff/internal from resident surface ====================
update recoveryos.document_templates t
set is_active=false
from recoveryos.organizations o
where o.id=t.organization_id and o.name='Grace For Addictions'
  and t.key in ('complete_operational_system','code_of_ethics','incident_report_system','change_course_leaders_policy','narr_ii_self_assessment') and t.is_active=true;
-- (history preserved: versions/rows are never deleted; is_active=false removes
--  them from the resident-readable surface per document_templates_read.)
-- ==================== APPLY 3: withdraw intake-workflow docs (DA-confirm no intake dependency) ====================
update recoveryos.document_templates t
set is_active=false
from recoveryos.organizations o
where o.id=t.organization_id and o.name='Grace For Addictions'
  and t.key in ('form_application_prescreening','intake_forms_package') and t.is_active=true;

-- ============================ POSTCHECKS ============================
do $$
declare v_tpl bigint; v_h text; v_latest text; v_inactive int;
begin
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions' where t.key='emergency_response_protocols';
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='1.1';
  if v_h is distinct from '192952fedf022700f4a1a17a64498c3b8744815d5585c4219f988f95f67bf7f6' then raise exception 'D0152 POSTCHECK: emergency_response_protocols v1.1 hash % != 192952fedf022700f4a1a17a64498c3b8744815d5585c4219f988f95f67bf7f6', v_h; end if;
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='1.0';
  if v_h is distinct from 'bd3010c48bc3d809695b96b5a28fd18678a0ba5fb2289f2f8ff8a873c5576a34' then raise exception 'D0152 POSTCHECK: emergency_response_protocols placeholder v1.0 mutated'; end if;
  select version into v_latest from recoveryos.document_versions where template_id=v_tpl and published_at is not null order by published_at desc limit 1;
  if v_latest <> '1.1' then raise exception 'D0152 POSTCHECK: emergency_response_protocols latest published % != 1.1', v_latest; end if;
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions' where t.key='curfew_pass_policy';
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='2.1';
  if v_h is distinct from 'ee19a60d856b0da155561eeecc69c45a6e2106379d7e62ebb35719c25752758f' then raise exception 'D0152 POSTCHECK: curfew_pass_policy v2.1 hash % != ee19a60d856b0da155561eeecc69c45a6e2106379d7e62ebb35719c25752758f', v_h; end if;
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='2.0';
  if v_h is distinct from '142fc1e5e53e97c7440ac8519a4d4a42eaf19671654a677de1cf13af2e417bfe' then raise exception 'D0152 POSTCHECK: curfew_pass_policy placeholder v2.0 mutated'; end if;
  select version into v_latest from recoveryos.document_versions where template_id=v_tpl and published_at is not null order by published_at desc limit 1;
  if v_latest <> '2.1' then raise exception 'D0152 POSTCHECK: curfew_pass_policy latest published % != 2.1', v_latest; end if;
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions' where t.key='exit_transition_policy';
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='2.1';
  if v_h is distinct from '48f3d09c3d8cf198cd69ee76d22ceb04dfb949ccfe69a3e151791b2c1b59f874' then raise exception 'D0152 POSTCHECK: exit_transition_policy v2.1 hash % != 48f3d09c3d8cf198cd69ee76d22ceb04dfb949ccfe69a3e151791b2c1b59f874', v_h; end if;
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='2.0';
  if v_h is distinct from '8e7c46d1866a82c37abfa6e0e37d2b9789b63cdce389da86a4033d10bb88f328' then raise exception 'D0152 POSTCHECK: exit_transition_policy placeholder v2.0 mutated'; end if;
  select version into v_latest from recoveryos.document_versions where template_id=v_tpl and published_at is not null order by published_at desc limit 1;
  if v_latest <> '2.1' then raise exception 'D0152 POSTCHECK: exit_transition_policy latest published % != 2.1', v_latest; end if;
  select t.id into v_tpl from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions' where t.key='grievance_policy_form';
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='1.1';
  if v_h is distinct from 'a41046d4e868488f1cb099a4f29818df21fba7e7992dafcd6cfa692e2d8e5757' then raise exception 'D0152 POSTCHECK: grievance_policy_form v1.1 hash % != a41046d4e868488f1cb099a4f29818df21fba7e7992dafcd6cfa692e2d8e5757', v_h; end if;
  select content_hash into v_h from recoveryos.document_versions where template_id=v_tpl and version='1.0';
  if v_h is distinct from 'a56c94ceb2afe712ba9c3c64070c9f8b73300333fb7739439473a24843cb0666' then raise exception 'D0152 POSTCHECK: grievance_policy_form placeholder v1.0 mutated'; end if;
  select version into v_latest from recoveryos.document_versions where template_id=v_tpl and published_at is not null order by published_at desc limit 1;
  if v_latest <> '1.1' then raise exception 'D0152 POSTCHECK: grievance_policy_form latest published % != 1.1', v_latest; end if;
  select count(*) into v_inactive from recoveryos.document_templates t
    join recoveryos.organizations o on o.id=t.organization_id and o.name='Grace For Addictions'
    where t.key in ('complete_operational_system','code_of_ethics','incident_report_system','change_course_leaders_policy','narr_ii_self_assessment','form_application_prescreening','intake_forms_package') and t.is_active=false;
  if v_inactive <> 7 then raise exception 'D0152 POSTCHECK: withdrawn count % != 7', v_inactive; end if;
  raise notice 'D0152 OK: 4 superseding editions published; placeholders preserved; % templates withdrawn.', v_inactive;
end $$;

notify pgrst, 'reload schema';
