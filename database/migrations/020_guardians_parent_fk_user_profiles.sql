-- Migration 020: Add FK from guardians.parent_id to user_profiles.user_id
-- Allows PostgREST to resolve the join:
--   parent:user_profiles!guardians_parent_id_fkey
-- Previously parent_id only referenced auth.users(id), which PostgREST
-- cannot traverse to user_profiles.

ALTER TABLE public.guardians
  ADD CONSTRAINT guardians_parent_id_user_profiles_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.user_profiles(user_id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;
