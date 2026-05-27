-- ============================================================
-- MIGRATION 035 — Guardian email uniqueness per parent
--
-- Prevents a parent from inviting the same collector email
-- more than once across all their children.
--
-- A NULL email is always allowed (phone-only guardians).
-- ============================================================

-- Remove any existing duplicates before adding the constraint.
-- Keep the oldest row (lowest created_at, then smallest ctid for tie-breaking).
-- ctid is Postgres's physical row identifier — always unique, no tie possible.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY parent_id, lower(trim(email))
      ORDER BY created_at ASC, ctid ASC
    ) AS rn
  FROM public.guardians
  WHERE email IS NOT NULL
    AND trim(email) <> ''
)
UPDATE public.guardians g
SET is_active = false, updated_at = NOW()
FROM ranked r
WHERE g.id = r.id
  AND r.rn > 1;

-- Unique index: one active guardian per email per parent.
-- Inactive guardians (is_active = false) are excluded so deactivated duplicates
-- from the cleanup above don't block the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_parent_email_unique
  ON public.guardians (parent_id, lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '' AND is_active = true;
