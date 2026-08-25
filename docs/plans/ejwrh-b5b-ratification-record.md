# EJWRH B5B — Final Document Ratification & Activation Readiness Record

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
blocked** on two items: contracting-party naming (executed PSA) and the e-signature consent
clause (legal review).

---

**Status: FIVE EDITIONS EXECUTIVE-RATIFIED — ACTIVATION CLOSED
(2026-08-24).** B5A (`ee9b042`) accepted. This record incorporates the B5B
executive-ratified operating values into the six EJWRH editions, proves single-source
consistency, maps incorporated documents, designs the accommodation evidence loop, packages
the e-sign legal review, and pins the prepared (NOT applied) activation migration. No
document activation, no resident signatures, no B6, no Cloudflare, no external disclosure.

---

## 1. Operator-decision matrix (executive-ratified 2026-08-24 → where each value lives)

| Decision | Canonical home | Status |
|---|---|---|
| Shared room $175/wk · $650/mo advance | Agreement §5 (only place fees appear) | RATIFIED, drafted |
| Private room $200/wk · $750/mo advance | Agreement §5 | RATIFIED, drafted |
| Move-in fee $250 nonrefundable | Agreement §5 | RATIFIED, drafted |
| Live-Out $25/wk | Agreement §5 | RATIFIED, drafted |
| No grandfathered rates | Agreement §5 | RATIFIED, drafted |
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

**Not established.** The repository contains no executed EJWRH Professional Services
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

`supabase/launch/prepared/0145_ejwrh_document_activation.prepared.sql` — **prepared only,
outside the migrations ledger so routine tooling cannot apply it.** Contains: the six
template keys with signature/ack classification and residence-2 scope; version `1.0` with
the effective date set at ratification; the six pinned sha256 content hashes (recomputed
automatically-aborting verification — the seeded text is provably the ratified text);
body inlining deferred to a generator script at finalization (never hand-transcribed);
rollback that unpublishes only unsigned versions and deactivates templates while preserving
every signed artifact. The number 0145 is reserved by this file; renumber against the live
ledger at apply time if anything lands first.

## 9. B5B E2E readiness

`apps/platform/e2e/live/06-b5b-intake-activation.spec.ts` re-verified against the required
chain: conditional acceptance (queue → contacted → account offered) → account/person
resolution (0144 lookup by stated email + "This is them") → canonical application (convert)
→ approval → assignments (Getting settled) → five acknowledgments (loop) → exact Agreement
signature (typed name) → screening consent (participant one-tap) → emergency contact (staff)
→ medication reconciliation (one-tap none) → readiness complete → deliberate admission
("Move … in") → residency (roster) → immutable signature evidence (signed state in-app +
runbook post-run SQL for version/hash/audit). Double-gated (`RECOVERYOS_E2E_LIVE=1` +
`RECOVERYOS_E2E_B5B=1`) — **not executed while activation remains closed.**

## 10. Exact remaining blockers (nothing else is open)

1. **Executed PSA** → contracting-party naming in Agreement §1 (blocks Agreement activation).
2. **E-sign legal review** (§7 packet, Q1–Q4) → Agreement §13 wording (blocks Agreement
   e-sign activation; paper-first activation would still need Q2/Q3).
3. ~~Late-charge cap~~ — **RESOLVED by executive ratification 2026-08-24** ($5/day, max $50
   per delinquent payment period; drafted into Agreement §5).
4. **Grievance appeal named contact** → optional; the role-based rule is complete without it.
5. **Accommodation evidence loop** → narrow implementation (one table + one RPC + one
   readiness block), authorized at a future gate; interim behavior is honest.
6. **Activation seed finalization** → body-generator script + recomputed hashes + effective
   date, then ledger entry + apply + preflight + B5B E2E green.

Items 1–2 gate the Agreement only. The five acknowledgment documents are
**EXECUTIVE-RATIFIED** (entry above) and now await only the activation act itself
(seed finalization + apply + E2E, per the activation gate).
