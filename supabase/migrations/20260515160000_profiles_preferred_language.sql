-- App / SMS language (default Swahili). Synced from UI; used by send-sale-sms-alert.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'sw';

UPDATE public.profiles
SET preferred_language = 'sw'
WHERE preferred_language IS NULL OR trim(preferred_language) = '' OR preferred_language NOT IN ('sw', 'en');

ALTER TABLE public.profiles ALTER COLUMN preferred_language SET DEFAULT 'sw';
ALTER TABLE public.profiles ALTER COLUMN preferred_language SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_preferred_language_check CHECK (preferred_language IN ('sw', 'en'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.preferred_language IS 'UI language (sw|en); default Swahili.';
