# RUNBOOK — apply / verify / roll back 0152 (Grace House document integrity)

**Audience:** Operator + Data Administrator (DA). **State:** PREPARED. **This runbook is not itself an apply authorization.** Do not execute any step below until a separate, explicit executive apply authorization for 0152 is in hand, and only after live 0150 and 0151 are applied.

> Standing constraints: no CQCX mutation without authorization; retired **YKY never accessed**; placeholders and acknowledgments are immutable evidence; no resident re-acknowledgment until counsel answers (DOC-INTEGRITY-001).

## 0. Preconditions (all must be TRUE before apply)

1. Target project is CQCX `cqcxvwoukyhxyokfwnjm` (`recoveryos` schema) — confirm the project ref before every action.
2. Live migration ledger tail includes **0150** and **0151** (Path 1 applied). 0152 is next; **no duplicate or skipped NNNN**.
3. Static verifier passes offline:
   ```
   node scripts/verify-0152-docintegrity-prepared.mjs      # expect: PASS, exit 0
   ```
4. Re-confirm the four **live placeholder** hashes still equal the precheck baselines (read-only):
   - `emergency_response_protocols` v1.0 = `bd3010c4…5576a34`
   - `curfew_pass_policy` v2.0 = `142fc1e5…e417bfe`
   - `exit_transition_policy` v2.0 = `8e7c46d1…bb88f328`
   - `grievance_policy_form` v1.0 = `a56c94ce…43cb0666`
   If any differs → **STOP**; the migration would self-abort anyway. Do not force.
5. DA confirms **no intake-flow dependency** on `form_application_prescreening` / `intake_forms_package` before APPLY 3 (these are withdrawn from the resident acknowledgment surface, not deleted).

**STOP conditions:** target is not CQCX; tail lacks 0150/0151; verifier fails; any live placeholder hash differs; DA has not cleared the intake withdrawal. Stop and report — do not improvise.

## 1. Apply

Promote the prepared file into the launch lineage as `0152` and apply it through the **same migration mechanism used for 0147–0151** (`apply_migration`, name `recoveryos_0152_grace_house_document_integrity`). Do **not** run raw ad-hoc SQL, and do **not** apply `documents_seed.sql`.

The migration is self-guarding: PRECHECKS abort on any baseline mismatch; APPLY 1 inserts the 4 editions (`on conflict do nothing`); APPLY 2/3 withdraw the 7 templates; POSTCHECKS assert new hashes, untouched placeholders, correct latest-published edition, and withdrawn-count = 7. A failed precheck/postcheck raises and rolls the transaction back with no partial state.

Expected notices: `D0152 prechecks passed.` … `D0152 OK: 4 superseding editions published; placeholders preserved; 7 templates withdrawn.`

## 2. Verify (post-apply, read-only)

1. Each corrected template's **latest published** edition is the new full version (emergency 1.1, curfew 2.1, exit 2.1, grievance 1.1) and its `content_hash` equals the pinned full hash.
2. Each **placeholder** version row still exists with its original hash (unchanged).
3. Exactly **7** templates now have `is_active=false` (the 5 staff/governance + 2 intake keys).
4. **No** `document_assignments` row was created, altered, or acknowledged by this migration (the 4 docs are `requires_signature=false`; `ensure_my_document_assignments` assigns signature docs only).
5. **Do not** initiate resident re-acknowledgment. That is counsel-gated.

## 3. Roll back (only to undo a 0152 apply, under the same authorization)

Run `0152_grace_house_document_integrity.rollback.sql`.

- It **ABORTS** if any `document_assignments` row references a new edition (assigned or acknowledged) — an acknowledgment against the full edition is evidence; escalate to a human, do not delete.
- Otherwise it deletes the 4 new editions **while unassigned**, re-activates the 7 withdrawn templates, and postchecks that placeholders (count = 4) are preserved unchanged and 7 templates are active again.
- It never updates or deletes a placeholder version or an acknowledgment.

## 4. After apply — follow-ups (separate authorizations, not part of this runbook)

- Counsel answers on placeholder-vs-complete acknowledgment → design any re-acknowledgment notice/flow.
- `resident_rights` source reconstruction + verified source→live hash chain before any republication (evidence file only for now).
- Regenerate `documents_seed.sql` / build so the repo generator reflects the superseding editions (tech-debt: the seed's `on conflict do nothing` is why the placeholders were never overwritten in the first place).
