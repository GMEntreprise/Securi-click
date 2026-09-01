BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(44);

SELECT is(public.normalize_uai(' 0923504j '::TEXT), '0923504J'::TEXT, 'UAI is normalized');
SELECT is(public.normalize_school_name('  École   Alpha  '::TEXT), 'ecole alpha'::TEXT, 'school name is unaccented and normalized');
SELECT throws_ok(
  $$INSERT INTO public.education_establishments (
    uai, official_name, nature_label, sector, school_level, postal_code, city, department_code
  ) VALUES ('BAD', 'Invalid', 'Ecole', 'public', 'elementary', '75001', 'Paris', '075')$$,
  '23514',
  NULL,
  'invalid UAI is rejected'
);

INSERT INTO public.education_establishments (
  id, uai, official_name, nature_label, sector, has_nursery, has_elementary,
  school_level, address_line_1, address_line_2, address_line_3,
  postal_code, city, department_code, is_active
) VALUES
  ('10000000-0000-0000-0000-000000000001', '0750001A', 'Ecole Alpha', 'ECOLE DE NIVEAU ELEMENTAIRE', 'public', false, true, 'elementary', '1 rue Alpha', 'Bâtiment Lumière', 'Entrée cour', '75001', 'Paris', '075', true),
  ('10000000-0000-0000-0000-000000000002', '0750002B', 'Ecole Beta', 'ECOLE MATERNELLE', 'private', true, false, 'nursery', '2 rue Beta', NULL, NULL, '75002', 'Paris', '075', false),
  ('10000000-0000-0000-0000-000000000003', '0750003C', 'Ecole Gamma', 'ECOLE DE NIVEAU ELEMENTAIRE', 'public', false, true, 'elementary', '3 rue Gamma', NULL, NULL, '75003', 'Paris', '075', true),
  ('10000000-0000-0000-0000-000000000004', '0830004D', 'Ecole du Port', 'ECOLE DE NIVEAU ELEMENTAIRE', 'public', false, true, 'elementary', '4 quai du Port', NULL, NULL, '83000', 'Toulon', '083', true),
  ('10000000-0000-0000-0000-000000000005', '0830005E', 'Ecole Sainte Claire', 'ECOLE PRIMAIRE PRIVEE', 'private', true, true, 'combined', '5 avenue Vauban', NULL, NULL, '83000', 'Toulon', '083', true),
  ('10000000-0000-0000-0000-000000000006', '0750006F', 'Institut 1 rue Alpha', 'ECOLE DE NIVEAU ELEMENTAIRE', 'private', false, true, 'elementary', '6 boulevard Delta', NULL, NULL, '75006', 'Paris', '075', true);

INSERT INTO public.schools (
  id, name, type, email, phone, address, city, postal_code,
  manager_first_name, manager_last_name, manager_function,
  admin_user_id, verified, external_id, external_source, synced_at,
  education_establishment_id, education_link_status, is_active
) VALUES (
  '30000000-0000-0000-0000-000000000001',
  'Ecole Alpha',
  'ECOLE DE NIVEAU ELEMENTAIRE',
  'sync+0750001A@datagouv.fr',
  '',
  '1 rue Alpha',
  'Paris',
  '75001',
  '', '', '',
  NULL,
  true,
  '0750001A',
  'datagouv',
  now(),
  '10000000-0000-0000-0000-000000000001',
  'linked',
  true
);

SELECT is(
  (SELECT is_claimed FROM public.get_education_establishment_by_uai('0750001A')),
  false,
  'legacy directory row without an administrator remains claimable'
);

