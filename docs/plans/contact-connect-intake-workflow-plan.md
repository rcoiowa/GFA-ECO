# Contact Connect Intake Workflow — Phased Implementation Plan

**Status:** Foundation implemented in source; activation not authorized or deployed  
**Canonical backend:** CQCX `cqcxvwoukyhxyokfwnjm` (live-verified before drafting)  
**Repository baseline:** `rcoiowa/GFA-ECO`, canonical continuation branch at `7e2cece`  
**Governing principle:** Gmail remains the communication channel; RecoveryOS becomes the operational source of truth.

## Executive assessment

RecoveryOS already has the correct starting spine: `recoveryos.leads`, the `lead-intake`
Edge Function, canonical in-app notifications, and a role-aware platform. The current lead
implementation is not safe to activate as the requested shared workflow because every coach,
navigator, program manager, and administrator can read and update every lead; the trigger
notifies broad roles with identifying details; and `/admin/leads` is not a real route.

The implementation must extend the canonical lead rather than import the retired Contact
Connect dashboard or create a parallel CRM.

## Current-state trace

`Wix Contact Connect` → server-to-server POST with `x-lead-secret` → CQCX `lead-intake` v11
(`verify_jwt=false` by design; shared-secret authorization in function body) → service-role
insert into `recoveryos.leads` → broad staff notification trigger → notification link is
remapped client-side to `/admin/operations` because `/admin/leads` does not exist.

Gaps confirmed in the live schema:

- four legacy stages only: `new`, `contacted`, `converted`, `closed`;
- no response deadline, next follow-up, contact history, source-event dedupe, or assignment history;
- broad `is_support_staff() OR is_admin_staff()` SELECT/UPDATE policies;
- no intake-specific coordinator/worker permission;
- no queue UI or lead data-access repository;
- email alert code can include the full inquiry when optional Resend secrets are enabled;
- no repository or live evidence that Wix currently sends an explicit housing path,
  organization context, or stable source record identifier.

## Phase 0 — Inactive additive foundation (implemented)

Migration `0147_intake_workflow_foundation.sql`:

- extends `recoveryos.leads` with the six-stage workflow, verified/source identifiers,
  inquiry kind, priority, explicit housing path, confirm-route state, deadlines, and timestamps;
- adds `intake_contact_events` for who contacted the person, when, channel, outcome,
  time spent, and next follow-up;
- adds intake-specific coordinator/worker membership and explicit routing-rule tables;
- adds least-privilege helper predicates for the future activation migration;
- seeds no staff identity and leaves all new operational tables deny-by-default;
- does not replace current lead RLS, change notifications, update Wix, create a UI, or send email.

## Phase 1 — Identity and policy verification gate

Before activation, privately verify the exact CQCX `people.id` and authenticated account for:

- Thomas (intake coordinator; founder routing owner);
- Jill (intake coordinator);
- Ashlee (intake worker);
- Tara (intake worker);
- the person/account authorized to receive the women’s housing route associated with
  `archuleta@graceforaddictions.org` — do not infer this mapping from the address.

Record executive decisions for:

- standard first-response deadline;
- priority-partnership founder response deadline;
- whether deadlines use calendar or GFA operating hours;
- overdue reminder cadence and escalation;
- whether all four people participate equally in general round-robin when a direct route
  does not apply;
- whether a verified Contact Connect submission means shared-secret acceptance or requires
  a separate human spam/quality review.

## Phase 2 — Canonical writers and RLS activation

Create audited SECURITY DEFINER RPCs for assignment/reassignment, stage transition, and
contact logging. In one migration:

- seed only the five verified membership/routing references authorized in Phase 1;
- replace broad lead SELECT/UPDATE policies atomically;
- coordinators read the entire queue and assign/reassign;
- workers read and act only on assigned inquiries;
- participants, broad staff roles, residence roles, and anonymous users receive no access;
- revoke direct client writes; all mutations go through audited RPCs;
- preserve assignment and stage history in `audit_log`;
- keep pre-account next-action timing on the lead; create canonical `follow_ups` only after
  a lead becomes a person, avoiding a second general task system.

Required negative tests: anonymous, participant, coach-only, navigator-only, residence-staff,
unassigned intake worker, assigned intake worker, coordinator, and service role.

## Phase 3 — Wix payload and deterministic routing

Update the Wix form and automation to send explicit values:

- `source_record_id` (stable Wix submission identifier);
- `inquiry_kind`: general support, housing, partnership, or other;
- for housing: women’s recovery housing, men’s recovery housing, or unsure;
- for partnership: organization name and organization-contact context;
- source submission timestamp.

Routing order:

1. partnership → priority + founder deadline + intake-group notification;
2. women’s housing → verified `archuleta@…` routing owner;
3. men’s housing → verified founder routing owner;
4. housing `unsure` or legacy housing without an explicit path → confirm-route queue;
5. other verified inquiries → round-robin across the four active eligible members.

No routing rule may infer gender or housing path from a name, pronoun, message tone, or other
sensitive trait. Existing ambiguous inquiries remain confirm-route and can be reassigned in
one action after the person clarifies what they seek.

## Phase 4 — Shared intake workspace

Add an intake-specific workspace and data-access repository using the Phase 2 RPCs/RLS:

- New, Assigned, Contacted, Waiting, Scheduled, Closed;
- overdue response and follow-up indicators;
- visible owner and last-contact summary before any teammate acts;
- one-action assign/reassign for coordinators;
- append-only contact log with next follow-up;
- coordinator full queue; worker assigned-only queue.

Do not put this inside a broad residence, coach, or admin workspace if doing so makes the
route guard imply access those roles do not have. Route guards remain UX; RLS/RPCs are the
security boundary.

## Phase 5 — Minimal alerts

First activate in-app alerts using only non-sensitive text such as “A new intake inquiry is
ready for review” plus a RecoveryOS link. Then add internal email delivery through an outbox
or reviewed Edge Function using the same minimal content. Full names, messages, phone numbers,
housing details, and outcomes remain in RecoveryOS. No participant-facing email is sent by
this package.

## Phase 6 — Operational dashboard

Build read models from the same canonical records; do not create a separate reporting store.
Permitted measures after definitions are ratified:

- verified inquiry volume and source;
- first-response time and deadline performance;
- overdue response/follow-up counts;
- active workload by assignee;
- housing-path and confirm-route volume;
- priority partnership volume and founder response time;
- contact activity/time spent;
- scheduled connections and responsibly closed inquiries;
- post-conversion service activity and outcomes only through their canonical evidence sources.

Inquiry/contact volume is activity, not an outcome. No dashboard number is populated or
claimed by this plan.

## STOP gate

Do not apply 0147 to CQCX, activate RLS, seed membership/routing, change Wix, deploy an Edge
Function, send email, or expose an intake route until Phase 1 identities and deadline policies
are verified and the repository’s stale-`main` convergence risk is resolved or explicitly
accepted for the implementation branch.
