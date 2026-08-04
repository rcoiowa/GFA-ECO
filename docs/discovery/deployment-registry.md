# Deployment Registry — verified snapshot 2026-08-04

Supplements (does not overwrite) `docs/source-inventory/deployment-registry.md`
(Phase 0–1 record) and `docs/deployment/README.md` (target config). This is
what is **observably live now**.

## Domains

| Domain                | Serving                                                            | Bundle              | Verification                | Notes                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------ | ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| vrcc.app              | vrcc.app-repo build (MVP, "GFA VRCC — Connection Prevents Crisis") | `index-CoFlmJ02.js` | VERIFIED (HTTP, 2026-08-04) | ⚠ **Production regressed ~Aug 2**: the previous rich build (`index-DMwbAUg-.js`, with Residence/Center landing + `/residences` directory) was replaced by the MVP build; the rich build's source was never pushed and is now a REFERENCE ARTIFACT. Whether the domain is answered by Worker `virtualrecovery` (modified Aug 2 17:41Z) or the Pages project is UNVERIFIED |
| gfa-vrcc.pages.dev    | same build as vrcc.app                                             | `index-CoFlmJ02.js` | VERIFIED                    | Pages project connected to vrcc.app `main` (owner action, Aug 1); build settings since fixed. `/residence/` is SPA-fallback — the staged Recovery Residence page (`sites/gfa-vrcc-residence/index.html`) has **not** been added                                                                                                                                          |
| gracehouse4.pages.dev | Grace House static single-page site (self-contained, ~480 KB)      | inline              | VERIFIED (Jul 31 probe)     | informational; no live application-submission endpoint found in page                                                                                                                                                                                                                                                                                                     |
| recoveryresidence.app | —                                                                  | —                   | UNVERIFIED                  | intended future domain for the residence layer; no probe performed                                                                                                                                                                                                                                                                                                       |

## Cloudflare Workers (account list, read-only MCP, 2026-08-04)

| Worker                                          | Created / modified            | Serves                                                                                     | Disposition signal                                                                                                                          |
| ----------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `virtualrecovery`                               | Jul 20 / **Aug 2**            | historic vrcc.app worker; redeployed Aug 2                                                 | production-adjacent — do not touch without Gate                                                                                             |
| `recoveryos-staging`                            | **Aug 2 / Aug 3**             | canonical platform build ("VRCC — Virtual Recovery Community Center", `index-CcDib1bC.js`) | **staging for this repo**; deployed commit UNVERIFIED; does **not** include the residence-application-flow branch (bundle lacks its routes) |
| `vrcc-app`                                      | Aug 2                         | another vrcc.app-family build (`index-D0SDJ3Bt.js`)                                        | purpose UNVERIFIED — likely worker-deploy experiment; candidate for cleanup                                                                 |
| `vite-react-template` … `template5` (5 workers) | Aug 1–2                       | unknown                                                                                    | experiments; candidates for cleanup after owner confirmation                                                                                |
| `recovery-residence-os`                         | Jul 29 (unchanged)            | RecoveryResidenceOS SPA, **stale** (predates the Jul 30 directory/application commit)      | legacy SOURCE per Phase 0–1 registry                                                                                                        |
| (removed) `gfa-eco-recovery-residence-os`       | created Jul 30, since deleted | never served content                                                                       | resolved                                                                                                                                    |
| (never deployed) `grace-vrcc`                   | —                             | 4 content pages on branch `what-is-built-here-3co21c`                                      | REFERENCE                                                                                                                                   |

## Supabase

| Project                | Role                                                                                                  | Verification                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ykykeioydvtxpyreshhs` | canonical system of record (directive §4.1); referenced by GFA-ECO, vrcc.app MVP, RecoveryResidenceOS | live state BLOCKED this session (MCP unauthenticated); repo migrations 0000–0017 recorded as applied by prior implementation reports, 0018–0019 **not applied** |
| `cmodbvkydzqlzxqxwoeu` | prohibited legacy target                                                                              | UNVERIFIED — no references found in any accessible repo                                                                                                         |
| `gffosjyiunshhmtpjsqa` | decommission candidate                                                                                | UNVERIFIED — no references found in any accessible repo                                                                                                         |

## Deployment-safety observations (directive §15)

1. `recoveryos-staging`'s deployed commit is not recorded anywhere in the
   repo — every future deploy must record exact commit + branch.
2. Three near-identical vrcc.app-family builds are live simultaneously
   (vrcc.app, gfa-vrcc.pages.dev, `vrcc-app` worker) with no registry of
   which is authoritative — consolidation target: one production surface,
   one staging surface.
3. RecoveryResidenceOS CI applies DB migrations to the canonical Supabase
   project on push to its `main` — a second, out-of-repo migration pipeline
   against the canonical database. Must be reconciled under §4.2.
