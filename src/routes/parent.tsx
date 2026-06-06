import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X, UserPlus, RefreshCw, KeyRound } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  SCHEDULE_LABEL,
  WEEKDAYS,
  categoryToken,
  coinsFor,
  generateRandomPin,
  useAddTask,
  useAllCompletions,
  useCreateKid,
  useDeleteKid,
  useDeleteTask,
  useDisputeCompletion,
  useFamilyCompletionsRealtime,
  useKids,
  useMarkDelivered,
  useParentProfile,
  usePurchases,
  useRegeneratePin,
  useReviewFeed,
  useSession,
  useTasks,
  useUpdateTask,
  type Category,
  type Frequency,
  type ScheduleType,
  type Task,
} from "@/lib/app-store";
import { TopBar } from "@/components/RoleSwitcher";

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

type FormState = {
  title: string;
  category: Category;
  assignee_id: string;
  coins: number;
  frequency: Frequency;
  days_of_week: number[];
  schedule_type: ScheduleType;
};

function ParentPage() {
  const { session } = useSession();
  const profileQ = useParentProfile(!!session);
  const parentId = profileQ.data?.id;
  const kidsQ = useKids(parentId);
  const tasksQ = useTasks(parentId);
  const kids = kidsQ.data ?? [];
  const kidIds = useMemo(() => kids.map((k) => k.id), [kids]);
  const completionsQ = useAllCompletions(kidIds);
  const purchasesQ = usePurchases(kidIds);
  const reviewQ = useReviewFeed(kidIds);

  useFamilyCompletionsRealtime(kidIds);

  const addTask = useAddTask(parentId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const markDelivered = useMarkDelivered();
  const createKid = useCreateKid();
  const deleteKid = useDeleteKid();
  const regenPin = useRegeneratePin();
  const disputeCompletion = useDisputeCompletion();

  const tasks = tasksQ.data ?? [];
  const purchases = purchasesQ.data ?? [];

  const [tab, setTab] = useState<ParentTab>("tasks");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<string>("all");

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
    category: "Hygiene",
    assignee_id: defaultAssignee,
    coins: 5,
    frequency: "daily",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    schedule_type: "always",
  };
  const [form, setForm] = useState<FormState>(blank);

  const openCreate = () => {
    setForm({ ...blank, assignee_id: defaultAssignee });
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
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
    if (!form.title.trim()) return toast.error("Title required");
    if (!form.assignee_id) return toast.error("Pick an assignee");
    if (form.days_of_week.length === 0) return toast.error("Pick at least one day");
    if (editing) {
      updateTask.mutate(
        { id: editing.id, patch: form },
        {
          onSuccess: () => {
            toast.success("Quest updated");
            close();
          },
          onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
        },
      );
    } else {
      addTask.mutate(form, {
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
  const kidById = Object.fromEntries(kids.map((k) => [k.id, k] as const));


  return (
    <div>
      <TopBar title="Parent" />
      <div className="px-4 pt-4">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-success p-5 text-primary-foreground shadow">
          <div className="text-xs font-bold uppercase tracking-widest opacity-80">
            Welcome back
          </div>
          <h1 className="mt-1 text-2xl font-extrabold">Parent Dashboard</h1>
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
              { id: "tasks", label: "Tasks", badge: 0 },
              { id: "family", label: "Family", badge: 0 },
              { id: "review", label: "Review", badge: newReviewCount },
              { id: "approvals", label: "Rewards", badge: pending.length },
            ] as { id: ParentTab; label: string; badge: number }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-full py-2 text-xs font-extrabold ${
                tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-extrabold text-destructive-foreground shadow">
                  {t.badge > 99 ? "99+" : t.badge}
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
                  All
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
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press"
              >
                <Plus className="h-4 w-4" /> New
              </button>
            </div>

            <div className="space-y-2">
              {tasksQ.isLoading && (
                <p className="text-center text-sm text-muted-foreground">Loading tasks…</p>
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
                      <div className="truncate font-bold">{t.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-white"
                          style={{ backgroundColor: `var(--${token})` }}
                        >
                          {t.category}
                        </span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5">
                          {assignee?.emoji ?? "🙂"} {assignee?.name ?? "?"}
                        </span>
                        <span className="rounded-full bg-muted px-1.5 py-0.5">{t.frequency}</span>
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
                  No quests. Tap "New" to create one.
                </p>
              )}
            </div>
          </div>
        ) : tab === "approvals" ? (
          <div className="mt-4 space-y-2">
            <h2 className="mb-1 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              Pending ({pending.length})
            </h2>
            {purchasesQ.isLoading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {!purchasesQ.isLoading && pending.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No pending rewards. 🎉
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
                      {p.reward?.emoji ?? "🎁"} {p.reward?.name ?? "Reward"}
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
                    Deliver
                  </button>
                </div>
              );
            })}

            <h2 className="mt-6 mb-1 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
              Delivered
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
                        {p.reward?.emoji ?? "🎁"} {p.reward?.name ?? "Reward"}
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
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-xs font-bold text-muted-foreground underline">
            ← Back to profiles
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
                {editing ? "Edit quest" : "New quest"}
              </h3>
              <button type="button" onClick={close} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Brush teeth"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-bold outline-none focus:border-primary"
                autoFocus
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">Category</span>
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
                      {CATEGORY_EMOJI[c]} {c}
                    </button>
                  );
                })}
              </div>
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">Assignee</span>
                <div className="mt-1 flex gap-1.5">
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
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-muted-foreground">Frequency</span>
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
                      {f}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-xs font-bold text-muted-foreground">
                Coin reward: <span className="text-coin">🪙 {form.coins}</span>
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
                  Delete
                </button>
              )}
              <button
                type="submit"
                disabled={addTask.isPending || updateTask.isPending}
                className="flex-1 rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
              >
                {addTask.isPending || updateTask.isPending
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create quest"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
