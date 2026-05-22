-- Migration 031: RPC delete_own_account
--
-- Permet à un utilisateur authentifié de supprimer son propre compte.
-- Exécuté SECURITY DEFINER pour accéder à auth.users via le rôle service.
-- Les données liées sont supprimées en cascade via les FK ON DELETE CASCADE
-- déjà en place sur toutes les tables (children, guardians, qr_codes, etc.).
-- L'entrée audit_log reste (user_id → NULL via ON DELETE SET NULL).

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Audit log avant suppression (user_id deviendra NULL par cascade)
  INSERT INTO public.audit_logs (user_id, action_type, table_name, row_id, meta)
  VALUES (
    v_user_id,
    'account_deleted',
    'auth.users',
    v_user_id,
    jsonb_build_object('deleted_at', NOW())
  );

  -- Suppression du compte — déclenche tous les ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Seuls les utilisateurs authentifiés peuvent s'appeler eux-mêmes
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- Révoquer l'accès public par sécurité
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM anon;
