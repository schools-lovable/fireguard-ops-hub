import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("FireGuardShell root structure", () => {
  it("combines the visual frame and full-height grid into one layout element", () => {
    const source = readFileSync("client/src/components/FireGuardShell.tsx", "utf8");
    expect(source).toContain('return <div className={`fg-shell ${profileDashboard?.preferences.compactDensity ? "is-compact-density" : ""}`}><div className="fg-frame fg-layout">');
    expect(source).not.toContain('className="fg-frame"><div className="fg-layout"');
  });

  it("keeps role-aware navigation labels for the expanded desktop rail and a separate support utility", () => {
    const source = readFileSync("client/src/components/FireGuardShell.tsx", "utf8");
    expect(source).toContain("const primaryNavigation = visibleNavigation.filter(tab => tab.id !== \"support\")");
    expect(source).toContain('className="rail-link-label"');
    expect(source).toContain('className={`rail-link rail-link-support ${active ? "is-active" : ""}`}');
  });
});
