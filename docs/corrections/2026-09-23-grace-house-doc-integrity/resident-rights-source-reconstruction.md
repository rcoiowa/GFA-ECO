# resident_rights — source-reconstruction evidence (EVIDENCE ONLY — no republication prepared)

- **Prepared:** 2026-09-23 · **State:** evidence-gathering only. **No superseding edition, no republication, and no CQCX change is prepared for `resident_rights` in 0152.**
- **Why separate:** unlike the four docs corrected by 0152, `resident_rights` already has a **full v2.0** edition live (superseding a v1.0 draft stub). The task here is to establish a **verified source → live hash chain** *before* anything is republished. Until that chain is proven, `resident_rights` stays as-is.

## What is established (repository-side, verified 2026-09-23)

1. **`resident_rights` is seeded through the launch lineage, not the residence-content generator.**
   - Present in `supabase/launch/seed/0200_seed_core_reference.sql`: template registered (`'resident_rights', 'Resident Rights & Responsibilities', true, false`), **v1.0** (draft/demonstration body) and **v2.0** (full body, "Source: Grace House Complete Operational System v2 (canonical)").
   - The v2.0 insert uses `on conflict (template_id, version) do update set body_markdown = excluded…` — so v2.0 was intended to be authoritative, not a no-op stub.
   - `resident_rights` does **not** appear in the generated `supabase/seed/documents_seed.sql` (0 occurrences). It is outside the `packages/residence-content` generator's key set.

2. **The v2.0 body in the launch seed hashes to:**
   `7a1cd5ac3b483e265ae7ef1b93ef8759f13ee7d843d94bad4e21e0d42de3e5e0`
   (sha256 of `body_markdown` after SQL `''`→`'` unescaping; 5,355 chars; first line `GRACE HOUSE — RESIDENT RIGHTS & RESPONSIBILITIES`). This is the **candidate source-of-record** for the live v2.0 edition.

3. **`docs/residence-documents/resident_rights.md` is an ORPHAN generated artifact and must NOT be treated as the source.**
   - It carries the header "GENERATED from packages/residence-content — do not edit by hand," yet there is **no** `resident_rights`/`residentRights` module in `packages/residence-content/src/documents/` (the generating source has been removed).
   - Its sha256 is `7dbbd965ab2b53c2bbe62916ab0e808a32f60d3abb4b701665838ccea72b79c0` — **different** from the launch-seed v2.0 body (`7a1cd5ac…`). It is a stale, divergent copy. Do not republish from it.

## What is NOT yet established (requires read-only live verification, currently blocked)

- **Live content_hash of `resident_rights` v2.0 in CQCX.** The Supabase MCP is not authenticated in this session, so the launch-seed candidate (`7a1cd5ac…`) has **not** been compared to the live DB-computed `content_hash`. Until a read-only live read confirms `live v2.0 content_hash == 7a1cd5ac…`, the source→live chain is **UNPROVEN**.
- **Whether live v2.0 diverged from the seed** (e.g., a later manual edit). If live ≠ seed, neither the seed nor the orphan md is the source of record, and true reconstruction (locate the authoring source, re-derive, re-verify) is required before any republication.

## Reconstruction path (do, in order — none authorized here)

1. Under read-only authorization, capture live `resident_rights` template id, all version rows, `content_hash`, and `published_at` from CQCX.
2. Compare live v2.0 `content_hash` to the launch-seed candidate `7a1cd5ac…`.
   - **Match →** the launch seed *is* the verified source of record; retire the orphan `resident_rights.md` (or regenerate it from the seed) as tech-debt cleanup. No new edition needed.
   - **Mismatch →** treat live v2.0 as source-unknown; do not republish; escalate to reconstruct the authoring source and re-derive under a separate authorization.
3. Only after a proven chain, and only under separate authorization, consider any superseding edition — following the same immutable-supersession model as 0152.

## Standing constraints

Placeholders and acknowledgments remain immutable evidence. No `resident_rights` republication, assignment, or acknowledgment change is prepared or authorized. This file is evidence only.
