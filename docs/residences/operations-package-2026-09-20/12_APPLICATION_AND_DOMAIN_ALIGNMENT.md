# 12 — Application & Domain Alignment

- **Residence applicability:** both · **Evidence date:** 2026-09-20 · **State:** PREPARED (not effective; no routes/DNS/auth implemented) · **Owner:** ED · **Approval required:** yes · **Supersession:** aligns with `docs/architecture/recoveryresidence-domain-architecture-2026-09-20.md` (Gate A) and the EJWRH activation packet
- Cross-ref: DNS/route bindings for `recoveryresidence.org/.app` are **REQUIRES ACCESS** (Cloudflare dashboard/token); not changed here.
- **Live-evidence caveat:** any claim marked **VERIFIED LIVE (2026-09-20)** reflects a CQCX read on 2026-09-20 and **must be freshly re-verified before any dependent operational or production action.**

| Attribute | **EJWRH** | **Grace House** |
|---|---|---|
| Current public application URL | SPA `/residence/directory/?apply=ejwrh` (VERIFIED SOURCE) | `/recovery-residences/grace-house/apply` (VERIFIED SOURCE) |
| Proposed clean URL | `recoveryresidence.org/apply/ejwrh` (internal redirect to the working path) | `recoveryresidence.org/apply/grace-house` |
| Canonical residence binding | **residence_id 2**, resolved **server-side** (never from the URL) | **residence_id 1**, server-side |
| Canonical writer | `residence-intake` (sole writer) | `residence-intake` (sole writer) |
| Turnstile / origin | Turnstile hostname+action verified; origin allowlist already includes `recoveryresidence.org/.app`; missing-Origin rejected; fails closed w/o `TURNSTILE_SECRET` | same |
| Duplicate protection | in `residence-intake` (bounded, server-side) | same |
| Notification recipients | intake staff notified via canonical notifications (role/residence-scoped) — recipient roles to confirm (§09) | same |
| Authorized reviewers | residence-scoped staff/managers + care-ops (RLS); intake_coordinator/worker roles (0149) — incumbents UNKNOWN (§09) | same |
| Manual fallback | take application by phone if the receiver is unavailable — **515-220-8771 (GFA office / housing-intake; RATIFIED PHONE-001)**; not the Warmline | same |
| Current publication state | `is_public_directory=false` (VERIFIED LIVE (2026-09-20)) — **not published**; direct-link pilot only | `is_public_directory=false` — not published |
| Public profile page | none yet (`/residences/ejwrh` to build) | `/recovery-residences/grace-house` exists |

## Target routes (proposed; not implemented)
Public (`recoveryresidence.org`): `/residences/grace-house`, `/residences/ejwrh`, `/apply/grace-house`, `/apply/ejwrh`, `/rights`, `/for-referral-partners`.
Authenticated operations (`recoveryresidence.app`): login + operations workspace (applications, admissions, beds, documents, incidents, grievances, reports, settings/access).

## Guards to preserve (all residences)
Server-side validation · Turnstile (hostname+action) · origin allowlisting · rate limits · duplicate protection · consent allowlisting · **no anonymous reads** · fixture/production isolation · **public slugs resolve server-side to canonical residence rows — never expose DB ids as the routing authority.**

## Front-door activation prerequisites (not done here)
- `TURNSTILE_SECRET` present in production + `.org` forms mint tokens for the expected hostname/action (else applications correctly fail closed).
- `lead-intake` remains inert until `LEAD_INTAKE_SECRET` is set (contact/lead path — separate from residence applications).
- Directory publication (`is_public_directory`) is a **separate later gate** per residence (see 15).

**Blockers:** Cloudflare read access to capture current bindings/rollback; Turnstile config for `.org`; build `/residences/ejwrh` + clean routes on staging; publication decision. No implementation in this phase.
