-- Migration 028: RPC pour qu'un collecteur génère son propre QR code
--
-- Problème: generate_qr_code (migration 006) vérifie auth.uid() == p_parent_id,
-- ce qui échoue toujours quand c'est un collector qui appelle (son uid != parent_id).
-- Solution: nouvelle RPC réservée aux collectors, qui vérifie que auth.uid()
-- est bien le collector_user_id du guardian, et que ce guardian est actif.

CREATE OR REPLACE FUNCTION public.generate_collector_qr_code(
  p_guardian_id     UUID,
  p_child_id        UUID,
  p_expires_in_hours INT DEFAULT 24
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller      UUID := auth.uid();
  v_guardian    RECORD;
  v_token       TEXT;
  v_qr_id       UUID;
BEGIN
  -- 1. Vérifier que le collector est bien le titulaire de ce guardian et qu'il est actif
  SELECT g.parent_id, g.child_id, g.is_active
    INTO v_guardian
    FROM public.guardians g
   WHERE g.id                  = p_guardian_id
     AND g.collector_user_id   = v_caller
     AND g.child_id            = p_child_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden: guardian introuvable ou non autorisé';
  END IF;

  IF NOT v_guardian.is_active THEN
    RAISE EXCEPTION 'forbidden: accès suspendu par le parent';
  END IF;

  -- 2. Invalider les QR non consommés existants pour ce guardian/enfant
  UPDATE public.qr_codes
     SET is_used  = TRUE,
         used_at  = NOW(),
         updated_at = NOW()
   WHERE guardian_id = p_guardian_id
     AND child_id    = p_child_id
     AND is_used     = FALSE;

  -- 3. Générer un token cryptographiquement sûr
  v_token := 'SC-' || upper(replace(gen_random_uuid()::TEXT, '-', ''));

  -- 4. Insérer le nouveau QR
  INSERT INTO public.qr_codes (
    parent_id, child_id, guardian_id, token, expires_at, is_used
  ) VALUES (
    v_guardian.parent_id,
    p_child_id,
    p_guardian_id,
    v_token,
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL,
    FALSE
  )
  RETURNING id INTO v_qr_id;

  RETURN v_qr_id;
END;
$$;

-- Donner les droits d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.generate_collector_qr_code(UUID, UUID, INT)
  TO authenticated;
