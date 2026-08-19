import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { lookupKidEmailByPinFn } from "@/lib/kids.functions";
import { LanguageToggle, useT } from "@/lib/i18n";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Capacitor } from "@capacitor/core";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Kids Day" },
      { name: "description", content: "Sign in to Kids Day." },
    ],
  }),
  component: AuthPage,
});

type Mode = "parent" | "kid";

function AuthPage() {
  const navigate = useNavigate();
  const t = useT();

  const [mode, setMode] = useState<Mode>("parent");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      SocialLogin.initialize({
        google: {
          iOSClientId: "@secret:GOOGLE_OAUTH_CLIENT_ID",
          iOSServerClientId: "@secret:GOOGLE_OAUTH_CLIENT_ID",
          mode: "online",
        },
      });
    }
  }, []);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpSent(true);
      toast.success(t("codeSent"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "email" });
      if (error) throw error;
      toast.success(t("welcomeBack"));
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const kidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!/^\d{6}$/.test(pin)) throw new Error("Enter your 6-digit PIN");
      const { email: kidEmail, name: kidName } = await lookupKidEmailByPinFn({
        data: { pin },
      });
      const { error } = await supabase.auth.signInWithPassword({
        email: kidEmail,
        password: pin,
      });
      if (error) throw error;
      toast.success(`Hi ${kidName}! 🎉`);
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      if (Capacitor.getPlatform() === "ios") {
        const res = await SocialLogin.login({
          provider: "google",
          options: { scopes: ["email", "profile"] },
        });
        const idToken = res.result.idToken;
        if (!idToken) throw new Error("No ID token from Google");
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) throw error;
        toast.success("Welcome!");
        navigate({ to: "/" });
      } else {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          toast.error(result.error.message ?? "Google sign-in failed");
        } else if (!result.redirected) {
          navigate({ to: "/" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const apple = async () => {
    setBusy(true);
    try {
      const result = await SignInWithApple.authorize({
        clientId: "com.sharapievazh.kidsday",
        redirectURI: window.location.origin,
        scopes: "email name",
      });
      const { identityToken, givenName, familyName } = result.response;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });
      if (error) throw error;
      const fullName = [givenName, familyName].filter(Boolean).join(" ");
      if (fullName) {
        await supabase.auth.updateUser({ data: { name: fullName } });
      }
      toast.success("Welcome!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apple sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end">
          <LanguageToggle />
        </div>
        <div className="text-center">
          <img src="/favicon.png" alt="" className="mx-auto h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="mt-3 text-2xl font-extrabold">
            {mode === "kid" ? t("loginAsKidTitle") : t("continueTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "kid" ? t("enterPin") : otpSent ? t("enterCode") : t("appTagline")}
          </p>
        </div>

        {/* Mode switcher: parent vs kid */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("parent")}
            className={`rounded-full py-2 text-sm font-extrabold ${
              mode !== "kid" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            👤 {t("parent")}
          </button>
          <button
            type="button"
            onClick={() => setMode("kid")}
            className={`rounded-full py-2 text-sm font-extrabold ${
              mode === "kid" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            🧒 {t("loginAsKid")}
          </button>
        </div>

        <p className="mt-3 text-center text-xs font-bold text-muted-foreground">{t("roleHint")}</p>

        {mode !== "kid" && !otpSent && (
          <button
            onClick={google}
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card py-3 font-extrabold transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <GoogleIcon /> {t("continueWithGoogle")}
          </button>
        )}

        {mode !== "kid" && !otpSent && Capacitor.getPlatform() === "ios" && (
          <button
            onClick={apple}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-black py-3 font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            Войти через Apple
          </button>
        )}

        {mode !== "kid" && !otpSent && (
          <div className="my-5 flex items-center gap-3 text-xs font-bold text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t("or")}{" "}
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        {mode === "kid" ? (
          <form onSubmit={kidSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">{t("pin")}</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                required
                placeholder="••••••"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.6em] outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
            >
              {busy ? t("pleaseWait") : t("enter")}
            </button>
          </form>
        ) : otpSent ? (
          <form onSubmit={verifyCode} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">{t("enterCode")}</span>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                required
                placeholder="••••••"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.6em] outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
            >
              {busy ? t("pleaseWait") : t("signIn")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtpCode("");
              }}
              className="w-full text-center text-sm font-bold text-primary underline"
            >
              {t("changeEmail")}
            </button>
          </form>
        ) : (
          <form onSubmit={sendCode} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">{t("email")}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 font-bold outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-full bg-primary py-3 font-extrabold text-primary-foreground btn-chunky active:btn-chunky-press disabled:opacity-50"
            >
              {busy ? t("pleaseWait") : t("getCode")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
