
-- Enforce coins_awarded from tasks.coins
CREATE OR REPLACE FUNCTION public.enforce_task_completion_coins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  real_coins INTEGER;
BEGIN
  SELECT coins INTO real_coins FROM public.tasks WHERE id = NEW.task_id;
  IF real_coins IS NULL THEN
    RAISE EXCEPTION 'Task % not found', NEW.task_id;
  END IF;
  NEW.coins_awarded := real_coins;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_task_completion_coins ON public.task_completions;
CREATE TRIGGER trg_enforce_task_completion_coins
BEFORE INSERT OR UPDATE ON public.task_completions
FOR EACH ROW EXECUTE FUNCTION public.enforce_task_completion_coins();

-- Enforce reward purchase cost from rewards.cost
-- For cost = 0 (money exchange), spend the kid's entire current coin balance.
CREATE OR REPLACE FUNCTION public.enforce_reward_purchase_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  real_cost INTEGER;
  earned INTEGER;
  spent INTEGER;
  balance INTEGER;
BEGIN
  SELECT cost INTO real_cost FROM public.rewards WHERE id = NEW.reward_id;
  IF real_cost IS NULL THEN
    RAISE EXCEPTION 'Reward % not found', NEW.reward_id;
  END IF;

  IF real_cost = 0 THEN
    SELECT COALESCE(SUM(coins_awarded), 0) INTO earned
      FROM public.task_completions WHERE kid_id = NEW.kid_id;
    SELECT COALESCE(SUM(cost), 0) INTO spent
      FROM public.reward_purchases WHERE kid_id = NEW.kid_id;
    balance := earned - spent;
    IF balance < 0 THEN balance := 0; END IF;
    NEW.cost := balance;
  ELSE
    NEW.cost := real_cost;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reward_purchase_cost ON public.reward_purchases;
CREATE TRIGGER trg_enforce_reward_purchase_cost
BEFORE INSERT OR UPDATE ON public.reward_purchases
FOR EACH ROW EXECUTE FUNCTION public.enforce_reward_purchase_cost();
