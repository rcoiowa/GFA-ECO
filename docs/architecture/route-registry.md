# Route Registry

## apps/vrcc (vrcc.app)

| Route | Page | Access |
| --- | --- | --- |
| `/` | Landing | Public |
| `/sign-in` | Sign in | Public |
| `/register` | Register | Public |
| `/onboarding` | Person provisioning | Authenticated |
| `/today` | Today (home) | Person |
| `/recovery` | My Recovery (goals, plan) | Person |
| `/connect` | Connect (support team, circles) | Person |
| `/learn` | Learn (content tracks) | Person |
| `/tools` | Tools (practices, assessments) | Person |
| `/resources` | Resources (navigation) | Person |
| `/journey` | My Journey (history) | Person |
| `/profile` | Profile | Person |
| `/privacy` | Privacy & consent | Person |
| `/support/grounding` | Grounding practice | Person |
| `/not-authorized` | Access explanation | Any |
| `*` | Not found | Any |

## apps/resident (residence.vrcc.app)

| Route | Page | Access |
| --- | --- | --- |
| `/sign-in` | Sign in | Public |
| `/today` | Resident home | `resident` role |
| `/residence` | My Residence | `resident` role |
| `/recovery` | My Recovery (shared engines, Phase 4) | `resident` role |
| `/connect` | Connect (Phase 4) | `resident` role |
| `/schedule` | Schedule (Phase 4) | `resident` role |
| `/documents` | Documents (Phase 4) | `resident` role |
| `/journey` | My Journey (Phase 4) | `resident` role |
| `/support/grounding` | Grounding practice | `resident` role |

## workers/api (api.vrcc.app)

| Route | Purpose |
| --- | --- |
| `GET /health` | Liveness |
| `GET /version` | Build metadata |

Frontend guards are navigation only; Postgres RLS is the enforcement boundary.
Update this file in the same commit as any route change.
