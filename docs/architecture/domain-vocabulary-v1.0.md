# RecoveryOS Domain & Vocabulary — v1.0 (RATIFIED)

**Status: RATIFIED / CANONICAL.** Executive ratification 2026-08-21, issued against the P1
proposal (`docs/plans/p1-domain-vocabulary-proposal.md`, commit `50d1a93` — preserved as the
audit trail; this document is the architecture of record). Implemented by migrations
0129–0132, the TypeScript mirror `packages/domain/src/domains.ts`, and the CI guard
`scripts/verify-domain-vocabulary.mjs`.

Changing anything in §1–§4 requires a new executive ratification and a version bump.

---

## 1. Canonical operational domains

Machine keys are **permanent identifiers**. Display language is presentation only and may
evolve without changing canonical identity.

| Machine key | Participant label | Staff label |
|---|---|---|
| `recovery` | My recovery | Recovery |
| `community` | My community | Community |
| `housing` | Housing | Housing |
| `employment_purpose` | Work & purpose | Employment & Purpose |
| `health` | Health & wellbeing | Health & Wellness |
| `family` | Family & relationships | Family & Relationships |
| `transportation` | Getting around | Transportation |
| `education` | Learning & skills | Education & Skills |
| `financial_stability` | Money & basics | Financial Stability & Basic Needs |
| `justice` | Legal & courts | Justice & Reentry |
| `other` | Something else | Other / Participant-defined |

**Ratified structural decisions:** Recovery and Community are separate canonical domains and
must remain visibly distinct in participant experience. Safety is **cross-cutting**, not a
domain (a human-set, never automatic, priority — designed with P3 loops). There is no Trauma
domain and no trauma inference. Financial Stability absorbs `benefits_financial`,
`food_basic_needs`, `digital_access`. Work & Purpose stays combined. `identification_documents`
is a **cross-cutting operational subcategory** (inherits its parent loop's domain when nested;
staff-selected when standalone), never silently a participant domain.

## 2. Subcategory mapping (the sixteen live `need_category` keys — NEVER renamed)

| Subcategory key (unchanged) | Domain | Display label |
|---|---|---|
| `recovery_support` | recovery | Recovery support |
| `social_connection` | community | Social connection |
| `housing` | housing | Housing |
| `recovery_residence` | housing | Recovery residence |
| `employment` | employment_purpose | Employment |
| `treatment_healthcare` | health | Treatment & healthcare |
| `mental_health` | health | Mental health |
| `family_childcare` | family | Family & childcare |
| `transportation` | transportation | Transportation |
| `education_training` | education | Education & training |
| `benefits_financial` | financial_stability | Benefits & financial |
| `food_basic_needs` | financial_stability | Food & basic needs |
| `digital_access` | financial_stability | Phone & internet access |
| `legal_reentry` | justice | Legal & reentry |
| `identification_documents` | *(cross-cutting)* | ID & documents |
| `other` | other | Other |

## 3. Semantic layer separation (do not collapse)

**DOMAIN** = where the work is occurring · **RECOVERY CAPITAL** = what resources/capacities are
available or strengthening (BARC-10 stays one locked 10–60 total; no subdomains; no
domain metrics derived from BARC) · **SERVICE TYPE** = what the helper actually did ·
**RELATIONSHIP / CONNECTION EVIDENCE** = what interaction/handoff/continuity actually occurred ·
**OUTCOME** = what materially changed · **SUSTAINED OUTCOME** = the change verified present at a
defined follow-up point · **LOOP** = the open support process · **ICARE** = the GFA relational
method (never persisted per person) · **WELLNESS/CONTENT TAG** = reflection & learning taxonomy
(SAMHSA-8 stays content metadata; humanized for participant display; never operational domains).
Resource Type (e.g. "Recovery Community Center") is a kind of provider, never a participant
domain; a resource may support multiple domains.

## 4. Canonical evidence ladder (ratified)

**ACTIVITY → ENGAGEMENT → CONNECTION → PROGRESS → OUTCOME → SUSTAINED OUTCOME.**

Activity = something happened. Engagement = meaningful participation/response, more than an
attempted contact. Connection = the intended relational/resource connection actually occurred,
supported by evidence (two-way interaction, completed warm handoff, participant/provider
confirmation, defined criterion) — a referral sent is not a connection. Progress = meaningful
movement toward a participant-defined goal or need resolution. Outcome = a defined material
change with operational definition, evidence source, and verification method. Sustained
Outcome = the outcome verified present at an **explicit** follow-up interval — never inferred
from the absence of contrary events. Every aggregate domain measure declares its ladder level.
Earlier stages must never masquerade as later stages.

**Retention/Continuity is a separate axis, not a ladder stage:** longitudinal participation or
relational continuity (engagement duration, coaching continuity, residence length of stay,
follow-up continuity, participation continuity). No generic Retention Score. Longer engagement
is not inherently better; disengagement is not failure; remaining in a service is not itself a
participant outcome.

## 5. Standing governance constraints (from the ratification)

- **Peer-support evidence discipline:** never encode peer contact = recovery outcome /
  abstinence / overdose prevention / reduced mortality / treatment success. Emphasize the
  defensible mechanisms: connection, engagement, continuity, navigation, recovery-capital
  development, goal progress, warm handoffs, belonging, self-efficacy, relationship,
  participation.
- **Connection is a mechanism under evaluation:** "Connection Prevents Crisis" is doctrine and
  hypothesis, not encoded causality. Preserve atomic interpretable signals; no composite
  Connection Score.
- **Neuro-informed UX:** accommodate cognitive load; participants start with ordinary human
  language ("I need somewhere safe to live") → staff/system-assisted classification →
  editable, inherited attribution. Never taxonomy-first access.
- **Trauma-aware without trauma-demanding:** no disclosure is ever required to receive
  support, set a goal, choose a domain, or open a loop. No Trauma domain; no trauma inference
  from any operational signal.
- **Person-first language as system behavior:** every label, description, helper phrase, and
  future generated explanation follows GFA person-first, dignity-preserving, stigma-reducing
  standards; precise legal/government terms are used where precision is required. (Automated
  language QA is deferred, deliberately.)
- **Capture doctrine:** domain tagging is optional for participants, staff-assisted,
  system-inherited wherever reliable, editable, attached to the semantically correct object,
  never required per contact. CAPTURE ONCE → INHERIT → REUSE → VERIFY WHERE NECESSARY →
  REPORT WITHOUT RECONSTRUCTION.
- **Recovery Capital + Unmet Needs evidence design is a future phase:** no new universal
  assessment, no BARC duplication or modification, no capital-based eligibility scoring, no
  automated unmet-needs risk scoring. The domain layer must not block that future design.

## 6. Prohibitions carried forward (ratification §17)

No composite Connection/Recovery/Domain-Health/Retention scores; no persisted
Disconnected→Leading state machine; no Safety or Trauma domains; no automatic safety
classification; no BARC subdomains or BARC-derived domain metrics; no per-contact domain
prompts; no mandatory participant classification; no SAMHSA-8-as-domains; no Postgres enum for
domains; no renaming live machine keys; no historical `resources.category` rewrites; no
standalone Purpose or Basic Needs domains; no domain fields on check-ins/messages/notifications
for taxonomy completeness; no causal claims encoded as architecture.
