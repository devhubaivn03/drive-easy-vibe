
-- Create enums
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'teacher', 'staff', 'client');
CREATE TYPE public.license_type AS ENUM ('A1', 'A2', 'B1', 'B2', 'C', 'D', 'E', 'F');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'converted');
CREATE TYPE public.chat_status AS ENUM ('waiting', 'active', 'closed');
CREATE TYPE public.chat_sender_type AS ENUM ('visitor', 'staff');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role public.app_role NOT NULL DEFAULT 'client',
  license_type public.license_type,
  created_by UUID REFERENCES public.profiles(id),
  admin_id UUID REFERENCES public.profiles(id),
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contact_leads table
CREATE TABLE public.contact_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  content TEXT,
  status public.lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT,
  visitor_token UUID NOT NULL,
  status public.chat_status NOT NULL DEFAULT 'waiting',
  claimed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type public.chat_sender_type NOT NULL,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create training_progress table
CREATE TABLE public.training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  theory_score INT CHECK (theory_score >= 0 AND theory_score <= 100),
  simulation_score INT CHECK (simulation_score >= 0 AND simulation_score <= 100),
  road_test_score INT CHECK (road_test_score >= 0 AND road_test_score <= 100),
  track_test_score INT CHECK (track_test_score >= 0 AND track_test_score <= 100),
  schedule_milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_progress_updated_at BEFORE UPDATE ON public.training_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to get user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Security definer function to get user admin_id
CREATE OR REPLACE FUNCTION public.get_user_admin_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES RLS =====
-- Superadmin sees all
CREATE POLICY "superadmin_profiles_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

-- Admin sees self + users where admin_id = self
CREATE POLICY "admin_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    AND (id = auth.uid() OR admin_id = auth.uid())
  );

CREATE POLICY "admin_profiles_modify" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
    AND admin_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
    AND admin_id = auth.uid()
  );

-- Staff sees self + all clients in same admin scope
CREATE POLICY "staff_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'staff'
    AND (
      id = auth.uid()
      OR (role = 'client' AND admin_id = public.get_user_admin_id(auth.uid()))
    )
  );

-- Teacher sees self + assigned clients
CREATE POLICY "teacher_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
    AND (id = auth.uid() OR teacher_id = auth.uid())
  );

-- Client sees only self
CREATE POLICY "client_profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'client'
    AND id = auth.uid()
  );

-- ===== CONTACT LEADS RLS =====
-- Anyone can insert (public form)
CREATE POLICY "public_leads_insert" ON public.contact_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Staff/Admin/Superadmin can view and manage
CREATE POLICY "staff_leads_select" ON public.contact_leads
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('staff', 'admin', 'superadmin')
  );

CREATE POLICY "staff_leads_update" ON public.contact_leads
  FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('staff', 'admin', 'superadmin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('staff', 'admin', 'superadmin'));

-- ===== CHAT SESSIONS RLS =====
-- Anon can insert (visitor creates session)
CREATE POLICY "anon_chat_sessions_insert" ON public.chat_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anon can select own session by visitor_token (handled in app code)
CREATE POLICY "anon_chat_sessions_select" ON public.chat_sessions
  FOR SELECT TO anon
  USING (true);

-- Staff/Admin/Superadmin manage all sessions
CREATE POLICY "staff_chat_sessions_all" ON public.chat_sessions
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('staff', 'admin', 'superadmin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('staff', 'admin', 'superadmin'));

-- ===== CHAT MESSAGES RLS =====
-- Anon can insert messages
CREATE POLICY "anon_chat_messages_insert" ON public.chat_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anon can read messages (filtered by session in app)
CREATE POLICY "anon_chat_messages_select" ON public.chat_messages
  FOR SELECT TO anon
  USING (true);

-- Staff/Admin/Superadmin read all messages
CREATE POLICY "staff_chat_messages_select" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('staff', 'admin', 'superadmin'));

-- ===== TRAINING PROGRESS RLS =====
-- Client sees own progress
CREATE POLICY "client_training_select" ON public.training_progress
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'client'
    AND client_id = auth.uid()
  );

-- Teacher sees/edits assigned students' progress
CREATE POLICY "teacher_training_select" ON public.training_progress
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
  );

CREATE POLICY "teacher_training_update" ON public.training_progress
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'teacher'
    AND teacher_id = auth.uid()
  );

-- Admin/Superadmin/Staff see all in scope
CREATE POLICY "admin_training_select" ON public.training_progress
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'superadmin', 'staff')
  );

CREATE POLICY "superadmin_training_all" ON public.training_progress
  FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

-- ===== NOTIFICATIONS RLS =====
CREATE POLICY "user_notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow system to insert notifications (via service role or security definer)
CREATE POLICY "system_notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for chat and leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_admin_id ON public.profiles(admin_id);
CREATE INDEX idx_profiles_teacher_id ON public.profiles(teacher_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_sessions_visitor_token ON public.chat_sessions(visitor_token);
CREATE INDEX idx_training_progress_client_id ON public.training_progress(client_id);
CREATE INDEX idx_training_progress_teacher_id ON public.training_progress(teacher_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_contact_leads_status ON public.contact_leads(status);
