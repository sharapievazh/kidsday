import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X, UserPlus, RefreshCw, KeyRound, Gift } from "lucide-react";

import {
  CATEGORIES,
  CATEGORY_EMOJI,
  WEEKDAYS,
  categoryToken,
  coinsFor,
  generateRandomPin,
  useAddReward,
  useAddTask,
  useAllCompletions,
  useCreateKid,
  useDeleteKid,
  useDeleteReward,
  useDeleteTask,
  useDisputeCompletion,
  useFamilyCompletionsRealtime,
  useKids,
  useMarkDelivered,
  useParentProfile,
  usePurchases,
  useRegeneratePin,
  useReviewFeed,
  useRewards,
  useSession,
  useTasks,
  useUpdateReward,
  useUpdateTask,
  type Category,
  type Frequency,
  type Reward,
  type ScheduleType,
  type Task,
  localizedTaskTitle,
  localizedRewardName,
} from "@/lib/app-store";
import { TopBar } from "@/components/RoleSwitcher";
import { useLang, useT } from "@/lib/i18n";

const KID_EMOJIS = Array.from(
  new Set([
    "🌸", "🦊", "🐻", "🐯", "🐼", "🦄", "🐶", "🐱", "🦁", "🐵",
    "🐧", "🐸", "🐨", "🐰", "🐷", "🐮", "🐔", "🐙", "🦋", "🐝",
    "🐢", "🦖", "🦥", "🦩", "🦉", "🐳", "🐬", "🦈", "🐲",
    "🌟", "🌈", "🍀", "🌻", "🌵", "🍄", "🌊", "🔥", "❄️",
    "🎈", "🎨", "🚀", "⚽", "🎮", "🧸", "👑",
    "🧙", "🧚", "🦸", "🥷", "👽", "🤖", "😺",
  ]),
);

const REWARD_EMOJIS = Array.from(
  new Set([
    "🎁", "💵", "💰", "🍦", "🍕", "🎮", "🎬", "📱", "🧸", "🍭",
    "🎨", "⚽", "💸", "🤑", "🏆", "🥇", "🎯", "🎟️",
    "🎪", "🎢", "🎡", "🎠", "🎳", "🚴", "🛼", "🛹", "🏓",
    "🎾", "🏀", "🏈", "⚾", "🏐", "🎸", "🎹", "🥁", "🎤", "🎧",
    "📚", "✏️", "🖍️", "🧩", "🪁", "🪀", "🎲", "♟️", "🎰", "🃏",
    "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫",
    "🍬", "🍡", "🍨", "🍧", "🍇", "🍓", "🍎", "🍌", "🍉", "🥑",
    "🚲", "🛴", "🏕️", "🏖️", "🎆", "🎇", "🌠", "🌙", "🛝",
  ]),
);

function EmojiPicker({
  value,
  onChange,
  options,
  initialCount = 12,
}: {
  value: string;
  onChange: (e: string) => void;
  options: string[];
  initialCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = useT();
  // Ensure the selected emoji is always visible in the collapsed view.
  const base = options.slice(0, initialCount);
  if (!base.includes(value) && options.includes(value)) {
    base[base.length - 1] = value;
  }
  const shown = expanded ? options : base;
  const canExpand = options.length > initialCount;
  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1.5">
        {shown.map((e) => (
          <button
            type="button"
            key={e}
            onClick={() => onChange(e)}
            className={`h-10 w-10 rounded-xl text-xl ${
              value === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
            }`}
          >
            {e}
          </button>
        ))}
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="h-10 rounded-xl bg-muted px-3 text-xs font-extrabold text-muted-foreground"
          >
            {expanded ? t("showLess") : `${t("showMore")} +${options.length - initialCount}`}
          </button>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/parent")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — Kids Day" },
      { name: "description", content: "Manage quests and approve rewards." },
    ],
  }),
  component: ParentPage,
});

type ParentTab = "tasks" | "family" | "review" | "approvals";

