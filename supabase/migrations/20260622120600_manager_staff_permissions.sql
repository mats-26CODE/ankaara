-- Manager category: staff list + manage; block direct business INSERT for active staff.

UPDATE public.staff_categories
SET permissions = jsonb_set(
  jsonb_set(
    permissions,
    '{staff_management,view}',
    'true'::jsonb,
    true
  ),
  '{staff_management,manage}',
  'true'::jsonb,
  true
)
WHERE business_id IS NULL
  AND slug = 'manager';

-- Ensure non-manager system categories cannot create businesses.
UPDATE public.staff_categories
SET permissions = jsonb_set(
  permissions,
  '{business_settings,create}',
  'false'::jsonb,
  true
)
WHERE business_id IS NULL
  AND slug IN ('salesperson', 'accountant');

DROP POLICY IF EXISTS "Owners can insert businesses" ON public.businesses;

CREATE POLICY "Owners can insert businesses"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.business_staff bs
      WHERE bs.user_id = auth.uid()
        AND bs.status IN ('pending', 'active')
    )
  );
