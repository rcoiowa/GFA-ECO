-- PROPOSAL ONLY. Apply only after separate role/hook approval and existing hook review.
-- Hook must be composed with any existing configured hook, never silently replace it.
begin;
create role recoveryos_bridge_client nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
-- NO authenticated membership, NO table rights, NO application RPC grants.
-- PostgREST authenticator membership is a separate activation grant, not performed here.
create function recoveryos_bridge_private.restrict_access_token(event jsonb)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare claims jsonb := event->'claims'; client uuid; config recoveryos_bridge_private.client_approvals;
begin
 if claims->>'client_id' is null then return event; end if;
 begin client := (claims->>'client_id')::uuid; exception when invalid_text_representation then return event; end;
 select * into config from recoveryos_bridge_private.client_approvals where client_id=client;
 if not found then return event; end if;
 -- A disabled registered client must never fall back to an ordinary authenticated JWT.
 if not config.enabled then raise exception 'bridge client disabled'; end if;
 claims := claims || jsonb_build_object('role','recoveryos_bridge_client','aud',config.resource,
   'recoveryos_permission','collaboration:exchange');
 return jsonb_set(event,'{claims}',claims);
end;
$$;
revoke all on function recoveryos_bridge_private.restrict_access_token(jsonb) from public,anon,authenticated;
-- Separately approved hook activation:
-- grant usage on schema recoveryos_bridge_private to supabase_auth_admin;
-- grant execute on function recoveryos_bridge_private.restrict_access_token(jsonb) to supabase_auth_admin;
-- grant recoveryos_bridge_client to authenticator;
-- Do not grant authenticated to recoveryos_bridge_client, or grant it ordinary RPCs.
commit;
