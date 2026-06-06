import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { AppGate } from "@/components/AppGate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl">🤔</div>
        <h1 className="mt-4 text-2xl font-extrabold">Page not found</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <div className="text-6xl">😵</div>
        <p className="mt-3 font-bold">Something went wrong.</p>
        <a href="/" className="mt-4 inline-block font-bold text-primary underline">
          Reload
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#2bb6ff" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Kids Day" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "Kids Day — Daily Tasks for Kids" },
      { name: "description", content: "Gamified daily task tracker for kids. Earn coins, build streaks, redeem rewards." },
      { property: "og:title", content: "Kids Day — Daily Tasks for Kids" },
      { name: "twitter:title", content: "Kids Day — Daily Tasks for Kids" },
      { property: "og:description", content: "Gamified daily task tracker for kids. Earn coins, build streaks, redeem rewards." },
      { name: "twitter:description", content: "Gamified daily task tracker for kids. Earn coins, build streaks, redeem rewards." },
      { property: "og:image", content: "https://kidsday.lovable.app/icon-512.png" },
      { name: "twitter:image", content: "https://kidsday.lovable.app/icon-512.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppGate>
        <div className="mx-auto min-h-screen max-w-md pb-24">
          <Outlet />
        </div>
        <RoleSwitcher />
        <Toaster position="top-center" richColors />
      </AppGate>
    </QueryClientProvider>
  );
}
