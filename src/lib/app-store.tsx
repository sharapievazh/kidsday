import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ============== STATIC METADATA ==============

export type Category =
  | "Hygiene"
  | "Chores"
  | "Self-Education"
  | "Reading"
  | "Piano"
  | "Chess"
  | "Sports";

export const CATEGORIES: Category[] = [
  "Hygiene",
  "Chores",
  "Self-Education",
  "Reading",
  "Piano",
  "Chess",
  "Sports",
];

export type Frequency = "daily" | "weekly";

export const CATEGORY_EMOJI: Record<Category, string> = {
  Hygiene: "🪥",
  Chores: "🧹",
  "Self-Education": "🧠",
  Reading: "📚",
  Piano: "🎹",
  Chess: "♟️",
  Sports: "⚽",
};

export function categoryToken(cat: Category): string {
  const map: Record<Category, string> = {
    Hygiene: "hygiene",
    Chores: "chores",
    "Self-Education": "education",
    Reading: "reading",
    Piano: "piano",
    Chess: "chess",
    Sports: "sports",
  };
  return map[cat];
}

// ============== TYPES ==============

export type Profile = {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  role: "parent" | "kid";
  name: string;
  emoji: string | null;
  color: string | null;
  streak_count: number;
  streak_last_date: string | null;
};

export type ScheduleType = "school_days" | "holidays" | "always";

export const SCHEDULE_LABEL: Record<ScheduleType, string> = {
  always: "Always",
  school_days: "School days",
  holidays: "Holidays",
};

// ISO weekday: 1=Mon ... 7=Sun
export const WEEKDAYS: { n: number; short: string }[] = [
  { n: 1, short: "Mon" },
  { n: 2, short: "Tue" },
  { n: 3, short: "Wed" },
  { n: 4, short: "Thu" },
  { n: 5, short: "Fri" },
  { n: 6, short: "Sat" },
  { n: 7, short: "Sun" },
];

export function todayIsoWeekday(): number {
  const js = new Date().getDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

export function isTaskActiveToday(task: Pick<Task, "schedule_type" | "days_of_week">): boolean {
  const d = todayIsoWeekday();
  if (!task.days_of_week?.includes(d)) return false;
  if (task.schedule_type === "always") return true;
  if (task.schedule_type === "school_days") return d >= 1 && d <= 5;
  if (task.schedule_type === "holidays") return d === 6 || d === 7;
  return true;
}

export type Task = {
  id: string;
  parent_id: string;
  assignee_id: string;
  title: string;
  category: Category;
  coins: number;
  frequency: Frequency;
  days_of_week: number[];
  schedule_type: ScheduleType;
};

export type Completion = {
  id: string;
  task_id: string;
  kid_id: string;
  completed_on: string;
  coins_awarded: number;
};

export type Reward = {
  id: string;
  parent_id: string;
  name: string;
  emoji: string | null;
  cost: number;
  active: boolean;
};

export type Purchase = {
  id: string;
  reward_id: string;
  kid_id: string;
  cost: number;
  delivered: boolean;
  delivered_at: string | null;
  created_at: string;
  reward?: { name: string; emoji: string | null } | null;
};

const today = () => new Date().toISOString().slice(0, 10);

// ============== SESSION ==============

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setLoading(false);
      if (event === "SIGNED_OUT") {
        qc.clear();
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        qc.invalidateQueries();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  return { session, loading };
}

// ============== PROFILE (parent for the current user) ==============

export function useParentProfile(enabled: boolean): UseQueryResult<Profile | null> {
  return useQuery({
    queryKey: ["parent-profile"],
    enabled,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .eq("role", "parent")
        .maybeSingle();
      if (error) throw error;
      return (data as Profile) ?? null;
    },
  });
}

// ============== KIDS ==============

