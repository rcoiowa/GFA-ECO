# Issue #35 — bounded DEV proof: evidence plan

Date: 2026-11-10 · Issue: [rcoiowa/GFA-ECO#35](https://github.com/rcoiowa/GFA-ECO/issues/35) · Owner: GFAVRCC
Status: **plan and read-only inventory only.** No form was submitted, no row written, no email
sent, no function deployed, no secret changed. Nothing here is production evidence of delivery.

Evidence classes follow the Institutional Evidence Ledger (A legal · B verified operational ·
C leadership-confirmed · D reported/historical · E inferred · F unknown). "Observed" means read
on 2026-11-10 from this session through read-only connectors.

## 1. What the evidence establishes today

| # | Finding | Class |
| - | ------- | ----- |
| 1 | No per-form or per-residence recipient routing exists in any deployed function. `lead-intake` v16 reads one `LEAD_ALERT_TO` list for every route; `/rco-iowa` suppresses external alerts; `residence-intake` v7 contains no email code at all (in-app notification trigger only). | B (deployed source read) |
| 2 | The email provider account has one verified sending domain, `auth.recoveryresidence.app`, and one API key named "Supabase Integration". No `graceforaddictions.org` or `rcoiowa.org` sending domain exists. | B |
| 3 | The provider's recent-send list (10 messages, 2026-10-12 → 2026-11-03) contains only account-confirmation messages. No staff intake alert appears. | B for the list; E that no alert has ever been sent |
| 4 | `recoveryos.leads` holds 2 rows, both `gmail_contact_connect`, both 2026-09-01. No row from the Wix form, native Contact Connect (`gfa_contact_connect_v1`), or RCO inquiry (`rco_iowa_inquiry_v1`). Unchanged since the 2026-10-12 issue evidence. | B |
| 5 | Housing applications do persist: residence 1 (Grace House) 11 rows from `recoveryos-grace-house`, latest 2026-11-05; residence 2 (Ernest & Johnnie White Recovery House) 6 rows from `recoveryos-ejwrh`, latest 2026-10-13. Counts include any earlier test rows; they were not opened. | B |
| 6 | `residence_listing_submissions` is empty. | B |
| 7 | Deployed `lead-intake` v16 (2026-10-07) includes `contact.ts` and `rco.ts`. `main` does not; they exist only on unmerged `codex/rco-iowa-supabase-inquiry-2026-10-07`. **Deploying `lead-intake` from `main` would remove the `/contact` and `/rco-iowa` routes.** | B |
| 8 | Function secrets (`LEAD_INTAKE_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `LEAD_ALERT_TO`, `TURNSTILE_SECRET`) cannot be read from this session. The 2026-10-07 record reported `LEAD_INTAKE_SECRET` missing. Rows arriving through `residence-intake` in November imply its Turnstile check is passing. | F / D / E |
| 9 | There is no separate DEV database. RecoveryOS-Launch (`cqcxvwoukyhxyokfwnjm`) is the only active Supabase project; the staging Worker writes to it. A "DEV" submission is a real row in the canonical database. | B |
| 10 | Public sites could not be fetched from this session (network policy), so no live page, embed, or widget was inspected. | limitation |

Consequence: the approved recipient map is a requirement, not a configuration. Save can be proven
now for some forms; routing and delivery cannot be proven for any form until gates 3–5 of the
issue are implemented.

## 2. Public form entrypoint inventory

| ID | Form | Entrypoint (where a person submits) | Receiver | Observed state |
| -- | ---- | ----------------------------------- | -------- | -------------- |
| F1 | GFA Contact Connect — production | Wix form on graceforaddictions.org | Wix Forms; intended Wix automation → `lead-intake` (shared secret) | **Not inventoried.** Wix account lists 21+ sites, several named "Grace For Addictions"; which one serves the production domain, its form ID, and its automation were not established. No Wix-sourced lead has ever landed (finding 4). |
| F2 | GFA Contact Connect — native | `/gfa/connect.html` (`contact.js`) on `recoveryos-staging` and `gfa-eco-recovery-residence-os` Workers | `lead-intake/contact`, Turnstile action `contact_connect` | Route deployed; browser code on `main`; zero rows. Depends on `TURNSTILE_SECRET` + `LEAD_INTAKE_SECRET`. |
| F3 | RCO Iowa inquiry | `rco-iowa-public` Worker (source on unmerged branch) | `lead-intake/rco-iowa`, action `rco_inquiry` | Route deployed; site reportedly keeps submission closed (D, 2026-10-07); zero rows; alerts suppressed by design. |
| F4 | Grace House application | `/recovery-residences/grace-house/apply` | `residence-intake`, `residence_id` 1 | Saving (finding 5). No email path. |
| F5 | EJWRH application | `/recovery-residences/ejwrh/apply` (legacy `ejwrh` function 302-redirects here) | `residence-intake`, `residence_id` 2 | Saving (finding 5). No email path. |
| F6 | Residence listing submission | "List your residence" page; static directory site | `residence-intake` kind `listing` | Zero rows. **Not in the approved recipient map.** |
| F7 | IRCC / VRCC forms | Not found in this repository | Unknown | Named in the recipient map; no entrypoint located. |

Legacy or non-submitting surfaces, recorded so they are not mistaken for live forms: `gracehouse4`
(2 rows, last 2026-08-24) and `ejwrh-portal` (1 row, 2026-08-23) sources; the static directory
site's application forms (empty Turnstile site key in source); `workers/api`
`/public/residence-applications` (no `recoveryos-api` Worker is deployed); the GFA-Sites review
prototype contact form (sends nothing by design); coaching, Live-Out, volunteer and partnership —
no separate form found beyond F1/F2 interest options.

## 3. Recipient map — approved vs. implementable

Addresses are in Issue #35 (Class C, approved by Thomas) and are not repeated here.

| Classification | Approved recipients | Implemented | Open before any send |
| -------------- | ------------------- | ----------- | -------------------- |
| GFA general (F1, F2) | 1 GFA mailbox | No (single env list, contents unknown) | Confirm mailbox receives external mail. |
| Grace House (F4) | 2 GFA mailboxes | No | Key on `residence_id = 1`, never on names or free text. |
| EJWRH (F5) | 5 recipients: 3 GFA staff, 1 personal external mailbox, 1 `rcoiowa.org` mailbox | No | EJWRH is not a GFA house. Each recipient needs confirmed authorization for EJWRH applicant information before any record link is sent; the external personal mailbox needs explicit confirmation. Key on `residence_id = 2`. |
| RCO Iowa / IRCC / VRCC (F3, F7) | 3 `rcoiowa.org` mailboxes | No — intentionally suppressed | Must never fall through to GFA recipients. |
| Listing submissions (F6) | none approved | — | Decision needed: route or leave in-app only. |

Provider prerequisites: decide the sender identity. Today mail can only be sent from
`auth.recoveryresidence.app`; sending as GFA or RCO Iowa requires verifying those domains (DNS
change — outside this proof). Alerts stay minimal: name-free pointer to the staff queue, no
application contents, no participant-facing mail.

## 4. Synthetic tests — one per form

Common rules. Operator submits through the real browser form, not a direct API call. Every test
record uses the marker `TEST-35-<form>-<yyyymmdd>` in the name field and an `@example.test`
address. Evidence is captured per leg; a leg without evidence is recorded as not proven. HTTP 200
and provider acceptance are not delivery. Test rows are labeled and removed (or retained and
labeled) by an authorized staff member, with the row ID recorded.

Legs: **S** save (exactly one canonical row, correct source/residence, idempotent on resubmit) ·
**R** routing (server-selected classification and recipient set recorded, caller cannot influence
it) · **D** delivery (provider message ID per recipient **and** mailbox-side receipt from each
recipient or an authorized operator).

| Test | Form | Run from | S: expected row | R / D expectation | Runnable now |
| ---- | ---- | -------- | --------------- | ----------------- | ------------ |
| T-F2 | Native Contact Connect | `recoveryos-staging` `/gfa/connect.html` | `leads`, `source = gfa_contact_connect_v1`, one row on double submit | GFA general only | S: once secrets confirmed. R/D: blocked. |
| T-F3 | RCO Iowa inquiry | `rco-iowa-public` Worker | `leads`, `source = rco_iowa_inquiry_v1`, `organization_inquiry = true` | RCO recipients only; zero GFA recipients | S: after submission is opened in DEV. R/D: blocked. |
| T-F4 | Grace House application | staging `/recovery-residences/grace-house/apply` | `residence_application_intake`, `residence_id = 1` | Grace House set only; no application content in mail | S: yes. R/D: blocked. |
| T-F5 | EJWRH application | staging `/recovery-residences/ejwrh/apply` | `residence_application_intake`, `residence_id = 2` | EJWRH set only, after recipient authorization | S: yes. R/D: blocked. |
| T-F6 | Listing submission | staging "List your residence" | `residence_listing_submissions`, one row | Per decision in §3 | S: yes. R/D: n/a until decided. |
| T-F1 | Wix Contact Connect | DEV Wix site form, then production only after §6 | `leads` via automation, stable `wix_submission_id` | GFA general only | Blocked on F1 inventory. |
| T-F7 | IRCC / VRCC | — | — | — | Blocked: entrypoint unknown. |

Negative checks, once per receiver: wrong origin is refused; missing or wrong-action Turnstile
token is refused; a forced insert failure returns a visible error, not a success message; a
caller-supplied recipient or residence name is ignored.

Evidence record per test: test ID, date/time, operator, entrypoint URL, commit and function
version, row ID, routing classification, provider message IDs, mailbox receipts, cleanup action.

## 5. What blocks the routing and delivery legs

1. Reconcile `lead-intake` source: merge the deployed `/contact` and `/rco-iowa` adapters into
   `main` before any redeploy (finding 7).
2. Implement issue gates 3–4: server-owned allowlisted routing table keyed by form classification
   and canonical `residence_id`; alert outbox with attempt, status, error and recipient
   classification; retries; deduplication. This needs a schema change and should be built on a
   Supabase branch or separate DEV project, not on the canonical database.
3. Provider configuration (gate 5): sender identity decision, secrets set, and confirmation that
   no participant-facing mail is enabled.
4. Recipient authorization for the EJWRH set.

## 6. Decisions needed from Thomas / GFAVRCC

1. **DEV target.** Recommended: run save-only tests (T-F4, T-F5, T-F6) from the staging Worker
   against the canonical database with labeled test rows, and build routing/delivery on a
   Supabase branch. Alternative: stand up a separate DEV project first.
2. Which Wix site is production, and who inventories its Contact Connect form and automation
   (F1); where the IRCC/VRCC forms live (F7).
3. Sender identity for staff alerts.
4. Listing-submission recipients (F6).
5. Confirmation of each EJWRH recipient's authorization, including the external mailbox.

Production remains out of scope until every runnable test has a complete S/R/D evidence record
and a separate production authorization is given. No Cloudflare domain assignment changes.
