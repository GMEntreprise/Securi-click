-- ============================================================
-- MIGRATION 001 — Fix RLS infinite recursion on school_memberships
--
-- Problem: school_memberships_admin_all policy queries school_memberships
-- itself (via sm2 subquery), causing PostgreSQL to recurse infinitely.
--
-- Fix: replace the self-referencing subquery with a SECURITY DEFINER
-- helper function that reads school_memberships bypassing RLS.
-- ============================================================

-- 1. Helper function — runs as the table owner, bypasses RLS
CREATE OR REPLACE FUNCTION is_school_admin_of(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM school_memberships
    WHERE user_id    = auth.uid()
      AND school_id  = p_school_id
      AND role       = 'school_admin'
      AND is_active  = true
  );
$$;

-- Grant execute to the anon and authenticated roles
GRANT EXECUTE ON FUNCTION is_school_admin_of(UUID) TO anon, authenticated;

-- 2. Drop the broken recursive policies
DROP POLICY IF EXISTS "school_memberships_admin_all" ON school_memberships;

-- Also fix user_profiles school_admin policy which has the same pattern
DROP POLICY IF EXISTS "user_profiles_school_admin_select" ON user_profiles;

-- Also fix schools member policy which references school_memberships
DROP POLICY IF EXISTS "schools_member_select" ON schools;

-- 3. Re-create school_memberships admin policy using the safe function
CREATE POLICY "school_memberships_admin_all" ON school_memberships
    FOR ALL USING (
        is_school_admin_of(school_memberships.school_id)
    );

-- 4. Re-create user_profiles school_admin policy using the safe function
CREATE POLICY "user_profiles_school_admin_select" ON user_profiles
    FOR SELECT USING (
        user_profiles.school_id IS NOT NULL
        AND is_school_admin_of(user_profiles.school_id)
    );

-- 5. Re-create schools member policy using the safe function
CREATE POLICY "schools_member_select" ON schools
    FOR SELECT USING (
        is_school_admin_of(schools.id)
    );
