# GFA Project Knowledge Authority & Conflict Resolution Protocol

**Version:** 1.0
**Organization:** Grace For Addictions
**Status:** Canonical Knowledge Governance Protocol
**Purpose:** Define how AI systems and human users should resolve conflicting, duplicated, stale, incomplete, or differently authoritative information across GFA Project Knowledge.

> **Repository custody note (not part of the ratified text):** received complete from the
> Executive Director on 2026-09-03 in a Claude Code session; transcribed verbatim with list
> formatting restored. **RATIFIED 2026-09-03** — see the §14 decision record at
> `docs/decisions/2026-09-03-ai-governance-ratification.md` (subordinate to applicable law,
> the Articles of Incorporation, the Bylaws, and Board-reserved authority).

## 1. Core Rule

Project Knowledge is not a flat collection of equally authoritative documents.

Recency alone does not establish authority.
Detail does not establish authority.
Repetition does not establish authority.
A polished document does not establish authority.

When sources conflict, resolve them according to decision authority, evidence class,
governance status, applicable period, source integrity, operational scope, and supersession.

Never silently choose whichever source sounds most confident.

## 2. Authority Hierarchy

Unless a controlling legal requirement dictates otherwise, use the following order:

**Level 1 — Current Explicit Executive Decision**
A current decision made by the authorized executive decision-maker.
A current executive decision may supersede prior strategy but does not supersede controlling
law, executed contracts, or formal governing documents where those govern the issue.

**Level 2 — Ratified Institutional Doctrine / Governance**
Canonical organizational doctrine, governance frameworks, evidence rules, and
board-approved policy.

**Level 3 — Primary / Legal Authority**
Official or formally controlling records such as IRS determination letters, Articles of
Incorporation, bylaws, executed contracts, board-approved governing documents,
government-issued records, formal certifications, and audited financial statements.

**Level 4 — Canonical Current-State Record**
A specifically designated current operational or technical state record.

**Level 5 — Verified Operational Evidence**
System-of-record data or verified internal operational records with sufficient provenance.

**Level 6 — Approved Functional Architecture**
Ratified functional specifications or domain models that govern how a system or department
should operate.

**Level 7 — Leadership-Confirmed Information**
Information confirmed by authorized leadership but not yet supported by primary
documentation.

**Level 8 — Historical / Reported Material**
Prior proposals, reports, correspondence, presentations, and historical statements requiring
reconciliation.

**Level 9 — Strategic Analysis**
Research memos, planning documents, model comparisons, architecture proposals, scenario
analyses, and recommendations.

**Level 10 — Hypotheses / Concepts / Exploratory Material**
Ideas not yet adopted, validated, or operationally established.

## 3. Evidence Ledger Compatibility

The GFA Institutional Evidence Ledger retains its own A–F classification system.
Do not redefine those classes elsewhere.

**Class A — Primary / Legal Authority**
Official externally or formally controlling records.

**Class B — Verified Operational Evidence**
System-of-record or sufficiently verified operational evidence.

**Class C — Leadership-Confirmed**
Confirmed by authorized GFA leadership; primary evidence not yet ingested.

**Class D — Reported / Historical**
Prior reports, drafts, presentations, correspondence, or historical claims requiring
reconciliation.

**Class E — Inferred**
Reasonable analytical conclusion not established as fact.

**Class F — Unknown**
Not presently established.

Other GFA systems must not create competing "Class A / B / C" vocabularies for unrelated
purposes. Use descriptive labels instead.

## 4. Object-Type Discipline

Project Knowledge should identify the type of information when practical.

Recommended object types include:

- Organizational Fact
- Program Fact
- Financial Fact
- Metric
- Policy
- Doctrine
- Framework
- Partnership
- External Fact
- Research Finding
- Strategic Hypothesis
- Decision
- Current-State Record
- Technical Authority Record

Different object types behave differently.

A Doctrine is adopted. A Metric is measured. A Research Finding is cited. A Strategic
Hypothesis is tested. A Decision is authorized.

Do not treat these as interchangeable.

## 5. Applicable Period Rule

