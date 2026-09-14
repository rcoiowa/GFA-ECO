# Authoritative intake write-map (2026-09-14)

**Purpose:** INTAKE-001 — one canonical map of every public/client/service-role
write path into intake-related data, reconciling live 0122 state, prepared 0147,
the superseded contact-connect 0147, and the blocked R1 workstream.
**Method:** repository sources (main + PR #7 lineage + contact-connect branch),
the 0146-lineage replay catalog, and the carried-forward 2026-09-14 Control
Tower live evidence. **No change is applied by this document.** Live CQCX
confirmation items are listed at the end.

## 1. Live write paths (lifecycle: APPLIED/DEPLOYED per carried-forward evidence)

| # | Path | Trust boundary | Target(s) | Guards today | Notes |
|---|---|---|---|---|---|
| W1 | anon PostgREST INSERT | anon key, direct | `recoveryos.referrals` | RLS policy bounds (`status='received'`, unhandled); column grants; `referrals_id_seq` only | The only direct anon table write. LIVE. |
| W2 | Wix automation → `lead-intake` EF (v11) | shared secret `x-lead-secret`; service role inside | `recoveryos.leads` INSERT | fails closed without secret; fields clipped; empty leads rejected | Fan-out via `trg_lead_notify` (production-recipient filter arrives with 0148). Successor to the legacy `public.wix_contact_submissions` pipeline. |
| W3 | Public housing forms → `residence-intake` EF (v2) | origin allowlist; honeypot; size caps; Turnstile optional; service role inside | `residence_listing_submissions`, `residence_application_intake` INSERT | `main` source: rejects mismatched Origin but ACCEPTS missing Origin; Turnstile skip-when-unset; `residence_id` client-supplied | PR #7 hardens all of this (see the PR #7 review). Which source the live v2 runs is unproven (SUPA-FN-001). |
| W4 | `ejwrh` EF (v2) portal page | page served from the functions origin; its inline form posts to W3 | (indirect, via W3) | The functions origin is deliberately NOT in W3's allowlist, so the inline form path is dead by design; the working public path for both houses is the recoveryresidence.org directory forms; phone/email fallback always works | Source exists ONLY on the PR #7 lineage — provenance blocker (F-EF1). |
| W5 | Authenticated PostgREST direct on `leads` | authenticated + staff policies | `leads` INSERT/SELECT/UPDATE grants | policies ride `is_support_staff`-era predicates (classification-guarded once 0148 applies) | Prepared 0147 deliberately NARROWS this: select = intake roles + assignee; mutations RPC-only. |
| W6 | Authenticated PostgREST direct on `referrals` | authenticated | INSERT/SELECT/UPDATE | staff policies | Review for the same RPC-only narrowing at 0147-activation time. |
| W7 | In-app applicant flow | authenticated self | `recoveryos.residence_applications` (0018) | self-scoped policies | A DIFFERENT stage than pre-account `residence_application_intake`; conversion path exists (0142 readiness, 0144 lookup — applied). Keep the two stages distinct; never collapse. |
| W8 | Staff conversion/review RPCs | authenticated staff | intake review/convert RPCs (0122/0142/0144) | SECURITY DEFINER envelopes | Covered by the 0148 predicate guard once applied. |

## 2. Contained / legacy / inactive (do not build on)

| Path | State |
|---|---|
| `public.housing_applications` (EJWRH drift table) | DEPRECATED + CONTAINED (0123 hardening, 0138 containment; fresh Sep-14 check: no direct anon/auth privileges). Physical disposition belongs to a future cleanup gate. Live re-confirmation still pending. |
| `public.wix_contact_submissions` legacy pipeline | SUPERSEDED by W2 per lead-intake's own header. Live table/trigger state unverified — confirmation item. |
| `notify-fanout`, `coaching`, v2-targeting `create-meeting` | Legacy v2-era paths (LEGACY-001); not intake writers; convergence handled outside intake scope. |

## 3. The two 0147s — reconciliation

- **Canonical:** `supabase/launch/prepared/0147_shared_intake_workflow.prepared.sql`
  (PR #7 lineage). GOVERNS per the recorded 2026-09-03 executive supersession
  decision. PREPARED / NOT APPLIED; CQCX ledger has no 0147.
- **Superseded:** `supabase/launch/migrations/0147_intake_workflow_foundation.sql`
  on `claude/contact-connect-intake-foundation` (commit `0cd3611`). Despite
  sitting in the `migrations/` directory with an applied-style number, it is
  **NOT applied** (ledger tail 0146; `intake_contact_events` absent live). It
  must never be applied or merged as an alternate foundation — its directory
  placement is a foot-gun: any tooling replaying that branch's `migrations/`
  would apply a superseded schema under a colliding number. **Recommendation:**
  when that branch's evidence is next touched, move the file to a clearly
  non-applying path (or land a tombstone note) under its preservation
  condition. Its 6-item reconciliation queue (membership table vs roles,
  routing-rules table, extra lead columns, contact-events field coverage,
  verify script, Phase-1 identity list) remains OPEN in the supersession
  decision and is not closed by this map.

### 0148 interaction — REVISE required before 0147 activation (new finding)

Prepared 0147's `is_intake_coordinator()` / `is_intake_worker()` query
`role_assignments` **directly** (text-matching `administrator` /
`system_administrator` too) and never consult classification — they bypass the
0148-guarded `has_role()` exactly the way `staff_residence_ids` did. Applied
as-is after 0148, the intake queue would be readable/workable by a
`test_fixture` administrator again, reintroducing the P0 bypass on the newest
surface. **Before activation, 0147 must be revised to:**

1. add the classification guard to both helpers (or route them through
   `has_role`), and
2. extend `recoveryos.is_privileged_role()` to include `intake_coordinator`
   and `intake_worker` (0148's vocabulary predates these enum values), and
3. extend `scripts/verify-0147-prepared.mjs` to pin both invariants, and
4. re-replay 0001–0149 + revised 0147 with fixture-actor negative tests.

## 4. R1 (public residence ingress) — unchanged posture

R1 remains BLOCKED/PROPOSED (`docs/plans/r1-front-door-correction-design-2026-09-07.md`
on the PR #7 lineage is a design, not implementation authority). The ratified
requirements it must deliver: explicit topology decision (thin gateway vs
direct receiver — no unsafe hybrid), server-authoritative residence binding
(today W3 trusts a client `residence_id`; PR #7 adds active-residence
validation, which is necessary but not the full server-binding requirement),
required-vs-optional consent split (note: today W3 stores
`consent_to_contact` as submitted, possibly false, while requiring a contact
method — G4 must define whether contact then happens at all), duplicate
prevention/idempotency, and residence-specific E2E for Grace House and EJWRH.

## 5. Recommended canonical intake architecture (RECOMMENDATION — nothing applied)

1. **One inquiry spine:** `recoveryos.leads` for every general inquiry (W2),
   with prepared-0147's six-stage lifecycle, append-only
   `lead_contact_events`, RPC-only mutations, and narrowed intake-role
   visibility — after the §3 REVISE.
2. **One pre-account housing intake:** `residence_application_intake` via the
   hardened `residence-intake` receiver (PR #7 version: missing-Origin
   rejection, fail-closed Turnstile with governed opt-out, siteverify
   hostname+action pinning, active-residence validation, canonical
   `residence_application` kind with legacy alias, generic error envelopes).
   `ejwrh` stays presentation-only posting into it (its hard-bound
   `residence_id 2` is server-rendered, satisfying server-authoritative
   binding for that page); the directory forms remain the working public path
   until R1's topology decision.
3. **One thread doctrine:** an inquiry links to at most one application intake
   (`linked_intake_id` unique), never duplicate records; conversion to the
   in-app `residence_applications` stage stays a deliberate staff/participant
   act (0142/0144).
4. **Anon surface:** keep only the bounded `referrals` INSERT short-term;
   candidate for later convergence into a receiver, low priority.
5. **Retire/confirm-dead:** `public.housing_applications` (cleanup gate),
   `wix_contact_submissions` pipeline (confirm inert live), the contact-connect
   0147 file placement (§3), legacy v2 function paths (LEGACY-001).
6. **Activation order (all gated, each with its own authority):**
   0148 → 0149 → revised 0147 replay + apply → updated `lead-intake` redeploy
   (the prepared file's apply-order rule) → R1 topology ratification →
   hardened `residence-intake`/`ejwrh` redeploy with Turnstile secrets set →
   legacy retirements.

## 6. Live-confirmation items (need an authenticated CQCX session)

1. Ledger has no 0147 row and `intake_contact_events` remains absent (re-confirm at apply time).
2. `public.housing_applications` still has zero client privileges; row count still 0.
3. `wix_contact_submissions` table/trigger state (exists? privileges? writers?).
4. Which source SHA each of `lead-intake` v11 / `residence-intake` v2 / `ejwrh` v2 actually runs (SUPA-FN-001).
5. Which secrets are set per function (`LEAD_INTAKE_SECRET`, `TURNSTILE_SECRET`, `INTAKE_TURNSTILE_OPTIONAL`, Resend keys) — names only.
6. Register correction: MIG-0122 lifecycle is **APPLIED** (its objects are live-verified), with only the refit question remaining.
