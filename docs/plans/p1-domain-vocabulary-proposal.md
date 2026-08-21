# P1 — Canonical Domain & Vocabulary Architecture (PROPOSAL FOR EXECUTIVE REVIEW)

**Date:** 2026-08-21 · **Status: PROPOSAL — NOTHING IMPLEMENTED.** No migration, enum, CHECK,
seed, UI, or CQCX change accompanies this document. Semantic architecture gate only.
**Baseline verified:** branch `claude/recoveryos-canonical-audit-1pvcwr` @ `a833e7c` (CI #92
green), main `4959156a`, CQCX RecoveryOS-Launch ledger through 0128.

**Controlling decision honored throughout: RECOVERY ≠ COMMUNITY.** "Recovery Community" survives
only inside proper nouns (VRCC, GFARC, Recovery Community Center/Organization).

---

## A. Executive recommendation

Adopt an **11-domain canon plus `other`** — the executive hypothesis with two evidence-driven
modifications:

1. **Safety is NOT a top-level participant domain** (it becomes a cross-cutting, human-set
   priority later; §I).
2. **Financial Stability absorbs basic needs** (food, benefits, material access) as
   subcategories — a standalone "Basic Needs" or bare "Financial" domain would each own a
   single subcategory.

Store it as **Option D** (reference table + stable machine keys + CI-checked TypeScript
mirror; §M). Attach domains at the **loop/goal/resource level with one required primary and
optional secondaries** — never per-contact (§L, §P0.5 doctrine). Rename **nothing** that is
live; the 16 need categories become subcategories under the canon via an additive mapping
(§N). Recovery Capital, Service Type, Resource Type, ICARE, and Wellness tags remain distinct
vocabularies with explicit crosswalks, never one field impersonating another (§E–H).

## B. Current vocabulary inventory (exact values and locations)

| Vocabulary | Values | Locations |
|---|---|---|
| **`navigation_needs.need_category`** (16) | `housing, recovery_residence, transportation, treatment_healthcare, mental_health, employment, education_training, food_basic_needs, benefits_financial, legal_reentry, identification_documents, family_childcare, digital_access, social_connection, recovery_support, other` | CHECK `0112_navigation_domain.sql:574-578`; TS `packages/domain/src/navigation.ts:11-28` (`NEED_CATEGORIES` + labels); live: 10 rows |
| `navigation_needs.status` (6) / `navigation_referrals.referral_type` (3) / `.status` (7) / `.connection_evidence` (4) | as audited | 0112/0113 CHECKs; `navigation.ts` label fns — these are LOOP-STATE and EVIDENCE vocabularies, not domains |
| **`service_types`** (14 rows, 13 categories) | keys: `coaching_session, peer_support, mentoring, accountability, recovery_circle, navigation, resource_navigation, recovery_capital_assessment, daily_check_in, education_module, recovery_practice, support_request, community_event, residence_recovery_support`; categories: `coaching, peer_support, mentoring, accountability, recovery_circle, navigation, assessment, education, practice, check_in, support_request, event, other` | CHECK `0005:11-15`; seeds `0200:94-108`, `0112:873`, `0115:863`; Exhibit E `CATEGORY_CITATIONS` keyed on category (`exhibitEReport.ts:29-42`) |
| **`resources.resource_type`** (11 + NULL) | `substance-use-treatment ×10, peer-support ×6, crisis-line ×5, mental-health ×5, reentry ×2, employment, food, harm-reduction, legal, mat-provider, recovery-housing` (+7 NULL; also seed-era `transport` on a Virginia row) | `0102:92-148`; seed `0202`; live-verified 2026-08-21 |
| **`resources.category`** (freeform, 3 generations) | 25+ Title-Case gen1 values (`Outpatient Treatment, Recovery Community Center, Mutual Aid, Crisis Services, Legal Reentry, …`), lowercase v2 (`food, treatment, transport, crisis, legal`), 7 NULL | seed `0202`; live-verified — the identified mess |
| `resources.crisis_types[]` (18) | `suicidal_ideation … return_to_use_concern, veteran_specific, …` | seed `0202` crisis generation |
| **Recovery Pulse** | ratings `mood, craving, hope, confidence, purpose` (1–5); `connection_level yes/some/none`; `period morning/evening`; **`CHALLENGE_CHIPS` (11):** `Work, Family, Housing, Transportation, Court, Finances, Mental health, Cravings, Relationships, Childcare, Health`; `prompt_quadrant` (4); response rules (6) | `check_ins` CHECKs (0023/0024); `packages/domain/src/pulse/prompts.ts:125-137`, `pulse/rules.ts` |
| **Goals** | `goal_status: active/achieved/paused/archived`; **no domain/category of any kind** | enum 0001; `goals.ts`, `MyRecoveryPage.tsx` |
| **Recovery capital** | `instrument_key='barc10'`, 10 items ×1–6, one total 10–60, 47 = research reference only, soil `good/thorny/rocky/path`; **no subdomains (LOCKED)** | `packages/domain/src/instruments/barc10.ts`; `recovery_capital_assessments`; `icare-implementation-lock.json` |
| **Wellness tags** (SAMHSA 8) | `Physical, Emotional, Social, Spiritual, Environmental, Occupational, Intellectual, Financial` (content tags on 59 slogans; Financial = 0 slogans); bridge `CHALLENGE_DOMAIN_MAP` (`Work→Occupational, Family→Social, Housing→Environmental, Transportation→Environmental, Court→Environmental, Finances→Financial, Mental health→Emotional, Cravings→Emotional, Relationships→Social, Childcare→Social, Health→Physical`); **printed raw on participant slogan cards** | `packages/recovery-content/src/types.ts:13-21`, `recommend.ts:33-45`; `SloganCard.tsx:48-50` |
| **ICARE** (5) | `Identify, Connect, Assess, Respond, Empower` — content/method labels only, never persisted per person | `recovery-content/src/types.ts:10`; lock + Authority |
| Attribution enums | `delivery_context` (7: `vrcc, recovery_residence, community_outreach, justice_reentry, partner_site, virtual, other`); `service_modality` (6); `consent_category` (10) | 0001 |
| `support_requests.request_type` (5) | `peer_support, recovery_coach, life_coach, navigation, needs_assessment` | 0025; `coaching.ts` |
| Reporting rollups | `needs_by_category` (jsonb agg over the 16), Exhibit E per service category | `admin_evidence_summary` (0117); `exhibitEReport.ts` |
| Docs/prose | "Recovery Community" only as proper nouns (VRCC, GFARC, Recovery Community Center) | `LandingPage.tsx:45`, residence-content documents |
| Participant/staff UI | **No domain UI exists anywhere today.** Nearest: navigator need-category picker; participant challenge chips | — |

