# G4 consent matrix (2026-09-15) — CONSENT-001

**Controlling rule:** R1 decision **D3** (ratified 2026-09-15 with the
evidence-preservation condition): consent is purpose-specific, explicit,
versioned, server-evidenced at the trust boundary — and **historical evidence
is never fabricated**. "Consent flag exists" ≠ "we possess evidence of the
consent event."
**Sources:** the seeded `recoveryos.consent_types` vocabulary and
`consent_grants` shape (0146-lineage replay, matching the applied migrations),
the pre-account intake boundary (0122 + prepared 0150), and the durable
doctrine (required vs optional distinct; revocation changes behavior;
minimum sufficient documentation; no surveillance).
**Status:** matrix + verification requirements. G4 stays **INCOMPLETE** until
the E2E column is proven against the exact release candidate — this document
defines what must be proven, it does not certify it.

## 1. The two consent planes (never collapse them)

| Plane | Where consent lives | Evidence shape |
|---|---|---|
| **Pre-account intake** (person has no login) | Columns on the intake row itself: `residence_application_intake.consent_to_contact` (+ `consent_notice_version`/`consent_at` once 0150 applies); `referrals.consent_attested` | Boundary-stamped by the receiver (D3). Legacy rows: boolean only, evidence NULL/LEGACY-UNKNOWN forever unless authentic source evidence surfaces. |
| **Account-holder consent** (person exists) | `consent_grants` rows against the `consent_types` vocabulary: status, scope jsonb, method, `document_version`, `effective_at`, `expires_at`, `revoked_at`, creator attribution | Versioned, timestamped, attributable, append-oriented (revocation is `revoked_at`, not deletion). |

Conversion (0142/0144) moves a person across planes; it must never *imply*
account-holder consents from an intake boolean — each `consent_grants` row is
its own explicit act.

## 2. Account-holder consent matrix (seeded vocabulary, 0146 lineage)

| Key | Category | Required for service? | Gates (what the consent permits) | Revocation must change |
|---|---|---|---|---|
| `terms_of_use` | account_identity | **REQUIRED** | Holding an account at all | Account use pathway (human review; never silent data destruction) |
| `service_participation` | service_participation | **REQUIRED** | Participation in recovery-support services | Service workflows stop creating new engagement records for the person |
| `electronic_records` | account_identity | optional | E-records/e-signature flows (0145) | Document flows fall back to non-electronic handling |
| `coaching` | coaching | optional | Coaching relationship features | Coach surfaces/check-ins stop for the person |
| `resource_navigation` | resource_navigation | optional | Navigation features | Navigation workflows stop |
| `recovery_assessments` | recovery_assessments | optional | BARC-10 and other assessments (ICARE Authority governs BARC handling) | No new assessments offered/recorded |
| `communications` | communications | optional | Messages and reminders (delivery, not documentation) | Outbound reminders/messages stop (notification fan-out must consult it when external delivery activates) |
| `information_disclosure` | data_sharing | optional | Release of information to named parties (scope jsonb carries the who/what) | Future disclosures stop; scope changes take effect forward |
| `supervision_coordination` | data_sharing | optional | Reentry/supervision coordination sharing | Same as above, scoped |
| `residence_screening` | residence_operations | optional (residence-conditional) | Drug & alcohol screening within residence operations | Screening workflow stops; human residence process handles consequences (never an automated sanction) |
| `ai_features` | ai_features | optional | Grace AI features — the `grace` function checks `consent_grants` before engaging; Support Now and human pathways NEVER require it | Grace declines with the human-pathway alternative; no AI processing of the person's content |
| `analytics` | analytics | optional | De-identified program-improvement analytics | Person excluded from future de-identified sets (feasible-forward; document the boundary honestly) |

Matrix rules: **required ≠ optional** stays structural (`is_required_for_service`);
no workflow may treat an optional consent as implied; `scope` narrows, never
widens, a category; `document_version` pins what the person saw (the
account-holder analog of D3's `consent_notice_version`).

## 3. Evidence requirements (D3 generalized)

1. Every consent event records: what (type+version), who (person +
   `created_by_person_id` when staff-assisted), when (server time), how
   (`method`), and scope.
2. Evidence is stamped **at the trust boundary** (receiver/RPC), never
   client-supplied, never defaulted from the clock at migration time.
3. **Historical unknowns stay unknown:** pre-evidence rows (the three live
   intake rows; any legacy grant without `document_version`) are
   LEGACY-UNKNOWN — reported as such, never backfilled or inferred from
   `created_at`.
4. Revocation evidence = `revoked_at` (+ actor) on the same row; history is
   preserved, never deleted.

## 4. Revocation behavior (what "changes future access/behavior" means)

For each category: the gate re-evaluates on next use (no cached consent);
in-flight artifacts created under valid consent remain (append-only history)
but no NEW gated action occurs; participant-facing copy states this honestly.
Revocation never triggers punitive automation (human decisions stay human).

## 5. Retention and correction

Consent rows are retained as evidence for the life of the record they govern
(minimum sufficient documentation governs *content*, not the consent ledger
itself). Correction path: a superseding grant/revocation row, never an edit.
Retention/deletion/export policy beyond this is a ratified-policy gap —
tracked under G4, not invented here.

## 6. What G4 still requires before it can close (verification ledger)

| # | Proof required | Method |
|---|---|---|
| V1 | Required-consent gating: no service workflow proceeds without `terms_of_use` + `service_participation` | candidate-SHA E2E |
| V2 | Each optional gate consults its grant at time-of-use; revocation flips behavior without redeploy | E2E per category (ephemeral env) |
| V3 | `ai_features` revocation: Grace declines, Support Now/human paths unaffected | Grace scenario suite (GRACE-002) |
| V4 | Check-in flows blocked without their required consent | E2E |
| V5 | Intake boundary refuses `consent_to_contact !== true` and stamps evidence atomically | R1 receiver tests (post-0150 + hardened receiver) |
| V6 | Legacy rows report LEGACY-UNKNOWN in every staff surface (no invented timestamps in UI) | UI review at candidate |
| V7 | Notification/communications delivery consults `communications` before external sends activate | code + E2E when delivery activates |
| V8 | Wix/public forms collect no consent-gated data beyond the approved minimum | Wix inventory (G14) |

Row-level truth for V1–V7 requires the exact release candidate and an
isolated/ephemeral environment (never synthetic CQCX rows) — the same
discipline as every battery in this program.
