import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const routeState = vi.hoisted(() => ({ path: "/settings" }));

vi.mock("wouter", () => ({
  useLocation: () => [routeState.path, vi.fn()],
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/lib/trpc", () => {
  const mutation = { mutate: vi.fn(), isPending: false };
  const dashboard = {
    user: { name: "Test Operator", email: "operator@example.test" },
    profile: { employeeId: "FG-001", phone: "", title: "Operations manager", photoUrl: "", locations: ["Operations base"], employmentStatus: "active", hireDate: new Date("2025-01-01") },
    permissions: { role: "manager", grants: ["Workspace administration"] },
    certifications: [], timeEntries: [], openTimeEntry: null, upcomingShifts: [], audits: [],
    metrics: { weeklyHours: 0, completedWorkOrders: 0, completedLearning: 0 },
    preferences: { notifyAssignments: true, notifyExceptions: true, notifyLearning: true, language: "en-US", pinConfigured: false, pinUpdatedAt: null },
  };
  return {
    trpc: {
      useUtils: () => ({ fireguard: { profile: { dashboard: { invalidate: vi.fn() } } } }),
      fireguard: { profile: {
        dashboard: { useQuery: () => ({ data: dashboard, isLoading: false, error: null }) },
        updateIdentity: { useMutation: () => mutation }, updatePreferences: { useMutation: () => mutation }, resetPin: { useMutation: () => mutation },
        updateRole: { useMutation: () => mutation }, addCertification: { useMutation: () => mutation }, deleteCertification: { useMutation: () => mutation },
        clockIn: { useMutation: () => mutation }, clockOut: { useMutation: () => mutation },
      } },
    },
  };
});

import Profile from "./Profile";

describe("Profile delegated route headers", () => {
  it("renders route-specific Preferences and Access header copy through the routed Profile surface", () => {
    routeState.path = "/settings";
    const preferences = renderToStaticMarkup(<Profile />);
    expect(preferences).toContain("Personal preferences");
    expect(preferences).toContain("Choose how FireGuard delivers assignment, exception, and Academy prompts during your operational day.");

    routeState.path = "/settings/access";
    const access = renderToStaticMarkup(<Profile />);
    expect(access).toContain("Access controls");
    expect(access).toContain("Review your role, access-PIN status, and permission history without exposing protected credentials.");
  });
});
