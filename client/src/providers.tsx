import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { FIREGUARD_DIRECT_ACCESS } from "@shared/accessMode";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { useState, type ReactNode } from "react";
import superjson from "superjson";

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  if (error.message !== UNAUTHED_ERR_MSG) return;
  if (!FIREGUARD_DIRECT_ACCESS) {
    void import("./const").then(({ startLogin }) => startLogin());
  }
};

function createQueryClient() {
  const queryClient = new QueryClient();

  queryClient.getQueryCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.query.state.error;
      redirectToLoginIfUnauthorized(error);
      console.error("[API Query Error]", error);
    }
  });

  queryClient.getMutationCache().subscribe(event => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.mutation.state.error;
      redirectToLoginIfUnauthorized(error);
      console.error("[API Mutation Error]", error);
    }
  });

  return queryClient;
}

function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        headers() {
          // Preview auto-login fallback: when the browser blocks iframe cookies,
          // the runtime mirrors the session into sessionStorage so it can be
          // forwarded as a Bearer token. The cookie flow still takes priority.
          try {
            const raw = sessionStorage.getItem("manus-cookie");
            if (raw) {
              const prefix = `${COOKIE_NAME}=`;
              const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
              const token = pair?.trim().slice(prefix.length);
              if (token) return { Authorization: `Bearer ${token}` };
            }
          } catch {
            // sessionStorage unavailable
          }
          return {};
        },
        fetch(input, init) {
          return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
        },
      }),
    ],
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(createTrpcClient);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
