# RecoveryOS Build Manifest

Running record of what exists, per phase. Update in the same commit as the work.

## Consolidation Phase 0–1 — Preserve, register, audit ✅ (2026-07-29)

- All five legacy source builds identified, cloned (`source-builds/`, gitignored), and
  audited; vrcc.app confirmed Git-backed (repo `Grace-For-Addictions/vrcc.app` →
  Worker `virtualrecovery`) — the "non-Git build recovery" task is closed.
- Registries: `docs/source-inventory/` (deployments, source routes, feature matrix,
  data sources, component preservation). Migration strategy: `docs/migration/`.
- Architectural pivot to one route-separated platform app recorded in ADR-0010/0011;
  `apps/vrcc` + `apps/resident` merged into `apps/platform` with lazy-loaded
  experience areas, `[data-experience]` theming, and an experience switcher.
- Legacy deployments labeled SOURCE; none modified.

## Phase 0 — Foundation decisions ✅

- Product architecture: `docs/architecture/product-architecture.md`
- Route registry: `docs/architecture/route-registry.md`
- ADRs 0001–0009: `docs/decisions/`
- Data dictionary: `docs/data-dictionary/README.md`
- Canonical terminology: participant / resident / residency / enrollment / service event /
  delivery context (see domain enums)

## Phase 1 — Platform foundation ✅ (code complete; DB push pending credentials)

- Monorepo: pnpm workspaces, strict TS, Prettier
- Design system: `packages/design-tokens` (core + 3 themes), `packages/ui`
  (Button, Card, fields, Alert, Empty/Loading/Error states, AppShell, PageHeader)
- Domain: `packages/domain` (enums, entities, zod schemas)
- Data access: `packages/data-access` (Supabase singleton + repositories)
- Auth: `packages/auth` (AuthProvider, RequireAuth/RequirePerson/RequireRole)
- Safety: `packages/safety` (Support Now ladder + dialog, grounding practice)
- Database: `supabase/migrations/0001–0009` (full schema + RLS), `supabase/seed/seed.sql`
- API gateway: `workers/api` (health/version skeleton)
- Validation: `pnpm typecheck` clean (9 projects), `pnpm build` clean (2 apps)

**Database deployed (2026-07-29):** migrations 0000–0011 applied to the live
project as the `recoveryos` schema; reference data seeded; PostgREST exposure
configured; security advisors run (one warning fixed, deny-all/GraphQL-visibility
notes documented). Live E2E validated in a real browser: register → person
provisioning → check-in → consent → goal → resident-area denial, with all rows
verified server-side and test data removed. Client (`packages/data-access`) now
targets the `recoveryos` schema.

## Phase 2 — VRCC participant experience ✅ (initial)

- `apps/platform` `/app` area: landing, register, sign-in, onboarding provisioning
- Seven destinations: Today, My Recovery (working goals), Connect, Learn, Tools,
  Resources, My Journey (working check-in history)
- Working engines wired: daily check-in, goals, granular consent management
- Support Now on every screen; grounding practice; 404/not-authorized pages

## Phase 3 — Shared recovery service engines ◐ (in progress)

**Done (2026-07-29):** Recovery capital engine — canonical BARC-10 instrument
(`packages/domain/src/instruments/barc10.ts`, merged from the vrcc MVP module with the
soil-type framing preserved), assessment flow at `/app/tools/recovery-capital`,
`service_events` attribution now emitted by both check-ins and assessments
(migration 0012 self-insert policy; `recordSelfServiceEvent`). Live-validated:
assessment saved (score 44 → Thorny Soil), two vrcc-context service events recorded,
`analytics_people_served` deduplicates correctly.

**Remaining:** sessions/appointments engine, content engine (Brain Atlas, Recovering
the Mind, Training the Mind, Tapes We Carry, 59 slogans — canonical content intake
needed), goals→service-event linkage, Walls of Honor.

## Phase 4 — Resident experience ✅ (2026-07-30; DB push of 0013+seed pending)

- **Canonical document library** (`packages/residence-content`): 24 versioned
  documents — Resident Agreement, Rights & Responsibilities, House Guidelines,
  Fee Schedule & Refund Policy, Screening Policy & Consent (the 5-document
  move-in signature set), plus 11 policies (grievance, return-to-use,
  medication/MAT, naloxone/overdose, emergency, guests, good neighbor,
  confidentiality/42 CFR Part 2, property, transition/move-out, code of
  ethics) and 8 forms (intake, emergency contact, ROI, medication disclosure,
  move-in inventory, pass request, grievance, incident report). All
  person-first / trauma-aware / neuro-informed / grace-based per
  `docs/language-guide.md`.
- **Generation**: `pnpm generate:residence-docs` → `supabase/seed/documents_seed.sql`
  (templates + versions) and printable `docs/residence-documents/` (ADR-0012).