const TASK_PLACEHOLDERS: Record<Category, { en: string; ru: string }> = {
  Hygiene: { en: "e.g. Brush teeth", ru: "напр. Почистить зубы" },
  Chores: { en: "e.g. Tidy up the room", ru: "напр. Убраться в комнате" },
  "Self-Education": { en: "e.g. Logic puzzle", ru: "напр. Упражнение на логику" },
  Reading: { en: "e.g. Read 20 pages", ru: "напр. Прочитать 20 страниц" },
  Piano: { en: "e.g. Piano practice", ru: "напр. Игра на пианино" },
  Chess: { en: "e.g. Chess puzzle", ru: "напр. Шахматная задача" },
  Sports: { en: "e.g. Morning workout", ru: "напр. Утренняя зарядка" },
  Creative: { en: "e.g. Draw a picture", ru: "напр. Нарисовать рисунок" },
};

type FormState = {
  title: string;
  title_ru: string;
  category: Category;
  assignee_id: string;
  coins: number;
  frequency: Frequency;
  days_of_week: number[];
  schedule_type: ScheduleType;
};

function ParentPage() {
  const tr = useT();
  const { lang } = useLang();
  const { session } = useSession();
  const profileQ = useParentProfile(!!session);
  const parentId = profileQ.data?.id;
  const kidsQ = useKids(parentId);
  const tasksQ = useTasks(parentId);
  const kids = useMemo(() => kidsQ.data ?? [], [kidsQ.data]);
  const kidIds = useMemo(() => kids.map((k) => k.id), [kids]);
  const completionsQ = useAllCompletions(kidIds);
  const purchasesQ = usePurchases(kidIds);
  const reviewQ = useReviewFeed(kidIds);
  const rewardsQ = useRewards(parentId);

  useFamilyCompletionsRealtime(kidIds);

  const addTask = useAddTask(parentId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const markDelivered = useMarkDelivered();
  const createKid = useCreateKid();
  const deleteKid = useDeleteKid();
  const regenPin = useRegeneratePin();
  const disputeCompletion = useDisputeCompletion();
  const addReward = useAddReward(parentId);
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const tasks = tasksQ.data ?? [];
  const purchases = purchasesQ.data ?? [];
  const rewards = rewardsQ.data ?? [];

  const [tab, setTab] = useState<ParentTab>("tasks");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardModal, setRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    name_ru: "",
    emoji: "🎁",
    cost: 50,
    active: true,
  });

  // Track last-seen review count to badge new completions
  const [seenReviewCount, setSeenReviewCount] = useState(0);
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && reviewQ.data) {
      setSeenReviewCount(reviewQ.data.length);
      initRef.current = true;
    }
  }, [reviewQ.data]);
  useEffect(() => {
    if (tab === "review" && reviewQ.data) setSeenReviewCount(reviewQ.data.length);
  }, [tab, reviewQ.data]);
  const newReviewCount = Math.max(0, (reviewQ.data?.length ?? 0) - seenReviewCount);

  // Family form state
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKid, setNewKid] = useState({ name: "", emoji: "🙂", pin: generateRandomPin() });

  const defaultAssignee = kids[0]?.id ?? "";
  const blank: FormState = {
    title: "",
    title_ru: "",
    category: "Hygiene",
    assignee_id: defaultAssignee,
    coins: 5,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  };
  const [form, setForm] = useState<FormState>(blank);

  const openCreate = () => {
    const preferred =
      filter !== "all" && kids.some((k) => k.id === filter) ? filter : defaultAssignee;
    setForm({ ...blank, assignee_id: preferred });
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      title_ru: t.title_ru ?? "",
      category: t.category,
      assignee_id: t.assignee_id,
      coins: t.coins,
      frequency: t.frequency,
      days_of_week: t.days_of_week ?? [1, 2, 3, 4, 5, 6, 7],
      schedule_type: t.schedule_type ?? "always",
    });
    setEditing(t);
    setCreating(true);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const en = form.title.trim();
    const ru = form.title_ru.trim();
    if (!en && !ru) return toast.error(tr("titleRequired"));
    if (!form.assignee_id) return toast.error("Pick an assignee");
    if (form.days_of_week.length === 0) return toast.error("Pick at least one day");
    const payload = {
      ...form,
      title: en || ru,
      title_ru: ru || null,
    };
    if (editing) {
      updateTask.mutate(
        { id: editing.id, patch: payload },
        {
          onSuccess: () => {
            toast.success("Quest updated");
            close();
          },
          onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
        },
      );
    } else {
      addTask.mutate(payload, {
        onSuccess: () => {
          toast.success("Quest created");
          close();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
      });
    }
  };

  const filtered = tasks.filter((t) => filter === "all" || t.assignee_id === filter);
  const pending = purchases.filter((p) => !p.delivered);
  const loading = profileQ.isLoading || kidsQ.isLoading || tasksQ.isLoading;
  const kidById: Record<string, { name: string; emoji: string | null }> = Object.fromEntries(
    kids.map((k) => [k.id, { name: k.name, emoji: k.emoji }] as const),
  );
  if (profileQ.data) {
    kidById[profileQ.data.id] = {
      name: tr("myself"),
      emoji: profileQ.data.emoji ?? "👤",
    };
  }

  return (
    <div>
      <TopBar title={tr("parent")} />
      <div className="px-4 pt-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-success p-5 text-primary-foreground shadow">
          <div className="text-xs font-bold uppercase tracking-widest opacity-80">
            {tr("welcomeBack")}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold">{tr("parentDashboard")}</h1>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {loading ? (
              <>
                <div className="h-16 rounded-2xl bg-white/15 animate-pulse" />
                <div className="h-16 rounded-2xl bg-white/15 animate-pulse" />
              </>
            ) : (
              kids.map((k) => (
                <div key={k.id} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <span className="text-lg">{k.emoji ?? "🙂"}</span>
                    {k.name}
                  </div>
                  <div className="mt-1 text-xs opacity-90">
                    🔥 {k.streak_count} · 🪙 {coinsFor(k.id, completionsQ.data ?? [], purchases)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
          {(
            [
              { id: "tasks", label: tr("tabTasks"), badge: 0 },
              { id: "family", label: tr("tabFamily"), badge: 0 },
              { id: "review", label: tr("tabReview"), badge: newReviewCount },
              { id: "approvals", label: tr("tabRewards"), badge: pending.length },
            ] as { id: ParentTab; label: string; badge: number }[]
          ).map((tab_) => (
            <button
              key={tab_.id}
              onClick={() => setTab(tab_.id)}
              className={`relative rounded-full py-2 text-xs font-extrabold ${
                tab === tab_.id ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab_.label}
              {tab_.badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-extrabold text-destructive-foreground shadow">
                  {tab_.badge > 99 ? "99+" : tab_.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "tasks" ? (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex gap-1 rounded-full border border-border bg-card p-1">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    filter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {tr("all")}
                </button>
                {kids.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setFilter(k.id)}
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      filter === k.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {k.name}
                  </button>
                ))}
                {parentId && (
                  <button
                    onClick={() => setFilter(parentId)}
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      filter === parentId
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {profileQ.data?.emoji ?? "👤"} {tr("myself")}
                  </button>
                )}
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press"
              >
                <Plus className="h-4 w-4" /> {tr("new")}
              </button>
            </div>

            <div className="space-y-2">
              {tasksQ.isLoading && (
                <p className="text-center text-sm text-muted-foreground">{tr("loading")}</p>
              )}
              {filtered.map((t) => {
                const token = categoryToken(t.category);
                const assignee = kidById[t.assignee_id];
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `color-mix(in oklab, var(--${token}) 22%, white)` }}
                    >
                      {CATEGORY_EMOJI[t.category]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{localizedTaskTitle(t, lang)}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-white"
                          style={{ backgroundColor: `var(--${token})` }}
                        >
                          {tr(`cat_${t.category}`)}
                        </span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5">
                          {assignee?.emoji ?? "🙂"} {assignee?.name ?? "?"}
                        </span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5">
                          {tr(t.frequency)}
                        </span>
                        <span className="text-coin">🪙 {t.coins}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${t.title}"?`)) {
                          deleteTask.mutate(t.id, {
                            onSuccess: () => toast.success("Quest deleted"),
                          });
                        }
                      }}
                      className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {!tasksQ.isLoading && filtered.length === 0 && (
                <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {tr("noQuestsCreate")}
                </p>
              )}
            </div>
          </div>
        ) : tab === "approvals" ? (
          <div className="mt-4 space-y-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                {tr("manageRewards")} ({rewards.length})
              </h2>
              <button
                onClick={() => {
                  setEditingReward(null);
                  setRewardForm({ name: "", name_ru: "", emoji: "🎁", cost: 50, active: true });
                  setRewardModal(true);
                }}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press"
              >
                <Plus className="h-3.5 w-3.5" /> {tr("newReward")}
              </button>
            </div>
            {rewardsQ.isLoading && <p className="text-sm text-muted-foreground">{tr("loading")}</p>}
            {!rewardsQ.isLoading && rewards.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {tr("noQuestsCreate")}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                    {r.emoji ?? "🎁"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{localizedRewardName(r, lang)}</div>
                    <div className="text-xs font-bold text-coin">
                      🪙 {r.cost === 0 ? tr("allCoins") : r.cost}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingReward(r);
                      setRewardForm({
                        name: r.name,
                        name_ru: r.name_ru ?? "",
                        emoji: r.emoji ?? "🎁",
                        cost: r.cost,
                        active: r.active,
                      });
                      setRewardModal(true);
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                    aria-label="Edit reward"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Delete "${r.name}"?`)) return;
                      deleteReward.mutate(r.id, {
                        onSuccess: () => toast.success("Reward deleted"),
                        onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
                      });
                    }}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Delete reward"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <h2 className="mt-6 mb-1 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              {tr("pendingCount")(pending.length)}
            </h2>

            {purchasesQ.isLoading && (
              <p className="text-sm text-muted-foreground">{tr("loading")}</p>
            )}
            {!purchasesQ.isLoading && pending.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {tr("noPending")}
              </p>
            )}
            {pending.map((p) => {
              const k = kidById[p.kid_id];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold">
                      {p.reward?.emoji ?? "🎁"}{" "}
                      {p.reward ? localizedRewardName(p.reward, lang) : "Reward"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {k?.emoji ?? "🙂"} {k?.name ?? "?"} · 🪙 {p.cost} ·{" "}
                      {p.created_at.slice(0, 10)}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      markDelivered.mutate(p.id, {
                        onSuccess: () => toast.success("Marked delivered"),
                      })
                    }
                    className="rounded-full bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press"
                  >
                    {tr("deliver")}
                  </button>
                </div>
              );
            })}

            <h2 className="mt-6 mb-1 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              {tr("deliveredHeader")}
            </h2>
            {purchases
              .filter((p) => p.delivered)
              .map((p) => {
                const k = kidById[p.kid_id];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3 opacity-80"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold">
                        {p.reward?.emoji ?? "🎁"}{" "}
                        {p.reward ? localizedRewardName(p.reward, lang) : "Reward"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {k?.emoji ?? "🙂"} {k?.name ?? "?"} · {p.created_at.slice(0, 10)}
                      </div>
                    </div>
                    <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-extrabold text-success">
                      ✓
                    </span>
                  </div>
                );
              })}
          </div>
        ) : tab === "family" ? (
          <FamilyPane
            kids={kids}
            onAdd={() => {
              setNewKid({ name: "", emoji: "🙂", pin: generateRandomPin() });
              setShowAddKid(true);
            }}
            onDelete={(id, name) => {
              if (!confirm(`Remove ${name}? This deletes their account and tasks.`)) return;
              deleteKid.mutate(id, {
                onSuccess: () => toast.success(`${name} removed`),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
              });
            }}
            onRegenPin={(id, name) => {
              const pin = generateRandomPin();
              regenPin.mutate(
                { kidId: id, pin },
                {
                  onSuccess: () => toast.success(`New PIN for ${name}: ${pin}`),
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
                },
              );
            }}
          />
        ) : (
          <ReviewPane
            items={reviewQ.data ?? []}
            loading={reviewQ.isLoading}
            kidById={kidById}
            onDispute={(id) => {
              if (!confirm("Dispute and remove this completion?")) return;
              disputeCompletion.mutate(id, {
                onSuccess: () => toast.success("Completion removed"),
              });
            }}
          />
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs font-bold text-muted-foreground underline">
            ← {tr("backToProfiles").replace(/^←\s*/, "")}
          </Link>
        </div>
      </div>

      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={close}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">
                {editing ? tr("editQuest") : tr("newQuest")}
              </h3>
              <button type="button" onClick={close} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">{tr("title")} (EN)</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={TASK_PLACEHOLDERS[form.category].en}
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-bold outline-none focus:border-primary"
                autoFocus
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("title")} (RU)</span>
              <input
                value={form.title_ru}
                onChange={(e) => setForm({ ...form, title_ru: e.target.value })}
                placeholder={TASK_PLACEHOLDERS[form.category].ru}
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-bold outline-none focus:border-primary"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("category")}</span>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {CATEGORIES.map((c) => {
                  const sel = form.category === c;
                  const token = categoryToken(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, category: c })}
                      className={`rounded-xl px-2 py-2 text-xs font-extrabold transition ${
                        sel ? "text-white" : "bg-muted text-muted-foreground"
                      }`}
                      style={sel ? { backgroundColor: `var(--${token})` } : undefined}
                    >
                      {CATEGORY_EMOJI[c]} {tr(`cat_${c}`)}
                    </button>
                  );
                })}
              </div>
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">{tr("assignee")}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {kids.map((k) => (
                    <button
                      type="button"
                      key={k.id}
                      onClick={() => setForm({ ...form, assignee_id: k.id })}
                      className={`flex-1 rounded-xl py-2 text-xs font-extrabold ${
                        form.assignee_id === k.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {k.emoji ?? "🙂"} {k.name}
                    </button>
                  ))}
                  {parentId && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, assignee_id: parentId })}
                      className={`flex-1 rounded-xl py-2 text-xs font-extrabold ${
                        form.assignee_id === parentId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {profileQ.data?.emoji ?? "👤"} {tr("assignToSelf")}
                    </button>
                  )}
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">{tr("frequency")}</span>
                <div className="mt-1 flex gap-1.5">
                  {(["daily", "weekly"] as Frequency[]).map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => setForm({ ...form, frequency: f })}
                      className={`flex-1 rounded-xl py-2 text-xs font-extrabold capitalize ${
                        form.frequency === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tr(f)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">
                {tr("coinReward")}: <span className="text-coin">🪙 {form.coins}</span>
              </span>
              <input
                type="range"
                min={1}
                max={50}
                value={form.coins}
                onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })}
                className="mt-2 w-full accent-[color:var(--color-primary)]"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("activeDays")}</span>
              <div className="mt-1 flex gap-1">
                {WEEKDAYS.map((d) => {
                  const sel = form.days_of_week.includes(d.n);
                  return (
                    <button
                      type="button"
                      key={d.n}
                      onClick={() =>
                        setForm({
                          ...form,
                          days_of_week: sel
                            ? form.days_of_week.filter((x) => x !== d.n)
                            : [...form.days_of_week, d.n].sort(),
                        })
                      }
                      className={`flex-1 rounded-lg py-1.5 text-[11px] font-extrabold ${
                        sel
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("scheduleType")}</span>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {(["always", "school_days", "holidays"] as ScheduleType[]).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      const days =
                        s === "school_days"
                          ? [1, 2, 3, 4, 5]
                          : s === "holidays"
                            ? [6, 7]
                            : [1, 2, 3, 4, 5, 6, 7];
                      setForm({ ...form, schedule_type: s, days_of_week: days });
                    }}
                    className={`rounded-xl py-2 text-xs font-extrabold ${
                      form.schedule_type === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tr(`sched_${s}`)}
                  </button>
                ))}
              </div>
            </label>

            <div className="mt-5 flex gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this quest?")) {
                      deleteTask.mutate(editing.id, {
                        onSuccess: () => {
                          toast.success("Quest deleted");
                          close();
                        },
                      });
                    }
                  }}
                  className="rounded-full bg-destructive/10 px-4 py-2.5 text-sm font-extrabold text-destructive"
                >
                  {tr("delete")}
                </button>
              )}
              <button
                type="submit"
                disabled={addTask.isPending || updateTask.isPending}
                className="flex-1 rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
              >
                {addTask.isPending || updateTask.isPending
                  ? tr("saving")
                  : editing
                    ? tr("saveChanges")
                    : tr("createQuest")}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddKid && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setShowAddKid(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!newKid.name.trim()) return toast.error("Name required");
              if (!/^\d{6}$/.test(newKid.pin)) return toast.error("PIN must be 6 digits");
              createKid.mutate(newKid, {
                onSuccess: () => {
                  toast.success(`${newKid.name} added! PIN: ${newKid.pin}`);
                  setShowAddKid(false);
                },
                onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
              });
            }}
            className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{tr("addChildTitle")}</h3>
              <button
                type="button"
                onClick={() => setShowAddKid(false)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">{tr("name")}</span>
              <input
                value={newKid.name}
                onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                placeholder="e.g. Rosa"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-bold outline-none focus:border-primary"
                autoFocus
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("avatarEmoji")}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[
                  "🌸", "🦊", "🐻", "🐯", "🐼", "🦄", "🐶", "🐱", "🦁", "🐵",
                  "🐧", "🐸", "🐨", "🐰", "🐷", "🐮", "🐔", "🐙", "🦋", "🐝",
                  "🐢", "🦖", "🦥", "🦩", "🦉", "🐳", "🐬", "🦈", "🦕", "🐲",
                  "🌟", "⭐", "🌈", "🍀", "🌻", "🌵", "🍄", "🌊", "🔥", "❄️",
                  "🎈", "🎨", "🎭", "🎪", "🚀", "⚽", "🏀", "🎮", "🧸", "👑",
                  "🧙", "🧚", "🧛", "🧜", "🧝", "🦸", "🥷", "👽", "🤖", "😺",
                ].map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setNewKid({ ...newKid, emoji: e })}
                    className={`h-10 w-10 rounded-xl text-xl ${
                      newKid.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("sixDigitPin")}</span>
              <div className="mt-1 flex gap-2">
                <input
                  value={newKid.pin}
                  onChange={(e) =>
                    setNewKid({ ...newKid, pin: e.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                  inputMode="numeric"
                  className="flex-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-center font-mono text-lg font-extrabold tracking-[0.4em] outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setNewKid({ ...newKid, pin: generateRandomPin() })}
                  className="rounded-xl bg-muted px-3"
                  aria-label="Randomize PIN"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tr("sharePinHint")}</p>
            </label>

            <button
              type="submit"
              disabled={createKid.isPending}
              className="mt-5 w-full rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
            >
              {createKid.isPending ? tr("creating") : tr("createChildAccount")}
            </button>
          </form>
        </div>
      )}

      {rewardModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setRewardModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const en = rewardForm.name.trim();
              const ru = rewardForm.name_ru.trim();
              if (!en && !ru) return toast.error(tr("nameRequired"));
              if (rewardForm.cost < 0) return toast.error("Cost must be ≥ 0");
              const payload = { ...rewardForm, name: en || ru, name_ru: ru || null };
              const onDone = () => {
                toast.success(editingReward ? "Reward updated" : "Reward added");
                setRewardModal(false);
              };
              const onErr = (err: unknown) =>
                toast.error(err instanceof Error ? err.message : "Failed");
              if (editingReward) {
                updateReward.mutate(
                  { id: editingReward.id, patch: payload },
                  { onSuccess: onDone, onError: onErr },
                );
              } else {
                addReward.mutate(payload, { onSuccess: onDone, onError: onErr });
              }
            }}
            className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <Gift className="h-5 w-5" /> {editingReward ? tr("editReward") : tr("newReward")}
              </h3>
              <button
                type="button"
                onClick={() => setRewardModal(false)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">
                {tr("rewardName")} (EN)
              </span>
              <input
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                placeholder="e.g. Ice cream trip"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-bold outline-none focus:border-primary"
                autoFocus
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">
                {tr("rewardName")} (RU)
              </span>
              <input
                value={rewardForm.name_ru}
                onChange={(e) => setRewardForm({ ...rewardForm, name_ru: e.target.value })}
                placeholder="напр. Пойти за мороженым"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-bold outline-none focus:border-primary"
              />
            </label>

            <button
              type="button"
              onClick={() =>
                setRewardForm({
                  name: "Money",
                  name_ru: "Деньги",
                  emoji: "💵",
                  cost: 0,
                  active: true,
                })
              }
              className="mt-3 w-full rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left"
            >
              <div className="text-sm font-extrabold">{tr("moneyPreset")}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{tr("moneyPresetHint")}</div>
            </button>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">{tr("rewardEmoji")}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {[
                  "🎁", "🍦", "🍕", "📱", "🎬", "🌙", "🧸", "🛝", "🎮", "🍭",
                  "🎨", "⚽", "💵", "💰", "💸", "🤑", "🏆", "🥇", "🎯", "🎟️",
                  "🎪", "🎢", "🎡", "🎠", "🎳", "🏊", "🚴", "🛼", "🛹", "🏓",
                  "🎾", "🏀", "🏈", "⚾", "🏐", "🎸", "🎹", "🥁", "🎤", "🎧",
                  "📚", "✏️", "🖍️", "🧩", "🪁", "🪀", "🎲", "♟️", "🎰", "🃏",
                  "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫",
                  "🍬", "🍡", "🍨", "🍧", "🍇", "🍓", "🍎", "🍌", "🍉", "🥑",
                  "🚲", "🛴", "🏕️", "🏖️", "🎢", "🎆", "🎇", "🌠", "🦸", "🦄",
                ].map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setRewardForm({ ...rewardForm, emoji: e })}
                    className={`h-10 w-10 rounded-xl text-xl ${
                      rewardForm.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">
                {tr("cost")}:{" "}
                <span className="text-coin">
                  🪙 {rewardForm.cost === 0 ? tr("allCoins") : rewardForm.cost}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={500}
                step={5}
                value={rewardForm.cost}
                onChange={(e) => setRewardForm({ ...rewardForm, cost: Number(e.target.value) })}
                className="mt-2 w-full accent-[color:var(--color-primary)]"
              />
            </label>

            <label className="mt-3 flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={rewardForm.active}
                onChange={(e) => setRewardForm({ ...rewardForm, active: e.target.checked })}
              />
              {tr("active")}
            </label>

            <div className="mt-5 flex gap-2">
              {editingReward && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm("Delete this reward?")) return;
                    deleteReward.mutate(editingReward.id, {
                      onSuccess: () => {
                        toast.success("Reward deleted");
                        setRewardModal(false);
                      },
                    });
                  }}
                  className="rounded-full bg-destructive/10 px-4 py-2.5 text-sm font-extrabold text-destructive"
                >
                  {tr("delete")}
                </button>
              )}
              <button
                type="submit"
                disabled={addReward.isPending || updateReward.isPending}
                className="flex-1 rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
              >
                {addReward.isPending || updateReward.isPending
                  ? tr("saving")
                  : editingReward
                    ? tr("saveChanges")
                    : tr("addReward")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================

function FamilyPane({
  kids,
  onAdd,
  onDelete,
  onRegenPin,
}: {
  kids: import("@/lib/app-store").Profile[];
  onAdd: () => void;
  onDelete: (id: string, name: string) => void;
  onRegenPin: (id: string, name: string) => void;
}) {
  const tr = useT();
  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
          {tr("familyCount")(kids.length)}
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press"
        >
          <UserPlus className="h-4 w-4" /> {tr("addChild")}
        </button>
      </div>

      {kids.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {tr("noChildren")}
        </p>
      )}

      <div className="space-y-2">
        {kids.map((k) => (
          <div
            key={k.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
              {k.emoji ?? "🙂"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-extrabold">{k.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <KeyRound className="h-3 w-3" />
                <span className="font-mono tracking-[0.3em] text-foreground">
                  {k.pin_code ?? "— —"}
                </span>
                <span>🔥 {k.streak_count}</span>
              </div>
            </div>
            <button
              onClick={() => onRegenPin(k.id, k.name)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="New PIN"
              title="Generate new PIN"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(k.id, k.name)}
              className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
              aria-label="Remove child"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewPane({
  items,
  loading,
  kidById,
  onDispute,
}: {
  items: import("@/lib/app-store").ReviewItem[];
  loading: boolean;
  kidById: Record<string, { name: string; emoji: string | null }>;
  onDispute: (id: string) => void;
}) {
  const tr = useT();
  const { lang } = useLang();
  return (
    <div className="mt-4 space-y-2">
      <h2 className="mb-1 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
        {tr("recentCompletions")}
      </h2>
      {loading && <p className="text-sm text-muted-foreground">{tr("loading")}</p>}
      {!loading && items.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {tr("noCompletionsYet")}
        </p>
      )}
      {items.map((it) => {
        const k = kidById[it.kid_id];
        const cat = it.task?.category;
        const token = cat ? categoryToken(cat) : "primary";
        return (
          <div
            key={it.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{
                backgroundColor: cat
                  ? `color-mix(in oklab, var(--${token}) 22%, white)`
                  : undefined,
              }}
            >
              {cat ? CATEGORY_EMOJI[cat] : "✅"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">
                {it.task ? localizedTaskTitle(it.task, lang) : "Deleted quest"}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {k?.emoji ?? "🙂"} {k?.name ?? "?"} · 🪙 {it.coins_awarded} ·{" "}
                {new Date(it.created_at).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => onDispute(it.id)}
              className="rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-extrabold text-destructive"
            >
              {tr("dispute")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
