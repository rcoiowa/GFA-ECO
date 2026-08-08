-- Referral partner intake (Room 4): "a probation officer can submit a
-- referral at 4:45pm on a Friday and know it was received." Public
-- submission from the directory site (no account), staff triage in the
-- operator dashboard.

set search_path = recoveryos, public;

create table referrals (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id),
  referrer_name text not null,
  referrer_organization text,
  referrer_role text,
  referrer_email text,
  referrer_phone text,
  participant_name text not null,
  participant_phone text,
  participant_location text,
  notes text,
  consent_attested boolean not null default false,
  status text not null default 'received'
    check (status in ('received', 'contacted', 'converted', 'closed')),
  handled_by_person_id bigint references people (id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index referrals_residence_idx on referrals (residence_id, status, created_at desc);

alter table referrals enable row level security;

-- Public submission: the directory's referral form works on a phone
-- without an account. Inserts only, always status 'received'; reads and
-- updates stay staff-only.
create policy referrals_public_insert on referrals
  for insert to anon, authenticated
  with check (status = 'received' and handled_by_person_id is null and handled_at is null);

create policy referrals_staff on referrals
  for select using (residence_id in (select staff_residence_ids()));
create policy referrals_staff_update on referrals
  for update using (residence_id in (select staff_residence_ids()));

-- The anon role needs the insert path explicitly (schema exposure granted
-- table privileges to authenticated only). Applied live as 0016b.
grant usage on schema recoveryos to anon;
grant insert on recoveryos.referrals to anon;
grant usage, select on sequence recoveryos.referrals_id_seq to anon;

notify pgrst, 'reload schema';
