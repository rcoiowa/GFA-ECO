# EJWRH Program Model — Canonical Reconciliation v1.0

**Status: EXECUTIVE DECISIONS LOCKED (2026-08-24). Documentation reconciliation pass only —
no residence workflow is implemented by this document, no CQCX mutation, no Cloudflare
activation.** This record supersedes the conflicting semantics of the earlier EJWRH
four-level material and becomes the canonical basis for the EJWRH document editions required
by Gate B §5a (`docs/plans/gate-b-ejwrh-intake-architecture.md`).

**Sources & evidence classes:** executive decisions in this document are leadership-issued
(2026-08-24 directive). Citations to `EJWRH_Complete_Operational_System.docx`,
`EJWRH_F_ResidentParticipantAgreement.docx`, and
`EJWRH_ProfessionalServices_Agreement_v2.docx` are **ED-cited source documents not present
in this repository** (Evidence class C — leadership-confirmed). Repo/live claims (Grace
House canon, platform phase machinery, meeting RPCs) are verified (class B).

---

## 1. Resident phase model — THREE PHASES (four-level model retired)

The reconciled resident model is three phases. The four-level document is **retired as
authority**: its useful developmental logic (progression, autonomy, trust, peer leadership,
recovery capital) is absorbed below; its rejected semantics (mandatory AA/NA, sponsor
requirements, 12-Step milestone requirements, "nonresident" status, conflicting curfews) are
**removed and must not be encoded anywhere in RecoveryOS**.

| Phase | Purpose | Curfew | Core expectation |
|---|---|---|---|
| **Phase 1 — Foundation** | Stabilize, orient, connect, build plan | **9:00 PM** | High support; IRP; peer connection; early employment/education planning |
| **Phase 2 — Growth** | Build consistency, responsibility, recovery capital | **10 PM Sun–Thu / 11 PM Fri–Sat** | 30 hrs/week employment/education/volunteering when applicable; deeper community engagement |
| **Phase 3 — Leadership & Transition** | Independence, leadership, transition readiness | **11 PM Sun–Thu / Midnight Fri–Sat** | Mentorship; transition planning; sustained recovery-support network |

Rules: curfew begins at 9:00 PM in the earliest stage, expands progressively, and **never
extends past midnight**. There is no fourth program state and no "nonresident" status.
Consistency note (verified): this matches the Grace House canonical curfew table
(GH-CURFEW-001 v3.0 — 9/10 → 10/11 → 11/midnight with a midnight hard ceiling) and the
platform's existing phase machinery (`packages/domain/src/phases.ts`, `getPhaseInfo`,
staff-recorded phase resets) — EJWRH inherits working machinery, not new invention. Phase
*durations* for EJWRH (day boundaries vs. readiness-based) follow the EJWRH operational
documents at edition-authoring time; nothing here hardcodes day counts.

## 2. Program participation — LOCKED

- **Employment / education / volunteering:** target **30 hours/week once the participant is
  stabilized enough for that expectation** ("when applicable" — stabilization is a human
  judgment, never an automated gate).
- **Recovery-support activities:** weekly **approved recovery-support activity** —
  **pathway-neutral by definition**. The platform never assumes AA/NA-only; any approved
  pathway counts (mutual aid of any tradition, SMART, faith-based, cultural, coaching,
  peer support). *Confirmation item (§9.1):* the directive says "4 recovery-support meetings
  per week should mirror Grace House," while the verified Grace House canon tapers by phase
  (4 → 3 → 2 per week; coaching sessions count toward the total). Whether EJWRH is 4/week
  flat or mirrors the taper needs one executive confirmation before the EJWRH handbook
  edition is authored; the pathway-neutral framing is locked either way.
- **Sponsor relationship: strongly encouraged, never mandatory.** No 12-Step milestone
  requirements exist anywhere in the model.
- **Relational support counts:** sponsor contact, coaching, and peer support count as
  relational recovery support. **No artificial busywork and no duplicate logging** — work
  already captured through coaching/navigation/service attestation is never re-entered to
  satisfy a participation count.

## 3. Return-to-use / screening response — LOCKED

**A positive screen may result in discharge, but never automatically.** The canonical
sequence:

positive / concerning result → **mandatory care conversation** → assess immediate safety and
circumstances → intensified recovery support where appropriate → clinical/higher-level-of-care
referral where appropriate → evaluate community safety and continued-fit factors →
**documented human decision** → remain / support-plan modification / temporary higher level
of care / discharge.

**RecoveryOS must never auto-discharge from a screening result** — no trigger, workflow,
threshold, or status transition may convert a screening row into a discharge without the
documented human decision above. This aligns with the ED-cited Participant Agreement (return
to use does not automatically result in discharge; response begins with a care conversation)
and the existing platform doctrine (screening vocabulary is canonical;
prescription-consistent results are lawful medication and never violations; discharge is a
deliberate staff RPC).

## 4. GFA / Operator authority — CONTRACTED-SERVICE MODEL

RecoveryOS permissions mirror the **executed** agreement — never earlier architectural
assumptions. The canonical division (per the ED-cited PSA framing):

