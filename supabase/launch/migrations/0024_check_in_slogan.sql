-- Record which slogan the Recovery Pulse surfaced with a check-in.
--
-- Two reasons this is stored rather than recomputed: the recommendation must
-- stay stable for the person who saw it (a later content change must not
-- rewrite their history), and the repeat penalty in the slogan chain needs to
-- know what they have actually been shown.
--
-- Additive and nullable — existing rows stay valid.
set search_path = recoveryos, public;

alter table check_ins
  add column if not exists slogan_number int
    check (slogan_number is null or slogan_number between 1 and 59);

comment on column check_ins.slogan_number is
  'The slogan surfaced at Connect/Respond for this check-in (1-59, Recovering the Mind).';

-- Staff see which practice was offered, never the participant's reflection on
-- it — same posture as the rest of the check-in (ADR-0015).
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
         c.created_at,
         -- Appended, not inserted: `create or replace view` cannot reorder
         -- existing columns.
         c.slogan_number
  from check_ins c;

notify pgrst, 'reload schema';