A quantitative claim must have an applicable period and operational definition.

A number without a defined period and method should not be treated as an externally usable
fact.

Example: "77 individuals served" is incomplete unless GFA knows the period, whether it is
unduplicated or encounter-based, inclusion criteria, source, method, owner, and verification
date.

## 6. Supersession Rule

When a newer governing document supersedes an older one:

1. mark the older item SUPERSEDED;
2. identify the superseding source;
3. preserve the old document for historical traceability;
4. do not delete history merely to remove disagreement;
5. ensure current AI workflows prioritize the superseding authority.

Do not rely on file timestamps alone. Supersession should be explicit wherever possible.

## 7. Conflict Resolution Procedure

When two sources conflict:

**Step 1 — Identify the conflict precisely.** Do not summarize vaguely.

**Step 2 — Classify each source.** Determine object type, evidence class, governance status,
source date, applicable period, and owner.

**Step 3 — Determine controlling authority.** Apply the hierarchy.

**Step 4 — Check whether the conflict is real.** A historical fact may have been true at an
earlier time.

**Step 5 — State the resolution explicitly.** Example: "YKY was historically canonical. CQCX
superseded it on the ratified consolidation line. Therefore current deployments must use
CQCX."

**Step 6 — Update canonical records.** Where authorized, update the appropriate
current-state record or ledger.

**Step 7 — Preserve unresolved conflicts.** If the evidence is insufficient, label the issue
unresolved rather than guessing.

## 8. No Silent Reconciliation

AI systems must never silently "fix" conflicting information by blending it.

Examples of prohibited behavior:

- averaging conflicting metrics;
- choosing the newest claim without checking authority;
- treating strategy language as operating fact;
- treating a proposal as approved policy;
- treating a historical grant narrative as current program status;
- treating a technical design document as proof of live deployment.

If unresolved, state: **UNRESOLVED — verification required.**

## 9. Organizational Truth Standard

Never make GFA appear larger, older, better funded, more staffed, more clinically capable,
more geographically established, or more technologically complete than authoritative
evidence supports.

Absence of evidence in Project Knowledge is not proof of organizational absence.

The correct formulation is:

> "The current Project Knowledge does not independently establish this fact."

Not:

> "GFA does not have this."

## 10. External Facts

Third-party information must be treated separately from GFA internal authority.

For time-sensitive external claims, verify them from current authoritative sources before
external use.

A prior research memo does not become permanently authoritative merely because it exists in
Project Knowledge.

## 11. Canonical Technical State

Technical systems require explicit canonical authority.

For RecoveryOS, current technical work should verify repository, branch, HEAD, canonical
Supabase project, migration ledger, MCP target, CI state, deployment target, and relevant RLS
behavior.

Old technical audits should remain historical evidence, not automatically current truth.

## 12. Metrics and Reporting

Before an aggregate enters a grant, board report, funder report, public communication,
executive dashboard, or Institutional Evidence Ledger, it should have:

- metric name;
- operational definition;
- source;
- period;
- method;
- inclusion rules;
- exclusion rules;
- fixture/test exclusion;
- provenance;
- owner;
- last verification date.

If any material element is missing, qualify the claim.

## 13. AI Behavior Under Uncertainty

When uncertainty exists:

1. say what is known;
2. say what is not known;
3. identify the strongest available source;
4. distinguish fact from inference;
5. identify the verification path;
6. avoid fabricated certainty.

Approved pattern:

> "The current evidence supports X. Y remains unverified. I would not represent Y externally
> until Z is confirmed."

## 14. Decision Logging

Material executive decisions should record:

- decision;
- date;
- decision-maker;
- rationale;
- conditions;
- revisit trigger;
- superseded decision if applicable.

No decision should be assumed merely because an AI recommended it.

## 15. Final Knowledge Governance Rule

The goal is not for the AI to know the most information.

The goal is for the AI to know what is authoritative, what is current, what is historical,
what is verified, what is inferred, what remains unknown, and what GFA is entitled to assert.

Institutional confidence should come from disciplined evidence, not from fluent language.
