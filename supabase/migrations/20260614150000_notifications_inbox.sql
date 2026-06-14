-- In-app notification inbox (push copies + read receipts).

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses (id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  deep_link text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.notifications IS 'User notification inbox; rows inserted by send-push-notification edge function.';
COMMENT ON COLUMN public.notifications.read_at IS 'When the user opened/read the notification in the app.';
