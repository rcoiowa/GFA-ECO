# Downstream Measurement Requirement — Recovery Connection Funnel

**Status:** Executive requirement on the canonical intake architecture (2026-09-03)
**Scope:** Requirement only — it defines what the canonical intake foundation must
eventually measure. It does not reopen the Migration 0147 supersession decision
(`docs/decisions/2026-09-03-intake-0147-supersession.md`), authorize any migration,
implement any KPI, or ratify any external metric use.

## Requirement

The canonical intake foundation should support person-based measurement of GFA's recovery
connection pathway without conflating people, submissions, services, or outcomes.

### Required measurement layers

Digital Front Door Reach → Contact Connect Activity → Unique Contact Connect Person →
Qualified Recovery-Support Request → Human Response → Human Connection → Ongoing
Engagement → Continuity → Outcome

Events and people must remain distinct. Multiple submissions or touchpoints by one person
must not be represented as multiple people.

### Need classification

Contact Connect requests should support structured, non-exclusive need classification
including: recovery coaching, peer/human connection, recovery housing, resource
navigation, recovery community, reentry, employment, transportation, family/loved-one
support, mental-health/wellness connection, and other recovery-support needs.

### Evidence ladder

The architecture must preserve GFA's evidence ladder:

**Activity → Engagement → Connection → Progress → Outcome → Sustained Outcome**

A submission is not a human connection. A referral is not a completed connection. A
support request is not evidence that support was delivered.

### Identity resolution

Where identity resolution is available and appropriately authorized, the system should
permit multiple events to resolve to one person while preserving the original event
records and provenance.

## Historical baseline — January 1 to August 31, 2026

- **1,753 unique digital visitors** — Digital Front Door Reach
- **96 Contact Connect submissions** — activity/events, not necessarily unique people
- **90 unique site members** — membership activation; overlap with Contact Connect unknown
- **VRCC referral engagement** — unknown/unmeasurable because a dedicated tracked event
  was not established

These baseline figures are measurement evidence and must not be used to infer unmeasured
human connections, unique Contact Connect people, qualified recovery requests, service
delivery, or outcomes.

Canonical wording for the membership figure:

> **Site Member Activation** — 90 unique people created a GFA site membership/account,
> representing movement beyond anonymous website visitation.

"Created a continuing site relationship" is not the canonical definition: a membership
account proves account/member activation, not ongoing engagement or relationship.
Whether these members actually engaged is a later, separately measured determination.

## Deferred KPI

**Human Connection Rate** is defined conceptually only — the proportion of qualified
recovery-support requests that result in a verified human connection. Its numerator and
denominator require canonical definitions, person-resolution, and contact evidence before
RecoveryOS calculates it. Do not implement this KPI until those foundations exist and its
definition is ratified under the metrics discipline (operational definition, period,
source, method, inclusion/exclusion, fixture exclusion, provenance, owner, verification
date).
