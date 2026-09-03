import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ workspace: undefined as any, search: "" }));
vi.mock("wouter", () => ({ useLocation: () => ["/service", vi.fn()] }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() } }));
vi.mock("@/hooks/useFireguardData", () => ({
  useFireguardWorkspace: () => ({ data: state.workspace, isLoading: false, error: null, refetch: vi.fn() }),
  useFireguardPermissions: () => ({ data: { role: "manager", canReviewEvidence: true, canPerformFieldWork: true, canManageOperations: true } }),
  formatOperationalDate: (value: Date) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(value),
}));
vi.mock("@/lib/trpc", () => {
  const mutation = { mutate: vi.fn(), isPending: false };
  return {
    trpc: {
      useUtils: () => ({ fireguard: { workspace: { invalidate: vi.fn() } } }),
      fireguard: { workOrders: { start: { useMutation: () => mutation }, submitForReview: { useMutation: () => mutation }, approve: { useMutation: () => mutation } } },
    },
  };
});

import Service from "./Service";

describe("Service schedule table", () => {
  it("renders a time-ordered semantic table with the operational information required for each work order", () => {
    (globalThis as { window?: unknown }).window = { location: { search: state.search } };
    state.workspace = { isDemo: false, clients: [], sites: [], exceptions: [], metrics: {}, workOrders: [
      { id: 2, scheduledFor: new Date("2026-09-02T13:00:00Z"), title: "Later extinguisher service", clientName: "North client", siteName: "North site", status: "in_progress", evidenceProgress: 58 },
      { id: 1, scheduledFor: new Date("2026-09-01T09:00:00Z"), title: "Early alarm inspection", clientName: "South client", siteName: "South site", status: "awaiting_review", evidenceProgress: 92 },
    ] };
    const markup = renderToStaticMarkup(<Service />);
    expect(markup).toContain("Live FireGuard service work orders, ordered by scheduled time.");
    expect(markup).toContain("Work / site");
    expect(markup).toContain("Verified evidence");
    expect(markup).toContain("Inspect compliance for");
    expect(markup.indexOf("Early alarm inspection")).toBeLessThan(markup.indexOf("Later extinguisher service"));
  });

  it("includes mobile-readable data labels and retains role-aware actions in the schedule rows", () => {
    (globalThis as { window?: unknown }).window = { location: { search: state.search } };
    const markup = renderToStaticMarkup(<Service />);
    expect(markup).toContain('data-label="Scheduled"');
    expect(markup).toContain('data-label="Evidence"');
    expect(markup).toContain('data-label="Actions"');
    expect(markup).toContain("Approve");
    expect(markup).toContain("Submit");
    expect(markup).toContain("is-compact");
  });
});
