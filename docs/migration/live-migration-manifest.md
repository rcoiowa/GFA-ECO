# Live migration manifest — project `ykykeioydvtxpyreshhs`

Snapshot of `supabase_migrations.schema_migrations` taken 2026-08-07 (143 rows).
This is the authoritative record of what has actually been applied to production,
across every generation. Regenerate with:

```sql
select version, name from supabase_migrations.schema_migrations order by version;
```

Reconciliation rules: `docs/migration/live-drift-reconciliation.md`. Canonical
target model: `supabase/migrations/` (applied live under `recoveryos_*` names).
Prototype-layer migrations recovered verbatim: `docs/migration/recovered/`.

| Version | Name |
| --- | --- |
| 20260506172032 | gravrcc_v6_01_extensions_and_enums |
| 20260506172049 | gravrcc_v6_02_participants |
| 20260506172102 | gravrcc_v6_03_peer_coaches |
| 20260506172115 | gravrcc_v6_04_coaching_sessions |
| 20260506172132 | gravrcc_v6_05_assessments |
| 20260506172158 | gravrcc_v6_06_recovery_capital |
| 20260506172224 | gravrcc_v6_07_wellness_checkins |
| 20260506172244 | gravrcc_v6_08_rtu_events_and_goals |
| 20260506172304 | gravrcc_v6_09_slogan_engine_and_notifications |
| 20260506172318 | gravrcc_v6_10_rls_policies |
| 20260506173117 | gravrcc_v6_11_seed_recovery_slogans |
| 20260507071648 | gravrcc_v6_12_assessments_9schema_enhancements |
| 20260507071714 | gravrcc_v6_13_recovery_capital_barc10_domains |
| 20260507071738 | gravrcc_v6_14_icare_plans |
| 20260507071756 | gravrcc_v6_15_slogan_practices |
| 20260507071819 | gravrcc_v6_16_peer_circles |
| 20260507071840 | gravrcc_v6_17_outcomes |
| 20260507071904 | gravrcc_v6_18_resources |
| 20260507140404 | gravrcc_v6_19_fix_threshold_clean |
| 20260511235147 | gravrcc_v6_20_supabase_user_id |
| 20260511235158 | gravrcc_v6_21_access_requests |
| 20260511235209 | gravrcc_v6_22_role_detection_function |
| 20260511235220 | gravrcc_v6_23_barc10_lobby_trigger |
| 20260511235231 | gravrcc_v6_24_auto_create_participant |
| 20260511235246 | gravrcc_v6_25_access_request_workflow |
| 20260511235300 | gravrcc_v6_26_participant_rls_policies |
| 20260515044341 | gravrcc_framevr_integration_views |
| 20260515065651 | gravrcc_wix_integration_tables |
| 20260517023520 | gravrcc_v6_29_orgs_programs_crisis_behavioral_config |
| 20260528115924 | gravrcc_v6_30_seed_iowa_resources |
| 20260528115954 | gravrcc_v6_31_seed_programs |
| 20260528120018 | gravrcc_v6_32_participant_profiles |
| 20260528120142 | gravrcc_v6_33_reporting_views |
| 20260528120215 | gravrcc_v6_34_rls_policy_hardening |
| 20260601134043 | create_gfa_ui_schema_v1 |
| 20260601134423 | create_gfa_ui_supplemental_tables_v1 |
| 20260601135144 | add_missing_user_profile_columns |
| 20260601135205 | fix_user_profiles_user_id_column |
| 20260601135453 | add_supabase_participant_id_to_profiles |
| 20260601142051 | create_form_suite_tables |
| 20260601153221 | expose_gfa_schemas_to_postgrest |
| 20260604182227 | fix_extensions_schema_and_pg_stat_statements |
| 20260605041139 | create_base_schemas |
| 20260605041155 | auth_rbac |
| 20260605041302 | gfa_lookup_tables |
| 20260605054125 | role_preassignments |
| 20260605055211 | rls_policies_v2 |
| 20260605055520 | gfa_lookup_missing_tables |
| 20260605080452 | gfa_ui_extended_forms_v1 |
| 20260606041328 | fix_trigger_rls_bypass_and_rpc |
| 20260606051139 | fix_my_participant_id_fallback |
| 20260606054303 | consent_privacy_session_infrastructure |
| 20260606054634 | fix_privacy_preferences_columns |
| 20260606121309 | add_faith_reframe_column |
| 20260607003313 | fix_signup_unique_constraint_on_participants |
| 20260607004753 | add_denial_reason_to_access_requests |
| 20260607062959 | super_admin_get_my_role_v2 |
| 20260607201719 | barc10_assessments_table |
| 20260607223001 | gravrcc_v6_20_touchpoints_cultivation_sessions |
| 20260609051307 | gfa_ui_add_check_in_and_circle_session_tables |
| 20260609051546 | gfa_ui_add_narcan_trainings |
| 20260616073403 | residence_module |
| 20260616082729 | v2_bridge_identity_helpers |
| 20260616083233 | v2_wire_rls_policies |
| 20260616143543 | align_is_staff_with_get_my_role |
| 20260616164425 | v2_participant_self_barc10_insert |
| 20260624070740 | session_engine_phase2b_step5_materialize_bridge |
| 20260624075022 | coach_identity_provisioning_step6_0 |
| 20260624085329 | step6_g1_booking_requests_participant_note |
| 20260630164421 | v13_two_program_identity_seam |
| 20260630164447 | v13_validate_resident_participant_fks |
| 20260630171635 | rls_v21_unify_get_my_role_drop_allowlist |
| 20260630171731 | rls_v21_fix_get_my_role_volatility |
| 20260630181410 | rls_v21_create_rpcs |
| 20260630181531 | rls_v21_policy_transaction |
| 20260630194104 | path_b_drop_v13_residence_participant_fks |
| 20260701032430 | pathc_gate2_identity_crosswalk_schema |
| 20260701035420 | pathc_gate3_seed_auto_confirmed_auth |
| 20260701035430 | pathc_gate3_seed_email_hint_pending |
| 20260701122212 | pathc_gate7_enrollment_audit |
| 20260701122445 | pathc_gate7_enroll_resident |
| 20260701133415 | pathc_gate9a_create_pilot_rr_program |
| 20260701160601 | pathc_gate9b_create_pilot_residence |
| 20260706035738 | wix_lead_staff_notifications |
| 20260706055357 | wix_contact_staff_read_policy |
| 20260708083840 | gate21a_get_lookup_optional_columns |
| 20260716062601 | mvp_coach_claim_policies |
| 20260716064016 | mvp_is_coach_and_claim_policies_v2 |
| 20260716141218 | vrcc_rls_hardening |
| 20260716141255 | vrcc_rls_hardening_fn_acl |
| 20260720080816 | gate_19b_mvp_rls_remediation |
| 20260721093025 | grace_house_gate1_policy_engine |
| 20260721093239 | grace_house_gate2_documents_signatures |
| 20260721093518 | grace_house_gate3_residence_ops |
| 20260721094227 | grace_house_gate3b_fn_hardening |
| 20260722153953 | vrcc_quantum_bridge_v3 |
| 20260722154113 | vrcc_quantum_bridge_v3_1 |
| 20260722163355 | v2_foundation |
| 20260722163418 | v2_go_live |
| 20260722163546 | v2_advisor_hardening |
| 20260722174737 | gracehouse_policy_engine |
| 20260722174757 | gracehouse_documents_signatures |
| 20260722175138 | gracehouse_residence_roles |
| 20260723052952 | vrcc_grace_house_seed_and_ooma_fix |
| 20260728004300 | grace_house_gate4b_house_board |
| 20260728090254 | gracehouse_public_forms |
| 20260728091330 | gracehouse_intake_workflow |
| 20260729021729 | expose_gfa_residence_to_postgrest |
| 20260729063611 | allow_bed_removal |
| 20260729080753 | gracehouse_dedup_quarantine_lineage_b |
| 20260729161224 | residence_apply_url |
| 20260729215703 | recoveryos_0000_create_schema |
| 20260729215714 | recoveryos_0001_foundation |
| 20260729215731 | recoveryos_0002_identity_organizations |
| 20260729215741 | recoveryos_0003_roles_participation |
| 20260729215756 | recoveryos_0004_residences |
| 20260729215819 | recoveryos_0005_services_recovery |
| 20260729215838 | recoveryos_0006_scheduling_residence_operations |
| 20260729215853 | recoveryos_0007_consent_documents_audit |
| 20260729215908 | recoveryos_0008_analytics_views |
| 20260729215947 | recoveryos_0009_row_level_security |
| 20260729220003 | recoveryos_0010_expose_recoveryos_to_postgrest |
| 20260729221602 | recoveryos_0011_pin_function_search_path |
| 20260729231230 | recoveryos_0012_service_event_self_insert |
| 20260730160933 | public_applications |
| 20260730165148 | recoveryos_0013_residence_documents |
| 20260730171156 | recoveryos_0014_provider_hub |
| 20260730172709 | recoveryos_0015_house_board_reports |
| 20260731053130 | recoveryos_0016_referrals |
| 20260731053322 | recoveryos_0016b_referrals_anon_grants |
| 20260731084630 | recoveryos_0017_compliance_auto_evidence |
| 20260802184420 | recoveryos_0014_fix_document_policy_recursion |
| 20260802200830 | recoveryos_0015_appointment_request_self |
| 20260803162151 | recoveryos_0016_residency_phase |
| 20260804141806 | recoveryos_0018_applicant_flow |
| 20260804141821 | recoveryos_0019_universal_residence_onboarding |
| 20260805065106 | recoveryos_0023_recovery_pulse |
| 20260806031121 | recoveryos_0024_check_in_slogan |
| 20260807090508 | vrcc_coaching_engine_v1 |
| 20260807090536 | vrcc_coaching_engine_v1_tables |
| 20260807090611 | vrcc_coaching_engine_v1_triggers |
| 20260807090730 | vrcc_coaching_engine_v1_cron |
| 20260807093738 | coaching_engine_p0_hardening |

Note: TypeScript database types are not yet committed — generate them in CI or
locally with `supabase gen types typescript --project-id ykykeioydvtxpyreshhs`
once a `packages/database-types` home is agreed; do not hand-write them.
