-- ============================================================
-- MIGRATION 025 — SCHOOL SEARCH
-- Active pg_trgm, ajoute normalized_name sur schools,
-- index GIN pour fuzzy search, RPC search_schools().
-- ============================================================

-- 1. Extension trigram (déjà dispo sur Supabase, idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Colonne normalized_name sur schools
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS normalized_name TEXT;

-- 3. Fonction de normalisation (minuscules + unaccent + collapse espaces)
CREATE OR REPLACE FUNCTION normalize_school_name(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT regexp_replace(
    lower(unaccent(trim(input))),
    '\s+', ' ', 'g'
  );
$$;

-- 4. Populer normalized_name pour les écoles existantes
UPDATE schools
SET normalized_name = normalize_school_name(name)
WHERE normalized_name IS NULL OR normalized_name = '';

-- 5. Trigger pour maintenir normalized_name automatiquement
CREATE OR REPLACE FUNCTION trg_schools_normalize()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.normalized_name := normalize_school_name(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schools_normalized_name ON schools;
CREATE TRIGGER trg_schools_normalized_name
  BEFORE INSERT OR UPDATE OF name ON schools
  FOR EACH ROW EXECUTE FUNCTION trg_schools_normalize();

-- 6. Index GIN trigram sur normalized_name + city pour la recherche
CREATE INDEX IF NOT EXISTS idx_schools_name_trgm
  ON schools USING GIN (normalized_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_schools_city_trgm
  ON schools USING GIN (lower(city) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_schools_active
  ON schools (is_active) WHERE is_active = true;

-- 7. RPC search_schools — recherche fuzzy avec score de confiance
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
      -- Score de confiance : exact > prefix > trigram
      CASE
        WHEN s.normalized_name = v_normalized THEN 100
        WHEN s.normalized_name LIKE (v_normalized || '%') THEN 90
        ELSE ROUND((similarity(s.normalized_name, v_normalized) * 100)::numeric, 0)::integer
      END AS confidence
    FROM schools s
    WHERE
      s.is_active = true
      AND (
        s.normalized_name = v_normalized
        OR s.normalized_name LIKE (v_normalized || '%')
        OR similarity(s.normalized_name, v_normalized) > 0.2
        OR similarity(lower(s.city), lower(COALESCE(p_city, s.city))) > 0.5
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

GRANT EXECUTE ON FUNCTION search_schools(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_school_name(TEXT) TO authenticated;
