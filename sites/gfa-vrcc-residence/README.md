# Residence section for gfa-vrcc.pages.dev

`index.html` is the **Recovery Residence — Universal Recovery Housing
Platform** page (extracted verbatim from the claude.ai artifact
`b98557db-8e53-42b8-827c-fc1d72688297`, host wrapper stripped). It is fully
self-contained — inline CSS/JS, embedded font, zero external requests — and
verified in headless Chromium: landing, demo residence, and the
create-residence wizard all work; data persists in `localStorage`.

## Deploying into the residence section of gfa-vrcc.pages.dev

The Cloudflare Pages project `gfa-vrcc` builds from
`Grace-For-Addictions/vrcc.app` (production branch `main`). To serve this
page at `gfa-vrcc.pages.dev/residence/`:

1. In the vrcc.app repo, copy this file to `public/residence/index.html`
   (create the `public/` directory if it does not exist — Vite copies it
   into the build output verbatim).
2. Point the landing page's Residence entry (the `/residences` pill in the
   deployed build) at `/residence/`, or add a redirect from `/residences`.
3. Push to `main`; Pages rebuilds and the page is live.

This session could not push to `Grace-For-Addictions/vrcc.app` (the
environment is scoped to `rcoiowa` repositories), which is why the file is
staged here. Start a Claude Code session with vrcc.app as the source repo
to apply steps 1–3.

## ⚠️ Before redeploying vrcc.app main

The build currently served on vrcc.app / gfa-vrcc.pages.dev (assets
`index-DMwbAUg-.js`) contains features — including the landing's
Residence/Center navigation and the `/residences` directory — that are
**not present in the repo's `main` history** (the deploy of 2026-07-29 was
made from source that was never pushed; the repo was later rewritten to the
"Merge VRCC MVP + Gate 19B" line). A push to `main` today would trigger a
Pages rebuild that **regresses the live site** to the MVP without those
features. Reconcile `main` with the live build (or accept the regression
knowingly) before pushing.

## Later: swapping the demo for the real platform

This page is the interactive product experience with demo/local data. The
database-backed equivalent lives in this repo: `/recovery-residences`
(directory + Grace House application) and
`/recovery-residences/list-your-residence` (operator onboarding wizard,
migration 0019) in `apps/platform`. When the platform deploys, replace this
static page with a redirect to it.
