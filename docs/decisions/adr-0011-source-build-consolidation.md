# ADR-0011: Five source builds consolidate into the canonical platform

**Status:** Accepted · **Date:** 2026-07-29

## Verified landscape (see docs/source-inventory/)

- `vrcc.app` = Worker `virtualrecovery` = repo `Grace-For-Addictions/vrcc.app`
  (Base44-exported; ~60 legacy pages + a Supabase-backed MVP module). The
  "non-Git production build" concern is resolved — source exists.
- `recovery-residence-os` Worker = repo `Grace-For-Addictions/RecoveryResidenceOS`
  (React 19 + TS; strongest schema work: `gfa_residence`, documents/signatures,
  policy engine, NARR/Iowa HHS compliance).
- `gracehouse4.pages.dev` ≈ repo `GFAVRCC/grace-harbor-16` (Lovable; Grace House
  brand/content; own Supabase project).
- `gfaconnection.pages.dev` = repo `Grace-For-Addictions/contact-connect-dashboard`
  (virtual-building experiential concept; own Supabase project).
- Live Supabase `ykykeioydvtxpyreshhs` already carries 4 schemas / ~90 migrations.

## Decisions

1. Dispositions per feature follow `docs/source-inventory/feature-matrix.md`
   (single check-in system, single recovery capital flow, single residence subsystem
   rooted in the Residence OS lineage, single person record).
2. The virtual-building metaphor is preserved as design language and a future optional
   orientation layer — never the only navigation (accessibility and clarity govern).
3. Legacy deployments stay live and untouched (SOURCE) until Phase 9 cutover
   validates staging; then ARCHIVED. No destructive cutover.
4. The canonical schema is the target model; reconciliation with the live database is a
   planned ETL (docs/migration/README.md), not an in-place overwrite.
5. Base44 SDK dependence is retired with the legacy page set.
6. Voice preserved platform-wide: "Connection prevents crisis." ·
   "No shame. No stigma. Just grace."
