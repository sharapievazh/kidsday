-- Restore full table-level SELECT for authenticated (PostgREST requires it for select=*)
GRANT SELECT ON public.profiles TO authenticated;

-- Create a PIN-less view for client reads, respecting caller's RLS
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = true) AS
SELECT id, user_id, parent_id, role, name, emoji, color,
       streak_count, streak_last_date, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;
GRANT ALL ON public.profiles_safe TO service_role;