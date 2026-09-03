// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const workspace = {
  isDemo: true,
  sites: [{ name: "Kigali Operations Centre", nextInspectionAt: new Date("2026-08-30T08:00:00Z") }],
  workOrders: [
    { id: 1, scheduledFor: new Date("2026-08-28T08:00:00Z"), evidenceProgress: 48, status: "in_progress" as const },
    { id: 2, scheduledFor: new Date("2026-08-29T08:00:00Z"), evidenceProgress: 100, status: "complete" as const },
  ],
  exceptions: [],
  metrics: { siteCount: 4, readySiteCount: 3, openExceptionCount: 1, overdueExceptionCount: 0, completedWorkOrders: 1 },
};

vi.mock("wouter", () => ({ Link: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>, useLocation: () => ["/", vi.fn()] }));
vi.mock("@/hooks/useFireguardData", () => ({ formatOperationalDate: () => "Aug 30", useFireguardPermissions: () => ({ data: { role: "manager", canManageOperations: true } }), useFireguardWorkspace: () => ({ data: workspace, isLoading: false, error: null, refetch: vi.fn() }) }));
vi.mock("@/lib/workspaceHealth", () => ({ getWorkspaceHealth: () => ({ isEmpty: false, demoCount: 1, totalCount: 7, items: [] }) }));
vi.mock("@/lib/whatChanged", () => ({ getWhatChanged: () => [], getWhatChangedEmptyCopy: () => "No updates" }));
vi.mock("@/lib/trpc", () => ({ trpc: { fireguard: { reports: { generate: { useMutation: () => ({ mutate: vi.fn() }) } } } } }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import Dashboard from "./Dashboard";
import Reports from "./Reports";

afterEach(cleanup);

describe.each([{ viewport: "desktop", width: 1440 }, { viewport: "tablet", width: 1024 }, { viewport: "mobile", width: 390 }])("graph cards at $viewport width", ({ width }) => {
  beforeEach(() => Object.defineProperty(window, "innerWidth", { configurable: true, value: width }));

  it("keeps every Overview visualization card and its live labels mounted", () => {
    const { container } = render(<Dashboard />);
    expect(container.querySelectorAll(".chart-card")).toHaveLength(4);
    expect(screen.getByLabelText("Scheduled work-order volume by date")).toBeTruthy();
    expect(screen.getByLabelText("Scheduled work evidence progress")).toBeTruthy();
    expect(screen.getByLabelText("Live site readiness coverage")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ready: 3 of 4 sites, 75%" })).toBeTruthy();
  });

  it("keeps the Reports status visualization and its live status labels mounted", () => {
    const { container } = render(<Reports />);
    expect(container.querySelectorAll(".chart-card")).toHaveLength(1);
    expect(screen.getByLabelText("Live work-order status distribution")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Complete: 1, 1 live work order" })).toBeTruthy();
  });
});