**Finding restated:** nothing in the live system conflates Recovery with Community — the domain
layer is absent, not collapsed. P1 is adoption, not surgery.

## C. Canonical domain proposal (11 + other)

Machine keys are permanent; labels are mutable per audience. RC = recovery-capital concepts
(narrative crosswalk only — program-design inference, never derived from BARC).

| # | Machine key | Participant label | Staff label | Definition / inclusion | Exclusion boundary | Mapped subcategories (current keys) | Mapped service types | RC concepts (narrative) | Reporting use |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `recovery` | **My recovery** | Recovery | Recovery-specific work: pathway, goals about recovery itself, practices, coaching, peer recovery support, circles/meetings, return-to-use support, recovery planning & confidence, recovery-capital development, check-in habit | Life-logistics goals that *support* recovery (housing, job…) map to their own domain — Recovery is the recovery work, not a catch-all; never abstinence-only (multi-pathway per Grace policy) | `recovery_support` | `coaching_session, peer_support, mentoring, accountability, recovery_circle, daily_check_in, recovery_practice, recovery_capital_assessment` | hope, recovery identity, coping practices, sober network | Recovery-domain loops/services/goals; Pulse engagement |
| 2 | `community` | **My community** | Community | Belonging & contribution: peer relationships/friendship, GFARC & community participation, community events, volunteering, mutual support, service to others, leadership, healthy social participation | Family/partner/parenting → `family`; professional helpers are the Relationship layer, not community; receiving peer-support *service* is Recovery | `social_connection` | `community_event` (+ future volunteering types) | belonging, reciprocal support, prosocial network | Community participation counts; connection signals (§D) |
| 3 | `housing` | **Housing** | Housing | Getting/keeping a safe place: applications, recovery residence, landlord issues, eviction prevention, household stability logistics | Home-life relationships → `family`; residence *operations* are staff workflow, not participant domain | `housing`, `recovery_residence` | `residence_recovery_support` (delivery context, not classification) | stable environment, housing security | Housing loops open/resolved; residence outcomes |
| 4 | `employment_purpose` | **Work & purpose** | Employment & Purpose | Employment, income-producing work, vocational steps, job search/keeping, meaningful daily activity & contribution as one's occupation (incl. caregiving/volunteering when it is the person's primary "what I do") | Purposefulness as inner experience stays a Recovery signal (`purpose_rating`); volunteering-as-belonging dual-tags `community` | `employment` | — (navigation service events carry the loop's domain) | purpose, self-efficacy, income stability | Employment loops, workforce connections, employment outcomes |
| 5 | `health` | **Health & wellbeing** | Health & Wellness | Physical & mental healthcare, treatment connection, MAT/MOUD access, medications, wellness routines tied to health care | Recovery practices → `recovery`; crisis moments are Support Now (state), never a domain classification | `treatment_healthcare`, `mental_health` | — | physical health, treatment engagement | Health loops; treatment connections completed |
| 6 | `family` | **Family & relationships** | Family & Relationships | Partner/parenting/children, childcare, family repair & reunification, caregiving for family, household relationships | Friends/peers/groups → `community`; DV safety concerns are a cross-cutting priority (§I) attached to the relevant loop | `family_childcare` | — | family support, parenting capacity | Family loops; childcare connections |
| 7 | `transportation` | **Getting around** | Transportation | Rides, transit, license/insurance, vehicle access, transport to obligations | License *legal* barriers may dual-tag `justice` | `transportation` | — | mobility access | Transportation loops/connections (future volunteer rides) |
| 8 | `education` | **Learning & skills** | Education & Skills | GED/degrees, training/certification, digital *skills*, study logistics | Device/connectivity *access* → `financial_stability` | `education_training` | `education_module` | knowledge, credentials, digital literacy | Education loops; enrollments |
| 9 | `financial_stability` | **Money & basics** | Financial Stability & Basic Needs | Income supports/benefits, budgeting/debt, food & material basics, phone/internet access | Employment income → `employment_purpose`; benefits tied to justice status may dual-tag | `benefits_financial`, `food_basic_needs`, `digital_access` | — | financial capacity, material security | Benefit/food connections; stability loops |
| 10 | `justice` | **Legal & courts** | Justice & Reentry | Court obligations, probation/parole, reentry, record relief, legal aid, DOC coordination | Uses precise legal terms where required; never a character label — always about the *matter*, not the person | `legal_reentry` | — (delivery_context `justice_reentry` stays attribution) | legal standing, system-navigation confidence | Reentry loops; legal connections; DOC reporting |
| 11 | *(cross-cutting)* `identification_documents` | ID & documents | ID & Documents | **Subcategory, not a domain** (§ below) | — | `identification_documents` | — | documentation access | Cross-cutting line item |
| 12 | `other` | Something else | Other / Participant-defined | Participant-named need that genuinely fits nowhere; reviewed periodically for canon gaps | Never a dumping ground — staff prompted to pick a real domain when one fits | `other` | `support_request`, `other` category | — | Canon-gap detector |

**`identification_documents` decision:** a **cross-cutting operational subcategory**, context-
dependent: when nested under a loop it **inherits the parent loop's domain**; standalone, staff
choose the domain it serves (default suggestion `justice`, commonly `housing`/`employment_purpose`);
reporting shows it both under its domain and as a cross-cutting line. Same treatment considered
for `digital_access` — resolved instead by fixed default (`financial_stability`) because its
instrumental spread is narrower. `food_basic_needs` → fixed under `financial_stability`.
`recovery_residence` → fixed under `housing` (dual-relevance to Recovery is expressed by a
secondary tag when a loop warrants it, not by the subcategory).

## D. Recovery vs Community — canonical definitions

**Recovery** = the work of building and sustaining one's recovery: pathway, practices, coaching
and peer recovery support received, circles/meetings, return-to-use support, recovery planning,
recovery confidence and routines, recovery-capital development. Not abstinence alone; not a
catch-all for life stability.

**Community** = belonging and contribution among peers and the wider community: friendship,
GFARC and community participation, events, volunteering, mutual support, service, leadership.
"Connected" ≠ "belongs": contact is a signal, belonging is the person's own report.

**The DISCONNECTED→…→LEADING progression is a conceptual model, not persisted state.** Raw
signals already observable that may later let GFA study it (atomic, no composite): `check_ins.connection_level`; participant-initiated contact (`messages.sender_person_id`);
two-way exchange (T4a); `confirm_my_connection` responses; `community_event` service events;
`house_posts` milestone/gratitude authorship; support-team size (`get_my_support_team`);
future volunteering records; participant-reported belonging (a future single reflective
question, participant-owned).

## E. Domain vs Recovery Capital

Domain = **where** support/progress happens. Recovery capital = **what resources/capacities**
support recovery. Example — Domain `housing`; capital changes: stable environment, financial
capacity, supportive landlord, transport access, systems-navigation confidence; outcome:
obtained housing; sustained outcome: stable at defined follow-up. Current architecture already
enforces the distinction structurally: BARC-10 is one locked 10–60 total with **no** subdomains
(`icare-implementation-lock.json`), so nothing can silently equate capital with domains.
**Rules:** never derive domain metrics from BARC; never tag BARC items with domains; the RC
column in §C is narrative crosswalk only — labeled program-design inference, never validated
equivalence, never an automation input (crosswalk governance applies).

## F. Domain vs Wellness framework

GFA's Multi-Dimensional Recovery Wellness (implemented today as the SAMHSA-8 content tags)
should function as **participant reflection framework + content/learning taxonomy** — not the
operational domain model, not an outcome framework, not a capital lens. Useful overlap: the
existing chip→tag bridge (`CHALLENGE_DOMAIN_MAP`) that picks encouraging content. Forced
unification would drift immediately: SAMHSA "Social" fuses Family with Community (the exact
split P1 exists to make); "Environmental" absorbs Housing+Transportation+Court into one
operationally meaningless bucket; "Financial" has zero content. Keep the frameworks parallel
with an explicit display crosswalk (wellness tag → related domains) for "learn more" moments.

## G. Domain vs Service Type

Service type answers **what the helper did** (`coaching_session`, `resource_navigation`,
`community_event`…). Domain answers **what area of life it served**. A navigation session
(service type) can serve Housing today and Transportation tomorrow. Service events therefore
**inherit domain from the loop/need they serve** (via the existing
`service_events.navigation_referral_id`/need linkage and the P3 loop), never from a second
classification act. The `service_types.category` CHECK stays exactly as is.

## H. Domain vs Resource Type

Resource type answers **what kind of provider/resource this is** ("Recovery Community Center"
is a resource type — the proper-noun rule). Domain answers **which life areas it serves**
(often several: a RCO serves `recovery` + `community`). Resources therefore get **domains
(plural)** + a normalized **resource_type**, while the freeform `category` column is
deprecated read-only (§N, §16 plan).

## I. Safety decision

**Recommendation: B — cross-cutting, not a top-level participant domain** (revisit C when a
deliberate safety-planning program exists). Reasons: no current vocabulary, workflow, or
program structure implements a Safety domain; a participant-facing "Safety" life-area invites
mislabeled ordinary distress and stigmatizing self-classification; and it risks blurring into
the deterministic Support Now architecture, which is a **state/escalation path, never a
classification** (locked). Concretely: DV/safety-planning needs attach to the loop where they
live (Housing, Family) with a **human-set, never automatic** `safety_sensitive` priority flag
(designed in P3 loop work, visibility-restricted); Support Now and the pulse rules remain
domain-free. Nothing may auto-classify a person or a moment into "Safety."

## J. Employment / Purpose decision

**Recommendation: keep combined — `employment_purpose`, display "Work & purpose."** Grounds:
(1) GFA philosophy already instruments *purposefulness* as a daily **Recovery** signal
(`purpose_rating` in the Pulse) — inner purpose is recovery work, not a logistics domain;
(2) purposeful *contribution* (volunteering, service, leadership) already lives in
**Community**; (3) the only operational objects today are employment-shaped (need category
`employment`, workforce referrals, Exhibit E employment outcomes) — a standalone Purpose
domain would own nothing and fragment two existing homes; (4) the combined label keeps
meaningful-daily-activity (caregiving, education-adjacent vocational steps, volunteering-as-
occupation) legitimately reportable without forcing "employment" on someone whose purpose
isn't a paycheck. This is a philosophy call — flagged in §U for ratification.

## K. Family & Relationships vs Community boundary

`family` = partner, parenting, children, childcare, family repair/reunification, caregiving,
household relationships. `community` = peers, friendship, groups, GFARC, volunteering,
participation. Overlap is handled by the multi-domain model (§L), never by a fused domain:
"repairing my relationship with my sister and rejoining church" = primary `family`,
secondary `community` — or two related loops when the work genuinely diverges.

## L. Multi-domain model

**One required PRIMARY domain + up to two optional SECONDARY domains, attached at
loop/goal/resource level, with child loops inheriting the parent's primary by default
(overridable).** Rejected: single-domain-only (fails the worked examples), unlimited
many-to-many (tag soup, meaningless reporting), domains-per-contact (frontline burden).
Worked examples — Housing loop → child `identification_documents` need (inherits `housing`)
→ child `transportation` need (its own domain, related to parent) → employment schedule
conflict = note/secondary `employment_purpose` on the transport loop, or its own related
loop if it grows. Family-recovery example: primary `family`, children: `health`
(treatment), `family` (childcare, inherited), `transportation`, secondary `community` on the
parent. Reporting counts a loop once under primary, secondaries reported separately (never
summed with primaries).

## M. Database design recommendation

**Option D — hybrid reference table + stable machine keys + generated/checked TS constants.**

| Criterion | A: TS-only | B: table only | C: PG enum | **D: hybrid** |
|---|---|---|---|---|
| Migration risk | none, but DB blind | low | ALTER TYPE pain, irreversible ordering | **low (additive tables + nullable FKs)** |
| Extensibility | redeploy | insert | migration each time | **insert + TS mirror check** |
| Reporting joins/rollups | impossible in SQL | good | ok | **good** |
| RLS/API | n/a | readable reference (like `service_types`) | ok | **same as B** |
| Historical compatibility | n/a | text keys never rewritten | enum values permanent | **text keys, never renamed; labels mutable** |
| Labels/white-labeling | hardcoded | in-table per audience | impossible | **participant_label + staff_label columns** |
| Interop | manual | mapping table | brittle | **`domain_external_mappings` table** |
| Drift risk | — | TS/DB drift | — | **CI guard script (existing lock-script pattern) pins TS mirror = seed** |

Shape (P1.2, for later implementation): `recoveryos.domains(key text pk, participant_label,
staff_label, definition, sort, is_active)`; `recoveryos.domain_subcategories(key text pk,
domain_key fk nullable-for-cross-cutting, display_label, is_cross_cutting bool)` seeded with
the 16 need categories; `recoveryos.domain_external_mappings(domain_key, system, external_code,
note)`; consumers store `domain_key text` FK columns. No PG enum. No writes to any existing row.

## N. Backward-compatibility plan

Zero renames, zero rewrites, all additive: (1) the 16 `need_category` values stay byte-identical
— the subcategory table maps them; existing CHECKs untouched in P1; (2) `needs_by_category`
reporting keeps working; a domain rollup is a JOIN through the mapping, added beside it;
(3) `resources`: add `domains text[]` (or join table) + normalized `resource_type`; the freeform
`category` column becomes deprecated read-only with a documented value→(type, domains) mapping —
historical values preserved, never overwritten (Virginia seed rows flagged for separate data
review, not silent deletion); (4) `goals`: one nullable `domain_key` column — old goals stay
domainless and render exactly as today; (5) wellness tags, service types, delivery contexts,
consent categories: unchanged; (6) every step guarded by the existing CI pattern (a
`verify-domain-vocabulary.mjs` pinning seed ↔ TS mirror ↔ no renamed keys).

## O. Participant UX model (display only — human labels, no case-management feel)

- **What I'm working on:** goals/loops grouped under participant labels ("Housing", "Work &
  purpose") — a quiet chip, not a form field; setting it is optional ("This is about… (optional)").
- **What I've moved forward / What's next:** movement items carry their loop's domain chip;
  next steps inherit — never re-asked.
- **People in my corner:** relationship layer — no domains.
- **Where I feel stronger / Where I'd like more support:** **My recovery** and **My community**
  always shown as separate sections (the controlling decision made visible); other domains
  appear only where the participant has activity or asks — never an 11-row empty rubric.
  "I'd like more support with…" uses participant labels and creates a support request/loop seed.
- "I want to get my driver's license back" stays exactly those words; the domain chips
  (Getting around / Legal & courts) are suggested, optional, and editable — the participant is
  never made to classify themselves administratively.
- Slogan cards stop printing raw taxonomy (`Occupational`, ICARE phase names) — humanized or
  moved behind "Why am I seeing this?" (P1.5).

## P. Coach/Navigator UX model

Domain capture happens **once, at the semantically right object** — the loop/need (already
happens today via the 16 categories), the goal (optional), the resource (curated data) — and is
**inherited** by referrals, service events, follow-ups, and timeline entries. No per-contact
classification, ever. What staff gain: "What matters right now" grouped by domain; stalled
loops by domain; movement by domain; overlap made visible (secondary tags/child loops).
Navigator need picker gains only a grouped presentation (domain headings over the same 16
values). Coach sees the same domain chips on shared goals/loops when P5/P7 open that visibility.

## Q. Reporting model

Domain reporting is a **lens over the existing evidence ladder, never a new number**:
Activity (need identified, referral made) → Engagement (loop active) → Connection
(evidence-gated `connected`) → Progress (need resolved/partially) → Outcome (domain outcome,
e.g. housed) → Sustained Outcome (verified at defined follow-up — P3 verification layer).
Example rows: "participants with active Housing loops" (engagement), "completed Transportation
connections" (connection), "Recovery-domain service events" (activity), "Community
participation" (activity/engagement), "Work & Purpose outcomes" (outcome). Every domain metric
keeps its ladder badge; domain activity is never presented as domain outcome (0126 discipline
extends here).

## R. Interoperability model

Three strictly separated layers: (1) **GFA canonical key** — snake_case, permanent, the only
thing code stores; (2) **GFA display language** — participant/staff labels, mutable, per-
audience, later white-labelable; (3) **external mappings** — `domain_external_mappings`
rows per system (NARR domains, Iowa HHS Exhibit E clauses, DOC categories, Thrive/HopeHub-like
taxonomies, research datasets), each labeled *"RecoveryOS operational crosswalk — program-design
inference, not validated equivalence"* and **never** an automation trigger (crosswalk
governance). GFA never adopts an external taxonomy as internal language; exports translate at
the boundary.

