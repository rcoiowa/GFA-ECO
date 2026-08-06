# R-01(a) Separation Plan — SUPERSEDED by ADR-0014 (2026-08-04)

> Kept for the record. The owner revised R-01: one platform with
> domain-scoped front doors; the RR-3 engine list survives as the
> in-platform residence-experience backlog. Do not execute these gates.

Owner-approved 2026-08-04 (ADR-0013). Gate-based per directive §13: each
gate is the smallest safe slice, additive only, with rollback. Nothing in
this plan authorizes destructive changes to the canonical project.

## Target shape

| Concern  | RecoveryOS (this repo)                                                                        | Recovery Residence (new)                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo     | rcoiowa/GFA-ECO                                                                               | **new repo** (owner creates; suggested `recovery-residence`, under the housing entity's org when it exists)                                                         |
| Database | Supabase `ykykeioydvtxpyreshhs` (untouched)                                                   | **new Supabase project** (owner creates)                                                                                                                            |
| Domain   | vrcc.app                                                                                      | recoveryresidence.app (+ workers.dev/pages.dev staging)                                                                                                             |
| Owns     | VRCC participant experience, identity/consent, coach/navigator (future), residence **bridge** | organizations, residences, beds, waitlist, admissions, residents, check-ins w/ staff flagging, payments, furloughs, grievances, messages, house profile, compliance |
| UX spec  | ADR-0010 shells                                                                               | the prototype (`sites/gfa-vrcc-residence/index.html`) — triage dashboard, wizard, bed grid, tone                                                                    |

**Bridge contract (only data that crosses, always consent-mediated):**
referral out of RecoveryOS → {person's name/contact as consented, referral
note, consent attestation}; status back → {received / contacted / admitted /
waitlisted / referred-elsewhere}, nothing more. Never BARC-10, reflections,
coaching notes, journals (§4.6).

## Donor material inventory (stays put until carve-out gate)

From this repo: staff pages (BedBoard, Applications, Screenings, Incidents,
Compliance, Fees, Board, Reports), resident residence-ops pages, `packages/
residence-content` (24-document library), migrations 0004–0006 (residence
parts), 0013–0017, 0018–0019 (as schema reference), `workers/api` intake
endpoint, `sites/recoveryresidence-directory`. From RecoveryResidenceOS:
directory data, 6-part application, staff queue. From the prototype: all UX

- the four engines (triage, check-in flag loop, admit-from-waitlist,
  furlough lifecycle).

## Gates

- **RR-0 — Bootstrap** (needs: new repo). Vite+React19+TS scaffold matching
  §4.5 stack (RHF, Zod, TanStack Query, Vitest, Playwright, CI from day
  one); prototype published as `/` landing + demo; deploy report template.
  Rollback: delete repo. _Until the repo exists, the staged prototype can
  ship at gfa-vrcc.pages.dev/residence/ as the public demo (drop-in ready)._
- **RR-1 — Schema** (needs: new Supabase project). Adapt donor migrations to
  a fresh `housing` schema: organizations/residences (incl. 0019 wizard
  fields), people-lite (housing's own person records; linkage to RecoveryOS
  identity happens only via the consent bridge, not shared auth), beds,
  residencies, waitlist, check-ins, payments, furloughs, grievances,
  messages. UUID PKs (greenfield → §4.3 default applies). RLS deny-all
  first, then role policies. No connection to the canonical project.
- **RR-2 — Onboarding + auth.** Supabase Auth; three-step wizard (port from
  `ListYourResidencePage` + prototype); residence_manager role; multi-house
  switcher.
- **RR-3 — The engines.** Triage dashboard (flag/acknowledge loop), daily
  check-ins, beds + admit-from-waitlist, payments w/ receipts, furlough
  lifecycle incl. return confirmation, grievances w/ timeline standards,
  house board. Prototype microcopy carried verbatim where it fits §4.8.
- **RR-4 — Bridge.** Referral API on the Recovery Residence side; RecoveryOS
  `/recovery-residences` apply flow becomes "refer with consent" posting to
  it (replaces the in-platform application + the workers/api intake, which
  then retire). Status readback into `/recovery-residences/my-application`
  (renamed "my referral"). Consent record on the RecoveryOS side per
  ADR-0009.
- **RR-5 — Cutover + carve-out.** recoveryresidence.app domain; Grace House
  - EJWRH onboarded as first tenants; then (separate §4.2-gated migration)
    archive RecoveryOS's housing-ops pages and mark donor schema deprecated —
    with dependency audit, rollback, and explicit owner authorization. Any
    live resident data in the canonical project moves only under a reviewed
    data-preservation plan.

## Immediately actionable vs. blocked

Doable now, this repo: publish demo to gfa-vrcc.pages.dev/residence/ (file
staged; needs vrcc.app-repo session or manual drop-in), and hold 0018–0019
unapplied. Blocked on owner: create the Recovery Residence repo (B-02-type
scope), create its Supabase project (B-01), Cloudflare token or dashboard
for its deploys (B-03), and privacy-gate confirmation before any real
resident data flows (R-02 applies to the housing platform equally).
