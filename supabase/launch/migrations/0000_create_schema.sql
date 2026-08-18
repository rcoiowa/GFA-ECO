-- The canonical RecoveryOS model deploys into its own schema on the live
-- "Grace For Addictions" project (ykykeioydvtxpyreshhs), leaving the four
-- legacy schemas (public, gfa_ui, gfa_community/gfa_core, gfa_residence)
-- untouched until Phase 8 ETL. See docs/migration/README.md.
create schema if not exists recoveryos;
