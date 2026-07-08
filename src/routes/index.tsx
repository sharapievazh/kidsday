import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useParentProfile,
  useKids,
  useSession,
  useAllCompletions,
  usePurchases,
  coinsFor,
} from "@/lib/app-store";
import { LanguageToggle, useT } from "@/lib/i18n";

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
  const parent = profileQ.data;
  const kidsQ = useKids(parent?.id);
  const kids = kidsQ.data ?? [];
  const allIds = [...kids.map((k) => k.id), ...(parent ? [parent.id] : [])];
  const completionsQ = useAllCompletions(allIds);
  const purchasesQ = usePurchases(allIds);
  const navigate = useNavigate();
  const t = useT();

  const loading = profileQ.isLoading || kidsQ.isLoading;

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex justify-end">
        <LanguageToggle />
      </div>
      <div className="mt-2 text-center">
        <img
          src="/favicon.png"
          alt="Kids Day"
          className="mx-auto h-20 w-20 rounded-2xl shadow-lg"
        />
        <h1 className="mt-3 text-3xl font-extrabold">Kids Day</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dailyQuestsTagline")}</p>
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t("whosPlaying")}
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
                    🔥 {k.streak_count} {t("dayStreak")} · 🪙 {coins}
                  </div>
                </div>
                <div className="text-2xl">→</div>
              </button>
            );
          })}

        {!loading && parent && (
          <button
            onClick={() => navigate({ to: "/kid/$kidId", params: { kidId: parent.id } })}
            className="flex w-full items-center gap-4 rounded-3xl border-2 border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
              style={{
                backgroundColor: `color-mix(in oklab, ${parent.color ?? "var(--primary)"} 20%, white)`,
              }}
            >
              {parent.emoji ?? "👤"}
            </div>
            <div className="flex-1">
              <div className="text-xl font-extrabold">{t("myself")}</div>
              <div className="text-sm font-bold text-muted-foreground">
                🔥 {parent.streak_count} {t("dayStreak")} · 🪙{" "}
                {coinsFor(parent.id, completionsQ.data ?? [], purchasesQ.data ?? [])}
              </div>
            </div>
            <div className="text-2xl">→</div>
          </button>
        )}


        <Link
          to="/parent"
          className="mt-6 flex items-center gap-4 rounded-3xl border-2 border-dashed border-border bg-muted/40 p-4 transition-all hover:border-foreground/30"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-3xl">
            👤
          </div>
          <div className="flex-1">
            <div className="text-lg font-extrabold">{t("parent")}</div>
            <div className="text-sm font-bold text-muted-foreground">{t("manageTasksApprove")}</div>
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
