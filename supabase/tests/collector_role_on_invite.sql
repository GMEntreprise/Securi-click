BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(4);

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('40000000-0000-0000-0000-000000000001', 'invited@example.test', '{}'::jsonb),
  ('40000000-0000-0000-0000-000000000002', 'realparent@example.test', '{}'::jsonb),
  ('40000000-0000-0000-0000-000000000003', 'owner@example.test', '{}'::jsonb);

INSERT INTO public.user_profiles (user_id, first_name, last_name, role) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Invited', 'Collector', 'parent'),
  ('40000000-0000-0000-0000-000000000002', 'Real', 'Parent', 'parent'),
  ('40000000-0000-0000-0000-000000000003', 'Owner', 'Parent', 'parent')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.children (id, parent_id, first_name, last_name) VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'Lucie', 'Owner');

INSERT INTO public.guardians (
  id, parent_id, child_id, first_name, last_name, relationship,
  invitation_token, is_active
) VALUES
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003',
   '50000000-0000-0000-0000-000000000001', 'Invited', 'Collector', 'nounou',
   'token-fresh-account', true),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003',
   '50000000-0000-0000-0000-000000000001', 'Real', 'Parent', 'grand-parent',
   'token-existing-parent', true);

-- A freshly created invitation account must become a collector.
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
SELECT is(
  public.accept_guardian_invite('token-fresh-account')->>'guardian_id',
  '60000000-0000-0000-0000-000000000001'::text,
  'an invitation with no PIN is accepted'
);
SELECT is(
  (SELECT role FROM public.user_profiles
   WHERE user_id = '40000000-0000-0000-0000-000000000001'),
  'collector'::text,
  'an account created solely by the invitation becomes a collector'
);

-- Someone who already raises their own children keeps their parent role.
INSERT INTO public.children (id, parent_id, first_name, last_name) VALUES
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Tom', 'Parent');
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
SELECT is(
  public.accept_guardian_invite('token-existing-parent')->>'guardian_id',
  '60000000-0000-0000-0000-000000000002'::text,
  'a parent can also accept an invitation for another family'
);
SELECT is(
  (SELECT role FROM public.user_profiles
   WHERE user_id = '40000000-0000-0000-0000-000000000002'),
  'parent'::text,
  'accepting an invitation never locks a real parent out of their own children'
);

SELECT * FROM finish();
ROLLBACK;
