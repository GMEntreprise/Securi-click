-- ============================================================
-- MIGRATION 036 — check_email_exists RPC
--
-- Retourne TRUE si un compte auth.users existe déjà avec cet
-- email (peu importe le rôle : parent, école, staff…).
--
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire
-- (postgres), donc peut lire auth.users sans exposer de données.
-- Accessible aux utilisateurs non authentifiés (anon) pour être
-- appelable depuis l'écran d'inscription.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = lower(trim(p_email))
  );
$$;

-- Accessible depuis l'app avant connexion
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;