## S. What NOT to build

No composite scores (connection, wellness, domain "health"); no persisted
Disconnected→…→Leading state machine; no Safety auto-classification and no Safety domain (for
now); no BARC subdomains or BARC-derived domain metrics (locked); no per-contact domain prompt;
no mandatory participant self-classification; no SAMHSA-8 as operational domains; no Postgres
enum for domains; no renames of live keys (`need_category`, `service_types`, wellness tags);
no rewriting of historical `resources.category` values; no new "Purpose" or "Basic Needs"
top-level domains; no domain field on check-ins, messages, or notifications.

## T. P1 implementation roadmap (after ratification; each step additive + gated)

1. **P1.1** Ratify this document (ED decisions §U); commit as canonical
   `docs/architecture/domain-vocabulary-v1.0.md` with the decisions recorded.
2. **P1.2** Migration 0129: `domains`, `domain_subcategories` (seeding the 16),
   `domain_external_mappings` (empty) + TS mirror in `packages/domain/src/domains.ts` +
   `scripts/verify-domain-vocabulary.mjs` in CI. No existing object touched.
3. **P1.3** `goals.domain_key` (nullable) + optional participant/staff chip UI; navigator
   need picker grouped by domain (same 16 values).
4. **P1.4** Resources cleanup: `domains[]` + normalized `resource_type`; backfill script with
   reviewable mapping; `category` deprecated read-only; Virginia rows to data review.