SELECT throws_ok(
  $$INSERT INTO public.education_establishments (
    uai, official_name, nature_label, sector, school_level, postal_code, city, department_code
  ) VALUES ('0750001A', 'Duplicate', 'Ecole', 'public', 'elementary', '75001', 'Paris', '075')$$,
  '23505',
  NULL,
  'UAI uniqueness is database enforced'
);
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('Alpha', 0, 20)), 1, 'name search works');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('75001', 0, 20)), 1, 'postal search works');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('1 rue Alpha', 0, 20)), 1, 'full street address search works');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('rue Alpha 75001 Paris', 0, 20)), 1, 'multi-field address search works regardless of column boundaries');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('batiment lumiere', 0, 20)), 1, 'unaccented address line 2 search works');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('entree cour', 0, 20)), 1, 'unaccented address line 3 search works');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('1 rue Alpha, 75001 - Paris', 0, 20)), 1, 'punctuated pasted address search works');
SELECT is((SELECT uai FROM public.search_education_establishments('1 rue Alpha', 0, 20) LIMIT 1), '0750001A'::text, 'address match outranks a competing name match');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('Toulon', 0, 20)), 2, 'city search returns every in-scope Toulon school');
SELECT is((SELECT string_agg(sector, ',' ORDER BY sector) FROM public.search_education_establishments('Toulon', 0, 20)), 'private,public'::text, 'city search includes private and public schools');
SELECT isnt((SELECT uai FROM public.search_education_establishments('Toulon', 0, 1)), (SELECT uai FROM public.search_education_establishments('Toulon', 1, 1)), 'city search pagination is stable and non-overlapping');
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('%_', 0, 20)), 0, 'wildcard-only query cannot enumerate the directory');
UPDATE public.education_establishments
SET address_line_2 = 'Pavillon Concorde'
WHERE uai = '0750001A';
SELECT is((SELECT count(*)::integer FROM public.search_education_establishments('Pavillon Concorde', 0, 20)), 1, 'search document refreshes after an official address update');
SELECT is((SELECT count(*)::integer FROM public.get_education_establishment_by_uai(' 0750001a ')), 1, 'normalized lookup works');
SELECT is((SELECT is_active FROM public.get_education_establishment_by_uai('0750002B')), false, 'inactive record is returned unavailable');

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('20000000-0000-0000-0000-000000000001', 'first@example.test', '{}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'second@example.test', '{}'::jsonb),
  ('20000000-0000-0000-0000-000000000003', 'third@example.test', '{}'::jsonb),
  ('20000000-0000-0000-0000-000000000004', 'parent@example.test', '{}'::jsonb);
INSERT INTO public.user_profiles (user_id, first_name, last_name, role) VALUES
  ('20000000-0000-0000-0000-000000000001', 'First', 'Admin', 'school_admin'),
  ('20000000-0000-0000-0000-000000000002', 'Second', 'Admin', 'school_admin'),
  ('20000000-0000-0000-0000-000000000003', 'Third', 'Admin', 'school_admin'),
  ('20000000-0000-0000-0000-000000000004', 'Test', 'Parent', 'parent')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
SELECT is(
  (SELECT count(*)::integer FROM public.resolve_school_for_child('10000000-0000-0000-0000-000000000001')),
  0,
  'parent cannot link a child to an administratorless legacy tenant'
);
SELECT pg_catalog.set_config('request.jwt.claims', '{}'::text, true);

INSERT INTO public.school_memberships (school_id, user_id, role, is_active)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'staff',
  false
);

INSERT INTO public.schools (
  id, name, type, email, phone, address, city, postal_code,
  manager_first_name, manager_last_name, manager_function,
  admin_user_id, verified, external_id, external_source, synced_at,
  education_establishment_id, education_link_status, is_active
) VALUES (
  '30000000-0000-0000-0000-000000000003',
  'Ecole Gamma',
  'ECOLE DE NIVEAU ELEMENTAIRE',
  'third@example.test',
  '',
  '3 rue Gamma',
  'Paris',
  '75003',
  'Third', 'Admin', 'Responsable',
  '20000000-0000-0000-0000-000000000003',
  true,
  '0750003C',
  'education_annuaire',
  now(),
  '10000000-0000-0000-0000-000000000003',
  'linked',
  false
);

SELECT is(
  (SELECT is_claimed FROM public.get_education_establishment_by_uai('0750003C')),
  true,
  'an administered but disabled tenant remains claimed'
);
SELECT is(
  public.claim_education_establishment_as_user('0750003C', '20000000-0000-0000-0000-000000000002')->>'status',
  'already_claimed',
  'a disabled tenant cannot be taken over by another administrator'
);

SELECT is(
  public.claim_education_establishment_as_user('0750001A', '20000000-0000-0000-0000-000000000001')->>'status',
  'claimed',
  'first atomic claim succeeds'
);
SELECT is(
  public.claim_education_establishment_as_user('0750001A', '20000000-0000-0000-0000-000000000002')->>'status',
  'already_claimed',
  'second claim loses without duplicate'
);
SELECT is((SELECT count(*)::integer FROM public.schools WHERE education_establishment_id = '10000000-0000-0000-0000-000000000001'), 1, 'one tenant exists');
SELECT is(
  (SELECT id::text FROM public.schools WHERE education_establishment_id = '10000000-0000-0000-0000-000000000001'),
  '30000000-0000-0000-0000-000000000001'::text,
  'claim adopts the legacy tenant without changing its id'
);
SELECT is(
  (SELECT external_id FROM public.schools WHERE education_establishment_id = '10000000-0000-0000-0000-000000000001'),
  '0750001A'::text,
  'claimed tenant keeps the official UAI'
);
SELECT is(
  (SELECT education_establishment_id::text FROM public.schools WHERE external_id = '0750001A'),
  '10000000-0000-0000-0000-000000000001'::text,
  'claimed tenant links the official establishment'
);
SELECT is(
  (SELECT education_link_status FROM public.schools WHERE external_id = '0750001A'),
  'linked'::text,
  'claimed tenant has linked status'
);
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);
SELECT is(
  (SELECT school_id::text FROM public.resolve_school_for_child('10000000-0000-0000-0000-000000000001')),
  '30000000-0000-0000-0000-000000000001'::text,
  'parent can resolve an active claimed SecuriClick tenant'
);
SELECT pg_catalog.set_config('request.jwt.claims', '{}'::text, true);
UPDATE public.user_profiles
SET school_id = NULL
WHERE user_id = '20000000-0000-0000-0000-000000000001';
UPDATE public.school_memberships
SET role = 'staff', is_active = false
WHERE school_id = '30000000-0000-0000-0000-000000000001'
  AND user_id = '20000000-0000-0000-0000-000000000001';
