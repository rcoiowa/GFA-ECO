# Grace House document-integrity correction — 0152 (PREPARED, not applied)

- **Prepared:** 2026-09-23 · **State:** PREPARED ONLY — **application is not authorized by this artifact**
- **Backend of record:** CQCX Supabase `cqcxvwoukyhxyokfwnjm`, `recoveryos` schema (retired YKY never accessed)
- **Sequence (Path 1, ratified 2026-09-23):** live `0150_intake_consent_evidence` → live `0151_strict_classification_semantics` → **`0152` (this correction)**. 0152 is promoted into `supabase/launch/migrations/` **only after** 0150 and 0151 are applied and under a **separate explicit apply authorization**.
- **Evidence class:** B (verified operational evidence) for the live-hash baselines captured read-only 2026-09-23; D/E where noted.

## Problem being corrected

CQCX holds short **placeholder** bodies (~420 chars each) for four **resident-facing, acknowledgment-only** documents. Each placeholder already carries **one resident acknowledgment against the placeholder**. Because `document_versions.body_markdown` is **immutable per `(template_id, version)`** and `content_hash` is DB-computed (`0139_document_evidence`), the correct remediation is to **supersede** each placeholder with a new full edition — never `UPDATE`/`DELETE` the stub. The active edition is the latest `published_at` (`ensure_my_document_assignments`), so the full edition becomes current while the placeholder and its acknowledgment are preserved as historical evidence. Precedent already exists in-schema (`resident_rights` v1.0 stub superseded by v2.0 full).

## What 0152 does (and does not do)

| # | Action | Rows affected | Reversible |
|---|---|---|---|
| APPLY 1 | Publish 4 **superseding full editions** (`on conflict do nothing`, `published_at=now()`) | inserts emergency **v1.1**, curfew **v2.1**, exit **v2.1**, grievance **v1.1** | yes (rollback removes them while unassigned) |
| APPLY 2 | Withdraw 5 **staff/governance/certification** templates from the resident-readable surface (`is_active=false`) | `complete_operational_system`, `code_of_ethics`, `incident_report_system`, `change_course_leaders_policy`, `narr_ii_self_assessment` | yes (rollback re-activates) |
| APPLY 3 | Withdraw 2 **intake-workflow** templates from the resident acknowledgment surface (`is_active=false`) — **DA confirms no intake-flow dependency before apply** | `form_application_prescreening`, `intake_forms_package` | yes (rollback re-activates) |

**0152 does NOT:** mutate or delete any placeholder version; alter any `document_assignments` row or `acknowledged_at`; assign or compel any re-acknowledgment; touch `resident_rights`; touch any non–Grace-House organization; run any classification backfill; deploy anything.

**Acknowledgment note (non-negotiable):** acknowledgment of a **placeholder** edition **does not** prove acknowledgment of the **complete** policy. Re-acknowledgment wording, notice, timing, and evidentiary treatment are **held for counsel** (DOC-INTEGRITY-001). This migration writes no assignment/acknowledgment row directly.

**Assignment-surface correction (verified read-only 2026-09-23):** the four docs are `requires_signature=false` but `requires_acknowledgment=true` (set in 0139). The current live `ensure_my_document_assignments()` (0139) assigns the latest published version of every active template where `requires_signature OR requires_acknowledgment` — not signature-only (that was the retired 0013 behavior). Therefore **APPLY 1 is not acknowledgment-neutral**: once the full editions are published, the next time a resident with an active residency (or approved application) opens the Documents area, that SECURITY DEFINER RPC creates a new assignment for the new full edition and **surfaces a re-acknowledgment through the ordinary resident path**. No signature is compelled, but re-acknowledgment is surfaced. For that reason **applying 0152 is itself counsel-gated** — publish only after counsel answers the re-acknowledgment questions.

## Hash matrix (body_markdown sha256)

| Document | Template key | Placeholder (live) | New full edition |
|---|---|---|---|
| Emergency Response Protocols | `emergency_response_protocols` | v1.0 `bd3010c4…5576a34` | **v1.1 `192952fe…f67bf7f6`** |
| Curfew & Pass Policy | `curfew_pass_policy` | v2.0 `142fc1e5…e417bfe` | **v2.1 `ee19a60d…5752758f`** |
| Exit & Transition Policy | `exit_transition_policy` | v2.0 `8e7c46d1…bb88f328` | **v2.1 `48f3d09c…c1b59f874`** |
| Grievance Policy & Form | `grievance_policy_form` | v1.0 `a56c94ce…43cb0666` | **v1.1 `a41046d4…e2d8e5757`** |

The prepared migration **prechecks** the live placeholder hashes and **self-aborts** if any differ; it **postchecks** that each new edition's DB-computed `content_hash` equals the pinned full hash, that placeholders are unchanged, that the latest published edition is the new one, and that exactly **7** templates were withdrawn.

The Emergency Response v1.1 full edition incorporates the ratified **NAME-001** correction (Founder & Executive Director **Thomas DeGarmeaux**; the erroneous "Thomas Miller" is not carried forward).

## Files in this correction

| File | sha256 |
|---|---|
| `0152_grace_house_document_integrity.prepared.sql` | `2b54e5b1275a9fb70dcff25e63c07046a5214eee2fb78df23ab0cbe5bc8404b3` |
| `0152_grace_house_document_integrity.rollback.sql` | `eb6252fe96e0c47052e27ff82c69aeda687eaacff1b1dc71c7b4cb963763f02f` |
| `../../../scripts/verify-0152-docintegrity-prepared.mjs` | static offline verifier (re-hash after any edit) |
| `RUNBOOK.md` | operator / Data-Administrator apply + rollback procedure |
| `resident-rights-source-reconstruction.md` | resident_rights evidence only — **no republication prepared** |
| `resident-staff-correction-notice.PREPARED.md` | consolidated notice — **PREPARED, NOT DISTRIBUTED** |

## Verification

```
node scripts/verify-0152-docintegrity-prepared.mjs   # static, offline; exit 0 = PASS
```

This verifier is intentionally **separate from** `scripts/verify-prepared-chain.mjs`; the 0147–0151 Gate-A manifest lock is **not modified**.

## Rollback

`0152_grace_house_document_integrity.rollback.sql` removes the 4 new editions **only while unassigned** (it **aborts** if any assignment/acknowledgment references a new edition — that acknowledgment is evidence and must be adjudicated by a human) and re-activates the 7 withdrawn templates. It never touches a placeholder or an acknowledgment.

## Relationship to PR #16

PR #16 remains a **draft, untouched**. Its provisional 0152 SQL used a **full-body precheck baseline (`3888522c…`) that does not match the live placeholder (`bd3010c4…`)** and is therefore **invalid/superseded** by this consolidated correction. A file-by-file KEEP/MOVE/REWRITE/RETIRE disposition accompanies the executive apply packet.
