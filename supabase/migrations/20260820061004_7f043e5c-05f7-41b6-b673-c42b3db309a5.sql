DROP POLICY IF EXISTS "Update family profiles" ON public.profiles;

CREATE POLICY "Update family profiles" ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR parent_id = public.current_parent_id()
  )
  WITH CHECK (
    -- Own profile: role, parent_id, user_id must stay unchanged.
    (user_id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()) AND parent_id IS NOT DISTINCT FROM (SELECT parent_id FROM public.profiles WHERE user_id = auth.uid()))
    OR
    -- Parent editing their kid's profile: role/parent_id/user_id must stay unchanged too.
    (parent_id = public.current_parent_id() AND role = 'kid' AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Parent deletes kid profiles" ON public.profiles;

CREATE POLICY "Parent deletes kid profiles" ON public.profiles FOR DELETE
  TO authenticated USING (
    parent_id = public.current_parent_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles me
      WHERE me.user_id = auth.uid() AND me.role = 'parent'
    )
  );