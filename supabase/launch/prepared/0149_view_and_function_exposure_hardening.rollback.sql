-- 0149_view_and_function_exposure_hardening.rollback.sql
--
-- Restores the pre-0149 exposure state (captured from the isolated 0146
-- replay catalog): the writable view grants and the PUBLIC-default function
-- ACLs. WARNING: rolling back restores two exploit-confirmed exposures
-- (G3-F1 authenticated write-through on the public directory view; G3-F3
-- anonymous narr_compliance writes). Requires the same authority as 0149,
-- with the reason recorded.

begin;

-- G3-F1 / G3-F2: restore the (excess) client write grants that existed.
grant insert, update on recoveryos.residence_directory_public to authenticated;
grant insert, update on recoveryos.check_ins_staff_view to authenticated;

-- G3-F3: restore default-equivalent PUBLIC execute on the six functions.
grant execute on function recoveryos.current_person_id() to public;
grant execute on function recoveryos.has_role(recoveryos.role_key) to public;
grant execute on function recoveryos.staff_residence_ids() to public;
grant execute on function recoveryos.my_assigned_document_template_ids() to public;
grant execute on function recoveryos.my_assigned_document_version_ids() to public;
grant execute on function recoveryos.narr_auto_evidence(bigint, text, text) to public;

-- Root-cause hardening reversal.
alter default privileges in schema recoveryos grant execute on functions to public;
alter default privileges in schema public grant execute on functions to public;

commit;
notify pgrst, 'reload schema';
