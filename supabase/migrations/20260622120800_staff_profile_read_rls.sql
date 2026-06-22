-- Owners and staff managers can read profiles of team members on their businesses.

CREATE POLICY "Business team can view member profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_staff bs
      WHERE bs.user_id = profiles.id
        AND bs.status IN ('pending', 'active', 'suspended')
        AND (
          public.is_business_owner(bs.business_id)
          OR public.staff_can(bs.business_id, 'staff_management', 'view')
        )
    )
  );
