DROP TRIGGER IF EXISTS enforce_task_completion_coins_trg ON public.task_completions;
DROP TRIGGER IF EXISTS enforce_reward_purchase_cost_trg ON public.reward_purchases;

CREATE TRIGGER enforce_task_completion_coins_trg
  BEFORE INSERT ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_completion_coins();

CREATE TRIGGER enforce_reward_purchase_cost_trg
  BEFORE INSERT ON public.reward_purchases
  FOR EACH ROW EXECUTE FUNCTION public.enforce_reward_purchase_cost();