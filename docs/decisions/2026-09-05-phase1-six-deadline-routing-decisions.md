# Decision: Phase 1 six deadline/routing decisions (intake activation gate)

Recorded per §14 (Decision Logging) of the GFA Project Knowledge Authority & Conflict
Resolution Protocol. Resolves the six OPEN items preserved by
`docs/decisions/2026-09-05-phase1-executive-identity-intake-decisions.md` (§17 of the
directive). These decisions govern the canonical 0147 implementation and do not reopen
the superseded `contact-connect-intake-foundation` implementation.

- **Date:** 2026-09-05
- **Decision-maker:** Executive Director, Grace For Addictions (Thomas DeGarmeaux),
  through an authenticated, executive-directed working session.
- **Superseded decisions:** the proposed defaults carried in the Phase 1 gate report and
  `docs/plans/intake-activation-plan-2026-09-01.md` §6 (24h/4h clock-hour proposals and
  business-time proposals) are superseded by the ratified text below. The prepared 0147's
  clock-hour `lead_default_due()` encoding is superseded and has been removed from the
  prepared migration (delta recorded below).

## The six decisions (ratified)

1. **Standard first human-response target — MODIFY.** Target the first human contact
   attempt within **1 business day** of receipt. This is an internal operational service
   target, not a guarantee of successful contact. RecoveryOS must distinguish
   _inquiry received → human contact attempted → human connection established_; an
   attempted contact is never represented as a successful connection.
2. **Partnership / priority inquiry response — MODIFY.** Target acknowledgment within
   **4 business hours** and a substantive human response within **2 business days**.
   Responsibility routes to the functional role **designated partnership responder** —
   never a schema concept called founder. Initial designee: Thomas DeGarmeaux through
   `thomas@graceforaddictions.org`. Design permits future reassignment without schema
   change.
3. **Business-time calculation — MODIFY / DEFER AUTOMATION.** Business-time targets are
   the governing operational standard, but **automated business-hour deadline
   computation is deferred** until GFA's authoritative operating calendar is separately
   ratified. Until then: preserve received timestamps and surface age/time-since-receipt
   **without fabricating an overdue determination** from assumed business hours. Do not
   infer operating hours from website hours, staff availability, residence operations,
   or historical practice.
4. **Reminder and escalation — MODIFY.** An unresolved inquiry remains visible as
   needing follow-up. Once business-time computation is authoritative, support a
   follow-up reminder cadence of every 2 business days while appropriate. Escalation
   goes to the authorized **intake_coordinator function**, not a named individual. Never
   repeatedly notify the participant merely because an internal staff follow-up is
   unresolved; design notifications against alert fatigue and unnecessary disclosure.
5. **Assignment model — KEEP MANUAL FOR V1.** Manual coordinator assignment. No
   round-robin in 0147. The superseded branch's `eligible_for_round_robin` requirement
   is **retired from the current activation path** (reconciliation-queue Q1 flag closed
   accordingly) while the capability question is preserved for future review, to be
   revisited only with real volume/availability/response-time evidence.
6. **Verified submission / human quality gate — MODIFY.** Successful technical
   acceptance admits the inquiry to the queue; it does not establish a qualified
   recovery-support request or a legitimate human inquiry. The **first authorized human
   triage action** is the quality/relevance determination. Preserve separate concepts —
   technically accepted submission / human-reviewed inquiry / qualified recovery-support
   inquiry — where the measurement architecture requires them; spam, duplicates, tests,
   unrelated solicitations, and other nonqualified records must not silently inflate
   qualified-recovery-request metrics. No separate pre-queue verification process unless
   future evidence demonstrates the need.

**Activation consequence (ratified):** these decisions close the Phase 1 deadline/
routing gate except automated business-time computation, which is intentionally
deferred pending the operating-calendar ratification — and that deferral does **not**
block intake activation, because the canonical implementation operates safely on
timestamps, queue age, human assignment, and manual follow-up without false overdue
claims (verified in the delta below).

- **Revisit triggers:** ratification of the GFA authoritative operating calendar
  (activates deadline computation, the overdue flag, and the 2-business-day reminder
  cadence as their own reviewed migration); real intake-volume evidence sufficient to
  revisit automated assignment; measurement-architecture work that needs the
  human-reviewed/qualified distinction beyond the close-time classification.

## Exact resulting 0147 delta (repository-only; nothing applied)

Recorded in the same commit as this decision. Summary of every change:

**`supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`** (stays in
`prepared/` — the move to the migrations ledger remains an activation-gated act):

1. **Removed** `lead_default_due()` (the 24h/4h clock-hour derivation) and its
   revoke-list entry — no writer computes a deadline (decision 3).
2. `assign_lead` no longer populates `response_due_at`; the column ships **dormant**
   (kept, commented as such) so the future calendar-aware migration needs no schema
   change.
3. `lead_contact_events` gains `contact_kind text not null default 'attempted'
check in ('attempted','connected')` (decision 1); `record_lead_contact` gains
   `p_contact_kind` (validated; default `'attempted'`). Stage semantics documented:
   `contacted` = at least one human contact **attempt** on record; connection evidence
   is read from events, never from the stage.
