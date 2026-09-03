// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExtinguisherLoader, LoadSuccessCue, useLoadSuccessCue } from "./FireGuardUI";

afterEach(cleanup);

describe("ExtinguisherLoader", () => {
  it("announces the in-progress state while keeping the gas burst decorative", () => {
    render(<ExtinguisherLoader label="Loading the exception queue" detail="Checking operational records" />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Loading the exception queue")).toBeTruthy();
    expect(screen.getByText("Checking operational records")).toBeTruthy();
  });
});

function CompletionHarness({ loading }: { loading: boolean }) {
  const phase = useLoadSuccessCue(loading);
  return <LoadSuccessCue phase={phase} label="Operations ready" detail="Live records are available" />;
}

describe("LoadSuccessCue", () => {
  it("plays once after a load completes, then exits without retaining a blocking surface", () => {
    vi.useFakeTimers();
    const view = render(<CompletionHarness loading />);
    expect(screen.queryByRole("status")).toBeNull();
    view.rerender(<CompletionHarness loading={false} />);
    expect(screen.getByRole("status").textContent).toContain("Operations ready");
    act(() => { vi.advanceTimersByTime(1200); });
    expect(screen.getByRole("status").className).toContain("is-leaving");
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.queryByRole("status")).toBeNull();
    vi.useRealTimers();
  });
});
