# Get RecoveryOS live — quick start

**Automatic deployment is live (2026-08-04).** Pushing to
`claude/recoveryos-greenfield-build-8pns7n` builds and deploys to the Worker
`gfa-eco-recovery-residence-os` via `.github/workflows/deploy-staging.yml`,
using the `CLOUDFLARE_API_TOKEN` repository secret. Nothing below is needed
for a routine update — it is the manual fallback if the pipeline is down.

Written for a non-developer. Three options, easiest first.

## Why the Git connection produced nothing (2026-07-31)

The repository's **default branch** (`claude/supabase-mcp-setup-ep29rp`)
contains only four config files — no application. Cloudflare connected to
that branch, found nothing to build, and never created a Worker. Any
Git-based deploy must point at `claude/recoveryos-greenfield-build-8pns7n`.

## Option 1 — Drag and drop (no Git, no settings, ~2 minutes)

1. Build the package (or ask Claude to send it):

       pnpm build
       node scripts/package-pages-upload.mjs   # → recoveryos-pages-upload.zip

2. Go to <https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/pages>
3. Choose **Upload assets**.
4. Project name: `recoveryos` → **Create project**.
5. Drag the zip onto the upload area → **Deploy site**.

Live at `https://recoveryos.pages.dev`, including
`https://recoveryos.pages.dev/residence/directory/` (the public
RecoveryResidence.org directory). To publish an update, open the project →
**Create deployment** → drag the new zip.

## Option 2 — Git auto-deploy (builds on every push)

In Cloudflare → Workers & Pages → the connected `GFA-ECO` project →
**Settings → Build**:

- Branch: `claude/recoveryos-greenfield-build-8pns7n` ← the critical setting
- Build command: `pnpm build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`
- Environment variables: none required

Config lives in the repo root `wrangler.jsonc` (Worker
`gfa-eco-recovery-residence-os`).

## Option 3 — Let Claude deploy (one-time setup, then hands-off)

1. Create a scoped API token:
   <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** →
   **Edit Cloudflare Workers** template → Continue → Create → copy the token.
2. Add it to the Claude Code environment (claude.ai/code → environment
   settings → Environment variables) as `CLOUDFLARE_API_TOKEN`.
   **Paste it there, never into a chat message.**
3. From then on Claude runs `pnpm build && npx wrangler deploy` on request.

Revoke the token any time from the same API-tokens page.

## What to test once it is live

| Path                    | What you should see                                     |
| ----------------------- | ------------------------------------------------------- |
| `/`                     | VRCC landing page                                       |
| `/residence/directory/` | RecoveryResidence.org directory + working referral form |
| `/register`             | Account signup (email confirmation required)            |
| `/app`                  | Participant VRCC experience (after signing in)          |
| `/staff`                | Provider Hub (requires a staff role on the account)     |
