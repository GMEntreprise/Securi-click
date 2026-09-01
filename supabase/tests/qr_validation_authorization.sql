BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(5);

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('70000000-0000-0000-0000-000000000001', 'staff@example.test', '{}'::jsonb),
  ('70000000-0000-0000-0000-000000000002', 'parent@example.test', '{}'::jsonb),
  ('70000000-0000-0000-0000-000000000003', 'collector@example.test', '{}'::jsonb);

INSERT INTO public.user_profiles (user_id, first_name, last_name, role) VALUES
  ('70000000-0000-0000-0000-000000000001', 'Staff', 'Member', 'school_admin'),
  ('70000000-0000-0000-0000-000000000002', 'Parent', 'Owner', 'parent'),
  ('70000000-0000-0000-0000-000000000003', 'Collector', 'Holder', 'collector')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.schools (
  id, name, type, email, phone, address, city, postal_code,
  manager_first_name, manager_last_name, manager_function, admin_user_id
) VALUES (
  '80000000-0000-0000-0000-000000000001', 'Ecole Test', 'ECOLE',
  'school@example.test', '0000000000', '1 rue Test', 'Testville', '75001',
  'Staff', 'Member', 'Responsable', '70000000-0000-0000-0000-000000000001'
);

INSERT INTO public.children (id, parent_id, school_id, first_name, last_name) VALUES
  ('90000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
   '80000000-0000-0000-0000-000000000001', 'Lucie', 'Owner');

INSERT INTO public.guardians (
  id, parent_id, child_id, first_name, last_name, relationship,
  collector_user_id, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
  '90000000-0000-0000-0000-000000000001', 'Collector', 'Holder', 'nounou',
  '70000000-0000-0000-0000-000000000003', true
);

INSERT INTO public.qr_codes (id, parent_id, child_id, guardian_id, token, expires_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002',
   '90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'SC-TESTTOKEN0001', NOW() + INTERVAL '1 hour'),
  ('b0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002',
   '90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'SC-TESTTOKEN0002', NOW() + INTERVAL '1 hour');

-- An unauthenticated caller must never reach the pickup machinery.
SELECT pg_catalog.set_config('request.jwt.claims', '{}'::text, true);
SELECT throws_ok(
  $q$SELECT public.validate_qr_and_create_pickup(
       'SC-TESTTOKEN0001',
       '80000000-0000-0000-0000-000000000001',
       '70000000-0000-0000-0000-000000000001')$q$,
  'forbidden',
  'an anonymous caller cannot validate a pickup'
);

-- The collector holding the token must not be able to validate their own pickup.
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
SELECT throws_ok(
  $q$SELECT public.validate_qr_and_create_pickup(
       'SC-TESTTOKEN0001',
       '80000000-0000-0000-0000-000000000001',
       '70000000-0000-0000-0000-000000000001')$q$,
  'forbidden',
  'the collector holding the code cannot validate their own pickup'
);

SELECT is(
  (SELECT is_used FROM public.qr_codes WHERE token = 'SC-TESTTOKEN0001'),
  false,
  'a refused attempt never consumes the code'
);

-- Staff of that school can validate, and the scan is attributed to them.
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
SELECT is(
  (public.validate_qr_and_create_pickup(
     'SC-TESTTOKEN0002',
     '80000000-0000-0000-0000-000000000001',
     '70000000-0000-0000-0000-000000000003')->>'success')::boolean,
  true,
  'staff of the school can validate a pickup'
);
SELECT is(
  (SELECT scanner_user_id FROM public.pickup_validations
   WHERE qr_code_id = 'b0000000-0000-0000-0000-000000000002'),
  '70000000-0000-0000-0000-000000000001'::uuid,
  'the scan is attributed to the caller, not to the identity they claimed'
);

SELECT * FROM finish();
ROLLBACK;
