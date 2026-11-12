# Applied-ledger reconciliation — 2026-11-11 (Prompt 3 Phase A, Increment 2)

**Source of truth for this record:** the live CQCX (`cqcxvwoukyhxyokfwnjm`) migration ledger,
read 2026-11-11 through authorized **read-only** access (94 entries). No SQL was executed and
no database state was changed by this reconciliation. Evidence classes per the ratified
Institutional Evidence Ledger.

**Objective (executive direction, 2026-11-11):** make the deployed system reproducible from
version-controlled source without changing the functioning production environment.

## 1. Ledger ↔ repository mapping (verified, Class B)

| Live ledger tail (version → name) | Repository artifact | Authorization record |
| --- | --- | --- |
| …`0000`–`0146` line (through 20260831001422) | `supabase/launch/migrations/0000…0146` | launch-era records; reconciled 2026-08-31 |
| early drift entries (`create_housing_applications_ejwrh`, `harden_set_updated_at_search_path`, `add_forms_and_signature_to_housing_applications`, `create_sites_bucket_ejwrh_deploy`, `close_ejwrh_deploy_window`) | `supabase/live-drift/cqcx/` captures | EJWRH drift record (2026-08) |
| `20260917145239` → `0147_classification_authorization_isolation` | `supabase/launch/prepared/0147_….prepared.sql` (hash-pinned) | 2026-09-16 P0 approval packet rev2; Convergence Gate A (ratified 2026-09-17); live-readback file alongside |
| `20260917163228` → `0148_view_and_function_exposure_hardening` | `supabase/launch/prepared/0148_….prepared.sql` | same |
| `20260917163627` → `0149_shared_intake_workflow` | `supabase/launch/prepared/0149_….prepared.sql` | same |
| `20261005071446/092358/093045` (circle ×2, accountless conversion) | `supabase/launch/migrations/20261005*.sql` (hash-pinned in chain guard) | 2026-10-05 decision records |
| `20261020010443` → `housing_follow_through_private_admin_collaboration` | **NOT in the integration tree** — exists only as `docs/proposals/housing-follow-through/activation.sql` on unmerged PR #42's branch (`release/housing-admin-live-2026-10-20`) | PR #41 records "approved and applied 2026-10-20" (Class D); record to be confirmed |
| `20261023223104` → `document_review_attestations` | `docs/proposals/document-review/20261023201920_document_review_attestations.sql` — byte-identical to PR #45's declared SHA-256 `9894caca…` (verified), now hash-pinned by the chain guard | **NOT LOCATED.** Per executive direction (2026-11-11) the apply authorization must be located or reviewed, not presumed. Pinned as *applied, pending authorization review* |

**Status lines inside the prepared 0147–0149 files** still read "PREPARED ONLY / NOT APPLIED."
Those artifacts are frozen byte-for-byte by executive-approved SHA-256 pins
(`scripts/verify-prepared-chain.mjs`), so the stale text cannot be edited without a new pin
approval. The chain guard's `APPLIED_PREPARED` record (added 2026-11-11) is the current
applied status; the in-file text is historical.

## 2. Confirmed NOT applied (Class B, same ledger read)

- `0150_intake_consent_evidence` — HELD (G11, 2026-09-15).
- `0151_strict_classification_semantics` — sequenced behind 0150.
- `0152` ED-name correction (`docs/corrections/2026-09-21-emergency-response-ed-name/`) —
  prepared, awaiting explicit apply authorization.

## 3. Anomalies and gaps carried forward

1. **`0123`** appears in `supabase/live-drift/cqcx/` marked APPLIED but has no row in the
   live `schema_migrations` ledger. **RESOLVED (C2-V, 2026-11-12): documented by design,
   not an anomaly** — the file's own header and
   `docs/migration/ejwrh-intake-drift-reconciliation.md` §7 record it as a TYPE D live
   configuration change (grants-only hardening on `public.housing_applications`), executed
   2026-08-14T09:29:28Z under explicit authorization via the authorized gate, deliberately
   outside the migration ledger. No further action needed.
2. **Housing follow-through SQL out of tree** (see mapping) — reconciling it was not in this
   increment's authorization. Proposed for the next authorization: merge or copy the exact
   applied `activation.sql` (hash-verified against PR #41's ACTIVATION.md record) into the
   canonical tree under the same pin mechanism.
3. **Replay parity:** `scripts/replay-launch-local.py` replays launch `0000`–`0146` + ALL
   prepared `0147`–`0151` + the `20261005*` files. The live database instead has 0147–0149
   (not 0150/0151) plus housing follow-through plus attestations. The replay is therefore a
   superset/subset hybrid, not live parity — adequate as a schema exercise, not as a
   disaster-recovery rehearsal. Achieving replay-equals-live requires the two out-of-tree
   artifacts above and a decision about replaying unapplied 0150/0151; proposed for the next
   authorization, untouched here.
4. **Attestation authorization** — deliberately left open per executive direction. The pin
   only prevents silent drift of the applied SQL's source while the record is sought.

## 4. What this increment changed (repository only)

- `scripts/verify-prepared-chain.mjs`: added the `APPLIED_PREPARED` applied-status record
  (0147–0149, ledger versions, apply date, authorization references) and the
  `APPLIED_PENDING_AUTHORIZATION_REVIEW` hash pin for the attestations artifact. No existing
  invariant was weakened; two new failure modes were added (unknown applied-status artifact;
  pending-review artifact missing or drifted).
- This record.

Nothing was applied, executed, moved, or deleted; the prepared artifacts and their pins are
untouched.
