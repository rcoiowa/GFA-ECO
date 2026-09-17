# PROPOSED — Lead-status transition matrix (awaiting ratification)

Status: **PROPOSED, not implementation authority.** Prepared 2026-09-08 during the
0147 corrective review. Nothing here changes behavior until an authorized
decision-maker ratifies it; until then the prepared 0147 encodes only the
uncontested subset (active-stage moves, classified close, audited
reclassification) and **rejects reopening** (`reopen_not_ratified`).

## Why this exists

The 2026-09-07 design review encoded reopen semantics (reopen allowed;
classification cleared; `lead.reopened` audit event) directly into the prepared
migration without ratifying the full lifecycle first. The independent review
correctly flagged that ordering. This document puts the complete matrix in front
of the decision-maker before any reopen behavior ships.

## The six stages (plus one legacy value)

`new → assigned → contacted → waiting → scheduled → closed`, with legacy
`converted` valid on existing rows for lineage but never a `set_lead_status`
target (conversion has its own path).

## Proposed matrix

Rows = current status, columns = requested status. ✔ = allowed, C = allowed and
requires the close classification, R = allowed only under the ratified reopen
rule below, ✘ = rejected.

| from \ to | new | assigned | contacted | waiting | scheduled | closed |
| --------- | --- | -------- | --------- | ------- | --------- | ------ |
| new       | ✔   | ✔        | ✔         | ✔       | ✔         | C      |
| assigned  | ✔   | ✔        | ✔         | ✔       | ✔         | C      |
| contacted | ✔   | ✔        | ✔         | ✔       | ✔         | C      |
| waiting   | ✔   | ✔        | ✔         | ✔       | ✔         | C      |
| scheduled | ✔   | ✔        | ✔         | ✔       | ✔         | C      |
| closed    | R   | R        | R         | R       | R         | C¹     |
| converted | ✘   | ✘        | ✘         | ✘       | ✘         | ✘      |

¹ closed → closed re-records the classification (the correction path); every
close writes a `lead.closed` audit event, flagged `reclassification: true` when
the lead was already closed.

Active-stage moves stay free-form deliberately: the stages are administrative
descriptions of a human-governed workflow (decisions 1/5/6 of 2026-09-05), and
backward moves (e.g. scheduled → waiting when a meeting falls through) are
normal, not exceptional. No stage change is ever automated.

## The decision that needs ratification: reopening (R)

**Recommended rule:** a closed inquiry MAY be reopened by anyone authorized to
work it, and reopening (a) clears `triage_classification` and its note, so a
close-time label never describes an active lead, and (b) writes a
`lead.reopened` audit event carrying the cleared classification and the target
stage, so the evidence chain lives in `audit_log`, not in a stale column.

Rationale: people return — "my future is not finished" — and a mistaken close
(wrong person, premature spam call) must be correctable by the same authorized
humans without a privileged back door. The audit event preserves the history the
cleared label would otherwise carry.

**Alternatives considered:**

1. _Closed is terminal; returning people get a new lead linked by
   `find_duplicate_leads`._ Cleanest measurement, but it splits one person's
   thread across records — against the "one thread, never duplicates" doctrine —
   and makes an erroneous close permanent without privileged intervention.
2. _Reopen keeps the old classification until the next close._ Rejected: an
   active lead labeled `spam` is exactly the stale-label defect the review
   found.
3. _Reopen restricted to coordinators (not the assigned worker)._ A narrower
   variant of the recommendation; viable if the decision-maker wants reopening
   to be a supervisory act.

**To ratify:** the R rule (recommended, an alternative, or a modification), and
whether reopening is coordinator-only. Record the decision per the
executive-decision standard (decision, date, decision-maker, rationale, revisit
trigger) and only then encode it in the prepared 0147 and re-run the isolated
database tests.
