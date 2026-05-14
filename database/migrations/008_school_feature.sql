-- ============================================================
-- MIGRATION 008 — SCHOOL FEATURE
-- Adds: logo, opening_hours to schools
--       pickup_validations (scan results)
--       collector_user_id to guardians (for QR scan match)
-- ============================================================

-- 1. Extend schools table
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours    JSONB,
  ADD COLUMN IF NOT EXISTS slug             VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug) WHERE slug IS NOT NULL;

-- 2. Add collector_user_id to guardians if missing
-- (already added by migration 004, guard with IF NOT EXISTS)
ALTER TABLE guardians
  ADD COLUMN IF NOT EXISTS collector_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_guardians_collector_user_id ON guardians(collector_user_id);

-- 3. PICKUP_VALIDATIONS — replaces / augments pickup_logs for school scanner
CREATE TABLE IF NOT EXISTS pickup_validations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id        UUID        NOT NULL REFERENCES schools(id)        ON DELETE CASCADE,
  child_id         UUID        NOT NULL REFERENCES children(id)       ON DELETE CASCADE,
  guardian_id      UUID                 REFERENCES guardians(id)      ON DELETE SET NULL,
  qr_code_id       UUID                 REFERENCES qr_codes(id)       ON DELETE SET NULL,
  scanner_user_id  UUID                 REFERENCES auth.users(id)     ON DELETE SET NULL,
  status           VARCHAR(20) NOT NULL
                       CHECK (status IN ('validated', 'refused', 'pending')),
  refusal_reason   TEXT,
  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta             JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_val_school_id   ON pickup_validations(school_id);
CREATE INDEX IF NOT EXISTS idx_pickup_val_child_id    ON pickup_validations(child_id);
CREATE INDEX IF NOT EXISTS idx_pickup_val_guardian_id ON pickup_validations(guardian_id);
CREATE INDEX IF NOT EXISTS idx_pickup_val_scanned_at  ON pickup_validations(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_pickup_val_status      ON pickup_validations(status);
CREATE INDEX IF NOT EXISTS idx_pickup_val_qr_code_id  ON pickup_validations(qr_code_id);

-- 4. RLS for pickup_validations
ALTER TABLE pickup_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pickup_val_school_staff_all" ON pickup_validations;
CREATE POLICY "pickup_val_school_staff_all" ON pickup_validations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM school_memberships sm
      WHERE sm.user_id = auth.uid()
        AND sm.school_id = pickup_validations.school_id
        AND sm.role IN ('staff', 'school_admin')
        AND sm.is_active = true
    )
  );

DROP POLICY IF EXISTS "pickup_val_parent_select" ON pickup_validations;
CREATE POLICY "pickup_val_parent_select" ON pickup_validations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = pickup_validations.child_id
        AND c.parent_id = auth.uid()
    )
  );

-- 5. Add school_id to pickup_logs for completeness
ALTER TABLE pickup_logs
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pickup_logs_school_id ON pickup_logs(school_id);

-- 6. RPC: validate_qr_and_create_pickup
-- Called by school scanner. Atomically:
--   - validates qr_codes row (not expired, not used, school matches)
--   - marks qr as used
--   - inserts pickup_validations row
--   - inserts pickup_logs row
--   Returns: JSON { success, child, guardian, refusal_reason }
CREATE OR REPLACE FUNCTION validate_qr_and_create_pickup(
  p_qr_token       TEXT,
  p_school_id      UUID,
  p_scanner_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_qr         RECORD;
  v_child      RECORD;
  v_guardian   RECORD;
  v_validation_id UUID;
  v_log_id        UUID;
BEGIN
  -- Lock and fetch QR
  SELECT q.id, q.parent_id, q.child_id, q.guardian_id,
         q.expires_at, q.is_used, q.token
  INTO v_qr
  FROM qr_codes q
  WHERE q.token = p_qr_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'refusal_reason', 'QR invalide ou inexistant.');
  END IF;

  IF v_qr.is_used THEN
    RETURN json_build_object('success', false, 'refusal_reason', 'QR déjà utilisé.');
  END IF;

  IF v_qr.expires_at < NOW() THEN
    INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
    VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'QR expiré.')
    RETURNING id INTO v_validation_id;
    RETURN json_build_object('success', false, 'refusal_reason', 'QR expiré.', 'validation_id', v_validation_id);
  END IF;

  -- Fetch child and verify school match
  SELECT c.id, c.first_name, c.last_name, c.photo_url, c.class_name, c.school_id, c.is_active
  INTO v_child
  FROM children c
  WHERE c.id = v_qr.child_id;

  IF NOT FOUND OR NOT v_child.is_active THEN
    RETURN json_build_object('success', false, 'refusal_reason', 'Enfant introuvable ou inactif.');
  END IF;

  IF v_child.school_id IS DISTINCT FROM p_school_id THEN
    INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
    VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Établissement non correspondant.')
    RETURNING id INTO v_validation_id;
    RETURN json_build_object('success', false, 'refusal_reason', 'Établissement non correspondant.', 'validation_id', v_validation_id);
  END IF;

  -- Fetch guardian if present
  IF v_qr.guardian_id IS NOT NULL THEN
    SELECT g.id, g.first_name, g.last_name, g.phone, g.photo_url, g.is_active, g.relationship
    INTO v_guardian
    FROM guardians g
    WHERE g.id = v_qr.guardian_id;

    IF NOT FOUND OR NOT v_guardian.is_active THEN
      INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status, refusal_reason)
      VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'refused', 'Collecteur désactivé ou introuvable.')
      RETURNING id INTO v_validation_id;
      RETURN json_build_object('success', false, 'refusal_reason', 'Collecteur désactivé ou introuvable.', 'validation_id', v_validation_id);
    END IF;
  END IF;

  -- Mark QR used
  UPDATE qr_codes SET is_used = true, used_at = NOW(), updated_at = NOW()
  WHERE id = v_qr.id;

  -- Create validation record
  INSERT INTO pickup_validations (school_id, child_id, guardian_id, qr_code_id, scanner_user_id, status)
  VALUES (p_school_id, v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, 'validated')
  RETURNING id INTO v_validation_id;

  -- Create pickup log
  INSERT INTO pickup_logs (child_id, guardian_id, qr_code_id, staff_id, school_id, status)
  VALUES (v_qr.child_id, v_qr.guardian_id, v_qr.id, p_scanner_user_id, p_school_id, 'completed')
  RETURNING id INTO v_log_id;

  RETURN json_build_object(
    'success',        true,
    'validation_id',  v_validation_id,
    'log_id',         v_log_id,
    'child',          json_build_object(
                        'id',         v_child.id,
                        'first_name', v_child.first_name,
                        'last_name',  v_child.last_name,
                        'photo_url',  v_child.photo_url,
                        'class_name', v_child.class_name
                      ),
    'guardian',       CASE WHEN v_qr.guardian_id IS NOT NULL THEN
                        json_build_object(
                          'id',           v_guardian.id,
                          'first_name',   v_guardian.first_name,
                          'last_name',    v_guardian.last_name,
                          'phone',        v_guardian.phone,
                          'photo_url',    v_guardian.photo_url,
                          'relationship', v_guardian.relationship
                        )
                      ELSE NULL END
  );
END;
$$;

-- Grant execute to authenticated users (RLS on caller enforced above)
GRANT EXECUTE ON FUNCTION validate_qr_and_create_pickup(TEXT, UUID, UUID) TO authenticated;

-- 7. Realtime for pickup_validations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'pickup_validations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pickup_validations;
  END IF;
END $$;
