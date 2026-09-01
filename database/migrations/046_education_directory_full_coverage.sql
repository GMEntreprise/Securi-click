-- The official directory publishes a small number of open schools without a
-- public/private status. They stay searchable and claimable under an explicit
-- 'unknown' sector instead of being dropped from the national catalogue.

DO $migration$
DECLARE
  existing_constraint TEXT;
BEGIN
  FOR existing_constraint IN
    SELECT constraint_row.conname
    FROM pg_catalog.pg_constraint constraint_row
    WHERE constraint_row.conrelid = 'public.education_establishments'::pg_catalog.regclass
      AND constraint_row.contype = 'c'
      AND pg_catalog.pg_get_constraintdef(constraint_row.oid) ILIKE '%sector%'
  LOOP
    EXECUTE pg_catalog.format(
      'ALTER TABLE public.education_establishments DROP CONSTRAINT %I',
      existing_constraint
    );
  END LOOP;
END;
$migration$;

ALTER TABLE public.education_establishments
  ADD CONSTRAINT education_establishments_sector_check
  CHECK (sector IN ('public', 'private', 'unknown'));

CREATE INDEX IF NOT EXISTS idx_education_establishments_city_scope
  ON public.education_establishments (public.normalize_school_name(city), is_active);
