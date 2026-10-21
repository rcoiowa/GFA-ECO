# Guide conformance — separate local editorial candidate

Date: 2026-10-21. Base: 3f93d250436c725f92e6ff642487a74a9dcf8236.
Preparation only; no deployment, policy amendment, provider switch, live database
access, or credentials. Owner not assigned for outstanding review gates.

## Source and limits

Parent supplied verified extracted Developer Handoff 05 P0000–P0144 and Language
Guide 08 P0000–P0214, adopted by the user's request. Complete Claims Guide 06
P0000–P0203 was subsequently supplied and reviewed; the earlier transmission gap
is now closed. Its contextual terminology, channel-specific claims, story
permissions and outcome definitions align with this editorial patch.
The full packet/START_HERE and linked underlying authorities were not materialized
here. This register cites paragraph locators rather than republishing the packet.
Read repository CLAUDE.md and canonical ICARE authority first; no applicable
AGENTS.md found. Existing residence policy, exact instruments and canonical RTM
content remain authoritative in their domains.

## Coverage register

| Surface / source                                                                                                    | Inspection and disposition                                                                                                                                                                                                                                  | Evidence / remaining gate                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical docs/language-guide.md; 08 §§1–12                                                                         | EDITED: replaced blanket Never/Always replacements and brain/safety/outcome assurances with contextual standards, exact identity/mission/tagline, preferred self-description, mandatory requirements, precise services/metrics and attributed observations. | Editorial reference only; no residence policies changed.                                                                                                                                      |
| Public app footers: CommunityCenterPage, CommunityCenterJourney, GraceHousePage, LandingPage, SupportNowPage; 08 §2 | EDITED: exact primary tagline.                                                                                                                                                                                                                              | Local source, not deployed or Wix.                                                                                                                                                            |
| LandingPage; 08 §§9–10                                                                                              | EDITED: removed unqualified “Free” from general recovery-support claim.                                                                                                                                                                                     | Does not assert charges; program-specific cost details require owner verification.                                                                                                            |
| apps/platform/index.html; 08 P0015                                                                                  | EDITED: meta description describes exploring support/resources rather than unqualified crisis prevention.                                                                                                                                                   | Other metadata/assets only search-screened; no social-preview rendering tested.                                                                                                               |
| GracePage; 05 §1, 08 §2                                                                                             | EDITED: full display identity; retained already-exact disclosure; replaced one-tap/immediate human and blanket offline assurances with support options and connectivity limits. “Preparing a response” replaces “thinking.”                                 | Local component tests; no live provider/browser/assistive-tech validation this patch.                                                                                                         |
| Grace instructions policy.ts; 08 P0026, P0056                                                                       | CONFLICT: locked Organizational Values still says never “relapse” and categorical person-first language.                                                                                                                                                    | Not edited: semantic prompt change needs policy-version/lock review and positive/negative evaluation. Do not claim generated responses conform.                                               |
| Auth and consent, functions/grace/index.ts:108–165; 05 §§2,4                                                        | SOURCE INSPECTED: verified getUser; person derived through auth_user_id; latest ai_features grant checks status, revocation, expiry before provider. Browser prompt/model/identity not taken as authority.                                                  | Actual services untested. Mid-request revocation cancellation is not established by this per-request check; clarify required semantics and test.                                              |
| Grace privacy, index.ts logMeta, GracePage state, public/sw.js; 05 §§2,5,6                                          | SOURCE INSPECTED: state-held transcript, bounded process metadata at reviewed call sites, service worker bypasses non-GET/cross-origin.                                                                                                                     | Provider/account retention, infrastructure/error logs, analytics backend and all caches not runtime-audited; no compliance or zero-retention certification.                                   |
| Support independence; 05 P0033                                                                                      | Public SupportNowPage is deterministic; existing anonymous render tests run. GracePage still returns loading before support/disclosure while checking consent; personId=0 leaves checking true.                                                             | BEHAVIORAL/ACCESSIBILITY GAP: Grace-route loading/failure fallback and no-person state need separate review. Public /support independence is not proof every Grace state exposes support.     |
| Grace accessibility; 05 §6                                                                                          | SOURCE GAP: unconditional smooth scroll; no new real screen-reader/reduced-motion/device review.                                                                                                                                                            | Separate accessibility fix and real-device/assistive-tech acceptance required.                                                                                                                |
| Housing/application and other forms                                                                                 | SEARCH-SCREENED names/claims; required fields, instruments and IDs unchanged.                                                                                                                                                                               | Not a field-by-field consent/demographic/legal audit. Do not add collection or soften requirements through editorial substitutions.                                                           |
| Generated residence templates                                                                                       | Inspected generation pipeline scripts/generate-residence-docs.ts; source packages/residence-content generates docs and SQL with versioned bodies.                                                                                                           | Not regenerated. residentHandbook and completeOperationalSystem contain legal/privacy assertions; review source authority and program/legal evidence separately. No silent policy/seed edits. |
| RTM/GFARC and historical evidence                                                                                   | Canonical generated recovery-content and historical records preserved.                                                                                                                                                                                      | No new slogans or rewritten quotes; full content corpus not manually re-reviewed.                                                                                                             |
| Current-facing naming/claims search                                                                                 | Searched app source, public assets, packages/ui and packages/safety for retired companion/AI-peer labels and selected unsupported metrics/claims. No retired-label hit in that bounded search.                                                              | Search is not exhaustive semantic review. Third-party 24/7 support claims remain source-dated; contact availability not freshly verified.                                                     |
| Wix graceforaddictions.org                                                                                          | UNREVIEWED this patch.                                                                                                                                                                                                                                      | App front-door edits are NOT Wix edits. Prior artifact transfer failure unchanged; no publish or retry.                                                                                       |
| Telephone front desk                                                                                                | UNREVIEWED.                                                                                                                                                                                                                                                 | Separate channel authority, recording/notice/retention/outbound destinations need actual evidence. Web privacy findings cannot be transferred to telephone.                                   |

## Hard gates and release separation

Any unresolved authorization, safety, privacy or accessibility failure must be
resolved individually before relevant release; average test counts do not waive
these gates. Registry refusal still blocks integrated local Auth/PostgREST/email
acceptance. No retry performed. No live activation or production readiness claim.
This patch is not incorporated into the pinned narrow candidate or earlier bundles.
Review copy changes independently; retain existing policy/model locks. Rollback is
to omit this separate patch, not modify the preserved candidate.

## Claims Guide 06 follow-up

06 P0065: ListYourResidencePage has trauma-informed service/presentation language
and form taxonomy. These require specific practice/source support; retained for
program review rather than blanket replacement or changing submitted categories.
06 §§7–10: no new impact numbers, certification, cost or channel-availability
claims were introduced. Program cost/capacity, contact reachability, donation-link
function and supporting practices remain unverified. Source-supported wording is
not independent verification. JUST GRACE program naming and marketing stories
were not added. Complete 06 required no further UI changes.

Prior editorial commit 1fbf1657a126393d192455b0db341d4664fb2e79 is preserved
in ancestry; follow-up only closes source coverage and records broader checks.

Generated public/gfa website assets were build/presence checked, not fully
editorially reviewed. This is not a claim that all GFA website copy conforms.
