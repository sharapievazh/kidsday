import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp, KIDS } from "@/lib/app-store";

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
  const { setRole, coinsFor, state } = useApp();
  return (
    <div className="px-5 pt-10 pb-10">
      <div className="text-center">
        <img src="/favicon.png" alt="Kids Day" className="mx-auto h-20 w-20 rounded-2xl shadow-lg" />
        <h1 className="mt-3 text-3xl font-extrabold">Kids Day</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily quests, streaks, and rewards.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Who's playing?
        </p>
        {(["rosa", "brother"] as const).map((id) => {
          const k = KIDS[id];
          return (
            <Link
              key={id}
              to="/kid/$kidId"
              params={{ kidId: id }}
              onClick={() => setRole(id)}
              className="flex items-center gap-4 rounded-3xl border-2 border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
                style={{ backgroundColor: `color-mix(in oklab, ${k.color} 20%, white)` }}
              >
                {k.emoji}
              </div>
              <div className="flex-1">
                <div className="text-xl font-extrabold">{k.name}</div>
                <div className="text-sm font-bold text-muted-foreground">
                  🔥 {state.streaks[id].count} day streak · 🪙 {coinsFor(id)}
                </div>
              </div>
              <div className="text-2xl">→</div>
            </Link>
          );
        })}

        <Link
          to="/parent"
          onClick={() => setRole("parent")}
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
