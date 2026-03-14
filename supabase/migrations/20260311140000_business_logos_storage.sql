-- Business logos storage bucket and RLS
-- Path structure: {user_id}/{business_id}/businessLogos/logo.{ext}
-- Users can only read/write objects under their own user-id folder.
-- File size (1MB) and image types are validated in the app.

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can only access objects under their own folder (storage.foldername(name))[1] = auth.uid()
CREATE POLICY "Users can view own business logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can upload own business logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can update own business logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users can delete own business logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);
