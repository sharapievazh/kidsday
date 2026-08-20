DROP POLICY IF EXISTS "Kid or parent inserts completion" ON public.task_completions;

CREATE POLICY "Kid or parent inserts completion" ON public.task_completions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p, public.profiles me
      WHERE p.id = kid_id AND me.user_id = auth.uid() AND me.role = 'parent' AND p.parent_id = me.id
    )
  );

DROP POLICY IF EXISTS "Kid or parent deletes completion" ON public.task_completions;

CREATE POLICY "Kid or parent deletes completion" ON public.task_completions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p, public.profiles me
      WHERE p.id = kid_id AND me.user_id = auth.uid() AND me.role = 'parent' AND p.parent_id = me.id
    )
  );

DROP POLICY IF EXISTS "Kid buys reward" ON public.reward_purchases;

CREATE POLICY "Kid buys reward" ON public.reward_purchases FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles p, public.profiles me
      WHERE p.id = kid_id AND me.user_id = auth.uid() AND me.role = 'parent' AND p.parent_id = me.id
    )
  );