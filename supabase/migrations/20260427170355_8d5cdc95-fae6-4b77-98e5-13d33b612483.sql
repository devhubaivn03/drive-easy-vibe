-- Enable realtime for chat tables
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Create exam_results table for graduation/theory/simulation/track/road exam scores
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,
  graduation_passed BOOLEAN,
  theory_score INTEGER,
  simulation_score INTEGER,
  track_score INTEGER,
  road_score INTEGER,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Client can view own results
CREATE POLICY "client_exam_results_select_own"
ON public.exam_results FOR SELECT TO authenticated
USING (client_id = auth.uid());

-- Teacher can view & modify their own students' results
CREATE POLICY "teacher_exam_results_select"
ON public.exam_results FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'teacher'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.teacher_id = auth.uid())
);

CREATE POLICY "teacher_exam_results_insert"
ON public.exam_results FOR INSERT TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'teacher'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.teacher_id = auth.uid())
);

CREATE POLICY "teacher_exam_results_update"
ON public.exam_results FOR UPDATE TO authenticated
USING (
  get_user_role(auth.uid()) = 'teacher'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.teacher_id = auth.uid())
);

-- Staff can view & modify all clients in their admin scope
CREATE POLICY "staff_exam_results_select"
ON public.exam_results FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'staff'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.admin_id = get_user_admin_id(auth.uid()))
);

CREATE POLICY "staff_exam_results_insert"
ON public.exam_results FOR INSERT TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'staff'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.admin_id = get_user_admin_id(auth.uid()))
);

CREATE POLICY "staff_exam_results_update"
ON public.exam_results FOR UPDATE TO authenticated
USING (
  get_user_role(auth.uid()) = 'staff'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.admin_id = get_user_admin_id(auth.uid()))
);

-- Admin can view & modify their clients
CREATE POLICY "admin_exam_results_select"
ON public.exam_results FOR SELECT TO authenticated
USING (
  get_user_role(auth.uid()) = 'admin'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.admin_id = auth.uid())
);

CREATE POLICY "admin_exam_results_insert"
ON public.exam_results FOR INSERT TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'admin'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.admin_id = auth.uid())
);

CREATE POLICY "admin_exam_results_update"
ON public.exam_results FOR UPDATE TO authenticated
USING (
  get_user_role(auth.uid()) = 'admin'::app_role
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = client_id AND p.admin_id = auth.uid())
);

-- Superadmin full access
CREATE POLICY "superadmin_exam_results_all"
ON public.exam_results FOR ALL TO authenticated
USING (get_user_role(auth.uid()) = 'superadmin'::app_role)
WITH CHECK (get_user_role(auth.uid()) = 'superadmin'::app_role);

CREATE TRIGGER update_exam_results_updated_at
BEFORE UPDATE ON public.exam_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();