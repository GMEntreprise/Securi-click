-- ============================================================
-- MIGRATION 043 — Fix création de compte (parent ET école)
--
-- SYMPTÔME
--   POST /auth/v1/signup -> 500 "Database error saving new user"
--   => "Impossible de créer le compte" dans l'app, pour tous les rôles.
--
-- CAUSES
--   1. Un trigger AFTER INSERT sur auth.users (`handle_new_user` du
--      template Supabase) plantait — il visait `public.profiles`
--      (table par défaut) au lieu de `public.user_profiles`. Comme il
--      échoue, toute la transaction signUp est annulée -> aucun compte.
--   2. Pour les écoles : même après création du profil, AUCUNE ligne
--      `schools` n'était créée et `admin_user_id` n'était jamais lié,
--      donc le dashboard école restait vide.
--
-- CORRECTIF
--   handle_new_user() reconstruit proprement :
--     a) la ligne user_profiles (tous rôles) depuis raw_user_meta_data ;
--     b) pour role='school_admin' avec metadata école : la ligne schools
--        (email = email du compte) + liaison user_profiles.school_id.
--        Le trigger existant `trg_school_admin_membership` créera alors
--        automatiquement l'entrée school_memberships.
--
--   ROBUSTESSE : chaque étape est dans son propre bloc BEGIN/EXCEPTION.
--   Une erreur sur le profil ou l'école est loguée en WARNING mais
--   N'ANNULE JAMAIS l'inscription auth (et n'annule pas non plus les
--   étapes précédentes réussies).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meta      JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_role      TEXT;
  v_first     TEXT;
  v_last      TEXT;
  v_phone     TEXT;
  v_school_id UUID;
BEGIN
  -- ---- Rôle : valider contre la contrainte CHECK, défaut 'parent' ----
  v_role := COALESCE(NULLIF(v_meta->>'role', ''), 'parent');
  IF v_role NOT IN ('parent', 'collector', 'staff', 'school_admin', 'super_admin') THEN
    v_role := 'parent';
  END IF;

  -- Parents : first_name/last_name ; Écoles : manager_first/last_name
  v_first := COALESCE(NULLIF(v_meta->>'first_name', ''), NULLIF(v_meta->>'manager_first_name', ''), '');
  v_last  := COALESCE(NULLIF(v_meta->>'last_name', ''),  NULLIF(v_meta->>'manager_last_name', ''),  '');
  v_phone := NULLIF(v_meta->>'phone', '');

  -- ---- 1. Profil utilisateur (tous rôles) ----
  BEGIN
    INSERT INTO public.user_profiles (user_id, first_name, last_name, phone, role)
    VALUES (NEW.id, v_first, v_last, v_phone, v_role)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profil échoué pour % : %', NEW.id, SQLERRM;
  END;

  -- ---- 2. École (role school_admin + metadata école présente) ----
  IF v_role = 'school_admin' AND COALESCE(NULLIF(v_meta->>'school_name', ''), '') <> '' THEN
    BEGIN
      INSERT INTO public.schools (
        name, type, email, phone, address, city, postal_code,
        manager_first_name, manager_last_name, manager_function,
        admin_user_id, verified
      )
      VALUES (
        v_meta->>'school_name',
        COALESCE(NULLIF(v_meta->>'school_type', ''), 'École'),
        NEW.email,
        COALESCE(v_phone, ''),
        COALESCE(NULLIF(v_meta->>'address', ''), ''),
        COALESCE(NULLIF(v_meta->>'city', ''), ''),
        COALESCE(NULLIF(v_meta->>'postal_code', ''), ''),
        v_first,
        v_last,
        COALESCE(NULLIF(v_meta->>'manager_function', ''), 'Responsable'),
        NEW.id,
        false
      )
      ON CONFLICT (admin_user_id) DO NOTHING
      RETURNING id INTO v_school_id;

      IF v_school_id IS NOT NULL THEN
        UPDATE public.user_profiles
        SET school_id = v_school_id
        WHERE user_id = NEW.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: école échouée pour % : %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- (Re)câblage propre du trigger standard
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
