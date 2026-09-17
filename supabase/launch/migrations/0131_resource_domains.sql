-- 0131_resource_domains.sql — P1.4: resource taxonomy normalization (additive).
--
-- Ratification §18 (P1.4): "Normalize the resource taxonomy without rewriting historical
-- values." The freeform resources.category column (three generations of drifted values —
-- Title-Case gen1, lowercase v2, NULLs) is DEPRECATED in place, never rewritten. The new
-- resource_domains join table carries the canonical domain lens; a resource may serve
-- multiple domains (peer-support serves both recovery and community — the ratified boundary
-- expressed as data, not a fused category).
--
-- Backfill is DETERMINISTIC from resources.resource_type (the stable machine column),
-- never from the drifted category text:
--   substance-use-treatment, mental-health, crisis-line, mat-provider, harm-reduction -> health
--   peer-support     -> recovery + community
--   recovery-housing -> housing + recovery
--   reentry, legal   -> justice
--   employment       -> employment_purpose
--   food             -> financial_stability
--   transport        -> transportation
-- Rows with NULL resource_type are left unmapped for human data review (reported, not
-- guessed). Out-of-state seed rows (e.g. the Virginia transit row) are flagged in the
-- implementation report for review — NEVER deleted here.
--
-- Posture matches 0129: reference/lens data, RLS on, authenticated SELECT, no client
-- writes (explicit revokes vs 0110 blanket grants). A domain mapping must never gate,
-- rank, or auto-trigger anything — it is presentation and reporting structure only.
--
-- ROLLBACK: drop table recoveryos.resource_domains;
--           comment on column recoveryos.resources.category is null;

set search_path = recoveryos, public;

create table if not exists recoveryos.resource_domains (
  resource_id bigint not null references recoveryos.resources (id) on delete cascade,
  domain_key text not null references recoveryos.domains (key),
  primary key (resource_id, domain_key)
);
comment on table recoveryos.resource_domains is
  'Canonical domain lens over community resources (RATIFIED canon, 0129). Multi-domain by '
  'design (peer support serves recovery AND community). Backfilled deterministically from '
  'resource_type; maintained by migrations/admin tooling, never client writes. Never used '
  'to gate access or trigger automation.';

alter table recoveryos.resource_domains enable row level security;

create policy resource_domains_read on recoveryos.resource_domains
  for select to authenticated using (true);

revoke insert, update, delete on recoveryos.resource_domains from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Deterministic backfill from resource_type (idempotent; NULL types left for review).
-- ---------------------------------------------------------------------------
insert into recoveryos.resource_domains (resource_id, domain_key)
select r.id, m.domain_key
from recoveryos.resources r
join lateral (
  select unnest(
    case r.resource_type
      when 'substance-use-treatment' then array['health']
      when 'mental-health'           then array['health']
      when 'crisis-line'             then array['health']
      when 'mat-provider'            then array['health']
      when 'harm-reduction'          then array['health']
      when 'peer-support'            then array['recovery', 'community']
      when 'recovery-housing'        then array['housing', 'recovery']
      when 'reentry'                 then array['justice']
      when 'legal'                   then array['justice']
      when 'employment'              then array['employment_purpose']
      when 'food'                    then array['financial_stability']
      when 'transport'               then array['transportation']
      else array[]::text[]
    end
  ) as domain_key
) m on true
on conflict (resource_id, domain_key) do nothing;

-- Deprecate the drifted freeform column IN PLACE: historical values preserved, never
-- rewritten; nothing new should read or write it.
comment on column recoveryos.resources.category is
  'DEPRECATED (P1.4, 2026-08-21): freeform legacy taxonomy with three drifted value '
  'generations — preserved read-only as history, never rewritten. Canonical classification '
  'lives in recoveryos.resource_domains (+ the stable resource_type machine column).';

notify pgrst, 'reload schema';
