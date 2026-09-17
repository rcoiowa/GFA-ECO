# EJWRH B5B — Final Document Ratification & Activation Readiness Record

> **READING ORDER (added 2026-09-01).** This is a layered, append-only record: the ⬥ dated
> entries at the top are the decision log, and the LATEST entry governs. The numbered
> sections below them are the original B5B gate report (2026-08-24/25) preserved as
> history; where a later entry superseded one, a banner on that section says so.
> **Current state in one line:** the EJWRH document edition is ACTIVE (0146 applied
> 2026-08-31); EJWRH intake is open end-to-end including recorded move-in; still open —
> record-retention period (counsel/policy, non-blocking), executed-PSA paper copy archival
> (evidence filing), grievance named contact (optional), accommodation evidence loop
> (future gate).

## ⬥ EXECUTIVE RATIFICATION ENTRY (2026-08-24)

The Executive Director ratified the following as the **approved resident-facing policy
editions**, at their content as of commit `cffedfd`, subject only to correction of clerical
errors or conflicts discovered against already-ratified decisions. **Activation remains
closed** — ratification approves the text; activation is a separate future act.

| Document | Ratified content hash (frozen) |
|---|---|
| EJWRH Resident Handbook | `834773861098c23b4a36785952498d157da39d568cdc015ca41667ff627690ba` |
| EJWRH Resident Rights & Grievance | `285ce0974c803eb8afb134df20ba21175995c320520c9ccc513822fb44167024` |
| EJWRH Screening Policy | `a835849688a9515e5a0adb4d7d43941717fdaefb415748e2b8f98106612cd6c7` |
| EJWRH Medication/MOUD Policy | `6412db49cfe42cbfdfb81beb2d70e2310c42837407820ff90ad1f4dfdd7d605f` |
| EJWRH Return-to-Use Response Policy | `c4cbe7669007474cb9e6a4c5178ab4968277ec4cfa28efbb0f050fa07ad86a97` |

Ratified in the same act, the **late-fee terms** (Agreement §5, updated accordingly —
new Agreement hash `045135c6be78d76d826e084f665f3417a0e48b125ffbff25ac9bf45d28d218b2`):
$5/day with a **maximum of $50 per delinquent payment period**; no late fee during the first
30 days of residency; late fees **suspended** while the resident complies with an approved
hardship/payment plan and **waivable** on timely prior communication or documented
circumstances; **late payment alone never automatically results in discharge**.

The Participant & Residency Agreement remains **content substantially complete, activation
blocked** (see the Legal-Review Reconciliation entry below for the current blocker set).

---

## ⬥ LEGAL-REVIEW RECONCILIATION ENTRY (2026-08-24)

**Qualified review disposition: APPROVED WITH ATTACHED REVISIONS** — applied as
authoritative review input for the Participant & Residency Agreement and the B5B activation
architecture. Revisions incorporated:

1. **Agreement §13 replaced** with the complete electronic-records disclosure: scope of
   electronic consent; right to paper; withdrawal procedure (prospective — signed records
   stand); contact-information update; free paper-copy process; hardware/software
   requirements; material-technology-change notification and re-consent; retain/download/
   print rights; persistent unrestricted access; and the explicit intent-to-sign statement.
   New Agreement hash: `fb1d7c9bf2927f8f79b1e6f338d5bd64e11e98dc4c23d075ddcd9fb2f79c4214`.
2. **Affirmative electronic consent before e-signing** — implemented live (0145): canonical
   consent type `electronic_records` (account_identity), grantable ONLY by the person
   themself, in-app; `acknowledge_document` refuses signature documents with
   `electronic_consent_required` absent an active grant; withdrawal via the existing revoke
   path. Verified live: gate refusal, self-only refusal of a staff-recorded grant,
   idempotency, post-consent signing, withdrawal.
3. **Signing-intent control** — the signing button reads "Sign {document name}" (for the
   agreement: "Sign … Participant & Residency Agreement") with the adjacent statement that
   selecting it constitutes the resident's electronic signature and intent to be bound —
   in both signing surfaces (Getting settled + resident Documents).
4. **Paper pathway with parity** — "I prefer to sign on paper" is visible in both signing
   surfaces with explicit no-adverse-consequence language; staff record the witnessed paper
   signature via `record_paper_signature` (0145) onto the SAME assignment — verified live to
   produce the identical pinned version + content hash, `signature_method='paper'`, and the
   `document_signed_paper` audit event with the witnessing staff identity. Readiness effect
   identical to e-signing.
