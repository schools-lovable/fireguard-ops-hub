// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

const mocks = vi.hoisted(() => ({
  gps: { mutate: vi.fn(), isPending: false },
  manual: { mutate: vi.fn(), isPending: false },
  geocode: { mutate: vi.fn(), isPending: false },
  geocodeOptions: null as { onError?: (issue: { message: string }) => void } | null,
  invalidate: vi.fn(),
  siteDetail: { isIllustrative: true, evidence: [{ id: "evidence-1", imageUrl: "/manus-storage/demo.svg", alt: "Illustrative fire equipment station", title: "Equipment station check", caption: "Demonstration-only evidence card.", capturedLabel: "Illustrative evidence · Demo only" }], workOrders: [{ id: 24, title: "Annual alarm system test", workType: "Alarm system", status: "blocked" as const, evidenceProgress: 42, scheduledFor: new Date("2026-08-25"), dueAt: new Date("2026-08-26"), illustrativeHistory: [{ id: "planned", kind: "planned" as const, occurredAt: new Date("2026-08-23"), title: "Scope confirmed", detail: "Illustrative scope confirmation." }, { id: "exception", kind: "exception" as const, occurredAt: new Date("2026-08-24"), title: "Exception routed for action", detail: "Illustrative exception follow-up." }] }] },
}));

const sites = [{ id: 17, clientId: 3, clientName: "Riverside House", name: "Riverside House · East Wing", address: "18 Riverside Walk", readinessStatus: "review" as const, nextInspectionAt: new Date("2026-08-25"), latitude: -1.9441, longitude: 30.0619, locationSource: "gps_capture" as const, locationCapturedAt: new Date("2026-08-24"), locationAccuracyMeters: 12 }];

vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ fireguard: { site: { listWithLocations: { invalidate: mocks.invalidate } } } }), fireguard: { site: { listWithLocations: { useQuery: () => ({ data: sites, isLoading: false }) }, get: { useQuery: () => ({ data: mocks.siteDetail, isLoading: false }) }, setLocationFromGPS: { useMutation: () => mocks.gps }, setLocationManual: { useMutation: () => mocks.manual }, geocodeAddress: { useMutation: (options: { onError?: (issue: { message: string }) => void }) => { mocks.geocodeOptions = options; return mocks.geocode; } } } } } }));
vi.mock("@/hooks/useFireguardData", () => ({ useFireguardPermissions: () => ({ data: { role: "admin", canPerformFieldWork: true, canManageOperations: true } }), formatOperationalDate: (value?: Date | null) => value ? "24 Aug 2026" : "Not scheduled" }));
vi.mock("@/components/Map", () => ({ MapView: ({ onMapError }: { onMapError?: () => void }) => <button type="button" onClick={onMapError}>Simulate map provider error</button> }));
vi.mock("@/components/FireGuardUI", () => ({ ActionButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button type="button" onClick={onClick}>{children}</button>, PageHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>, StatusBadge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>, ExtinguisherLoader: () => <div>Loading</div>, useLoadSuccessCue: () => "idle", LoadSuccessCue: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));

import ClientMap from "./ClientMap";

afterEach(cleanup);
beforeEach(() => { mocks.gps.mutate.mockClear(); mocks.manual.mutate.mockClear(); mocks.geocode.mutate.mockClear(); mocks.geocodeOptions = null; mocks.invalidate.mockClear(); Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: -1.9441, longitude: 30.0619, accuracy: 12 } } as GeolocationPosition) } }); });

function renderMap() { const location = memoryLocation({ path: "/clients/map", record: true }); render(<Router hook={location.hook}><ClientMap /></Router>); return location; }

describe("ClientMap", () => {
  it("keeps site focus usable through the provider fallback and confirms a GPS capture before saving", async () => {
    const user = userEvent.setup(); renderMap();
    await user.click(screen.getByRole("button", { name: "Simulate map provider error" }));
    await user.click(screen.getByRole("button", { name: /Riverside House · East Wing/i }));
    expect(screen.getByText("-1.94410, 30.06190")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Use my current location" }));
    expect(screen.getByRole("dialog", { name: "Confirm GPS location" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirm and save" }));
    expect(mocks.gps.mutate).toHaveBeenCalledWith({ siteId: 17, latitude: -1.9441, longitude: 30.0619, accuracyMeters: 12 });
  });

  it("exposes manager correction and address-geocoding actions for the selected site", async () => {
    const user = userEvent.setup(); renderMap();
    await user.click(screen.getByRole("button", { name: "Simulate map provider error" }));
    await user.click(screen.getByRole("button", { name: /Riverside House · East Wing/i }));
    await user.type(screen.getByPlaceholderText("Latitude"), "-1.9500"); await user.type(screen.getByPlaceholderText("Longitude"), "30.0700");
    await user.click(screen.getByRole("button", { name: "Save manual pin" }));
    expect(mocks.manual.mutate).toHaveBeenCalledWith({ siteId: 17, latitude: -1.95, longitude: 30.07 });
    await user.click(screen.getByRole("button", { name: "Geocode address" }));
    expect(mocks.geocode.mutate).toHaveBeenCalledWith({ siteId: 17 });
    mocks.geocodeOptions?.onError?.({ message: "No map pin could be found for this site address." });
    const { toast } = await import("sonner");
    expect(toast.error).toHaveBeenCalledWith("No map pin could be found for this site address.");
  });

  it("shows clearly labelled illustrative evidence and a detailed work-order timeline for the selected demo site", async () => {
    const user = userEvent.setup(); renderMap();
    await user.click(screen.getByRole("button", { name: "Simulate map provider error" }));
    await user.click(screen.getByRole("button", { name: /Riverside House · East Wing/i }));
    expect(screen.getByText("Demo examples")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Illustrative fire equipment station" })).toBeTruthy();
    expect(screen.getByText("Illustrative evidence · Demo only")).toBeTruthy();
    expect(screen.getByText("Scope confirmed")).toBeTruthy();
    expect(screen.getByText("Exception routed for action")).toBeTruthy();
  });
});
