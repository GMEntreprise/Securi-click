-- With the national catalogue loaded, the previous search evaluated
-- similarity(normalize_school_search_query(official_name), query) on every one
-- of the 48k rows, so no index could be used and the statement exceeded the
-- anon timeout. Filtering now runs against indexed expressions only, and the
-- costly ranking is computed for matched rows alone. Fuzzy matching is kept,
-- served by dedicated trigram indexes instead of a sequential scan.

CREATE INDEX IF NOT EXISTS idx_education_establishments_search_name_trgm
  ON public.education_establishments
  USING gin (public.normalize_school_search_query(official_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_education_establishments_search_city_trgm
  ON public.education_establishments
  USING gin (public.normalize_school_search_query(city) gin_trgm_ops);

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
  WITH input AS MATERIALIZED (
    SELECT prepared.normalized,
           prepared.tokens,
           public.normalize_uai(COALESCE(p_query, '')) AS possible_uai,
           (
             SELECT token.value
             FROM pg_catalog.unnest(prepared.tokens) AS token(value)
             ORDER BY pg_catalog.length(token.value) DESC, token.value
             LIMIT 1
           ) AS anchor_token,
           LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 50) AS page_size,
           GREATEST(COALESCE(p_page, 0), 0) AS page_number
    FROM (
      SELECT public.normalize_school_search_query(COALESCE(p_query, '')) AS normalized,
             pg_catalog.regexp_split_to_array(
               public.normalize_school_search_query(COALESCE(p_query, '')),
               '\s+'
             ) AS tokens
    ) AS prepared
  ), matched AS MATERIALIZED (
    SELECT establishment.*
    FROM public.education_establishments establishment
    CROSS JOIN input
    WHERE pg_catalog.length(input.normalized) >= 2
      AND (
        establishment.uai = input.possible_uai
        OR establishment.postal_code LIKE input.normalized || '%'
        OR establishment.search_document LIKE '%' || input.anchor_token || '%'
        OR public.normalize_school_search_query(establishment.official_name) % input.normalized
        OR public.normalize_school_search_query(establishment.city) % input.normalized
      )
  ), ranked AS (
    SELECT candidate.*,
           public.normalize_school_search_query(candidate.official_name) AS normalized_name,
           public.normalize_school_search_query(candidate.city) AS normalized_city,
           public.normalize_school_search_query(
             COALESCE(candidate.address_line_1, '') || ' ' ||
             COALESCE(candidate.address_line_2, '') || ' ' ||
             COALESCE(candidate.address_line_3, '')
           ) AS normalized_address,
           input.normalized,
           input.possible_uai,
           input.page_size,
           input.page_number,
           NOT EXISTS (
             SELECT 1
             FROM pg_catalog.unnest(input.tokens) AS token(value)
             WHERE candidate.search_document NOT LIKE '%' || token.value || '%'
           ) AS all_tokens_match
    FROM matched candidate
    CROSS JOIN input
  )
  SELECT ranked.id, ranked.uai, ranked.official_name,
         ranked.nature_label, ranked.sector,
         ranked.has_nursery, ranked.has_elementary,
         ranked.school_level, ranked.address_line_1,
         ranked.address_line_2, ranked.address_line_3,
         ranked.postal_code, ranked.city, ranked.department_name,
         ranked.academy, ranked.latitude, ranked.longitude,
         ranked.is_active, ranked.source_updated_at,
         EXISTS (
           SELECT 1
           FROM public.schools school
           WHERE school.education_establishment_id = ranked.id
             AND school.admin_user_id IS NOT NULL
         ) AS is_claimed,
         CASE
           WHEN ranked.uai = ranked.possible_uai THEN 100
           WHEN ranked.postal_code = ranked.normalized THEN 98
           WHEN ranked.normalized_name = ranked.normalized THEN 95
           WHEN ranked.normalized_address = ranked.normalized THEN 93
           WHEN ranked.normalized_name LIKE ranked.normalized || '%' THEN 90
           WHEN ranked.normalized_address LIKE ranked.normalized || '%' THEN 88
           WHEN ranked.normalized_city = ranked.normalized THEN 86
           WHEN ranked.search_document LIKE '%' || ranked.normalized || '%' THEN 82
           WHEN ranked.all_tokens_match THEN 76
           ELSE GREATEST(
             pg_catalog.round(similarity(ranked.normalized_name, ranked.normalized) * 70)::integer,
             pg_catalog.round(similarity(ranked.normalized_city, ranked.normalized) * 65)::integer
           )
         END AS rank_score
  FROM ranked
  WHERE ranked.uai = ranked.possible_uai
     OR ranked.postal_code LIKE ranked.normalized || '%'
     OR ranked.search_document LIKE '%' || ranked.normalized || '%'
     OR ranked.all_tokens_match
     OR ranked.normalized_name % ranked.normalized
     OR ranked.normalized_city % ranked.normalized
  ORDER BY rank_score DESC, ranked.is_active DESC,
           ranked.official_name, ranked.uai
  LIMIT (SELECT page_size FROM input)
  OFFSET (
    (SELECT page_number::bigint FROM input) *
    (SELECT page_size::bigint FROM input)
  );
$$;

REVOKE ALL ON FUNCTION public.search_education_establishments(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_education_establishments(TEXT, INTEGER, INTEGER) TO anon, authenticated;

ANALYZE public.education_establishments;
