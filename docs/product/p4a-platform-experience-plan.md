# P4A — Platform Experience Plan (Product & Codebase Inventory, A–U)

**Date:** 2026-08-08 · **Backend:** RecoveryOS-Launch `cqcxvwoukyhxyokfwnjm` (the only backend) ·
**Frontend:** `apps/platform`. Inventory produced by two full code sweeps (app + packages) plus a
live check that **every RPC the app calls exists on the launch project (15/15 verified)** — no
material architectural conflict; P4A implementation proceeds.

Classifications: **KEEP · REFINE · EXTEND · RELOCATE · REPLACE · RETIRE**.

## A. Existing UI inventory (34 pages/components classified)

**Participant (7 nav + 5 utility):** CheckInPage (515 ln, ICARE Recovery Pulse w/ explainable
risk routing + warmline/988 — the best file in the repo) **KEEP** · TodayPage **REFINE** (add My
Support / Next Connection / Needs Attention per §8) · RecoveryCapitalPage **KEEP** (add read-back
later) · MyRecoveryPage **REFINE** (goals work; plan later) · MyJourneyPage **REFINE** (thin) ·
PrivacyConsentPage **KEEP** · ProfilePage **EXTEND** (read-only → editable preferred name/prefs) ·
ToolsPage **KEEP** · **ConnectPage (30 ln placeholder) REPLACE — the #1 P4B build** ·
LearnPage/ResourcesPage **REPLACE** (placeholders; resources will read the seeded 46-row canonical
directory) · ParticipantShell **REFINE** (nav overflow, see P).

**Public (8):** LandingPage, GraceHousePage, ResidenceDirectoryPage, ResidenceApplyPage,
MyApplicationPage, ListYourResidencePage **KEEP** (dedupe headers into a PublicShell — REFINE) ·
SignInPage/RegisterPage **REFINE** (role-aware landing; add forgot-password; wrap auth calls into
`@recoveryos/auth`).

**Resident (7 real + 2 honest placeholders):** all **KEEP** (Today, MyResidence, Schedule,
Documents+Detail w/ e-signature, Grievance, HouseBoard); placeholders (recovery, journey)
**EXTEND** in P4F by projecting the participant tooling.

**Staff (10):** all **KEEP** — bed board, applications+referrals, screenings, incidents,
NARR/Iowa compliance, fees, board, Exhibit E/supervision reports, multi-residence context. This
is production-quality residence ops and must not be rewritten; it **RELOCATES** under the
`/residences` umbrella in P4F.

**RETIRE (nothing yet):** no functioning surface is deleted in P4; the static directory site
duplication (`sites/recoveryresidence-directory` synced into `public/residence/directory/`) is a
P4F consolidation candidate, not a P4A action.

## B. Existing route inventory → C-route map (S)

Today: `/` (host-aware front door) · `/sign-in` `/register` · `/recovery-residences[/*]` public ·
`/onboarding` · `/app/*` participant (RequirePerson) · `/residence/*` resident (RequireRole
resident) · `/staff/*` residence staff (RequireRole residence_staff/manager) · `/home`→/app/today
· 404/not-authorized. Router: react-router 7 in v6 declarative mode, lazy per area.

## C. Existing data-access inventory

