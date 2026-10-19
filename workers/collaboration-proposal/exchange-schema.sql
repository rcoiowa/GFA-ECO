-- REVIEW PROPOSAL ONLY. After authorization-schema.sql. No credentials or scheduler.
begin;
create role recoveryos_bridge_worker nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
create table recoveryos_bridge_private.requests (
 id uuid primary key default gen_random_uuid(), owner uuid not null, residence bigint not null references recoveryos.residences,
 operation text not null, digest text not null, envelope jsonb not null,
 created timestamptz not null default now(), expires timestamptz not null default now()+interval '30 days',
 unique(owner,operation)
);
create table recoveryos_bridge_private.replies (
 request uuid primary key references recoveryos_bridge_private.requests,
 operation text not null, digest text not null, envelope jsonb not null, created timestamptz not null default now()
);
create table recoveryos_bridge_private.subscriptions (
 id text primary key, owner uuid not null, residence bigint not null references recoveryos.residences,
 principal jsonb not null, envelope jsonb not null, expires timestamptz not null,
 revision integer not null default 1, active boolean not null default true
);
create table recoveryos_bridge_private.outbox (
 id uuid primary key default gen_random_uuid(), request uuid not null references recoveryos_bridge_private.requests,
 subscription text not null references recoveryos_bridge_private.subscriptions,
 status text not null default 'pending' check(status in ('pending','accepted','failed','cancelled')),
 attempts integer not null default 0, next_at timestamptz not null default now(),
 lease_until timestamptz, lease_id uuid, unique(request,subscription)
);
create index bridge_outbox_due on recoveryos_bridge_private.outbox(next_at) where status='pending';
create table recoveryos_bridge_private.audit (
 id bigint generated always as identity primary key, owner uuid, request uuid, kind text not null, created timestamptz not null default now()
);
create function recoveryos_bridge_private.principal_allowed(p jsonb,r bigint)
returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((p->>'expiresAt')::numeric > extract(epoch from now())*1000
 and recoveryos_bridge_private.authorized((p->>'subject')::uuid,(p->>'sessionId')::uuid,(p->>'clientId')::uuid,r),false)
