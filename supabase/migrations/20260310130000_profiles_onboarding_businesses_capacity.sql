-- Ankara – Profiles: account type & onboarding; Businesses: capacity
-- Run after 20260310120000_ankara_schema.sql (or on existing Supabase project)

-- =============================================================================
-- PROFILES: add account_type and onboarding_completed
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text CHECK (account_type IN ('business', 'individual')),
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.account_type IS 'User chose business or individual during onboarding';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'True after user completes post-signup onboarding (account type + details)';

-- =============================================================================
-- BUSINESSES: add capacity (optional, e.g. team size or scale for onboarding)
-- =============================================================================
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS capacity text;

COMMENT ON COLUMN public.businesses.capacity IS 'Optional: e.g. team size, scale (from onboarding or later)';
