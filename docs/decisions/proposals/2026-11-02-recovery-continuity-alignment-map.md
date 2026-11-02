# PROPOSAL — RecoveryOS Strategic Alignment Map (Recovery Continuity)

**Status:** Proposal only. Nothing here is implementation authority, a schema change,
a metric definition, a program commitment, or external-communication approval.
**Source:** Executive working session, Thomas DeGarmeaux, 2026-11-02. Terminology
decided that day is recorded in
`../2026-11-02-recovery-ally-terminology-and-recovery-continuity.md`; this file
preserves the strategic map and draft deliverables for review.
**Reconciliation notes** against ratified repository governance are marked ⚠ inline.

## Organizing idea

GFA's platform work is framed as a **Recovery Continuity Platform** — its purpose is
to help a person move from need, through connection and follow-through, toward
belonging, recovery capital, and long-term stability.

⚠ Per the terminology decision: this journey is **flexible and
participant-directed**. Belonging and stability are outcomes people may define and
pursue, not stages the system assumes. "Retention/Continuity is a separate axis, not
a ladder stage" (`docs/architecture/domain-vocabulary-v1.0.md` §4).

Proposed doctrine phrasing for the four relationship roles:

> Coaches help people move forward.
> Navigators help people find pathways.
> Recovery Allies help people stay connected.
> Recovery Circles help people belong.

## Proposed artifacts

### 1. One-page institutional overview (external-facing)

For foundations, donors, partners, Iowa HHS, county leaders, opioid-settlement
opportunities, legislators, churches, corporate funders. Draft content: who we are
(relationship-centered recovery support — coaching, navigation, recovery housing
support, family and ally support, community connection, reentry support, practical
assistance), what we believe (a referral is not a connection; a connection is not
follow-through; follow-through builds trust), what we do (Recovery Coaching, Recovery
Allies, Recovery Circles, ANCHOR reentry support, housing navigation, transportation
assistance, family & ally support, Warmline connection, digital access, RecoveryOS),
and what success looks like (human connections, warm handoffs, housing stability,
community belonging, recovery-capital development, long-term recovery support).

⚠ Before external use: every service and availability claim must be verified against
current approved records (see `docs/launch/service-readiness-scorecard.md` and the
program-availability ratification gates in `docs/content/`). FY2025 numbers,
participant counts, and volunteer counts require reconciliation and approved
reporting definitions first.

### 2. Participant journey graphic

A flexible visual: someone reaches out (Contact Connect, Warmline, referral,
family/friend) → welcoming human response with safe contact preferences → needs and
goals conversation → an appropriate path (coach, Recovery Ally, navigation, housing,
ANCHOR, Recovery Circle, family pathway) → barrier resolution (transportation,
documents, applications, devices, benefits) → belonging (Recovery Allies, Recovery
Circles, VRCC, community events, volunteering) → recovery capital → long-term
connection — closing on "You matter. You belong. Your future is not finished."

⚠ Present as a narrative of what GFA offers, not a uniform sequence participants
follow or a tracked pipeline.

### 3. Contact Connect workflow (operational accountability)

Submission arrives → ownership assigned → safe contact determined → first contact
attempt → needs review → support path selected → warm handoff → follow-up scheduled →
connection confirmed → ongoing support → resolution or continued engagement.

Proposed supporting structures (future RecoveryOS work, unauthorized): a Contact
Connect queue (submitted / assigned / first-contact-due / ownership / status /
priority), owner + backup owner + next action + due date on every inquiry ("no
orphaned requests"), workflow-status tracking (no response, no contact, needs
follow-up, needs supervisor review, closed), and stored safe-communication
preferences (call/text/email, daytime/evening, no voicemail, authorized contacts).

⚠ Status tracking is **human workflow state only**. No autonomous escalation, silent
staff alerts, or risk inference — governed by
`docs/product/recoveryos-icare-integration-authority-v1.0.md`. Contact Connect's
existing posture (human-reviewed inquiries; automation emails the submitter only) is
recorded in `../2026-09-14-p0-classification-authorization-isolation.md`.

### 4. Recovery Continuity framework (doctrine proposal)

Recovery often involves multiple systems — treatment, housing, employment,
healthcare, corrections, community support, family systems. GFA does not own those
systems; it helps people remain connected between them. Proposed formula: request +
relationship + follow-through + belonging = recovery continuity. Includes a warm
handoff tracker distinguishing: referral made / connection confirmed / connection
pending / connection declined / unable to reach.

⚠ The warm-handoff distinctions align with the ratified evidence ladder
(`docs/architecture/domain-vocabulary-v1.0.md` §4) and should adopt its definitions.
A proposed composite **"Continuity Score" KPI is blocked** by the ratified "no
generic Retention Score" constraint; its ingredients (requests assigned, connections
confirmed, follow-ups completed, unresolved requests, time to first response) may
proceed only as separately-defined atomic metrics under the metrics discipline.
**Human Connection Rate remains deferred**
(`docs/product/recovery-connection-funnel-measurement-requirement.md`).

### 5. Opioid settlement alignment sheet

Maps Iowa opioid-settlement priority activities to GFA functions: peer support →
recovery coaching & Allies; recovery services → Recovery Circles & navigation; warm
handoffs → Contact Connect workflow; transportation → transportation assistance;
jail-based transition → ANCHOR reentry support; housing → housing navigation; lived
experience → peer-led support; treatment↔recovery connection → Recovery Continuity
framework.

⚠ The settlement priority list is cited from presentation material (reported
evidence); verify against the primary settlement guidance before use in an
application. Each "GFA Response" claim requires current operational verification.

## Proposed phasing (not a commitment)

- **Phase 1 (~14 days):** finalize the one-pager, journey graphic, Contact Connect
  workflow; review the Recovery Continuity framework; consider Belonging as an
  outcome category; reconcile FY2025 numbers, participant counts, volunteer counts;
  establish approved reporting definitions. Candidate funding targets: Walmart
  (transportation), Bankers Trust (housing access), Community Foundation (capacity),
  Prairie Meadows (digital access).
- **Phase 2 (30–60 days):** RecoveryOS build candidates — Contact Connect queue,
  assignment engine, follow-up tracking, service-ownership dashboard, outcome
  definitions registry; dashboards for requests / contacts / connections /
  follow-through / belonging / recovery capital.
- **Phase 3 (60–120 days):** full funding packages (Iowa HHS, opioid settlement,
  recovery housing expansion, family recovery & preservation, ANCHOR expansion);
  publish the Recovery Continuity framework, community impact report, case for
  support, settlement alignment brief.

⚠ Phase 2–3 items each require their own authorization; listing here authorizes
nothing. "Belonging" as an outcome category requires a governed metric definition
before any dashboard reports it.

## Future Recovery Allies module (proposal only — no data collection authorized)

Candidate capabilities, contingent on role and workflow approval: recruitment
pipeline (application, interview, references, background checks, training status),
matching (interests, pathway preferences, geography, availability, shared life
experience, language, comfort level), relationship tracking (match date, last/next
contact, check-in frequency, relationship status, follow-up required), and a
volunteer journey (interested → applicant → trained → active → lead → mentor →
retired).

⚠ None of these fields may be collected, and no requirement (training, background
check) becomes operative, until the role definition and workflow are approved.
Matching on sensitive attributes (shared life experience, language) needs explicit
consent design under the privacy and minimum-necessary rules.
