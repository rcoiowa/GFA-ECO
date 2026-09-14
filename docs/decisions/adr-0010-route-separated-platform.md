# ADR-0010: One platform app with route-separated experience shells

**Status:** Accepted · **Date:** 2026-07-29 · **Supersedes:** ADR-0002

## Context

ADR-0002 chose one Cloudflare Pages project per experience on separate subdomains. The
consolidation mandate (2026-07-29) established `vrcc.app` as the single product
container: one deployment, several intentional front doors (`/`, `/app`, `/residence`,
`/coach`, `/navigator`, `/staff`, `/admin`), with cross-experience movement for one
person without re-authentication.

## Decision

`apps/platform` is the single frontend deployment behind `vrcc.app`. Experience shells
are route subtrees, each **lazy-loaded** so a front door only downloads its own shell.
An explicit `ExperienceSwitcher` appears only for people authorized in more than one
experience. Experience theming switches at the shell root via `[data-experience]`
token overrides (`packages/design-tokens/src/themes/platform.css`).

ADR-0002's legitimate concerns are answered inside one deployment:

- **Bundle size** → route-level code splitting (verified in build output).
- **Role exposure** → guards shape navigation; RLS remains the real boundary
  (ADR-0006). Lazy chunks for professional areas are not secrets — data is.
- **Release cycles** → one pipeline is the consolidation goal, not a cost.

## Consequences

`apps/vrcc` and `apps/resident` are merged into `apps/platform` and removed. Session
sharing across experiences is trivial (same origin). The Worker (`workers/api`) is the
API/orchestration layer only — never a second frontend.