- **Signing flow**: migration 0013 (`requires_signature`, read policies,
  self-acknowledge policy, `ensure_my_document_assignments()` RPC);
  Documents page lists pending signatures, full library, signed history;
  DocumentDetail renders markdown + typed-name e-signature.
- **Residence operations wired**: Today (chores due today, tonight's curfew),
  My Residence (weekly chores, curfew table, rights links), Schedule
  (meetings, curfew, pass request + history), grievance filing (digital +
  paper parity).
- **Compliance**: `docs/compliance/narr-3.0-level-2-mapping.md` (4 domains /
  10 principles / 31 standards → evidence) and
  `docs/compliance/iowa-hhs-recovery-residence-checklist.md` (470-0025).

**Reconciled with canonical rules (2026-07-30):** the uploaded Grace House
operational document set (v2 — 19 .docx, stored at
`docs/source-documents/grace-house/`) is now the authoritative source; the
library was re-imported verbatim via `scripts/import-grace-house-docs.py`
(19 documents: Participant Agreement, Code of Conduct, Resident Handbook,
Fee Schedule & Financial Agreement, Screening Policy & Consent,
Medication & MAT/MOUD, Curfew & Pass, Return-to-Use Response, Grievance,
Incident Report System, Emergency Response Protocols, Good Neighbor,
Exit & Transition, Code of Ethics, Change Course Leaders, NARR II
Self-Assessment, Application & Pre-Screening, Intake Forms Package,
Complete Operational System). Key canonical facts: women's residence at
1311 9th St; phase-based curfew (GH-CURFEW-001 v3.0) and recovery
activities 4/3/2 (GH-RECOVERY-001 v2.0); fees $175/$650 shared,
$200/$700 single (GH-FEES-001); IRP within 72 hours; coach at intake with
daily VRCC check-ins; MCRSP as certifying affiliate; the real 7-item Iowa
HHS checklist. Compliance mappings rewritten against the Integration
Plan's clause-level table (`docs/source-documents/`). EJWRH (men's, 1414
12th St) added to the residence seed. The RecoveryResidence.org directory
prototype with the staged Grace House application process lives at
`sites/recoveryresidence-directory/` (its online-application submit is
the integration point for the VRCC intake API).

**Database deployed (2026-07-30):** migration 0013 applied live; all 19
document templates + published versions seeded (full bodies for the 8
signature documents; version-pinning pointer bodies for the rest — app
renders those from the bundle); EJWRH residence seeded; security advisors
clean of new findings.

- **Pending**: staff-side assignment/countersign tooling (Phase 5); VRCC
  Recovery Residence Provider Hub build per the Integration Plan (operator
  dashboard, bed management, compliance tracker, referral portal, public
  directory backend); optional CLI sync of full bodies for non-signature
  document versions.

## Phase 5 — Staff workspace / Provider Hub Room 1 ✅ initial (2026-07-30)

- **Migration 0014 (applied live):** residence public-profile fields
  (address, contact, population, NARR level/status/affiliate MCRSP, room
  fees, MAT/supervision flags), `residency_phases` (override of the derived
  1–30/31–90/91+ phase), `fee_ledger`, incident 4-level `severity`,
  `narr_standards` (82 Level II rules seeded from the Integration Plan) +
  `narr_compliance`, `iowa_checklist_items` (the 7 470-0025 items) +
  `iowa_checklist_status`, and the full staff RLS layer
  (staff_residence_ids scope: people, residencies, applications,
  units/rooms/beds, bed_assignments, passes, chores, meetings, curfew,
  phases, fees, compliance). Both residence profiles seeded live.
- **Domain:** `packages/domain/src/phases.ts` — GH-CURFEW-001 v3.0 and
  GH-RECOVERY-001 v2.0 as code (phase, curfew tonight, activities/week,
  coaching cadence, next-phase date).
- **Staff app** (`/staff`, professional theme, lazy shell, roles
  residence_staff/residence_manager, multi-residence picker): Today
  (occupancy stats, open applications, pass approvals), Bed Board (live
  bed grid, assign/release), Applications (review → approve opens the
  residency; waitlist; refer-elsewhere framing), Screenings (log +
  prescription-consistent vocabulary + return-to-use prompt), Incidents
  (4-level classification, facts-only guidance), Compliance (Iowa 7-item
  - NARR 82-rule trackers with per-domain progress), Fees (ledger,
    balance, hardship-first framing).
- **Room 2 upgrades:** resident Today shows the phase card ("You are
  here — here is what comes next": phase, day, curfew tonight,
  activities/week, next phase date); My Residence shows the fee balance
  and recent ledger with the hardship-plan promise.

## Phase 6 — House board + supervision reports ✅ initial (2026-07-30)

- **Migration 0015 (applied live):** `house_posts` (announcements, meeting
  notes, milestones, gratitude; pinning; residents may post
  milestone/gratitude, staff post all categories) + staff read policies on
  `service_events` and `check_ins` scoped to their residences.
