# Decision: Canonical-line Migration 0147 governs; contact-connect-intake-foundation superseded

Recorded per §14 (Decision Logging) of the GFA Project Knowledge Authority & Conflict
Resolution Protocol.

- **Decision:** The canonical-line implementation of Migration 0147 governs
  (`supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql` and its companion
  receiver, preflight, data-access, and workspace changes introduced at commit `39c4208`
  on `claude/recoveryos-canonical-audit-1pvcwr`). The competing
  `claude/contact-connect-intake-foundation` branch (`0cd3611`, carrying
  `supabase/launch/migrations/0147_intake_workflow_foundation.sql`) is **superseded** and
  must not be merged or applied as an alternate intake foundation. Preserve the branch as
  historical implementation evidence until its unique functionality has been reconciled
  against the canonical implementation. No functionality, data requirement, or measurement
  capability should be assumed preserved solely by this supersession decision.
- **Date:** September 3, 2026
- **Decision-maker:** Executive Director, Grace For Addictions (Thomas), recorded through
  an authenticated, executive-directed working session.
- **Rationale:** Two parallel implementations of the same six-stage intake workflow were
  built on diverging lines under the same migration number. The canonical-line
  implementation is newer, tested (12 added tests; CI green), integrated with the EJWRH
  application path and `residence_application_intake`, and reconciles the earlier
  side-branch `115934d` value without its migration collision. The decision is
  architectural only: it selects which foundation governs. It is not a judgment that the
  superseded branch contains no unique value.
- **Conditions:**
  - The superseded branch is preserved (not deleted) as historical implementation
    evidence.
  - Its unique functionality must be explicitly reconciled against the canonical
    implementation before the reconciliation queue below is closed.
  - The Recovery Connection Funnel measurement model is a **requirement on the canonical
    intake architecture** (see
    `docs/product/recovery-connection-funnel-measurement-requirement.md`), not a reason
    to reopen or blend the two implementations.
  - Neither implementation is applied to CQCX by this decision; activation remains gated
    on the Phase 1 identity and policy verification and its own authorization.
- **Revisit trigger:** completion of the reconciliation queue below; or discovery during
  Phase 1/2 intake work that a governing requirement is satisfied only by the superseded
  implementation.
- **Superseded decision:** none prior on this question. This decision supersedes the
  side branch's implicit claim (via its plan document) to be the intake foundation.

## Reconciliation queue (evidence-based candidates, not assumptions)

Object-level comparison of the two migrations (side branch `0cd3611` vs canonical
`39c4208`) identifies these side-branch elements with no obvious canonical counterpart;
each must be verified as (a) present in the canonical implementation, (b) deliberately
excluded, or (c) to be carried forward as a requirement:

1. `recoveryos.intake_team_members` — explicit intake-specific coordinator/worker
   membership table (canonical uses role machinery; verify least-privilege equivalence).
2. `recoveryos.intake_routing_rules` — explicit, table-driven routing rules (e.g. the
   women's-housing route and founder route as data rather than code).
3. Lead columns absent from the canonical prepared migration: `inquiry_kind`,
   `priority_level`, `housing_path`, `routing_state`, `verified_at`, `source_record_id`,
   `founder_response_due_at` (canonical carries `residence_interest`,
   `wix_submission_id`, `submitted_at`, `organization_inquiry`, `response_due_at`,
   `linked_intake_id` — map the overlapping intents explicitly; do not assume
   equivalence).
4. `recoveryos.intake_contact_events` vs canonical `lead_contact_events` — verify the
   canonical table preserves the side branch's who/when/channel/outcome/time-spent/
   next-follow-up coverage and append-only posture.
5. `scripts/verify-intake-workflow-foundation.mjs` and its CI wiring — verify the
   canonical preflight provides equivalent verification, or port.
6. The side branch's plan document's Phase 1 identity list and routing-decision list —
   already absorbed into the live Phase 1 verification record (three identities without
   CQCX accounts; founder identity ambiguity; six unrecorded decisions).

Closing an item requires stated evidence, per the No Silent Reconciliation rule.
