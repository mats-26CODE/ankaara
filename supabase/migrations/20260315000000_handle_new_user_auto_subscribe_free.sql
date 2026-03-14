-- Update handle_new_user to create a default business and free subscription for every new user.
-- Requires subscription_plans to exist with slug 'free'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  stat_id uuid;
  stat_total_users integer;
  business_id_var uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.statistics) THEN
    INSERT INTO public.statistics DEFAULT VALUES;
  END IF;

  IF NEW.raw_app_meta_data->>'provider' = 'phone' THEN
    INSERT INTO public.profiles(id, phone_number, auth_type)
    VALUES (NEW.id, NEW.phone, 'Phone');

    SELECT id, total_users INTO stat_id, stat_total_users
    FROM public.statistics
    ORDER BY created_at
    LIMIT 1;

    IF stat_total_users >= 0 THEN
      UPDATE public.statistics
      SET total_users = stat_total_users + 1
      WHERE id = stat_id;
    END IF;

  ELSIF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    INSERT INTO public.profiles(id, email, image_url, auth_type)
    VALUES (NEW.id, NEW.email,
            jsonb_build_object('id', 'google_avatar', 'imageUrl', NEW.raw_user_meta_data->>'avatar_url'),
            'Google');

    SELECT id, total_users INTO stat_id, stat_total_users
    FROM public.statistics
    ORDER BY created_at
    LIMIT 1;

    IF stat_total_users >= 0 THEN
      UPDATE public.statistics
      SET total_users = stat_total_users + 1
      WHERE id = stat_id;
    END IF;
  END IF;

  -- Create default business and free subscription only when we created a profile (phone or google)
  IF NEW.raw_app_meta_data->>'provider' IN ('phone', 'google') THEN
    INSERT INTO public.businesses (owner_id, name, currency)
    VALUES (NEW.id, 'My Business', 'TZS')
    RETURNING id INTO business_id_var;

    INSERT INTO public.subscriptions (business_id, plan, subscription_plan_id, status)
    SELECT business_id_var, 'free', sp.id, 'active'
    FROM public.subscription_plans sp
    WHERE sp.slug = 'free'
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$function$;
