# D28 — Emergency Response Protocols ED-name correction (PREPARED)

- **Authorization:** CONTROL TOWER DECISION **D28-A** (Option A, superseding v1.1), preparation only. Ratifies NAME-001 (2026-09-21): GFA **Founder & Executive Director = Thomas DeGarmeaux**.
- **State:** PREPARED — nothing applied, deployed, merged, or distributed. Branch `fix/emergency-response-ed-name-2026-09-21` off `origin/main` @ `06af1c0a6f3ea40b65ec3d1bee401b634fac671e`.

## Change
"Thomas Miller" (erroneous ED name) → "Founder & Executive Director: Thomas DeGarmeaux". Dave Stout (GFA President) and all other identities unchanged. Emergency procedures/numbers unchanged. Version 1.0 → **1.1**; footer "Revised: September 21, 2026".

## Generation chain used (Option A)
1. Corrected the canonical Word source `docs/source-documents/grace-house/GraceHouse_Emergency_Response_Protocols.docx` (formatting preserved; XSD validation PASSED; paragraph count unchanged 273→273). The obsolete bulk importer `scripts/import-grace-house-docs.py` was **not** run (see tech-debt note).
2. Applied the identical edit to the synchronized source `packages/residence-content/src/documents/emergencyResponseProtocols.ts` and bumped `version 1.0 → 1.1`.
3. Ran the supported generator: **`pnpm generate:residence-docs`** → regenerated `docs/residence-documents/emergency_response_protocols.md`, `docs/residence-documents/README.md` (version index line), and `supabase/seed/documents_seed.sql` (emergency block only). No unrelated document changed.

## Content hashes (DB computes content_hash = sha256 of body_markdown; 0139 trigger)
- v1.0 body_markdown sha256: `3888522c3907752e7dd062abea80c87ba455a096e6cc7c2a09ca9f2b86bf4411`
- v1.1 body_markdown sha256: `192952fedf022700f4a1a17a64498c3b8744815d5585c4219f988f95f67bf7f6`

## Proposed live propagation sequence (NOT executed — requires separate apply authorization)
1. Back up / snapshot per policy.
2. Apply `docs/corrections/2026-09-21-emergency-response-ed-name/0152_emergency_response_ed_name_supersede.prepared.sql` to CQCX. Its prechecks STOP unless live v1.0 hash == `3888522c3907752e7dd062abea80c87ba455a096e6cc7c2a09ca9f2b86bf4411` and v1.1 absent. It inserts v1.1 (DB computes content_hash); v1.0 untouched.
3. Postchecks confirm v1.1 hash == `192952fedf022700f4a1a17a64498c3b8744815d5585c4219f988f95f67bf7f6`, v1.0 unchanged, latest published == 1.1.
4. Residents/staff see corrected v1.1 (read-only doc; no re-signature). Distribute the prepared notice if desired.
- **Do NOT** use `documents_seed.sql` as the production apply mechanism (it is a dev seed; the dedicated migration is the mechanism).

> **Placement note:** the migration lives in this corrections folder, NOT in `supabase/launch/prepared/` (which is a hash-pinned Gate-A manifest lock for the 0147–0151 convergence chain only) and NOT in `supabase/launch/migrations/` (the auto-applied lineage). This keeps it prepared-not-applied and off every apply path. The `0152` number is reserved/non-colliding (applied ≤0146; reserved 0147–0151).

## Rollback
`docs/corrections/2026-09-21-emergency-response-ed-name/0152_emergency_response_ed_name_supersede.rollback.sql` — unpublishes/removes v1.1 only while it has no assignments (immutable-evidence guard); v1.0 restored as latest published. v1.0 never mutated.

## Acknowledgment / redistribution consequence
`emergency_response_protocols` is `requires_signature = false`; `ensure_my_document_assignments()` only auto-assigns signature docs, so **no resident re-signature is compelled**. Residents read the corrected latest edition. A prepared, non-distributed notice is included.

## Remaining authorization required (Thomas)
- Explicit **apply authorization** to run 0152 against CQCX (with backup).
- Approval to **distribute** the resident/staff notice.
- Separate decision on the importer tech-debt (see `importer-tech-debt.md`).
- This branch is **not** to be merged/deployed without authorization.
