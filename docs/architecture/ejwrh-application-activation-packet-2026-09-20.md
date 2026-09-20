# EJWRH Application Activation Packet

**Date:** 2026-09-20 · **Status:** PREPARED DOCUMENTATION ONLY. No implementation, no Gate B, no Supabase Auth change, no Cloudflare change, no test application, no branch merge, no production change was made. Gate C remains separately closed (§15).

**Governance:** this file and the branch `claude/awesome-fermi-f3mzia` are prepared documentation only; do not merge, cherry-pick, rebase, deploy, or otherwise transfer without separate authorization. The RecoveryOS Control Tower implementation history remains separate.

Provisional decisions in force: **DRA-1** (route names + redirect map approved for staging prep, provided all existing routes stay functional via tested redirects), **DRA-2** (one canonical Worker with explicit hostname routing; prove no cross-host bleed; keep split-later option), **DRA-3** (prepare — not execute — a redirect of the `ejwrh` portal after traffic/dependency review), **DRA-4** (treat `.app` as the authenticated host; propose exact Auth URLs; change nothing yet), **DRA-5** (read-only Cloudflare evidence request only).

Evidence legend: **VERIFIED LIVE** (CQCX read this session) · **VERIFIED SOURCE** (repo on `main`) · **REQUIRES ACCESS**.

---

## 1. Exact current and proposed application routes

**Current (VERIFIED SOURCE):**
- Grace House apply: `/recovery-residences/grace-house/apply` (`ResidenceApplyPage` → `submitResidenceApplication` → `residence-intake`, residence_id 1).
- EJWRH apply (canonical working path): directory listing `applyUrl: '/residence/directory/?apply=ejwrh'` → `submitResidenceApplication` → `residence-intake`, **residence_id 2**. (VERIFIED LIVE: `residence_application_intake` holds 1 row for residence_id 2 — the path has produced a real record.)
- The Supabase `ejwrh` Edge Function URL is **not** a browser front door (served text/plain, origin-rejected by the receiver) — VERIFIED SOURCE comment.

**Proposed (DRA-1, staging prep):**
- `recoveryresidence.org/apply/ejwrh` → internally redirects to the existing working EJWRH pathway; **residence-intake stays the sole writer; residence_id 2 unchanged; no new writer.**
- `recoveryresidence.org/apply/grace-house` → existing Grace House apply flow (residence_id 1).
- `recoveryresidence.org/residences/ejwrh` and `/residences/grace-house` → public profiles (see §2; EJWRH profile is TO BUILD).
- Redirects preserve every existing URL (see §10).

## 2. Public-facing content review
- **EJWRH directory listing exists (VERIFIED SOURCE, `residenceListings.ts`):** name, "EJWRH · supported by Grace For Addictions", Des Moines/Polk, Men, "Peer-led · Iowa DOC approved", contact `515-220-8771 · ejwrh@rcoiowa.org`, wraparound-support description, `applyUrl` into the residence-intake path.
- **No EJWRH profile page exists** — only Grace House has a profile route today. `/residences/ejwrh` is **content to build** (eligibility, fees, participant rights link, apply CTA), modeled on the Grace House page.
- **Publication gate is CLOSED (VERIFIED LIVE):** `residences.is_public_directory = false` for **both** EJWRH (id 2) and Grace House (id 1). Nothing is published to the public directory yet; the directory listing is a static in-app dataset, distinct from the DB publication flag. Activation must decide whether public visibility is driven by the static listing, the `is_public_directory` flag, or both (see §7).
- Content must carry the ratified truths: EJWRH is a residence supported by GFA (GFA is provider/support, **not** a residence); MOUD/MAT-affirming per house policy; Iowa DOC approved; no fabricated capacity/fees until the inventory/fee data exists.

## 3. Intake ownership and authority matrix

| Concern | Authority | Notes |
|---|---|---|
| Application **writer** | `residence-intake` Edge Function (service role) | Sole canonical writer; do not create another. |
| **residence_id resolution** | Server-side in `residence-intake` (active-check) | Client never asserts a trusted id; slug→id resolved server-side. |
| **Public front door** | `recoveryresidence.org` (`.org`) | Public directory + application routes only. |
| **Operations / review** | `recoveryresidence.app` (`.app`) | Application review, admissions, beds, documents — authenticated. |
| **Canonical record** | CQCX `residence_application_intake` (+ downstream) | RLS/role-scoped; fixtures excluded. |
| **Turnstile / origin / consent / dedup guards** | `residence-intake` (VERIFIED SOURCE) | Origin allowlist already includes `.org`/`.app`; Turnstile hostname+action; missing-Origin reject. |
| **EJWRH residence record** | residence_id 2, organization_id 1 | Do not create another residence record. |
| **`ejwrh` Edge Function portal** | NO REDEPLOY (SUPA-FN-001) | Redirect-only per DRA-3; do not modify/retire yet. |

## 4. Exact Supabase authentication URL proposal (DRA-4 — propose only, change nothing)

