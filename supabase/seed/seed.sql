-- Reference data seed (idempotent). Applied to the live recoveryos schema
-- on 2026-07-29; safe to re-run.
set search_path = recoveryos, public;

insert into organizations (name, organization_type)
select 'Grace For Addictions', 'recovery_support'
where not exists (select 1 from organizations where name = 'Grace For Addictions');

insert into programs (organization_id, key, name, description)
select o.id, v.key, v.name, v.description
from organizations o,
  (values
    ('vrcc', 'Virtual Recovery Community Center',
     'General recovery-support services: coaching, peer support, navigation, education, and community.'),
    ('anchor', 'ANCHOR',
     'ANCHOR program participation.')
  ) as v(key, name, description)
where o.name = 'Grace For Addictions'
on conflict (key) do nothing;

insert into residences (organization_id, name, address_city, address_state, capacity)
select o.id, 'Grace House', 'Des Moines', 'IA', 12
from organizations o
where o.name = 'Grace For Addictions'
  and not exists (select 1 from residences where name = 'Grace House');

-- Men's residence at 1414 12th Street; GFA is the contracted program
-- operator under a professional services agreement (Iowa DOC approved).
insert into residences (organization_id, name, address_city, address_state, capacity)
select o.id, 'Ernest & Johnnie White Recovery House', 'Des Moines', 'IA', null
from organizations o
where o.name = 'Grace For Addictions'
  and not exists (select 1 from residences where name = 'Ernest & Johnnie White Recovery House');

insert into service_types (key, name, category) values
  ('coaching_session', 'Recovery coaching session', 'coaching'),
  ('peer_support', 'Peer support conversation', 'peer_support'),
  ('mentoring', 'Mentoring session', 'mentoring'),
  ('accountability', 'Accountability support', 'accountability'),
  ('recovery_circle', 'Recovery circle', 'recovery_circle'),
  ('navigation', 'Resource navigation', 'navigation'),
  ('recovery_capital_assessment', 'Recovery capital assessment', 'assessment'),
  ('daily_check_in', 'Daily check-in', 'check_in'),
  ('education_module', 'Educational content', 'education'),
  ('recovery_practice', 'Recovery practice', 'practice'),
  ('support_request', 'Support request', 'support_request'),
  ('community_event', 'Community event', 'event')
on conflict (key) do nothing;

insert into consent_types (key, category, name, description, is_required_for_service) values
  ('terms_of_use', 'account_identity', 'Terms of use and privacy notice',
   'How RecoveryOS stores and protects your information.', true),
  ('service_participation', 'service_participation', 'Participation in recovery-support services',
   'Consent to receive VRCC recovery-support services.', true),
  ('coaching', 'coaching', 'Recovery coaching',
   'Consent to work with a recovery coach and share goals with them.', false),
  ('resource_navigation', 'resource_navigation', 'Resource navigation',
   'Consent to work with a navigator and share resource needs.', false),
  ('recovery_assessments', 'recovery_assessments', 'Recovery assessments',
   'Consent to complete recovery capital and related assessments.', false),
  ('communications', 'communications', 'Messages and reminders',
   'Consent to receive appointment reminders and program messages.', false),
  ('ai_features', 'ai_features', 'Grace AI features',
   'Consent to use Grace AI. Optional — declining never limits other services.', false),
  ('analytics', 'analytics', 'De-identified program improvement analytics',
   'Consent to include de-identified information in program improvement analysis.', false)
on conflict (key) do nothing;
