-- Advisor remediation: pin the trigger function's search_path
-- (function_search_path_mutable warning on recoveryos.set_updated_at).
alter function recoveryos.set_updated_at() set search_path = recoveryos, public;
