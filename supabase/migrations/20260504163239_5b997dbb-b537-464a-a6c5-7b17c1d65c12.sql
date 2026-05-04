
ALTER TABLE public.client_chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

ALTER TABLE public.client_chats
  ADD COLUMN IF NOT EXISTS last_client_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_peer_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_peer_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_client_read_at timestamptz;

CREATE OR REPLACE FUNCTION public.on_client_chat_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_id uuid;
  v_claimed_by uuid;
BEGIN
  IF NEW.sender_role = 'client' THEN
    UPDATE public.client_chats
      SET last_message_at = now(),
          last_client_message_at = now(),
          status = CASE WHEN status = 'closed' THEN 'active' ELSE status END
      WHERE id = NEW.chat_id
      RETURNING client_id, claimed_by INTO v_client_id, v_claimed_by;
  ELSE
    UPDATE public.client_chats
      SET last_message_at = now(),
          last_peer_message_at = now(),
          status = CASE WHEN status = 'closed' THEN 'active' ELSE status END
      WHERE id = NEW.chat_id
      RETURNING client_id, claimed_by INTO v_client_id, v_claimed_by;
  END IF;

  IF NEW.sender_role <> 'client' AND v_client_id IS NOT NULL AND v_client_id <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_client_id, 'Bạn có tin nhắn mới từ trung tâm');
  END IF;

  IF NEW.sender_role = 'client' AND v_claimed_by IS NOT NULL AND v_claimed_by <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_claimed_by, 'Học viên vừa gửi tin nhắn mới');
  END IF;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_ccm_after_insert ON public.client_chat_messages;
CREATE TRIGGER trg_ccm_after_insert
AFTER INSERT ON public.client_chat_messages
FOR EACH ROW EXECUTE FUNCTION public.on_client_chat_message_insert();

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_attachments_public_read" ON storage.objects;
CREATE POLICY "chat_attachments_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "chat_attachments_auth_insert" ON storage.objects;
CREATE POLICY "chat_attachments_auth_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "chat_attachments_auth_update" ON storage.objects;
CREATE POLICY "chat_attachments_auth_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "chat_attachments_auth_delete" ON storage.objects;
CREATE POLICY "chat_attachments_auth_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments');
