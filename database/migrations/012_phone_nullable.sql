-- Migration 012: Make guardians.phone nullable (phone is now optional)

ALTER TABLE public.guardians
  ALTER COLUMN phone DROP NOT NULL;