- **Room 2 complete:** the resident Connect area is the house community
  board — "feels like belonging, not a bulletin board" — with resident
  milestone/gratitude posting. Staff manage the board from /staff/board.
- **Room 4 seed:** /staff/reports compiles the 90-day supervision
  compliance report from live participation data (phase, check-in
  engagement, house-meeting attendance, documented service events,
  screenings with prescription-consistent vocabulary, fee status) with an
  ROI attestation gate before printing.

## Phase 7 — Referral intake loop ✅ initial (2026-07-30)

- **Migration 0016/0016b (applied live):** `referrals` table with public
  (anon) insert restricted to status='received', staff-scoped triage
  read/update, and the anon grants the public form needs. Validated live
  with an anon-role insert (rolled back).
- **Directory site wired to the database:** "Partner Referral" buttons on
  the Grace House and EJWRH pages open a form that POSTs straight to
  PostgREST (publishable key) — a probation officer submits at 4:45 PM on
  a Friday and it is in the intake queue before they leave their desk,
  with a mail/phone fallback if the network fails. Includes a
  participant-consent attestation flag.
- **Staff triage:** the Applications page opens with the partner referral
  queue — mark contacted, convert to application, or close; a
  non-attested consent flag warns before information flows back.

## Phase 8 — Self-recording compliance + Exhibit E reporting ✅ initial (2026-07-31)

- **Migration 0017 (applied live):** NARR auto-evidence triggers — logging
  a screening marks 2.F.16.c met; meetings → 3.G.23.a; attendance →
  3.G.23.b + 3.I.27; chore completion → 3.I.27; incidents → 1.A.4.a; fee
  entries → 1.A.3.b; board posts → 1.C.7.e / 1.C.8.c; document signatures →
  their mapped standards (1.B.5.a, 1.A.3.a/c, 2.F.16.a/d, 1.C.7.c,
  1.B.6.c, 1.A.2.d, 4.J.30.c); recovery plans → 3.G.21.a. Each writes a
  timestamped evidence line + 1-year review horizon; manual overrides on
  the Compliance page still win. Live-verified in a rollback transaction.
- **Iowa HHS / Exhibit E outcomes report** (staff Reports): 90-day
  aggregates — people served, residents housed, admissions, service
  events, screenings, meetings — each citing its Exhibit E Schedule A/B
  use per the GFA Exhibit E Alignment Analysis
  (docs/source-documents/GFA_ExhibitEAlignmentAnalysis.pdf, mapped in
  docs/compliance/exhibit-e-alignment.md), plus a service-category
  breakdown and grant-upload CSV export. Aggregate counts only (42 CFR
  Part 2 / minimum-necessary).

## Phase 8.5 — Residence application flow ✅ code complete (2026-07-31; DB push of 0018 pending)

The full front door → resident-account pipeline the landing page promises:

- **Landing nav:** "Center" and "Residence" links at the top of vrcc.app's
  landing page; Residence opens `/recovery-residences`.
- **`/recovery-residences` directory:** recovery housing options — GFA
  residences first (Grace House links to its application site at
  https://gracehouse4.pages.dev/, profile at
  `/recovery-residences/grace-house`) plus the searchable statewide Iowa
  list (county/population/text filters) ported from the RecoveryResidenceOS
  public directory.
- **Online application** (`/recovery-residences/grace-house/apply`):
  documents-first flow (read the Grace House document set, then apply);
  account-required so submitting creates the resident account — register/
  sign-in round-trips back via `?next=`; answers stored as jsonb on
  `residence_applications` (migration 0018: `answers` column + applicant
  self-insert/self-select RLS).
- **Applicant status** (`/recovery-residences/my-application`): submitted →
  review → waitlist/bed narrative, the 2-business-day and every-2-weeks
  commitments, "referred elsewhere is a service" framing, and the VRCC
  onboarding prompt (strongest once approved).
- **Staff workflow:** applications land in the existing `/staff/applications`
  queue (counted on staff Today); the queue now renders the structured
  application answers, and approving prompts bed placement on the Bed board
  (or the applicant holds at the top of the waitlist).
- **External intake API** (`workers/api`):
  `POST /public/residence-applications` with CORS for the Grace House site,
  vrcc.app, and recoveryresidence.app — creates the resident account
  server-side (auth invite email, person record, application row under the
  residence applied to) using `SUPABASE_SERVICE_ROLE_KEY` (wrangler
  secret). This is the hook the gracehouse4.pages.dev application form
  posts to once it goes live.

**Pending to go live:** apply migration 0018 (Supabase MCP was
unauthenticated this session), deploy `workers/api` + set the service-role
secret, deploy the platform, and point the Grace House site's form at the
gateway (its repo/deployment is separate — see docs/deployment/README.md).

## Phase 9 ⬜

Coach/navigator workspaces, credentialed partner logins, alert system
(missed check-ins, overdue screens, review calendar), public bed
availability endpoint, admin + analytics, production hosting/deployment
(Cloudflare credentials needed), hardening.
