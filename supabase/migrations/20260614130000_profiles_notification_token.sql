-- Store Expo push token for users who opt in to mobile notifications.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_token text;

COMMENT ON COLUMN public.profiles.notification_token IS
  'Expo push token (ExponentPushToken[...]) for mobile push notifications; NULL when disabled or not registered.';
