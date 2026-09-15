# DEV implementation specification (2026-09-15) — PREPARATION ONLY

**Authority:** decisions 8C (scope reset acknowledged) and 8D (community
system of record), plus the F-3 acceptance matrix. **DEV is not modified or
published by this spec** — implementation starts only under a separate,
explicit authorization. DEV (`GFA Public Site - DEV (Rebuild)`, `53adebd1…`)
is an isolated clone/reference environment; its 44 cloned pages are SOURCE
EVIDENCE, never completion.

## 1. Target information architecture (ratified) ← source pages (clone)

| Ratified section | Canonical slug (proposed) | Built from (clone sources) | Gates |
|---|---|---|---|
| Home | `/` | home (keep SEO override pattern) | W-1 phone RATIFY FIRST; availability claims RATIFY FIRST; VRCC narrative → "Recovery Community Center — powered by RecoveryOS" |
| Get Support | `/get-support` | **NEW** (no clone source) — front-door pathway page; Contact Connect entry; Support Now-adjacent language per doctrine | consent/nonclinical language per G4 matrix |
| What We Do | `/what-we-do` (+ children `/peer-support-coaching`, `/recovery-circles`, `/navigation-reentry`, `/recovery-housing`, `/recovery-community-center`) | services, services-7 (Group Workshops → Recovery Circles), gfa-recovery-circle, anchor-justice (→ Navigation & Reentry), live-out-program (placement decision), vrcc + app-landing-page content (→ RCC/RecoveryOS child) | program availability RATIFY FIRST; housing child links to recoveryresidence.org role per domain map |
| Meetings & Events | `/meetings-events` | events-meetings (+ soirée archive decision) | schedule accuracy |
| Stories & Impact | `/stories-impact` | testimonials (rebuild) | **consent + verification per story (RATIFY FIRST)** |
| What GFA Is Building | `/building` | vrcc, app-landing-page, inititiave ("RCO \| IOWA") | naming supersession; statewide claims RATIFY FIRST |
| About GFA | `/about` (+ `/mission-vision`, `/origin`, `/leadership`, `/transparency`) | about, mission, core-values, grace-addiction (origin), bylaws-articles (transparency; fix "Aricles" typo), person pages (leadership/coaches) | **roster RATIFY FIRST (16 person pages incl. Kayla Smith under the copy-slug)**; doctrine wording verified |
| Get Involved | `/get-involved` (+ `/volunteer`, `/partner`, `/refer`, `/give`) | volunteer, sponsors-partners (partner; **partners RATIFY FIRST**), donate (give), **NEW: refer** | volunteer CTA routing decision (RecoveryOS-bound entry) |
| FAQs | `/faqs` + `/faqs-es` (or `/es/faqs`) | **copy-of-mission (the real FAQs!)** + **copy-of-faqs (FAQs Español — preserve Spanish parity; Multilingual app present)** | translation parity check |
| Contact | `/contact` | **NEW** (site-wide form exists; page does not) | W-1 phone RATIFY FIRST; email connect@… (verify ratified) |
| Privacy / Consent / Accessibility / Nonclinical Scope | `/privacy`, `/consent`, `/accessibility`, `/nonclinical-scope` | privacy-policy (rebuild) + **three NEW pages** | every legal/privacy claim RATIFY FIRST; must match system behavior (G4 V6) |
| Utilities | search, thank-you (deduped), cart (if store kept) | existing | keep noindex posture |

## 2. Redirect preservation map (every legacy slug 301s; nothing 404s)

- `/copy-of-mission` → `/faqs`; `/copy-of-faqs` → `/faqs-es`;
  `/copy-of-halina-cegielski` → `/about/leadership#kayla-smith` (post-roster
  ratification) or the roster page.
- `/inititiave` → `/building` (or ratified initiative slug); `/services-7` →
  `/what-we-do/recovery-circles`; `/vrcc` and `/app-landing-page` →
  `/building/recovery-community-center` (participant-app CTA later targets
  `recoverycommunity.app` per DEC-005 at cutover, not before).
- `/mark-brown` → corrected person slug ("Mark Browne"); `/kel-beddard` →
  corrected slug ("Kel Bedard") — with the roster gate.
- `/gfa-summer-soirée` → `/meetings-events` (archive decision);
  `/grace-addiction` → `/about/origin`; every other renamed page per §1.
- Departed-roster person pages → roster index (dignity rule: no dead person
  pages, no silent 404s).

## 3. Decision-8D items (community surfaces)

`/groups`, `/feed`, member-profile surfaces: **RETIRE/REDIRECT** in the DEV
architecture; no new recovery-community operations in Wix. ☐ Dependency
analysis before removal design: what Wix Members currently gates (store
accounts? donation history? group content worth archiving?) — preserve any
dependency unrelated public-site functions need. Live apps are NOT uninstalled
under this spec. Future community CTAs route to the RCC/RecoveryOS experience
when release-ready (`recoverycommunity.center/.app` roles per DEC-004/005).

## 4. Integrations on DEV

- **FiveCRM:** removed per the retirement packet §8 (DEV-first; live under its
  own approval). Check-in booking re-points to the ratified replacement path
  or a neutral interim message.
- **Contact Connect:** form stays the single public inquiry surface; its
  backend hop follows the 8B outcome (Velo verification) — DEV must not clone
  a broken/unknown pipe silently; the spec requires the verified wiring
  documented before DEV's form goes live-candidate.
- **Wix Hotels app:** uninstall on DEV (template residue) after a
  no-references check; Stores V1 kept only if the merch decision keeps
  `/gfa-apparel`.
- **GTM/gtag:** carry only with a consent-mode/analytics governance decision
  (G4 V8); no form-field data to analytics.

## 5. Acceptance sequence (unchanged ratified process)

Implement on DEV → executive/designated review (with this spec + the F-3
matrix as the checklist) → content-truth register signed (phone, roster,
availability, partners, testimonials, legal) → accessibility + mobile +
form-routing + SEO/redirect verification → live rollback capture (W-2
reference point) → **live publication only under its own explicit approval**.
