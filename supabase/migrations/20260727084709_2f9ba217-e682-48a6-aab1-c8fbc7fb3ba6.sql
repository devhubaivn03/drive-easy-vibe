
-- 1) Soft delete columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_reason text,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id);

-- 2) Internal chats between staff-level users
CREATE TABLE IF NOT EXISTS public.internal_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_read_a timestamptz,
  last_read_b timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT internal_chats_user_order CHECK (user_a < user_b),
  CONSTRAINT internal_chats_unique_pair UNIQUE (user_a, user_b)
);

GRANT SELECT, INSERT, UPDATE ON public.internal_chats TO authenticated;
GRANT ALL ON public.internal_chats TO service_role;
ALTER TABLE public.internal_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_chats_select_participant"
  ON public.internal_chats FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "internal_chats_insert_participant"
  ON public.internal_chats FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_a OR auth.uid() = user_b)
    AND public.get_user_role(auth.uid()) IN ('superadmin','admin','teacher','staff')
    AND public.get_user_role(user_a) IN ('superadmin','admin','teacher','staff')
    AND public.get_user_role(user_b) IN ('superadmin','admin','teacher','staff')
  );

CREATE POLICY "internal_chats_update_participant"
  ON public.internal_chats FOR UPDATE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- 3) Messages
CREATE TABLE IF NOT EXISTS public.internal_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.internal_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  attachment_url text,
  attachment_type text,
  attachment_name text,
  recalled_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_chat_messages_chat_created
  ON public.internal_chat_messages(chat_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.internal_chat_messages TO authenticated;
GRANT ALL ON public.internal_chat_messages TO service_role;
ALTER TABLE public.internal_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_msg_select_participant"
  ON public.internal_chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.internal_chats c
    WHERE c.id = chat_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  ));

CREATE POLICY "internal_msg_insert_sender"
  ON public.internal_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.internal_chats c
      WHERE c.id = chat_id AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

CREATE POLICY "internal_msg_update_own"
  ON public.internal_chat_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 4) Trigger to bump last_message_at
CREATE OR REPLACE FUNCTION public.on_internal_chat_message_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.internal_chats SET last_message_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_internal_chat_message_insert ON public.internal_chat_messages;
CREATE TRIGGER trg_internal_chat_message_insert
  AFTER INSERT ON public.internal_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.on_internal_chat_message_insert();

-- 5) Realtime
ALTER TABLE public.internal_chats REPLICA IDENTITY FULL;
ALTER TABLE public.internal_chat_messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_chats;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
