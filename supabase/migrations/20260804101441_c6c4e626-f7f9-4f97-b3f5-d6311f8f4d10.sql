-- Notify peer on new internal chat message
CREATE OR REPLACE FUNCTION public.on_internal_chat_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_a uuid;
  v_b uuid;
  v_peer uuid;
  v_sender_name text;
BEGIN
  UPDATE public.internal_chats
    SET last_message_at = now()
    WHERE id = NEW.chat_id
    RETURNING user_a, user_b INTO v_a, v_b;

  v_peer := CASE WHEN v_a = NEW.sender_id THEN v_b ELSE v_a END;

  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

  IF v_peer IS NOT NULL AND v_peer <> NEW.sender_id THEN
    INSERT INTO public.notifications(user_id, message)
    VALUES (v_peer, 'Tin nhắn nội bộ mới từ ' || COALESCE(v_sender_name, 'đồng nghiệp'));
  END IF;

  RETURN NEW;
END $function$;

-- Storage policies for site-images bucket
DROP POLICY IF EXISTS "site_images_public_read" ON storage.objects;
CREATE POLICY "site_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-images');

DROP POLICY IF EXISTS "site_images_superadmin_write" ON storage.objects;
CREATE POLICY "site_images_superadmin_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.get_user_role(auth.uid()) = 'superadmin');

DROP POLICY IF EXISTS "site_images_superadmin_delete" ON storage.objects;
CREATE POLICY "site_images_superadmin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.get_user_role(auth.uid()) = 'superadmin');