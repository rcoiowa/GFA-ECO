-- 0203_seed_staff_preauthorization.sql
-- TARGET-only seed: bootstrap staff preauthorization for launch.
-- Idempotent: natural-key upsert on email (unique constraint staff_preauthorizations_email_key).
-- Exactly one row; no participant PII (staff/admin bootstrap record only).

insert into recoveryos.staff_preauthorizations (email, role_keys, note)
values (
  'degarmeaux@icloud.com',
  array['administrator']::recoveryos.role_key[],
  'Owner/admin — launch bootstrap'
)
on conflict (email) do update
  set role_keys = excluded.role_keys;
