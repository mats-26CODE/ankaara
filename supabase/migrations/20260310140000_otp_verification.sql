-- OTP verification table for phone verification (e.g. onboarding after Google sign-up)
-- Used by send-otp and verify-otp edge functions

CREATE TABLE IF NOT EXISTS public.otp_verification (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_verification_user_phone ON public.otp_verification(user_id, phone);
CREATE INDEX idx_otp_verification_expires ON public.otp_verification(expires_at);

ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own OTP"
  ON public.otp_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own OTP"
  ON public.otp_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP (for marking used)"
  ON public.otp_verification FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.otp_verification IS 'OTP codes sent for phone verification (e.g. post-Google sign-up)';
