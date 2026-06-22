-- Allow staff with business_settings.edit to update businesses (logo, name, etc.).
-- Managers get edit permission; owners retain full update access.

UPDATE public.staff_categories
SET permissions = jsonb_set(
  permissions,
  '{business_settings,edit}',
  'true'::jsonb,
  true
)
WHERE business_id IS NULL
  AND slug = 'manager';

DROP POLICY IF EXISTS "Owners can update own businesses" ON public.businesses;

CREATE POLICY "Owners can update own businesses"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR public.staff_can(id, 'business_settings', 'edit')
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR public.staff_can(id, 'business_settings', 'edit')
  );
