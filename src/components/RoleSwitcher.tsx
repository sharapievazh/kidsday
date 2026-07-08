import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useKids, useParentProfile, useSession } from "@/lib/app-store";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle, useT } from "@/lib/i18n";

export function RoleSwitcher() {
  const { session } = useSession();
  const profileQ = useParentProfile(!!session);
  const kidsQ = useKids(profileQ.data?.id);
  const location = useLocation();
  const navigate = useNavigate();

  if (!session || location.pathname === "/auth") return null;

  const kids = kidsQ.data ?? [];
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex gap-1 rounded-full border border-border bg-card p-1 shadow-lg">
        {kids.map((k) => {
          const to = `/kid/${k.id}`;
          const active = location.pathname.startsWith(`/kid/${k.id}`);
          return (
            <button
              key={k.id}
              onClick={() => navigate({ to: "/kid/$kidId", params: { kidId: k.id } })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
                active
                  ? "bg-primary text-primary-foreground scale-105"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              aria-current={active ? "page" : undefined}
              data-href={to}
            >
              <span className="text-base">{k.emoji ?? "🙂"}</span>
              <span>{k.name}</span>
            </button>
          );
        })}
        <button
          onClick={() => navigate({ to: "/parent" })}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-all ${
            isActive("/parent")
              ? "bg-primary text-primary-foreground scale-105"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <span className="text-base">👤</span>
          <span>{useT()("parent")}</span>
        </button>
      </div>
    </div>
  );
}

export function TopBar({ title, rightSlot }: { title: string; rightSlot?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
      <Link to="/" className="text-lg font-extrabold tracking-tight">
        <img src="/favicon.png" alt="" className="inline-block h-6 w-6 rounded-md align-[-4px]" />{" "}
        <span className="text-primary">Kids Day</span>
      </Link>
      <div className="hidden text-sm font-bold text-muted-foreground sm:block">{title}</div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        {rightSlot}
        <SignOutButton />
      </div>
    </header>
  );
}

function SignOutButton() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const onClick = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <button
      onClick={onClick}
      className="rounded-full p-2 text-muted-foreground hover:bg-muted"
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
