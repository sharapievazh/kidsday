
CREATE TABLE public.kid_secrets (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- service_role only: no GRANT to authenticated/anon, no policies.
GRANT ALL ON public.kid_secrets TO service_role;
ALTER TABLE public.kid_secrets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER kid_secrets_set_updated_at
BEFORE UPDATE ON public.kid_secrets
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Migrate existing PINs.
INSERT INTO public.kid_secrets (profile_id, pin_code)
SELECT id, pin_code FROM public.profiles
WHERE pin_code IS NOT NULL AND role = 'kid'
ON CONFLICT (profile_id) DO NOTHING;

-- Drop the column from profiles (also drops the unique index profiles_pin_code_key).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pin_code;
