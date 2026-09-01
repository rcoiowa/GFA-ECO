# Shared Intake Activation — Phase 1 Verification & Phase 2 Plan (2026-09-01)

Wix Contact Connect → RecoveryOS tracked intake. Phases 1–2 only; **no Phase 3 action has
occurred** (no migration applied, no deploy, no accounts, no notifications, no permission
grants, no Wix change, no DNS/domain change). Labels: **[VERIFIED]** current state ·
**[REPO-ONLY]** safe repository change · **[STAGING-AUTH]** staging action needing
authorization · **[PROD-AUTH]** production action needing separate authorization ·
**[UNRESOLVED]**.

## Phase 1 — Verified state

1. **Canon [VERIFIED]:** repo `rcoiowa/GFA-ECO`; canonical working line
   `claude/recoveryos-canonical-audit-1pvcwr` (docs HEAD `7e2cece`; deployed build
   `ec36922`); `main` 61 commits behind; GitHub default-branch setting is the stale
   `claude/supabase-mcp-setup-ep29rp` husk; backend CQCX `cqcxvwoukyhxyokfwnjm`, ledger
   tail `0146`; Cloudflare staging target = Worker `recoveryos-staging` (**ACTIVE PILOT —
   real users; any deploy to it is [STAGING-AUTH], never routine**). Path to `main` is the
   already-recorded fast-forward decision — a separate authorized act, not part of this
   workflow.

2. **The actual intake foundation [VERIFIED] — a material correction.** The six-stage
   coordinator/worker foundation described in the tasking (New/Assigned/Contacted/Waiting/
   Scheduled/Closed, founder deadlines, confirm-route, partnership priority, append-only
   contact log, dedup structure) **does not exist anywhere in this repository** — not on
   the canonical line, `main`, or any branch (searched all 22). What exists and is
   evidence-verified:
   - `recoveryos.leads` (0102): statuses `new/contacted/converted/closed`,
     `assigned_to_person_id`, RLS, staff-notification trigger.
   - Edge function `lead-intake` (deployed v11 ACTIVE): Wix POST guarded by the
     `x-lead-secret` shared secret; fields first/last name, email, phone, message,
     interest (accepts legacy `pathway_interest`), readiness, source; optional
     internal-only Resend staff alert; service-role insert (no anon table access).
   - **The pipeline is LIVE: 2 real inquiries sit in `leads`, both `new`, unassigned;
     newest 2026-09-01 06:18 UTC.** Real people are waiting on this queue today.
   - `follow_ups` machinery, deny-by-default posture for RPC-only tables, and public
     Support Now (no account, no participant data) — all previously verified.
   Everything beyond this is new work, planned below — never to be represented as built.

3. **No legacy contamination [VERIFIED]:** zero Base44 references in canonical app/
   function/migration code; deploy workflows' bundle guards assert CQCX-only; the one
   `wix_contact_submissions` mention is a historical comment describing what 0102 replaced.

4. **Wix payload [PART-VERIFIED / UNRESOLVED]:** the receiver's contract is verified
   (above). The current payload has **no stable submission identifier, no source
   timestamp, no organization-inquiry indicator, and no explicit housing-path field** —
   dedup on Wix retries currently has nothing to key on. Verifying what the Wix
   automation actually sends, and adding fields, requires the Wix dashboard
   (**Thomas — [UNRESOLVED]**). Integration auth stays the existing shared secret
   (already safe: server-to-server, secret in header, service-role writes).

5. **Identities [PART-VERIFIED]:** accounts exist for `thomas@` and `ashlee@`
   (graceforaddictions.org). **No accounts exist for Jill, Tara, or Archaletta**
   (checked; `archaletta@graceforaddictions.org` absent) — so routing to Archaletta and
   the Ashlee/Tara worker lane are **[UNRESOLVED]** until Thomas confirms each identity,
   email, and role, and accounts are created (a gated act). Also unresolved: the role
   vocabulary has no `intake_coordinator`/`intake_worker` keys — decision needed whether
   to add two narrow role keys (recommended: least-privilege, intake-only) or overload
   existing roles.

6. **Proposed response deadlines (proposals for ratification, not policy):** standard
   inquiry — first human contact attempt within **1 business day**, follow-up cadence
   every 2 business days until Contacted, auto-flag overdue at deadline+1 day.
   Partnership/organization inquiry — acknowledge **same business day (≤4 business
   hours)**, Thomas assigned by default with a **2-business-day** substantive-response
   deadline, outcome logged before Close.

7. **Proposed notification content (minimum necessary):** in-app (canonical channel):
   "New inquiry #<id> · pathway: <interest> · due <date>" — no message body, no contact
   details in the notification itself (details visible in-app under RLS). Optional email
   alert (existing Resend hook): same minimal line, **no PII beyond first name**.
   Operational caveat [VERIFIED]: vrcc.app has no live SPF/DKIM, so Resend alerts risk
   spam-foldering until the DNS blocker resolves — recommend in-app-only until then.

