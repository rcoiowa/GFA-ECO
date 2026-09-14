# ADR-0008: Internal packages consumed as TypeScript source

**Status:** Accepted · **Date:** 2026-07-29

Workspace packages export `./src/index.ts` directly; apps bundle them via Vite. No
per-package build/dist step. Benefits: zero build orchestration, instant cross-package
edits, one compiler configuration (`tsconfig.base.json`). Cost: every app compiles the
packages it uses (acceptable at this scale). Tailwind v4 `@source` directives in each
app's CSS include package sources for class scanning.
