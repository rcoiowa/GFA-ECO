# RecoveryOS Product Architecture

## North star

One coherent recovery-support ecosystem composed of clearly separated user experiences
running on shared infrastructure. Simple on the surface, comprehensive underneath.

## Hybrid architecture

```
RecoveryOS Shared Platform
│  identity · people · roles · programs · residences · consent
│  service events · recovery engines · design system · analytics
│
├── VRCC Participant Experience        apps/vrcc          (Phase 2 — built)
├── Recovery Residence Resident        apps/resident      (Phase 4 — shell built)
├── Residence Staff Workspace          apps/residence-staff (Phase 5)
├── Coach Workspace                    apps/coach         (Phase 6)
├── Navigator Workspace                apps/navigator     (Phase 6)
├── Administrative Command Center      apps/admin         (Phase 7)
└── Future Partner Experiences         (multi-tenant, later)
```

Shared capabilities live in `packages/*` and `supabase/`. Experience shells own only
navigation, page composition, and theming. No engine is ever duplicated per shell.

## Deployment model (ADR-0010)

One frontend deployment — `apps/platform` behind `vrcc.app` — with route-separated,
lazy-loaded experience shells ("one platform with several intentional front doors"):

| Surface | Route | Status |
| --- | --- | --- |
| Public entrance + Grace House info | `/`, `/recovery-residences/grace-house` | Built |
| VRCC participant | `/app` | Built |
| Resident | `/residence` | Shell built |
| Coach / Navigator / Staff / Admin | `/coach` `/navigator` `/staff` `/admin` | Phase 7 |
| API gateway | `api.vrcc.app` — Cloudflare Worker (`workers/api`), never a frontend | Skeleton |
| Data | Supabase `ykykeioydvtxpyreshhs` — PostgreSQL + Auth + Storage + RLS | Target model in repo |

Each front door downloads only its own lazy chunk; guards shape navigation and RLS
enforces access. Consolidation of the five legacy source builds into this platform is
governed by ADR-0011 and `docs/source-inventory/`.

## The layer model

```
LAYER 1 IDENTITY        auth.users → people → profiles, consent, preferences
LAYER 2 RELATIONSHIPS   enrollments, residencies, coaching, navigation, staff roles
LAYER 3 SERVICES        service_types + service_events (single attribution spine)
LAYER 4 PROGRAMS        VRCC, ANCHOR, Grace House, partner residences
LAYER 5 EXPERIENCES     the apps/ shells
LAYER 6 INTELLIGENCE    Grace AI, safety routing, analytics views
```

## The non-negotiable distinction

**VRCC participant** = a `program_enrollments` row against the `vrcc` program.
**Resident** = a `residencies` row against a residence.
One person may hold both; neither erases the other; analytics never conflates them
(`analytics_participation_classification` view). Person records are never duplicated.

## Navigation contracts

VRCC participant (7): Today · My Recovery · Connect · Learn · Tools · Resources · My Journey
Resident (7): Today · My Residence · My Recovery · Connect · Schedule · Documents · My Journey

Persistent utilities (both): Support Now · profile · privacy/consent · sign out.
Support Now is reachable from every participant- and resident-facing screen.
