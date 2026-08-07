# Canonical Frontend Decision (P1-F)

**Date:** 2026-08-07 · **Status:** DECIDED (P1). Governs where the canonical VRCC /
Coach / Navigator / Residence / Admin frontend lives and which surfaces are migration
sources vs. legacy.

## Decision

| Item | Value |
| --- | --- |
| **CANONICAL FRONTEND REPOSITORY** | `rcoiowa/GFA-ECO` — `apps/platform` (React 19 + TypeScript + Vite), with shared domain logic in `packages/data-access`, `packages/domain`, `packages/ui` |
| **CANONICAL DEPLOYMENT** | Cloudflare Worker **`gfa-eco-recovery-residence-os`** (static-assets Worker, `apps/platform/dist`, SPA fallback), built + deployed by `.github/workflows/deploy-staging.yml`; **`recoveryos-staging`** is the staging surface |
| **CANONICAL DOMAIN** | `vrcc.app` — **after Phase 9 cutover** repoints the custom domain from Worker `virtualrecovery` to `gfa-eco-recovery-residence-os` (DNS-level, reversible) |
| **CANONICAL BACKEND** | Supabase project `ykykeioydvtxpyreshhs`, **`recoveryos` schema**, reached through typed services in `packages/data-access` (RPCs for privileged mutations; RLS as the boundary) |
| **LEGACY FRONTENDS** | Worker `virtualrecovery` (vrcc.app mvp, Apps A/B); `recovery-residence-os` Worker; Contact-Connect CF Pages `gfaconnection` |
| **MIGRATION SOURCES** | Grace Coaching `coaching` Edge Function (App D — behavioral spec for the coaching engine); vrcc.app mvp (Apps A/B — the live coach experience to bring onto canonical); vrcc.app v2 PWA (App C — offline/PWA patterns) |
| **DEPRECATION ORDER** | see below |

## Why `apps/platform`, not the Edge-Function app or the mvp worker

Evaluated against the directive's criteria (not aesthetics):

| Criterion | `apps/platform` (E) | Grace Coaching `coaching` fn (D) | vrcc.app mvp worker (A/B) |
| --- | --- | --- | --- |
| Architectural alignment | **React 19 + TS + Vite + CF Worker — the stated target** | single-file HTML/JS in a Deno Edge Function — explicitly *not* the target architecture | Base44-vite / zustand; email-keyed identity |
| Source control | **in the canonical monorepo, versioned** | now captured (`supabase/functions/coaching`) but not a maintainable app tree | on vrcc.app branches, outside the monorepo |
| Maintainability | **typed services, shared packages, domain model** | one 900-line HTML string; no components, no types | app logic mixed with Base44 shim |
| Security | **RLS + person model + capability roles + hardened RPCs** | RLS + hardened RPCs (P0/P1) but publishable-key single-file | email-keyed RLS; historically the weakest (pre-P0) |
| RecoveryOS role integration | **native (`role_assignments`, `people`, `ensure_person_for_current_user`)** | its own `v2_profiles.role` | its own `app_users.role` / `participants` |
| Residence integration | **same repo, same schema, ADR-0014 one-platform-multi-domain** | none | none |
| Accessibility / mobile | platform components; WCAG target per spec | 48px targets, reduced-motion (good, portable) | mobile-first, good touch targets |
| Current production traffic | **live (mobile clients on `recoveryos.people`/`role_assignments`)** | live (prototype) | **live (real coaches on mvp_\*)** |
| Effort to migrate onto it | — (it is the target) | port behavior + product language into components | port behavior; retire email-keyed identity |

The **Grace Coaching Edge-Function app (D) is kept as the behavioral specification and
migration source** — its workflow (request → pool → claim → negotiate → confirm → join
→ complete → feedback), its product language, and its paired-connection visualization
are the reference the canonical Coach Workspace must reproduce. It is **not** the
long-term architecture: a self-contained HTML string served from Deno cannot carry the
typed, componentized, role-integrated app the ecosystem needs.

The **mvp vrcc.app worker (A/B) is the live coach experience and a migration source** —
it must keep running until the canonical Coach Workspace reaches parity (it carries the
Gate 19B continuity loop and the coaches actively using it today). It is not canonical:
email-keyed identity and the `mvp_*`/`participants` split are exactly what the person
model replaces.

## Deprecation order (no interruption to live users)

1. **Now (P1, done):** capture all deployed source into Git; secure boundaries; decide
   ownership (this document). Nothing retired.
2. **P2–P3:** build the canonical Coach/Navigator Workspace + participant Connect in
   `apps/platform` on the `recoveryos` schema, reproducing App D's behavior and product
   language; migrate the coaching data (v2 → canonical) behind parity tests.
3. **After coaching parity:** retire the **Grace Coaching `coaching` Edge Function** (App
   D) — its URL redirects into the platform; the function is archived.
4. **After the mvp coach experience is reproduced on canonical + data migrated:** retire
   the **mvp path on `virtualrecovery`** (Apps A/B). Phase 9 repoints `vrcc.app` to
   `gfa-eco-recovery-residence-os`; `virtualrecovery` stays as a read-only archive briefly
   (DNS rollback path), then is decommissioned.
5. **Independent of the above:** decommission **Contact-Connect** (`gfaconnection` Pages,
   App F) — separate project, no canonical traffic (see
   `contact-connect-dashboard-deprecation.md`).
6. **Cleanup:** the 5 `vite-react-template*` Workers and `vrcc-app` after owner
   confirmation (`cloudflare-deployment-map.md`).

## Guardrails

- One production surface and one staging surface per the deployment registry; every
  deploy records exact commit + branch.
- No frontend becomes canonical by being newer or prettier — canonical = in the
  monorepo, on the `recoveryos` schema, through typed services, with RLS as the
  boundary. This document is the single source of that decision.
