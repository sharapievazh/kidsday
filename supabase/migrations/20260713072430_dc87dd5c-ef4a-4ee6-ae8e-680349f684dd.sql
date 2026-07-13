-- Restrict what regular authenticated users can update on profiles.
-- Sensitive columns (role, parent_id, user_id, pin_code) must only be
-- writable by trusted server code using the service_role key.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, emoji, color, streak_count, streak_last_date)
  ON public.profiles TO authenticated;

-- Hide pin_code from ordinary SELECTs. The PIN is returned once by the
-- create/regenerate server functions; it must never leak through the
-- generic profiles read path used by the client.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, user_id, parent_id, role, name, emoji, color,
  streak_count, streak_last_date, created_at, updated_at
) ON public.profiles TO authenticated;

-- Also lock which columns an authenticated user may set on INSERT so that
-- a child account cannot craft a profile row that attaches to another
-- family. Trusted flows (handle_new_user trigger, createKidFn) run as
-- SECURITY DEFINER / service_role and are unaffected.
REVOKE INSERT ON public.profiles FROM authenticated;
GRANT INSERT (name, emoji, color) ON public.profiles TO authenticated;