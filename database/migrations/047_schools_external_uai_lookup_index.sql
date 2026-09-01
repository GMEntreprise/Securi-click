-- The legacy tenant table carries ~47k rows imported from an older source, all
-- of them still unlinked. The per-row directory link trigger filters on
-- public.normalize_uai(external_id), a function expression no existing index
-- can serve, so every inserted establishment forced two sequential scans of the
-- whole table: the UPDATE and its correlated count. Bulk directory imports hit
-- the statement timeout on the very first batch and stored nothing.

CREATE INDEX IF NOT EXISTS idx_schools_normalized_external_uai
  ON public.schools (public.normalize_uai(external_id))
  WHERE external_id IS NOT NULL;

ANALYZE public.schools;
