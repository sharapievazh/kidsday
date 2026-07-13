import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Allowed origins for /_serverFn/* CORS. These functions run privileged
// (service role) operations, so we NEVER use a wildcard origin.
const ALLOWED_SERVERFN_ORIGINS = new Set([
  "capacitor://localhost", // iOS Capacitor WebView
  "http://localhost", // Android Capacitor WebView
  "https://kidsday.lovable.app", // Published web app
]);

const SERVERFN_ALLOW_HEADERS = "content-type, accept, x-tsr-serverfn, authorization";
const SERVERFN_ALLOW_METHODS = "POST, OPTIONS";

function resolveServerFnCorsOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return ALLOWED_SERVERFN_ORIGINS.has(origin) ? origin : null;
}

function isServerFnRequest(request: Request): boolean {
  try {
    return new URL(request.url).pathname.startsWith("/_serverFn/");
  } catch {
    return false;
  }
}

function withServerFnCors(response: Response, allowOrigin: string | null): Response {
  if (!allowOrigin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.append("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const serverFn = isServerFnRequest(request);
    const allowOrigin = serverFn ? resolveServerFnCorsOrigin(request) : null;

    if (serverFn && request.method === "OPTIONS") {
      const headers = new Headers();
      if (allowOrigin) {
        headers.set("Access-Control-Allow-Origin", allowOrigin);
        headers.set("Vary", "Origin");
        headers.set("Access-Control-Allow-Methods", SERVERFN_ALLOW_METHODS);
        headers.set("Access-Control-Allow-Headers", SERVERFN_ALLOW_HEADERS);
        headers.set("Access-Control-Max-Age", "86400");
      }
      return new Response(null, { status: 204, headers });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return serverFn ? withServerFnCors(normalized, allowOrigin) : normalized;
    } catch (error) {
      console.error(error);
      const errorResponse = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return serverFn ? withServerFnCors(errorResponse, allowOrigin) : errorResponse;
    }
  },
};
