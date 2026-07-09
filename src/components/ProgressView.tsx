import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  categoryToken,
  useAllCompletions,
  useTasks,
  type Category,
  type Task,
} from "@/lib/app-store";
import { useT } from "@/lib/i18n";

type Range = "month" | "year";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** ISO weekday 1..7 (Mon..Sun) */
function isoWeekday(d: Date): number {
  const w = d.getDay();
  return w === 0 ? 7 : w;
}

function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / ms);
}

/** Best streak in days across all completion dates. */
function computeBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniq = Array.from(new Set(dates)).sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < uniq.length; i++) {
    const diff = daysBetween(parseIso(uniq[i - 1]), parseIso(uniq[i]));
    if (diff === 1) {
      cur += 1;
      if (cur > best) best = cur;
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return best;
}

export function ProgressView({
  profileId,
  parentId,
}: {
  profileId: string;
  parentId: string | undefined;
}) {
  const t = useT();
  const [range, setRange] = useState<Range>("month");

  const completionsQ = useAllCompletions([profileId]);
  const tasksQ = useTasks(parentId);

  const allCompletions = completionsQ.data ?? [];
  const tasks = tasksQ.data ?? [];
  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of tasks) m.set(t.id, t);
    return m;
  }, [tasks]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const rangeStart = useMemo(() => {
    const d = new Date(today);
    if (range === "month") {
      d.setDate(d.getDate() - 29); // last 30 days incl today
    } else {
      d.setDate(d.getDate() - 364); // last 365 days incl today
    }
    return d;
  }, [range, today]);

  // Count completions per day within range.
  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    const startIso = toIsoDate(rangeStart);
    const endIso = toIsoDate(today);
    for (const c of allCompletions) {
      if (c.kid_id !== profileId) continue;
      if (c.completed_on < startIso || c.completed_on > endIso) continue;
      map.set(c.completed_on, (map.get(c.completed_on) ?? 0) + 1);
    }
    return map;
  }, [allCompletions, profileId, rangeStart, today]);

  const maxCount = useMemo(() => {
    let m = 0;
    countByDay.forEach((v) => {
      if (v > m) m = v;
    });
    return m;
  }, [countByDay]);

  // Category totals within range.
  const catTotals = useMemo(() => {
    const startIso = toIsoDate(rangeStart);
    const endIso = toIsoDate(today);
    const totals = new Map<Category, number>();
    for (const c of allCompletions) {
      if (c.kid_id !== profileId) continue;
      if (c.completed_on < startIso || c.completed_on > endIso) continue;
      const task = taskMap.get(c.task_id);
      if (!task) continue;
      totals.set(task.category, (totals.get(task.category) ?? 0) + 1);
    }
    return totals;
  }, [allCompletions, profileId, rangeStart, today, taskMap]);

  const totalInRange = useMemo(() => {
    let s = 0;
    catTotals.forEach((v) => (s += v));
    return s;
  }, [catTotals]);

  const catMax = useMemo(() => {
    let m = 0;
    catTotals.forEach((v) => {
      if (v > m) m = v;
    });
    return m;
  }, [catTotals]);

  const bestStreak = useMemo(
    () => computeBestStreak(allCompletions.filter((c) => c.kid_id === profileId).map((c) => c.completed_on)),
    [allCompletions, profileId],
  );

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Range toggle */}
      <div className="mb-4 flex gap-2 rounded-full bg-muted p-1">
        {(["month", "year"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 rounded-full py-2 text-sm font-extrabold transition-all ${
              range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {r === "month" ? t("rangeMonth") : t("rangeYear")}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard
          icon="✅"
          value={totalInRange}
          label={range === "month" ? t("completionsMonth") : t("completionsYear")}
          color="var(--primary)"
        />
        <StatCard
          icon="🏆"
          value={bestStreak}
          label={t("bestStreak")}
          color="var(--streak)"
        />
      </div>

      {/* Heatmap */}
      <section className="mb-6">
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          {t("heatmapTitle")}
        </h3>
        <Heatmap
          start={rangeStart}
          end={today}
          countByDay={countByDay}
          maxCount={maxCount}
        />
        <HeatLegend max={maxCount} labelLess={t("less")} labelMore={t("more")} />
      </section>

      {/* Category breakdown */}
      <section>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          {t("byCategory")}
        </h3>
        {totalInRange === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("noProgressYet")}
          </div>
        ) : (
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const v = catTotals.get(cat) ?? 0;
              const pct = catMax > 0 ? (v / catMax) * 100 : 0;
              const token = categoryToken(cat);
              return (
                <div key={cat} className="rounded-xl border border-border bg-card p-2.5">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-bold">
                      {CATEGORY_EMOJI[cat]} {t(`cat_${cat}`)}
                    </span>
                    <span className="font-extrabold tabular-nums text-muted-foreground">
                      {v}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `var(--${token})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
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
      className="rounded-2xl px-4 py-3"
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 15%, white)`,
        color: `color-mix(in oklab, ${color} 65%, black)`,
      }}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-extrabold leading-none">{value}</span>
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-75">
        {label}
      </div>
    </div>
  );
}

function heatColor(count: number, max: number): string {
  if (count <= 0 || max <= 0) return "var(--muted)";
  const ratio = count / max;
  // 4 intensity buckets like GitHub
  let pct = 25;
  if (ratio > 0.75) pct = 100;
  else if (ratio > 0.5) pct = 75;
  else if (ratio > 0.25) pct = 50;
  return `color-mix(in oklab, var(--primary) ${pct}%, var(--muted))`;
}

/**
 * GitHub-style grid: columns = weeks (Mon–Sun), rows = weekdays 1..7.
 * Range is inclusive of `start` and `end`. First column is padded so
 * weekdays line up.
 */
function Heatmap({
  start,
  end,
  countByDay,
  maxCount,
}: {
  start: Date;
  end: Date;
  countByDay: Map<string, number>;
  maxCount: number;
}) {
  const cells = useMemo(() => {
    // Snap first column to Monday of start's week.
    const firstColStart = new Date(start);
    const startWd = isoWeekday(start); // 1..7
    firstColStart.setDate(firstColStart.getDate() - (startWd - 1));

    const totalDays = daysBetween(firstColStart, end) + 1;
    const weeks: Array<Array<{ date: Date | null; iso: string | null }>> = [];
    let cursor = new Date(firstColStart);
    let weekIdx = 0;
    for (let i = 0; i < totalDays; i++) {
      if (i % 7 === 0) {
        weeks[weekIdx] = new Array(7).fill(null).map(() => ({ date: null, iso: null }));
      }
      const row = i % 7;
      const inRange = cursor >= start && cursor <= end;
      weeks[weekIdx][row] = inRange
        ? { date: new Date(cursor), iso: toIsoDate(cursor) }
        : { date: null, iso: null };
      cursor.setDate(cursor.getDate() + 1);
      if (i % 7 === 6) weekIdx += 1;
    }
    return weeks;
  }, [start, end]);

  // Month labels above columns where month changes.
  const monthLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { month: "short" });
    const labels: Array<string | null> = [];
    let lastMonth = -1;
    for (const week of cells) {
      const firstDay = week.find((c) => c.date)?.date ?? null;
      if (firstDay && firstDay.getMonth() !== lastMonth) {
        labels.push(fmt.format(firstDay));
        lastMonth = firstDay.getMonth();
      } else {
        labels.push(null);
      }
    }
    return labels;
  }, [cells]);

  const t = useT();
  const dayLabels = [t("wdMon"), t("wdWed"), t("wdFri")];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-[3px] pl-6 pb-1 text-[9px] font-bold text-muted-foreground">
          {monthLabels.map((m, i) => (
            <div key={i} className="w-[12px] text-center">
              {m ?? ""}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-[3px] pr-1 text-[9px] font-bold text-muted-foreground">
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="h-[12px] leading-[12px]">
                {row === 0 ? dayLabels[0] : row === 2 ? dayLabels[1] : row === 4 ? dayLabels[2] : ""}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {cells.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, ri) => {
                  if (!cell.iso || !cell.date) {
                    return <div key={ri} className="h-[12px] w-[12px]" />;
                  }
                  const count = countByDay.get(cell.iso) ?? 0;
                  return (
                    <div
                      key={ri}
                      title={`${cell.iso} · ${count}`}
                      className="h-[12px] w-[12px] rounded-[3px] border border-border/40"
                      style={{ backgroundColor: heatColor(count, maxCount) }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatLegend({
  max,
  labelLess,
  labelMore,
}: {
  max: number;
  labelLess: string;
  labelMore: string;
}) {
  const buckets = [0, Math.max(1, Math.round(max * 0.25)), Math.max(2, Math.round(max * 0.5)), Math.max(3, Math.round(max * 0.75)), Math.max(4, max)];
  return (
    <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-bold text-muted-foreground">
      <span>{labelLess}</span>
      {buckets.map((v, i) => (
        <div
          key={i}
          className="h-[10px] w-[10px] rounded-[2px] border border-border/40"
          style={{ backgroundColor: heatColor(v, Math.max(1, max)) }}
        />
      ))}
      <span>{labelMore}</span>
    </div>
  );
}
