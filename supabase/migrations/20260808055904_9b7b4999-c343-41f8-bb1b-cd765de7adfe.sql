-- Cho phép các vai trò nội bộ (admin/teacher/staff) xem tài khoản nội bộ ở mọi chi nhánh để chat liên chi nhánh
CREATE POLICY cross_branch_internal_profiles_select ON public.profiles
FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role,'staff'::app_role,'teacher'::app_role])
  AND role = ANY (ARRAY['superadmin'::app_role,'admin'::app_role,'staff'::app_role,'teacher'::app_role])
  AND deleted_at IS NULL
);

-- Cho phép tạo cuộc chat nội bộ giữa các chi nhánh khác nhau
DROP POLICY IF EXISTS internal_chats_insert_participant ON public.internal_chats;
CREATE POLICY internal_chats_insert_participant ON public.internal_chats
FOR INSERT TO authenticated
WITH CHECK (
  ((auth.uid() = user_a) OR (auth.uid() = user_b))
  AND get_user_role(auth.uid()) = ANY (ARRAY['superadmin'::app_role,'admin'::app_role,'teacher'::app_role,'staff'::app_role])
  AND get_user_role(user_a) = ANY (ARRAY['superadmin'::app_role,'admin'::app_role,'teacher'::app_role,'staff'::app_role])
  AND get_user_role(user_b) = ANY (ARRAY['superadmin'::app_role,'admin'::app_role,'teacher'::app_role,'staff'::app_role])
);