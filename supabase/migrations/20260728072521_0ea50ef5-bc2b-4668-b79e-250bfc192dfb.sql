
-- 1) branches table
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_select_authenticated"
  ON public.branches FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "branches_superadmin_all"
  ON public.branches FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'superadmin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');

CREATE TRIGGER branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Default branch + backfill
INSERT INTO public.branches (name, code)
VALUES ('Chi nhánh chính', 'main');

-- 3) Add branch_id columns
ALTER TABLE public.profiles       ADD COLUMN branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.contact_leads  ADD COLUMN branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.chat_sessions  ADD COLUMN branch_id uuid REFERENCES public.branches(id);
ALTER TABLE public.internal_chats ADD COLUMN branch_id uuid REFERENCES public.branches(id);

UPDATE public.profiles       SET branch_id = (SELECT id FROM public.branches WHERE code='main');
UPDATE public.contact_leads  SET branch_id = (SELECT id FROM public.branches WHERE code='main');
UPDATE public.chat_sessions  SET branch_id = (SELECT id FROM public.branches WHERE code='main');
UPDATE public.internal_chats SET branch_id = (SELECT id FROM public.branches WHERE code='main');

CREATE INDEX profiles_branch_idx       ON public.profiles(branch_id);
CREATE INDEX contact_leads_branch_idx  ON public.contact_leads(branch_id);
CREATE INDEX chat_sessions_branch_idx  ON public.chat_sessions(branch_id);
CREATE INDEX internal_chats_branch_idx ON public.internal_chats(branch_id);

-- 4) Helper: get user's branch
CREATE OR REPLACE FUNCTION public.get_user_branch_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- 5) Extra profile SELECT so same-branch staff can find each other (for internal chat)
CREATE POLICY "same_branch_staff_profiles_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin','staff','teacher')
    AND role IN ('superadmin','admin','staff','teacher')
    AND branch_id = public.get_user_branch_id(auth.uid())
  );

-- 6) Branch isolation for contact_leads (non-superadmin must match branch)
DROP POLICY IF EXISTS staff_leads_select ON public.contact_leads;
DROP POLICY IF EXISTS staff_leads_update ON public.contact_leads;

CREATE POLICY "staff_leads_select" ON public.contact_leads FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('staff','admin','superadmin')
    AND (
      public.get_user_role(auth.uid()) = 'superadmin'
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  );

CREATE POLICY "staff_leads_update" ON public.contact_leads FOR UPDATE TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('staff','admin','superadmin')
    AND (
      public.get_user_role(auth.uid()) = 'superadmin'
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('staff','admin','superadmin')
    AND (
      public.get_user_role(auth.uid()) = 'superadmin'
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  );

-- 7) Branch isolation for chat_sessions
DROP POLICY IF EXISTS staff_chat_sessions_all ON public.chat_sessions;
CREATE POLICY "staff_chat_sessions_all" ON public.chat_sessions FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('staff','admin','superadmin')
    AND (
      public.get_user_role(auth.uid()) = 'superadmin'
      OR branch_id IS NULL
      OR branch_id = public.get_user_branch_id(auth.uid())
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('staff','admin','superadmin')
  );

-- 8) Internal chats already restricted to participants; branch match enforced via WITH CHECK on insert
DROP POLICY IF EXISTS internal_chats_insert_participant ON public.internal_chats;
CREATE POLICY "internal_chats_insert_participant" ON public.internal_chats FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_a OR auth.uid() = user_b)
    AND public.get_user_role(auth.uid()) IN ('superadmin','admin','teacher','staff')
    AND public.get_user_role(user_a)   IN ('superadmin','admin','teacher','staff')
    AND public.get_user_role(user_b)   IN ('superadmin','admin','teacher','staff')
    AND (
      public.get_user_role(auth.uid()) = 'superadmin'
      OR (
        public.get_user_branch_id(user_a) = public.get_user_branch_id(auth.uid())
        AND public.get_user_branch_id(user_b) = public.get_user_branch_id(auth.uid())
      )
    )
  );