5. **P1.5** Display-language pass: humanize/relocate raw wellness + ICARE tags on participant
   surfaces; domain labels through one label helper.
6. **P1.6** Reporting lens: domain rollup (JOIN through subcategory mapping) added beside
   `needs_by_category` in `admin_evidence_summary`; ladder badges enforced.

Dependencies: P3 loops consume the same tables (primary/secondary/inheritance); P0.5's wiring
untouched; nothing here blocks or is blocked by P2 event-provenance work.

## U. Genuine executive decisions

1. **Ratify the 11-domain canon** (§C) — especially: Safety as cross-cutting not domain (§I);
   Financial Stability absorbing food/basic needs and digital access (§C row 9).
2. **Work & Purpose stays combined** (§J) — a GFA-philosophy call on where Purpose lives
   (inner purpose → Recovery signal; contribution → Community; occupation → this domain).
3. **Participant display labels** (§C column 3) — particularly "Legal & courts" for
   Justice & Reentry, "Money & basics," "My recovery"/"My community."
4. **Participant domain sections policy** (§O): Recovery + Community always visible; other
   domains appear on activity only — confirm this presentation philosophy.
5. **Wellness-tag display** (§F/O): humanize the SAMHSA tags on participant cards vs. remove
   them from cards entirely (content taxonomy unchanged either way).
6. **Domain tagging is optional for participants, assisted by staff, inheritable by system** —
   confirm this capture doctrine (§O/P).
