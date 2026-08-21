-- Provider Hub (Integration Plan Rooms 1-3 foundation):
-- residence public-profile fields, NARR 3.0 + Iowa HHS compliance trackers,
-- phase tracking, fee ledger, incident severity, and staff RLS for
-- residence operations. Staff scope = staff_residence_ids() (0009).

set search_path = recoveryos, public;

-- Residence profile ------------------------------------------------------

alter table residences
  add column if not exists address_street text,
  add column if not exists postal_code text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists population_served text,
  add column if not exists narr_level text,
  add column if not exists narr_certification_status text not null default 'in_preparation',
  add column if not exists narr_affiliate text,
  add column if not exists shared_room_fee_weekly numeric(8,2),
  add column if not exists private_room_fee_weekly numeric(8,2),
  add column if not exists shared_room_fee_monthly numeric(8,2),
  add column if not exists private_room_fee_monthly numeric(8,2),
  add column if not exists accepts_mat boolean not null default true,
  add column if not exists accepts_supervision boolean not null default true,
  add column if not exists public_description text;

alter table residences
  add constraint residences_cert_status_chk
  check (narr_certification_status in ('certified', 'pending', 'in_preparation', 'not_certified'));

-- Phase tracking ---------------------------------------------------------
-- Phase normally derives from days in residence (GH-CURFEW-001 v3.0 /
-- GH-RECOVERY-001 v2.0: 1-30 / 31-90 / 91+). A row here overrides the
-- derived phase (accountability resets, approved advancement).

create table residency_phases (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  phase int not null check (phase between 1 and 3),
  started_on date not null default current_date,
  note text,
  recorded_by_person_id bigint references people (id),
  created_at timestamptz not null default now()
);
create index residency_phases_idx on residency_phases (residency_id, started_on desc);

-- Fee ledger (Policy GH-FEES-001) ---------------------------------------

create table fee_ledger (
  id bigint generated always as identity primary key,
  residency_id bigint not null references residencies (id) on delete cascade,
  entry_type text not null check (entry_type in ('charge', 'payment', 'adjustment', 'refund')),
  amount numeric(8,2) not null check (amount >= 0),
  method text,
  period_start date,
  period_end date,
  receipt_number text,
  note text,
  recorded_by_person_id bigint references people (id),
  created_at timestamptz not null default now()
);
create index fee_ledger_residency_idx on fee_ledger (residency_id, created_at desc);

-- Incident classification (4-level, Incident Report System v1.0) ---------

alter table incidents
  add column if not exists severity int check (severity between 1 and 4),
  add column if not exists follow_up text,
  add column if not exists reviewed_by_person_id bigint references people (id),
  add column if not exists reviewed_at timestamptz;

-- NARR 3.0 compliance tracker --------------------------------------------

create table narr_standards (
  id bigint generated always as identity primary key,
  code text not null unique,
  domain int not null check (domain between 1 and 4),
  title text not null,
  sort int not null
);

create table narr_compliance (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id) on delete cascade,
  standard_id bigint not null references narr_standards (id),
  status text not null default 'in_progress'
    check (status in ('met', 'in_progress', 'not_met', 'not_applicable')),
  evidence text,
  verified_by_person_id bigint references people (id),
  verified_at timestamptz,
  next_review_on date,
  unique (residence_id, standard_id)
);

create table iowa_checklist_items (
  id bigint generated always as identity primary key,
  item_no int not null unique,
  title text not null
);

create table iowa_checklist_status (
  id bigint generated always as identity primary key,
  residence_id bigint not null references residences (id) on delete cascade,
  item_id bigint not null references iowa_checklist_items (id),
  status text not null default 'in_progress'
    check (status in ('yes', 'in_progress', 'no')),
  evidence text,
  verified_by_person_id bigint references people (id),
  verified_at timestamptz,
  unique (residence_id, item_id)
);

-- Reference data: NARR 3.0 Level II rule set (Integration Plan §4) --------

