-- Verified against the deployed project: check_email_exists answered true or
-- false for any address when called with the anon key, which is public by
-- design since it ships inside the mobile bundle. Fifteen consecutive probes
-- completed in two seconds with no rate limit, giving anyone an enumeration
-- oracle over the whole user base of an application holding children's data.
--
-- The client no longer calls it. Sign-up now relies on Supabase's own silent
-- duplicate handling, which is exactly the anti-enumeration behaviour this
-- function had been added to defeat.

REVOKE ALL ON FUNCTION public.check_email_exists(TEXT) FROM PUBLIC, anon, authenticated;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc routine
    JOIN pg_catalog.pg_namespace namespace ON namespace.oid = routine.pronamespace
    WHERE namespace.nspname = 'public'
      AND routine.proname = 'check_email_exists'
      AND pg_catalog.has_function_privilege('anon', routine.oid, 'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'check_email_exists is still executable by anon';
  END IF;
END;
$migration$;
