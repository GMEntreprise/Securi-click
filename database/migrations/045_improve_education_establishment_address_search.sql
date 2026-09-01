-- Improve official-directory search without querying or duplicating tenant rows.
-- The search document is rebuilt from scratch so it always uses the very same
-- normalizer as the query, whichever shape an earlier attempt left behind.

CREATE OR REPLACE FUNCTION public.normalize_school_search_query(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = pg_catalog
AS $$
  SELECT pg_catalog.btrim(
    pg_catalog.regexp_replace(
      public.normalize_school_name(input),
      '[^[:alnum:]]+',
      ' ',
      'g'
    )
  );
$$;

DROP TRIGGER IF EXISTS trg_refresh_education_establishment_search_document
  ON public.education_establishments;
DROP FUNCTION IF EXISTS public.refresh_education_establishment_search_document();
DROP INDEX IF EXISTS public.idx_education_establishments_search_document_trgm;

ALTER TABLE public.education_establishments
  DROP COLUMN IF EXISTS search_document;

ALTER TABLE public.education_establishments
  ADD COLUMN search_document TEXT
  GENERATED ALWAYS AS (
    public.normalize_school_search_query(
      COALESCE(uai, '') || ' ' ||
      COALESCE(official_name, '') || ' ' ||
      COALESCE(patronym, '') || ' ' ||
      COALESCE(denomination, '') || ' ' ||
      COALESCE(nature_label, '') || ' ' ||
      COALESCE(address_line_1, '') || ' ' ||
      COALESCE(address_line_2, '') || ' ' ||
      COALESCE(address_line_3, '') || ' ' ||
      COALESCE(postal_code, '') || ' ' ||
      COALESCE(city, '') || ' ' ||
      COALESCE(department_name, '') || ' ' ||
      COALESCE(academy, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_education_establishments_search_document_trgm
  ON public.education_establishments
  USING gin (search_document gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_education_establishments(
  p_query TEXT,
  p_page INTEGER DEFAULT 0,
  p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  uai TEXT,
  official_name TEXT,
  nature_label TEXT,
  sector TEXT,
  has_nursery BOOLEAN,
  has_elementary BOOLEAN,
  school_level TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  address_line_3 TEXT,
  postal_code TEXT,
  city TEXT,
  department_name TEXT,
  academy TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN,
  source_updated_at DATE,
  is_claimed BOOLEAN,
  rank_score INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
  WITH input AS (
    SELECT pg_catalog.btrim(COALESCE(p_query, '')) AS raw,
           public.normalize_school_search_query(COALESCE(p_query, '')) AS normalized,
           public.normalize_uai(COALESCE(p_query, '')) AS possible_uai,
           pg_catalog.regexp_split_to_array(
             public.normalize_school_search_query(COALESCE(p_query, '')),
             '\s+'
           ) AS tokens,
           LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 50) AS page_size,
           GREATEST(COALESCE(p_page, 0), 0) AS page_number
  ), candidates AS (
    SELECT establishment.*,
           input.raw,
           input.normalized,
           input.possible_uai,
           input.page_size,
           input.page_number,
           public.normalize_school_search_query(establishment.official_name) AS normalized_name,
           public.normalize_school_search_query(establishment.city) AS normalized_city,
           public.normalize_school_search_query(
             COALESCE(establishment.address_line_1, '') || ' ' ||
             COALESCE(establishment.address_line_2, '') || ' ' ||
             COALESCE(establishment.address_line_3, '')
           ) AS normalized_address,
           NOT EXISTS (
             SELECT 1
             FROM pg_catalog.unnest(input.tokens) AS token(value)
             WHERE establishment.search_document NOT LIKE '%' || token.value || '%'
           ) AS all_tokens_match
    FROM public.education_establishments establishment
    CROSS JOIN input
    WHERE pg_catalog.length(input.normalized) >= 2
      AND (
        establishment.uai = input.possible_uai
        OR establishment.postal_code LIKE input.normalized || '%'
        OR establishment.search_document LIKE '%' || input.normalized || '%'
        OR NOT EXISTS (
          SELECT 1
          FROM pg_catalog.unnest(input.tokens) AS token(value)
          WHERE establishment.search_document NOT LIKE '%' || token.value || '%'
        )
        OR similarity(public.normalize_school_search_query(establishment.official_name), input.normalized) > 0.18
        OR similarity(public.normalize_school_search_query(establishment.city), input.normalized) > 0.25
      )
  )
  SELECT candidate.id, candidate.uai, candidate.official_name,
         candidate.nature_label, candidate.sector,
         candidate.has_nursery, candidate.has_elementary,
         candidate.school_level, candidate.address_line_1,
         candidate.address_line_2, candidate.address_line_3,
         candidate.postal_code, candidate.city, candidate.department_name,
         candidate.academy, candidate.latitude, candidate.longitude,
         candidate.is_active, candidate.source_updated_at,
         EXISTS (
           SELECT 1
           FROM public.schools school
           WHERE school.education_establishment_id = candidate.id
             AND school.admin_user_id IS NOT NULL
         ) AS is_claimed,
         CASE
           WHEN candidate.uai = candidate.possible_uai THEN 100
           WHEN candidate.postal_code = candidate.normalized THEN 98
           WHEN candidate.normalized_name = candidate.normalized THEN 95
           WHEN candidate.normalized_address = candidate.normalized THEN 93
           WHEN candidate.normalized_name LIKE candidate.normalized || '%' THEN 90
           WHEN candidate.normalized_address LIKE candidate.normalized || '%' THEN 88
           WHEN candidate.normalized_city = candidate.normalized THEN 86
           WHEN candidate.search_document LIKE '%' || candidate.normalized || '%' THEN 82
           WHEN candidate.all_tokens_match THEN 76
           ELSE GREATEST(
             pg_catalog.round(similarity(candidate.normalized_name, candidate.normalized) * 70)::integer,
             pg_catalog.round(similarity(candidate.normalized_city, candidate.normalized) * 65)::integer
           )
         END AS rank_score
  FROM candidates candidate
  ORDER BY rank_score DESC, candidate.is_active DESC,
           candidate.official_name, candidate.uai
  LIMIT (SELECT page_size FROM input)
  OFFSET (
    (SELECT page_number::bigint FROM input) *
    (SELECT page_size::bigint FROM input)
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_school_for_child(p_establishment_id UUID)
RETURNS TABLE (school_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT school.id
  FROM public.schools school
  WHERE school.education_establishment_id = p_establishment_id
    AND school.admin_user_id IS NOT NULL
    AND school.is_active = true
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles profile
      WHERE profile.user_id = auth.uid()
        AND profile.role = 'parent'
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.normalize_school_search_query(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_education_establishments(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_school_for_child(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_education_establishments(TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_school_for_child(UUID) TO authenticated;
