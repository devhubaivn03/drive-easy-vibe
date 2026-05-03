
-- =================== Client chat (staff <-> student) ===================
CREATE TABLE public.client_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,
  claimed_by UUID,
  status TEXT NOT NULL DEFAULT 'waiting',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.client_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role app_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ccm_chat_id ON public.client_chat_messages(chat_id, created_at);

ALTER TABLE public.client_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: can current user access a given client's chat?
CREATE OR REPLACE FUNCTION public.can_access_client_chat(_client_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    auth.uid() = _client_id
    OR get_user_role(auth.uid()) = 'superadmin'
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = _client_id
        AND (
          (get_user_role(auth.uid()) = 'teacher' AND p.teacher_id = auth.uid())
          OR (get_user_role(auth.uid()) = 'admin' AND p.admin_id = auth.uid())
          OR (get_user_role(auth.uid()) = 'staff' AND p.admin_id = get_user_admin_id(auth.uid()))
        )
    );
$$;

-- client_chats policies
CREATE POLICY "client_chats_select" ON public.client_chats FOR SELECT TO authenticated
  USING (public.can_access_client_chat(client_id));
CREATE POLICY "client_chats_insert" ON public.client_chats FOR INSERT TO authenticated
  WITH CHECK (public.can_access_client_chat(client_id));
CREATE POLICY "client_chats_update" ON public.client_chats FOR UPDATE TO authenticated
  USING (public.can_access_client_chat(client_id))
  WITH CHECK (public.can_access_client_chat(client_id));

-- client_chat_messages policies
CREATE POLICY "ccm_select" ON public.client_chat_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.client_chats c WHERE c.id = chat_id AND public.can_access_client_chat(c.client_id)));
CREATE POLICY "ccm_insert" ON public.client_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.client_chats c WHERE c.id = chat_id AND public.can_access_client_chat(c.client_id))
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_chat_messages;

-- Update last_message_at + notify recipient on each new message
CREATE OR REPLACE FUNCTION public.on_client_chat_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_client_id uuid;
  v_claimed_by uuid;
BEGIN
  UPDATE public.client_chats
    SET last_message_at = now(),
        status = CASE WHEN status = 'closed' THEN 'active' ELSE status END
    WHERE id = NEW.chat_id
    RETURNING client_id, claimed_by INTO v_client_id, v_claimed_by;

  -- Notify client when staff/teacher/admin sends
  IF NEW.sender_role <> 'client' AND v_client_id IS NOT NULL AND v_client_id <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_client_id, 'Bạn có tin nhắn mới từ trung tâm');
  END IF;

  -- Notify the assigned staff/teacher when client sends
  IF NEW.sender_role = 'client' AND v_claimed_by IS NOT NULL AND v_claimed_by <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_claimed_by, 'Học viên vừa gửi tin nhắn mới');
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_ccm_after_insert
AFTER INSERT ON public.client_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.on_client_chat_message_insert();

-- =================== Notifications on training/exam updates ===================
CREATE OR REPLACE FUNCTION public.notify_training_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND auth.uid() IS DISTINCT FROM NEW.client_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (NEW.client_id, 'Tiến trình học của bạn vừa được cập nhật');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_training_progress_notify
AFTER INSERT OR UPDATE ON public.training_progress
FOR EACH ROW EXECUTE FUNCTION public.notify_training_change();

CREATE OR REPLACE FUNCTION public.notify_exam_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_id IS NOT NULL AND auth.uid() IS DISTINCT FROM NEW.client_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (NEW.client_id, 'Điểm thi của bạn vừa được cập nhật');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_exam_results_notify
AFTER INSERT OR UPDATE ON public.exam_results
FOR EACH ROW EXECUTE FUNCTION public.notify_exam_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
