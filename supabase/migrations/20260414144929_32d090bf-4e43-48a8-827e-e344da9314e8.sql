
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public landing page)
CREATE POLICY "public_site_content_select" ON public.site_content
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only superadmin can modify
CREATE POLICY "superadmin_site_content_all" ON public.site_content
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (get_user_role(auth.uid()) = 'superadmin');

-- Seed default content
INSERT INTO public.site_content (key, value) VALUES
  ('hero_title_1', '"Dễ Dàng"'::jsonb),
  ('hero_title_2', '"Tự Tin"'::jsonb),
  ('hero_subtitle', '"Trung tâm đào tạo lái xe uy tín hàng đầu Việt Nam. Cam kết đậu 100% với phương pháp giảng dạy hiện đại."'::jsonb),
  ('brand_name', '"DriveMaster"'::jsonb),
  ('stats', '[{"icon":"Users","value":"10,000+","label":"Học viên"},{"icon":"GraduationCap","value":"98%","label":"Tỷ lệ đậu"},{"icon":"Clock","value":"10+","label":"Năm kinh nghiệm"},{"icon":"Award","value":"50+","label":"Giáo viên"}]'::jsonb),
  ('motorbike_info', '{"title":"Bằng lái Xe Máy","items":[{"type":"A1","desc":"Xe máy dưới 175cc","duration":"1–2 tháng","fee":"500.000đ"},{"type":"A2","desc":"Xe máy trên 175cc","duration":"2–3 tháng","fee":"800.000đ"}]}'::jsonb),
  ('car_info', '{"title":"Bằng lái Ô Tô","items":[{"type":"B1","desc":"Ô tô dưới 9 chỗ (không hành nghề)","duration":"3–4 tháng","fee":"6.000.000đ"},{"type":"B2","desc":"Ô tô dưới 9 chỗ (hành nghề)","duration":"4–6 tháng","fee":"8.000.000đ"},{"type":"C","desc":"Xe tải trên 3.5 tấn","duration":"6–8 tháng","fee":"10.000.000đ"}]}'::jsonb);
