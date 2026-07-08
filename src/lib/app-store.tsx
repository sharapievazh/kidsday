import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ============== STATIC METADATA ==============

export type Category =
  | "Hygiene"
  | "Chores"
  | "Self-Education"
  | "Reading"
  | "Piano"
  | "Chess"
  | "Sports"
  | "Creative";

export const CATEGORIES: Category[] = [
  "Hygiene",
  "Chores",
  "Self-Education",
  "Reading",
  "Piano",
  "Chess",
  "Sports",
  "Creative",
];

export type Frequency = "daily" | "weekly";

export const CATEGORY_EMOJI: Record<Category, string> = {
  Hygiene: "🪥",
  Chores: "🧹",
  "Self-Education": "🧠",
  Reading: "📚",
  Piano: "🎹",
  Chess: "♟️",
  Sports: "💪",
  Creative: "🎨",
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
    Creative: "creative",
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
  pin_code: string | null;
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
  title_ru: string | null;
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
  name_ru: string | null;
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
  reward?: { name: string; name_ru: string | null; emoji: string | null } | null;
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
        .select("*, reward:rewards(name, name_ru, emoji)")
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

const INITIAL_TASKS_TEMPLATE: Array<Omit<Task, "id" | "parent_id" | "assignee_id">> = [
  { title: "Early wake-up (6–7 AM)", title_ru: "Ранний подъём (6–7 утра)", category: "Hygiene", coins: 10, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Workout or morning exercise", title_ru: "Тренировка или зарядка", category: "Sports", coins: 10, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Book notes / summary of today's reading", title_ru: "Конспект прочитанного за день", category: "Reading", coins: 15, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Home responsibility (chore around the house)", title_ru: "Домашняя обязанность", category: "Chores", coins: 10, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Creative project (make something by hand)", title_ru: "Творческий проект своими руками", category: "Creative", coins: 15, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Brush teeth (morning)", title_ru: "Почистить зубы (утро)", category: "Hygiene", coins: 5, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Make the bed", title_ru: "Заправить кровать", category: "Chores", coins: 5, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
  { title: "Piano practice", title_ru: "Занятия на пианино", category: "Piano", coins: 15, frequency: "daily", days_of_week: [1,2,3,4,5], schedule_type: "school_days" },
  { title: "Chess puzzle", title_ru: "Шахматная задача", category: "Chess", coins: 10, frequency: "daily", days_of_week: [1,2,3,4,5,6,7], schedule_type: "always" },
];


const INITIAL_REWARDS = [
  { name: "30 min extra screen time", name_ru: "30 мин экранного времени", emoji: "📱", cost: 50 },
  { name: "Choose dinner", name_ru: "Выбрать ужин", emoji: "🍕", cost: 75 },
  { name: "Ice cream trip", name_ru: "Пойти за мороженым", emoji: "🍦", cost: 100 },
  { name: "Movie night pick", name_ru: "Выбрать фильм на вечер", emoji: "🎬", cost: 120 },
  { name: "Stay up 30 min late", name_ru: "Лечь на 30 мин позже", emoji: "🌙", cost: 80 },
  { name: "New small toy", name_ru: "Новая маленькая игрушка", emoji: "🧸", cost: 250 },
  { name: "Trip to the park", name_ru: "Прогулка в парк", emoji: "🛝", cost: 60 },
];

// Fallback translations for common seed titles/names, applied when a row
// has no explicit *_ru value (e.g. rows seeded before the RU column existed).
const TITLE_RU_FALLBACK: Record<string, string> = {
  "Brush Teeth": "Почистить зубы",
  "Brush teeth (morning)": "Почистить зубы (утро)",
  "Book": "Книга",
  "Dancing": "Танцы",
  "bed, table and dish": "Кровать, стол и посуда",
  "Homework": "Домашнее задание",
  "Make the bed": "Заправить кровать",
  "Piano practice": "Занятия на пианино",
  "Chess puzzle": "Шахматная задача",
  "Early wake-up (6–7 AM)": "Ранний подъём (6–7 утра)",
  "Workout or morning exercise": "Тренировка или зарядка",
  "Book notes / summary of today's reading": "Конспект прочитанного за день",
  "Home responsibility (chore around the house)": "Домашняя обязанность",
  "Creative project (make something by hand)": "Творческий проект своими руками",
};

const REWARD_RU_FALLBACK: Record<string, string> = {
  "30 min extra screen time": "30 мин экранного времени",
  "Choose dinner": "Выбрать ужин",
  "Ice cream trip": "Пойти за мороженым",
  "Movie night pick": "Выбрать фильм на вечер",
  "Stay up 30 min late": "Лечь на 30 мин позже",
  "New small toy": "Новая маленькая игрушка",
  "Trip to the park": "Прогулка в парк",
};

export function localizedTaskTitle(
  task: Pick<Task, "title" | "title_ru">,
  lang: "en" | "ru",
): string {
  if (lang !== "ru") return task.title;
  return task.title_ru?.trim() || TITLE_RU_FALLBACK[task.title] || task.title;
}

export function localizedRewardName(
  reward: Pick<Reward, "name" | "name_ru">,
  lang: "en" | "ru",
): string {
  if (lang !== "ru") return reward.name;
  return reward.name_ru?.trim() || REWARD_RU_FALLBACK[reward.name] || reward.name;
}

// Seeds starter rewards + (when kids already exist) starter tasks. Kids are
// added through Family Management so they get PIN-based auth accounts.
export function useSeedFamilyIfEmpty(parent: Profile | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!parent) return;
    let cancelled = false;
    (async () => {
      const { data: rewards } = await supabase
        .from("rewards")
        .select("id")
        .eq("parent_id", parent.id)
        .limit(1);
      if (cancelled) return;
      if (!rewards || rewards.length === 0) {
        const rewardRows = INITIAL_REWARDS.map((r) => ({ ...r, parent_id: parent.id }));
        await supabase.from("rewards").insert(rewardRows);
      }

      const { data: kids } = await supabase
        .from("profiles")
        .select("id")
        .eq("parent_id", parent.id)
        .eq("role", "kid");
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("parent_id", parent.id)
        .limit(1);
      if (kids && kids.length > 0 && (!tasks || tasks.length === 0)) {
        const taskRows = kids.flatMap((k) =>
          INITIAL_TASKS_TEMPLATE.map((t) => ({
            ...t,
            parent_id: parent.id,
            assignee_id: k.id,
          })),
        );
        if (taskRows.length) await supabase.from("tasks").insert(taskRows);
      }

      qc.invalidateQueries();
    })();
    return () => {
      cancelled = true;
    };
  }, [parent, qc]);
}

