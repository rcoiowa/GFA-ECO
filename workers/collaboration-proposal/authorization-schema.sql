-- PROPOSAL ONLY. No role/credential created and no production grant performed.
-- Separate unexposed schema; this is NOT an authenticated/anonymous Data API RPC.
begin;
create schema recoveryos_bridge_private;
revoke all on schema recoveryos_bridge_private from public,anon,authenticated;
-- OAuth openid is identity consent, not permission to exchange workspace text.
create table recoveryos_bridge_private.client_approvals (
 client_id uuid primary key, resource text not null check(resource like 'https://%'), enabled boolean not null default false
);
create table recoveryos_bridge_private.exchange_approvals (
 subject uuid not null, client_id uuid not null references recoveryos_bridge_private.client_approvals,
 residence_id bigint not null references recoveryos.residences, revoked_at timestamptz,
 primary key(subject,client_id,residence_id)
);
revoke all on all tables in schema recoveryos_bridge_private from public,anon,authenticated;
create function recoveryos_bridge_private.authorized(p_subject uuid,p_session uuid,p_client uuid,p_residence bigint)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
  select 1 from auth.users u
  join auth.sessions s on s.user_id=u.id and s.id=p_session
  join recoveryos.people p on p.auth_user_id=u.id
  join recoveryos.person_classification pc on pc.person_id=p.id and pc.classification='production'
  where u.id=p_subject and u.deleted_at is null and not coalesce(u.is_anonymous,false)
   and (u.banned_until is null or u.banned_until<now())
   and (s.not_after is null or s.not_after>now())
   and s.oauth_client_id is not distinct from p_client
   and exists(select 1 from recoveryos.role_assignments ra where ra.person_id=p.id
     and ra.role_key::text in ('administrator','system_administrator') and ra.revoked_at is null)
   -- Existing platform admins are care-operations staff, with global residence authority.
   -- This does not grant that authority to a residence-only staff member or coach.
   and (p_residence is null or exists(select 1 from recoveryos.residences r where r.id=p_residence and r.is_active))
   and (p_client is null or (
     exists(select 1 from auth.oauth_clients c where c.id=p_client and c.deleted_at is null)
     and exists(select 1 from recoveryos_bridge_private.client_approvals ca
       join recoveryos_bridge_private.exchange_approvals ea on ea.client_id=ca.client_id
       where ca.client_id=p_client and ca.enabled and ea.subject=p_subject and ea.revoked_at is null
        and (p_residence is null or ea.residence_id=p_residence))
     and 'openid'=any(string_to_array(s.scopes,' '))
     and exists(select 1 from auth.oauth_consents c where c.user_id=u.id and c.client_id=p_client
       and c.revoked_at is null and 'openid'=any(string_to_array(c.scopes,' ')))
   ))
 );
$$;
revoke all on function recoveryos_bridge_private.authorized(uuid,uuid,uuid,bigint) from public,anon,authenticated;
-- AFTER separate approval and separately provisioned credential:
-- grant usage on schema recoveryos_bridge_private to recoveryos_bridge_authorizer;
-- grant execute on function recoveryos_bridge_private.authorized(uuid,uuid,uuid,bigint) to recoveryos_bridge_authorizer;
-- Role must have no other application table/RPC privileges, memberships, BYPASSRLS,
-- creation rights or service_role credential. Review inherited PUBLIC grants too.
commit;