| EJWRH Operator | Grace For Addictions (contracted services) |
|---|---|
| Housing operations | Contracted recovery-support services |
| Resident agreements | Program development |
| Financial management | Peer coaching |
| Property oversight | Navigation |
| Staffing responsibilities of the housing operation | Recovery planning |
| Housing-related compliance | Training / technical assistance |
| | Documentation systems |
| | Compliance support |
| | Data / reporting support |
| | Financial planning/budgeting assistance where requested |
| | RecoveryOS / VRCC infrastructure |

GFA is **not** encoded as the unilateral housing operator. *Confirmation item (§9.2):* which
PSA version is executed and controlling must be confirmed before RecoveryOS role/permission
changes encode this split; the cited v2 uses the contracted-service framing and reserves
housing, resident agreements, financial management, compliance, staffing, and property
oversight to the Operator.

## 5. House meeting record — GroupMe, and the effort ceiling

Canonical correction: the house communication tool is **GroupMe** (not BAND — BAND
references anywhere are corrected). Over time the operational dependency on GroupMe is
replaced by a minimal RecoveryOS House Meeting workflow under a binding rule:

> **Do not make RecoveryOS more cumbersome than GroupMe.** If the House Manager currently
> types a quick update in GroupMe, RecoveryOS must require no more effort than that — and
> ideally less.

Verified head start: `record_meeting` / `record_meeting_attendance` (migration 0128, live)
and the /staff/house-ops one-tap attendance page already exist — the replacement is a
WIRE/refine task measured against the GroupMe effort ceiling, not a build.

## 6. Individual Recovery Plan (IRP) — GENERATED RELATIONAL VIEW

The IRP is **not** a parallel case-plan table filled out from scratch. It is a generated,
**participant-owned relational view** over existing RecoveryOS data:

1. What matters to me · 2. Current goals · 3. Strengths and recovery capital ·
4. Needs / barriers · 5. People supporting me · 6. My next steps ·
7. Progress since my last review · 8. What I want to change

Each section renders from canonical records already captured in the flow of real work
(goals + domains, navigation needs/loops, support-team relationships, follow-ups,
attested services, BARC-10 where the participant chose it — one locked total, never
subdomains). **The review cycle creates an immutable/versioned snapshot** (the P2/Gate-B
evidence pattern: versioned, hashed, reproducible), giving longitudinal evidence without
coaches duplicating anything they already recorded. This satisfies the ED-cited operational
requirement (IRP shortly after admission + periodic review) by generation, not by
reproducing paper workflows. Example rule made concrete: a coach never "documents a
goal-review session" and then separately updates an IRP — the goal work updates the record;
the IRP view reflects it.

## 7. The operating principle — THE BURDEN TEST (governs all EJWRH implementation)

> **No feature earns its place merely because a paper form exists.**

A RecoveryOS workflow is added only when it: (1) protects safety or rights; (2) fulfills a
genuine operational/compliance need; (3) improves continuity of care/support; (4) creates
reusable evidence from work already being done; or (5) materially reduces administrative
burden.

> **Natural action first. Documentation second. Reporting derived afterward.**

Every proposed EJWRH workflow must pass this test in its design record; features whose
evidence value does not justify participant/staff effort are rejected. (This generalizes the
Gate B frontline principle and the minimum-sufficient-documentation doctrine.)

## 8. Reconciliation of conflicting semantics — verified sweep

| Conflicting semantic | Where it lives | Disposition |
|---|---|---|
| Four-level resident model, "nonresident" Level 4 | ED-cited EJWRH four-level document (not in repo) | **Retired as authority**; never encoded. Repo verified clean — the only "Level 4" strings in repo are unrelated ladders (incident severity; conduct-response housing review), untouched |
| Mandatory AA/NA, sponsor requirement, 12-Step milestones | same source | **Removed**; replaced by §2 (pathway-neutral, sponsor encouraged) |
| Conflicting curfews | same source | **Reconciled** to the §1 table (9 → 10/11 → 11/midnight; midnight ceiling) |
| BAND as house record | ED-cited operational material | **Corrected to GroupMe** (repo verified: no operational BAND dependency exists in code) |
| GFA-as-operator assumptions | earlier architectural material | **Corrected** to the §4 contracted-service split, pending §9.2 confirmation |
| Paper IRP as a form to re-enter | ED-cited operational system | **Replaced** by the §6 generated view + snapshot |

Platform note: `phases.ts` currently carries the Grace House phase definitions
(names/days/activities). If EJWRH's confirmed numbers differ (§9.1) the phase machinery
gains per-residence parameters at implementation time — an EXTEND, flagged here so it is
never hardcoded around.

## 9. Confirmation items (small, explicit — nothing else is open)

1. **Weekly recovery-support count:** 4/week flat, or mirror the Grace House 4→3→2 phase
   taper (coaching counts toward the total either way; pathway-neutral either way).
2. **Executed PSA version:** confirm which agreement version controls before RecoveryOS
   roles/permissions encode the §4 split.
3. **EJWRH document editions:** the Gate B §5a reconciliation authors the EJWRH participant
   agreement / handbook / house documents **from this program model** — the four-level
   document is not a drafting source for requirements this record removed.

## 10. What this document does NOT authorize

No residence workflow implementation; no Gate B implementation; no phase-tracking, curfew,
participation-hours, or screening workflow builds; no CQCX mutation; no Cloudflare
activation; no applicant traffic. Every future EJWRH workflow proposal cites this model and
passes the §7 burden test.
