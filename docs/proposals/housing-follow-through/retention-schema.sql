-- REVIEW PROPOSAL ONLY. Owner-run maintenance, no client grant or scheduler installed.
-- Proposed policy: closed housing 365 days; inactive draft/revisions 90 days.
begin;
create function recoveryos.purge_housing_collaboration_retention()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare housing_count integer; workspace_count integer; revision_count integer;
begin
 -- Serialize with handoff/reopen operations before deleting eligible packages.
 perform 1 from recoveryos.housing_follow_through h
 where h.closed_at < now()-interval '365 days' and h.next_action is null and h.proposed_cover_person_id is null for update;
 delete from recoveryos.housing_source_references r using recoveryos.housing_follow_through h
 where r.intake_id=h.intake_id and h.closed_at<now()-interval '365 days' and h.next_action is null and h.proposed_cover_person_id is null;
 delete from recoveryos.housing_follow_through_events e using recoveryos.housing_follow_through h
 where e.intake_id=h.intake_id and h.closed_at<now()-interval '365 days' and h.next_action is null and h.proposed_cover_person_id is null;
 delete from recoveryos.housing_follow_through h
 where h.closed_at<now()-interval '365 days' and h.next_action is null and h.proposed_cover_person_id is null;
 get diagnostics housing_count = row_count;
 -- Lock inactive workspaces first. A concurrently saved workspace gets a fresh saved_at.
 perform 1 from recoveryos.admin_collaboration_workspaces w where w.saved_at<now()-interval '90 days' for update;
 delete from recoveryos.admin_collaboration_revisions where saved_at<now()-interval '90 days';
 get diagnostics revision_count = row_count;
 delete from recoveryos.admin_collaboration_workspaces w where w.saved_at<now()-interval '90 days';
 get diagnostics workspace_count = row_count;
 return jsonb_build_object('housing_packages',housing_count,'inactive_workspaces',workspace_count,'old_revisions',revision_count);
end $$;
revoke all on function recoveryos.purge_housing_collaboration_retention() from public,anon,authenticated;
commit;
