-- 0202_seed_resources.sql
-- Unified canonical resource directory for recoveryos.resources, reconciled from three dev generations:
--   a) public.resources        (34 rows) -> source_generation = 'gen1'
--   b) public.crisis_resources ( 8 rows) -> source_generation = 'crisis', is_crisis = true
--   c) public.v2_resources     ( 5 rows) -> source_generation = 'v2'
-- Natural key: lower(name) (TARGET unique index resources_name_idx on lower(name)).
-- Idempotency + cross-generation dedup via insert ... where not exists on lower(name),
-- applied in order gen1 -> crisis -> v2, so the earliest generation wins on a name collision.
-- Known collision: 'SAMHSA National Helpline' exists in gen1 and crisis; the gen1 row is kept
-- and the crisis duplicate is skipped (crisis therefore contributes 7 rows; expected total 46).
-- gen1 notes/referral_process/hours_of_operation are NULL for every source row.

-- ============================================================
-- a) gen1: public.resources -> recoveryos.resources
-- ============================================================
insert into recoveryos.resources (
  name, resource_type, category, description, phone, phone_secondary, email, website,
  address_line1, address_line2, city, state, zip_code, county, is_statewide, is_virtual,
  hours, is_24_7, languages, walk_in_accepted, appointment_required, is_free, sliding_scale,
  medicaid_accepted, recovery_friendly, mat_friendly, justice_involved, peer_led, faith_based,
  trauma_informed, is_gfa_partner, referral_process, is_active, source_generation)
select
  v.name, v.resource_type, v.category, v.description, v.phone, v.phone_secondary, v.email, v.website,
  v.address_line1, v.address_line2, v.city, v.state, v.zip_code, v.county, v.is_statewide::boolean, v.is_virtual::boolean,
  v.hours, v.is_24_7::boolean, v.languages::text[], v.walk_in_accepted::boolean, v.appointment_required::boolean, v.is_free::boolean, v.sliding_scale::boolean,
  v.medicaid_accepted::boolean, v.recovery_friendly::boolean, v.mat_friendly::boolean, v.justice_involved::boolean, v.peer_led::boolean, v.faith_based::boolean,
  v.trauma_informed::boolean, v.is_gfa_partner::boolean, v.referral_process, v.is_active::boolean, 'gen1'
