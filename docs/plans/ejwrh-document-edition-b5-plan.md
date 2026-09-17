# EJWRH Document Edition & B5 Readiness — Authority Matrix, Editions, UX, and Implementation Plan

**Status: PREPARED — NO SIGNING ACTIVATION (executive gate 2026-08-24).** B1–B4 (`16d430d`)
accepted and unchanged except the authorized medication-readiness correction (0143, applied
live). Nothing in this record activates resident signing, B6, external disclosure, or
Cloudflare. The EJWRH editions live in `docs/residences/ejwrh/` as authoring copies only —
they are seeded into `document_templates`/`document_versions` at the signing-activation
gate, not before.

**Governing standard (executive):** make the residence experience simpler for the resident
and simpler for the people walking beside him — and let the evidence emerge from those real
actions. Every choice below is minimization-first; the machinery exists, so the danger is
overbuilding.

---

## 1. Medication-readiness correction (RESOLVED — 0143 applied live)

"Reviewed — no current medications" is now a normal satisfied intake state, not an override.

| State | Derivation | Readiness status | met |
|---|---|---|---|
| Not reviewed | no active items, no standing review | `unconfirmed` (overridable deferral) | false |
| Reviewed, none | `medication_status_reviews` row, not superseded | `reviewed_none` | **true** |
| Reviewed, medications recorded | active `residency_medication_items` | `met` | **true** |

Mechanics: `confirm_no_current_medications(person_id)` is the one-tap, audited staff action
(`medication_status_reviewed` audit event). It refuses when active items exist (the states
are exclusive) and is idempotent. Recording a real item **automatically supersedes** a
standing none-review, so the record never lies. No fabricated medication row exists anywhere.
Verified live through the full cycle: unconfirmed → confirmed → reviewed_none → item recorded
(supersede) → met → confirm refused (`medication_items_exist`) → item ended → unconfirmed.

## 2. Document-authority matrix

Classification of every candidate resident-facing document, starting from the program model
(`docs/architecture/ejwrh-program-model-v1.0.md`). **Authority is never inferred from an old
document's completeness** — the retired four-level material is not a source.

