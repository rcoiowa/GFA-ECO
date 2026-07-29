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

## Deployment model

| Surface | Domain | Hosting |
| --- | --- | --- |
| VRCC participant | `vrcc.app` | Cloudflare Pages |
| Resident | `residence.vrcc.app` | Cloudflare Pages |
| Staff | `staff.recoveryresidence.app` | Cloudflare Pages (Phase 5) |
| Coach | `coach.vrcc.app` | Cloudflare Pages (Phase 6) |
| Navigator | `navigator.vrcc.app` | Cloudflare Pages (Phase 6) |
| Admin | `admin.vrcc.app` | Cloudflare Pages (Phase 7) |
| API gateway | `api.vrcc.app` | Cloudflare Worker (`workers/api`) |
| Data | Supabase project `ykykeioydvtxpyreshhs` | PostgreSQL + Auth + Storage + RLS |

Separate Pages projects give each experience its own bundle, release cycle, and
role surface — route separation inside one bundle was rejected (ADR-0002).

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