insert into narr_standards (code, domain, title, sort) values
  ('1.A.1',    1, 'Written mission and vision, NARR-consistent', 10),
  ('1.A.2.a',  1, 'Legal business entity documentation', 20),
  ('1.A.2.b',  1, 'Current liability insurance documentation', 30),
  ('1.A.2.c',  1, 'Written permission from property owner', 40),
  ('1.A.2.d',  1, 'Non-discrimination statement', 50),
  ('1.A.2.e',  1, 'Honest marketing attestation', 60),
  ('1.A.2.g',  1, 'Paid work policy (if applicable)', 70),
  ('1.A.2.h',  1, 'No staff involvement in resident finances', 80),
  ('1.A.2.i',  1, 'Code of ethics signed by all staff/volunteers', 90),
  ('1.A.3.a',  1, 'Fees disclosed in writing before any funds accepted', 100),
  ('1.A.3.b',  1, 'Accounting system for resident financial transactions', 110),
  ('1.A.3.c',  1, 'Refund policy disclosed before binding agreement', 120),
  ('1.A.4.a',  1, 'Data collection policies with privacy protected', 130),
  ('1.B.5.a',  1, 'Written agreement before committing to terms', 140),
  ('1.B.6.a',  1, 'Resident records secure, authorized access only', 150),
  ('1.B.6.b',  1, 'Confidentiality law compliance (42 CFR Part 2)', 160),
  ('1.B.6.c',  1, 'Social media privacy policy', 170),
  ('1.C.7.a',  1, 'Some rules made by residents', 180),
  ('1.C.7.b',  1, 'Grievance policy with right to escalate', 190),
  ('1.C.7.c',  1, 'Resident rights posted in common areas', 200),
  ('1.C.7.d',  1, 'Resident-driven length of stay policy', 210),
  ('1.C.7.e',  1, 'Residents heard in governance', 220),
  ('1.C.8.a',  1, 'Peer support interactions facilitated', 230),
  ('1.C.8.c',  1, 'Recovery progress recognized, strengths celebrated', 240),
  ('1.D.9',    1, 'Staff self-care, boundaries, empathy modeled', 250),
  ('1.D.10',   1, 'Staff trained in Social Model', 260),
  ('1.D.11',   1, 'Cultural responsiveness training', 270),
  ('1.D.12',   1, 'Written job descriptions for all staff roles', 280),
  ('1.D.13',   1, 'Ongoing performance development', 290),
  ('2.E.14.a', 2, 'Residence in good repair, clean, well maintained', 300),
  ('2.E.14.b', 2, 'Home-like furnishings (not institutional)', 310),
  ('2.E.14.c', 2, 'Home-like entrances and exits', 320),
  ('2.E.14.d', 2, '50+ sq ft per bed per sleeping room', 330),
  ('2.E.14.e', 2, 'Min 1 sink/toilet/shower per 6 residents', 340),
  ('2.E.14.f', 2, 'Personal item storage for each resident', 350),
  ('2.E.14.g', 2, 'Food storage space for each resident', 360),
  ('2.E.14.h', 2, 'Laundry accessible to all residents', 370),
  ('2.E.14.i', 2, 'All appliances in safe, working condition', 380),
  ('2.E.15.a', 2, 'Meeting space large enough for all residents', 390),
  ('2.E.15.b', 2, 'Comfortable group area for small groups', 400),
  ('2.E.15.c', 2, 'Kitchen/dining area for all residents', 410),
  ('2.E.15.d', 2, 'Entertainment/recreation areas provided', 420),
  ('2.F.16.a', 2, 'Policy prohibiting alcohol and illicit drug use', 430),
  ('2.F.16.b', 2, 'Prohibited items list and search procedures', 440),
  ('2.F.16.c', 2, 'Drug screening and toxicology protocols', 450),
  ('2.F.16.d', 2, 'Medication usage and storage policy', 460),
  ('2.F.16.e', 2, 'Residents encouraged to take responsibility for safety', 470),
  ('2.F.17.a', 2, 'Electrical/mechanical/structural attestation', 480),
  ('2.F.17.b', 2, 'Local health and safety code compliance', 490),
  ('2.F.17.c', 2, 'Smoke/CO detectors and fire extinguishers inspected', 500),
  ('2.F.18.a', 2, 'Smoke-free interior / designated smoking area', 510),
  ('2.F.18.b', 2, 'Bodily fluid and contagious disease policy', 520),
  ('2.F.19.a', 2, 'Emergency numbers and evacuation maps posted', 530),
  ('2.F.19.b', 2, 'Emergency contact information collected', 540),
  ('2.F.19.c', 2, 'Residents oriented to emergency procedures', 550),
  ('2.F.19.d', 2, 'Naloxone accessible, individuals trained', 560),
  ('3.G.20.a', 3, 'Residents encouraged in meaningful activities', 570),
  ('3.G.21.a', 3, 'Individualized recovery planning with exit plan', 580),
  ('3.G.21.b', 3, 'Recovery capital built (employment, service)', 590),
  ('3.G.21.c', 3, 'Peer leadership and mentoring criteria written', 600),
  ('3.G.22.a', 3, 'Resource directories available', 610),
  ('3.G.22.b', 3, 'Staff/leaders educate about community resources', 620),
  ('3.G.23.a', 3, 'Weekly schedule of recovery support services', 630),
  ('3.G.23.b', 3, 'Resident-to-resident peer support facilitated', 640),
  ('3.H.26.a', 3, 'Staff and residents model empathy, positive regard', 650),
  ('3.H.26.b', 3, 'Trauma-informed practices are priority', 660),
  ('3.H.26.c', 3, 'Mechanisms for residents to inform operations', 670),
  ('3.I.27',   3, 'Functionally equivalent family (50%+ indicators)', 680),
  ('3.I.28.a', 3, 'Informal activities encouraged', 690),
  ('3.I.28.c', 3, 'Community gatherings occur periodically', 700),
  ('3.I.28.d', 3, 'Transition rituals for entry, phase movement, exit', 710),
  ('3.I.29.a', 3, 'Residents linked to mutual aid and advocacy', 720),
  ('3.I.29.b', 3, 'Residents find recovery mentors or sponsors', 730),
  ('3.I.29.c', 3, 'Residents attend mutual aid meetings', 740),
  ('3.I.29.d', 3, 'Residents formally linked to community resources', 750),
  ('3.I.29.e', 3, 'Resident/staff community relations documented', 760),
  ('3.I.29.f', 3, 'Relationships inside and outside encouraged', 770),
  ('4.J.30.a', 4, 'Neighbors can request responsible person contact', 780),
  ('4.J.30.b', 4, 'Responsible person responds to neighbor concerns', 790),
  ('4.J.30.c', 4, 'Orientations include neighbor interaction', 800),
  ('4.J.31.a', 4, 'Smoking/loitering/language/cleanliness policies', 810),
  ('4.J.31.b', 4, 'Parking courtesy rules documented', 820)
