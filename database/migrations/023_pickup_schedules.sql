-- ============================================================
-- MIGRATION 023 — PICKUP SCHEDULES
-- Étend pickup_authorizations avec planning structuré,
-- ajoute RLS collecteur, active realtime.
-- ============================================================

-- 1. Nouveaux champs sur pickup_authorizations
ALTER TABLE pickup_authorizations
  ADD COLUMN IF NOT EXISTS time_windows      JSONB,
  ADD COLUMN IF NOT EXISTS timezone          TEXT NOT NULL DEFAULT 'Europe/Paris',
  ADD COLUMN IF NOT EXISTS reminder_before   INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_reminded_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_pickup_at    TIMESTAMPTZ;

COMMENT ON COLUMN pickup_authorizations.time_windows IS
  'Structure: [{"start":"16:00","end":"18:00"}] — plusieurs plages par jour possibles';
COMMENT ON COLUMN pickup_authorizations.timezone IS
  'Timezone IANA, ex: Europe/Paris';
COMMENT ON COLUMN pickup_authorizations.reminder_before IS
  'Minutes avant le créneau pour envoyer le rappel push';
COMMENT ON COLUMN pickup_authorizations.next_pickup_at IS
  'Prochain créneau calculé — mis à jour par la fonction compute_next_pickup_at()';

-- 2. Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS idx_pickup_auth_next_pickup
  ON pickup_authorizations(next_pickup_at)
  WHERE is_active = true AND next_pickup_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pickup_auth_guardian_child_active
  ON pickup_authorizations(guardian_id, child_id, is_active);

-- 3. RLS collecteur — peut lire son propre planning
DROP POLICY IF EXISTS "pickup_auth_collector_select" ON pickup_authorizations;
CREATE POLICY "pickup_auth_collector_select" ON pickup_authorizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM guardians g
      WHERE g.id = pickup_authorizations.guardian_id
        AND g.collector_user_id = auth.uid()
    )
  );

-- 4. RLS école — peut lire les plannings de ses élèves (déjà pickup_auth_staff_select)
-- Déjà présent dans schemas.sql — pas de doublon.

-- 5. Activer realtime pour pickup_authorizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'pickup_authorizations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pickup_authorizations;
  END IF;
END $$;

