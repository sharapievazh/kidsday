
-- ===== ENUMS =====
CREATE TYPE public.profile_role AS ENUM ('parent', 'kid');
CREATE TYPE public.task_category AS ENUM ('Hygiene','Chores','Self-Education','Reading','Piano','Chess','Sports');
CREATE TYPE public.task_frequency AS ENUM ('daily','weekly');

-- ===== PROFILES (Users) =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for kid profiles managed by parent
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- for kids: their parent's profile id
  role public.profile_role NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🙂',
  color TEXT,
  streak_count INT NOT NULL DEFAULT 0,
  streak_last_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_parent ON public.profiles(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer helper: get current user's parent profile id
CREATE OR REPLACE FUNCTION public.current_parent_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN p.role = 'parent' THEN p.id
    ELSE p.parent_id
  END
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE POLICY "View own family profiles" ON public.profiles FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR id = public.current_parent_id()
    OR parent_id = public.current_parent_id()
  );

CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() OR parent_id = public.current_parent_id());

CREATE POLICY "Update family profiles" ON public.profiles FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid() OR parent_id = public.current_parent_id()
  );

CREATE POLICY "Parent deletes kid profiles" ON public.profiles FOR DELETE
  TO authenticated USING (parent_id = public.current_parent_id());

-- ===== TASKS =====
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category public.task_category NOT NULL,
  coins INT NOT NULL DEFAULT 5 CHECK (coins >= 0),
  frequency public.task_frequency NOT NULL DEFAULT 'daily',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_parent ON public.tasks(parent_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View family tasks" ON public.tasks FOR SELECT
  TO authenticated USING (parent_id = public.current_parent_id());

CREATE POLICY "Parent manages tasks" ON public.tasks FOR INSERT
  TO authenticated WITH CHECK (
    parent_id = public.current_parent_id()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.current_parent_id() AND p.user_id = auth.uid() AND p.role = 'parent')
  );
CREATE POLICY "Parent updates tasks" ON public.tasks FOR UPDATE
  TO authenticated USING (
    parent_id = public.current_parent_id()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.current_parent_id() AND p.user_id = auth.uid() AND p.role = 'parent')
  );
CREATE POLICY "Parent deletes tasks" ON public.tasks FOR DELETE
  TO authenticated USING (
    parent_id = public.current_parent_id()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.current_parent_id() AND p.user_id = auth.uid() AND p.role = 'parent')
  );

-- ===== TASK COMPLETIONS =====
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  coins_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, kid_id, completed_on)
);
CREATE INDEX idx_completions_kid_date ON public.task_completions(kid_id, completed_on);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_completions TO authenticated;
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View family completions" ON public.task_completions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND (p.parent_id = public.current_parent_id() OR p.id = public.current_parent_id()))
  );
CREATE POLICY "Kid or parent inserts completion" ON public.task_completions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND (p.user_id = auth.uid() OR p.parent_id = public.current_parent_id()))
  );
CREATE POLICY "Kid or parent deletes completion" ON public.task_completions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND (p.user_id = auth.uid() OR p.parent_id = public.current_parent_id()))
  );

-- ===== REWARDS =====
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🎁',
  cost INT NOT NULL CHECK (cost > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rewards_parent ON public.rewards(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View family rewards" ON public.rewards FOR SELECT
  TO authenticated USING (parent_id = public.current_parent_id());
CREATE POLICY "Parent inserts rewards" ON public.rewards FOR INSERT
  TO authenticated WITH CHECK (
    parent_id = public.current_parent_id()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.current_parent_id() AND p.user_id = auth.uid() AND p.role = 'parent')
  );
CREATE POLICY "Parent updates rewards" ON public.rewards FOR UPDATE
  TO authenticated USING (
    parent_id = public.current_parent_id()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.current_parent_id() AND p.user_id = auth.uid() AND p.role = 'parent')
  );
CREATE POLICY "Parent deletes rewards" ON public.rewards FOR DELETE
  TO authenticated USING (
    parent_id = public.current_parent_id()
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.current_parent_id() AND p.user_id = auth.uid() AND p.role = 'parent')
  );

-- ===== REWARD PURCHASES =====
CREATE TABLE public.reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  kid_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cost INT NOT NULL CHECK (cost >= 0),
  delivered BOOLEAN NOT NULL DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchases_kid ON public.reward_purchases(kid_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_purchases TO authenticated;
GRANT ALL ON public.reward_purchases TO service_role;
ALTER TABLE public.reward_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View family purchases" ON public.reward_purchases FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND (p.parent_id = public.current_parent_id() OR p.id = public.current_parent_id()))
  );
CREATE POLICY "Kid buys reward" ON public.reward_purchases FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = kid_id AND (p.user_id = auth.uid() OR p.parent_id = public.current_parent_id()))
  );
CREATE POLICY "Parent marks delivered" ON public.reward_purchases FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles k
      JOIN public.profiles parent ON parent.id = k.parent_id
      WHERE k.id = kid_id AND parent.user_id = auth.uid() AND parent.role = 'parent'
    )
  );

-- ===== updated_at trigger =====
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tasks_set_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER rewards_set_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ===== Auto-create parent profile on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, name, emoji)
  VALUES (NEW.id, 'parent', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), '👤');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
