import { useState } from "react";
import confetti from "canvas-confetti";
import { Check } from "lucide-react";
import { categoryToken, CATEGORY_EMOJI, type Task, type KidId } from "@/lib/app-store";
import { useApp } from "@/lib/app-store";

export function TaskItem({ task, kidId }: { task: Task; kidId: KidId }) {
  const { toggleTask, isDone } = useApp();
  const done = isDone(task.id, kidId);
  const [floating, setFloating] = useState<number | null>(null);
  const token = categoryToken(task.category);

  const handle = () => {
    const res = toggleTask(task.id, kidId);
    if (res.added) {
      setFloating(res.coins);
      setTimeout(() => setFloating(null), 900);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#58cc02", "#ffc800", "#ff4b4b", "#1cb0f6", "#ce82ff"],
        disableForReducedMotion: true,
      });
    }
  };

  return (
    <button
      onClick={handle}
      className={`group relative flex w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left transition-all active:scale-[0.98] ${
        done ? "border-success/40 bg-success/5" : "border-border hover:border-foreground/20"
      }`}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
        style={{ backgroundColor: `color-mix(in oklab, var(--${token}) 22%, white)` }}
      >
        {CATEGORY_EMOJI[task.category]}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-bold ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {task.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-bold text-white"
            style={{ backgroundColor: `var(--${token})` }}
          >
            {task.category}
          </span>
          <span className="flex items-center gap-1 font-bold text-coin">
            🪙 +{task.coins}
          </span>
        </div>
      </div>
      <div
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          done
            ? "border-success bg-success text-success-foreground animate-pop"
            : "border-border bg-background group-hover:border-foreground/40"
        }`}
      >
        {done && <Check className="h-5 w-5" strokeWidth={3} />}
        {floating !== null && (
          <span className="animate-float-up pointer-events-none absolute -top-2 right-0 whitespace-nowrap text-sm font-extrabold text-coin">
            +{floating} 🪙
          </span>
        )}
      </div>
    </button>
  );
}
