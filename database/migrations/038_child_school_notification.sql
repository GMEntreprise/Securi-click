-- ============================================================
-- MIGRATION 038 — Notify school admin when child is enrolled
--
-- Fires after INSERT on children when school_id is set.
-- Uses insert_notification (idempotent via idempotency_key).
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_school_on_child_enrolled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  IF NEW.school_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT admin_user_id INTO v_admin_user_id
  FROM public.schools
  WHERE id = NEW.school_id;

  IF v_admin_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM public.insert_notification(
    p_user_id         := v_admin_user_id,
    p_role            := 'school_admin',
    p_type            := 'child_enrolled',
    p_title           := 'Nouvel élève inscrit',
    p_body            := NEW.first_name || ' ' || NEW.last_name || ' a rejoint votre établissement.',
    p_metadata        := jsonb_build_object('child_id', NEW.id, 'school_id', NEW.school_id, 'parent_id', NEW.parent_id),
    p_idempotency_key := 'child_enrolled_' || NEW.id::TEXT
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_school_on_child_enrolled ON public.children;
CREATE TRIGGER trg_notify_school_on_child_enrolled
  AFTER INSERT ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_school_on_child_enrolled();