export function useKids(parentId: string | undefined) {
  return useQuery({
    queryKey: ["kids", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("parent_id", parentId!)
        .eq("role", "kid")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function useKid(kidId: string | undefined) {
  return useQuery({
    queryKey: ["kid", kidId],
    enabled: !!kidId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", kidId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile) ?? null;
    },
  });
}

// ============== TASKS ==============

export function useTasks(parentId: string | undefined) {
  return useQuery({
    queryKey: ["tasks", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("parent_id", parentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

// ============== COMPLETIONS ==============

export function useTodayCompletions(kidId: string | undefined) {
  return useQuery({
    queryKey: ["completions", kidId, today()],
    enabled: !!kidId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("*")
        .eq("kid_id", kidId!)
        .eq("completed_on", today());
      if (error) throw error;
      return (data ?? []) as Completion[];
    },
  });
}

export function useAllCompletions(kidIds: string[]) {
  return useQuery({
    queryKey: ["completions-all", kidIds.slice().sort().join(",")],
    enabled: kidIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("*")
        .in("kid_id", kidIds);
      if (error) throw error;
      return (data ?? []) as Completion[];
    },
  });
}

// ============== REWARDS ==============

export function useRewards(parentId: string | undefined) {
  return useQuery({
    queryKey: ["rewards", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("parent_id", parentId!)
        .eq("active", true)
        .order("cost", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reward[];
    },
  });
}

// ============== PURCHASES ==============

export function usePurchases(kidIds: string[]) {
  return useQuery({
    queryKey: ["purchases", kidIds.slice().sort().join(",")],
    enabled: kidIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_purchases")
        .select("*, reward:rewards(name, emoji)")
        .in("kid_id", kidIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Purchase[];
    },
  });
}

// ============== MUTATIONS ==============

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { task: Task; kidId: string; isDone: boolean }) => {
      const { task, kidId, isDone } = vars;
      if (isDone) {
        const { error } = await supabase
          .from("task_completions")
          .delete()
          .eq("task_id", task.id)
          .eq("kid_id", kidId)
          .eq("completed_on", today());
        if (error) throw error;
        return { added: false, coins: task.coins };
      }
      const { error } = await supabase.from("task_completions").insert({
        task_id: task.id,
        kid_id: kidId,
        coins_awarded: task.coins,
        completed_on: today(),
      });
      if (error) throw error;
      await bumpStreak(kidId);
      return { added: true, coins: task.coins };
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["completions", vars.kidId] });
      qc.invalidateQueries({ queryKey: ["completions-all"] });
      qc.invalidateQueries({ queryKey: ["kids"] });
      qc.invalidateQueries({ queryKey: ["kid", vars.kidId] });
    },
  });
}

async function bumpStreak(kidId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("streak_count, streak_last_date")
    .eq("id", kidId)
    .maybeSingle();
  if (!data) return;
  const t = today();
  if (data.streak_last_date === t) return;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = data.streak_last_date === y ? (data.streak_count ?? 0) + 1 : 1;
  await supabase
    .from("profiles")
    .update({ streak_count: count, streak_last_date: t })
    .eq("id", kidId);
}

export function useAddTask(parentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<Task, "id" | "parent_id">) => {
      if (!parentId) throw new Error("No parent");
      const { error } = await supabase.from("tasks").insert({ ...t, parent_id: parentId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("tasks").update(vars.patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useBuyReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { reward: Reward; kidId: string }) => {
      const { error } = await supabase.from("reward_purchases").insert({
        reward_id: vars.reward.id,
        kid_id: vars.kidId,
        cost: vars.reward.cost,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function useMarkDelivered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (purchaseId: string) => {
      const { error } = await supabase
        .from("reward_purchases")
        .update({ delivered: true, delivered_at: new Date().toISOString() })
        .eq("id", purchaseId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

// ============== HELPERS ==============

export function coinsFor(
  kidId: string,
  completions: Completion[],
  purchases: Purchase[],
): number {
  const earned = completions
    .filter((c) => c.kid_id === kidId)
    .reduce((s, c) => s + (c.coins_awarded ?? 0), 0);
  const spent = purchases
    .filter((p) => p.kid_id === kidId)
    .reduce((s, p) => s + p.cost, 0);
  return earned - spent;
}

// ============== SEED INITIAL DATA ==============

const INITIAL_KIDS = [
  { name: "Rosa", emoji: "🌸", color: "var(--piano)" },
  { name: "Ansar", emoji: "🦊", color: "var(--hygiene)" },
];

const INITIAL_TASKS_TEMPLATE: Array<Omit<Task, "id" | "parent_id" | "assignee_id">> = [
  { title: "Brush teeth (morning)", category: "Hygiene", coins: 5, frequency: "daily" },
  { title: "Make the bed", category: "Chores", coins: 5, frequency: "daily" },
  { title: "Read 20 minutes", category: "Reading", coins: 10, frequency: "daily" },
  { title: "Piano practice", category: "Piano", coins: 15, frequency: "daily" },
  { title: "Chess puzzle", category: "Chess", coins: 10, frequency: "daily" },
  { title: "Self-study lesson", category: "Self-Education", coins: 10, frequency: "daily" },
  { title: "Outdoor play 30 min", category: "Sports", coins: 10, frequency: "daily" },
];

const INITIAL_REWARDS = [
  { name: "30 min extra screen time", emoji: "📱", cost: 50 },
  { name: "Choose dinner", emoji: "🍕", cost: 75 },
  { name: "Ice cream trip", emoji: "🍦", cost: 100 },
  { name: "Movie night pick", emoji: "🎬", cost: 120 },
  { name: "Stay up 30 min late", emoji: "🌙", cost: 80 },
  { name: "New small toy", emoji: "🧸", cost: 250 },
  { name: "Trip to the park", emoji: "🛝", cost: 60 },
];

export function useSeedFamilyIfEmpty(parent: Profile | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!parent) return;
    let cancelled = false;
    (async () => {
      const { data: kids } = await supabase
        .from("profiles")
        .select("id")
        .eq("parent_id", parent.id);
      if (cancelled || (kids && kids.length > 0)) return;

      const newKids: { id: string }[] = [];
      for (const k of INITIAL_KIDS) {
        const { data } = await supabase
          .from("profiles")
          .insert({
            parent_id: parent.id,
            role: "kid",
            name: k.name,
            emoji: k.emoji,
            color: k.color,
          })
          .select("id")
          .single();
        if (data) newKids.push(data);
      }

      const taskRows = newKids.flatMap((k) =>
        INITIAL_TASKS_TEMPLATE.map((t) => ({
          ...t,
          parent_id: parent.id,
          assignee_id: k.id,
        })),
      );
      if (taskRows.length) await supabase.from("tasks").insert(taskRows);

      const rewardRows = INITIAL_REWARDS.map((r) => ({ ...r, parent_id: parent.id }));
      await supabase.from("rewards").insert(rewardRows);

      qc.invalidateQueries();
    })();
    return () => {
      cancelled = true;
    };
  }, [parent, qc]);
}
