
CREATE POLICY "teacher_exam_attempts_select" ON public.exam_attempts FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'teacher'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = exam_attempts.client_id AND p.teacher_id = auth.uid())
);
