-- Migration 030: Corriger l'affichage des élèves dans le dashboard établissement
--
-- BUG 1 — FK manquante sur children.parent_id → user_profiles.user_id
--   CHILD_SELECT utilise parent:user_profiles!children_parent_id_fkey
--   mais cette FK n'existe pas (seule guardians l'a via migration 020).
--   PostgREST ne peut pas résoudre le join → erreur silencieuse / données vides.
--
-- BUG 2 — Policy user_profiles trop restrictive pour un school_admin
--   user_profiles_school_admin_select filtre sur user_profiles.school_id
--   Or les parents ont school_id = NULL → la policy refuse la lecture
--   des profils parents via le join embedded dans CHILD_SELECT.

-- ─── 1. FK children.parent_id → user_profiles.user_id ───────────────────────
-- Permet à PostgREST de résoudre :
--   parent:user_profiles!children_parent_id_fkey
-- Deferrable pour éviter les conflits d'ordre d'insertion.

ALTER TABLE public.children
  ADD CONSTRAINT children_parent_id_user_profiles_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.user_profiles(user_id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- ─── 2. Policy : school_admin peut lire les profils des parents de ses élèves ─
-- La policy existante (user_profiles_school_admin_select) ne couvre que les
-- user_profiles dont school_id correspond à l'école — ce qui exclut les parents
-- (school_id = NULL). On ajoute une policy dédiée, scopée précisément.

DROP POLICY IF EXISTS "user_profiles_school_parent_select" ON public.user_profiles;

CREATE POLICY "user_profiles_school_parent_select" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
        FROM public.children c
        JOIN public.school_memberships sm ON sm.school_id = c.school_id
       WHERE c.parent_id    = user_profiles.user_id
         AND sm.user_id     = auth.uid()
         AND sm.role        IN ('staff', 'school_admin')
         AND sm.is_active   = true
    )
  );
