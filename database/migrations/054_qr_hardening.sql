-- Follow-up hardening after 053, none of it changing behaviour.
--
-- 1. The remaining QR functions are SECURITY DEFINER without a fixed
--    search_path, the property that made 053 necessary to add. ALTER FUNCTION
--    sets it without touching a single line of their bodies.
-- 2. They are also still executable by anon through the default PUBLIC grant.
--    Each one checks auth.uid() internally, so anon only ever gets a refusal,
--    but an unauthenticated caller has no business reaching them at all.
-- 3. staff_insert_history let any staff member of any school write a pickup
--    record for any family: the policy checked the role but never the school.
--    Nothing uses it — pickup_history is fed by the SECURITY DEFINER trigger
--    from migration 033, which bypasses RLS — so scoping it to the staff's own
--    school closes a cross-tenant write path with no functional impact.

ALTER FUNCTION public.generate_qr_code(UUID, UUID, UUID, INT)
  SET search_path = public, pg_catalog;
ALTER FUNCTION public.generate_collector_qr_code(UUID, UUID, INT)
  SET search_path = public, pg_catalog;
ALTER FUNCTION public.search_pickup_history(UUID, TEXT, INT)
  SET search_path = public, pg_catalog;

REVOKE ALL ON FUNCTION public.generate_qr_code(UUID, UUID, UUID, INT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_collector_qr_code(UUID, UUID, INT)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.search_pickup_history(UUID, TEXT, INT)
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.generate_qr_code(UUID, UUID, UUID, INT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_collector_qr_code(UUID, UUID, INT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_pickup_history(UUID, TEXT, INT)
  TO authenticated;

DROP POLICY IF EXISTS "staff_insert_history" ON public.pickup_history;
CREATE POLICY "staff_insert_history" ON public.pickup_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.school_memberships membership
      WHERE membership.user_id   = auth.uid()
        AND membership.school_id = pickup_history.school_id
        AND membership.role IN ('staff', 'school_admin')
        AND membership.is_active = TRUE
    )
  );
