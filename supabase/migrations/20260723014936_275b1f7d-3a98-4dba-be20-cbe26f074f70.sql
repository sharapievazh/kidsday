DROP TRIGGER IF EXISTS trg_enforce_task_completion_coins ON public.task_completions;
DROP TRIGGER IF EXISTS trg_enforce_reward_purchase_cost ON public.reward_purchases;

CREATE TRIGGER trg_enforce_task_completion_coins
  BEFORE INSERT ON public.task_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_completion_coins();

CREATE TRIGGER trg_enforce_reward_purchase_cost
  BEFORE INSERT ON public.reward_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_reward_purchase_cost();