
-- Allow multiple chat threads per client (per teacher + per staff org)
ALTER TABLE public.client_chats DROP CONSTRAINT IF EXISTS client_chats_client_id_key;

ALTER TABLE public.client_chats
  ADD COLUMN IF NOT EXISTS thread_type text NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS peer_id uuid;

-- Backfill existing rows as staff threads, peer = client's admin_id
UPDATE public.client_chats c
SET thread_type = 'staff',
    peer_id = p.admin_id
FROM public.profiles p
WHERE p.id = c.client_id
  AND c.peer_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_client_chats_thread
  ON public.client_chats(client_id, thread_type, peer_id);

-- New row-aware access helper
CREATE OR REPLACE FUNCTION public.can_access_client_chat_row(
  _client_id uuid, _thread_type text, _peer_id uuid
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    auth.uid() = _client_id
    OR get_user_role(auth.uid()) = 'superadmin'
    OR (
      _thread_type = 'teacher'
      AND get_user_role(auth.uid()) = 'teacher'
      AND auth.uid() = _peer_id
    )
    OR (
      _thread_type = 'staff'
      AND (
        (get_user_role(auth.uid()) = 'admin' AND _peer_id = auth.uid())
        OR (get_user_role(auth.uid()) = 'staff' AND _peer_id = get_user_admin_id(auth.uid()))
      )
    );
$$;

-- Replace policies on client_chats
DROP POLICY IF EXISTS "client_chats_select" ON public.client_chats;
DROP POLICY IF EXISTS "client_chats_insert" ON public.client_chats;
DROP POLICY IF EXISTS "client_chats_update" ON public.client_chats;

CREATE POLICY "client_chats_select" ON public.client_chats FOR SELECT TO authenticated
  USING (public.can_access_client_chat_row(client_id, thread_type, peer_id));
CREATE POLICY "client_chats_insert" ON public.client_chats FOR INSERT TO authenticated
  WITH CHECK (public.can_access_client_chat_row(client_id, thread_type, peer_id));
CREATE POLICY "client_chats_update" ON public.client_chats FOR UPDATE TO authenticated
  USING (public.can_access_client_chat_row(client_id, thread_type, peer_id))
  WITH CHECK (public.can_access_client_chat_row(client_id, thread_type, peer_id));

-- Replace policies on client_chat_messages
DROP POLICY IF EXISTS "ccm_select" ON public.client_chat_messages;
DROP POLICY IF EXISTS "ccm_insert" ON public.client_chat_messages;

CREATE POLICY "ccm_select" ON public.client_chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.client_chats c
    WHERE c.id = chat_id
      AND public.can_access_client_chat_row(c.client_id, c.thread_type, c.peer_id)
  ));
CREATE POLICY "ccm_insert" ON public.client_chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.client_chats c
      WHERE c.id = chat_id
        AND public.can_access_client_chat_row(c.client_id, c.thread_type, c.peer_id)
    )
  );

-- Old helper no longer used by policies
DROP FUNCTION IF EXISTS public.can_access_client_chat(uuid);
