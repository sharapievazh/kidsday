import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useSession, useParentProfile, useSeedFamilyIfEmpty } from "@/lib/app-store";

export function AppGate({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const onAuthPage = location.pathname === "/auth";
  const hasSession = !!session;

  const profileQ = useParentProfile(hasSession);
  useSeedFamilyIfEmpty(profileQ.data ?? null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!hasSession && !onAuthPage) {
      navigate({ to: "/auth", replace: true });
    }
  }, [sessionLoading, hasSession, onAuthPage, navigate]);

  if (sessionLoading) return <Splash label="Loading…" />;
  if (!hasSession) {
    return onAuthPage ? <>{children}</> : <Splash label="Redirecting…" />;
  }
  if (profileQ.isLoading) return <Splash label="Loading your family…" />;
  if (profileQ.error) {
    return (
      <Splash
        label="Couldn't load profile"
        sub={profileQ.error instanceof Error ? profileQ.error.message : ""}
      />
    );
  }
  return <>{children}</>;
}

function Splash({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <img src="/favicon.png" alt="" className="h-16 w-16 animate-pulse rounded-2xl shadow" />
      <p className="font-extrabold">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
