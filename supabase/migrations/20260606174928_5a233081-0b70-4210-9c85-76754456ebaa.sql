
-- Schedule type enum
DO $$ BEGIN
  CREATE TYPE public.schedule_type AS ENUM ('school_days','holidays','always');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tasks: scheduling fields
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS days_of_week int[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  ADD COLUMN IF NOT EXISTS schedule_type public.schedule_type NOT NULL DEFAULT 'always';

-- Profiles: pin_code for kid login
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_code text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_pin_code_key
  ON public.profiles(pin_code) WHERE pin_code IS NOT NULL;

-- Update handle_new_user to skip when metadata marks this as a kid (server fn creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.raw_user_meta_data->>'kind') = 'kid' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles (user_id, role, name, emoji)
  VALUES (NEW.id, 'parent', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), '👤');
  RETURN NEW;
END; $function$;

-- Ensure trigger exists (in case missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Enable realtime on task_completions
ALTER TABLE public.task_completions REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_completions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
