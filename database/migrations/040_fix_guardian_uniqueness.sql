-- ============================================================
-- MIGRATION 040 — Fix guardian uniqueness constraints
--
-- PROBLEM: idx_guardians_parent_email_unique prevents a parent
-- from inviting the same collector to a second child (too broad).
--
-- FIX 1: Scope the email uniqueness to (parent_id, child_id, email)
--        so the same email can be invited once per child.
--
-- FIX 2: Add a UNIQUE constraint on (child_id, collector_user_id)
--        so a confirmed collector cannot be linked twice to the
--        same child (closes the race-condition gap in path A).
-- ============================================================

-- ── 1. Drop the overly-broad email uniqueness index ─────────────────────────
DROP INDEX IF EXISTS public.idx_guardians_parent_email_unique;

-- ── 2. Create the correct email uniqueness index (per child) ────────────────
-- One active invitation per email per child.
-- Inactive rows (is_active = false) are excluded so deactivated
-- entries don't block a fresh re-invite.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_child_email_unique
  ON public.guardians (child_id, lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '' AND is_active = true;

-- ── 3. Add uniqueness constraint on (child_id, collector_user_id) ───────────
-- Prevents the same confirmed collector from being linked twice to
-- the same child (server-side guard, closes race condition).
-- Only applies when collector_user_id is set (accepted invitations).
CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_child_collector_unique
  ON public.guardians (child_id, collector_user_id)
  WHERE collector_user_id IS NOT NULL;