5. **Nonelectronic legal-notice safeguard** — Agreement §13 "Legal notices" states that
   electronic delivery alone is never treated as legally sufficient where law requires
   nonelectronic delivery (eviction, termination, default, right-to-cure). RecoveryOS has
   no notice-delivery workflow that could violate this today (verified: discharge is a staff
   RPC with no electronic-notice semantics); the constraint is recorded as binding design
   law for any future notice feature — delivery evidence may be created/retained, and the
   required nonelectronic delivery must be recordable.
6. **Counterparty** — expected party per the review: **Ernest & Johnnie White Recovery
   House, L.L.C.**, named in Agreement §1 as expected-but-not-operative until the executed
   PSA and supporting entity authority are verified (never inferred from the v2 draft). GFA
   remains the contracted recovery-support/program/technical provider, not the housing
   party.
7. **Record retention — UNRESOLVED policy/legal blocker (not invented).** Research notes
   (Evidence class E, requires qualified confirmation): Iowa's limitations period for
   actions on written contracts is commonly cited as ten years (Iowa Code ch. 614), which
   would be the natural retention anchor for the signed agreement; no recovery-residence-
   specific statutory retention requirement was identified; NARR/MCRSP documentation
   standards may add expectations. The verified retention period must be supplied by
   counsel/policy before activation; the platform preserves signed artifacts indefinitely
   (immutable) in the meantime, so no evidence is at risk while this is open.
