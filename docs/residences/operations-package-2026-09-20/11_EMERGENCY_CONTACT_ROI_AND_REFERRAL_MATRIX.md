# 11 — Emergency Contact, ROI & Referral Communication Matrix

- **Residence applicability:** both (residence-specific) · **Evidence date:** 2026-09-20 · **State:** PREPARED (nothing activated) · **Owner:** ED + counsel · **Approval required:** yes (counsel for ROI/legal) · **Supersession:** corrects the earlier "no ROI for either residence" statement
- **No legal conclusions are made here.** Legal calls are flagged for counsel (42 CFR Part 2 / HIPAA / Iowa privacy).

## Three separate concepts (never merged)
1. **Emergency-contact record** — who to reach in an emergency. Does **not** authorize disclosure of protected information.
2. **Permission to communicate** — the person agrees we may contact them / a named party for coordination.
3. **Authorization to disclose protected information (ROI)** — specific, written, revocable release governing what protected info may be shared, with whom, for what purpose, how long.

## Communication-type taxonomy (do NOT treat every referral-source contact as ROI-gated)
Classifications: **[P] permitted without participant-specific disclosure · [C] consent (permission to communicate) required · [R] formal ROI potentially required · [L] counsel decision required · [X] prohibited until authorized.**

| Communication type | Class | Note |
|---|---|---|
| Receiving an **unsolicited referral** from a partner | **P** | receiving information is not us disclosing |
| **Acknowledging receipt** of a referral to the partner | **P → C** | acknowledge process generically; naming/□confirming the individual to the partner needs permission to communicate |
| **Scheduling** a screening/interview **with the person** | **C** | permission to communicate with the person |
| **General logistics** with the person (address, time, what to bring) | **P/C** | no protected content |
| **Receiving information from** an external party about the person | **P**, but | receipt is generally permissible; **acting on / re-sharing** it may be **R/L** |
| **Confirming *whether* someone applied** to a third party | **R** | confirming application/identity to an outside party is participant-specific disclosure |
| **Confirming acceptance or residence** to a third party | **R** | disclosure of residence/participation |
| **Disclosing recovery / health / treatment / legal / residence information** | **R + L** | ROI + counsel-verified scope |
| **Re-disclosure** of Part 2-protected info by a recipient | **L / X** | 42 CFR Part 2 restricts re-disclosure — **counsel**; prohibited until authorized |
| **Emergency communication** (imminent safety) | **L** | law permits certain emergency disclosures — **counsel** defines the boundary; follow safety protocol + document |

Principle: **administrative coordination (receiving, acknowledging generically, scheduling, logistics) is generally [P]/[C]; anything that reveals participant-specific protected information to an outside party is [R]/[L].** Counsel confirms the exact lines.

## Grace House ROI — reconciliation (the reported library ROI)
| Question | Finding |
|---|---|
| Does a GH ROI file exist? | **Yes** — `docs/residence-documents/form_release_of_information.md` |
| Filename / version | `form_release_of_information.md` · **Version 2026.07** |
| Ratified? | **No evidence of ratification** (generated from `packages/residence-content`; "do not edit by hand") |
| Active? | **No** — not a CQCX `document_templates` edition (not assignable in RecoveryOS) |
| Resident-facing? | **Yes** (resident-signed form) |
| What it authorizes | checkbox-scoped: residency confirmation, attendance/participation, screening results, recovery plan/progress, medication, fees, other; purpose; direction (release/receive/both); ≤1-year expiry; revocation |
| Parties covered | Grace For Addictions → a named recipient (treatment, probation, family, etc.) |
| Suitable for current use? | **Not confirmed** — GFA/Grace-House-branded (not EJWRH); self-flags "verify clause codes … Iowa HHS form 470-0025" → **counsel** |
| Requires counsel review? | **Yes** (42 CFR Part 2 re-disclosure clause present but must be counsel-verified for Iowa) |
| Associated DB edition? | **No** |
| Superseded? | No prior version evidenced; v2026.07 is the only one |

**Net:** Grace House has a **prepared/draft ROI**, not an active one. **EJWRH:** **missing / held** (no ROI). Do not activate/assign either until counsel-reviewed and (if used) loaded as a proper edition.

## Emergency-contact form (residence-specific) — DRAFT, not effective
Fields: resident name; contact name; relationship; phone; may-we-contact-in-emergency (yes/no); **explicit note: "This does not authorize disclosure of your recovery, medical, or program information — that requires a separate signed release."** Maps to `emergency_contacts.notify_authorized`. One per residence (EJWRH / Grace House).

## Legal conclusions — FOR COUNSEL (flagged, not decided)
ROI language/scope/duration/revocation + 42 CFR Part 2 re-disclosure (Iowa); whether GFA vs the EJWRH Operator is the disclosing party (PSA Art. 11); Iowa Code ch. 562A occupancy characterization; suitability of one ROI across treatment vs probation/parole vs case managers (scoped variants?); emergency-disclosure boundary.

**Blockers:** counsel review + ratify a GH ROI (and author an EJWRH ROI); finalize residence-specific emergency-contact forms; confirm the communication taxonomy with counsel.
