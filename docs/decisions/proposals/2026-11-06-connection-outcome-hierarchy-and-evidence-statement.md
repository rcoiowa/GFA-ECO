# Proposal — Connection Outcome Hierarchy, Attrition Denominators & GFA Evidence Statement

**Status:** PROPOSED — requires executive ratification. Not yet governance.
**Date:** 2026-11-06
**Amends (if ratified):** `docs/product/recovery-connection-funnel-measurement-requirement.md`
**Bounded by (does not weaken):** `docs/product/recoveryos-icare-integration-authority-v1.0.md`
§7 (service-event & reporting authority), §6 (no risk/engagement scoring), and the Grace locks
(`grace-model-lock.json`; provider activation OFF; no autonomous referral or disclosure).
**Authorizes:** nothing. No migration, KPI build, dashboard, or external claim follows from this
document until ratified, and KPIs stay subject to the deferred-KPI metrics discipline.

---

## 1. Source basis — what is verified vs. reported

| Item | Status in this repo |
|---|---|
| Existing funnel layers, evidence ladder, deferred Human Connection Rate | **Verified** — present in the funnel requirement (commit `08b979f`) |
| ICARE §7: human/system-confirmed events are the reporting authority | **Verified** — locked governance |
| Sept 16 ED virtual peer-recovery evaluation (1,902 encounters; 98.3% referred; 92.1% linked; 70.3% / 46.4% self-reported retention at 30 d / 6 mo; follow-up n = 448 / 138; no comparison group) | **Reported by the external briefing; not independently verified here.** Cite the primary publication, not this file. |
| Oct 1 systematic review of 53 quantitative studies of peer recovery support services (clearest evidence for linkage/engagement; inconsistent for substance use, ED use, hospitalization, overdose, mortality; depression/anxiety gains mainly uncontrolled) | **Reported by the external briefing; not independently verified here.** |

**Inference (program design, not evidence of GFA effect):** both sources support the design that
digital access opens the door and a peer does the relationship, navigation, and follow-up. Neither
source evaluated Grace, the VRCC, or GFA. Neither shows that virtual peer support *caused* retention.

---

## 2. Proposed: connection outcome hierarchy

The principal Grace/VRCC outcome is a **participant-authorized, completed human connection**. It is
not Grace engagement time, referrals displayed, or referrals generated.

| # | Stage | Evidence that counts (per ICARE §7) | Does *not* count |
|---|---|---|---|
| 0 | Connection offered | A human or confirmed system action offering peer connection | Grace suggesting, a page view, a draft |
| 1 | **Participant authorizes connection** | Explicit, recorded participant consent to be contacted / connected | Inferred interest, engagement patterns |
| 2 | **Peer connection completed** | Peer-documented two-way contact | Attempt logged, message sent |
| 3 | **Service connection completed** | Verified resource/service connection | Referral made, referral displayed |
| 4 | **Engagement sustained** | Human-documented continued contact at defined intervals | Account still open, membership |

This maps onto the existing layers (Qualified Request → Human Response → Human Connection →
Ongoing Engagement → Continuity) and the evidence ladder. It adds an explicit **authorization** stage
and separates **peer** connection from **service** connection.

**Grace boundary:** Grace may help someone *reach a person*. Grace is never credited with stages 2–4
or with a recovery outcome. Grace has no authority to refer, disclose, or contact anyone on the
participant's behalf.

---

## 3. Proposed: attrition is reported, not hidden

Every stage reports its denominator and its non-transitions as separate, neutral categories:

- **Declined** — participant chose not to proceed (a valid choice, not a failure or a flag)
- **Attempted, not completed** — e.g. peer outreach made, no two-way contact
- **Unreachable** — no contact at follow-up; reported as a count, never imputed as retained or lost
- **Follow-up not attempted** — kept distinct from unreachable

Constraints:

- Counts are **unique people**, privacy-protectively resolved, with event records preserved
  (existing identity-resolution requirement). Repeat contacts never count as new people.
- These data are **for aggregate program evaluation only**. They must not become individual
  predictive risk scores, engagement scores, staff alerts, nudges, or eligibility gates
  (ICARE §6; no autonomous escalation).

---

## 4. Proposed: equity stratification (pilot evaluation)

Report reach, authorization, peer connection, service connection, and sustained engagement by:
rurality, race/ethnicity, primary language, disability/access needs, device/connectivity access, and
referral source.

Constraints:

- **Voluntary and self-reported.** Each field allows "prefer not to say." No inference of any
  characteristic from behavior, text, voice, or device signals.
- **Aggregate only**, with small-cell suppression (threshold to be set with the evaluation partner).
- **Collect only what the evaluation needs.** Each field needs a stated analytic purpose before
  collection.

---

## 5. Proposed: canonical GFA evidence statement

For grants, partner agreements, dashboards, and public materials:

> "Peer recovery support shows its clearest evidence for improving connection and engagement;
> broader health and utilization outcomes remain promising but inconsistent."

Do not claim that peer services, Grace, or the VRCC are proven to reduce overdose, return to use,
emergency-department use, hospitalization, depression, or mortality. GFA-reported figures describe
connection and engagement that GFA delivered. They are not evidence that GFA *caused* recovery
outcomes. This keeps GFA's nonclinical identity intact.

---

## 6. Proposed: evaluation-design asks for Public Science Collaborative

1. A comparison or phased/stepped implementation design where it is feasible and ethical, while
   keeping participation voluntary.
2. Unique-participant counts, with unreachable and declined participants reported at each stage.
3. Subgroup results under §4 constraints.
4. Minimal sensitive-data collection, with a written data-use agreement.

---

## 7. Open decisions for ratification

- [ ] Adopt the §2 hierarchy as an amendment to the funnel requirement?
- [ ] Adopt the §5 wording as the canonical evidence statement?
- [ ] Set the follow-up intervals for "engagement sustained" (e.g. 30 d / 6 mo)?
- [ ] Set the small-cell suppression threshold and the stratification field list with PSC?
- [ ] Verify both external sources against their primary publications before anyone cites them
      externally.
