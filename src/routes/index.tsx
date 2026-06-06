import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useParentProfile,
  useKids,
  useSession,
  useAllCompletions,
  usePurchases,
  coinsFor,
} from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kids Day — Pick a profile" },
      { name: "description", content: "Choose a profile to start your daily quest." },
    ],
  }),
  component: Index,
});

function Index() {
  const { session } = useSession();
  const profileQ = useParentProfile(!!session);
  const kidsQ = useKids(profileQ.data?.id);
  const kids = kidsQ.data ?? [];
  const kidIds = kids.map((k) => k.id);
  const completionsQ = useAllCompletions(kidIds);
  const purchasesQ = usePurchases(kidIds);
  const navigate = useNavigate();

  const loading = profileQ.isLoading || kidsQ.isLoading;

  return (
    <div className="px-5 pt-10 pb-10">
      <div className="text-center">
        <img src="/favicon.png" alt="Kids Day" className="mx-auto h-20 w-20 rounded-2xl shadow-lg" />
        <h1 className="mt-3 text-3xl font-extrabold">Kids Day</h1>
        <p className="mt-1 text-sm text-muted-foreground">Daily quests, streaks, and rewards.</p>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Who's playing?
        </p>

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading &&
          kids.map((k) => {
            const coins = coinsFor(k.id, completionsQ.data ?? [], purchasesQ.data ?? []);
            return (
              <button
                key={k.id}
                onClick={() => navigate({ to: "/kid/$kidId", params: { kidId: k.id } })}
                className="flex w-full items-center gap-4 rounded-3xl border-2 border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${k.color ?? "var(--primary)"} 20%, white)`,
                  }}
                >
                  {k.emoji ?? "🙂"}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-extrabold">{k.name}</div>
                  <div className="text-sm font-bold text-muted-foreground">
                    🔥 {k.streak_count} day streak · 🪙 {coins}
                  </div>
                </div>
                <div className="text-2xl">→</div>
              </button>
            );
          })}

        <Link
          to="/parent"
          className="mt-6 flex items-center gap-4 rounded-3xl border-2 border-dashed border-border bg-muted/40 p-4 transition-all hover:border-foreground/30"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-3xl">
            👤
          </div>
          <div className="flex-1">
            <div className="text-lg font-extrabold">Parent</div>
            <div className="text-sm font-bold text-muted-foreground">
              Manage tasks & approve rewards
            </div>
          </div>
          <div className="text-2xl">→</div>
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-3xl border-2 border-border bg-card p-4">
      <div className="h-16 w-16 rounded-2xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}
