import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  CATEGORIES,
  categoryToken,
  CATEGORY_EMOJI,
  coinsFor,
  isTaskActiveToday,
  useAllCompletions,
  useBuyReward,
  useKid,
  useParentProfile,
  usePurchases,
  useRewards,
  useSession,
  useTasks,
  useTodayCompletions,
  localizedRewardName,
  isMoneyReward,
  rewardRubles,
} from "@/lib/app-store";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskItem } from "@/components/TaskItem";
import { TopBar } from "@/components/RoleSwitcher";
import { useLang, useT } from "@/lib/i18n";

export const Route = createFileRoute("/kid/$kidId")({
  head: () => ({
    meta: [
      { title: "Kid — Kids Day" },
      { name: "description", content: "Your daily quests, coins and rewards." },
    ],
  }),
  component: KidPage,
});

function KidPage() {
  const tr = useT();
  const { lang } = useLang();
  const { kidId } = Route.useParams();
  const { session } = useSession();
  const profileQ = useParentProfile(!!session);
  const parentId = profileQ.data?.id;

  const kidQ = useKid(kidId);
  const tasksQ = useTasks(parentId);
  const completionsQ = useTodayCompletions(kidId);
  const allCompletionsQ = useAllCompletions([kidId]);
  const rewardsQ = useRewards(parentId);
  const purchasesQ = usePurchases([kidId]);
  const buy = useBuyReward();

  const [tab, setTab] = useState<"tasks" | "rewards">("tasks");
  const navigate = useNavigate();

  if (kidQ.isLoading || tasksQ.isLoading) {
    return <LoadingScreen />;
  }
  if (kidQ.error || !kidQ.data) throw notFound();
  const kid = kidQ.data;

  const allTasks = (tasksQ.data ?? [])
    .filter((t) => t.assignee_id === kidId)
    .filter((t) => isTaskActiveToday(t));
  const todayDone = new Set((completionsQ.data ?? []).map((c) => c.task_id));
  const done = allTasks.filter((t) => todayDone.has(t.id)).length;
  const coins = coinsFor(kidId, allCompletionsQ.data ?? [], purchasesQ.data ?? []);
  const streak = kid.streak_count ?? 0;

  const grouped = CATEGORIES.map((c) => ({
    cat: c,
    items: allTasks.filter((t) => t.category === c),
  })).filter((g) => g.items.length > 0);

  const handleBuy = (rewardId: string) => {
    const r = (rewardsQ.data ?? []).find((x) => x.id === rewardId);
    if (!r) return;
    if (coins < r.cost) {
      toast.error(tr("needMoreCoins")(r.cost - coins));
      return;
    }
    buy.mutate(
      { reward: r, kidId },
      {
        onSuccess: () => {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
          toast.success(
            `${tr("rewardUnlocked")}: ${r.emoji ?? "🎁"} ${localizedRewardName(r, lang)}`,
          );
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not buy"),
      },
    );
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
            {tr("switch")}
          </button>
        }
      />

      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <Stat icon="🔥" value={streak} label={tr("streak")} color="var(--streak)" />
        <div className="text-3xl">{kid.emoji ?? "🙂"}</div>
        <Stat icon="🪙" value={coins} label={tr("coins")} color="var(--coin)" />
      </div>

      <div className="flex flex-col items-center px-4 pt-4">
        <ProgressRing value={done} total={allTasks.length} label={`${done}/${allTasks.length}`} />
        <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
          {done === allTasks.length && allTasks.length > 0
            ? tr("allDone")
            : tr("keepGoing")(kid.name, allTasks.length - done)}
        </p>
      </div>

      <div className="sticky top-[57px] z-20 mt-5 flex gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        {(["tasks", "rewards"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-sm font-extrabold transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t === "tasks" ? tr("questsTab") : tr("rewardsTab")}
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
                    {CATEGORY_EMOJI[cat]} {tr(`cat_${cat}`)}
                  </h2>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <TaskItem key={t.id} task={t} kidId={kidId} done={todayDone.has(t.id)} />
                  ))}
                </div>
              </section>
            );
          })}
          {grouped.length === 0 && (
            <EmptyState emoji="✨" title={tr("noQuests")} hint={tr("noQuestsHint")} />
          )}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{tr("rewardStore")}</h2>
            <span className="rounded-full bg-coin/20 px-3 py-1 text-sm font-extrabold text-foreground">
              🪙 {coins}
            </span>
          </div>
          {rewardsQ.isLoading ? (
            <p className="text-sm text-muted-foreground">{tr("loading")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(rewardsQ.data ?? []).map((r) => {
                const can = coins >= r.cost;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleBuy(r.id)}
                    disabled={buy.isPending}
                    className={`flex flex-col items-center rounded-2xl border-2 p-3 text-center transition-all active:scale-95 ${
                      can
                        ? "border-primary/40 bg-card hover:-translate-y-0.5"
                        : "border-border bg-muted/50 opacity-70"
                    }`}
                  >
                    <div className="text-4xl">{r.emoji ?? "🎁"}</div>
                    <div className="mt-2 text-sm font-extrabold leading-tight">
                      {localizedRewardName(r, lang)}
                    </div>
                    <div
                      className={`mt-2 rounded-full px-3 py-1 text-xs font-extrabold ${
                        can
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isMoneyReward(r) ? `${rewardRubles(r)} ₽ · 🪙 ${r.cost}` : `🪙 ${r.cost}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <h3 className="mt-6 mb-2 text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
            {tr("myPurchases")}
          </h3>
          <div className="space-y-2">
            {(purchasesQ.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{tr("nothingYet")}</p>
            )}
            {(purchasesQ.data ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2"
              >
                <div className="text-sm font-bold">
                  {p.reward?.emoji ?? "🎁"}{" "}
                  {p.reward ? localizedRewardName(p.reward, lang) : "Reward"}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                    p.delivered ? "bg-success/20 text-success" : "bg-streak/20 text-streak"
                  }`}
                >
                  {p.delivered ? tr("delivered") : tr("pending")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className="text-xs font-bold text-muted-foreground underline">
          {tr("backToProfiles")}
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

function LoadingScreen() {
  const tr = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <img src="/favicon.png" alt="" className="h-12 w-12 animate-pulse rounded-2xl" />
      <p className="text-sm font-bold text-muted-foreground">{tr("loadingQuests")}</p>
    </div>
  );
}
