# EJWRH Public Portal — Read-Only Predeployment Audit

**Date:** 2026-08-23 · **Classification:** TYPE A (read-only audit; no live change, no deploy).
**Subject:** the EJWRH application portal served at
`…functions/v1/ejwrh` (Edge Function `ejwrh` v1 → public Storage `sites/ejwrh/index.html`),
its write path into `public.housing_applications`, and its fitness for public Cloudflare
deployment. **Executive deployment decision under review: HOLD — this audit confirms HOLD.**

**Evidence classes used** (GFA Evidence Ledger discipline):
- **[B]** live CQCX verification this session (read-only SQL/function/storage introspection);
- **[B]** repo canonical sources at `917104c`;
- **[C]** the Executive Director's verbatim quotes of the page content. The page file itself
  could not be fetched from this audit environment (network egress to `*.supabase.co` is
  proxy-blocked for file transfer; the DB `http` extension is not installed and installing it
  would be a mutation). Every page-text verdict sourced [C] must be re-confirmed against the
  file during the fix pass.

---

## 1. Verified live state [B]

| Fact | Verified value |
|---|---|
| `ejwrh` Edge Function | v1 ACTIVE, `verify_jwt=false`, created 2026-08-23T21:52Z; a GET/HEAD proxy for `sites/ejwrh/*` in public Storage; sends `x-frame-options`, `nosniff`, `referrer-policy`; **no CSP, no HSTS**; cache 300s |
| Page artifact | `sites/ejwrh/index.html` + `ejwrh-logo.png`, uploaded 2026-08-23T21:51–52Z to a **public** bucket |
| Deploy mechanism | ledger migrations `create_sites_bucket_ejwrh_deploy` / `close_ejwrh_deploy_window`: a **temporary anon-writable Storage window** on `sites/ejwrh/*` (~2 min), then dropped. Window verified closed; policies gone |
| `public.housing_applications` | **0 rows — no applicant PII at rest.** 23 columns: the 20 from the 0123 drift capture **plus `forms` jsonb, `signature` jsonb, `read_acknowledgments` jsonb** added 2026-08-23T21:21Z by ledger migration `add_forms_and_signature_to_housing_applications` |
| Who can INSERT | policy `housing_applications_public_insert` (anon + authenticated; checks only `house_code='ejwrh'`, email length 3–320, `consent_contact=true`); grants: **anon INSERT only**, authenticated **none** → effective writer = **anonymous browser via PostgREST** |
| Who can READ | **service_role only** (no SELECT policy, no client grants). **No staff in-app read path exists** — the drifted table has no review UI, unlike the canonical intake queue |
| Consent enforcement | checkboxes land as booleans/JSONB **only**; nothing converts them to `recoveryos.consent_grants`; no disclosure is structurally gated by them |
| Payload validation | the INSERT policy validates 3 fields; `forms`/`personal`/`journey`/`signature` JSONB accept **arbitrary content and size** — no field allowlist, no cap, no honeypot, no Turnstile, no rate limit at this boundary |
| Retention / audit | none defined; no `audit_log` wiring; no deletion rule |
| Repo/ledger drift | **3 EJWRH deploy migrations have no repo file** (un-captured drift on top of the previously reconciled 0123). 0137 initially appeared un-captured but its repo file + superseding executive gate were pushed to the branch during this audit — see §2.1 |
| Cloudflare | **no EJWRH Worker or route exists** (10 workers enumerated; none EJWRH-named). The hold costs nothing at the edge |
| Canonical intake | `recoveryos.residence_application_intake` (0122): service-role-only writes via the `residence-intake` Edge Function (origin allowlist, honeypot, size caps, field allowlist, optional Turnstile), staff review RPC + IntakeQueuePage, conversion linkage, fixture flag — live and ACTIVE |
| Canonical consent | `recoveryos.consent_types` (8 scoped keys) + `consent_grants` + `recordConsentDecision` — scoped, revocable, auditable |
| Canonical crisis numbers | governance-tested (`supportContacts.test.ts`, human-verified 2026-08-15, source Your Life Iowa): **988**, **911**, Iowa Warm Line **844-775-9276** (explicitly non-crisis peer line), GFA warmline 515-310-3425, staff line 515-220-8771. **`1-844-775-5837` appears nowhere in the canon** |
| Canonical NARR status | `docs/compliance/narr-3.0-level-2-mapping.md`: Level II certification **pursued** via MCRSP through the Iowa HHS process — **not certified** |

