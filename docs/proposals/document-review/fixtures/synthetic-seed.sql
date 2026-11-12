-- Synthetic records only. Seed BEFORE the candidate to model preserved historical evidence.
INSERT INTO recoveryos.organizations(id,name,organization_type) OVERRIDING SYSTEM VALUE VALUES (90001,'Synthetic House A Operator','recovery_residence_operator'),(90002,'Synthetic House B Operator','recovery_residence_operator');
INSERT INTO recoveryos.residences(id,organization_id,name) OVERRIDING SYSTEM VALUE VALUES (90001,90001,'Synthetic House A'),(90002,90002,'Synthetic House B');
INSERT INTO auth.users(id,email) OVERRIDING SYSTEM VALUE SELECT ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'synthetic-'||i||'@example.invalid' FROM generate_series(90001,90008)i;
INSERT INTO recoveryos.people(id,auth_user_id,first_name,last_name) OVERRIDING SYSTEM VALUE SELECT i,('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'Synthetic','Person '||i FROM generate_series(90001,90008)i;
INSERT INTO recoveryos.role_assignments(person_id,role_key,residence_id,organization_id) OVERRIDING SYSTEM VALUE VALUES
 (90001,'participant',null,null),(90002,'resident',90001,90001),(90003,'resident',90002,90002),
 (90004,'residence_staff',90001,90001),(90005,'residence_staff',90002,90002),(90006,'system_administrator',null,null);
INSERT INTO recoveryos.residence_applications(id,person_id,residence_id,status) OVERRIDING SYSTEM VALUE VALUES (90001,90001,90001,'approved'),(90002,90002,90001,'approved'),(90003,90003,90002,'approved'),(90007,90007,90001,'submitted'),(90008,90008,90001,'approved');
INSERT INTO recoveryos.residencies(id,person_id,residence_id,residency_status) OVERRIDING SYSTEM VALUE VALUES (90002,90002,90001,'active'),(90003,90003,90002,'active');
INSERT INTO recoveryos.document_templates(id,organization_id,residence_id,key,name,requires_signature,requires_acknowledgment,is_active) OVERRIDING SYSTEM VALUE VALUES
 (90001,90001,90001,'synthetic_signature','Synthetic signature policy',true,false,true),
 (90002,90001,90001,'synthetic_ack','Synthetic acknowledgment policy',false,true,true),
 (90003,90001,90001,'synthetic_legacy','Synthetic existing completion',true,false,true),
 (90004,90001,90001,'synthetic_optional','Synthetic optional document',false,false,true),
 (90005,90002,90002,'synthetic_signature','Synthetic other house policy',true,false,true);
INSERT INTO recoveryos.document_versions(id,template_id,version,body_markdown,published_at) OVERRIDING SYSTEM VALUE VALUES
 (90001,90001,'1','# Synthetic OLD policy', '2026-01-01'),(90002,90001,'2','# Synthetic current signature policy','2026-02-01'),
 (90003,90002,'2','# Synthetic current acknowledgment policy','2026-02-01'),(90004,90003,'1','# Synthetic legacy-current policy','2026-02-01'),
 (90005,90004,'1','# Synthetic optional policy','2026-02-01'),(90006,90005,'1','# Synthetic other house policy','2026-02-01');
INSERT INTO recoveryos.document_assignments(id,document_version_id,person_id,application_id,acknowledged_at,signed_at,signature_name,signature_method) OVERRIDING SYSTEM VALUE VALUES
 (90001,90001,90001,90001,'2026-02-02','2026-02-02','Synthetic historical record','paper'),
 (90002,90004,90001,90001,'2026-02-02','2026-02-02','Synthetic current legacy record','paper');
SELECT setval(pg_get_serial_sequence('recoveryos.document_assignments','id'),90100);
INSERT INTO recoveryos.consent_grants(person_id,consent_type_id,status) OVERRIDING SYSTEM VALUE SELECT 90002,id,'granted' FROM recoveryos.consent_types WHERE key='electronic_records';
