-- Migration 029: RLS policies manquantes pour les collectors
--
-- PROBLÈME 1 — generateCollectorQrCode() :
--   La RPC (SECURITY DEFINER) insère en qr_codes et retourne un UUID.
--   Le service fait ensuite un SELECT sur qr_codes pour récupérer la ligne complète.
--   Or il n'existe aucune policy SELECT sur qr_codes permettant à un collector de lire
--   ses propres QR → fetchErr / null → onError → "Impossible de générer le QR code."
--
-- PROBLÈME 2 — getCollectorRecentScans() :
--   Le service fait un SELECT sur pickup_logs filtré par guardian_ids du collector.
--   Or il n'existe aucune policy SELECT sur pickup_logs pour les collectors
--   → la liste de scans récents revient toujours vide.
--
-- SOLUTION : deux policies SELECT minimales, scoped au collector authentifié.

-- ─── 1. qr_codes — collector peut lire les QR de ses guardians ───────────────
DROP POLICY IF EXISTS "qr_codes_collector_select" ON public.qr_codes;

CREATE POLICY "qr_codes_collector_select" ON public.qr_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.id                = qr_codes.guardian_id
        AND g.collector_user_id = auth.uid()
    )
  );

-- ─── 2. pickup_logs — collector peut lire les logs de ses guardians ───────────
DROP POLICY IF EXISTS "pickup_logs_collector_select" ON public.pickup_logs;

CREATE POLICY "pickup_logs_collector_select" ON public.pickup_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guardians g
      WHERE g.id                = pickup_logs.guardian_id
        AND g.collector_user_id = auth.uid()
    )
  );
