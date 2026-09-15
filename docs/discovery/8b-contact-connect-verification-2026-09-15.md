# 8B — Contact Connect pipeline verification (read-only, 2026-09-15)

**Authority:** decision 8B (read-only verification authorized now). **Method:**
authenticated Wix REST only — Automations V2 query (complete), Form Schemas
(complete), Velo Secrets Vault metadata (names/descriptions/dates ONLY —
values were not decrypted, are not recorded anywhere, and must never be),
Form Submissions count (aggregate only, no submission contents, no PII).
Nothing was modified. Velo site code is NOT readable via REST (confirmed —
Wix documents REST as not for site code; no site-code read API exists), so
editor inspection remains the conclusive step.

## Verdict: NOT PROVEN — reported as a SUSPECTED OPERATIONAL DEFECT (8B stop rule)

The Contact Connect → RecoveryOS `lead-intake` hop could not be proven, and
the one reconciliation available points against a functioning full pipeline.

## Evidence

| # | Check | Result |
|---|---|---|
| 1 | All automations, unfiltered enumeration | Only preinstalled app automations (Bookings/Groups/Blog/Stores/Pay-Links notification emails) plus the two Forms-app automations. **Zero webhook / outbound-HTTP / Supabase / FiveCRM / lead-intake strings anywhere.** |
| 2 | Contact Connect form's automations | Exactly one: triggered email **to the submitter** + contact upsert. **No staff notification. No external POST.** |
| 3 | Velo Secrets Vault (metadata only) | Two secrets, both created 2026-07-05: **`supa_contact`** — description "contact connect into supabase" — and **`ds_fix`** — description "supabase dev". Names/descriptions/dates recorded; values not decrypted and never recorded. |
| 4 | Submission counts (aggregate) | Contact Connect (`8ce6b3ab…`): **119 total, 27 unseen**. "My Form" (`58582b0f…`): no count row returned (zero or not counted under the queried namespace). |
| 5 | Cross-system reconciliation (partial) | CQCX held **2 leads, both `new`** at the 2026-09-07 read-only verification (PR #7 record). 119 Wix submissions (form live since 2025-11-28) vs 2 leads is a **large discrepancy**; a fresh CQCX lead count needs the authenticated session (query recorded below). |

## Interpretation (labeled; wording per decision 9A)

- **Established:** no automation-layer hop exists. The `supa_contact` secret
  (purpose-described "contact connect into supabase") is **evidence of
  INTENDED Velo integration configuration** — it is NOT proof that current
  Velo code uses the secret, nor that the pipeline executes.
- **Evidence supporting a suspected operational defect — not a proven
  forwarding-failure count:** 119 lifetime Wix submissions vs 2 CQCX leads at
  the Sep-7 point-in-time read. The populations and time windows are
  unreconciled (the form predates the 2026-07-05 secret by months); the
  correct comparison is the 9E window-based reconciliation below.
- **Inference, not established:** Velo code posts Contact Connect submissions
  to a Supabase endpoint using `supa_contact`, wired around 2026-07-05.
- **Risk flag (must be disproven in the editor):** `ds_fix` is described
  "supabase **dev**". Interpretation rule (decision 9C): a dead/commented
  historical YKY reference = residue to retire; an executable live path
  capable of routing production submissions to YKY = **P0-class
  canonical-backend violation → STOP, preserve evidence, report; no silent
  patching; no breach claim without evidence.** Names alone cannot tell the
  target.

## INTERIM OPERATIONAL POSTURE (in force per decision 8B)

**The Wix submissions inbox is a REQUIRED, human-monitored public-inquiry
source.** Inquiries must NOT be assumed to reach RecoveryOS automatically.
**27 submissions are currently unseen** — a human should review the Wix Forms
submissions inbox promptly (this is an operations action in Wix's UI, outside
this session's authority; flagged, not performed).

## Human session checklist (authorized by decision 9; all read-only)

### 9B — triage of the 27 unseen submissions (inside Wix only)

Purpose: is anyone currently waiting for a human response? Rules: review
inside Wix; no export; no PII/narratives copied into Claude, GitHub,
spreadsheets, or the Control Tower; inspect only what response-status
determination needs; alter/delete nothing; route any timely-contact need
through the existing authorized human process (no automated outreach).

**9B triage record (aggregate-only; fill in after the review):**

```
Reviewed (total): __ / 27+ (count at review time: __)
Already handled: __        Needs human follow-up: __
Duplicate/spam/test: __    Unable to determine: __
Oldest outstanding submission date: __________
Reviewer + date: __________
Follow-ups routed via (existing human process): __________
```

### 9C — Velo inspection (read-only; never edit; never expose secret values)

1. Editor Dev Mode on the LIVE site. Establish: (1) what event/handler
   invokes the integration; (2) whether the Contact Connect submission event
   actually reaches it; (3) the outbound destination/project/function;
   (4) which secret/config NAME is referenced; (5) error handling, logging,
   retries/idempotency, failure behavior (does a failed POST vanish
   silently?); (6) whether any staff notification occurs.
2. Search specifically for: `supa_contact`, `ds_fix`, `lead-intake`,
   `cqcxvwoukyhxyokfwnjm`, `ykykeioydvtxpyreshhs`, any `*.supabase.co`
   URL/project ref, outbound HTTP/fetch logic, Contact Connect form/submission
   handler references.
3. **Interpretation rule (decision 9C):** dead/commented YKY reference →
   residue to retire. Executable live path capable of routing production
   submissions to YKY → **P0-class canonical-backend violation: STOP,
   preserve evidence, report. No silent patching. No breach claim without
   evidence.**

### 9D — W-2 Site History capture (same session)

Settings → Site History: what can be established about the 2026-09-13 23:20
update; the newest revision immediately BEFORE it, with enough identifying
metadata (timestamp/label) to serve as a rollback reference if later
authorized. Restore/publish nothing.

### 9E — fresh CQCX reconciliation (window-based; needs the authenticated connector)

Never compare lifetime Wix submissions to a stale point-in-time lead count as
one population. Method: (a) define the post-integration window (start no
earlier than the 2026-07-05 secret creation, refined by the 9C-found wiring
date); (b) Wix Contact Connect submission count over that window; (c) CQCX
`select count(*), min(created_at), max(created_at) from recoveryos.leads
where created_at >= <window start>;` (d) stable submission IDs when both
systems retain them — note `leads.wix_submission_id` exists only after 0147R
applies, so until then reconciliation is timestamp/count based. Aggregates
only; no inquiry content.

## Register effect

INTAKE-001/write-map W2 row: the Wix→lead-intake link downgrades from
"canonical pipe (assumed wired)" to **UNKNOWN—EVIDENCE REQUIRED / suspected
operational defect**, with the interim human-monitored posture in force.
No replacement is built under this authority (8B boundary).
