// Proposed managed Edge entrypoint. No deployment/configuration is performed by this file.
// Separate activation approval is required; both gates default off.
import postgres from 'npm:postgres@3.4.7';
import { createEdgeRuntime } from '../../../workers/collaboration-proposal/edge/runtime.mjs';
import { unbase64 } from '../../../workers/collaboration-proposal/edge/crypto.mjs';
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };
const readJson = (name: string) => {
  try { return JSON.parse(Deno.env.get(name) ?? '{}'); } catch { throw new Error('invalid_bridge_configuration'); }
};
const enabled = Deno.env.get('COLLABORATION_BRIDGE_ENABLED') === 'true';
const egressVerified = Deno.env.get('COLLABORATION_MANAGED_EGRESS_VERIFIED') === 'true';
let runtime;
if (!enabled || !egressVerified) {
  runtime = createEdgeRuntime({ enabled: false });
} else {
  // Dedicated LOGIN provisioned separately, member only of recoveryos_bridge_worker.
  // Never use SUPABASE_SERVICE_ROLE_KEY, the postgres owner, or authenticator here.
  const databaseUrl = Deno.env.get('COLLABORATION_WORKER_DATABASE_URL');
  if (!databaseUrl) throw new Error('dedicated_worker_database_required');
  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: true }, max: 1, prepare: false,
    connect_timeout: 5, idle_timeout: 20, max_lifetime: 300,
    connection: { statement_timeout: 10000, lock_timeout: 5000 },
    onnotice: () => {},
  });
  const access = await sql`select current_user as name,
    pg_has_role(current_user,'recoveryos_bridge_worker','member') as worker,
    pg_has_role(current_user,'authenticated','member') as ordinary,
    (select rolsuper or rolbypassrls or rolcreaterole or rolcreatedb from pg_roles where rolname=current_user) as elevated,
    has_schema_privilege(current_user,'recoveryos','usage') as application_access,
    exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname in ('public','auth','recoveryos') and c.relkind in ('r','v')
      and has_schema_privilege(current_user,n.oid,'usage')
      and has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE')) as ordinary_tables,
    exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname in ('public','auth','recoveryos') and p.prosecdef and p.prorettype<>'trigger'::regtype
      and has_schema_privilege(current_user,n.oid,'usage')
      and has_function_privilege(current_user,p.oid,'EXECUTE')) as ordinary_functions`;
  if (!access[0].worker || access[0].ordinary || access[0].elevated || access[0].application_access || access[0].ordinary_tables || access[0].ordinary_functions) {
    await sql.end(); throw new Error('worker_database_role_not_restricted');
  }
  const encoded = readJson('COLLABORATION_ENCRYPTION_KEYRING');
  const keys = Object.fromEntries(Object.entries(encoded).map(([id, value]) => [id, unbase64(String(value))]));
  runtime = createEdgeRuntime({
    enabled, egressVerified,
    resource: Deno.env.get('COLLABORATION_RESOURCE'),
    appOrigin: Deno.env.get('COLLABORATION_APP_ORIGIN'),
    activeKeyId: Deno.env.get('COLLABORATION_ACTIVE_KEY_ID'),
    oauth: {
      issuer: Deno.env.get('COLLABORATION_OAUTH_ISSUER'),
      jwksUrl: Deno.env.get('COLLABORATION_JWKS_URL'),
      clientIds: readJson('COLLABORATION_CLIENT_IDS'),
    },
  }, {
    keys,
    query: (text: string, params: string[]) => sql.unsafe(text, params),
    waitUntil: (promise: Promise<unknown>) => EdgeRuntime.waitUntil(promise),
  });
}
Deno.serve((request: Request) => runtime.fetch(request));
