
DROP POLICY IF EXISTS "staff_profiles_select" ON public.profiles;

CREATE POLICY "staff_profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'staff'::app_role)
  AND (
    id = auth.uid()
    OR (
      role = 'client'::app_role AND admin_id = get_user_admin_id(auth.uid())
    )
    OR (
      role = 'teacher'::app_role AND admin_id = get_user_admin_id(auth.uid())
    )
  )
);
