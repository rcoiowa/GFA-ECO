# Build Disposition Map — "bits and pieces of each" — 2026-08-04

Owner question: where does the Recovery Residence HTML live, what does it do
better than everything else, and what do we do with all the builds. This
document answers all three with verified evidence and one recommendation
per build (directive §7–§8 dispositions).

## 1. Where the Recovery Residence HTML is deployed

**Nowhere public.** Verified 2026-08-04: `/residence/` on gfa-vrcc.pages.dev,
vrcc.app, and recoveryos-staging all return their apps' SPA fallback, not
this page. It exists in exactly three places:

1. The claude.ai artifact (`claude.ai/code/artifact/b98557db-…`) — its origin.
2. **This repo**: `sites/gfa-vrcc-residence/index.html` (commit `eb62fbc`) —
   a verified, self-contained copy (host wrapper stripped, zero external
   requests, smoke-tested in headless Chromium) staged for drop-in at
   `public/residence/index.html` of the vrcc.app repo.
3. The file attached in the working session.

It is a **single-file client-side app**: all data lives in the browser's
localStorage (`recovery-residence-v1`), one device, no accounts, no server.
That makes it a superb demo and UX spec — and not a system of record.

## 2. What it does better than what we've built elsewhere

Compared against the canonical platform (`apps/platform` staff area) and
the RecoveryResidenceOS repo, its genuinely superior pieces:

| Capability                                 | Why it's better                                                                                                                                                                                               | Where our builds fall short                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **"Attention needed" triage dashboard**    | One computed queue: flagged check-ins (mood 1/5 or "want to talk"), residents ≥1 week behind on fees, pending furloughs, open grievances — each with severity and an acknowledge action, plus a sidebar badge | Platform's staff Today shows counts only; no unified alert queue, no acknowledge loop                                                      |
| **Check-in → staff flag → follow-up loop** | Resident wellness pulse (mood/cravings/support request) that routes to staff and records the follow-up                                                                                                        | Platform check-ins live on the VRCC participant side; residence staff have no flag/ack workflow at all                                     |
| **Admit-from-waitlist**                    | Numbered priority queue; one click admits to the first open bed and clears the queue entry                                                                                                                    | Platform waitlist is an application status; bed placement is a separate manual step on another page                                        |
| **Furlough lifecycle**                     | Request → approve/deny → **confirm return**, with bed-hold and fee rules stated inline                                                                                                                        | Platform passes stop at approved/denied; no return tracking                                                                                |
| **Zero-friction operator onboarding**      | Wizard → live workspace in under a minute, demo seeded, multi-house switcher with "add another residence"                                                                                                     | The platform port (`/recovery-residences/list-your-residence`, migration 0019) has the wizard but requires account + DB and isn't deployed |
| **Language & tone**                        | Dignity-centered microcopy everywhere: "welcome home", "exits recorded neutrally — door stays open", "honesty is safe here", grievance timeline standards, hardship-first fee language                        | Platform copy is good but less consistently woven into every action/toast                                                                  |
| **Visual identity**                        | Fraunces/Karla, warm pine/cream/amber system, coherent components (stat cards, bed grid, chips)                                                                                                               | Platform UI is clean but plainer; RROS uses the same fonts but less polish                                                                 |

What it lacks (why it can't be the system): no backend, no auth, no person
model, no RLS, no audit, single-device data. And its entire scope is
**housing operations** — the exact territory §4.6 assigns to the separate
HousingOps entity (R-01).

## 3. Disposition of every build

| Build                                                          | Where it lives                                     | Status (verified)      | Disposition                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------- | -------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recovery Residence HTML** (this page)                        | artifact + `sites/gfa-vrcc-residence/`             | not deployed           | **PRESERVE CONTENT, REBUILD EXPERIENCE** — adopt as the canonical UX spec for the universal housing product (recoveryresidence.app). Short-term: publish as the demo/front door at gfa-vrcc.pages.dev/residence/ (drop-in already staged). Long-term: rebuild its four best engines (triage dashboard, check-in flag loop, admit-from-waitlist, furlough lifecycle) on the real database |
| **GFA-ECO platform** (`apps/platform` + packages + migrations) | this repo; staging worker                          | COMPILED; staging live | **KEEP — canonical RecoveryOS.** VRCC participant experience, identity/consent, residence _bridge_ (directory, apply, referral, status). Its staff housing-ops rooms either move to the housing product (R-01a) or stay (R-01b) — owner call                                                                                                                                             |
| **vrcc.app repo (MVP + Gate 19B)**                             | production: vrcc.app + gfa-vrcc.pages.dev          | VERIFIED live          | **KEEP serving, feature-freeze.** It is production until Phase 14 cutover. Its coaching MVP flows are donor material for the coach workspace                                                                                                                                                                                                                                             |
| **RecoveryResidenceOS repo**                                   | worker stale; repo ahead of deploy                 | INSPECTED              | **MERGE → ARCHIVE.** Directory + public application already consolidated into the platform; freeze its `db-migrations.yml` first (R-06)                                                                                                                                                                                                                                                  |
| **Lost rich vrcc.app build** (`index-DMwbAUg-`)                | overwritten ~Aug 2; no source                      | REFERENCE ARTIFACT     | **REFERENCE ONLY.** Surviving value (Residence/Center nav, `/residences` directory) already rebuilt canonically                                                                                                                                                                                                                                                                          |
| **grace-vrcc worker branch** (4 content pages)                 | branch `what-is-built-here-3co21c`; never deployed | INSPECTED              | **REFERENCE ONLY** — harvest Grace AI architecture page, slogans, Enneagram content into the IP register                                                                                                                                                                                                                                                                                 |
| **gracehouse4.pages.dev**                                      | live                                               | VERIFIED               | **KEEP** as Grace House's public document set until the portal document library is the front door                                                                                                                                                                                                                                                                                        |
| **grace-harbor-16**                                            | repo only                                          | IDENTIFIED             | **REFERENCE ONLY** — crisis-resource module is the harvest target                                                                                                                                                                                                                                                                                                                        |
| **contact-connect-dashboard**                                  | repo only                                          | IDENTIFIED             | **REFERENCE ONLY** — coaching intake/messaging flows inform Phase 7                                                                                                                                                                                                                                                                                                                      |

## 4. The one decision that unlocks the plan

The artifact resolves R-01 _in product form_: it demonstrates that housing
operations want to be their **own universal product** ("Recovery Residence
— every recovery house deserves great operations"), while RecoveryOS/VRCC
remains the community center that _refers into_ housing. Recommended:

- **R-01(a)**: Recovery Residence becomes the separate housing platform
  (Solid Ground Housing Group / recoveryresidence.app), seeded from this
  artifact's UX + the platform's existing housing-ops code and schema as
  donor material, on its own project/schema per §4.6.
- RecoveryOS keeps: `/recovery-residences` directory, application/referral
  bridge with consent, and limited status visibility — already built on the
  `residence-application-flow` branch.

This is a recommendation, not a decision — it goes on the owner approval
checklist with the rest of Gate A.
