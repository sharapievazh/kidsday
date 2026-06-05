import { useApp, KIDS, type Role } from "@/lib/app-store";
import { Link, useNavigate } from "@tanstack/react-router";

const ROLES: { id: Role; label: string; emoji: string; to: string }[] = [
  { id: "rosa", label: "Rosa", emoji: "🌸", to: "/kid/rosa" },
  { id: "brother", label: "Brother", emoji: "🦊", to: "/kid/brother" },
  { id: "parent", label: "Parent", emoji: "👤", to: "/parent" },
];

export function RoleSwitcher() {
  const { state, setRole } = useApp();
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex gap-1 rounded-full border border-border bg-card p-1 shadow-lg">
        {ROLES.map((r) => {
          const active = state.role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => {
                setRole(r.id);
                navigate({ to: r.to });
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
                active
                  ? "bg-primary text-primary-foreground scale-105"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="text-base">{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TopBar({
  title,
  rightSlot,
}: {
  title: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
      <Link to="/" className="text-xl font-extrabold tracking-tight">
        🎯 <span className="text-primary">QuestKids</span>
      </Link>
      <div className="text-sm font-bold text-muted-foreground">{title}</div>
      <div>{rightSlot}</div>
    </header>
  );
}

export { KIDS };