20 repository modules; coaching write surface fully RPC-backed (7 SECURITY DEFINER RPCs);
`db: {schema:'recoveryos'}` pinned; **zero** direct supabase calls in the app (2 auth-only
reaches in sign-in/register); **zero** legacy references in code (10 stale dev-era comments
listed for cleanup, P4A). Gaps for P4B–D: booking **reads** (proposals/requests are write-only —
UI can't show proposed times), message **send/mark-read/realtime**, notification
**mark-read/unread count**, follow_ups (zero references), slogans/resources DB reads (zero),
leads admin read, support-request detail/cancel; `createSupportRequest` is a raw insert
(convert to RPC or keep RLS-insert deliberately); `sessions.ts requestCoachingSession` inserts
directly into `appointments` — **RETIRE in favor of the booking domain**; `checkIns.createCheckIn`
duplicates pulse — RETIRE later.

## D. Auth / role routing today

AuthProvider: session → `people` by `auth_user_id` → `role_assignments` (revoked_at null) —
already canonical. Guards: RequireAuth/RequirePerson/RequireRole (navigation-only; RLS is the
boundary). Onboarding = person-existence via `ensure_person_for_current_user` (exists on launch ✓;
complements the 0103 signup trigger — idempotent, so both paths coexist safely).
**Gap:** post-login landing hardcoded to `/app/today` for everyone; `EXPERIENCE_ROLES` exists in
domain but is unused. **P4A fixes this** with a role-home resolver. No forgot-password anywhere
(P4A adds route stub; full flow P4B). Guards render null while loading (P4A: LoadingState).

## E–G. Participant / residence / staff experience state

See A. Summary: participant = excellent check-in + BARC-10, working goals/consent, three
placeholder destinations; resident = complete daily/house/docs/grievance loop; staff = complete
residence operations. The product's connection thesis (§3) is the missing middle.

## H–J. Missing workspaces

**Coach (P4C):** none exists — needs attention queue, open pool (fixture-aware RPC exists),
claim, My Participants, today's sessions, follow-ups. **Navigator (P4E):** none. **Admin
(P4G):** none — waiting-for-support, request aging, roles admin (staff_preauthorizations UI),
leads queue, system health. P4A creates role-guarded shells with honest "arriving in P4x" states.

## K. Connect-page gap analysis (primary P4B feature)

Current: two EmptyStates, zero data. Target states per directive §10: no-request (support-type
chooser mapping to canonical `support_requests.request_type`) → request-open (humane status,
elapsed time, cancel) → coach-claimed (coach identity, message, schedule). Everything needed
server-side exists (`support_requests` RLS insert, `claim_support_request`, relationships,
notifications); missing client pieces: request-detail read, cancel write, coach-profile read.

## L–N. Messaging / scheduling / follow-up UI status

None built. Server domains complete and DB-verified. Client gaps as in C. Follow-ups have no
repository at all (P4C).

## O. Component/design-system inventory

12 UI exports (Button/Card/Field/Alert/States/ThemeSwitcher/AppShell/PageHeader) — disciplined,
accessible (skip links, aria wiring, 44px targets, focus-visible). **Missing primitives P4 needs:**
Dialog (focus-trapped), Badge, Tabs, Toast/live-region, Skeleton, Select/Checkbox/Radio, Avatar,
Table. Tokens: brand green-teal + support purple + per-experience accents + 6 user-selectable
visual themes; semantic usage is consistent. No icon set (nav icons never supplied).

## P. Mobile / accessibility gaps

1. **Bottom nav silently truncates to 5 items** (participant loses Resources+Journey; staff loses
   4) — P4A adds a "More" overflow sheet. 2. No PWA (manifest/SW/icons) — P4H. 3. Two different
active-state algorithms mobile vs desktop — P4A unifies. 4. No toast/live-region announcements —
with Dialog primitive in P4B. 5. Guards' blank-screen loading — P4A. A11y baseline otherwise
strong; WCAG 2.2 AA audit is P4H.

## Q. Reuse vs replacement matrix (condensed)

REUSE AS-IS: staff+resident areas, check-in, BARC-10, consent, public residence pages, AppShell/
tokens/guards/data-access architecture. REFINE: Today, shells/nav, sign-in landing, ProfilePage.
REPLACE: Connect, Learn, Resources (placeholders). BUILD NEW: /coach /navigator /admin
workspaces, messaging UI, scheduling UI, follow-ups, notifications UI, role-home resolver, Dialog/
Badge/Toast/Skeleton primitives, PWA. RETIRE (deferred): `requestCoachingSession` direct insert,
duplicate check-in path, duplicate static directory site, stale dev-era comments (P4A cleans the
misleading ones).

## R. Final information architecture

One app, role-aware: participant bottom-nav (Home · Connect · Messages · Sessions · My Recovery ·
Resources · Profile — 7 with overflow) · staff/coach/navigator/admin responsive sidebar ·
residence experience keeps its resident/staff split under one umbrella. Shared design system,
shared person/identity, ExperienceSwitcher for legitimate multi-role users.

## S. Canonical route map (target ↔ transition)

| Canonical | Content | P4A action |
| --- | --- | --- |
| `/vrcc/*` | Participant experience | **Mount ParticipantArea here**; `/app/*` → 301-style splat redirect to `/vrcc/*` |
| `/coach` | Coach Workspace | Role-guarded shell (built P4C) |
| `/navigator` | Navigator Workspace | Role-guarded shell (built P4E) |
| `/residences` | Residence experience umbrella | Role-aware dispatcher → `/residence/*` (resident) or `/staff/*` (staff) now; full consolidation P4F |
| `/admin` | Operations | Role-guarded shell (built P4G) |
| `/home` | Role-home resolver | RoleHomeRedirect by role priority (admin→coach→navigator→residence staff→resident→participant) |
| `/recovery-residences/*` | Public directory/Grace House | KEEP unchanged (public links live) |
| `/residence/*`, `/staff/*` | Existing resident/staff areas | KEEP functioning; RELOCATE in P4F only after no dependency remains |

Note: public `/recovery-residences` and the static `/residence/directory/` site are unchanged in
P4A (live deployment behavior preserved per directive §4/§49).

## T. P4 implementation sequence

P4A shell+auth+routing (below) → P4B participant connection (Connect + home refinements +
notifications + Support Now wiring) → P4C Coach Workspace → P4D full messaging+scheduling loop →
P4E Navigator → P4F residence consolidation → P4G Admin → P4H a11y/mobile/PWA/perf hardening.
STOP-and-verify between each. Query-state decision (§36): **no new library in P4A**; hand-rolled
effect pattern is consistent; adopt TanStack Query at the start of P4B (when
messaging/notifications introduce cache-invalidation pressure) as a deliberate, single decision.

## U. Exact P4A implementation scope (this slice)

1. **Env → launch project:** `main.tsx` env fallbacks + `.env.example` point at
   `https://cqcxvwoukyhxyokfwnjm.supabase.co` + its publishable key (client-safe). Dev project no
   longer referenced by the app.
2. **Role-home resolver:** `homePathForRoles()` in `@recoveryos/domain`; new `RoleHomeRedirect`
   at `/home`; sign-in/onboarding navigate to `/home` (or `?next=`); multi-role priority admin →
   coach → navigator → residence staff → resident → participant.
3. **Canonical routes:** mount participant area at `/vrcc/*`; splat-redirect `/app/*`;
   role-guarded `/coach` `/navigator` `/admin` shells (honest arrival states); `/residences`
   role dispatcher; `/not-authorized` kept.
4. **Nav fixes:** participant nav paths → `/vrcc/*`; AppShell mobile overflow ("More" sheet) for
   >5 items; unified active-state logic.
5. **Loading boundaries:** guards render LoadingState instead of null.
6. **Auth wrap:** `signIn`/`signUp` moved into `@recoveryos/auth`; `/forgot-password` route with
   `resetPasswordForEmail` (in-app email via Supabase auth — this is auth mail, not notification
   fanout).
7. **Comment hygiene:** replace the four misleading dev-era comments in
   `coachingReads.ts`/`coachingWrites.ts`/`client.ts` (write_authority/v2 language) with
   launch-truth statements.
8. **Verify:** `pnpm typecheck` + `pnpm build` green; commit.

Success = directive §51 checklist; then P4A COMPLETE → P4B recommendation.
