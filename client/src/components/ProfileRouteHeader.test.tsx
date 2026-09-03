import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileRouteHeader } from "./ProfileRouteHeader";

describe("ProfileRouteHeader", () => {
  it("renders route-specific preference and access headers for delegated Settings routes", () => {
    const preferences = renderToStaticMarkup(<ProfileRouteHeader path="/settings" />);
    const access = renderToStaticMarkup(<ProfileRouteHeader path="/settings/access" />);
    expect(preferences).toContain("Personal preferences");
    expect(preferences).toContain("Choose how FireGuard delivers assignment, exception, and Academy prompts during your operational day.");
    expect(access).toContain("Access controls");
    expect(access).toContain("Review your role, access-PIN status, and permission history without exposing protected credentials.");
  });
});
