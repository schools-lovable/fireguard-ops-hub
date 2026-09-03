import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DemoEnvironmentBanner } from "./DemoEnvironmentBanner";

describe("DemoEnvironmentBanner", () => {
  it("renders a read-only demonstration indicator only when sample records are present", () => {
    const demoMarkup = renderToStaticMarkup(<DemoEnvironmentBanner isDemo />);
    expect(demoMarkup).toContain("Demonstration workspace");
    expect(demoMarkup).toContain("Sample records are visible");
    expect(demoMarkup).toContain('role="status"');
    expect(renderToStaticMarkup(<DemoEnvironmentBanner isDemo={false} />)).toBe("");
  });

  it("adds an accessible dismissal control when the shell provides a dismiss action", () => {
    const demoMarkup = renderToStaticMarkup(<DemoEnvironmentBanner isDemo onDismiss={() => undefined} />);
    expect(demoMarkup).toContain('aria-label="Dismiss demonstration workspace notice"');
    expect(demoMarkup).toContain("fg-environment-banner-dismiss");
  });
});