**Auth implementation (VERIFIED SOURCE):** email/password. `signInWithPassword` (no redirect); `signUp` in `RegisterPage` (**no explicit `emailRedirectTo`** → email confirmation falls back to the project **Site URL**); `resetPasswordForEmail(email, { redirectTo: \`${window.location.origin}/reset-password\` })`; `ResetPasswordPage` consumes the recovery session at `/reset-password`. **No OAuth provider / no `exchangeCodeForSession` / no `/auth/callback`. No Supabase invite flow** (staff onboarding is `staff_preauthorizations` + normal signup, not `auth.admin.inviteUser`).

Minimum exact entries (production; authenticated host `.app` per DRA-4, exact paths, **no wildcard**):
- **Site URL:** `https://recoveryresidence.app`
- **Additional Redirect URLs:**
  - `https://recoveryresidence.app/reset-password` — password recovery (the one explicit coded `redirectTo`).
  - `https://recoveryresidence.app/` — signUp email-confirmation landing (Site-URL default, because `signUp` sets no `emailRedirectTo`). If a specific post-confirmation landing is preferred, set an explicit `emailRedirectTo` in Gate B and allow-list that exact path instead of `/`.
  - Staging (Gate B only): `https://recoveryos-staging.thomas-499.workers.dev/reset-password` and `.../` .
- **Do not add** `https://recoveryresidence.app/*`.
- **Open item:** because `resetPasswordForEmail` uses `window.location.origin`, the reset link's origin is whatever host served ForgotPassword. Under DRA-2, serve the auth pages **only on `.app`**, so the sole reset origin is `.app` — otherwise `.org/reset-password` would also need allow-listing. Recommendation: confine `/sign-in`, `/register`, `/forgot-password`, `/reset-password` to `.app`.
- **Password confirmation email:** confirm in Gate B whether "Confirm email" is enabled on the project; if enabled, the Site URL above governs the confirmation link. (Auth-config read is REQUIRES ACCESS; do not change it.)

## 5. Controlled direct-link pilot plan
- Keep EJWRH **out of the public directory** (leave `is_public_directory = false`) during the pilot.
- Share `https://recoveryresidence.org/apply/ejwrh` as a **direct link** only (DOC liaison, EJWRH operator, referral partners) — not indexed, not linked from the directory yet.
- Verify each real submission lands as a `residence_application_intake` row bound to residence_id 2, is reviewable on `.app`, and triggers the intended staff notification — without exposing applicant PII in chat/logs (aggregate confirmation only).
- Success criteria: N real applications routed, 0 misroutes, 0 writer errors, staff can review on `.app`. Then consider directory publication (§7).

## 6. Synthetic end-to-end test plan (staging only; no production submit)
1. Deploy the staging build (pinned commit, CI-gated) to `recoveryos-staging`.
2. From the staging origin, submit **synthetic-only** data through `/apply/ejwrh` with `INTAKE_TURNSTILE_OPTIONAL=true` on a **staging** secret (never production).
3. Assert: request carries an allowlisted Origin; server resolves residence_id 2; active-check passes; a `residence_application_intake` row is created on **staging/isolated** data (or, if pointing at CQCX, clearly fixture-flagged and cleaned) — **do not write synthetic rows to production CQCX.**
4. Assert dedup, consent allowlisting, and generic error envelopes behave; no anonymous read path exists.
5. Assert the redirect `/apply/ejwrh` → existing working route resolves and uses the same writer.
6. `.app` auth: verify sign-in, `/reset-password` recovery, and that an unauthenticated `.app` route redirects to sign-in; verify no `.org` route serves authenticated content and vice-versa (DRA-2 no-bleed proof).

## 7. Public-directory publication plan
- Decide the publication authority: the static `residenceListings.ts` dataset vs. the DB `residences.is_public_directory` flag vs. the `residence_listing_submissions` review→publish workflow (all exist; currently the DB flag is false for both residences).
- Recommended: make **`is_public_directory`** the single source of truth for public visibility, and have the `.org` directory read published residences server-side (slug→row), retiring the static list as the authority once parity is verified.
- EJWRH publication is a **separate gate after the direct-link pilot** (§5): flip `is_public_directory = true` for residence_id 2 only after content (§2), inventory/fees (§8), and operator model (§9) are settled. Not done here.

## 8. Bed-inventory operational-data plan
- **VERIFIED LIVE:** `residence_units`, `residence_rooms`, `residence_beds`, `bed_assignments` are all **empty**; EJWRH `capacity` is null. The tables exist (no schema gap) — this is **missing operational data**, classified NEEDS WIRING/DATA, not a migration.
- Plan: enter EJWRH's real units/rooms/beds and capacity through the authenticated `.app` `/beds` workspace (operator/admin authored), once the operator model (§9) establishes who may write them. Do not fabricate capacity/fees for public content until this exists.
- Sequence: operator model (§9) → `.app` bed-inventory entry → capacity/fee content on the `.org` profile → publication (§7).

