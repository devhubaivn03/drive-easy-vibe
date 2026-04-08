-- Teacher can INSERT training_progress for their students
CREATE POLICY "teacher_training_insert"
ON public.training_progress
FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role(auth.uid()) = 'teacher'::app_role)
  AND (teacher_id = auth.uid())
);

-- Staff can UPDATE client profiles within their admin scope
CREATE POLICY "staff_profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'staff'::app_role)
  AND (role = 'client'::app_role)
  AND (admin_id = get_user_admin_id(auth.uid()))
)
WITH CHECK (
  (get_user_role(auth.uid()) = 'staff'::app_role)
  AND (role = 'client'::app_role)
  AND (admin_id = get_user_admin_id(auth.uid()))
);