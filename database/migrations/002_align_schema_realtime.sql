-- ============================================================
-- MIGRATION 002 — Align children/guardians with app types
--                 + Enable Realtime on all key tables
-- Run this in your Supabase SQL editor
-- ============================================================

-- ============================================================
-- 1. CHILDREN: rename parent_id column if it was parent_user_id
--    (safe: only runs if old name exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'parent_user_id'
  ) THEN
    ALTER TABLE children RENAME COLUMN parent_user_id TO parent_id;
  END IF;
END$$;

-- Add missing columns if they don't exist
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS class_name    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Remove old columns only if they exist (school_name was in old schema, now school_id FK)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'school_name'
  ) THEN
    ALTER TABLE children DROP COLUMN school_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'grade'
  ) THEN
    ALTER TABLE children DROP COLUMN grade;
  END IF;
END$$;

-- ============================================================
-- 2. GUARDIANS table (replaces authorized_persons)
--    Already in schemas.sql but may not exist in older DBs
-- ============================================================
CREATE TABLE IF NOT EXISTS guardians (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id    UUID         NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
    child_id     UUID         NOT NULL REFERENCES children(id)    ON DELETE CASCADE,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(255),
    relationship VARCHAR(50)  NOT NULL,
    photo_url    TEXT,
    priority     INTEGER      DEFAULT 1,
    is_active    BOOLEAN      DEFAULT true,
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- RLS for guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guardians' AND policyname = 'guardians_parent_all'
  ) THEN
    CREATE POLICY "guardians_parent_all" ON guardians
      FOR ALL USING (parent_id = auth.uid());
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guardians_parent_id  ON guardians(parent_id);
CREATE INDEX IF NOT EXISTS idx_guardians_child_id   ON guardians(child_id);
CREATE INDEX IF NOT EXISTS idx_guardians_is_active  ON guardians(is_active);

-- updated_at trigger for guardians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guardians_updated_at'
  ) THEN
    CREATE TRIGGER trg_guardians_updated_at
      BEFORE UPDATE ON guardians
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================================
-- 3. AUTHORIZED_PERSONS (old table) → migrate to guardians
--    Only if old table exists
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'authorized_persons'
  ) THEN
    INSERT INTO guardians (
      parent_id, child_id, first_name, last_name,
      phone, relationship, is_active, created_at, updated_at
    )
    SELECT
      parent_user_id,
      child_id,
      first_name,
      last_name,
      phone,
      COALESCE(relation, 'Autre'),
      is_active,
      created_at,
      updated_at
    FROM authorized_persons
    ON CONFLICT DO NOTHING;
  END IF;
END$$;

-- ============================================================
-- 4. PICKUP_LOGS: ensure pickup_time column exists
--    (some older schemas used scanned_at)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pickup_logs' AND column_name = 'scanned_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pickup_logs' AND column_name = 'pickup_time'
  ) THEN
    ALTER TABLE pickup_logs RENAME COLUMN scanned_at TO pickup_time;
  END IF;
END$$;

ALTER TABLE pickup_logs
  ADD COLUMN IF NOT EXISTS pickup_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS denial_reason  TEXT;

-- Make sure status check constraint matches app values
-- completed | denied | cancelled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pickup_logs_status_check'
    AND table_name = 'pickup_logs'
  ) THEN
    ALTER TABLE pickup_logs DROP CONSTRAINT pickup_logs_status_check;
  END IF;
END$$;

ALTER TABLE pickup_logs
  ADD CONSTRAINT pickup_logs_status_check
    CHECK (status IN ('completed', 'denied', 'cancelled'));

-- ============================================================
-- 5. ENABLE SUPABASE REALTIME on all tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE children;
ALTER PUBLICATION supabase_realtime ADD TABLE guardians;
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE qr_codes;

-- ============================================================
-- 6. STORAGE BUCKETS (run manually in Supabase dashboard
--    or via Supabase CLI if not already created)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('profile-images', 'profile-images', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('children-images', 'children-images', false)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS for profile-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'profile_images_owner'
  ) THEN
    CREATE POLICY "profile_images_owner" ON storage.objects
      FOR ALL USING (
        bucket_id = 'profile-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END$$;

-- Storage RLS for children-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'children_images_owner'
  ) THEN
    CREATE POLICY "children_images_owner" ON storage.objects
      FOR ALL USING (
        bucket_id = 'children-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END$$;