## 9. Operator/provider master-data plan
- **VERIFIED LIVE discrepancy:** only one organization exists — Grace For Addictions (id 1, type `recovery_support`); `organization_relationships` = 0 rows; **EJWRH (residence 2) is `organization_id = 1`** — i.e., the data models EJWRH as GFA-owned, while its identity is "peer-led, Iowa DOC approved, **supported by** GFA." This conflicts with the directive that GFA is a provider/support org, **not** the residence's operator, and that partner residences are independently operated.
- Options (decision required; each is a **data-model change → future migration**, out of scope here):
  - **(a)** Create an EJWRH **operator organization** and an `organization_relationships` row expressing GFA→EJWRH *support/provider* (and EJWRH as operator); decide whether residence 2's `organization_id` stays GFA or moves to the operator org.
  - **(b)** Keep residence 2 under org 1 for now and represent "GFA-supported / peer-operated" via `organization_relationships` once its **taxonomy and access semantics are decided** (this is the same `organization_relationships` zero-policy semantic decision already parked in the Cognitive Data Architecture Gap Register).
- Constraint: whatever is chosen, **do not model GFA as a residence**, and **do not create a second EJWRH residence record**. This section stays a decision, not an action.

## 10. Redirect and legacy-portal plan
- Old→new public redirects (DRA-1; all must be tested so no live URL 404s):
  - `/recovery-residences` → `/residences` (301)
  - `/recovery-residences/grace-house` → `/residences/grace-house` (301)
  - `/recovery-residences/grace-house/apply` → `/apply/grace-house` (301)
  - `/residence/directory/?apply=ejwrh` → `/apply/ejwrh` (internal redirect; same writer, residence_id 2)
- **Legacy `ejwrh` Edge Function portal (DRA-3):** after a **traffic and dependency review**, redirect it to `https://recoveryresidence.org/apply/ejwrh`. Until that review + authorization: **do not retire, modify, or redeploy the function** (SUPA-FN-001 NO REDEPLOY holds). The prepared `sites/ejwrh/worker.prepared.js` stays **undeployed**.

## 11. Staging acceptance criteria
- All new public routes resolve on staging; all old→new redirects verified (301/302 as specified).
- `/apply/ejwrh` reaches the canonical writer and binds residence_id 2 (synthetic/isolated).
- `.app` auth: sign-in, `/reset-password`, unauthenticated redirect all pass; **no cross-host bleed** (public content never served on `.app`; authenticated content never served on `.org`) — DRA-2 proof.
- Turnstile behavior correct (fails closed without secret; hostname/action enforced).
- Directory publication remains **off** for EJWRH; no production application submitted.
- Mobile/accessibility smoke pass on new public routes.

## 12. Rollback plan
- All changes on `claude/awesome-fermi-f3mzia` (or a Gate B branch) → PR → CI green; production candidate is a pinned commit; revert = redeploy prior pinned commit (deploy workflow records exact commit/branch).
- No writer change and no residence/org data change in this packet → nothing to roll back at the data layer.
- Cloudflare/DNS: capture exact current bindings before any Gate C step (DRA-5); keep `vrcc.app` intact as the current production surface until `.org/.app` are proven.
- Supabase Auth: not changed here; if Gate C adds redirect URLs, they are additive and individually removable.

## 13. Decisions still required from Thomas
1. Confirm the §4 exact Auth URL set (and confine auth pages to `.app`).
2. Publication authority (§7): DB `is_public_directory` as single source of truth vs. static list.
3. Operator/provider model (§9): option (a) vs (b) — this drives a future migration and ties to the `organization_relationships` semantic decision.
4. Bed-inventory data ownership (§8): who authors EJWRH units/rooms/beds/capacity on `.app`.
5. `ejwrh` portal traffic/dependency review scope (DRA-3) before authorizing the redirect.
6. Grant read-only Cloudflare evidence access (DRA-5) so DNS/route/cert/rollback points can be captured before Gate C.
7. Whether EJWRH direct-link pilot (§5) precedes directory publication (recommended: yes).

## 14. Gate B authorization packet (requested scope — NOT yet authorized to execute)
On authorization, Gate B (staging only, no production DNS/publish) would:
- Implement the new `.org` public routes + redirects (DRA-1) and `.app` host routing with no-bleed proof (DRA-2), behind the existing manual, CI-gated staging deploy.
- Build the `/residences/ejwrh` profile + `/apply/ejwrh` internal redirect (same writer).
- Wire slug→residence server-side resolution.
- Run the synthetic E2E (§6) and produce staging evidence against the acceptance criteria (§11).
- Prepare (not apply) the exact Supabase Auth URL diff (§4) and the DRA-3 portal redirect.
- **Explicitly excluded from Gate B:** production DNS/publish, Supabase Auth config change, `residence-intake`/`ejwrh` redeploy, residence/org data changes, real application submission, branch merge.

## 15. Gate C authorization packet — SEPARATELY CLOSED
Gate C (production activation: bind `.org`/`.app` custom domains, publish EJWRH, add Auth redirect URLs, execute the portal redirect, capture DNS rollback) is **kept closed** and requires Thomas's explicit authorization **after** staging evidence. It is intentionally not detailed for execution here beyond the activation checklists already recorded in `recoveryresidence-domain-architecture-2026-09-20.md` §9.

_Prepared documentation only. No production, Auth, Cloudflare, data, deployment, or branch-merge action was taken._
