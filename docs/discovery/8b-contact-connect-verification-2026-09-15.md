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

## Interpretation (labeled)

- **Established:** no automation-layer hop exists; a Velo-layer integration
  exists in some form (the `supa_contact` secret is purpose-described for
  exactly this pipe); the pipeline is not moving all submissions (unless
  nearly all 119 predate a recent wiring — not established).
- **Inference, not established:** the Velo code posts Contact Connect
  submissions to a Supabase endpoint using `supa_contact` as the shared
  secret, wired 2026-07-05.
- **Risk flag (must be disproven in the editor):** `ds_fix` is described
  "supabase **dev**". If any Velo backend code still targets the retired dev
  project (YKY) or a non-canonical URL, that is a P0-class finding under the
  canonical-backend rule. Names alone cannot tell the target.

## INTERIM OPERATIONAL POSTURE (in force per decision 8B)

**The Wix submissions inbox is a REQUIRED, human-monitored public-inquiry
source.** Inquiries must NOT be assumed to reach RecoveryOS automatically.
**27 submissions are currently unseen** — a human should review the Wix Forms
submissions inbox promptly (this is an operations action in Wix's UI, outside
this session's authority; flagged, not performed).

## Remaining conclusive steps (Wix editor/dashboard — human session)

1. Open the Velo editor (Dev Mode) on the LIVE site: locate backend code /
   event handlers (`events.js` `onFormSubmit`, backend web modules, or
   `http-functions.js`) referencing the Contact Connect form, `supa_contact`,
   `ds_fix`, or any `*.supabase.co` URL.
2. Record: exact target URL(s) (**must be `cqcxvwoukyhxyokfwnjm.supabase.co`
   only** — any `ykykeioydvtxpyreshhs` reference → STOP, P0-class), which
   secret is read, the header used (`x-lead-secret` expected by the
   receiver), the trigger mechanism, and error handling (does a failed POST
   vanish silently?).
3. In the same session: the W-2 capture — Settings → Site History; identify
   the 2026-09-13 23:20 change; record the newest revision BEFORE it as the
   rollback reference; restore nothing.
4. Fresh CQCX reconciliation once a connector-authenticated session exists
   (aggregate only): `select count(*), min(created_at), max(created_at) from
   recoveryos.leads;` compared with the Wix count/date range — non-PII
   volumes and timestamps only.

## Register effect

INTAKE-001/write-map W2 row: the Wix→lead-intake link downgrades from
"canonical pipe (assumed wired)" to **UNKNOWN—EVIDENCE REQUIRED / suspected
operational defect**, with the interim human-monitored posture in force.
No replacement is built under this authority (8B boundary).
