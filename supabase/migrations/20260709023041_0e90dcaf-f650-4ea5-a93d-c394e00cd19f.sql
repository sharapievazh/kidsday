ALTER TABLE public.rewards DROP CONSTRAINT rewards_cost_check;
ALTER TABLE public.rewards ADD CONSTRAINT rewards_cost_check CHECK (cost >= 0);