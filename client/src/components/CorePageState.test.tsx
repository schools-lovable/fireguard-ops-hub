import React, { type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CorePageState } from "./FireGuardUI";

describe("CorePageState", () => {
  it("renders accessible loading, empty, error, and success states with recoverable actions", () => {
    const retry = vi.fn();
    const loading = renderToStaticMarkup(<CorePageState state="loading" title="Loading work orders" description="Checking the service queue." />);
    const empty = renderToStaticMarkup(<CorePageState state="empty" title="No work orders yet" description="Create a record when work is ready to schedule." />);
    const error = renderToStaticMarkup(<CorePageState state="error" title="Work orders unavailable" description="Try again to recover the queue." actionLabel="Retry" onAction={retry} />);
    const success = renderToStaticMarkup(<CorePageState state="success" title="Service schedule ready" description="The latest work order records are live." />);

    expect(loading).toContain('role="status"');
    expect(loading).toContain("Loading work orders");
    expect(empty).toContain("No work orders yet");
    expect(error).toContain('role="alert"');
    expect(error).toContain("Retry");
    expect(success).toContain("Service schedule ready");
  });

  it("calls only the supplied recovery callback when the error retry control is activated", () => {
    const retry = vi.fn();
    const state = CorePageState({ state: "error", title: "Records unavailable", description: "Try again safely.", onAction: retry }) as ReactElement;
    const content = (state.props as { children: React.ReactNode[] }).children[1] as ReactElement;
    const action = ((content.props as { children: React.ReactNode[] }).children[2] as ReactElement).props as { onClick: () => void };
    action.onClick();
    expect(retry).toHaveBeenCalledOnce();
  });
});
