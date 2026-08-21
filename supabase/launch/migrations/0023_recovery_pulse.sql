-- Recovery Pulse — Layer 1 of the daily ICARE cycle (ADR-0015).
--
-- Additive only: existing check_ins rows stay valid (every new column is
-- nullable or defaulted), and the existing mood/craving 1-5 scales are kept so
-- historical trend continuity is preserved.
--
-- Privacy posture: reflection text is participant-private. Staff read
-- completion and permitted ratings through a view that excludes free text;
-- the pre-existing staff policy on check_ins is replaced accordingly.
set search_path = recoveryos, public;

-- ---------------------------------------------------------------- columns --
alter table check_ins
  add column if not exists period text
    check (period is null or period in ('morning', 'evening')),
  -- Participant-local calendar date (America/Chicago), supplied by the client.
  add column if not exists local_date date,
  add column if not exists hope_rating int check (hope_rating between 1 and 5),
  add column if not exists confidence_rating int check (confidence_rating between 1 and 5),
  add column if not exists purpose_rating int check (purpose_rating between 1 and 5),
  add column if not exists connection_level text
    check (connection_level is null or connection_level in ('yes', 'some', 'none')),
  add column if not exists intention text,
  add column if not exists reflection text,
  add column if not exists carry_forward text,
  add column if not exists challenge_tags text[] not null default '{}',
  add column if not exists prompt_quadrant text
    check (prompt_quadrant is null or prompt_quadrant in
      ('hope_agency', 'hope_acceptance', 'thanks_agency', 'thanks_acceptance')),
  add column if not exists prompt_response text,
  add column if not exists prompt_skips int not null default 0,
  -- Evening rows point at the morning they close, so intention and reflection
  -- stay paired for longitudinal analysis.
  add column if not exists paired_check_in_id bigint references check_ins (id) on delete set null,
  -- Which deterministic rules fired, for explainability and later evaluation.
  add column if not exists response_rule_ids text[] not null default '{}';

comment on column check_ins.prompt_quadrant is
  'The 2x2 quadrant of the prompt WE selected — never inferred from the response text (ADR-0015).';
comment on column check_ins.reflection is
  'Participant-private. Not exposed to staff by default; see check_ins_staff_view.';

-- One morning and one evening per participant-day. Amendments would be an
-- explicit product decision, not an accident of double-tapping submit.
create unique index if not exists check_ins_person_day_period_uidx
  on check_ins (person_id, local_date, period)
  where local_date is not null and period is not null;

create index if not exists check_ins_person_local_date_idx
  on check_ins (person_id, local_date desc);

-- ------------------------------------------------------- staff visibility --
-- Reflection text is private. Staff see completion, ratings, and connection
-- level; intention/reflection/carry_forward/prompt_response are excluded.
-- Any future sharing requires explicit, granular, revocable consent.
drop policy if exists check_ins_staff on check_ins;

create or replace view check_ins_staff_view
with (security_invoker = true) as
  select c.id,
         c.person_id,
         c.period,
         c.local_date,
         c.mood_rating,
         c.craving_rating,
         c.hope_rating,
         c.confidence_rating,
         c.purpose_rating,
         c.connection_level,
         c.challenge_tags,
         c.delivery_context,
         c.created_at
  from check_ins c;

comment on view check_ins_staff_view is
  'Staff-facing check-in data: completion and ratings only. Free-text reflection, intention, carry-forward, and prompt responses are deliberately excluded (ADR-0015 privacy posture).';

-- The view is security_invoker, so it needs a policy that admits staff to the
-- underlying rows. Column-level privacy is enforced by selecting the view.
create policy check_ins_staff_ratings on check_ins
  for select using (
    exists (
      select 1 from residencies r
      where r.person_id = check_ins.person_id
        and r.residence_id in (select staff_residence_ids())
        and r.residency_status in ('active', 'on_pass', 'transitioning')
    )
  );

grant select on check_ins_staff_view to authenticated;

notify pgrst, 'reload schema';