| Candidate document | Authority class | EJWRH disposition |
|---|---|---|
| Participant / Residency Agreement | **EJWRH-SPECIFIC** (operator authority for residency/financial terms) | New edition authored (`ejwrh_participant_agreement`) — the ONLY signature |
| Resident Handbook | **EJWRH-SPECIFIC** | New edition authored; absorbs curfew/pass, emergency overview, exit overview, good-neighbor, day-to-day conduct |
| Resident Rights & Grievance | **GFA ORGANIZATION-WIDE in principle; current live text is Grace-House-branded** | New EJWRH edition authored (rights + grievance combined, one ack). Follow-up: a de-branded org-wide edition could later replace both houses' copies — executive choice, not assumed |
| Screening Policy (+ consent) | **EJWRH-SPECIFIC** (methods are operator's), doctrine org-wide | New edition authored; ack + canonical `residence_screening` consent grant (enforcement reads the grant) |
| Medication & MAT/MOUD Policy | **EJWRH-SPECIFIC** (storage procedure operator's), MOUD nondiscrimination org-wide doctrine | New edition authored; ack only |
| Return-to-Use Response Policy | **EJWRH-SPECIFIC**, sequence locked org-wide by program model §3 | New edition authored; ack only |
| Fee Schedule & Financial Agreement | **PENDING AUTHORITY** (operator sets amounts) | Not a separate signature: financial terms are §5 of the Participant Agreement, amounts pending operator input |
| Code of Conduct | **GRACE HOUSE ONLY as a separate signed doc** | Core commitments folded into Agreement §9 + Handbook §4 — no separate EJWRH document |
| Curfew & Pass Policy | **GRACE HOUSE ONLY as a separate ack** | Folded into Handbook §1/§3 (curfews are the phase table) |
| Emergency Response Protocols | **GRACE HOUSE ONLY as a separate ack** | Folded into Handbook §6 (911/988/warm line, naloxone, evacuation) + intake-week walkthrough |
| Exit & Transition Policy | **GRACE HOUSE ONLY as a separate ack** | Folded into Handbook §9 + Agreement §11 |
| Good Neighbor Policy | **GRACE HOUSE ONLY as a signed doc** | Folded into Handbook §4 (neighbor commitments) |
| Intake Forms Package | **RETIRED / SUPERSEDED for EJWRH** | The RecoveryOS intake flow *is* the intake; a paper "forms package" fails the burden test |
| Application / Pre-screening Form | **RETIRED for EJWRH residents** | The canonical residence-intake boundary (Gate A) is the application |
| Complete Operational System, Code of Ethics, Change Course Leaders, Incident Report System, NARR II Self-Assessment | **STAFF-ONLY / ORG-WIDE** | Never resident-assigned; unchanged |

Live-state note: 0139 already scoped all 14 Grace House resident-facing templates to
residence 1, so nothing here is assignable at EJWRH today; EJWRH readiness correctly shows
the single non-overridable `pending_document_edition` item until activation.

## 3. The minimized EJWRH signing set

Grace House currently carries **8 signatures + 5 acknowledgments**. The EJWRH edition set is
**1 signature + 5 acknowledgments**:

| # | Document | Action | Why not more |
|---|---|---|---|
| 1 | Participant & Residency Agreement | **SIGNATURE** | The one real contract: residency, fees, screening participation, conduct commitments, exit. Everything contractual lives here once |
| 2 | Resident Handbook | acknowledgment | Orientation, not contract — receipt matters (curfews, safety, house life), agreement terms don't repeat here |
| 3 | Resident Rights & Grievance Process | acknowledgment | Rights are declared, not bargained; receipt is the evidence that matters |
| 4 | Screening Policy | acknowledgment (+ `residence_screening` consent grant) | Authorization is the revocable GRANT (ratified §7); a signature on the policy adds nothing the grant doesn't already prove |
| 5 | Medication & MOUD Policy | acknowledgment | Policy explains handling; the participant's own med review is the operational record |
| 6 | Return-to-Use Response Policy | acknowledgment | The house's commitment to the resident more than the reverse; receipt is the point |

Presentation-only (no recorded action): none at launch — anything worth presenting at EJWRH
intake earned a place in the handbook. Conditional assignment: none at launch — supervision
coordination and accommodations are readiness items backed by consent grants and structured
records, not documents.

Resident intake burden: **read + 1 typed-name signature + 5 one-tap acknowledgments + 1
screening consent**, all completable on a phone during intake conversation, with paper
always available.

## 4. Evidence chain (confirmed against live B1 machinery)

Every signature/acknowledgment at activation will preserve, with no new machinery:

`document_templates` row (identity, key) → `document_versions` row (exact markdown body,
version label, `published_at`, **`content_hash`** = trigger-computed sha256 of the body,
immutable once published) → `document_assignments` row (person, pinned version id,
application/residency anchor) → `acknowledge_document` RPC (assignee-only) → `signed_at` +
`signature_name` (signature docs) or `acknowledged_at` (ack docs) → assignment row becomes
immutable (trigger blocks UPDATE/DELETE even at owner level — probed live) → `audit_log`
event (`document_signed`/`document_acknowledged`) carrying the version id + content hash.

Historical terms are therefore reproducible forever from the pinned version + hash — never
reconstructed from the latest edition. All of this is live and E2E-verified since B1; the
EJWRH editions simply flow into it at activation.

## 5. B5 staff intake experience (design)

One place: an **Intake Checklist** panel on the existing staff application view (per
applicant, powered by `application_intake_readiness`). Language is operational, never
database semantics:

- `sign:*` missing → "Needs to sign: Participant Agreement" · met → "Signed Mar 3, 2:14 PM"
- `ack:*` → "Has read: Handbook ✓"
- `screening_consent` → "Screening consent: current / not yet recorded / revoked"
- `emergency_contact` → "Emergency contact: on file / needed" + inline add (name, phone,
  relationship — three fields, done)
- `medication_items` → three-state chip: "Medication review: not done yet / **no current
  medications ✓** / 2 medications recorded ✓" with two actions side by side: **"No current
  medications"** (one tap) and **"Add medication"** (name + storage + 2 checkboxes)
- `accommodation` → "Accommodation request: review with applicant" + "Reviewed" action
- `supervision` → "Officer coordination: consent + contact needed / on file ✓" (only shown
  when it applies; records the grant then the contact in one flow)
- `pending_document_edition` → "This house's documents aren't ready to sign yet — admission
  is blocked until the EJWRH document set is activated" (staff see why, plainly)
- Admit button: enabled when complete; when only deferrable items remain it offers
  "Admit with follow-up…" (reason field, shows exactly what is being deferred, creates the
  follow-up automatically); non-overridable unmet → button explains what must happen first.

Staff never see the words "unconfirmed", "conditionally_required", or a JSON envelope.

## 6. B5 participant intake experience (design)

The existing resident Documents area (`/residence/documents`, already live for Grace House)
extends to intake stage — assignments already anchor to an approved application (B1). A
short **"Getting settled"** card answers the four questions:

- **What remains:** "2 of 6 documents left" + the checklist in plain words.
- **Why:** one sentence per item ("This is the one agreement you sign to live here";
  "This just confirms you received the handbook").
- **Whether it applies:** items that don't apply never render (conditional items are
  staff-side; the participant only ever sees their documents and consents).
- **Who can help:** "Any staff member can sit with you through these — and paper copies are
  always available" with the house phone number.

No re-entry: everything pre-filled from the application; no narrative fields anywhere in the
participant flow; signature = typed name once.

## 7. Signing-method review gate (what remains open — stated carefully)

What is known (research-level, **Evidence class E — requires qualified verification, not a
legal conclusion**): Iowa has adopted the Uniform Electronic Transactions Act (Iowa Code
ch. 554D) and federal ESIGN applies; together they generally give electronic signatures the
same legal effect as ink for transactions where parties agree to conduct business
electronically, with exceptions not obviously implicated here. RecoveryOS's evidence chain
(§4) is designed to exceed typical e-sign recordkeeping (immutable hash-pinned terms,
signer identity, timestamps, audit).

Determination that remains before activation:

| Instrument | Risk posture | Recommendation |
|---|---|---|
| Acknowledgments (handbook, rights, policies) | Receipt evidence, not contract formation | Can ship without professional review once the ED ratifies content — an acknowledgment claim would rest on receipt, which the chain proves |
| Screening consent (grant + policy ack) | Consent evidence; revocable by design | Same posture as acknowledgments; the grant model is stronger evidence than a paper signature line |
| **Participant & Residency Agreement** | A real contract with financial terms and residency consequences | **Warrants counsel/qualified review before e-sign activation**: confirm UETA/ESIGN consent-to-transact-electronically wording, record-delivery obligation (resident copy), any landlord–tenant/innkeeper characterization questions for program housing in Iowa, and whether a wet-ink option must be offered |

Open questions for that review (not answered here): exact e-consent clause wording for §13;
whether Iowa program-housing agreements carry any writing/delivery formality beyond
UETA/ESIGN; retention period for signed artifacts; whether the operator entity (vs GFA) must
be the named contracting party — which also depends on the executed PSA (still an open
confirmation item).

## 8. B5 implementation plan

**Surfaces** (all against live machinery; no new pages beyond these):
1. Staff: Intake Checklist panel on the existing application detail/queue view (§5), plus
   the convert action on IntakeQueuePage (wired to `convert_application_intake` with the
   confirm-warning dialog).
2. Participant: intake-stage Documents flow (§6) — the existing DocumentsPage/
   DocumentDetailPage already work off assignments + `acknowledge_document`; add the
   "Getting settled" progress card and ack-only rendering (one-tap acknowledge, no name
   field for ack-only docs).

**RPCs reused (no new RPCs needed for B5):** `convert_application_intake`,
`application_intake_readiness`, `ensure_my_document_assignments`, `acknowledge_document`,
`record_consent_grant`/`revoke_consent_grant`, `record_emergency_contact`,
`record_medication_item`/`end_medication_item`, `confirm_no_current_medications`,
`record_supervision_coordination`, `review_residence_application_intake`,
`review_residence_application`, `admit_applicant`.

**Minimum new schema:** none for B5 UX. The only future migration is the **activation
seed** (EJWRH templates + versions + `requires_signature`/`requires_acknowledgment` flags,
scoped `residence_id = 2`) — written only at the signing-activation gate. The accommodation
"Reviewed" action reuses the answers field or a review record — decided at B5 build with
the same pattern as 0143 if a record is needed.

**RLS:** unchanged — every surface reads through existing policies; writes stay RPC-only.

**Assignment logic:** unchanged (`ensure_my_document_assignments` is residence-scope aware
and application-anchored since 0139); EJWRH assignment begins working the moment the
activation seed publishes the editions — no code change.

**Conditional assignment:** none at launch (§3); the mechanism (template `residence_id` +
readiness conditionals) already exists if a conditional document is ever ratified.

**Tests:** unit tests for checklist rendering states (all six item states incl.
`reviewed_none` and `pending_document_edition`); wrapper tests for
`confirmNoCurrentMedications`; synthetic live E2E re-run of the fixture chain after UI wiring;
cross-role RLS negatives re-run.

**Rollback:** UI-only changes revert by commit; 0143 rollback documented in its header;
activation seed (future) rolls back by unpublishing versions (never deleting) +
`is_active=false`.

**Browser E2E plan:** Playwright (pre-installed) against a staging session — staff converts
a fixture intake → approves → checklist shows states → participant signs/acks on the
document pages → staff records consent/contact/med-review → admit; assert the audit trail
and that EJWRH shows the pending-edition block until the seed exists.

**Signing activation gate (all required before any resident signs):**
1. Executive ratification of the six edition texts (incl. all `[PENDING — OPERATOR]` blanks
   filled: fees, quiet hours, naloxone location, screening methods, grievance windows,
   storage procedure).
2. Signing-method review outcome (§7) — at minimum for the Participant Agreement.
3. Executed-PSA confirmation where the agreement names the contracting party.
4. Activation seed migration (templates/versions at residence 2) + preflight + live verify.
5. B5 UI shipped and E2E-verified.

**Cloudflare activation prerequisites (unchanged from Gate A, restated):** executive
authorization; EJWRH application page already deployed as Edge Function v2 (contained);
worker prepared not activated; public traffic only after the ED opens the gate — nothing in
B5 requires it.

## 9. Unresolved conflicts and open items

1. `[PENDING — OPERATOR]` content blanks in the editions (fees, quiet hours, naloxone
   location, screening methods, grievance response window and appeal contact, medication
   storage procedure).
2. Executed PSA version — controls the contracting-party naming in the agreement and any
   future role/permission encoding. STOP posture maintained.
3. Signing-method review (§7) for the Participant Agreement.
4. Whether to later de-brand resident rights into one org-wide edition (executive choice).
5. Accommodation "reviewed" evidence record — pattern decision at B5 build (0143-style
   record vs. staff note), flagged so it is not invented ad hoc.

None of these block B5 UI construction; items 1–3 block signing activation only.