on conflict (code) do nothing;

insert into iowa_checklist_items (item_no, title) values
  (1, 'In operation as a recovery house at least 3 months'),
  (2, 'Family-like shared living centered on peer support and service connection'),
  (3, 'Different address/location than clinical SUD/MH treatment provider'),
  (4, 'Residents seek clinical treatment from provider of their choice'),
  (5, 'Faith-based elements allow services of choice in lieu'),
  (6, 'All FDA-approved medications for SUD and MH allowed'),
  (7, 'Eligible residents have history of substance misuse')
on conflict (item_no) do nothing;

-- Row-level security ------------------------------------------------------

alter table residency_phases enable row level security;
alter table fee_ledger enable row level security;
alter table narr_standards enable row level security;
alter table narr_compliance enable row level security;
alter table iowa_checklist_items enable row level security;
alter table iowa_checklist_status enable row level security;

-- Reference tables: readable by signed-in users.
create policy narr_standards_read on narr_standards
  for select using (auth.uid() is not null);
create policy iowa_checklist_items_read on iowa_checklist_items
  for select using (auth.uid() is not null);

-- Residents see their own phase history and fee ledger.
create policy residency_phases_self on residency_phases
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );
create policy fee_ledger_self on fee_ledger
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );

-- Staff operate their residences (Room 1).
create policy residency_phases_staff on residency_phases
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );
create policy fee_ledger_staff on fee_ledger
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );
create policy narr_compliance_staff on narr_compliance
  for all using (residence_id in (select staff_residence_ids()));
create policy iowa_checklist_status_staff on iowa_checklist_status
  for all using (residence_id in (select staff_residence_ids()));

-- Staff see the people living in / applying to their residences.
create policy people_select_staff on people
  for select using (
    exists (select 1 from residencies r
            where r.person_id = people.id
              and r.residence_id in (select staff_residence_ids()))
    or exists (select 1 from residence_applications a
               where a.person_id = people.id
                 and a.residence_id in (select staff_residence_ids()))
  );

-- Staff manage residencies, applications, beds, passes, chores, meetings.
create policy residencies_staff_write on residencies
  for insert with check (residence_id in (select staff_residence_ids()));
create policy residencies_staff_update on residencies
  for update using (residence_id in (select staff_residence_ids()));

create policy residence_applications_staff_write on residence_applications
  for update using (residence_id in (select staff_residence_ids()));

create policy residence_units_staff on residence_units
  for all using (residence_id in (select staff_residence_ids()));
create policy residence_rooms_staff on residence_rooms
  for all using (
    exists (select 1 from residence_units u
            where u.id = unit_id
              and u.residence_id in (select staff_residence_ids()))
  );
create policy residence_beds_staff on residence_beds
  for all using (
    exists (select 1 from residence_rooms rm
            join residence_units u on u.id = rm.unit_id
            where rm.id = room_id
              and u.residence_id in (select staff_residence_ids()))
  );

create policy bed_assignments_staff on bed_assignments
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );
create policy bed_assignments_self on bed_assignments
  for select using (
    exists (select 1 from residencies r
            where r.id = residency_id and r.person_id = current_person_id())
  );

create policy passes_staff on passes
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );

create policy chores_staff on residence_chores
  for all using (residence_id in (select staff_residence_ids()));
create policy chore_assignments_staff on chore_assignments
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );
create policy residence_chores_read on residence_chores
  for select using (
    residence_id in (select residence_id from residencies
                     where person_id = current_person_id()
                       and residency_status in ('active', 'on_pass', 'transitioning'))
  );

create policy meetings_staff on meetings
  for all using (residence_id in (select staff_residence_ids()));
create policy meeting_attendance_staff on meeting_attendance
  for all using (
    exists (select 1 from meetings m
            where m.id = meeting_id
              and m.residence_id in (select staff_residence_ids()))
  );

create policy curfew_schedules_staff on curfew_schedules
  for all using (residence_id in (select staff_residence_ids()));
create policy curfew_exceptions_staff on curfew_exceptions
  for all using (
    exists (select 1 from residencies r
            where r.id = residency_id
              and r.residence_id in (select staff_residence_ids()))
  );

create policy residences_manager_update on residences
  for update using (
    id in (select ra.residence_id from role_assignments ra
           where ra.person_id = current_person_id()
             and ra.role_key = 'residence_manager'
             and ra.revoked_at is null)
  );

notify pgrst, 'reload schema';