from (values
  ('988 Suicide & Crisis Lifeline', 'crisis-line', 'Crisis & Mental Health', 'Call or text 988 for free, confidential support 24/7. Iowa has dedicated state capacity.', '988', NULL, NULL, NULL, NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Area Substance Abuse Council (ASAC)', 'substance-use-treatment', 'Outpatient Treatment', 'Outpatient and residential substance use treatment serving eastern Iowa for over 50 years.', '319-390-4611', NULL, NULL, 'https://asac.us', NULL, NULL, 'Cedar Rapids', 'IA', '52402', 'Linn', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Bidwell Riverside Center', 'food', 'Basic Needs', 'Food pantry and basic needs services for individuals and families in recovery and experiencing poverty.', '515-244-7715', NULL, NULL, 'https://bidwellriverside.org', NULL, NULL, 'Des Moines', 'IA', '50314', 'Polk', 'f', 'f', NULL, 'f', '{English}', 't', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Broadlawns Medical Center - Behavioral Health', 'substance-use-treatment', 'Inpatient/Outpatient Treatment', 'County hospital offering a full continuum of behavioral health services including detox, inpatient, and outpatient.', '515-282-2200', NULL, NULL, 'https://broadlawns.org', NULL, NULL, 'Des Moines', 'IA', '50314', 'Polk', 'f', 'f', NULL, 'f', '{English}', 't', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Cedar Valley Friends of the Family', 'substance-use-treatment', 'Community Treatment', 'Outpatient substance use and mental health services for Black Hawk County residents.', '319-235-6271', NULL, NULL, NULL, NULL, NULL, 'Waterloo', 'IA', '50703', 'Black Hawk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Central Iowa Community Services', 'peer-support', 'Recovery Support', 'Peer-run recovery support services serving Polk County with particular focus on justice-involved individuals.', '515-246-6420', NULL, NULL, NULL, NULL, NULL, 'Des Moines', 'IA', '50316', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 't', 't', 'f', 't', 'f', NULL, 't'),
  ('CommUnity Crisis Services', 'crisis-line', 'Crisis Services', '24/7 crisis services including hotline, mobile response, and short-term residential for Johnson County.', '319-351-0140', NULL, NULL, 'https://communitycrisis.org', NULL, NULL, 'Iowa City', 'IA', '52240', 'Johnson', 'f', 'f', NULL, 'f', '{English}', 't', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Eyerly Ball Community Mental Health', 'mental-health', 'Mental Health Treatment', 'Comprehensive community mental health center providing outpatient and crisis services throughout central Iowa.', '515-241-1000', NULL, NULL, 'https://eyerlyball.org', NULL, NULL, 'Des Moines', 'IA', '50309', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Foundation 2 Crisis Center', 'crisis-line', 'Crisis Services', '24/7 crisis hotline and mobile crisis response serving eastern Iowa.', '319-362-2174', NULL, NULL, 'https://foundation2.org', NULL, NULL, 'Cedar Rapids', 'IA', '52401', 'Linn', 'f', 'f', NULL, 'f', '{English}', 't', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Hillcrest Family Services', 'substance-use-treatment', 'Community Treatment', 'Mental health and substance use treatment serving northeast Iowa with a trauma-informed model.', '563-583-7357', NULL, NULL, 'https://hillcrestfs.org', NULL, NULL, 'Dubuque', 'IA', '52001', 'Dubuque', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 't', 't', 'f', NULL, 't'),
  ('House of Mercy', 'recovery-housing', 'Recovery Residence', 'Long-term recovery housing and supportive services for women, including those with children, in recovery.', '515-243-5222', NULL, NULL, 'https://houseofmercy.org', NULL, NULL, 'Des Moines', 'IA', '50314', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 't', 't', 't', 'f', NULL, 't'),
  ('Integrated Health Home - Primary Health Care', 'mental-health', 'Integrated Care', 'Integrated behavioral and physical health home model serving individuals with complex needs.', '515-248-1500', NULL, NULL, 'https://primaryhealthcare.org', NULL, NULL, 'Des Moines', 'IA', '50314', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 't', 'f', 't', 'f', NULL, 't'),
  ('Iowa 211', 'peer-support', 'Navigation', 'Statewide resource navigation service connecting Iowans to health and human services.', '211', NULL, NULL, 'https://iowa211.org', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa Alcoholics Anonymous Intergroup', 'peer-support', 'Mutual Aid', 'Iowa AA meeting directory with in-person and virtual meetings statewide.', NULL, NULL, NULL, 'https://iowaaa.org', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 't', 'f', 't', 'f', 'f', 't', 'f', 'f', 't', 't', 't', 'f', NULL, 't'),
  ('Iowa DOC Offender Reentry Program', 'reentry', 'Reentry Services', 'Iowa Department of Corrections reentry program supporting individuals returning from incarceration.', '515-242-5770', NULL, NULL, 'https://doc.iowa.gov', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa Harm Reduction Coalition', 'harm-reduction', 'Harm Reduction', 'Statewide harm reduction services including syringe services, naloxone distribution, and education.', NULL, NULL, NULL, 'https://iowaharmreduction.org', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa HHS - SUD Treatment Locator', 'substance-use-treatment', 'State Resource', 'Official Iowa HHS treatment locator connecting Iowans to licensed SUD treatment statewide.', '515-281-4417', NULL, NULL, 'https://hhs.iowa.gov/programs/programs-and-services/behavioral-health', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa IMAT - Medication-Assisted Treatment Program', 'mat-provider', 'MAT Services', 'Iowa HHS IMAT program supporting access to buprenorphine, methadone, and naltrexone across Iowa.', '515-281-4417', NULL, NULL, 'https://hhs.iowa.gov', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa Legal Aid', 'legal', 'Legal Services', 'Free civil legal assistance for low-income Iowans, including record expungement and housing matters.', '515-243-2151', NULL, NULL, 'https://iowalegalaid.org', NULL, NULL, 'Des Moines', 'IA', '50309', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa Legal Aid - Reentry Project', 'reentry', 'Legal Reentry', 'Specialized legal services for individuals with criminal records seeking to rebuild their lives.', '515-243-2151', NULL, NULL, 'https://iowalegalaid.org', NULL, NULL, 'Des Moines', 'IA', '50309', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 't', 'f', NULL, 't'),
  ('Iowa Recovery Capital', 'peer-support', 'Recovery Community Center', 'Recovery community center offering peer support, recovery coaching, employment services, and community connection.', '515-244-3056', NULL, NULL, 'https://iowarecoverycapital.com', NULL, NULL, 'Des Moines', 'IA', '50309', 'Polk', 'f', 'f', NULL, 'f', '{English}', 't', 'f', 't', 'f', 'f', 't', 't', 'f', 't', 'f', 't', 'f', NULL, 't'),
  ('Iowa Substance Use Warmline', 'crisis-line', 'Crisis & Peer Support', 'Free peer-run warmline for Iowans seeking support with substance use concerns. Staffed by people with lived experience.', '1-833-422-0255', NULL, NULL, NULL, NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 't', 'f', 't', 'f', NULL, 't'),
  ('Iowa Vocational Rehabilitation Services', 'employment', 'Employment Services', 'State agency providing employment support and vocational rehabilitation for individuals with disabilities including SUD.', '515-281-4211', NULL, NULL, 'https://ivrs.iowa.gov', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('NAMI Iowa', 'mental-health', 'Peer Education', 'Statewide mental health advocacy and peer education including Family-to-Family and Peer-to-Peer programs.', '515-254-0417', NULL, NULL, 'https://namiiowa.org', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 't', 'f', 't', 'f', NULL, 't'),
  ('Primary Health Care - Recovery Services', 'substance-use-treatment', 'Outpatient Treatment', 'Outpatient substance use treatment and MAT services for low-income individuals in central Iowa.', '515-248-1500', NULL, NULL, 'https://primaryhealthcare.org', NULL, NULL, 'Des Moines', 'IA', '50314', 'Polk', 'f', 'f', NULL, 'f', '{English}', 't', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Recovery Opportunities Center - Waterloo', 'peer-support', 'Recovery Community Center', 'Peer-run recovery community center providing support, activities, and navigation services.', '319-235-4800', NULL, NULL, NULL, NULL, NULL, 'Waterloo', 'IA', '50701', 'Black Hawk', 'f', 'f', NULL, 'f', '{English}', 't', 'f', 't', 'f', 'f', 't', 't', 'f', 't', 'f', 't', 'f', NULL, 't'),
  ('Robert Young Center - Genesis Health System', 'substance-use-treatment', 'Full Continuum Treatment', 'Comprehensive substance use treatment and mental health services for the Quad Cities area.', '563-421-1000', NULL, NULL, 'https://robertyoungcenter.com', NULL, NULL, 'Davenport', 'IA', '52803', 'Scott', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('SAMHSA National Helpline', 'crisis-line', 'Treatment Referral', 'Free, confidential, 24/7 treatment referral and information service for substance use disorders.', '1-800-662-4357', NULL, NULL, 'https://www.samhsa.gov/find-help/national-helpline', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Siouxland Mental Health Center', 'mental-health', 'Community Mental Health', 'Community mental health center serving western Iowa with outpatient and crisis services.', '712-252-3001', NULL, NULL, 'https://siouxlandmentalhealth.com', NULL, NULL, 'Sioux City', 'IA', '51101', 'Woodbury', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('SMART Recovery Iowa', 'peer-support', 'Mutual Aid', 'Science-based mutual support groups for any addictive behavior. Virtual and in-person meetings across Iowa.', NULL, NULL, NULL, 'https://smartrecovery.org', NULL, NULL, NULL, 'IA', NULL, NULL, 't', 'f', NULL, 'f', '{English}', 'f', 'f', 't', 'f', 'f', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('Tanager Place', 'mental-health', 'Mental Health Treatment', 'Behavioral health services for youth and families in eastern Iowa.', '319-365-9164', NULL, NULL, 'https://tanagerplace.org', NULL, NULL, 'Cedar Rapids', 'IA', '52402', 'Linn', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('UnityPoint Health - Addiction Services', 'substance-use-treatment', 'Outpatient Treatment', 'Outpatient addiction services including IOP, MAT, and co-occurring disorder treatment.', '515-241-6900', NULL, NULL, 'https://unitypoint.org', NULL, NULL, 'Des Moines', 'IA', '50309', 'Polk', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('University of Iowa UIHC - Addiction Medicine', 'substance-use-treatment', 'Specialized Treatment', 'Academic medical center offering specialized addiction medicine and dual diagnosis services.', '319-353-6314', NULL, NULL, 'https://uihc.org', NULL, NULL, 'Iowa City', 'IA', '52242', 'Johnson', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't'),
  ('West Iowa Treatment Services', 'substance-use-treatment', 'Outpatient Treatment', 'Outpatient substance use treatment serving the greater Siouxland region.', '712-252-0020', NULL, NULL, NULL, NULL, NULL, 'Sioux City', 'IA', '51101', 'Woodbury', 'f', 'f', NULL, 'f', '{English}', 'f', 't', 'f', 'f', 't', 't', 't', 'f', 'f', 'f', 't', 'f', NULL, 't')
) as v(name, resource_type, category, description, phone, phone_secondary, email, website,
       address_line1, address_line2, city, state, zip_code, county, is_statewide, is_virtual,
       hours, is_24_7, languages, walk_in_accepted, appointment_required, is_free, sliding_scale,
       medicaid_accepted, recovery_friendly, mat_friendly, justice_involved, peer_led, faith_based,
       trauma_informed, is_gfa_partner, referral_process, is_active)
where not exists (select 1 from recoveryos.resources r where lower(r.name) = lower(v.name));

-- ============================================================
-- b) crisis: public.crisis_resources -> recoveryos.resources (is_crisis = true)
--    is_statewide = serves_national OR serves_iowa (true when serves_national)
-- ============================================================
insert into recoveryos.resources (
  name, is_crisis, crisis_types, phone, text_number, chat_url, hours, is_statewide,
  languages, peer_led, display_order, is_active, notes, source_generation)
select
  v.name, true, v.crisis_types, v.phone, v.text_number, v.chat_url, v.hours, v.is_statewide::boolean,
  v.languages, v.peer_led::boolean, v.display_order::int, v.is_active::boolean, v.notes, 'crisis'
from (values
  ('988 Suicide and Crisis Lifeline', '{suicidal_ideation,mental_health_crisis,substance_use_crisis}'::text[], '988', '988', 'https://988lifeline.org/chat/', '24/7', 't', '{English,Spanish}'::text[], 'f', '1', 't', 'Free, confidential. Available 24/7. Call or text 988.'),
  ('Iowa Concern Hotline', '{financial_stress,legal_concern,mental_health_crisis,farm_stress}'::text[], '1-800-447-1985', NULL, NULL, '24/7', 't', '{English}'::text[], 'f', '2', 't', 'Iowa-specific. Free legal and financial guidance for all Iowans. 24/7.'),
  ('SAMHSA National Helpline', '{substance_use_crisis,mental_health_crisis,treatment_referral}'::text[], '1-800-662-4357', NULL, NULL, '24/7', 't', '{English,Spanish}'::text[], 'f', '3', 't', 'Free, confidential treatment referral and information. 24/7. SAMHSA HELP line.'),
  ('Crisis Text Line', '{suicidal_ideation,mental_health_crisis,substance_use_crisis,anxiety}'::text[], NULL, '741741', 'https://www.crisistextline.org/', '24/7', 't', '{English}'::text[], 'f', '4', 't', 'Text HOME to 741741. Free, confidential. Available 24/7.'),
  ('Iowa Domestic Violence Hotline', '{domestic_violence,safety_planning,housing_crisis}'::text[], '1-800-942-0333', NULL, NULL, '24/7', 't', '{English}'::text[], 'f', '5', 't', 'Iowa Coalition Against Domestic Violence. Free, confidential.'),
  ('GFA Warmline', '{peer_support,loneliness,early_recovery,return_to_use_concern}'::text[], '515-310-3425', NULL, NULL, '24/7', 't', '{English}'::text[], 't', '6', 't', 'Grace For Addictions peer warmline. Dial 515-310-DIAL. Peer-staffed.'),
  ('Veterans Crisis Line', '{suicidal_ideation,veteran_specific,mental_health_crisis}'::text[], '988', '838255', 'https://www.veteranscrisisline.net/get-help-now/chat/', '24/7', 't', '{English}'::text[], 'f', '7', 't', 'Press 1 after dialing 988. Free, confidential. For veterans and their families.'),
  ('National Alliance on Mental Illness (NAMI) Helpline', '{mental_health_crisis,family_support,information_referral}'::text[], '1-800-950-6264', '741741', 'https://www.nami.org/help', '24/7', 't', '{English}'::text[], 'f', '8', 't', 'Text NAMI to 741741. M-F 10am-10pm ET. Information and referral.')
) as v(name, crisis_types, phone, text_number, chat_url, hours, is_statewide, languages, peer_led, display_order, is_active, notes)
where not exists (select 1 from recoveryos.resources r where lower(r.name) = lower(v.name));

-- ============================================================
-- c) v2: public.v2_resources -> recoveryos.resources
--    Skips any row whose lower(title) already exists (cross-generation dedup).
-- ============================================================
insert into recoveryos.resources (
  name, category, description, website, phone, counties, is_virtual, source_generation)
select
  v.name, v.category, v.description, v.website, v.phone, v.counties, v.is_virtual::boolean, 'v2'
from (values
  ('Feeding Southwest Virginia', 'food', 'Regional food bank network with mobile pantry stops in every county.', 'https://feedingswva.org', NULL, '{}'::text[], 'f'),
  ('Mount Rogers Community Services', 'treatment', 'Outpatient SUD treatment, MAT, and case management for Southwest Virginia.', 'https://mtrogerscsb.com', NULL, '{Wise,Smyth,Wythe,Grayson,Carroll,Bland}'::text[], 't'),
  ('Mountain Empire Transit', 'transport', 'Demand-response rural transit — rides to treatment, work, and appointments.', NULL, '276-523-7433', '{Wise,Lee,Scott}'::text[], 'f'),
  ('Virginia 988 Crisis Line', 'crisis', 'Free 24/7 call, text, or chat support for mental health and substance use crises.', 'https://988lifeline.org', '988', '{}'::text[], 't'),
  ('Virginia Legal Aid Society', 'legal', 'Free civil legal help — expungement clinics, housing disputes, benefits appeals.', 'https://vlas.org', '866-534-5243', '{}'::text[], 't')
) as v(name, category, description, website, phone, counties, is_virtual)
where not exists (select 1 from recoveryos.resources r where lower(r.name) = lower(v.name));
