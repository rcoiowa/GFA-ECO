# EJWRH Application Path + Shared Inquiry Workflow — Build Record (2026-09-01)

Additive, repository-only build. **Nothing deployed, no migration applied, no accounts, no
permissions, no notifications, no DNS/route change, no live-data change.** RecoveryOS
(GFA-ECO → CQCX) is the sole system of record; no Base44/YKY/legacy-VRCC source was used.

## Reconciliation: what already existed vs what this builds

**The EJWRH application/intake path already exists and is LIVE-VERIFIED** (this was the
Gate B + 0146 work): a visitor explicitly selects EJWRH by applying through the EJWRH
portal (edge function `ejwrh`, residence_id 2 hard-bound — selection is structural, never
inferred) or by an in-app application naming the residence; the submission enters the SAME
shared machinery Grace House uses — `residence_application_intake` queue → staff review →
identity-safe conversion (0144 lookup, "This is them" confirm — one person record, no
duplicates) → approval → the six-class readiness checklist (screening consent separate
from optional disclosure consent, per 0140's required-vs-optional consent boundaries) →
the six owner-approved EJWRH documents (activated 0146 at executively ratified content
hashes; 1 signature + 5 acknowledgments; e-consent gate + paper parity) → deliberate
admission. Full synthetic E2E ran green against live CQCX in a rolled-back transaction on
2026-08-31. **Approved documents used: only the six ratified editions — no conflicts
found.** (Known non-blocking open items, unchanged: verified retention period; archiving
the executed PSA paper copy.)

**What did NOT exist** (confirmed by repo-wide search): the six-stage inquiry workflow —
New/Assigned/Contacted/Waiting/Scheduled/Closed, owners, response deadlines, the shared
append-only contact log, duplicate-outreach prevention. `leads` (0102) had four statuses,
broad staff visibility, direct-update policies, and no contact log. This build adds that
layer, shared by every front door (website/Wix, Grace House, EJWRH).

## Changed files

| File | Change |
|---|---|
| `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql` | NEW, **prepared only — DO NOT APPLY**: six-stage `leads` lifecycle; explicit `residence_interest` (`grace_house`/`ejwrh`/`confirm_route`/`unspecified` — self-selected only, never inferred); `organization_inquiry` priority flag; `response_due_at`; `wix_submission_id` idempotency (unique); `linked_intake_id` → residence_application_intake (one thread, no disconnected duplicates); append-only `lead_contact_events` (RPC-only writes, immutability trigger, SELECT-only client grants); intake-only roles `intake_coordinator`/`intake_worker` (enum additions; text-comparison helpers avoid same-txn enum-literal use); least-privilege visibility (coordinators+admins all, workers assigned-only — **deliberately narrows** 0102's coach/navigator lead access); audited RPCs `assign_lead`, `record_lead_contact`, `set_lead_status`, `route_lead`, `find_duplicate_leads`, `list_intake_assignees`; proposed deadlines encoded (24h standard / 4h partnership) pending ratification |
| `supabase/functions/lead-intake/index.ts` | REPO-PREPARED receiver v3: accepts `submission_id` (idempotent duplicate return), `submitted_at`, `organization_inquiry`, explicit `residence_interest`; sets `response_due_at`. **Apply-order rule: 0147 first, then redeploy this function** |
| `supabase/launch/preflight/launch_contract_check.sql` | `lead_contact_events` added to RPC-only exceptions; six new RPC names added to the executability check (no-ops until 0147 applies) |
| `packages/data-access/src/repositories/leadsQueue.ts` (+ index export) | NEW: typed queue reads (RLS-scoped) + RPC wrappers |
| `apps/platform/src/staff/pages/InquiriesPage.tsx` (+ StaffArea route, StaffShell nav) | NEW staff queue at `/staff/inquiries`: six stages in human language, overdue-first ordering from response deadlines, partnership priority badge, explicit-pathway routing control, assignment picker (coordinator-only, hidden otherwise), inline contact logging (responder implied by session; time/channel/outcome/minutes/next follow-up), duplicate-outreach hint, honest empty states |
| `apps/platform/src/resident/pages/DocumentDetailPage.tsx` | Pinned-version fallback: renders the person's assignment's published DB version when no bundled residence-content module exists — makes all six EJWRH documents and Grace House Resident Rights render at `/residence/documents/:key` (closes the gap the side-branch `115934d` targeted, without its migration-collision merge; that commit is now fully SUPERSEDED) |
| `apps/platform/src/staff/pages/InquiriesPage.test.tsx`, `apps/platform/src/resident/pages/DocumentDetailPage.test.tsx` | 12 new tests (queue language/overdue/priority/explicit pathway/append-only logging/duplicate hint/coordinator-only picker; pinned-version fallback/NotFound honesty/signed confirmation) |

## Tests & verification (all green at commit time)

Typecheck ✓ · 159/159 platform tests (30 files) ✓ · build ✓ · governance guards
(intake-minimization, ICARE, no-retired-ref, view-privileges, intake-boundary) ✓.
The prepared SQL is **not** live-verified (deliberately unapplied); its RPC/RLS behavior
gets the rolled-back-transaction live test battery at activation, per the test plan in
`docs/plans/intake-activation-plan-2026-09-01.md`.

## Permissions model (as prepared)

- `intake_coordinator` (+ administrator/system_administrator): full queue, assign/
  reassign, routing. Intended: Thomas, Jill.
- `intake_worker`: sees and works ONLY inquiries assigned to them. Intended: Ashlee, Tara.
- Women's-pathway inquiries: routed on the person's explicit selection to Archaletta —
  **blocked on identity verification** (no account exists). Men's housing: Thomas.
  Ambiguous: `confirm_route` for a coordinator to confirm **with the person**.
- All lead mutations are audited SECURITY DEFINER RPCs; the contact log is append-only at
  three layers (no policies, no client write grants, immutability trigger).
- Alerts carry minimum detail (existing in-app trigger; no message bodies in any email).

## Status ladder (explicit)

| Layer | Status |
|---|---|
| EJWRH residence application → intake → documents → admission | **END-TO-END VERIFIED (live, synthetic, rolled back — 2026-08-31)**; public portal live at its Supabase URL; public route cutover NOT done (vrcc.app/zone blocker) |
| Six-stage inquiry workflow (this build) | **SOURCE COMPLETE + BUILD/TEST COMPLETE** (repo tests only) |
| Inquiry workflow live behavior | **NOT deployed, NOT applied — PILOT CANDIDATE after gates** |
| EJWRH documents rendering in resident Documents area | SOURCE + TEST COMPLETE (fallback); live after next authorized deploy |

## Unresolved document/decision items

1. Identities/accounts/roles for Jill, Tara, Archaletta (none exist) — gates assignment
   routing and the worker lane.
2. Ratification of deadline values (24h / 4h) and notification content.
3. Wix payload additions (`submission_id`, `submitted_at`, `organization_inquiry`,
   `residence_interest`) — Wix-side edit by Thomas.
4. The deliberate access narrowing (coaches/navigators lose generic lead visibility) —
   confirm intended.
5. Standing non-blockers: retention period; executed-PSA copy archival.

## Exact steps before public activation (in order, each gated)

1. Thomas: resolve unresolved items 1–4 above.
2. Apply `0147` to CQCX (move prepared → migrations ledger, apply, preflight PASS).
3. Redeploy `lead-intake` from the repo (AFTER 0147).
4. Grant intake roles to the verified identities (audited, least privilege).
5. Deploy the app build to `recoveryos-staging` (ACTIVE PILOT — explicit authorization).
6. Synthetic staging battery (rolled back / fixture-marked only): Wix POST ±secret,
   idempotent duplicate, coordinator/worker RLS matrix, reassignment, append-only log,
   deadline/overdue, explicit-pathway routing incl. EJWRH, partnership priority,
   privacy boundaries.
7. Wix automation edit (new fields) + one synthetic end-to-end from the real form.
8. Report results; **separate production-cutover decision** (vrcc.app remains blocked at
   cutover step 6 on the zone/registrar question — unrelated to and not waiting on this).