$$;
-- Only the trusted Edge worker may call this parameterized dispatcher. It verifies JWTs
-- before constructing principal; no user-supplied principal is accepted by its HTTP API.
create function recoveryos_bridge_private.exchange_command(op text,p jsonb,a jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare owner_id uuid; residence_id bigint; req recoveryos_bridge_private.requests;
 rep recoveryos_bridge_private.replies; sub recoveryos_bridge_private.subscriptions;
 job recoveryos_bridge_private.outbox; expires_at timestamptz; status_code integer;
 result jsonb; found_id uuid;
begin
 if octet_length(a::text)>80000 or octet_length(p::text)>2048 then raise exception 'bounded_input_required'; end if;
 if op='claim' then
  -- Expiry/revocation is a state transition, never destructive cleanup.
  update recoveryos_bridge_private.outbox o set status='cancelled',lease_id=null,lease_until=null
   from recoveryos_bridge_private.subscriptions s,recoveryos_bridge_private.requests r
   where o.subscription=s.id and o.request=r.id and o.status='pending'
    and (not s.active or s.expires<=now() or r.expires<=now() or not recoveryos_bridge_private.principal_allowed(s.principal,s.residence));
  select o.* into job from recoveryos_bridge_private.outbox o where o.status='pending' and o.next_at<=now()
   and (o.lease_until is null or o.lease_until<=now()) order by o.next_at,o.id for update skip locked limit 1;
  if not found then return null; end if;
  -- Bounded retries also cover workers that crash without calling finish.
  if job.attempts>=5 then
   update recoveryos_bridge_private.outbox set status='failed',lease_id=null,lease_until=null where id=job.id;
   return jsonb_build_object('skipped',true);
  end if;
  update recoveryos_bridge_private.outbox set attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '30 seconds'
   where id=job.id returning * into job;
  select * into req from recoveryos_bridge_private.requests where id=job.request;
  select * into sub from recoveryos_bridge_private.subscriptions where id=job.subscription;
  return jsonb_build_object('job',to_jsonb(job),'subscription',to_jsonb(sub),'owner',req.owner,'residence',req.residence::text,'created',req.created);
 elsif op='finish' then
  status_code:=(a->>'status')::integer;
  update recoveryos_bridge_private.outbox set
   status=case when status_code between 200 and 299 then 'accepted' when status_code between 300 and 499 and status_code<>429 or attempts>=5 then 'failed' else 'pending' end,
   next_at=now()+make_interval(secs=>least(300,power(2,attempts)::integer)),lease_until=null,lease_id=null
   where id=(a->>'id')::uuid and lease_id=(a->>'lease_id')::uuid and lease_until>now() and status='pending'
   returning id into found_id;
  if found_id is not null and status_code=410 then
   select * into job from recoveryos_bridge_private.outbox where id=found_id;
   update recoveryos_bridge_private.subscriptions set active=false where id=job.subscription;
   update recoveryos_bridge_private.outbox set status='cancelled',lease_id=null,lease_until=null where subscription=job.subscription and status='pending';
  end if;
  if found_id is not null then insert into recoveryos_bridge_private.audit(owner,request,kind)
   select r.owner,r.id,'delivery_'||o.status from recoveryos_bridge_private.outbox o join recoveryos_bridge_private.requests r on r.id=o.request where o.id=found_id; end if;
  return jsonb_build_object('applied',found_id is not null);
 end if;
 owner_id:=(p->>'subject')::uuid; residence_id:=nullif(a->>'residence_id','')::bigint;
 if not recoveryos_bridge_private.principal_allowed(p,residence_id) then raise exception 'not_authorized'; end if;
 if op='authorize' then return 'true'::jsonb; end if;
 if residence_id is null then raise exception 'residence_required'; end if;
 -- Serialize quota/idempotency/subscription operations per owner across independent workers.
 perform pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 if op='enqueue' then
  if p->>'channel' is distinct from 'app' or p->>'clientId' is not null or a->'approved' is distinct from 'true'::jsonb
   or coalesce(a->>'operation_id','') !~ '^[A-Za-z0-9_-]{1,128}$' or coalesce(a->>'digest','') !~ '^[a-f0-9]{64}$'
   or jsonb_typeof(a->'envelope') is distinct from 'object' then raise exception 'explicit_selected_context_required'; end if;
  select * into req from recoveryos_bridge_private.requests where owner=owner_id and operation=a->>'operation_id';
  if found then
   if req.digest<>a->>'digest' or req.residence<>residence_id then raise exception 'idempotency_conflict'; end if;
   return jsonb_build_object('request_id',req.id,'status','queued');
  end if;
  if (select count(*) from recoveryos_bridge_private.requests where owner=owner_id and created>now()-interval '1 hour')>=30 then raise exception 'request_rate_limit'; end if;
  insert into recoveryos_bridge_private.requests(owner,residence,operation,digest,envelope)
   values(owner_id,residence_id,a->>'operation_id',a->>'digest',a->'envelope') returning * into req;
  insert into recoveryos_bridge_private.outbox(request,subscription)
   select req.id,s.id from recoveryos_bridge_private.subscriptions s where s.owner=owner_id and s.residence=residence_id and s.active and s.expires>now();
  insert into recoveryos_bridge_private.audit(owner,request,kind) values(owner_id,req.id,'selected_context_approved');
  return jsonb_build_object('request_id',req.id,'status','queued');
 elsif op in ('read_request','request_status','reply_to_request') then
  select * into req from recoveryos_bridge_private.requests where id=(a->>'request_id')::uuid and owner=owner_id and residence=residence_id and expires>now() for update;
  if not found then raise exception 'not_authorized'; end if;
  select * into rep from recoveryos_bridge_private.replies where request=req.id;
  if op='reply_to_request' then
   if p->>'channel' is distinct from 'mcp' or p->>'clientId' is null or coalesce(a->>'operation_id','') !~ '^[A-Za-z0-9_-]{1,128}$'
    or coalesce(a->>'digest','') !~ '^[a-f0-9]{64}$' or jsonb_typeof(a->'envelope') is distinct from 'object' then raise exception 'invalid_reply'; end if;
   if rep.request is not null then
    if rep.digest<>a->>'digest' or rep.operation<>a->>'operation_id' then raise exception 'reply_already_recorded'; end if;
   else
    insert into recoveryos_bridge_private.replies(request,operation,digest,envelope) values(req.id,a->>'operation_id',a->>'digest',a->'envelope');
    insert into recoveryos_bridge_private.audit(owner,request,kind) values(owner_id,req.id,'reply_received');
   end if;
   return jsonb_build_object('request_id',req.id,'status','reply_received','reviewOnly',true);
  end if;
  result:=jsonb_build_object('request_id',req.id,'reviewOnly',true,'status',case when rep.request is not null then 'reply_received'
   when exists(select 1 from recoveryos_bridge_private.outbox where request=req.id and status='accepted') then 'event_accepted'
   when exists(select 1 from recoveryos_bridge_private.outbox where request=req.id and status in ('failed','cancelled'))
    and not exists(select 1 from recoveryos_bridge_private.outbox where request=req.id and status='pending') then 'delivery_failed' else 'queued' end);
  if op='read_request' then return result||jsonb_build_object('envelope',req.envelope,'operation',req.operation);
  else return result||jsonb_build_object('envelope',rep.envelope,'operation',rep.operation); end if;
 elsif op='verification_attempt' then
  if p->>'channel' is distinct from 'mcp' then raise exception 'mcp_required'; end if;
  if (select count(*) from recoveryos_bridge_private.audit where owner=owner_id and kind='subscription_attempt' and created>now()-interval '1 hour')>=20 then raise exception 'subscription_rate_limit'; end if;
  insert into recoveryos_bridge_private.audit(owner,kind) values(owner_id,'subscription_attempt');return '{}'::jsonb;
 elsif op in ('subscription_get','subscription_put','unsubscribe') then
  if p->>'channel' is distinct from 'mcp' or p->>'clientId' is null or coalesce(a->>'id','') !~ '^[a-f0-9]{64}$' then raise exception 'mcp_required'; end if;
  select * into sub from recoveryos_bridge_private.subscriptions where id=a->>'id' and owner=owner_id and residence=residence_id;
  if op='subscription_get' then return case when sub.active and sub.expires>now() then to_jsonb(sub) else null end; end if;
  if op='unsubscribe' then
   update recoveryos_bridge_private.subscriptions set active=false where id=sub.id;
   update recoveryos_bridge_private.outbox set status='cancelled',lease_id=null,lease_until=null where subscription=sub.id and status='pending';
   insert into recoveryos_bridge_private.audit(owner,kind) values(owner_id,'subscription_stopped');return '{}'::jsonb;
  end if;
  expires_at:=to_timestamp((a->>'expiresAt')::numeric/1000);
  if expires_at is null or expires_at<=now() or expires_at>now()+interval '1 hour' or expires_at>to_timestamp((p->>'expiresAt')::numeric/1000)
   or jsonb_typeof(a->'envelope') is distinct from 'object' then raise exception 'invalid_subscription'; end if;
  if (select count(*) from recoveryos_bridge_private.subscriptions where owner=owner_id and active and expires>now() and id<>a->>'id')>=10 then raise exception 'subscription_limit'; end if;
  insert into recoveryos_bridge_private.subscriptions(id,owner,residence,principal,envelope,expires)
   values(a->>'id',owner_id,residence_id,p,a->'envelope',expires_at)
   on conflict(id) do update set principal=excluded.principal,envelope=excluded.envelope,expires=excluded.expires,active=true,revision=recoveryos_bridge_private.subscriptions.revision+1
    where recoveryos_bridge_private.subscriptions.owner=owner_id and recoveryos_bridge_private.subscriptions.residence=residence_id;
  update recoveryos_bridge_private.outbox set lease_id=null,lease_until=null where subscription=a->>'id' and status='pending';
  insert into recoveryos_bridge_private.outbox(request,subscription)
   select r.id,a->>'id' from recoveryos_bridge_private.requests r where r.owner=owner_id and r.residence=residence_id and r.expires>now()
    and not exists(select 1 from recoveryos_bridge_private.replies where request=r.id) on conflict(request,subscription) do nothing;
  insert into recoveryos_bridge_private.audit(owner,kind) values(owner_id,'subscription_verified');
  return jsonb_build_object('id',a->>'id','refreshBefore',expires_at,'cursor',null,'truncated',false);
 end if;
 raise exception 'unknown_operation';
end;
$$;
revoke all on all tables in schema recoveryos_bridge_private from public,anon,authenticated,recoveryos_bridge_client,recoveryos_bridge_worker;
revoke all on function recoveryos_bridge_private.principal_allowed(jsonb,bigint) from public,anon,authenticated,recoveryos_bridge_client,recoveryos_bridge_worker;
revoke all on function recoveryos_bridge_private.exchange_command(text,jsonb,jsonb) from public,anon,authenticated,recoveryos_bridge_client;
grant usage on schema recoveryos_bridge_private to recoveryos_bridge_worker;
grant execute on function recoveryos_bridge_private.exchange_command(text,jsonb,jsonb) to recoveryos_bridge_worker;
-- No LOGIN, password, authenticator membership, ordinary API grants, deletion or schedule.
commit;
