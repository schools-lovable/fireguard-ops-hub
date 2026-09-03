// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useFireguardData", () => ({ formatOperationalDate: () => "24 Aug 2026" }));

import { SiteDrilldown } from "./SiteDrilldown";

afterEach(cleanup);

const demoDetail = { isIllustrative: true, evidence: [{ id: "station", imageUrl: "/manus-storage/station.svg", alt: "Illustrative equipment station", title: "Equipment station check", caption: "Demo-only walk-through evidence.", capturedLabel: "Illustrative evidence · Demo only" }], workOrders: [{ id: 11, title: "Alarm system review", workType: "Alarm system", status: "blocked" as const, evidenceProgress: 42, scheduledFor: new Date("2026-08-24"), dueAt: null, illustrativeHistory: [{ id: "scope", kind: "planned" as const, occurredAt: new Date("2026-08-24"), title: "Scope confirmed", detail: "Illustrative scope entry." }, { id: "exception", kind: "exception" as const, occurredAt: new Date("2026-08-24"), title: "Exception routed for action", detail: "Illustrative exception entry." }] }] };

describe("SiteDrilldown", () => {
  it("renders labelled placeholder evidence and detailed demo work-order activity", () => {
    render(<SiteDrilldown detail={demoDetail} isLoading={false} />);
    expect(screen.getByRole("img", { name: "Illustrative equipment station" })).toBeTruthy();
    expect(screen.getByText("Illustrative evidence · Demo only")).toBeTruthy();
    expect(screen.getByText("Scope confirmed")).toBeTruthy();
    expect(screen.getByText("Exception routed for action")).toBeTruthy();
  });

  it("does not display fabricated evidence for a non-demo site", () => {
    render(<SiteDrilldown detail={{ isIllustrative: false, evidence: [], workOrders: [] }} isLoading={false} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText(/No captured evidence or work-order history/i)).toBeTruthy();
  });

  it("announces a compact loading state before evidence and history are available", () => {
    render(<SiteDrilldown isLoading={true} />);
    expect(screen.getByLabelText("Loading site drill-down").getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByText("Evidence & service history")).toBeNull();
  });

  it("keeps the selected-site evidence and history content rendered at desktop and mobile breakpoints", () => {
    for (const width of [1280, 375]) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      window.dispatchEvent(new Event("resize"));
      const { container, unmount } = render(<SiteDrilldown detail={demoDetail} isLoading={false} />);
      expect(container.querySelector(".site-evidence-grid")).toBeTruthy();
      expect(container.querySelectorAll(".site-evidence-card")).toHaveLength(1);
      expect(container.querySelector(".site-work-history")).toBeTruthy();
      expect(container.querySelectorAll(".site-work-order li")).toHaveLength(2);
      unmount();
    }
  });
});
