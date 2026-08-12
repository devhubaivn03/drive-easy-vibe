ALTER TABLE public.site_content ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;

ALTER TABLE public.site_content DROP CONSTRAINT IF EXISTS site_content_key_key;
DROP INDEX IF EXISTS site_content_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS site_content_branch_key_uniq
  ON public.site_content (COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), key);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

DROP POLICY IF EXISTS admin_site_content_select ON public.site_content;
CREATE POLICY admin_site_content_select ON public.site_content
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS admin_branch_site_content_insert ON public.site_content;
CREATE POLICY admin_branch_site_content_insert ON public.site_content
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'admin'::app_role
    AND branch_id IS NOT NULL
    AND branch_id = get_user_branch_id(auth.uid())
  );

DROP POLICY IF EXISTS admin_branch_site_content_update ON public.site_content;
CREATE POLICY admin_branch_site_content_update ON public.site_content
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'::app_role
    AND branch_id IS NOT NULL
    AND branch_id = get_user_branch_id(auth.uid())
  )
  WITH CHECK (
    get_user_role(auth.uid()) = 'admin'::app_role
    AND branch_id IS NOT NULL
    AND branch_id = get_user_branch_id(auth.uid())
  );

DROP POLICY IF EXISTS admin_branch_site_content_delete ON public.site_content;
CREATE POLICY admin_branch_site_content_delete ON public.site_content
  FOR DELETE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'admin'::app_role
    AND branch_id IS NOT NULL
    AND branch_id = get_user_branch_id(auth.uid())
  );