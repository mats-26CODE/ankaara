-- business_settings.create permission + owner-scoped business creation for privileged staff.

UPDATE public.staff_categories
SET permissions = jsonb_set(
  permissions,
  '{business_settings,create}',
  'false'::jsonb,
  true
)
WHERE business_id IS NULL
  AND slug IN ('salesperson', 'accountant');

UPDATE public.staff_categories
SET permissions = jsonb_set(
  permissions,
  '{business_settings,create}',
  'true'::jsonb,
  true
)
WHERE business_id IS NULL
  AND slug = 'manager';

CREATE OR REPLACE FUNCTION public.create_business_for_account(
  p_context_business_id uuid,
  p_name text,
  p_currency text,
  p_address text DEFAULT NULL,
  p_tax_number text DEFAULT NULL,
  p_capacity text DEFAULT NULL,
  p_logo_url text DEFAULT NULL,
  p_logo_text text DEFAULT NULL,
  p_brand_color text DEFAULT NULL,
  p_is_primary boolean DEFAULT false
)
RETURNS public.businesses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner_id uuid;
  v_row public.businesses;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_context_business_id IS NOT NULL THEN
    SELECT b.owner_id INTO v_owner_id
    FROM public.businesses b
    WHERE b.id = p_context_business_id;

    IF v_owner_id IS NULL THEN
      RAISE EXCEPTION 'Business not found';
    END IF;

    IF auth.uid() = v_owner_id THEN
      NULL;
    ELSIF NOT public.staff_can(p_context_business_id, 'business_settings', 'create') THEN
      RAISE EXCEPTION 'Permission denied';
    END IF;
  ELSE
    v_owner_id := auth.uid();
  END IF;

  PERFORM public.check_plan_limit(v_owner_id, 'businesses_count', NULL);

  INSERT INTO public.businesses (
    owner_id,
    name,
    currency,
    address,
    tax_number,
    capacity,
    logo_url,
    logo_text,
    brand_color,
    is_primary
  )
  VALUES (
    v_owner_id,
    NULLIF(BTRIM(p_name), ''),
    COALESCE(NULLIF(BTRIM(p_currency), ''), 'TZS'),
    NULLIF(BTRIM(p_address), ''),
    NULLIF(BTRIM(p_tax_number), ''),
    NULLIF(BTRIM(p_capacity), ''),
    NULLIF(BTRIM(p_logo_url), ''),
    NULLIF(BTRIM(p_logo_text), ''),
    NULLIF(BTRIM(p_brand_color), ''),
    COALESCE(p_is_primary, false)
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_business_for_account(uuid, text, text, text, text, text, text, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_business_for_account(uuid, text, text, text, text, text, text, text, text, boolean) TO authenticated;

COMMENT ON FUNCTION public.create_business_for_account IS
  'Creates a business owned by the account owner. Staff with business_settings.create on the context business may add businesses for that owner.';