-- 6. Fonction utilitaire : calculer le prochain créneau à partir du planning
-- Retourne le prochain TIMESTAMPTZ Europe/Paris correspondant aux jours/horaires autorisés.
CREATE OR REPLACE FUNCTION compute_next_pickup_at(
  p_monday    BOOLEAN,
  p_tuesday   BOOLEAN,
  p_wednesday BOOLEAN,
  p_thursday  BOOLEAN,
  p_friday    BOOLEAN,
  p_time_windows JSONB,
  p_start_time   TIME,
  p_timezone     TEXT DEFAULT 'Europe/Paris'
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_now          TIMESTAMPTZ := NOW() AT TIME ZONE p_timezone;
  v_today        INTEGER     := EXTRACT(ISODOW FROM v_now)::INTEGER; -- 1=Mon..7=Sun
  v_today_time   TIME        := v_now::TIME;
  v_days         BOOLEAN[]   := ARRAY[p_monday, p_tuesday, p_wednesday, p_thursday, p_friday, false, false];
  v_first_start  TIME;
  v_offset       INTEGER;
  v_d            INTEGER;
  v_candidate    DATE;
  v_window       JSONB;
BEGIN
  -- Extraire l'heure de début la plus tôt depuis time_windows ou start_time
  IF p_time_windows IS NOT NULL AND jsonb_array_length(p_time_windows) > 0 THEN
    SELECT MIN((elem->>'start')::TIME)
    INTO v_first_start
    FROM jsonb_array_elements(p_time_windows) AS elem;
  ELSE
    v_first_start := COALESCE(p_start_time, '15:00:00'::TIME);
  END IF;

  -- Chercher le prochain jour autorisé (max 7 jours en avance)
  FOR v_offset IN 0..6 LOOP
    v_d := ((v_today - 1 + v_offset) % 7) + 1; -- 1=Mon..7=Sun
    IF v_days[v_d] THEN
      -- Si c'est aujourd'hui, vérifier que le créneau n'est pas déjà passé
      IF v_offset = 0 AND v_today_time >= v_first_start THEN
        CONTINUE;
      END IF;
      v_candidate := (CURRENT_DATE + v_offset)::DATE;
      RETURN (v_candidate + v_first_start) AT TIME ZONE p_timezone;
    END IF;
  END LOOP;

  RETURN NULL; -- Aucun jour configuré
END;
$$;

GRANT EXECUTE ON FUNCTION compute_next_pickup_at(BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,JSONB,TIME,TEXT) TO authenticated;

-- 7. RPC : upsert_pickup_authorization
-- Crée ou met à jour le planning d'un guardian pour un enfant.
-- Appelée par le parent depuis l'app.
CREATE OR REPLACE FUNCTION upsert_pickup_authorization(
  p_child_id          UUID,
  p_guardian_id       UUID,
  p_monday            BOOLEAN DEFAULT false,
  p_tuesday           BOOLEAN DEFAULT false,
  p_wednesday         BOOLEAN DEFAULT false,
  p_thursday          BOOLEAN DEFAULT false,
  p_friday            BOOLEAN DEFAULT false,
  p_time_windows      JSONB   DEFAULT '[{"start":"15:00","end":"18:00"}]',
  p_start_time        TIME    DEFAULT '15:00:00',
  p_end_time          TIME    DEFAULT '18:00:00',
  p_reminder_before   INTEGER DEFAULT 30,
  p_timezone          TEXT    DEFAULT 'Europe/Paris',
  p_is_active         BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id UUID := auth.uid();
  v_auth_id   UUID;
  v_next_at   TIMESTAMPTZ;
BEGIN
  -- Vérifier que l'enfant appartient au parent
  IF NOT EXISTS (
    SELECT 1 FROM children c
    WHERE c.id = p_child_id AND c.parent_id = v_parent_id AND c.is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Enfant introuvable ou non autorisé.');
  END IF;

  -- Vérifier que le guardian appartient au parent
  IF NOT EXISTS (
    SELECT 1 FROM guardians g
    WHERE g.id = p_guardian_id AND g.parent_id = v_parent_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Collecteur introuvable.');
  END IF;

  -- Calculer next_pickup_at
  v_next_at := compute_next_pickup_at(
    p_monday, p_tuesday, p_wednesday, p_thursday, p_friday,
    p_time_windows, p_start_time, p_timezone
  );

  -- Upsert
  INSERT INTO pickup_authorizations (
    parent_id, child_id, guardian_id,
    monday, tuesday, wednesday, thursday, friday,
    start_time, end_time,
    time_windows, timezone, reminder_before,
    is_active, next_pickup_at, updated_at
  )
  VALUES (
    v_parent_id, p_child_id, p_guardian_id,
    p_monday, p_tuesday, p_wednesday, p_thursday, p_friday,
    p_start_time, p_end_time,
    p_time_windows, p_timezone, p_reminder_before,
    p_is_active, v_next_at, NOW()
  )
  ON CONFLICT (parent_id, child_id, guardian_id)
  DO UPDATE SET
    monday           = EXCLUDED.monday,
    tuesday          = EXCLUDED.tuesday,
    wednesday        = EXCLUDED.wednesday,
    thursday         = EXCLUDED.thursday,
    friday           = EXCLUDED.friday,
    start_time       = EXCLUDED.start_time,
    end_time         = EXCLUDED.end_time,
    time_windows     = EXCLUDED.time_windows,
    timezone         = EXCLUDED.timezone,
    reminder_before  = EXCLUDED.reminder_before,
    is_active        = EXCLUDED.is_active,
    next_pickup_at   = v_next_at,
    updated_at       = NOW()
  RETURNING id INTO v_auth_id;

  RETURN json_build_object('success', true, 'id', v_auth_id, 'next_pickup_at', v_next_at);
END;
$$;

-- ON CONFLICT nécessite une contrainte unique
ALTER TABLE pickup_authorizations
  DROP CONSTRAINT IF EXISTS pickup_auth_parent_child_guardian_unique;
ALTER TABLE pickup_authorizations
  ADD CONSTRAINT pickup_auth_parent_child_guardian_unique
    UNIQUE (parent_id, child_id, guardian_id);

GRANT EXECUTE ON FUNCTION upsert_pickup_authorization(
  UUID,UUID,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,BOOLEAN,JSONB,TIME,TIME,INTEGER,TEXT,BOOLEAN
) TO authenticated;

-- 8. RPC : get_pickup_authorization
-- Lecture du planning pour un guardian/enfant donné (parent ou collecteur).
CREATE OR REPLACE FUNCTION get_pickup_authorization(
  p_child_id    UUID,
  p_guardian_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT pa.id, pa.parent_id, pa.child_id, pa.guardian_id,
         pa.monday, pa.tuesday, pa.wednesday, pa.thursday, pa.friday,
         pa.start_time, pa.end_time, pa.time_windows, pa.timezone,
         pa.reminder_before, pa.is_active, pa.expires_at,
         pa.next_pickup_at, pa.last_reminded_at,
         pa.created_at, pa.updated_at
  INTO v_row
  FROM pickup_authorizations pa
  WHERE pa.child_id = p_child_id
    AND pa.guardian_id = p_guardian_id
    AND (
      -- Parent qui possède l'enfant
      pa.parent_id = auth.uid()
      OR
      -- Collecteur lié au guardian
      EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.id = p_guardian_id AND g.collector_user_id = auth.uid()
      )
    );

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Autorisation introuvable.');
  END IF;

  RETURN json_build_object(
    'success', true,
    'data', row_to_json(v_row)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_pickup_authorization(UUID, UUID) TO authenticated;
