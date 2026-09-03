import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../../server/routers";
import { resolveContextUser } from "../../../../../server/_core/context";

type CookieOptions = Record<string, unknown>;

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const parts = [`${name}=${value}`];
  const path = (options.path as string) ?? "/";
  parts.push(`Path=${path}`);
  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  }
  if (options.domain) parts.push(`Domain=${options.domain as string}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const raw = String(options.sameSite);
    parts.push(`SameSite=${raw.charAt(0).toUpperCase()}${raw.slice(1)}`);
  }
  return parts.join("; ");
}

async function handle({ request }: { request: Request }) {
  const setCookies: string[] = [];

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const url = new URL(request.url);
  const reqShim = {
    headers,
    url: url.pathname + url.search,
    protocol: url.protocol.replace(":", ""),
    secure: url.protocol === "https:",
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  };

  const resShim = {
    cookie(name: string, value: string, options: CookieOptions = {}) {
      setCookies.push(serializeCookie(name, value, options));
    },
    clearCookie(name: string, options: CookieOptions = {}) {
      setCookies.push(serializeCookie(name, "", { ...options, maxAge: 0 }));
    },
  };

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => ({
      req: reqShim as never,
      res: resShim as never,
      user: await resolveContextUser(reqShim as never),
    }),
  });

  if (setCookies.length === 0) return response;

  const outHeaders = new Headers(response.headers);
  for (const cookie of setCookies) outHeaders.append("set-cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outHeaders,
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
