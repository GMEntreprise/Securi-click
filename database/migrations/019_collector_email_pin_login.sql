-- Migration 019: Helper RPC for bcrypt PIN verification
-- Used by the collector-login Edge Function which cannot call crypt() directly
-- from Deno. The Edge Function delegates the bcrypt comparison to this RPC.
-- SECURITY DEFINER so it runs with elevated privileges regardless of caller.

CREATE OR REPLACE FUNCTION public.verify_pin_bcrypt(
  p_pin  TEXT,
  p_hash TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN crypt(p_pin, p_hash) = p_hash;
END;
$$;

-- Revoke public execute — only service_role (Edge Function) should call this
REVOKE EXECUTE ON FUNCTION public.verify_pin_bcrypt(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.verify_pin_bcrypt(TEXT, TEXT) TO service_role;
