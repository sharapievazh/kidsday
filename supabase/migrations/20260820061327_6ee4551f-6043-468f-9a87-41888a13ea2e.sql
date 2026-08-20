CREATE OR REPLACE FUNCTION public.enforce_profile_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role OR OLD.parent_id IS DISTINCT FROM NEW.parent_id OR OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Changing role, parent_id, or user_id is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_immutable_fields_trg ON public.profiles;
CREATE TRIGGER profiles_enforce_immutable_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_immutable_fields();

DROP POLICY IF EXISTS "Update family profiles" ON public.profiles;

CREATE POLICY "Update family profiles" ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR parent_id = public.current_parent_id()
  )
  WITH CHECK (
    -- Editing own profile.
    user_id = auth.uid()
    OR
    -- Parent editing a kid's profile in the same family.
    (
      EXISTS (SELECT 1 FROM public.profiles me WHERE me.user_id = auth.uid() AND me.role = 'parent')
      AND parent_id = public.current_parent_id()
    )
  );