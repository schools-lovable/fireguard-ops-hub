import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ loading: false, error: null as Error | null, workspace: undefined as any, search: "", success: false, refetch: vi.fn(), callbacks: [] as Array<(() => void) | undefined> }));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/components/FireGuardUI", async importOriginal => {
  const actual = await importOriginal<typeof import("@/components/FireGuardUI")>();
  return {
    ...actual,
    useLoadSuccessCue: () => state.success ? "visible" : "hidden",
    CorePageState: (props: React.ComponentProps<typeof actual.CorePageState>) => {
      state.callbacks.push(props.onAction);
      return actual.CorePageState(props);
    },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));
vi.mock("@/hooks/useFireguardData", () => ({
  useFireguardWorkspace: () => ({ data: state.workspace, isLoading: state.loading, error: state.error, refetch: state.refetch }),
  useFireguardPermissions: () => ({ data: { role: "manager", canReviewEvidence: true, canPerformFieldWork: true, canManageOperations: true } }),
  formatOperationalDate: () => "Not scheduled",
}));
vi.mock("@/lib/trpc", () => {
  const mutation = { mutate: vi.fn(), isPending: false };
  return { trpc: {
    useUtils: () => ({ fireguard: { workspace: { invalidate: vi.fn() }, notifications: { list: { invalidate: vi.fn() } } } }),
    fireguard: { workOrders: { start: { useMutation: () => mutation }, submitForReview: { useMutation: () => mutation }, approve: { useMutation: () => mutation } }, exceptions: { acknowledge: { useMutation: () => mutation } } },
  } };
});

import Dashboard from "./Dashboard";
import Clients from "./Clients";
import Service from "./Service";
import Reviews from "./Reviews";
import Exceptions from "./Exceptions";

const pages = [
  ["overview", Dashboard, "Loading live operations", "Operations workspace unavailable"],
  ["clients", Clients, "Loading client portfolio", "Client records unavailable"],
  ["service", Service, "Loading scheduled work", "Work orders unavailable"],
  ["reviews", Reviews, "Loading evidence queue", "Evidence records unavailable"],
  ["exceptions", Exceptions, "Loading exception queue", "Exception records unavailable"],
] as const;

const emptyWorkspace = {
  isDemo: false,
  clients: [], sites: [], workOrders: [], exceptions: [],
  metrics: { openExceptionCount: 0, overdueExceptionCount: 0, siteCount: 0, readySiteCount: 0, completedWorkOrders: 0 },
};

describe("core operational page states", () => {
  it("renders each core page through the shared accessible loading and recoverable error treatments", () => {
    (globalThis as { window?: unknown }).window = { location: { search: state.search } };
    state.success = false; state.loading = true; state.error = null; state.workspace = undefined;
    pages.forEach(([, Page, loadingCopy]) => expect(renderToStaticMarkup(<Page />)).toContain(loadingCopy));
    state.loading = false; state.error = new Error("network unavailable");
    pages.forEach(([, Page, , errorCopy]) => {
      const markup = renderToStaticMarkup(<Page />);
      expect(markup).toContain(errorCopy);
      expect(markup).toContain("Try again");
    });
  });

  it("renders the empty operational paths without changing data", () => {
    (globalThis as { window?: unknown }).window = { location: { search: "?status=resolved" } };
    state.success = false; state.loading = false; state.error = null; state.workspace = emptyWorkspace;
    expect(renderToStaticMarkup(<Dashboard />)).toContain("No client, site, work-order, or exception records are available yet.");
    expect(renderToStaticMarkup(<Clients />)).toContain("No matching clients");
    expect(renderToStaticMarkup(<Service />)).toContain("No work orders in this view");
    expect(renderToStaticMarkup(<Reviews />)).toContain("Review queue clear");
    expect(renderToStaticMarkup(<Exceptions />)).toContain("No exceptions in this view");
  });

  it("renders each page’s visible success cue after its workspace load resolves", () => {
    (globalThis as { window?: unknown }).window = { location: { search: "" } };
    state.success = true; state.loading = false; state.error = null; state.workspace = emptyWorkspace;
    const labels = ["Operations live", "Client portfolio ready", "Service schedule ready", "Review queue ready", "Exception queue ready"];
    pages.forEach(([, Page], index) => expect(renderToStaticMarkup(<Page />)).toContain(labels[index]));
    state.success = false;
  });

  it("binds each rendered error retry action to the supplied workspace refetch without changing records", () => {
    (globalThis as { window?: unknown }).window = { location: { search: "" } };
    state.success = false; state.loading = false; state.error = new Error("network unavailable"); state.workspace = undefined;
    pages.forEach(([, Page]) => {
      state.refetch.mockClear();
      state.callbacks.length = 0;
      renderToStaticMarkup(<Page />);
      state.callbacks.at(-1)?.();
      expect(state.refetch).toHaveBeenCalledOnce();
    });
  });
});
