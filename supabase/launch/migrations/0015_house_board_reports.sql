-- House community board (Room 2 completion) and staff read access needed
-- for supervision compliance reports (Room 4 seed).

set search_path = recoveryos, public;

-- House board: announcements, meeting notes, milestone celebrations.
-- "Feels like belonging — not a bulletin board."
create table house_posts (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id) on delete cascade,
  author_person_id bigint not null references people (id),
  category text not null default 'announcement'
    check (category in ('announcement', 'meeting_notes', 'milestone', 'gratitude')),
  title text not null,
  body text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index house_posts_residence_idx on house_posts (residence_id, is_pinned desc, created_at desc);

alter table house_posts enable row level security;

-- Residents of the house read the board and may add gratitude/milestone
-- posts of their own; staff manage everything.
create policy house_posts_resident_read on house_posts
  for select using (
    residence_id in (select residence_id from residencies
                     where person_id = current_person_id()
                       and residency_status in ('active', 'on_pass', 'transitioning'))
  );
create policy house_posts_resident_write on house_posts
  for insert with check (
    author_person_id = current_person_id()
    and category in ('milestone', 'gratitude')
    and residence_id in (select residence_id from residencies
                         where person_id = current_person_id()
                           and residency_status in ('active', 'on_pass', 'transitioning'))
  );
create policy house_posts_staff on house_posts
  for all using (residence_id in (select staff_residence_ids()));

-- Supervision reports read participation history: staff need residence-
-- scoped visibility of service events (attendance, check-ins, coaching).
create policy service_events_staff on service_events
  for select using (residence_id in (select staff_residence_ids()));

-- Staff also read check-in dates (not contents beyond ratings) for
-- engagement summaries of their residents.
create policy check_ins_staff on check_ins
  for select using (
    exists (select 1 from residencies r
            where r.person_id = check_ins.person_id
              and r.residence_id in (select staff_residence_ids())
              and r.residency_status in ('active', 'on_pass', 'transitioning'))
  );

notify pgrst, 'reload schema';
