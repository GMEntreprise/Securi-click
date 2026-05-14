-- ============================================================
-- MIGRATION 014 — NOTIFICATIONS SYSTEM
-- ============================================================

-- 1. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             VARCHAR(20) NOT NULL CHECK (role IN ('parent','collector','school_admin','staff','super_admin')),
  type             VARCHAR(50) NOT NULL,
  title            TEXT        NOT NULL,
  body             TEXT        NOT NULL,
  metadata         JSONB       NOT NULL DEFAULT '{}',
  is_read          BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at          TIMESTAMPTZ,
  delivery_state   VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (delivery_state IN ('pending','delivered','failed')),
  push_sent_at     TIMESTAMPTZ,
  idempotency_key  TEXT        UNIQUE,
  source_role      VARCHAR(20),
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PUSH TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  platform   VARCHAR(10) NOT NULL CHECK (platform IN ('ios','android','web')),
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type       ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id      ON public.push_tokens(user_id) WHERE is_active = TRUE;

-- 4. RLS — NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users read only their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update only their own (mark read)
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert allowed only via service_role (triggered server-side) or authenticated
-- (for client-side insert guards) — we use idempotency_key for dedup
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON public.notifications;
CREATE POLICY "notifications_insert_authenticated" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. RLS — PUSH TOKENS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_select_own" ON public.push_tokens;
CREATE POLICY "push_tokens_select_own" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_insert_own" ON public.push_tokens;
CREATE POLICY "push_tokens_insert_own" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_update_own" ON public.push_tokens;
CREATE POLICY "push_tokens_update_own" ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_tokens_delete_own" ON public.push_tokens;
CREATE POLICY "push_tokens_delete_own" ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- 6. ENABLE REALTIME for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 7. RPC: insert_notification (idempotent, deduped)
CREATE OR REPLACE FUNCTION public.insert_notification(
  p_user_id         UUID,
  p_role            TEXT,
  p_type            TEXT,
  p_title           TEXT,
  p_body            TEXT,
  p_metadata        JSONB    DEFAULT '{}',
  p_idempotency_key TEXT     DEFAULT NULL,
  p_source_role     TEXT     DEFAULT NULL,
  p_expires_at      TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications
    (user_id, role, type, title, body, metadata, idempotency_key, source_role, expires_at)
  VALUES
    (p_user_id, p_role, p_type, p_title, p_body, p_metadata, p_idempotency_key, p_source_role, p_expires_at)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_notification TO authenticated;

-- 8. RPC: mark_notifications_read (batch)
CREATE OR REPLACE FUNCTION public.mark_notifications_read(
  p_notification_ids UUID[]
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE id = ANY(p_notification_ids)
    AND user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notifications_read TO authenticated;

-- 9. RPC: mark_all_notifications_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;

-- 10. RPC: upsert_push_token
CREATE OR REPLACE FUNCTION public.upsert_push_token(
  p_token    TEXT,
  p_platform TEXT
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.push_tokens (user_id, token, platform, is_active, updated_at)
  VALUES (auth.uid(), p_token, p_platform, TRUE, NOW())
  ON CONFLICT (user_id, token)
  DO UPDATE SET is_active = TRUE, platform = p_platform, updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_push_token TO authenticated;
