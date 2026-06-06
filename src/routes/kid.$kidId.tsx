import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  useApp,
  KIDS,
  CATEGORIES,
  REWARDS,
  type KidId,
  categoryToken,
  CATEGORY_EMOJI,
} from "@/lib/app-store";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskItem } from "@/components/TaskItem";
import { TopBar } from "@/components/RoleSwitcher";

export const Route = createFileRoute("/kid/$kidId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.kidId === "rosa" ? "Rosa" : "Ansar"} — Kids Day` },
      { name: "description", content: "Your daily quests, coins and rewards." },
    ],
  }),
  beforeLoad: ({ params }) => {
    if (params.kidId !== "rosa" && params.kidId !== "brother") throw notFound();
  },
  component: KidPage,
});

function KidPage() {
  const { kidId } = Route.useParams();
  const id = kidId as KidId;
  const kid = KIDS[id];
  const { tasksFor, isDone, coinsFor, state, buyReward } = useApp();
  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");
  const navigate = useNavigate();

  const tasks = tasksFor(id);
  const done = tasks.filter((t) => isDone(t.id, id)).length;
  const coins = coinsFor(id);
  const streak = state.streaks[id].count;

  const grouped = useMemo(() => {
    return CATEGORIES.map((c) => ({
      cat: c,
      items: tasks.filter((t) => t.category === c),
    })).filter((g) => g.items.length > 0);
  }, [tasks]);

  const handleBuy = (rewardId: string) => {
    const r = REWARDS.find((x) => x.id === rewardId);
    if (!r) return;
    if (coins < r.cost) {
      toast.error(`Need ${r.cost - coins} more coins!`);
      return;
    }
    const ok = buyReward(id, r);
    if (ok) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      toast.success(`Reward unlocked: ${r.emoji} ${r.name}`);
    }
  };

  return (
    <div>
      <TopBar
        title={kid.name}
        rightSlot={
          <button
            onClick={() => navigate({ to: "/" })}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold"
          >
            Switch
          </button>
        }
      />

      {/* Stats bar */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <Stat icon="🔥" value={streak} label="streak" color="var(--streak)" />
        <div className="text-3xl">{kid.emoji}</div>
        <Stat icon="🪙" value={coins} label="coins" color="var(--coin)" />
      </div>

      {/* Progress hero */}
      <div className="flex flex-col items-center px-4 pt-4">
        <ProgressRing value={done} total={tasks.length} label={`${done}/${tasks.length} done`} />
        <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
          {done === tasks.length && tasks.length > 0
            ? "🎉 All quests complete! Amazing!"
            : `Keep going, ${kid.name}! ${tasks.length - done} quests left today.`}
        </p>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-20 mt-5 flex gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        {(["tasks", "rewards"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-extrabold transition-all ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "tasks" ? "🎯 Quests" : "🎁 Rewards"}
          </button>
        ))}
      </div>

      {tab === "tasks" ? (
        <div className="space-y-5 px-4 pt-4">
          {grouped.map(({ cat, items }) => {
            const token = categoryToken(cat);
            return (
              <section key={cat}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: `var(--${token})` }}
                  />
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                    {CATEGORY_EMOJI[cat]} {cat}
                  </h2>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <TaskItem key={t.id} task={t} kidId={id} />
                  ))}
                </div>
              </section>
            );
          })}
          {grouped.length === 0 && (
            <EmptyState
              emoji="✨"
              title="No quests yet"
              hint="Ask a parent to add quests for you."
            />
          )}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Reward Store</h2>
            <span className="rounded-full bg-coin/20 px-3 py-1 text-sm font-extrabold text-foreground">
              🪙 {coins}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {REWARDS.map((r) => {
              const can = coins >= r.cost;
              return (
                <button
                  key={r.id}
                  onClick={() => handleBuy(r.id)}
                  className={`flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                    can
                      ? "border-primary/40 bg-card hover:-translate-y-0.5"
                      : "border-border bg-muted/50 opacity-70"
                  }`}
                >
                  <div className="text-4xl">{r.emoji}</div>
                  <div className="mt-2 text-sm font-extrabold leading-tight">
                    {r.name}
                  </div>
                  <div
                    className={`mt-2 rounded-full px-3 py-1 text-xs font-extrabold ${
                      can ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    🪙 {r.cost}
                  </div>
                </button>
              );
            })}
          </div>

          <h3 className="mt-6 mb-2 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
            My purchases
          </h3>
          <div className="space-y-2">
            {state.purchases.filter((p) => p.kidId === id).length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing yet — start saving!</p>
            )}
            {state.purchases
              .filter((p) => p.kidId === id)
              .slice()
              .reverse()
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
                >
                  <div className="text-sm font-bold">{p.rewardName}</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                      p.delivered
                        ? "bg-success/20 text-success"
                        : "bg-streak/20 text-streak"
                    }`}
                  >
                    {p.delivered ? "Delivered" : "Pending"}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className="text-xs font-bold text-muted-foreground underline">
          ← Back to profiles
        </Link>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-full px-4 py-2 font-extrabold"
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 18%, white)`,
        color: `color-mix(in oklab, ${color} 60%, black)`,
      }}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-lg leading-none">{value}</span>
      <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
}

function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
      <div className="text-4xl">{emoji}</div>
      <p className="mt-2 font-extrabold">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
