-- Migration 005: make date_of_birth nullable (app does not collect it)
ALTER TABLE public.children
  ALTER COLUMN date_of_birth DROP NOT NULL;