SELECT pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
SELECT is(
  public.claim_education_establishment('0750001A')->>'status',
  'claimed',
  'same-owner retry is idempotent and repairs account links'
);
SET LOCAL ROLE authenticated;
UPDATE public.user_profiles
SET school_id = '30000000-0000-0000-0000-000000000003'
WHERE user_id = '20000000-0000-0000-0000-000000000001';
RESET ROLE;
SELECT is(
  (SELECT school_id::text FROM public.user_profiles WHERE user_id = '20000000-0000-0000-0000-000000000001'),
  '30000000-0000-0000-0000-000000000001'::text,
  'authenticated profile updates cannot spoof the claimed school link'
);
SELECT pg_catalog.set_config('request.jwt.claims', '{}'::text, true);
SELECT is(
  (SELECT school_id::text FROM public.user_profiles WHERE user_id = '20000000-0000-0000-0000-000000000001'),
  (SELECT id::text FROM public.schools WHERE external_id = '0750001A'),
  'school administrator profile links the claimed tenant'
);
SELECT is(
  (SELECT count(*)::integer FROM public.school_memberships WHERE school_id = '30000000-0000-0000-0000-000000000001' AND user_id = '20000000-0000-0000-0000-000000000001' AND role = 'school_admin' AND is_active = true),
  1,
  'school administrator membership is active'
);
SELECT is(public.claim_education_establishment_as_user('0750002B', '20000000-0000-0000-0000-000000000002')->>'status', 'inactive', 'inactive school cannot be claimed');
SELECT is(public.claim_education_establishment_as_user('0759999Z', '20000000-0000-0000-0000-000000000002')->>'status', 'not_found', 'unknown UAI is neutral');
SELECT is(public.claim_education_establishment_as_user('bad', '20000000-0000-0000-0000-000000000002')->>'status', 'invalid_uai', 'invalid UAI is rejected server-side');

INSERT INTO public.education_establishments (
  id, uai, official_name, nature_label, sector, has_nursery, has_elementary,
  school_level, address_line_1, address_line_2, address_line_3,
  postal_code, city, department_code, is_active
) VALUES
  ('10000000-0000-0000-0000-000000000007', '0830007G', 'Ecole du Mourillon', 'ECOLE REGIONALE DU PREMIER DEGRE', 'unknown', false, false, 'primary', '7 rue du Mourillon', NULL, NULL, '83000', 'Toulon', '083', true);

SELECT is(
  (SELECT sector FROM public.search_education_establishments('0830007G', 0, 1)),
  'unknown'::text,
  'a school published without a public/private status stays in the catalogue'
);
SELECT is(
  (SELECT count(*)::integer FROM public.search_education_establishments('Toulon', 0, 20)),
  3,
  'city search returns public, private and unpublished-status Toulon schools'
);
SELECT throws_ok(
  $$INSERT INTO public.education_establishments (
    uai, official_name, nature_label, sector, school_level, postal_code, city, department_code
  ) VALUES ('0830008H', 'Ecole Invalide', 'Ecole', 'associatif', 'elementary', '83000', 'Toulon', '083')$$,
  '23514',
  NULL,
  'an unsupported sector is still rejected'
);

SELECT is(
  public.education_search_anchor(ARRAY['ecole', 'primaire', 'privee', 'jean', 'xxiii']),
  'xxiii'::text,
  'the index anchor prefers a distinctive token over a longer generic one'
);
SELECT is(
  public.education_search_anchor(ARRAY['ecole', 'primaire']),
  'primaire'::text,
  'the index anchor falls back to the longest token when all are generic'
);
SELECT is(
  (SELECT count(*)::integer
   FROM public.search_education_establishments('Ecole Sainte Claire', 0, 20)),
  1,
  'an official name padded with generic words still resolves to its school'
);

SELECT * FROM finish();
ROLLBACK;
