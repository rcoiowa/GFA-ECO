# P1-G — Cloudflare Deployment Map

**Date:** 2026-08-07 · **Method:** Cloudflare MCP (account-scoped, read-only).

Evidence legend: **VERIFIED LIVE** (returned by a Cloudflare MCP call this session) ·
**VERIFIED SOURCE** (wrangler/deploy config in a repo) · **INFERRED** · **REQUIRES
ACCESS** (not reachable with the tools available this session).

> Tooling limit (state honestly): the Cloudflare MCP surface available here exposes
> **Workers list, KV, D1, R2, Hyperdrive** and documentation search. It does **not**
> expose zones, DNS records, Worker **routes**, **custom-domain** bindings, Pages
> projects, per-Worker bindings/vars, or deployment branches. So hostname→worker
> ownership and env-var inventory are **REQUIRES ACCESS** below, not guessed.

## Workers (VERIFIED LIVE — account list)

| Worker | Created / modified (UTC) | Source (VERIFIED SOURCE / INFERRED) | Disposition |
| --- | --- | --- | --- |
| `gfa-eco-recovery-residence-os` | Aug 4 / **Aug 7 04:30** | GFA-ECO root `wrangler.jsonc` (`name` matches; assets `./apps/platform/dist`, SPA) — **App E canonical platform** | KEEP — canonical target; Phase 9 repoints vrcc.app here |
| `recoveryos-staging` | Aug 2 / Aug 3 | GFA-ECO staging deploy (deploy-staging.yml) — canonical build | KEEP — staging |
| `virtualrecovery` | Jul 20 / Aug 2 | vrcc.app worker; deployed bundle = **App B** (`origin/claude/live-app-source`), predecessor **App A** (`origin/main`) — serves the live mvp coach experience | KEEP (production-adjacent) — do not touch without gate; MIGRATION SOURCE |
| `vrcc-app` | Aug 2 | another vrcc.app-family build (`index-D0SDJ3Bt.js`) | REQUIRES ACCESS — purpose unverified; cleanup candidate |
| `vite-react-template` | Aug 1 | starter template | SAFE TO RETIRE (experiment) |
| `vite-react-template2` | Aug 1 | starter template | SAFE TO RETIRE |
| `vite-react-template3` | Aug 1 | starter template | SAFE TO RETIRE |
| `vite-react-template4` | Aug 2 | starter template | SAFE TO RETIRE |
| `vite-react-template5` | Aug 2 | starter template | SAFE TO RETIRE |
| `recovery-residence-os` | Jul 29 (unchanged) | RecoveryResidenceOS SPA (stale, pre Jul 30 directory commit) | DEPRECATE — legacy SOURCE |

The `coaching`, `create-meeting`, `notify-fanout` surfaces are **Supabase Edge
Functions**, not Cloudflare Workers — they don't appear here and aren't Cloudflare's to
own.

## Other Cloudflare resources (VERIFIED LIVE)

- **KV namespaces:** one — `my_kv_namespace` (`70510a5d…`). No binding evidence in any
  repo's wrangler config; **INFERRED** leftover from a template. REQUIRES ACCESS to
  confirm which Worker (if any) binds it.
- **D1 databases:** none (empty list). Consistent with Supabase-as-database.
- **R2 buckets:** REQUIRES ACCESS — R2 is not enabled on the account (`403 code 10042`,
  "enable R2 through the dashboard"). So no R2 is in use.
- **Hyperdrive:** not queried / none expected (Supabase is reached directly, not via
  Hyperdrive).

## Hostnames (from `docs/discovery/deployment-registry.md`, cross-checked)

| Domain | Serving | Verified? |
| --- | --- | --- |
| `vrcc.app` | mvp build (App A/B) — whether via `virtualrecovery` Worker or a Pages project | **REQUIRES ACCESS** (no route/custom-domain tool) — registry marks it UNVERIFIED which Worker answers |
| `gfa-vrcc.pages.dev` | same mvp build; Pages project on vrcc.app `main` | VERIFIED (prior HTTP probe) — Pages, REQUIRES ACCESS to enumerate here |
| `virtualrecovery.thomas-499.workers.dev` | App B | VERIFIED SOURCE (vrcc.app README) |
| `gracehouse4.pages.dev` | Grace House static site | VERIFIED (prior probe) |
| `recoveryresidence.app` | intended future residence domain | UNVERIFIED |

Note: this environment's network policy **blocks outbound HTTPS to `*.supabase.co` and
was not used to re-probe `*.pages.dev`/`vrcc.app`** this session, so live hostname
probes above are carried from the existing registry, not re-verified now.

## What owns every public URL — honest status

- **Canonical platform** → Worker `gfa-eco-recovery-residence-os` (VERIFIED SOURCE via
  root wrangler.jsonc; VERIFIED LIVE in the worker list, modified Aug 7).
- **Live mvp coach experience** → Worker `virtualrecovery` serving App B (INFERRED from
  bundle history + live traffic; the vrcc.app **custom-domain → worker** binding itself
  is REQUIRES ACCESS).
- **Grace Coaching prototype** → Supabase Edge Function `coaching` (VERIFIED LIVE), not
  Cloudflare.
- **Everything else** (`vrcc-app`, 5 `vite-react-template*`, `recovery-residence-os`) →
  experiments/legacy; cleanup after owner confirmation.

## Blockers to a complete map (REQUIRES ACCESS)

1. Zones / DNS records — to bind each custom domain to its Worker/Pages project.
2. Worker **routes** and **custom domains** — to confirm what answers `vrcc.app`.
3. **Pages** projects list (`gfa-vrcc`, `gracehouse4`, `gfaconnection`) — not exposed
   by the available MCP surface.
4. Per-Worker **bindings + environment variables** — to find any
   `VITE_SUPABASE_URL` override pointing a build at the canonical project (the likely
   mechanism behind the drift errors and the mis-pointed Contact-Connect deploy).

These need Cloudflare dashboard access or a token with zone/Pages read scope.