4. `leads` gains nullable `triage_classification` — check-constrained to
   `qualified_recovery_support / organization_partnership / spam / duplicate / test /
unrelated_solicitation / other_nonqualified` (vocabulary drawn from the decision-6
   text). `set_lead_status` gains `p_close_classification`: **required when closing**
   (so no close is silently unclassifiable), rejected on non-close transitions, written
   to the lead and to the audit detail.
5. Header rewritten to carry the ratified policy; grant/revoke signatures updated.

**`supabase/functions/lead-intake/index.ts`** (receiver v3, redeploy still gated and
strictly after 0147): no longer writes `response_due_at` — the fabricated 24h/4h
deadline at insert is removed (decision 3).

**`packages/data-access/src/repositories/leadsQueue.ts`:** `ContactKind` and
`TriageClassification` types; `contact_kind` on contact events;
`triage_classification` on leads; `recordLeadContact` takes `contactKind`;
`setLeadStatus` takes `closeClassification`; queue ordering documented as
oldest-first by age (a future populated deadline naturally takes precedence).

**`apps/platform/src/staff/pages/InquiriesPage.tsx`:** surfaces plain-language age
since receipt ("waiting N hours/days") instead of any fabricated deadline; the Overdue
badge logic remains but can only fire on a populated (future, ratified) deadline;
contact logging requires the attempted-vs-connected choice (default: attempted);
closing requires choosing a classification ("Close as …"); closed rows display their
classification; queue caption now "waiting longest first".

**`apps/platform/src/staff/pages/InquiriesPage.test.tsx`:** fixture updated (dormant
deadline, classification field); new pins: attempt-by-default logging, explicit
connected logging, close-with-classification, age-without-overdue rendering; existing
overdue pins retained (they set an explicit deadline, exactly the future ratified
case).

Not changed, verified: `supabase/launch/preflight/launch_contract_check.sql` (checks
RPC names and table privileges only — `lead_default_due` was never listed); no other
caller of the changed RPC signatures exists in the repository.

**What decision 6 did NOT add:** no pre-queue review state, no `verified_at`
(reconciliation-queue Q3c can now close as "not needed under ratified decision 6" —
the close-time classification is the human gate), no automated spam detection.

**STOP boundary honored:** 0147 remains in `prepared/`, unapplied; no accounts created,
no roles granted, no deploy, no CQCX mutation. Next gates, in order, per
`docs/plans/phase1-intake-mutation-proposal-2026-09-05.md` §8: ledger move + PR (B),
apply to CQCX (D), identity mutations (E), receiver redeploy (F), staging + synthetic
battery (G), Wix edit (H).

## Addendum (2026-09-07): triage classification CONFIRMED with modification

- **Decision:** The Executive Director confirmed the required-at-close triage
  classification with one modification: add **`other`** for legitimate inquiries that
  are neither recovery support nor partnership (speaker invitations, training requests,
  family general-information contacts, media/research, resource tables, and similar) —
  a legitimate inquiry is never forced into a nonqualified value. When `other` is
  selected, a **short optional classification note** is permitted
  (`triage_classification_note`); no classification requires narrative.
- **Date / decision-maker:** 2026-09-07; Executive Director, Grace For Addictions
  (Thomas DeGarmeaux), authenticated executive-directed working session.
- **Ratified semantics:**
  - The classification is an **administrative measurement/routing classification** —
    not a clinical assessment, diagnosis, participant label, or determination of the
    legitimacy of a person's need.
  - `qualified_recovery_support` means the inquiry is sufficiently related to GFA
    recovery-support work to enter the qualified-inquiry measurement layer. It does
    **not** mean service was delivered, the person became a participant, eligibility
    was established, or human connection occurred.
  - `duplicate` closes the redundant record while the original submission/event
    evidence is retained untouched — never deleted or silently merged; where safely
    resolvable it may later reference the canonical person/inquiry (a future
    measurement-layer concern, deliberately not schema today).
  - Reporting architecture direction (for the measurement work, not schema now):
    All Contact Connect activity → Human-reviewed inquiries → Recovery Support /
    Partnership / Other Legitimate / Nonqualified — everything outside recovery
    support is not conceptually "nonqualified"; `other` preserves GFA's community
    reach in reporting.
- **Reconciliation queue:** item **Q3c (`verified_at`) is CLOSED as intentionally
  unnecessary** for this architecture (evidence: ratified decision 6 + this
  confirmation). Technical acceptance, human triage classification, contact attempt,
  human connection, service delivery, and outcome remain separately evidenced
  events/states; a verification timestamp column would duplicate the classification
  act without adding evidence.
- **Resulting delta (same STOP boundary; recorded in the confirming commit):** final
  vocabulary `qualified_recovery_support / organization_partnership / other / spam /
duplicate / test / unrelated_solicitation / other_nonqualified`; new nullable
  `leads.triage_classification_note` (≤300 chars, accepted by `set_lead_status` only
  with `other`, error `note_only_with_other` otherwise); `set_lead_status` signature is
  now `(bigint, text, text, text)` in the grant/revoke lists; data-access and queue UI
  updated (note field appears only when "Other legitimate inquiry" is selected); tests
  pin the `other`+note path and that no other classification offers narrative.
- **Next authorization on deck:** step B only (promote 0147 into the migrations ledger
  and prepare the PR), contingent on the CI gate analysis recorded alongside this
  addendum. Everything from D onward remains separately gated.