// ============== KID MUTATIONS (PIN-based auth) ==============

export function useCreateKid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { name: string; emoji: string; pin: string }) => {
      const { createKidFn } = await import("./kids.functions");
      return createKidFn({ data: vars });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kids"] }),
  });
}

export function useDeleteKid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (kidId: string) => {
      const { deleteKidFn } = await import("./kids.functions");
      return deleteKidFn({ data: { kidId } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kids"] }),
  });
}

export function useRegeneratePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { kidId: string; pin: string }) => {
      const { regenerateKidPinFn } = await import("./kids.functions");
      return regenerateKidPinFn({ data: vars });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kids"] }),
  });
}

export function generateRandomPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============== REALTIME: family task completions ==============

export function useFamilyCompletionsRealtime(kidIds: string[]) {
  const qc = useQueryClient();
  const key = kidIds.slice().sort().join(",");
  useEffect(() => {
    if (kidIds.length === 0) return;
    const channel = supabase
      .channel(`family-completions:${key}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_completions" },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | { kid_id?: string; task_id?: string; coins_awarded?: number }
            | null;
          if (!row?.kid_id || !kidIds.includes(row.kid_id)) return;
          qc.invalidateQueries({ queryKey: ["completions-all"] });
          qc.invalidateQueries({ queryKey: ["completions-today"] });
          qc.invalidateQueries({ queryKey: ["review-feed"] });

          if (payload.eventType === "INSERT" && row.task_id) {
            const kids = qc
              .getQueriesData<Profile[]>({ queryKey: ["kids"] })
              .flatMap(([, data]) => data ?? []);
            const tasks = qc
              .getQueriesData<Task[]>({ queryKey: ["tasks"] })
              .flatMap(([, data]) => data ?? []);
            const kid = kids.find((k) => k.id === row.kid_id);
            const task = tasks.find((t) => t.id === row.task_id);
            const kidLabel = kid ? `${kid.emoji ?? "🙂"} ${kid.name}` : "Kid";
            const lang = (typeof window !== "undefined" && (localStorage.getItem("kidsday.lang") as "en" | "ru" | null)) || "en";
            const title = task ? localizedTaskTitle(task, lang) : "a quest";
            const taskLabel = task ? `${CATEGORY_EMOJI[task.category]} ${title}` : "a quest";
            toast.success(`${kidLabel} completed ${taskLabel}`, {
              description: `🪙 +${row.coins_awarded ?? task?.coins ?? 0}`,
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, key]);
}

// ============== REVIEW FEED ==============

export type ReviewItem = {
  id: string;
  task_id: string;
  kid_id: string;
  completed_on: string;
  created_at: string;
  coins_awarded: number;
  task: { title: string; title_ru: string | null; category: Category } | null;
};

export function useReviewFeed(kidIds: string[]) {
  return useQuery({
    queryKey: ["review-feed", kidIds.slice().sort().join(",")],
    enabled: kidIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select(
          "id, task_id, kid_id, completed_on, created_at, coins_awarded, task:tasks(title,title_ru,category)",
        )
        .in("kid_id", kidIds)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewItem[];
    },
  });
}

export function useDisputeCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_completions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["completions-all"] });
      qc.invalidateQueries({ queryKey: ["review-feed"] });
    },
  });
}


// ============== REWARD CRUD ==============

export function useAddReward(parentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { name: string; name_ru?: string | null; emoji: string; cost: number; active?: boolean }) => {
      if (!parentId) throw new Error("No parent");
      const { error } = await supabase.from("rewards").insert({
        parent_id: parentId,
        name: r.name,
        name_ru: r.name_ru?.trim() || null,
        emoji: r.emoji,
        cost: r.cost,
        active: r.active ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards"] }),
  });
}

export function useUpdateReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; patch: Partial<Reward> }) => {
      const { error } = await supabase.from("rewards").update(vars.patch).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards"] }),
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rewards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards"] }),
  });
}
