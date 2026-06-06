import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

export type KidId = "rosa" | "brother";
export type Role = KidId | "parent";

export type Frequency = "daily" | "weekly";

export type Task = {
  id: string;
  title: string;
  category: Category;
  assignee: KidId;
  coins: number;
  frequency: Frequency;
};

export type Completion = {
  taskId: string;
  kidId: KidId;
  date: string; // YYYY-MM-DD
};

export type Purchase = {
  id: string;
  kidId: KidId;
  rewardId: string;
  rewardName: string;
  cost: number;
  date: string;
  delivered: boolean;
};

export type Reward = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
};

export type KidProfile = {
  id: KidId;
  name: string;
  emoji: string;
  color: string; // css color token
};

export const KIDS: Record<KidId, KidProfile> = {
  rosa: { id: "rosa", name: "Rosa", emoji: "🌸", color: "var(--piano)" },
  brother: { id: "brother", name: "Ansar", emoji: "🦊", color: "var(--hygiene)" },
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

const initialTasks: Task[] = [
  { id: uid(), title: "Brush teeth (morning)", category: "Hygiene", assignee: "rosa", coins: 5, frequency: "daily" },
  { id: uid(), title: "Make the bed", category: "Chores", assignee: "rosa", coins: 5, frequency: "daily" },
  { id: uid(), title: "Read 20 minutes", category: "Reading", assignee: "rosa", coins: 10, frequency: "daily" },
  { id: uid(), title: "Piano practice", category: "Piano", assignee: "rosa", coins: 15, frequency: "daily" },
  { id: uid(), title: "Chess puzzle", category: "Chess", assignee: "rosa", coins: 10, frequency: "daily" },
  { id: uid(), title: "Duolingo lesson", category: "Self-Education", assignee: "rosa", coins: 10, frequency: "daily" },
  { id: uid(), title: "Outdoor play 30 min", category: "Sports", assignee: "rosa", coins: 10, frequency: "daily" },

  { id: uid(), title: "Brush teeth (morning)", category: "Hygiene", assignee: "brother", coins: 5, frequency: "daily" },
  { id: uid(), title: "Tidy the toys", category: "Chores", assignee: "brother", coins: 5, frequency: "daily" },
  { id: uid(), title: "Read 15 minutes", category: "Reading", assignee: "brother", coins: 10, frequency: "daily" },
  { id: uid(), title: "Piano practice", category: "Piano", assignee: "brother", coins: 15, frequency: "daily" },
  { id: uid(), title: "Chess puzzle", category: "Chess", assignee: "brother", coins: 10, frequency: "daily" },
  { id: uid(), title: "Math worksheet", category: "Self-Education", assignee: "brother", coins: 10, frequency: "daily" },
  { id: uid(), title: "Bike ride", category: "Sports", assignee: "brother", coins: 10, frequency: "daily" },
];

export const REWARDS: Reward[] = [
  { id: "r1", name: "30 min extra screen time", emoji: "📱", cost: 50 },
  { id: "r2", name: "Choose dinner", emoji: "🍕", cost: 75 },
  { id: "r3", name: "Ice cream trip", emoji: "🍦", cost: 100 },
  { id: "r4", name: "Movie night pick", emoji: "🎬", cost: 120 },
  { id: "r5", name: "Stay up 30 min late", emoji: "🌙", cost: 80 },
  { id: "r6", name: "New small toy", emoji: "🧸", cost: 250 },
  { id: "r7", name: "Friend sleepover", emoji: "🛌", cost: 300 },
  { id: "r8", name: "Trip to the park", emoji: "🛝", cost: 60 },
];

type State = {
  role: Role;
  tasks: Task[];
  completions: Completion[];
  purchases: Purchase[];
  // streak: per kid last active date + count
  streaks: Record<KidId, { count: number; lastDate: string | null }>;
};

const STORAGE_KEY = "kid-tracker-v1";

const defaultState: State = {
  role: "rosa",
  tasks: initialTasks,
  completions: [],
  purchases: [],
  streaks: {
    rosa: { count: 3, lastDate: null },
    brother: { count: 1, lastDate: null },
  },
};

type Ctx = {
  state: State;
  setRole: (r: Role) => void;
  toggleTask: (taskId: string, kidId: KidId) => { added: boolean; coins: number };
  coinsFor: (kidId: KidId) => number;
  isDone: (taskId: string, kidId: KidId) => boolean;
  tasksFor: (kidId: KidId) => Task[];
  buyReward: (kidId: KidId, reward: Reward) => boolean;
  markDelivered: (purchaseId: string) => void;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (id: string, t: Omit<Task, "id">) => void;
  deleteTask: (id: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultState, ...JSON.parse(raw) };
    } catch {}
    return defaultState;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const setRole = (role: Role) => setState((s) => ({ ...s, role }));

  const tasksFor = (kidId: KidId) => state.tasks.filter((t) => t.assignee === kidId);

  const isDone = (taskId: string, kidId: KidId) =>
    state.completions.some(
      (c) => c.taskId === taskId && c.kidId === kidId && c.date === today(),
    );

  const coinsFor = (kidId: KidId) => {
    const earned = state.completions
      .filter((c) => c.kidId === kidId)
      .reduce((sum, c) => {
        const t = state.tasks.find((t) => t.id === c.taskId);
        return sum + (t?.coins ?? 0);
      }, 0);
    const spent = state.purchases
      .filter((p) => p.kidId === kidId)
      .reduce((s, p) => s + p.cost, 0);
    return earned - spent;
  };

  const bumpStreak = (kidId: KidId): void => {
    setState((s) => {
      const t = today();
      const prev = s.streaks[kidId];
      if (prev.lastDate === t) return s;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const count = prev.lastDate === yesterday ? prev.count + 1 : 1;
      return {
        ...s,
        streaks: { ...s.streaks, [kidId]: { count, lastDate: t } },
      };
    });
  };

  const toggleTask = (taskId: string, kidId: KidId) => {
    const t = state.tasks.find((x) => x.id === taskId);
    if (!t) return { added: false, coins: 0 };
    const exists = isDone(taskId, kidId);
    if (exists) {
      setState((s) => ({
        ...s,
        completions: s.completions.filter(
          (c) => !(c.taskId === taskId && c.kidId === kidId && c.date === today()),
        ),
      }));
      return { added: false, coins: t.coins };
    } else {
      setState((s) => ({
        ...s,
        completions: [...s.completions, { taskId, kidId, date: today() }],
      }));
      bumpStreak(kidId);
      return { added: true, coins: t.coins };
    }
  };

  const buyReward = (kidId: KidId, reward: Reward) => {
    if (coinsFor(kidId) < reward.cost) return false;
    setState((s) => ({
      ...s,
      purchases: [
        ...s.purchases,
        {
          id: uid(),
          kidId,
          rewardId: reward.id,
          rewardName: `${reward.emoji} ${reward.name}`,
          cost: reward.cost,
          date: today(),
          delivered: false,
        },
      ],
    }));
    return true;
  };

  const markDelivered = (purchaseId: string) => {
    setState((s) => ({
      ...s,
      purchases: s.purchases.map((p) =>
        p.id === purchaseId ? { ...p, delivered: true } : p,
      ),
    }));
  };

  const addTask = (t: Omit<Task, "id">) =>
    setState((s) => ({ ...s, tasks: [...s.tasks, { ...t, id: uid() }] }));

  const updateTask = (id: string, t: Omit<Task, "id">) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((x) => (x.id === id ? { ...t, id } : x)),
    }));

  const deleteTask = (id: string) =>
    setState((s) => ({
      ...s,
      tasks: s.tasks.filter((x) => x.id !== id),
      completions: s.completions.filter((c) => c.taskId !== id),
    }));

  return (
    <AppCtx.Provider
      value={{
        state,
        setRole,
        toggleTask,
        coinsFor,
        isDone,
        tasksFor,
        buyReward,
        markDelivered,
        addTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

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

export const CATEGORY_EMOJI: Record<Category, string> = {
  Hygiene: "🪥",
  Chores: "🧹",
  "Self-Education": "🧠",
  Reading: "📚",
  Piano: "🎹",
  Chess: "♟️",
  Sports: "⚽",
};
