
-- 1. Bảng ngân hàng câu hỏi
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  answer_1 TEXT NOT NULL,
  answer_2 TEXT NOT NULL,
  answer_3 TEXT,
  answer_4 TEXT,
  image_url TEXT,
  correct_answer INT NOT NULL CHECK (correct_answer BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_questions_select" ON public.questions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "superadmin_questions_all" ON public.questions
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'superadmin'::app_role)
  WITH CHECK (get_user_role(auth.uid()) = 'superadmin'::app_role);

-- 2. Bảng mã đề thi
CREATE TABLE public.exam_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_exam_sets_select" ON public.exam_sets
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "superadmin_exam_sets_all" ON public.exam_sets
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'superadmin'::app_role)
  WITH CHECK (get_user_role(auth.uid()) = 'superadmin'::app_role);

-- 3. Bảng câu hỏi trong mã đề
CREATE TABLE public.exam_set_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_set_id UUID NOT NULL REFERENCES public.exam_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_1 TEXT NOT NULL,
  answer_2 TEXT NOT NULL,
  answer_3 TEXT,
  answer_4 TEXT,
  image_url TEXT,
  correct_answer INT NOT NULL CHECK (correct_answer BETWEEN 1 AND 4),
  order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_exam_set_questions_set ON public.exam_set_questions(exam_set_id, order_index);

ALTER TABLE public.exam_set_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_exam_set_questions_select" ON public.exam_set_questions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "superadmin_exam_set_questions_all" ON public.exam_set_questions
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'superadmin'::app_role)
  WITH CHECK (get_user_role(auth.uid()) = 'superadmin'::app_role);

-- 4. Bảng lịch sử thi
CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  exam_set_id UUID NOT NULL REFERENCES public.exam_sets(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_attempts_client ON public.exam_attempts(client_id, submitted_at DESC);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_exam_attempts_select_own" ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "client_exam_attempts_insert_own" ON public.exam_attempts
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "admin_exam_attempts_select_all" ON public.exam_attempts
  FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::app_role, 'superadmin'::app_role, 'staff'::app_role]));

-- 5. Storage bucket cho ảnh câu hỏi (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_question_images_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'question-images');

CREATE POLICY "superadmin_question_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'question-images' AND get_user_role(auth.uid()) = 'superadmin'::app_role);

CREATE POLICY "superadmin_question_images_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'question-images' AND get_user_role(auth.uid()) = 'superadmin'::app_role);

CREATE POLICY "superadmin_question_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'question-images' AND get_user_role(auth.uid()) = 'superadmin'::app_role);