8. **Signed-agreement access verified**: view (pinned version in-app), print/save where the
   device permits ("Print or save a copy" control), paper copy on request at no charge, no
   DRM or expiry anywhere in the machinery, persistent access during residency (intake
   Getting-settled + resident Documents both read the person's own assignments), and
   indefinite immutable preservation pending the verified retention rule.

**NARR Agreement-review status:** the EJWRH Agreement has not yet been reviewed by the Iowa
affiliate (MCRSP); it is drafted to NARR fee-disclosure and resident-rights expectations
(fees disclosed in writing before funds are accepted; refund policy before binding; rights
never waived), and affiliate review occurs within the certification process — tracked, not a
B5B blocker.

---

## ⬥ EXECUTIVE/AUTHORITY RECONCILIATION ENTRY (2026-08-25)

Documentation/authority pass only — no activation act occurred. Decisions recorded:

1. **Compensation model — RESOLVED (executive).** Service-volume FMV schedule retained in
   PSA v4.1 §5.3; flat-retainer alternative declined at this time (reconciliation record §3).
2. **Three-agreement condition — RESOLVED (executive).** The hard condition precedent is
   not restored: PSA v4.1 is effective per its own terms upon execution by both parties;
   the W & W Properties lease and the Entity Structure & NARR Compliance Disclosure remain
   related instruments verified and maintained separately (reconciliation record §5).
3. **GFA signing authority — CORRECTED (executive/leadership-confirmed).** Dave Stout is no
   longer the authorized GFA signer; **Thomas DeGarmeaux, Executive Director**, is the
   current authorized GFA representative/signing authority. Dave Stout removed from the
   PSA v4.1 Parties and signature blocks; execution .docx regenerated and reverified. No
   signature or execution date fabricated (reconciliation record §6).
4. **Operator operational authorization — LEADERSHIP-CONFIRMED (Evidence Ledger C).**
   Curtis White personally reviewed the current arrangement and gave Thomas DeGarmeaux
   explicit approval to proceed, specifically authorizing moving forward with what is
   necessary to **onboard current and future EJWRH residents through the RecoveryOS intake
   process**.

   **What it authorizes:** Operator operational permission for GFA to run the RecoveryOS
   resident-intake/onboarding workflow for EJWRH residents — the non-signature intake
   machinery already live and approved (conditional acceptance → account offer → person
   resolution → application conversion → approval → readiness work: screening consent,
   emergency contact, medication reconciliation, supervision coordination). Under the
   governance model this **clears the operational-authorization dimension** for
   building/using the EJWRH intake workflow: no additional Operator permission is needed to
   proceed with those steps.

   **What it does NOT do:** it is not a PSA signature or execution date (PSA v4.1 remains
   **UNEXECUTED**); not an executive/Operator attestation that the PSA has been executed
   (so it does not clear the Agreement §1 `[PENDING — EXECUTED-AUTHORITY VERIFICATION]`
   block); not a blanket legal delegation; not a ratification or activation of the
   Participant & Residency Agreement as an electronic contract; and not authority beyond
   what was actually approved. Document-edition activation (0146), resident signing, B6,
   Cloudflare, and external disclosure all remain closed.

   **Architectural consequence (verified in 0142/0143):** every intake step **except the
   final recorded admission** is document-edition-independent and may be used for EJWRH
   now. The final `admit_applicant` act is blocked by the deliberate, non-overridable
   `signature_documents → pending_document_edition` readiness placeholder until the EJWRH
   document edition activates — that gate is activation-blocking by design and is **not**
   cleared by operational authorization alone.

---

**Status: FIVE EDITIONS EXECUTIVE-RATIFIED — ACTIVATION CLOSED
(2026-08-24).** B5A (`ee9b042`) accepted. This record incorporates the B5B
executive-ratified operating values into the six EJWRH editions, proves single-source
consistency, maps incorporated documents, designs the accommodation evidence loop, packages
the e-sign legal review, and pins the prepared (NOT applied) activation migration. No
document activation, no resident signatures, no B6, no Cloudflare, no external disclosure.

---

## ⬥ ACTIVATION ENTRY (2026-08-31) — EJWRH DOCUMENT EDITION LIVE

**Executive activation order (2026-08-31):** "apply 0146. Everything is executed. … The
Participant agreement and everything Participant facing has been approved." Recorded as:

1. **Executive attestation of execution** (Evidence Ledger C): the Executive Director
   attests the PSA v4.1 and related instruments are executed. This is the attestation path
   the legal-review rule allowed ("clears only against the executed v4.1 **or an executive
   attestation of execution**"). No signature artifact is fabricated; the executed paper
   copy should be archived into `docs/agreements/` as A-level evidence when convenient —
   an evidence-filing step, not an activation condition.
2. **Participant-facing approval:** the Participant & Residency Agreement and all
   participant-facing documents approved. Applied as ratification of the two prepared
   Agreement changes (counterparty named operatively: Ernest & Johnnie White Recovery
   House, L.L.C. in §1; §5 individualized-reduction wording per reconciliation record §7
   item 1). New Agreement content hash:
   `1df7e655328419a0a58a6068055f5739876bab4bd604c18dd9dba8ef746719eb`. The five
   acknowledgment documents were seeded byte-identical to their frozen ratified hashes.
3. **PSA visibility:** the PSA is an operator/provider instrument and is **not** made
   viewable to participants — confirmed; 0146 seeds only the six resident-facing documents.
4. **Record retention:** still **not invented** — no seeded text asserts a period; signed
   artifacts are preserved immutably and indefinitely pending the counsel/policy
   determination, which remains open as a records-policy item (no longer activation-relevant).

**Applied:** `0146_ejwrh_document_activation` (generated by
`scripts/build-ejwrh-activation.mjs`, effective 2026-08-31) applied to CQCX; the
in-migration hash gate verified all six seeded bodies against the pinned hashes. Live
verification: 6 templates active at residence 2 (1 signature + 5 acknowledgment), all v1.0
published 2026-08-31 at the exact ratified hashes; post-apply launch-contract preflight
PASS; full synthetic intake E2E green in a rolled-back transaction (apply → approve → 6
assignments → e-consent refusal gate (`electronic_consent_required`) → consent → Agreement
signed recording hash `1df7e655…` → five acks at frozen hashes → screening consent →
emergency contact → medication reviewed-none → readiness complete, zero blocking →
`admit_applicant` succeeded → EJWRH residency created). No fixture artifacts persisted.

**EJWRH intake is now open end-to-end, including recorded move-in.** B6 (ack_self policy
retirement), Cloudflare, and external disclosure remain closed.

---

## 1. Operator-decision matrix (executive-ratified 2026-08-24 → where each value lives)

| Decision | Canonical home | Status |
|---|---|---|
| Shared room $175/wk · $650/mo advance | Agreement §5 (only place fees appear) | RATIFIED, drafted |
| Private room $200/wk · $750/mo advance | Agreement §5 | RATIFIED, drafted |
| Move-in fee $250 nonrefundable | Agreement §5 | RATIFIED, drafted |
| Live-Out $25/wk | Agreement §5 | RATIFIED, drafted |
| Fee individualization (PSA v4.1, 2026-08-25, supersedes "no grandfathered rates"): standard rates apply unless EJWRH approves an individualized arrangement; prior agreements may be honored; a reduction never changes the published rate for others | PSA v4.1 Art 4; resident Agreement §5 wording change identified (not yet applied — hash frozen) | RECONCILED in PSA v4.1; resident-doc edit awaits re-ratification |
| Weekly payment any day; outstanding → Sunday house meeting | Agreement §5 + Handbook §4/§5 | RATIFIED, drafted |
| Monthly due on/before the 1st | Agreement §5 | RATIFIED, drafted |
| No late charge in first 30 days | Agreement §5 | RATIFIED, drafted |
| $5/day after 30 days, waived on advance communication / arrangement | Agreement §5 | RATIFIED, drafted |
| $5/day maximum cap: **$50 per delinquent payment period** | Agreement §5 | RATIFIED 2026-08-24, drafted |
| Refunds generally nonrefundable; exceptions case-by-case, prorated by unused days | Agreement §5 | RATIFIED, drafted |
| Fees = Operator financial function, not GFA | Agreement §1 + §5 | RATIFIED, drafted |
| Hardship/payment-plan standard (dignity-centered, 6 steps) | Agreement §5 "the hardship path" | RATIFIED, drafted |
| No automatic discharge for late payment | Agreement §5 | RATIFIED, drafted |
| Quiet hours 9:00 PM–9:00 AM, separate from curfew | Handbook §4 | RATIFIED, drafted |
| House meeting Sunday 6:30 PM | Handbook §4 | RATIFIED, drafted |
| GroupMe (not BAND); results never posted there | Handbook §4 + Screening §protections | RATIFIED, drafted (zero BAND references, verified) |
| Naloxone: designated location near the thermostat | Handbook §6 (single resident-facing statement) | RATIFIED, drafted |
| Screening roles: House Manager / designated Liaison / Executive Leadership | Screening Policy + Agreement §6 | RATIFIED, drafted |
| Methods: UA / breathalyzer / oral fluid | Screening Policy + Agreement §6 | RATIFIED, drafted |
| Refusal nuance (no-show w/o reason may = refusal; legitimate unavailability never auto-labeled) | Screening Policy | RATIFIED, drafted |
| Contested result → repeat and/or lab confirm, resident expense; recorded contested/unconfirmed | Screening Policy + Return-to-Use cross-ref | RATIFIED, drafted |
| Result confidentiality (need-to-know; never GroupMe/coaching notes; external only under authority/consent w/ audit) | Screening Policy | RATIFIED, drafted |
| Care-response facilitation: Operator / Liaison / authorized Executive Leadership | Return-to-Use §5 + Screening | RATIFIED, drafted |
| Grievance SLA (ack 1 bd; response 5 bd; open-notice + expected date; appeal 5 bd; final 10 bd) | Rights & Grievance | RATIFIED, drafted |
| Informal resolution optional, never mandatory | Rights & Grievance step 1 | RATIFIED, drafted |
| Role-based appeal authority (not person-named; not the original decider where reasonably possible) | Rights & Grievance step 4 | RATIFIED, drafted; named contact deferred to executed-authority confirmation |
| External advocacy anytime; no retaliation | Rights & Grievance | RATIFIED, drafted |
| Medication self-possession/self-administration; no routine administer/dispense/dose | Medication Policy + Handbook §7 | RATIFIED, drafted |
| No universal lockbox / house safe; case-by-case secure arrangements | Medication Policy | RATIFIED, drafted (contradictory default-storage-class language removed) |
| New prescriptions/changes → House Manager | Medication Policy + Handbook §7 | RATIFIED, drafted |
| Controlled meds: reasonable evidence only (labeled packaging/med list preferred) | Medication Policy | RATIFIED, drafted |
| MOUD fully protected, never adverse to eligibility/readiness | Medication + Screening + Agreement + Rights (+ CI guard) | RATIFIED, drafted, machine-enforced |

## 2. Executed PSA status

> **SUPERSEDED (2026-08-31 Activation Entry).** PSA v4.1 was authored and reconciled
> (2026-08-25, signer corrected to Thomas DeGarmeaux), and the Executive Director attested
> execution on 2026-08-31; the counterparty (Ernest & Johnnie White Recovery House,
> L.L.C.) is named operatively in Agreement §1 and the Agreement is active and signable.
> Remaining evidence-filing step only: archive the executed paper copy into
> `docs/agreements/`. The text below is the 2026-08-24 state, kept as history.

**Not established (as of 2026-08-24).** The repository contains no executed EJWRH Professional Services
Agreement — `EJWRH_ProfessionalServices_Agreement_v2.docx` is ED-cited (Evidence class C)
and absent (verified sweep: `docs/source-documents/` holds Grace House and org material
only; no EJWRH PSA file anywhere in the repo). Parties, signatures, effective date, and
amendments therefore cannot be verified, and execution is not inferred from a filename.
Consequences applied:

- The **ratified operating model** (leadership-issued this gate) is the drafting authority
  for role language: Operator = housing operations, resident agreements, financial
  management, staffing/property/compliance; GFA = contracted recovery-support services,
  coaching, navigation, program development, training/TA, RecoveryOS, documentation/reporting
  support, financial planning assistance without managing resident funds. Agreement §1
  states exactly this and no more.
- The **contracting party's legal name remains `[PENDING — EXECUTED PSA]`** in Agreement §1,
  and that block keeps the Agreement unsignable until the executed PSA (or an executive
  attestation of the executed parties) is provided.

## 3. Six-document contradiction review — one canonical answer everywhere

Verified by cross-document sweep (each value has exactly one defining home; other documents
either repeat it verbatim or point to it):

| Topic | Canonical answer | Defined in | Consistent elsewhere |
|---|---|---|---|
| Phases | 3 (Foundation / Growth / Leadership & Transition), staff-judged advancement, no timers | Agreement §3 ≡ Handbook §1 (identical tables) | ✓ |
| Curfews | 9 PM → 10/11 PM → 11 PM/midnight; never past midnight | Agreement §3 ≡ Handbook §1 | ✓ |
| Quiet hours | 9 PM–9 AM daily, separate from curfew | Handbook §4 only | ✓ |
| House meeting | Sunday 6:30 PM | Handbook §4 only | Agreement §5 references it for weekly payments |
| 30-hour target | after human-judged stabilization | Agreement §4 ≡ Handbook §1 | ✓ |
| Support activities | 4 → 3 → 2 weekly by phase | Agreement §4 ≡ Handbook §2 | ✓ |
| Pathway neutrality | any approved pathway counts, none required | Agreement §4 ≡ Handbook §2 | ✓ |
| Sponsorship | encouraged, never mandatory; no 12-Step milestones anywhere | Agreement §4 ≡ Handbook §2 | ✓ |
| MOUD | never a violation, never adverse | Medication Policy (definer) + Agreement/Screening/Rights repeats | ✓ + CI guard |
| Testing | roles / methods / random-or-policy / refusal nuance / contested path | Screening Policy (definer); Agreement §6 summary | ✓ |
| Return-to-use | care-conversation sequence, facilitated per authority model | Return-to-Use (definer); Screening + Agreement §7 repeats | ✓ |
| Discharge | only via documented human decision — payment, screening, and refusal paths all route into it | Agreement §5/§7/§9, Screening, Return-to-Use, Rights #6 | ✓ |
| Grievances | ratified SLA, optional informal, role-based appeal, no retaliation | Rights & Grievance only | Handbook §10 + Agreement §10 point to it |
| Visitors/passes | guests in common areas, sober, posted hours, no overnight guests; passes via House Manager, phase/safety/plan considered | Handbook §3/§4 only | Agreement §2 points to Handbook |
| Fees | full ratified schedule + hardship path | Agreement §5 only | Handbook §5 points to it |
| Medication | self-possession model | Medication Policy (definer); Handbook §7 summary | ✓ |
| Emergency response | 911→staff, 988, Warm Line, naloxone near thermostat, posted evacuation | Handbook §6 only | ✓ |
| GFA/Operator roles | ratified contracted-service model | Agreement §1 only | ✓ |

Legacy EJWRH four-level material and any prior draft storage/fee language are **historical /
superseded** (program model §1, §8; medication banner) — no document treats them as an
alternative rule.

## 4. Incorporated-document coverage map (nothing disappears accidentally)

| Grace House standalone | Material provisions | EJWRH disposition |
|---|---|---|
| Code of Conduct | substance-free home; no violence/threats/weapons; honesty; respect for housemates/staff/neighbors; consequences via due process | Agreement §9 (commitments + rights-preserving consequences) + Handbook §4 (day-to-day) |
| Curfew & Pass Policy | phase curfew table; pass/overnight request + approval; work-schedule accommodation | Agreement §3 (curfew terms) + Handbook §1/§3 (procedure) |
| Emergency Response Protocols | 911 first; 988; warm line; naloxone location; evacuation/severe-weather; report safety concerns | Handbook §6 + intake-week staff walkthrough (contextual UX: crisis contacts also render in-app support surfaces) |
| Exit & Transition Policy | planned-transition support; for-cause process; belongings handling; door-stays-open | Agreement §11 (terms) + Handbook §9 (experience) |
| Good Neighbor Policy | noise/parking/property-line respect; neighborhood standing | Handbook §4 "Neighbors" (commitment) — enforcement lives under Agreement §9 conduct |
| Intake Forms Package | paper intake packet | **Explicitly retired** — the RecoveryOS intake flow is the intake (Gate A + B5A) |
| Application/Pre-screening form | paper pre-screening | **Explicitly retired** — canonical residence-intake boundary |
| Staff-only set (operational system, ethics, leaders policy, incident system, NARR self-assessment) | staff procedures | **Staff policy**, org-wide, never resident-assigned (unchanged) |

No provision was dropped: every rule from the five folded documents maps to Agreement,
Handbook, staff policy, or contextual UX above.

## 5. Accommodation evidence loop (design — NOT implemented this gate)

Ratified minimum loop: **identified/requested → review → clarification if necessary →
approved / approved with alternative / unable to approve → resident informed → follow-up if
needed.** No diagnosis or medical narrative is ever required by default.

Recommended canonical shape (mirrors the accepted 0143 pattern; no parallel case-management
system): one `accommodation_reviews` record — person_id, application_id, outcome CHECK in
(`approved`,`approved_with_alternative`,`unable_to_approve`), bounded `alternative_note`
(≤500, the alternative/explanation — never clinical content), reviewed_by, reviewed_at,
resident_informed_at, superseded_at — plus one audited staff RPC
(`record_accommodation_review`) and one readiness change: the `accommodation` item becomes
met when a non-superseded review exists (any outcome — the loop completing is the evidence;
"unable to approve" is a completed, recorded, communicated decision, not an unmet item),
`needs_staff_review` otherwise. Follow-ups reuse the existing `follow_ups` spine. The
request itself already lives in the application answers — nothing is re-entered.

**This is a narrow schema+RPC need (one table, one RPC, one readiness block), reported per
the gate's instruction and NOT implemented** — it is implementation, not
documentation/readiness. Until it lands, the honest current behavior stands: an
accommodation raised in the application is reviewed in conversation and, if unresolved at
move-in, deferred through the audited override with its follow-up.

## 6. Resident burden — reconfirmed, challenged

| Document | Action | Affirmative-evidence justification |
|---|---|---|
| Participant & Residency Agreement | **1 signature** | The one contract (residency, fees, conduct, exit) — signature is the evidence of agreement |
| Resident Handbook | acknowledgment | Receipt of curfew/quiet-hours/safety/house-life terms is operationally material |
| Rights & Grievance | acknowledgment | Receipt of rights + the grievance path is a rights protection in itself |
| Screening Policy | acknowledgment **+ separate canonical screening consent** | The ack evidences receipt of the rules; the revocable grant is the authorization — different facts, both needed, neither duplicates the other |
| Medication & MOUD Policy | acknowledgment | Receipt of the self-possession rules + MOUD protections |
| Return-to-Use Response Policy | acknowledgment | Receipt of the house's commitment — knowing the sequence exists is protective |

Challenged and kept as-is: no document requires a signature that an acknowledgment would
evidence equally well, and nothing requires affirmative evidence that presentation would
serve — each of the five acks records a fact (receipt) that later matters. Total: **1 typed
name + 5 taps + 1 consent tap.**

## 7. E-sign legal review packet (Participant Agreement)

> **SUPERSEDED (2026-08-24 Legal-Review Reconciliation entry).** The review returned
> APPROVED WITH ATTACHED REVISIONS and every revision was incorporated (§13 full
> disclosure, live e-consent gate, signing-intent control, paper parity, notice
> safeguard). The packet below is preserved as the record of what was submitted; of its
> questions, Q4's retention period remains the one open item.

**The packet** (everything a qualified reviewer needs, nothing more):

1. *Intended agreement:* `docs/residences/ejwrh/participant-residency-agreement.md`
   (B5B-reconciled text; §13 carries the placeholder for the e-consent clause).
2. *Contracting parties:* resident + the residence operator ([PENDING] legal name — executed
   PSA required); GFA is a named contracted-services provider, not the housing counterparty.
3. *Signer authentication:* Supabase Auth account (email + password, confirmed email);
   signature accepted only from the authenticated assignee (`acknowledge_document` refuses
   any other caller — live-verified).
4. *Affirmative electronic consent:* to be drafted per review — §13 placeholder; the flow
   can present a dedicated consent-to-transact-electronically step before signing if
   required.
5. *Exact pinned version:* signatures bind to a `document_versions` row whose body is
   immutable once published (trigger-enforced, live-verified).
6. *Content hash:* trigger-computed sha256 of the exact body, NOT NULL, pinned into the
   audit event.
7. *Signer identity:* person id + typed `signature_name`, stored on the immutable assignment.
8. *Signed timestamp:* `signed_at` (+ `acknowledged_at`), server clock.
9. *Immutable audit:* `document_signed` audit event carrying version id + content hash;
   assignment rows immutable at owner level once acknowledged (live-verified).
10. *Retention/access of a signed copy:* the resident can view the signed document (their
    pinned version) in-app at any time; staff can print it on request (stated in the
    Agreement §13).
11. *Paper / wet-sign option:* stated in-app and in the Agreement; staff-witnessed paper
    signing remains available at all times.
12. *Withdrawal from the electronic process:* the resident may decline e-sign and use paper
    at any point before signing; consent-to-electronic-transaction language (item 4) should
    state the withdrawal right explicitly per UETA/ESIGN practice.

**The only legal questions asked** (no determinations made here):

- Q1. Is the typed-name e-signature flow above sufficient under Iowa Code ch. 554D (UETA)
  and ESIGN for a residency program agreement of this kind, and what exact
  consent-to-transact-electronically and withdrawal wording must §13 carry?
- Q2. Does an Iowa recovery-residence program agreement carry any writing, disclosure, or
  copy-delivery formality beyond UETA/ESIGN (including any landlord–tenant or innkeeper
  characterization risk for program housing) that changes the required text or process?
- Q3. Must the operator entity (vs GFA) be the named counterparty given the executed PSA,
  and is the ratified role split in Agreement §1 stated correctly for that instrument?
- Q4. What retention period and access obligations apply to the signed artifact, and does
  the current model (immutable in-app copy + paper on request) satisfy them?

## 8. Prepared activation migration

> **SUPERSEDED (2026-08-31 Activation Entry).** 0146 was finalized by the generator
> script, moved into the migrations ledger, and APPLIED to CQCX with the in-migration
> hash gate passing; the prepared placeholder file no longer exists. Description below is
> historical.

`supabase/launch/prepared/0146_ejwrh_document_activation.prepared.sql` — **prepared only,
outside the migrations ledger so routine tooling cannot apply it.** Contains: the six
template keys with signature/ack classification and residence-2 scope; version `1.0` with
the effective date set at ratification; the six pinned sha256 content hashes (recomputed
automatically-aborting verification — the seeded text is provably the ratified text);
body inlining deferred to a generator script at finalization (never hand-transcribed);
rollback that unpublishes only unsigned versions and deactivates templates while preserving
every signed artifact. The number 0146 is reserved by this file; renumber against the live
ledger at apply time if anything lands first.

## 9. B5B E2E readiness

> **PARTIALLY SUPERSEDED (2026-08-31).** The full chain below ran GREEN as a synthetic
> SQL-level E2E against live CQCX in a rolled-back transaction at activation (see the
> Activation Entry). The Playwright browser spec itself remains double-gated and has not
> been executed — that distinction stands.

`apps/platform/e2e/live/06-b5b-intake-activation.spec.ts` re-verified against the required
chain: conditional acceptance (queue → contacted → account offered) → account/person
resolution (0144 lookup by stated email + "This is them") → canonical application (convert)
→ approval → assignments (Getting settled) → five acknowledgments (loop) → exact Agreement
signature (typed name) → screening consent (participant one-tap) → emergency contact (staff)
→ medication reconciliation (one-tap none) → readiness complete → deliberate admission
("Move … in") → residency (roster) → immutable signature evidence (signed state in-app +
runbook post-run SQL for version/hash/audit). Double-gated (`RECOVERYOS_E2E_LIVE=1` +
`RECOVERYOS_E2E_B5B=1`) — **not executed while activation remains closed.**

## 10. Exact remaining blockers (reclassified 2026-08-25 — nothing else is open)

> **SUPERSEDED (2026-08-31 Activation Entry).** Items 1 (executed-PSA evidence) was
> cleared for activation by the executive attestation of execution (paper-copy archival
> remains as evidence filing); item 2 (retention period) was reclassified as an open
> records-policy item that no longer blocks anything (artifacts preserved immutably and
> indefinitely meanwhile); items 8–9 were performed (§5 wording applied and ratified in
> the participant-facing approval; 0146 finalized and applied). Still open from this
> list: item 10 (optional named contact) and item 11 (accommodation loop, future gate).
> The classification below is the 2026-08-25 state, kept as history.

Classification key: **[R]** resolved · **[OA/FE]** operationally authorized, formal
evidence still required · **[C]** counsel/policy determination still required ·
**[AB]** genuinely activation-blocking.

1. **[OA/FE] Executed PSA + entity authority.** Curtis White's leadership-confirmed
   approval (entry above) operationally authorizes the intake/onboarding work, but the
   formal evidence — a PSA v4.1 signed and dated by Curtis White (Sole Member) and Thomas
   DeGarmeaux (Executive Director) — is still required to clear the Agreement §1
   `[PENDING — EXECUTED-AUTHORITY VERIFICATION]` counterparty block. Gates Agreement
   activation only; does not gate non-signature intake use.
2. **[C] Verified record-retention period** (Legal-Review entry item 7) — counsel/policy
   determination; not invented. Gates Agreement activation only.
3. ~~E-sign legal review~~ — **[R] RESOLVED: APPROVED WITH ATTACHED REVISIONS
   (2026-08-24)**; all attached revisions incorporated.
4. ~~Late-charge cap~~ — **[R] RESOLVED by executive ratification 2026-08-24.**
5. ~~Compensation model~~ — **[R] RESOLVED 2026-08-25** (service-volume FMV schedule
   retained; reconciliation record §3).
6. ~~Three-agreement condition precedent~~ — **[R] RESOLVED 2026-08-25** (not restored;
   reconciliation record §5).
7. ~~GFA signing authority~~ — **[R] CORRECTED 2026-08-25** (Thomas DeGarmeaux; Dave Stout
   removed; reconciliation record §6).
8. **[AB] Agreement §5 fee-wording change + re-ratification** (reconciliation record §7
   item 1: individualized-reduction rule replacing "no grandfathered rates") — an executive
   act awaiting authorization; changes the Agreement hash, so it precedes seed finalization.
9. **[AB] Activation seed finalization + apply** — body-generator script + recomputed
   hashes + effective date, then ledger entry + apply + preflight + gated B5B E2E; remains
   **closed by standing prohibition** until expressly authorized.
10. **Grievance appeal named contact** → optional; the role-based rule is complete without it.
11. **Accommodation evidence loop** → narrow implementation (one table + one RPC + one
    readiness block), authorized at a future gate; interim behavior is honest.

**Onboarding vs. activation (the distinction that now matters):** permission to onboard
EJWRH residents through RecoveryOS is **operationally authorized** (Curtis White,
leadership-confirmed) and the non-signature intake machinery is live — conditional
acceptance, account offer, person resolution, conversion, approval, screening consent,
emergency contact, medication reconciliation, and supervision coordination may all be used
for EJWRH residents today. Permission to activate the **Participant & Residency Agreement
as an electronic contract** (and the five ratified acknowledgments) is a separate,
still-closed act gated by items 1, 2, 8, and 9. Until that activation, the final
`admit_applicant` step for EJWRH refuses on the deliberate non-overridable
`pending_document_edition` readiness item — so intake can be worked to
"everything-but-move-in," and recorded admission completes once the edition activates.

Items 1–2 gate the Agreement only. The five acknowledgment documents are
**EXECUTIVE-RATIFIED** (entry above) and now await only the activation act itself
(items 8–9, per the activation gate).
