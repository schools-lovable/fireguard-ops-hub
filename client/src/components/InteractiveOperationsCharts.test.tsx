// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InteractiveBarChart, InteractiveLineChart, InteractiveMeter } from "./InteractiveOperationsCharts";

afterEach(cleanup);

const data = [{ id: "mon", label: "Mon", value: 24, detail: "In progress" }, { id: "tue", label: "Tue", value: 72, detail: "Complete" }];

describe("InteractiveOperationsCharts", () => {
  it("updates the live line-chart inspection value through hover and keyboard focus", () => {
    const { container } = render(<InteractiveLineChart ariaLabel="Evidence progress" data={data} valueSuffix="%" />);
    const tuesday = screen.getByRole("button", { name: "Tue: 72%, Complete" });
    fireEvent.mouseEnter(tuesday);
    expect(screen.getByRole("status").textContent).toContain("Tue72% · Complete");
    expect(screen.getByRole("status").querySelector(".fg-chart-tooltip-label")?.textContent).toBe("Tue");
    expect(screen.getByTitle("Tue").className).toContain("is-active");
    fireEvent.focus(screen.getByRole("button", { name: "Mon: 24%, In progress" }));
    expect(screen.getByRole("status").textContent).toContain("Mon24% · In progress");
    expect(container.querySelector(".fg-chart-grid")).toBeTruthy();
    expect(container.querySelector(".fg-chart-area")).toBeTruthy();
    expect(container.querySelector(".fg-chart-active-guide")).toBeTruthy();
  });

  it("exposes real bar and meter values through keyboard-focusable controls", () => {
    render(<><InteractiveBarChart ariaLabel="Work status" data={data} /><InteractiveMeter label="Ready" value={3} total={4} /></>);
    fireEvent.focus(screen.getByRole("button", { name: "Tue: 72, Complete" }));
    expect(screen.getByRole("status").textContent).toContain("Tue72 · Complete");
    const meter = screen.getByRole("button", { name: "Ready: 3 of 4 sites, 75%" });
    fireEvent.focus(meter);
    expect(screen.getAllByRole("status").at(-1)?.textContent).toContain("3 of 4 sites · 75%");
    expect(screen.getByText("72").className).toContain("fg-chart-value");
  });

  it("applies distinct operational tones to completed, review, and blocked bars", () => {
    const { container } = render(<InteractiveBarChart ariaLabel="Work status" data={[{ id: "complete", label: "Complete", value: 4, detail: "Closed" }, { id: "awaiting_review", label: "Review", value: 2, detail: "Awaiting sign-off" }, { id: "blocked", label: "Blocked", value: 1, detail: "Needs action" }]} />);
    const bars = container.querySelectorAll(".fg-bar-plot button");
    expect(bars[0].classList.contains("is-good")).toBe(true);
    expect(bars[1].classList.contains("is-review")).toBe(true);
    expect(bars[2].classList.contains("is-risk")).toBe(true);
  });
});
