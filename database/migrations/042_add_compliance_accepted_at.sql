-- Migration 042: Add compliance tracking to user_profiles
-- compliance_accepted_at: timestamp when user accepted the welcome compliance sheet (NULL = not yet seen)
-- has_seen_compliance:    fast boolean flag (derived from accepted_at but kept for index efficiency)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS compliance_accepted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_seen_compliance BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast lookup (NavigationGuard checks this on every dashboard mount)
CREATE INDEX IF NOT EXISTS idx_user_profiles_compliance
  ON public.user_profiles (user_id, has_seen_compliance)
  WHERE has_seen_compliance = FALSE;

-- RLS: users can update their own compliance columns only
-- (existing update policies already allow self-update on user_profiles)
