# grace-coaching-canary — canonical write canary (P3C-B3)

A controlled, non-production consumer that exercises the **canonical** coaching write path
(`recoveryos.*` RPCs) end-to-end over authenticated HTTP. It exists to close the one gap DB
tests cannot: proving `real JWT → RLS → current_person_id → canonical RPC → canonical state +
v2 compatibility` for the actual user-facing workflows — **without** repointing the production
Grace Coaching function and **without** flipping production write authority.

## Status

- **Built, not deployed.** The migration-authoring environment has no outbound HTTPS to
  `*.supabase.co` (org egress policy — `403 CONNECT`), so it can neither deploy nor drive the
  canary. Deploy + run is an operator step in an HTTP-capable session/staging environment.
- Nothing here changes production. `write_authority` for every domain remains `v2` in production.

## Security model (P3C-B §24/§25) — not an alternate production entrance

1. **Off by default:** `CANARY_ENABLED` must be exactly `true`, else every request gets `503`.
2. **Allowlist:** the caller's JWT `sub` must be in `CANARY_ALLOWED_SUBS` (comma-separated).
   Test/fixture identities only; any other authenticated user gets `403`. Not relying on obscurity.
3. **No service role:** every action runs under the *caller's* JWT (anon key + `Authorization`
   header), so RLS and canonical authority apply exactly as in production — the canary can never
   exceed the caller's own permissions.
4. **No external delivery:** in-app canonical state only; never sends email/SMS.

## Deploy (operator, HTTP-capable session)

```bash
# 1. set env (fixtures only)
supabase secrets set CANARY_ENABLED=true \
  CANARY_ALLOWED_SUBS=d0000000-0000-4000-a000-000000000001,d0000000-0000-4000-a000-000000000002
# 2. deploy
supabase functions deploy grace-coaching-canary
```

Prefer a **staging project** (a branch/clone) if available. If run against the live project,
keep it gated as above and use only the `@vrcc-v2.test` fixture identities; the canary calls
canonical RPCs directly, which write canonical rows regardless of `write_authority` — fixtures
keep that safe (they are excluded from all production surfaces).

## Precondition the operator arranges (NOT done here)

For the canary flows to become authoritative in the canary/staging environment, flip the
relevant domains to canonical **there** (never production without the readiness gate):

```sql
select recoveryos.set_write_authority('relationships','canonical');
select recoveryos.set_write_authority('support_requests','canonical');
select recoveryos.set_scheduling_write_authority('canonical');   -- bookings + appointments together
-- optional, for the notification assertions:
select recoveryos.set_write_authority('notifications','canonical');
```

and grant the coach fixture a coach role assignment through the controlled path. Revert with the
same functions passing `'v2'` when done.

## Run the HTTP test matrix

```bash
export CANARY_URL=https://<project>.functions.supabase.co/grace-coaching-canary
export SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<anon>
export PARTICIPANT_JWT=<fixture 10 token> COACH_JWT=<fixture 15 token> OUTSIDER_JWT=<fixture token>
export PARTICIPANT_PERSON_ID=10 COACH_PERSON_ID=15
deno run --allow-net --allow-env harness.ts
```

`harness.ts` asserts **semantic postconditions** (§23), not just HTTP 200: one active primary
relationship, participant-owned support request with pool/fixture rules, exactly one confirmed
appointment per accepted negotiation (double-accept returns the same appointment), v2
compatibility session confirmed at the same time, reschedule lineage, and negative-authorization
cases (participant self-assign rejected, cross-person request rejected, non-allowlisted `403`).

A green run is what earns **HTTP-VERIFIED** for the scheduling/relationship/support-request
domains and unlocks the P3C-B4 production-activation readiness decision — which still requires
explicit authorization (directive §27/§38).
