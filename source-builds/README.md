# Source-Build Intake

Temporary intake area for the five legacy builds being consolidated into the canonical
platform. Clones are **gitignored** — this directory holds audit material, never
production code. See `docs/source-inventory/` for the registries derived from them.

Re-create the intake clones with:

```bash
git clone --depth 1 https://github.com/Grace-For-Addictions/vrcc.app.git            source-builds/vrcc-current
git clone --depth 1 https://github.com/Grace-For-Addictions/RecoveryResidenceOS.git source-builds/recovery-residence-os
git clone --depth 1 https://github.com/GFAVRCC/grace-harbor-16.git                  source-builds/grace-harbor-16
git clone --depth 1 https://github.com/Grace-For-Addictions/contact-connect-dashboard.git source-builds/contact-connect-dashboard
git clone --depth 1 https://github.com/rcoiowa/Late-Night-Recovery-.git             source-builds/late-night-recovery
```

Dispositions (see `docs/source-inventory/feature-matrix.md`): these builds are SOURCE
material until Phase 9 cutover, then ARCHIVED. They must not become permanent
applications inside this repository.