## Phase 2 — Activation plan

| # | Item | Plan | Label |
|---|---|---|---|
| 1 | Branch/PR | Implement on the canonical line (`claude/recoveryos-canonical-audit-1pvcwr`), single PR titled "Shared intake workflow (leads v2)"; exact-SHA CI required | REPO-ONLY (PR open = REPO-ONLY; merge = gated) |
| 2 | Migration `0147_shared_intake_workflow` | Extend `leads.status` to `new/assigned/contacted/waiting/scheduled/closed` (map existing: `converted`→kept for lineage or closed-with-outcome; no data loss); add `wix_submission_id` (unique where not null), `submitted_at`, `organization_inquiry` bool, `housing_path` (`explicit_womens/explicit_mens/unspecified` — self-selected only, never inferred), `response_due_at`, `route_state` (`routed/confirm_route`); new append-only `lead_contact_events` (RPC-only writes, deny-by-default, no UPDATE/DELETE policies); RPCs: `assign_lead`, `record_lead_contact`, `set_lead_status`, `route_lead` — coordinator/worker authorization inside; dedup: unique wix id + advisory duplicate warning on matching email/phone within 30 days (warn, never auto-merge) | REPO-ONLY to write; **applying to CQCX = STAGING-AUTH** (single live DB) |
| 3 | Permission model | Two new role keys `intake_coordinator` (Thomas, Jill: full queue, assign/reassign) and `intake_worker` (Ashlee, Tara: assigned-only visibility); RLS on leads/contact events keyed to them; women's-pathway routing target Archaletta — activation blocked on identity verification | REPO-ONLY (code); **role grants = gated on identity verification** |
| 4 | Wix changes | Add to the automation payload: `submission_id`, `submitted_at`, `organization_inquiry`, `housing_path` (explicit self-selected choice), keep shared secret; receiver updated to accept + map them (backward compatible) | Receiver code REPO-ONLY; **function redeploy = STAGING-AUTH**; Wix edit = Thomas |
| 5 | Notification behavior | In-app via existing trigger, minimal content (§7 above); partnership inquiries additionally notify the intake-coordinator group and set founder deadline; email alerts stay OFF until identities verified and DNS blocker resolved | REPO-ONLY; delivery activation gated |
| 6 | Duplicate-check | Unique `wix_submission_id`; soft-match banner ("possible existing inquiry") in queue UI; append-only contact log is the anti-duplicate-outreach mechanism — check log before outreach is the workflow rule | REPO-ONLY |
| 7 | Staging deployment | `recoveryos-staging` via `deploy-staging.yml` — but staging is ACTIVE PILOT, so this deploy needs explicit authorization | STAGING-AUTH |
| 8 | Test plan | Unit+component suite additions; synthetic staging tests: Wix POST (with and without secret), dedup on repeated submission_id, coordinator vs worker visibility (RLS matrix), reassignment, contact logging append-only, deadline derivation, confirm-route on `unspecified` housing path, partnership priority path, privacy boundaries (worker cannot read unassigned leads) — mirroring the rolled-back-transaction live-test pattern used for Gate B | REPO-ONLY to write; live synthetic run = STAGING-AUTH |
| 9 | Rollback | Migration is additive (status-check widening + new columns/table); rollback = restore prior status check, drop new RPC grants; function rollback = redeploy prior version; no data destroyed | documented |
| 10 | Production cutover | Not part of this workflow; the vrcc.app cutover remains BLOCKED at step 6 on the DNS/zone question, unchanged | PROD-AUTH (separate) |

### Decisions required from Thomas before Phase 3

1. Confirm identities/emails/roles: Jill (coordinator), Ashlee + Tara (workers),
   Archaletta (women's-pathway recipient) — accounts do not exist for three of them.
2. Approve the two new intake role keys (or direct an alternative mapping).
3. Ratify the response-deadline values (§6) and notification content (§7).
4. Confirm the Wix payload additions and make the Wix-side edit when the receiver is ready.
5. Authorize: 0147 apply to CQCX; staging deploy; synthetic staging test run.
6. Interim handling of the **2 real unassigned inquiries already in the queue** — they
   should not wait for this build: recommend Thomas/Ashlee work them manually now via
   the existing staff surface, logging contact in the current machinery.

## Phase-end report

**Completed:** Phase 1 verification and reconciliation; Phase 2 plan (this document).
**Verified evidence:** live leads queue (2 new, unassigned, newest 2026-09-01 06:18Z);
lead-intake v11 contract; 0102 schema; zero Base44 refs; account existence for 2/5 staff;
absence of the described six-stage foundation anywhere in the repo.
**Unresolved:** three staff identities; Wix payload field confirmation; role-key decision;
deadline/notification ratification; all Phase 3 authorizations.
**Next decision required:** the six items above — item 1 (identities) and item 6 (the two
live inquiries) first.
