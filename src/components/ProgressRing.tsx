export function ProgressRing({
  value,
  total,
  size = 180,
  stroke = 14,
  label,
}: {
  value: number;
  total: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const pct = total === 0 ? 0 : Math.min(1, value / total);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-muted)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.34,1.56,.64,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-extrabold text-foreground">
          {Math.round(pct * 100)}%
        </div>
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label ?? `${value}/${total}`}
        </div>
      </div>
    </div>
  );
}
