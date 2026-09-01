-- Measured root cause: joining the query terms in as a CTE row made every
-- predicate non-constant, so the planner could not use a single index and
-- scanned all 48k rows (3.6 s, past the anon timeout) even for an exact UAI.
-- The same predicates run in 0.2-0.3 s when the value is a parameter, so the
-- search now computes its terms into local variables before querying.

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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $fn$
#variable_conflict use_column
DECLARE
  v_normalized TEXT;
  v_tokens TEXT[];
  v_anchor TEXT;
  v_uai TEXT;
  v_size INTEGER;
  v_offset BIGINT;
BEGIN
  v_normalized := public.normalize_school_search_query(COALESCE(p_query, ''));
  IF pg_catalog.length(v_normalized) < 2 THEN
    RETURN;
  END IF;

  v_tokens := pg_catalog.regexp_split_to_array(v_normalized, '\s+');
  SELECT token.value INTO v_anchor
  FROM pg_catalog.unnest(v_tokens) AS token(value)
  ORDER BY pg_catalog.length(token.value) DESC, token.value
  LIMIT 1;

  v_uai := public.normalize_uai(COALESCE(p_query, ''));
  v_size := LEAST(GREATEST(COALESCE(p_page_size, 20), 1), 50);
  v_offset := GREATEST(COALESCE(p_page, 0), 0)::bigint * v_size::bigint;

  RETURN QUERY
  WITH matched AS MATERIALIZED (
    SELECT establishment.*
    FROM public.education_establishments establishment
    WHERE establishment.uai = v_uai
       OR establishment.search_document LIKE '%' || v_anchor || '%'
       OR public.normalize_school_search_query(establishment.official_name) % v_normalized
       OR public.normalize_school_search_query(establishment.city) % v_normalized
  ), described AS (
    SELECT candidate.*,
           public.normalize_school_search_query(candidate.official_name) AS normalized_name,
           public.normalize_school_search_query(candidate.city) AS normalized_city,
           public.normalize_school_search_query(
             COALESCE(candidate.address_line_1, '') || ' ' ||
             COALESCE(candidate.address_line_2, '') || ' ' ||
             COALESCE(candidate.address_line_3, '')
           ) AS normalized_address,
           NOT EXISTS (
             SELECT 1
             FROM pg_catalog.unnest(v_tokens) AS token(value)
             WHERE candidate.search_document NOT LIKE '%' || token.value || '%'
           ) AS all_tokens_match
    FROM matched candidate
  ), scored AS (
    SELECT described.*,
           CASE
             WHEN described.uai = v_uai THEN 100
             WHEN described.postal_code = v_normalized THEN 98
             WHEN described.normalized_name = v_normalized THEN 95
             WHEN described.normalized_address = v_normalized THEN 93
             WHEN described.normalized_name LIKE v_normalized || '%' THEN 90
             WHEN described.normalized_address LIKE v_normalized || '%' THEN 88
             WHEN described.normalized_city = v_normalized THEN 86
             WHEN described.search_document LIKE '%' || v_normalized || '%' THEN 82
             WHEN described.all_tokens_match THEN 76
             ELSE GREATEST(
               pg_catalog.round(similarity(described.normalized_name, v_normalized) * 70)::integer,
               pg_catalog.round(similarity(described.normalized_city, v_normalized) * 65)::integer
             )
           END AS computed_rank
    FROM described
    WHERE described.uai = v_uai
       OR described.postal_code LIKE v_normalized || '%'
       OR described.search_document LIKE '%' || v_normalized || '%'
       OR described.all_tokens_match
       OR described.normalized_name % v_normalized
       OR described.normalized_city % v_normalized
  )
  SELECT scored.id, scored.uai, scored.official_name,
         scored.nature_label, scored.sector,
         scored.has_nursery, scored.has_elementary,
         scored.school_level, scored.address_line_1,
         scored.address_line_2, scored.address_line_3,
         scored.postal_code, scored.city, scored.department_name,
         scored.academy, scored.latitude, scored.longitude,
         scored.is_active, scored.source_updated_at,
         EXISTS (
           SELECT 1
           FROM public.schools school
           WHERE school.education_establishment_id = scored.id
             AND school.admin_user_id IS NOT NULL
         ),
         scored.computed_rank
  FROM scored
  ORDER BY scored.computed_rank DESC, scored.is_active DESC,
           scored.official_name, scored.uai
  LIMIT v_size
  OFFSET v_offset;
END;
$fn$;

REVOKE ALL ON FUNCTION public.search_education_establishments(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_education_establishments(TEXT, INTEGER, INTEGER) TO anon, authenticated;
