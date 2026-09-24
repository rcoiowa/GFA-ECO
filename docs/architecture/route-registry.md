# Route Registry — Canonical Platform

One deployment (`apps/platform`) can serve several host-specific public entrances. The
`recoverycommunity.center` host opens the public Recovery Community Center entrance;
`recoverycommunity.app` redirects `/` to `/vrcc/today`. These host mappings are source
behavior only until Cloudflare custom domains are bound and live verified. Experience
areas are lazy-loaded route subtrees. Frontend guards are navigation only; Postgres RLS
is the enforcement boundary. Update this file in the same commit as any route change.
Legacy source-build routes: `docs/source-inventory/route-registry-sources.md`.

## Public entrance

| Route                              | Page                    | Access        |
| ---------------------------------- | ----------------------- | ------------- |
| `/`                                | Host-specific landing (Recovery Community Center on recoverycommunity.center; participant entrance on recoverycommunity.app) | Public or guarded destination |
| `/sign-in`                         | Sign in                 | Public        |
| `/register`                        | Register                | Public        |
| `/recovery-residences/grace-house` | Grace House public info | Public        |
| `/onboarding`                      | Person provisioning     | Authenticated |
| `/not-authorized`                  | Access explanation      | Any           |
| `*`                                | Not found               | Any           |

## `/app` — VRCC participant (lazy chunk, `RequirePerson`)

| Route                         | Page                           |
| ----------------------------- | ------------------------------ |
| `/app` → `/app/today`         | Today (home)                   |
| `/app/recovery`               | My Recovery (goals, plan)      |
| `/app/connect`                | Connect                        |
| `/app/learn`                  | Learn                          |
| `/app/tools`                  | Tools                          |
| `/app/tools/recovery-capital` | BARC-10 recovery capital check |
| `/app/resources`              | Resources                      |
| `/app/journey`                | My Journey                     |
| `/app/profile`                | Profile                        |
| `/app/privacy`                | Privacy & consent              |
| `/app/support/grounding`      | Grounding practice             |

## `/residence` — Resident (lazy chunk, `RequireRole(resident)`)

| Route                             | Page                         |
| --------------------------------- | ---------------------------- |
| `/residence` → `/residence/today` | Resident home                |
| `/residence/house`                | My Residence                 |
| `/residence/recovery`             | My Recovery (shared engines) |
| `/residence/connect`              | Connect                      |
| `/residence/schedule`             | Schedule                     |
| `/residence/documents`            | Documents                    |
| `/residence/journey`              | My Journey                   |
| `/residence/support/grounding`    | Grounding practice           |

## Reserved front doors (later phases)

| Route        | Experience                    | Phase |
| ------------ | ----------------------------- | ----- |
| `/coach`     | Coach workspace               | 7     |
| `/navigator` | Navigator workspace           | 7     |
| `/staff`     | Residence staff workspace     | 7     |
| `/admin`     | Administrative command center | 7     |

Planned public routes (content phases): `/about`, `/support`, `/resources`,
`/meetings`, `/events`, `/recovery-residences`, `/privacy`, `/accessibility`.

## workers/api (api.vrcc.app)

| Route          | Purpose        |
| -------------- | -------------- |
| `GET /health`  | Liveness       |
| `GET /version` | Build metadata |
