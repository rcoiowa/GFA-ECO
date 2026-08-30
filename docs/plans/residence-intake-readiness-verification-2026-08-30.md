# Residence Application & Intake Readiness Verification (2026-08-30)

Executive request: confirm EJWRH is ready for applications and intake, and Grace House is
fully functional for applications and intakes. This is a **verification record** — every
claim below was checked live against the canonical backend (Supabase RecoveryOS-Launch,
`recoveryos` schema) on 2026-08-30. No schema, data, or activation change was made.

## Live verification performed

1. **Migration ledger tail:** `0145_electronic_records_consent` (as expected; prepared 0146
   remains outside the ledger, unapplied).
2. **Preflight `launch_contract_check.sql`: PASS** (all 10 steps — schema usage, table
   privileges incl. the RPC-only exceptions, anon scope, RLS enabled + actually blocking,
   lifecycle/append-only posture, access-governance guards, all Gate B client RPCs
   executable by `authenticated`, view invoker posture, internal-writer lockdown).
3. **Document library:** Grace House (residence 1) — 14 active templates, all published
   (8 signature + 5 acknowledgment + intake-forms package). EJWRH (residence 2) — zero
   templates (by design until edition activation).
4. **Readiness RPC live-run (staff identity, transaction rolled back):**
   - Grace House fixture application: all 13 document items render met; screening consent /
     emergency contact / medication / accommodation / supervision classes present and
     correctly stated (unmet values reflect fixture cleanup from earlier tests, not defects).
   - EJWRH fixture application: renders the designed set — non-overridable
     `signature_documents → pending_document_edition` plus screening consent, emergency
     contact, medication (three-state), accommodation/supervision (not_applicable for this
     fixture). Machinery fully functional.
5. **Application entry channels:**
   - In-app authenticated applications (`residence_applications`, self-scoped RLS) work for
     both residences.
   - Public pre-account channel: edge functions `ejwrh` (EJWRH application portal page) and
     `residence-intake` (canonical service-role intake receiver, both residences) are
     deployed and ACTIVE. The Cloudflare public route remains CLOSED per standing decision;
     the portal is reachable at its Supabase URL. (Direct HTTP probe from the verification
     container was blocked by that container's egress policy — deployment status comes from
     the platform API.)
   - Staff review → identity-gated conversion (`find_person_for_intake_conversion` →
     `convert_application_intake`) → approval → intake checklist → `admit_applicant` — all
     RPCs verified executable and unchanged since the Gate B E2E.
6. **Intake queue state:** only reviewed test fixtures (`test_fixture=true`, statuses
   closed/converted). No real applicants waiting.
7. **Public directory:** both residences have `is_public_directory=false` — deliberate
   (external disclosure remains closed); not a defect.

## Grace House signing packet (paper counterpart) — verified against canon

Leadership supplied the Grace House Resident Signing Packet (54 pages, 9 documents) and
approved proceeding. Verified against the live document library: every listed
version/publication date matches exactly (Participant Agreement v2.0 2026-07-30; Fee
Schedule v2.0; Screening v2.0; Medication & MAT/MOUD v2.0; Return-to-Use v2.0; Good
Neighbor v2.0; Code of Conduct v1.0 — all 2026-07-30; Resident Rights & Responsibilities
v2.0 2026-08-03; Resident Handbook v2.0 2026-07-30). All signature/date/initial fields are
blank (no fabricated execution). Archived at
`docs/residences/grace-house/grace-house-signing-packet-2026-08-30.pdf`. Paper completion
is recorded against the same document version via `record_paper_signature` (staff-witnessed,
identical content hash, `signature_method='paper'`).

## Status

**Grace House: FULLY FUNCTIONAL for applications and intakes.** Application entry (in-app +
staff/queue), review, conversion, the full six-class readiness checklist, electronic AND
paper signing of the 8 signature documents, 5 acknowledgments, and deliberate admission are
all live and verified.

**EJWRH: READY for applications and intake — through everything except recorded move-in.**
The application portal and receiver are live; conversion, approval, readiness work
(screening consent, emergency contact, medication reconciliation, supervision coordination)
all function today, per Curtis White's leadership-confirmed operational authorization
(2026-08-25 entry). The final `admit_applicant` act refuses on the deliberate
non-overridable `pending_document_edition` item until the EJWRH document edition activates.

**What opens EJWRH move-in (nothing else):**
1. Executed PSA v4.1 returned as evidence (or an explicit executive attestation of
   execution) — clears the Agreement §1 counterparty block.
2. A verified record-retention period (counsel/policy) — completes Agreement §13.
3. Agreement §5 individualized-reduction wording change + re-ratification (executive act;
   exact text already drafted in the PSA reconciliation record §7).
4. The authorized activation act itself: finalize prepared 0146 (inline bodies, recompute
   hashes, effective date), apply, preflight, gated B5B E2E.

Items 1–2 are the evidence blockers; items 3–4 are a single authorized activation gate once
1–2 are supplied. Per standing governance, none of these were performed on this
verification pass.
