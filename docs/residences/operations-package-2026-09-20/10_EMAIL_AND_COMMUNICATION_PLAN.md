# 10 — Email & Communication Plan / Governance (prepared; nothing created or sent)

- **Residence applicability:** both · **Evidence date:** 2026-09-20 · **State:** PREPARED (not effective) · **Owner:** ED + GFA Workspace administrator · **Approval required:** yes · **Supersession:** supersedes the earlier draft proposing `recoveryresidence.org` intake mailboxes
- **No account is created, changed, or sent.** Templates use synthetic placeholders. No passwords/recovery/security settings are exposed.

## Controlling email decision (September 2026)
- **Latisha Williams and Yvette each have official individual `@graceforaddictions.org` accounts** — the current approved organizational channels for their authorized work (**ED-confirmed 2026-09-21**). **Do not guess their exact addresses**; use an exact address only if it is already documented or the ED provides it explicitly. **An email account does not independently grant housing, intake, admission, disclosure, signing, or system authority** (authority is established per §09 + a `role_assignments` grant).
- **Do not create additional email accounts** this phase (no `recoveryresidence.org` accounts; no new GFA accounts/aliases).
- **`rcoiowa.org` = PROPOSED / FUTURE only** (see final section) — no accounts, aliases, forwarding, DNS, or migration.

## PHONE-001 — telephone numbers: **RATIFIED** (Executive Director, 2026-09-21)
Ratified by Thomas DeGarmeaux (Founder & Executive Director), 2026-09-21. The two numbers serve **distinct functions** and are **not interchangeable**; label each number's function wherever it appears.

| Number | Ratified function | Use as general admin / housing-intake #? |
|---|---|---|
| **515-220-8771** | **Canonical GFA office, administrative, housing-intake, and referral-partner telephone number** | **YES — this is the intake/admin number** |
| **515-310-3425** / **515-310-DIAL** | **GFA Warmline / peer-support line** (seeded `supabase/launch/seed/0202_seed_resources.sql` as "GFA Warmline"; non-crisis peer support) | **NO — must not be presented as the general administrative or housing-intake number** |

**Ratified rules:**
- Use **515-220-8771** as the office / administrative / **housing-intake** / referral-partner number in operational templates, always labeled as such.
- The **Warmline 515-310-3425** is peer-support only; **never** present it as the general admin or intake number. Where it appears, label it "GFA Warmline / peer support."
- The prior live-vs-dev "Contact phone" discrepancy (`docs/discovery/wix-live-vs-dev-inventory-2026-09-15.md`: live 515-220-8771 vs dev 515-310-3425) is **resolved** by this ratification: the public/intake contact number is **515-220-8771**; the dev value showing the Warmline as the contact number is an error to correct on the next authorized site/config update (not done here — no DNS/publish/production change this phase).

**Occurrences restored with labels in this package:** `10` signature line + template #6; `12` manual-fallback row; `17` item 1 (printable-application fallback) + roll-up; `18` EJWRH readiness application line — all now read "515-220-8771 (GFA office / housing-intake)".

**Executive-name ratification (2026-09-21):** the GFA Founder & Executive Director is **Thomas DeGarmeaux**. The erroneous ED name **"Thomas Miller"** (no other "Miller" exists in the repository; it is a wrong name for the ED, distinct from GFA President Dave Stout) is **corrected to Thomas DeGarmeaux at the authoritative source** `packages/residence-content/src/documents/emergencyResponseProtocols.ts` (uncommitted working-tree fix). Downstream copies still carrying the old name until an **authorized regenerate→build→deploy** (gated; not done here): the generated `docs/residence-documents/emergency_response_protocols.md` ("do not edit by hand"), the generated `supabase/seed/documents_seed.sql`, the compiled `apps/platform/dist/assets/ResidentArea-*.js`, and the **CQCX-published Emergency Response Protocols edition**. → propagation is a technical/authorized action, tracked in §15.

