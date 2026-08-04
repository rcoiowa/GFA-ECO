# RecoveryOS — session handoff

**Read this first.** It is the shared brain between Claude sessions: a new
session has none of the previous conversation, only this repository. Keep it
current — update it in the same commit as any significant change.

Last updated: 2026-08-04.

## What this is

RecoveryOS is the Grace For Addictions (GFA) digital recovery ecosystem — a
Des Moines, Iowa 501(c)(3) Recovery Community Organization. It serves three
audiences from one codebase:

- **VRCC** (`/app`) — the Virtual Recovery Community Center: free recovery
  support for anyone, no residence stay required.
- **Resident portal** (`/residence`) — for people living in a GFA recovery
  residence.
- **Provider Hub** (`/staff`) — the residence operations workspace.

Public pages (landing, Grace House, residence directory, application flow)
are unauthenticated. Executive Director: Thomas DeGarmeaux,
thomas@graceforaddictions.org, 515-336-0006.

## Where the work lives

| Thing              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Repository         | `rcoiowa/GFA-ECO`                                                      |
| **Active branch**  | `claude/recoveryos-greenfield-build-8pns7n` — all work goes here       |
| Default branch     | `claude/supabase-mcp-setup-ep29rp` — config only, **contains no app**  |
| Supabase project   | `ykykeioydvtxpyreshhs`, schema **`recoveryos`** (legacy schemas exist) |
| Cloudflare account | `499272c2f0336cc60207bad24edd0e14`                                     |

Stack: pnpm monorepo (Node ≥20), React 19 + TypeScript (strict) + Vite 6 +
react-router 7 + Tailwind 4. `pnpm build`, `pnpm typecheck`, `pnpm format`.

## Deployment reality (verify before assuming)

The Cloudflare account has accumulated parallel deployments. As of 2026-08-04:

- `virtualrecovery` — **live legacy prod**, serves `vrcc.app`, source repo
  `Grace-For-Addictions/vrcc.app` (Base44-exported React). Do not modify
  without intent; it is what the public sees today.
- `recoveryos-staging` — deployed by a parallel session (Aug 2–3).
- `vite-react-template`, `-2`…`-5` — scratch experiments, safe to delete.
- `recovery-residence-os`, Pages `gfa-vrcc`, `gracehouse4`, `gfaconnection` —
  legacy SOURCE builds, preserved, superseded.
- A Pages project created from the drag-and-drop zip serves the current
  platform (see `docs/deployment/QUICKSTART.md`).

**Deploying:** there is no Cloudflare API token in the environment, so a
session cannot deploy on its own. Use `scripts/package-pages-upload.mjs` to
build a drag-and-drop zip for the user, or have them add
`CLOUDFLARE_API_TOKEN` to the environment. Full instructions:
`docs/deployment/QUICKSTART.md`.

## Ground rules learned the hard way

1. **One session owns the database at a time.** Parallel sessions applied
   migrations that were never committed and reused numbers. Before applying
   anything: run `list_migrations`, compare to `supabase/migrations/`, use the
   next unused number, and commit the file in the same session. See
   `docs/migration/live-drift-reconciliation.md`.
2. **Check for parallel branches** (`git branch -r`) before building a
   feature — another session may already have built it. Merge, do not rebuild.
3. **Nothing is deleted.** Legacy builds are labeled SOURCE and preserved.
4. **Push to the active branch only.** No pull requests unless asked.
5. **The uploaded Grace House documents are authoritative** — they override
   anything Claude authored. Sources: `docs/source-documents/`.
6. **Language standard is non-negotiable:** person-first, trauma-aware,
   neuro-informed, grace-based, in every document and UI string
   (`docs/language-guide.md`).

## Compliance spine

Built to **NARR 3.0 Level II** (82 standards seeded and tracked) and the
**Iowa HHS Recovery Residence Checklist** (7 items, form 470-0025), with
**Exhibit E** opioid-settlement outcome reporting. Compliance evidence records
itself: migration `0017` fires triggers from real operations (screenings,
meetings, chores, fees, document signatures) into the NARR tracker. See
`docs/compliance/`.

Canonical operating rules live in `packages/residence-content` (19 documents
imported verbatim) and `packages/domain/src/phases.ts` (phase-based curfew and
recovery-activity requirements). Never restate a policy from memory — read it
from those.

## Current state

Working and live-verified: public directory + referral intake (proven
end-to-end against the production database), document library with
e-signatures, resident portal, Provider Hub (bed board, applications,
screenings, incidents, NARR + Iowa trackers, fees, house board), supervision
and Exhibit E reports, in-app residence directory, online application flow,
operator self-onboarding wizard.

Open items:

- Thomas's account is not yet registered; once it is, confirm the email in the
  database and grant `residence_manager` on residences 1 and 2 so `/staff`
  opens.
- Custom SMTP for auth email (built-in sender is limited to 2/hour).
- Phase storage is duplicated (`residencies.phase` vs `residency_phases`) —
  pick one read path before staff set phases by hand.
- Phase 9 roadmap in `docs/build-manifest.md`: alerts, partner logins, public
  bed-availability feed, coach/navigator workspaces, admin analytics.

## Starting a new session

A new session clones the **default** branch, which contains no app — so it
must switch branches before it can see any of this. Paste this as the first
message:

> First run `git fetch origin claude/recoveryos-greenfield-build-8pns7n && git
checkout claude/recoveryos-greenfield-build-8pns7n` — the default branch has
> no app in it. Then read `docs/HANDOFF.md` and `docs/build-manifest.md`
> before doing anything. Before any database change, compare `list_migrations`
> against `supabase/migrations/`. Then: <your task>

For a session on `Grace-For-Addictions/vrcc.app` (the legacy live site):

> This is the legacy VRCC build serving vrcc.app via the Cloudflare Worker
> `virtualrecovery`. The canonical platform is `rcoiowa/GFA-ECO`. Do not
> restructure this app. Task: <your task>
