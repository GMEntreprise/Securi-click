BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap;
SELECT plan(4);

-- Given a realistic legacy tenant table the planner cannot ignore.
INSERT INTO public.schools (
  name, type, email, phone, address, city, postal_code,
  manager_first_name, manager_last_name, manager_function,
  external_id, external_source
)
SELECT
  'Legacy school ' || generation.index,
  'ECOLE',
  'legacy' || generation.index || '@example.test',
  '0000000000',
  generation.index || ' rue Legacy',
  'Legacyville',
  '75001',
  'Legacy',
  'Manager',
  'Responsable',
  pg_catalog.lpad(generation.index::text, 7, '0') || 'X',
  'datagouv'
FROM pg_catalog.generate_series(1, 3000) AS generation(index);

ANALYZE public.schools;

SELECT has_index(
  'public', 'schools', 'idx_schools_normalized_external_uai',
  'the legacy UAI lookup backing the directory link trigger is indexed'
);

CREATE FUNCTION pg_temp.link_lookup_plan() RETURNS TEXT
LANGUAGE plpgsql AS $fn$
DECLARE
  plan_line TEXT;
  full_plan TEXT := '';
BEGIN
  FOR plan_line IN
    EXECUTE 'EXPLAIN SELECT 1 FROM public.schools
             WHERE education_establishment_id IS NULL
               AND external_id IS NOT NULL
               AND public.normalize_uai(external_id) = ''0000001X'''
  LOOP
    full_plan := full_plan || plan_line || ' ';
  END LOOP;
  RETURN full_plan;
END;
$fn$;

SELECT unlike(
  pg_temp.link_lookup_plan(),
  '%Seq Scan on schools%',
  'the directory link lookup no longer scans the whole tenant table'
);
SELECT like(
  pg_temp.link_lookup_plan(),
  '%idx_schools_normalized_external_uai%',
  'the directory link lookup uses the dedicated UAI index'
);

-- The trigger must still link a legacy tenant row on an exact single match.
INSERT INTO public.education_establishments (
  uai, official_name, nature_label, sector, has_nursery, has_elementary,
  school_level, address_line_1, postal_code, city, department_code, is_active
) VALUES (
  '0000001X', 'Ecole Legacy Officielle', 'ECOLE DE NIVEAU ELEMENTAIRE',
  'public', false, true, 'elementary', '1 rue Legacy', '75001', 'Legacyville',
  '075', true
);

SELECT is(
  (SELECT education_link_status FROM public.schools WHERE external_id = '0000001X'),
  'linked'::text,
  'an unambiguous legacy tenant is still linked to its official establishment'
);

SELECT * FROM finish();
ROLLBACK;