## 2. Findings beyond the executive review [B]

These four were not in the ED's list and each independently supports HOLD:

1. **`0137_self_insert_retirement` was applied live 2026-08-23T13:31Z under a superseding
   executive gate — RESOLVED as governance, one condition outstanding.** *(Corrected during
   this audit: the branch carries `docs/decisions/2026-08-23-p2-direct-insert-retirement.md`
   — a ratified executive decision replacing the 14-day telemetry window with
   "executive confirmation of no live participant use + fresh zero-production-direct-insert
   verification + post-apply controls" — plus the 0137 repo migration file. Its SQL matches
   the planned 0137 semantics, its abort check passed, and its own §7 condition covers the
   residual risk this audit independently found:* **the deployed production frontend
   (Cloudflare workers last modified 2026-08-16/21) predates the P2.5 `record_my_activity`
   reroute** — on that bundle, a participant check-in would save its feature row but silently
   lose its engagement service-event now that the direct path is retired. Zero live impact
   today (no live participants, per the ratification's basis); the P2.5+ frontend
   (`de7bef0` or later) must be the deployed build before any real participant use — exactly
   ratification condition 7, restated here as an open pre-launch item.)
   **Remaining un-captured drift = the 3 EJWRH ledger migrations only**
   (`add_forms_and_signature_to_housing_applications`, `create_sites_bucket_ejwrh_deploy`,
   `close_ejwrh_deploy_window`) — capture into the drift lineage.
2. **The anon-writable deploy window is a defacement-grade pattern.** For ~2 minutes, any
   holder of the public URL could overwrite the page (a legal/consent instrument) with
   arbitrary HTML. It is closed now, but the bucket is public-read forever, the served file
   carries no integrity hash, and "future deploys re-open a scoped window" is written into
   the closing migration. **Required:** future uploads via service role only; never an anon
   window for a page functioning as a signature instrument.
3. **No staff read path = submissions would go into a hole.** With reads limited to
   service_role, a real application would sit unreviewable except via dashboard/service-key
   access — no queue, no notification, no audit, unlike the canonical intake (0122's trigger
   notifies staff; IntakeQueuePage reviews). Operating the program on dashboard access to raw
   sensitive JSONB contradicts role-based-access doctrine.
4. **The mojibake is baked into the uploaded bytes.** The function serves
   `charset=utf-8`; the artifacts (â€”, Â·, â€¦) are the classic UTF-8→CP1252 double-encoding
   signature, i.e. the file itself was transformed on upload (plausibly by the deploy-window
   upload). Re-uploading a correctly encoded file fixes all instances at once — fix the
   pipeline, not the strings.

## 3. Verdict matrix

Verdicts: **KEEP · CHANGE · REMOVE · MOVE-TO-INTAKE · VERIFY-POLICY · BLOCK-DEPLOY.**
Source class per row: [B] live/repo-verified, [C] ED-quoted page content.

### 3.1 Write path & infrastructure

| Item | Verdict | Basis |
|---|---|---|
| Direct anonymous PostgREST insert into `public.housing_applications` | **BLOCK-DEPLOY → MOVE-TO-INTAKE** | [B] Bypasses the canonical service-role intake boundary (0122) that consolidation built precisely to retire this pattern; no allowlist/caps/honeypot/Turnstile/audit/notification. The 2026-08-14 reconciliation already ratified convergence onto `recoveryos.residence_application_intake` as end state. Route submissions through the `residence-intake` Edge Function (extend its field allowlist for EJWRH's *minimal* application fields; the function already supports multiple flows + origin allowlist + Turnstile) |
| `forms`/`signature`/`read_acknowledgments` columns on the drifted table | **REMOVE (from the application write; columns stay untouched at 0 rows)** | [B] Added 2026-08-23 outside the repo lineage to receive full intake-form payloads at application time — the opposite of data minimization and of the ratified application→intake lifecycle. Nothing should write them; disposition of the empty columns belongs to the convergence gate |
| Public URL = `…supabase.co/functions/v1/ejwrh` | **CHANGE** | [B/C] Keep as internal verification endpoint only; public address should be `recoveryresidence.org/ejwrh` behind Cloudflare (brand URL, CSP/HSTS, WAF/rate limiting, Turnstile, cache, backend mobility). No EJWRH Worker exists yet, so nothing to unwind |
| Edge function response headers | **CHANGE** | [B] Add CSP and HSTS (or supply them at the Cloudflare layer once fronted); current headers are partial |
| Public Storage bucket hosting a signature instrument | **CHANGE** | [B] Acceptable only as origin behind Cloudflare with service-role-only writes and a content hash recorded per deploy; never redeploy via anon window |
| File encoding | **CHANGE (blocking)** | [B/C] Re-encode and re-upload; verify — — · — … render; mojibake inside legal text is ambiguity, not just cosmetics |

### 3.2 Application form fields (page form → `personal`/`journey`/`forms` JSONB)

Retain at **application** stage (identity + need + safe contact only):

| Field | Verdict |
|---|---|
| Name, email, phone, safe-contact method, county | **KEEP** [C/B — canonical intake has exact counterparts] |
| Age-eligibility confirmation (18+) | **KEEP** (as a yes/no, not DOB) |
| Requested residence / house | **KEEP** (`residence_id` in canonical intake) |
| Immediate housing/recovery need (short) & "your why" | **KEEP** (maps to `answers` in canonical intake) |
| High-level accommodation/access need | **KEEP** (one optional field, no medical narrative) |
| Supervision/reentry coordination *needed?* (yes/no) | **KEEP** (flag only — details move to intake) |
| Consent to application processing/contact | **KEEP** (already the policy-enforced `consent_contact`) |

**MOVE-TO-INTAKE** (collect post-conditional-acceptance, inside the account-based intake
where the canonical document/consent machinery lives) — per ratified data minimization; every
one of these is currently swept into one anonymous JSONB insert [C]:

| Field | Verdict |
|---|---|
| Date of birth | **MOVE-TO-INTAKE** (application needs 18+ only) |
| Substances used / SUD history narrative | **MOVE-TO-INTAKE** |
| Treatment-history narrative | **MOVE-TO-INTAKE** |
| MOUD status, prescriber, pharmacy, medication list, controlled-substance details | **MOVE-TO-INTAKE** (medication disclosure is an intake instrument, and 42 CFR Part 2-adjacent) |
| Mental-health provider | **MOVE-TO-INTAKE** |
| Probation/parole status, supervising officer contact, legal obligations detail | **MOVE-TO-INTAKE** (keep only the yes/no coordination flag at application) |
| Medical-condition narrative | **MOVE-TO-INTAKE** |
| Emergency contacts | **MOVE-TO-INTAKE** (needed at admission, not application) |
| Reference contacts | **MOVE-TO-INTAKE** |
| Drug-screen-sharing permissions / detailed ROI scopes | **MOVE-TO-INTAKE + canonical consent** (see 3.3) |

### 3.3 Consents, authorizations, signature

| Item | Verdict | Basis |
|---|---|---|
| ROI checkbox set stored as booleans/JSONB | **CHANGE → route to canonical consent** | [B] The canonical model (`consent_types`/`consent_grants`) is scoped, revocable, auditable; checkboxes on an anonymous row are none of those, and no disclosure is gated by them. Until conversion exists, the page may only collect an **authorization request/preference**, labeled as such, with the actual release executed at intake through the canonical system |
| "You can add or revoke releases at any time in writing" | **CHANGE** | [C] True only once grants live in the canonical system; wording must match the mechanism that actually exists |
| Form A "authorize staff to call 911 / administer naloxone" | **CHANGE (split)** | [C] Emergency operational authority is not consent-gated — replace with an emergency-response *notice* ("staff may contact emergency services and provide assistance consistent with policy and applicable law"); keep a separate, genuine *emergency-contact notification authorization*. Never imply naloxone/911 depends on a checkbox |
| 15-documents-before-signature gate | **MOVE-TO-INTAKE** | [C/B] The full Intake Forms Package (participant agreement, handbook, medication disclosure, etc.) is an intake/admission instrument; the in-app document machinery (`document_assignments`, `ensure_my_document_assignments`) already exists for exactly this. Application requires none of it |
| Typed-name + timestamp e-signature creating residency-agreement obligations at application | **BLOCK-DEPLOY (as a residency agreement) / CHANGE (as an application attestation)** | [C/B] An application may carry a light "information is accurate + consent to processing" attestation. A binding residency/participant agreement signature requires: immutable copy or hash of the exact signed terms, per-document versions, signer identity, event ID, reproducible signed version — none of which the current `signature` JSONB + mutable Storage HTML provides. Sign at intake, in-app, against versioned documents |

### 3.4 Policy / legal statements (all [C] — re-confirm text at fix time)

| Statement | Verdict |
|---|---|
| "Under Iowa's Good Samaritan law you will not face legal consequences…" | **CHANGE (blocking)** — Iowa Code §124.418 immunity is conditional and limited. Use the ED's replacement: "Iowa law provides certain protections related to seeking medical assistance for a drug-related overdose. Those protections have specific legal conditions and limits. Call 911 in an emergency." |
| Hero: "NARR Level II men's recovery residence" | **CHANGE (blocking)** — canonical status is certification *pursued*; overclaim. Use approved language ("operating toward NARR Level II standards" or exact approved phrasing) |
| Footer: "NARR Level II Aligned" | **CHANGE** — align to the same single canonical phrase as the hero |
| "Everything you enter is confidential" | **CHANGE** — replace with the policy-accurate formulation ("handled according to GFA privacy, consent, and access-control policies; limited to people authorized to support the intake process") |
| "never visible to other applicants or residents" | **VERIFY-POLICY → then KEEP or soften** — technically true today [B: no client SELECT path], but keep only if GFA wants to stand behind it as a promise |
| Disclosure exceptions, court orders, mandatory reporting, supervision coordination, "immediate removal," possession of belongings, 7-day notice, controlled-substance documentation, 24-hour bedroom notice | **VERIFY-POLICY** — each must match the approved house policy and Iowa requirements word-for-word; none should be paraphrased on a public page. These belong in the intake-stage documents, not the application page (**MOVE-TO-INTAKE** for placement even after verification) |
| "bridge clinic" phrasing | **KEEP ABSENT** — not on this page per review; confirmed absent from repo sites; keep it that way everywhere |

### 3.5 Crisis / resources block

| Item | Verdict |
|---|---|
| "Iowa Substance Use Crisis Line 1-844-775-5837" | **REMOVE (blocking)** — [B] not in the governance-verified canon and not verifiable from Iowa HHS sources |
| 988 / 911 | **KEEP** (canonical) |
| Iowa Warm Line | **CHANGE** — publish **844-775-9276**, labeled as a *peer listening line (non-crisis)*, never as the crisis pathway [B: canon + test pin] |
| GFA contacts | **KEEP** if drawn from the canonical set (515-310-3425 warmline / 515-220-8771) |

### 3.6 Lifecycle

| Item | Verdict |
|---|---|
| Single-transaction Discover→Apply→Handbook→Consents→Sign→Submit | **CHANGE (blocking)** — restore the ratified lifecycle: Discover → **Apply (minimal)** → Review (staff queue) → Conditional acceptance → **Intake** (documents, medication disclosure, releases via canonical consent, agreement signature) → Admission. The canonical intake queue + document machinery already implement the back half in-app |

## 4. Disposition

**PUBLIC CLOUDFLARE DEPLOYMENT: HOLD — CONFIRMED.** Blocking items: write path (3.1),
encoding (3.1), Good-Samaritan overstatement (3.4), NARR overclaim (3.4), unverified crisis
number (3.5), signature-as-residency-agreement (3.3), single-transaction lifecycle (3.6).

**Safe path, in order:**
1. Drift reconciliation: capture the 3 EJWRH migrations into the repo lineage;
   record the anon-window deploy pattern as retired.
2. Rebuild the page as the **minimal application** (3.2 KEEP set), correctly encoded,
   canonical crisis numbers, verified policy language, application-stage attestation only.
3. Point its submit at the canonical `residence-intake` Edge Function (extend the field
   allowlist + origin allowlist for the EJWRH origin; enable Turnstile when fronted).
4. Front with Cloudflare at `recoveryresidence.org/ejwrh` (CSP/HSTS/WAF/Turnstile);
   keep the functions URL internal.
5. Build the intake stage on the canonical machinery (documents, canonical consent grants,
   versioned signature) — a separate implementation gate.
6. Only then deploy publicly. The current live exposure is acceptable in the interim solely
   because the table has 0 rows and the functions URL is unpublicized — but the anonymous
   write path is open now; if any of §3.1 cannot be fixed promptly, consider disabling the
   `ejwrh` function or its form until the fix lands (executive call — it is live today).

*Read-only audit. No live change, no deploy, no repo migration was made by this audit.*
