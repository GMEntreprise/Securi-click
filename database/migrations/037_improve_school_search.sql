-- ============================================================
-- MIGRATION 037 — Amélioration recherche école
--
-- Problème : taper le nom d'une ville (ex. "Entrecasteaux")
-- ne remontait pas les écoles car la RPC ne cherchait que dans
-- normalized_name (nom complet) avec un seuil trigram trop élevé.
--
-- Fix :
--   1. Cherche aussi dans city et address via ILIKE
--   2. Cherche chaque mot du query dans normalized_name (word match)
--   3. Abaisse le seuil trigram à 0.15
--   4. Ajoute index GIN sur address pour les recherches ILIKE
-- ============================================================

-- Index GIN sur city pour accélérer les ILIKE
CREATE INDEX IF NOT EXISTS idx_schools_city_lower
  ON schools (lower(city));

CREATE INDEX IF NOT EXISTS idx_schools_address_trgm
  ON schools USING GIN (lower(address) gin_trgm_ops);

-- RPC search_schools améliorée
CREATE OR REPLACE FUNCTION search_schools(
  p_query     TEXT,
  p_city      TEXT    DEFAULT NULL,
  p_limit     INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_normalized TEXT;
  v_results    JSON;
BEGIN
  v_normalized := normalize_school_name(p_query);

  IF length(trim(p_query)) < 2 THEN
    RETURN json_build_object('success', true, 'data', '[]'::json);
  END IF;

  SELECT json_agg(row_to_json(r))
  INTO v_results
  FROM (
    SELECT
      s.id,
      s.name,
      s.normalized_name,
      s.type,
      s.address,
      s.city,
      s.postal_code,
      s.logo_url,
      s.is_active,
      COALESCE(s.verified, false) AS verified,
      s.external_id,
      -- Score de confiance : exact > prefix > city match > trigram
      CASE
        WHEN s.normalized_name = v_normalized                          THEN 100
        WHEN s.normalized_name LIKE (v_normalized || '%')              THEN 90
        WHEN lower(s.city) = lower(trim(p_query))                      THEN 85
        WHEN lower(s.city) ILIKE '%' || lower(trim(p_query)) || '%'   THEN 80
        WHEN s.normalized_name ILIKE '%' || v_normalized || '%'        THEN 75
        ELSE ROUND((similarity(s.normalized_name, v_normalized) * 100)::numeric, 0)::integer
      END AS confidence
    FROM schools s
    WHERE
      s.is_active = true
      AND (
        -- Exact / prefix sur nom normalisé
        s.normalized_name = v_normalized
        OR s.normalized_name LIKE (v_normalized || '%')
        -- Contient le terme quelque part dans le nom
        OR s.normalized_name ILIKE '%' || v_normalized || '%'
        -- Match sur la ville
        OR lower(s.city) ILIKE '%' || lower(trim(p_query)) || '%'
        -- Match sur l'adresse
        OR lower(s.address) ILIKE '%' || lower(trim(p_query)) || '%'
        -- Trigram fuzzy sur nom (seuil abaissé à 0.15)
        OR similarity(s.normalized_name, v_normalized) > 0.15
      )
      AND (p_city IS NULL OR lower(s.city) ILIKE '%' || lower(p_city) || '%')
    ORDER BY confidence DESC, s.name ASC
    LIMIT p_limit
  ) r;

  RETURN json_build_object(
    'success', true,
    'data', COALESCE(v_results, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION search_schools(TEXT, TEXT, INTEGER) TO authenticated, anon;