## Account governance — documentation (facts I cannot verify are marked UNKNOWN; do not fabricate)
| # | Item | Status |
|---|---|---|
| 1 | Accounts exist / administrative status | Latisha + Yvette individual `@graceforaddictions.org` accounts **exist** (leadership-confirmed). Admin status details **UNKNOWN — evidence required** (Workspace admin). No passwords/recovery/security settings recorded. |
| 2 | MFA enabled? | **UNKNOWN — evidence required.** Requirement: MFA **must** be enabled; Workspace admin to confirm/enforce. |
| 3 | Who administers | GFA Google Workspace administrator — **named incumbent UNKNOWN — evidence required.** |
| 4 | Approved organizational titles | **UNKNOWN — evidence required.** Do not assert a title without governing evidence (§09). |
| 5 | Which residence(s) each may represent | **UNKNOWN — AUTHORIZATION REQUIRED** (§09). EJWRH representation for housing matters is the Operator's to confer, not GFA's. |
| 6 | Communicating as… (GFA rep / GFA personnel supporting EJWRH / formally appointed EJWRH rep / Grace House rep) | **UNKNOWN — evidence required.** Default until established: **GFA representative** only. "Formally appointed EJWRH representative" requires Operator appointment (PSA). |
| 7 | Inbox/file/application-record/contact-list access | Governed by `role_assignments` + RLS (a **separate grant**, not the email). Current RecoveryOS role: **UNKNOWN — AUTHORIZATION REQUIRED.** Email access ≠ record access. |
| 8 | Backup coverage during absence | Assign a named backup per person (requirement); incumbents **UNKNOWN — evidence required.** |
| 9 | Retention & records management | Per GFA records policy (**to define**); authoritative records live in RecoveryOS, not the inbox. |
| 10 | Offboarding / immediate access removal | On role change/departure: disable account, revoke RecoveryOS role, reassign delegation, preserve correspondence per retention — **procedure to ratify.** |
| 11 | Shared passwords / informal sharing | **Prohibited.** Individual accounts only; no shared credentials; no informal mailbox sharing. |
| 12 | Confidentiality / privacy language | Required footer (below). 42 CFR Part 2 / HIPAA-aware; no protected info forwarded without a signed ROI (§11). |
| 13 | Signature format | See approved structure (below). |
| 14 | CC / BCC / forwarding / group messages | CC only those with a need-to-know and authority; **BCC not used to hide recipients on participant matters**; use BCC only for bulk non-participant notices; **no auto-forwarding of participant email to personal/external accounts**; group lists must be need-to-know and current. |
| 15 | Attachments → authoritative record | Store application/resident documents in **RecoveryOS** (the authoritative record), not as loose email attachments; delete/transfer per retention; never store protected attachments on personal devices. |
| 16 | Avoid unnecessary participant info in email | Minimum necessary; prefer a RecoveryOS link/reference over pasting details; no diagnoses/narratives/screening results in email bodies or subject lines. |
| 17 | Escalation (legal / clinical / crisis / accommodation / grievance / suspected privacy breach) | Route immediately: legal → ED + counsel; clinical/crisis → follow safety protocol (911/988) + House Manager; accommodation → Operator/GFA reviewer; grievance → grievance procedure; **suspected privacy breach → ED immediately + do not forward.** |

## Approved signature recommendation (use only authorized descriptors)
```
[Name]
[Approved organizational title]              ← omit until title is confirmed (§09)
Grace For Addictions
[Approved EJWRH or Grace House function, if authorized]   ← omit unless formally authorized
[Official @graceforaddictions.org email]
515-220-8771 (GFA office / housing-intake)    ← RATIFIED canonical office/intake number (PHONE-001); do NOT use the Warmline 515-310-3425 here
```
**Do not** describe Latisha or Yvette as employees, operators, admission authorities, case managers, clinical providers, or legal representatives unless current governing evidence supports it. Until titles/functions are confirmed, use only "Grace For Addictions" + name + official email + org phone.

**Confidentiality footer (required):**
> This message is intended only for the named recipient and may contain confidential information. Grace For Addictions protects participant information consistent with applicable law, including 42 C.F.R. Part 2 and HIPAA where they apply. Do not forward protected information without a signed release. If you received this in error, please delete it and notify the sender.

## Prepared templates (send from the authorized `@graceforaddictions.org` account; **do not send**)
Synthetic placeholders only.

**1. Role-authorization notice — Latisha** (issue only after authority established, §09)
> Latisha, effective [date], you are authorized to act as [exact role] for [Residence] within these boundaries: [functions]. Granted by [GFA ED / EJWRH Operator] under [appointment/PSA/policy]. RecoveryOS access limited to [role]. You may not [out-of-scope]. Your `@graceforaddictions.org` account is your channel; it does not by itself grant record access, disclosure, or housing authority. — Thomas DeGarmeaux, Founder & Executive Director

