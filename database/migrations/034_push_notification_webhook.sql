-- ============================================================
-- MIGRATION 034 — Push notification webhook trigger
--
-- Crée un webhook Supabase via supabase_functions.http_request
-- qui appelle la Edge Function send-push-notification à chaque
-- INSERT dans la table notifications.
--
-- IMPORTANT : remplacer <SERVICE_ROLE_KEY> par la vraie clé
-- avant d'exécuter (Dashboard → Settings → API → service_role)
-- ============================================================

-- Active l'extension pg_net si pas déjà active (requise pour HTTP depuis Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Fonction appelée par le trigger
CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'type',       'INSERT',
    'table',      'notifications',
    'schema',     'public',
    'record',     row_to_json(NEW),
    'old_record', NULL
  );

  PERFORM net.http_post(
    url     := 'https://hpoumgvvzzkubkvyklnx.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body    := v_payload
  );

  RETURN NEW;
END;
$$;

-- Trigger sur INSERT dans notifications
DROP TRIGGER IF EXISTS trg_push_on_notification_insert ON public.notifications;
CREATE TRIGGER trg_push_on_notification_insert
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_insert();