**2. Role-authorization notice — Yvette** (same structure, Yvette / [role] / [Residence]).

**3. Referral-partner introduction — from Thomas**
> Hello [Partner], I'm Thomas DeGarmeaux, Founder & Executive Director of Grace For Addictions. We support two recovery residences — Grace House (women) and Ernest & Johnnie White Recovery House (men, operated by EJWRH, L.L.C.). To refer someone, use [application link] or contact [authorized staff]@graceforaddictions.org. We can share information about an individual only with a signed release. No shame. No stigma. Just grace.

**4. Inquiry acknowledgment**
> Hi [First name], thank you for reaching out to [Residence]. We received your inquiry and will follow up within [response standard]. In immediate danger, call 911; crisis support, 988. — [Residence] team

**5. Application-received notice**
> Hi [First name], we've received your [Residence] application; it's in review. Next: [screening/documents]. We'll be in touch within [response standard]. — [Residence] team

**6. Missing-information request**
> Hi [First name], to continue your [Residence] application we still need: [items]. Reply here or call 515-220-8771 (GFA office / housing-intake). Nothing you've sent is lost. — [Residence] team

**7. Waitlist / no-bed-available**
> Hi [First name], you've been approved for [Residence], and there isn't an open bed right now. You're on our waitlist at position [#]. We'll contact you the moment a bed opens. Interim supports: [referrals]. — [Residence]

**8. Approval notice**
> Hi [First name], your application to [Residence] has been approved by [Operator/GFA]. A move-in date depends on bed availability; next steps: [documents, fees, orientation]. Welcome. — [Residence]

**9. Denial / non-acceptance (person-first)**
> Hi [First name], thank you for applying to [Residence]. After review, we're not able to offer a place at this time. This is not a judgment of your worth, and it doesn't close other doors. Options that may fit better: [referrals]. You may ask about reconsideration: [path]. We're rooting for you. — [Residence]

**10. Transition-coordination (internal/partner; protected info only with a signed ROI)**
> Re: transition to [Residence] on [date]. Coordinating: bed confirmation, documents, medication continuity, transportation, first-day plan, assigned support person. Protected information is shared only with a signed release on file. [De-identified checklist — see 13.]

**11. Request-for-consent (when external communication needs authorization)**
> Hi [First name], to coordinate your move to [Residence] we'd like to speak with [external party — e.g., your treatment team / supervising officer]. We can only do that with your written permission. Attached/linked is a release that lets you choose exactly what we may share, with whom, and for how long — you can decline or revoke at any time. Nothing is shared until you sign. — [Residence] team

## PROPOSED — FUTURE — NOT AUTHORIZED FOR IMPLEMENTATION: `rcoiowa.org` residence-network email
A future, separately governed email identity for the broader recovery-residence network. **No account, alias, forwarding rule, DNS record, migration, or redirect is created.** Considerations to decide later:
- **Naming conventions:** role-based (e.g., `intake@`, `manager@`) vs individual (`first.last@`); per-residence prefixes vs shared network identity.
- **Shared network identity:** whether the residence network presents under `rcoiowa.org` distinctly from GFA's `graceforaddictions.org`.
- **Individual vs role-based accounts:** role mailboxes for continuity vs individual for accountability (likely both, with delegation).
- **Migration & forwarding:** how/whether existing `@graceforaddictions.org` correspondence relates; **no auto-forwarding decided.**
- **Records retention:** retention + legal-hold across a domain change; preserve historical correspondence.
- **Operator/provider representation:** ensure EJWRH housing mail represents the Operator accurately; GFA-as-provider not conflated with operator.
- **Authentication & MFA:** MFA required; SSO considerations.
- **SPF / DKIM / DMARC:** configure for `rcoiowa.org` before any external sending (deliverability + anti-spoofing).
- **Account ownership:** who owns/administers each mailbox (GFA vs residence operator).
- **Offboarding:** disable + preserve on departure.
- **Preservation of historical correspondence:** export/retain prior mail; no silent loss.

_Nothing in this file is created, configured, migrated, redirected, or sent._
